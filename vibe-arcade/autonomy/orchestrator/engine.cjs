'use strict';
const fs=require('node:fs'),path=require('node:path');
const {create,transition}=require('./manifest.cjs');
const {safePath,atomicJSON,readJSON,copyGame,inspectGame,hashTree,hash,listFiles}=require('./files.cjs');
const {requestFor}=require('./repair.cjs'),{evaluate}=require('./quality.cjs');
const {runQA}=require('../qa/runner.cjs');
const policy=require('../policies/quality-gate.json');
class Factory {
  constructor({store,builder,repairer,qa=runQA,release=null,policy:configuredPolicy=policy,beforeStep=null}) {
    this.store=store;this.builder=builder;this.repairer=repairer;this.qa=qa;this.release=release;this.policy=configuredPolicy;this.beforeStep=beforeStep;
  }
  async create(spec) {
    const initial=create(spec);
    return this.store.withLock(initial.game_id,async()=>{
      const file=this.store.file(initial.game_id),specFile=path.join(path.dirname(file),'spec.json');
      if(fs.existsSync(file)) {
        if(hash(readJSON(specFile))!==hash(spec)) throw Error('job_exists_with_different_spec');
        return this.store.get(initial.game_id);
      }
      atomicJSON(specFile,spec);this.store.put(initial);
      return this.store.put(transition(initial,'SPEC_READY'));
    });
  }
  move(m,next,patch={},details={}) { return this.store.put(transition({...m,...patch},next,details)); }
  source(m) { return safePath(this.store.root,m.source_path); }
  artifact(m,name) { return this.store.artifact(m.game_id,m.version+'/'+name); }
  spec(m) { return readJSON(path.join(path.dirname(this.store.file(m.game_id)),'spec.json')); }
  repairHistory(m) { const file=this.store.artifact(m.game_id,'repair-history.json');return fs.existsSync(file)?readJSON(file):[]; }
  history(m,entry) {
    const rows=this.repairHistory(m),i=rows.findIndex(r=>r.attempt===entry.attempt);
    if(i>=0)rows[i]={...rows[i],...entry};else rows.push(entry);
    atomicJSON(this.store.artifact(m.game_id,'repair-history.json'),rows);
  }
  async build(m,repairRequest=null) {
    const operationId=repairRequest?.operation_id||`${m.game_id}/build/v1`;
    const work=safePath(this.store.root,`autonomy/.work/${m.game_id}/${m.version}`);
    const buildFile=this.artifact(m,'build.json');
    if(fs.existsSync(buildFile)&&fs.existsSync(this.source(m))) {
      const done=readJSON(buildFile);if(done.operation_id===operationId&&done.source_hash===hashTree(this.source(m)))return done;
    }
    fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});
    let before={};
    if(repairRequest) {
      const old=safePath(this.store.root,`autonomy/games/${m.game_id}/${repairRequest.version}`);
      if(fs.existsSync(old)) { copyGame(old,work);before=Object.fromEntries(listFiles(old).map(f=>[f,hash(fs.readFileSync(path.join(old,f)).toString('base64'))])); }
    }
    let outcome;
    try {
      const adapter=repairRequest?this.repairer:this.builder;
      if(!adapter)throw Error('adapter_not_configured');
      const context={workspace:work,manifest:m,spec:this.spec(m),request:repairRequest,operationId};
      outcome=await (repairRequest?adapter.repair(context):adapter.build(context));
      inspectGame(work);
      // These two files are always factory-owned, regardless of the adapter response.
      fs.copyFileSync(path.join(__dirname,'../gamekit/gamekit.js'),path.join(work,'gamekit.js'));
      const descriptor={...m,history:[],failure_reasons:[]};
      for(const key of ['source_hash','policy_hash','branch','pr_number','pr_url','rc_commit','deployment_id'])delete descriptor[key];
      atomicJSON(path.join(work,'manifest.json'),descriptor);
      const changes=listFiles(work).filter(f=>before[f]!==hash(fs.readFileSync(path.join(work,f)).toString('base64')));
      if(fs.existsSync(this.source(m))) fs.rmSync(this.source(m),{recursive:true,force:true});
      fs.mkdirSync(path.dirname(this.source(m)),{recursive:true});fs.renameSync(work,this.source(m));
      const evidence={operation_id:operationId,source_hash:hashTree(this.source(m)),changed_files:changes,cause:outcome?.cause||'Adapter completed',adapter_tests:outcome?.tests||[],...(outcome?.provider_metadata?{provider_metadata:outcome.provider_metadata}:{})};
      atomicJSON(buildFile,evidence);return evidence;
    } finally { fs.rmSync(work,{recursive:true,force:true}); }
  }
  async run(id,{stopAfterQA=false,rc=false}={}) {
    return this.store.withLock(id,async()=>{
      let m=this.store.get(id);
      for(let step=0;step<80;step++) {
        if(['ARCHIVED','REJECTED'].includes(m.state))return m;
        if(this.beforeStep)await this.beforeStep(m);
        // A changed source/policy invalidates all downstream evidence, including READY.
        if(['QUALITY_GATE','RC_READY','PREVIEW_DEPLOYING','PREVIEW_SMOKE','READY_TO_SHIP'].includes(m.state)) {
          if(!fs.existsSync(this.source(m))||m.source_hash!==hashTree(this.source(m))) {
            m=this.move(m,'REJECTED',{release_status:'REJECTED',quality_status:'REJECT',failure_reasons:[{code:'source_tampered',message:'Immutable built source changed; create a new job/version'}]});return m;
          }
          if(m.policy_hash&&m.policy_hash!==hash(this.policy)&&m.state!=='QUALITY_GATE') m=this.move(m,'QA_RUNNING',{qa_status:'RUNNING',quality_status:'PENDING',release_status:'NONE'});
        }
        switch(m.state) {
          case 'IDEA': m=this.move(m,'SPEC_READY');break;
          case 'SPEC_READY': m=this.move(m,'BUILDING');break;
          case 'BUILDING': {
            if(!this.builder)throw Error('builder_adapter_not_configured');
            try { const build=await this.build(m);m=this.move(m,'QA_RUNNING',{source_hash:build.source_hash,qa_status:'RUNNING'}); }
            catch(e) { if(e.factory_pause)throw e; m=this.move(m,'BUILD_FAILED',{failure_reasons:[{code:this.policy.fatal_codes.includes(e.code)?e.code:e.message.startsWith('path_isolation')?'path_isolation':'build_failed',message:e.message}]}); }
            break;
          }
          case 'QA_RUNNING': {
            const file=this.artifact(m,'qa.json');let result;
            if(fs.existsSync(file)) { const prior=readJSON(file);if(prior.source_hash===m.source_hash&&prior.policy_hash===hash(this.policy)&&prior.version===m.version&&prior.game_id===id)result=prior; }
            if(!result)result=await this.qa({manifest:m,gameRoot:this.source(m),outDir:path.dirname(file),policy:this.policy});
            atomicJSON(file,result);
            m=this.move(m,result.passed?'QUALITY_GATE':'QA_FAILED',{qa_status:result.passed?'PASS':'FAIL',policy_hash:hash(this.policy),failure_reasons:result.hard_failures});
            if(m.repair_attempt)this.history(m,{attempt:m.repair_attempt,version:m.version,tests:['browser QA (390x844,768x1024,1280x800)'],result:result.passed?'PASS':'FAIL',qa_artifact:`${m.version}/qa.json`});
            if(stopAfterQA)return m;
            break;
          }
          case 'QUALITY_GATE': {
            const gate=evaluate(m,readJSON(this.artifact(m,'qa.json')),this.policy);atomicJSON(this.artifact(m,'quality.json'),gate);
            m=this.move(m,gate.decision==='PASS'?'RC_READY':gate.decision==='REJECT'?'REJECTED':'QUALITY_FAILED',{
              quality_status:gate.decision,failure_reasons:gate.hard_failures,release_status:gate.decision==='PASS'?'RC':gate.decision==='REJECT'?'REJECTED':'NONE'});break;
          }
          case 'BUILD_FAILED': case 'QA_FAILED': case 'QUALITY_FAILED': {
            if(m.failure_reasons.some(f=>this.policy.fatal_codes.includes(f.code))||m.repair_attempt>=m.max_repair_attempts) {
              m=this.move(m,'REJECTED',{quality_status:'REJECT',release_status:'REJECTED'});return m;
            }
            const request=requestFor(m,{hard_failures:m.failure_reasons});
            atomicJSON(this.store.artifact(id,`repair-${request.attempt}.json`),request);
            m=this.move(m,'REPAIR_PENDING');break;
          }
          case 'REPAIR_PENDING': {
            const request=readJSON(this.store.artifact(id,`repair-${m.repair_attempt+1}.json`));
            if(!this.repairer||this.repairer.available?.(request)===false)throw Error('repair_workspace_unavailable: provide the next reviewed revision or RepairAdapter, then rerun');
            this.history(m,{attempt:request.attempt,version:request.target_version,cause:request.qa_failures,changed_files:[],tests:[],result:'RUNNING'});
            m=this.move(m,'REPAIRING',{repair_attempt:request.attempt,version:request.target_version,source_path:`autonomy/games/${id}/${request.target_version}`,qa_status:'PENDING',quality_status:'PENDING',release_status:'NONE',preview_url:null});break;
          }
          case 'REPAIRING': {
            const request=readJSON(this.store.artifact(id,`repair-${m.repair_attempt}.json`));
            try {
              const build=await this.build(m,request);
              this.history(m,{attempt:m.repair_attempt,changed_files:build.changed_files,adapter_cause:build.cause,tests:build.adapter_tests,result:'QA_PENDING'});
              m=this.move(m,'QA_RUNNING',{source_hash:build.source_hash,qa_status:'RUNNING'});
            } catch(e) {
              if(e.factory_pause)throw e;
              this.history(m,{attempt:m.repair_attempt,result:'BUILD_FAILED',error:e.message});
              m=this.move(m,'BUILD_FAILED',{failure_reasons:[{code:this.policy.fatal_codes.includes(e.code)?e.code:e.message.startsWith('path_isolation')?'path_isolation':'build_failed',message:e.message}]});
            }
            break;
          }
          case 'RC_READY':
            if(!rc)return m;
            if(!this.release)throw Error('release_adapter_not_configured');
            m=this.move(m,'PREVIEW_DEPLOYING');break;
          case 'PREVIEW_DEPLOYING': {
            if(!rc)return m;
            const result=await this.release.prepare({manifest:m,gameRoot:this.source(m),store:this.store});
            if(!result.preview_url) {m=this.store.put({...m,...result});return m;}
            m=this.move(m,'PREVIEW_SMOKE',{...result,release_status:'PREVIEW'});break;
          }
          case 'PREVIEW_SMOKE': {
            if(!rc)return m;
            const result=await this.release.smoke({manifest:m,gameRoot:this.source(m)});atomicJSON(this.artifact(m,'preview-smoke.json'),result);
            if(!result.passed)return m; // Infrastructure retry never consumes a game repair attempt.
            m=this.move(m,'READY_TO_SHIP',{release_status:'READY'});return m;
          }
          case 'READY_TO_SHIP':return m;
          default:throw Error('unhandled_state:'+m.state);
        }
      }
      throw Error('orchestrator_step_budget_exhausted');
    });
  }
}
module.exports={Factory};
