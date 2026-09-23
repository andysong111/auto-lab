'use strict';
const fs=require('node:fs'),path=require('node:path');
const {FileStore}=require('../orchestrator/store.cjs'),{Factory}=require('../orchestrator/engine.cjs');
const {atomicJSON,readJSON,safePath}=require('../orchestrator/files.cjs');
const {loadPolicy,listJobs,decision}=require('../control-plane/control.cjs');
const {config,pricing}=require('../providers/config.cjs');
const {ProviderPause}=require('../providers/errors.cjs');
const {ProcessLock}=require('./lock.cjs');
const {ProviderManager}=require('../providers/manager.cjs');
const {OpenAIProvider}=require('../providers/openai.cjs');
const {AIBuilderAdapter,AIRepairAdapter}=require('../adapters/ai.cjs');
const {DockerQA}=require('../isolation/docker-qa.cjs');
const {GitHubVercelAdapter}=require('../adapters/github-vercel.cjs');
const APP=path.resolve(__dirname,'../..'),DEFAULT_POLICY=path.resolve(__dirname,'../control-plane/policy.json');
const delay=(ms,signal)=>new Promise(resolve=>{if(signal?.aborted)return resolve();const timer=setTimeout(done,ms);function done(){clearTimeout(timer);signal?.removeEventListener('abort',done);resolve();}signal?.addEventListener('abort',done,{once:true});});
function policyAt(file) {
  const p=loadPolicy(file);
  if(typeof p.intake_enabled!=='boolean'||typeof p.auto_rc_enabled!=='boolean'||typeof p.kill_switches.factory!=='boolean'||typeof p.kill_switches.release_candidates!=='boolean'||p.kill_switches.marketing_promotion!==true||!Array.isArray(p.owner_alerts?.critical_codes))throw new ProviderPause('invalid_control_policy');
  return p;
}
function gate(p,{rc=false}={}) {
  if(p.kill_switches.factory)throw new ProviderPause('factory_kill_switch',undefined,'PAUSED_KILL_SWITCH');
  if(!p.intake_enabled)throw new ProviderPause('intake_disabled',undefined,'PAUSED_INTAKE');
  if(rc&&(!p.auto_rc_enabled||p.kill_switches.release_candidates))throw new ProviderPause('rc_disabled',undefined,'PAUSED_RC');
}
class AutonomousWorker {
  // Dependencies are injected by trusted tests, never loaded from model output or config scripts.
  constructor({root=APP,policyFile=DEFAULT_POLICY,settings={},provider=null,mock=false,qa=null,release=null,signal,now=Date.now}={}) {
    this.root=path.resolve(root);this.policyFile=path.resolve(policyFile);this.settings=settings;this.limits=config(settings);this.provider=provider;this.mock=mock;this.qa=qa;this.release=release;this.signal=signal;this.now=now;
    this.store=new FileStore(this.root);this.locks=new ProcessLock(safePath(this.root,'autonomy/.worker'));
  }
  validateCommissioning() {
    if(this.settings.commissioning!==true)throw new ProviderPause('commissioning_not_enabled');
    fs.mkdirSync(this.root,{recursive:true});
    const real=fs.realpathSync(this.root),repo=path.resolve(APP,'..');
    if(real===repo||real.startsWith(repo+path.sep)||repo.startsWith(real+path.sep))throw new ProviderPause('worker_root_not_isolated');
    if(this.policyFile===DEFAULT_POLICY||!fs.realpathSync(this.policyFile).startsWith(real+path.sep))throw new ProviderPause('commissioning_policy_required');
    // Root must be a dedicated state directory, never an existing app/checkout or its home.
    if(['.git','package.json','index.html','supabase'].some(n=>fs.existsSync(path.join(real,n))))throw new ProviderPause('worker_root_not_isolated');
  }
  record(status,{game=null,code=null,policy,extra={}}={}) {
    const result={schema:'playjolt-worker/1',status,code,game_id:game?.game_id||null,version:game?.version||null,factory_state:game?.state||null,
      recorded_at:new Date(this.now()).toISOString(),owner_action:!!policy?.owner_alerts?.critical_codes?.includes(code),auto_production_ship:false,...extra};
    const relative=game?`autonomy/artifacts/worker/jobs/${game.game_id}.json`:'autonomy/artifacts/worker/status.json';
    atomicJSON(safePath(this.root,relative),result);if(game)atomicJSON(safePath(this.root,'autonomy/artifacts/worker/status.json'),result);return result;
  }
  async runOnce() {
    let p;
    try{p=policyAt(this.policyFile);gate(p);}catch(e){return this.record(e.worker_status||'PAUSED_POLICY',{code:e.code||'invalid_control_policy',policy:p});}
    try{this.validateCommissioning();}catch(e){return this.record(e.worker_status||'PAUSED_CONFIG',{code:e.code||'invalid_worker_config',policy:p});}
    try{return await this.locks.withLock('GAME-00000000-000',async lockSignal=>{
      const signal=AbortSignal.any([this.signal,lockSignal].filter(Boolean));
      if(signal.aborted)return this.record('PAUSED_SHUTDOWN',{code:'worker_stopped',policy:p});
      p=policyAt(this.policyFile);gate(p);
      const jobs=listJobs(this.root).reverse();
      const job=jobs.find(j=>{
        const d=decision(j,p);if(['NONE','HOLD','HOLD_RC'].includes(d.action))return false;
        if(['PREVIEW_DEPLOYING','PREVIEW_SMOKE'].includes(j.state)&&(!p.auto_rc_enabled||p.kill_switches.release_candidates))return false;
        return true;
      });
      if(!job)return this.record('IDLE',{policy:p});
      const controller=new AbortController();let manager,monitor;
      const stop=()=>controller.abort(signal.reason||new ProviderPause('worker_stopped',undefined,'PAUSED_SHUTDOWN'));
      signal.addEventListener('abort',stop,{once:true});
      const guard=async({rc=false}={})=>{
        if(controller.signal.aborted)throw controller.signal.reason;
        p=policyAt(this.policyFile);gate(p,{rc});manager?.assertWall(job.game_id);
      };
      try {
        await guard();
        const provider=this.provider||new OpenAIProvider();provider.assertAvailable();
        const qa=this.qa||new DockerQA({limits:this.limits.isolation,signal:controller.signal});qa.assertAvailable();
        if(this.mock&&(!this.provider||!/^mock\//.test(provider.identity)))throw new ProviderPause('invalid_mock_provider');
        const prices=pricing(this.settings.pricing,{mock:this.mock,now:this.now()});
        if(!this.mock){try{require('../qa/product-contract.cjs').review(job.product_contract);}catch(e){throw new ProviderPause('product_contract_unreviewed',e.message,'PAUSED_SPEC');}}
        if(!this.mock){try{require('../qa/commercial/contract.cjs').review(job.commercial_contract,job.product_contract);}catch(e){throw new ProviderPause('commercial_contract_unreviewed',e.message,'PAUSED_SPEC');}}
        manager=new ProviderManager({root:this.root,provider,config:this.limits,prices,guard,signal:controller.signal,now:this.now});
        await guard();
        monitor=setInterval(()=>{guard().catch(e=>controller.abort(e.factory_pause?e:new ProviderPause('invalid_control_policy')));},250);
        const release=this.release||new GitHubVercelAdapter({baseRef:this.settings.base_ref||'main'});
        const guardedRelease={prepare:async c=>{await guard({rc:true});return release.prepare(c);},smoke:async c=>{await guard({rc:true});return release.smoke(c);}};
        const qualityPolicy=require('../policies/quality-gate.json');
        const factory=new Factory({store:this.store,policy:this.mock?{...qualityPolicy,product:{...qualityPolicy.product,allow_legacy_technical_fixtures:true}}:qualityPolicy,builder:new AIBuilderAdapter({root:this.root,manager}),repairer:new AIRepairAdapter({root:this.root,manager}),
          qa:c=>qa.run(c),release:guardedRelease,beforeStep:async m=>{await guard({rc:['PREVIEW_DEPLOYING','PREVIEW_SMOKE'].includes(m.state)});}});
        this.record('RUNNING',{game:job,policy:p});
        const rc=this.settings.release_candidates===true&&p.auto_rc_enabled&&!p.kill_switches.release_candidates;
        const final=await factory.run(job.game_id,{rc});
        return this.record(final.state==='REJECTED'?'REJECTED':final.state==='READY_TO_SHIP'?'READY_TO_SHIP':final.state==='RC_READY'?'RC_READY':'WAITING_RC',
          {game:final,policy:p,code:final.failure_reasons?.find(f=>p.owner_alerts.critical_codes.includes(f.code))?.code||null,
            extra:{budget:manager.totals(manager.read(),job.game_id),cost_basis:'estimated',provider:provider.identity}});
      }catch(e){
        // Provider/infrastructure interruptions retain the existing Factory checkpoint and repair budget.
        const current=this.store.get(job.game_id);
        return this.record(e.worker_status||'PAUSED_ERROR',{game:current,code:e.code||'worker_execution_error',policy:p});
      }finally{clearInterval(monitor);signal.removeEventListener('abort',stop);}
    });}catch(e){return this.record(e.message==='job_locked'?'PAUSED_CONCURRENCY':e.worker_status||'PAUSED_ERROR',{code:e.message==='job_locked'?'worker_already_running':e.code||'worker_execution_error',policy:p});}
  }
  async loop() {
    const results=[];let backoff=this.limits.polling.interval_ms,worked=0;
    for(let poll=0;poll<this.limits.polling.max_polls&&!this.signal?.aborted;poll++) {
      const result=await this.runOnce();results.push(result);
      if(['RC_READY','READY_TO_SHIP','REJECTED'].includes(result.status))worked++;
      if(worked>=this.limits.polling.max_jobs||['PAUSED_INTAKE','PAUSED_KILL_SWITCH','PAUSED_SHUTDOWN','PAUSED_BUDGET'].includes(result.status))break;
      if(poll+1<this.limits.polling.max_polls)await delay(backoff,this.signal);
      backoff=Math.min(backoff*2,this.limits.polling.max_backoff_ms);
    }
    return {polls:results.length,completed_jobs:worked,results};
  }
}
module.exports={AutonomousWorker,policyAt,gate,delay};
