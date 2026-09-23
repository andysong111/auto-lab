'use strict';
const fs=require('node:fs'),path=require('node:path');
const {ProcessLock}=require('../worker/lock.cjs');
const {safePath,atomicJSON,readJSON,hash}=require('../orchestrator/files.cjs');
const {validateOutput,quarantineOutput,responseSchema}=require('./output.cjs');
const {instructions}=require('./prompts.cjs');
const {ProviderPause,modelError}=require('./errors.cjs');
const {activeElapsed}=require('./active-wall-clock.cjs');
const LOCK='GAME-00000000-000';
const cost=(n,p)=>Math.ceil((n.input_tokens*p.input_per_million+n.output_tokens*p.output_per_million)/1e6*1e8)/1e8;
class ProviderManager {
  constructor({root,provider,config,prices,guard=()=>{},signal,now=Date.now}) {
    this.root=path.resolve(root);this.provider=provider;this.config=config;this.prices=prices;this.guard=guard;this.signal=signal;this.now=now;
    this.file=safePath(this.root,'autonomy/.provider/ledger.json');this.locks=new ProcessLock(safePath(this.root,'autonomy/.provider/ledger-lock'));
  }
  read() {
    if(!fs.existsSync(this.file))return {schema_version:1,cost_basis:'estimated; configured USD rates, no billing API',jobs:{},operations:{}};
    if(fs.statSync(this.file).size>16*1024*1024)throw new ProviderPause('ledger_capacity','archive reconciled jobs first','PAUSED_BUDGET');
    return readJSON(this.file);
  }
  save(d) { atomicJSON(this.file,d);const fd=fs.openSync(path.dirname(this.file),'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);} }
  assertWall(gameId) {
    const j=this.read().jobs[gameId];
    if(j&&activeElapsed(j,this.now())>=this.config.per_game.max_wall_clock_minutes*60000)throw new ProviderPause('game_wall_clock_limit',undefined,'PAUSED_BUDGET');
  }
  totals(d,gameId,day) {
    const total={calls:0,input:0,output:0,cost:0};
    for(const o of Object.values(d.operations))if((!gameId||o.game_id===gameId)&&(!day||o.day===day)) {
      const n=o.accounted||o.reserved;total.calls++;total.input+=n.input_tokens;total.output+=n.output_tokens;total.cost+=n.estimated_cost;
    }
    return total;
  }
  reserve(d,request,fingerprint) {
    const c=this.config,day=new Date(this.now()).toISOString().slice(0,10);
    // Deliberately conservative local estimate. No paid token-counting call or SDK tokenizer.
    const input=Buffer.byteLength(JSON.stringify({instructions,request,responseSchema}))+2048;
    if(input>c.request.max_input_tokens)throw new ProviderPause('request_input_token_limit',undefined,'PAUSED_BUDGET');
    const reserved={input_tokens:input,output_tokens:c.request.max_output_tokens};reserved.estimated_cost=cost(reserved,this.prices);
    const g=this.totals(d,request.game_id),daily=this.totals(d,null,day),p=c.per_game;
    if(g.calls+1>p.max_provider_calls||g.input+reserved.input_tokens>p.max_input_tokens||g.output+reserved.output_tokens>p.max_output_tokens||g.cost+reserved.estimated_cost>p.max_estimated_cost+1e-9||daily.calls+1>c.global.daily_provider_call_limit||daily.cost+reserved.estimated_cost>c.global.daily_cost_limit+1e-9)throw new ProviderPause('provider_budget_exhausted',undefined,'PAUSED_BUDGET');
    d.jobs[request.game_id]||={started_at:this.now()};this.assertWallFrom(d,request.game_id);
    const o={operation_id:request.operation_id,game_id:request.game_id,version:request.version,request_hash:fingerprint,day,state:'SUBMITTING',
      provider:this.provider.identity,started_at:this.now(),deadline_at:this.now()+c.request.timeout_ms,reserved,prices:this.prices,response_id:null};
    d.operations[request.operation_id]=o;this.save(d);return o;
  }
  assertWallFrom(d,id) {if(activeElapsed(d.jobs[id],this.now())>=this.config.per_game.max_wall_clock_minutes*60000)throw new ProviderPause('game_wall_clock_limit',undefined,'PAUSED_BUDGET');}
  rejectedContext(gameId,attempt) {
    const prior=attempt===1?`${gameId}/build/v1`:`${gameId}/repair/${attempt-1}`,o=this.read().operations[prior];
    if(!o||o.state!=='MODEL_FAILED')return null;
    return {operation_id:prior,error_code:o.error_code||null,error_detail:o.error_detail||null,error_context:o.error_context||null,rejected_output:o.rejected_output||null};
  }
  async execute(request) {
    if(!/^GAME-[0-9]{8}-[0-9]{3,6}\/(?:build|repair)\/(?:v[0-9]+|[0-9]+)$/.test(request.operation_id)||!request.operation_id.startsWith(request.game_id+'/'))throw new ProviderPause('invalid_operation_id');
    await this.guard();if(this.signal?.aborted)throw this.signal.reason;
    try {return await this.locks.withLock(LOCK,async lockSignal=>{
      const signal=AbortSignal.any([this.signal,lockSignal].filter(Boolean));if(signal.aborted)throw signal.reason;
      let d=this.read(),o=d.operations[request.operation_id];const fingerprint=hash({request,provider:this.provider.identity,instructions,responseSchema});
      if(o&&o.request_hash!==fingerprint)throw new ProviderPause('operation_id_conflict');
      if(o?.state==='COMPLETE')return o.result;
      if(o?.state==='LIMIT_BREACH')throw new ProviderPause(o.error_code,undefined,'PAUSED_BUDGET');
      if(o?.state==='MODEL_FAILED'){const e=modelError(o.error_code);if(o.error_detail)e.message=o.error_detail;if(o.error_context)e.detail=o.error_context;throw e;}
      if(o&&!o.response_id)throw new ProviderPause('provider_submission_uncertain','No second generation POST is allowed. Reconcile the operation with provider logs.');
      this.provider.assertAvailable();await this.guard();this.assertWall(request.game_id);
      const fresh=!o;if(fresh)o=this.reserve(d,request,fingerprint);
      const controller=new AbortController();
      const abort=()=>controller.abort(signal.reason||new ProviderPause('worker_stopped',undefined,'PAUSED_SHUTDOWN'));
      signal.addEventListener('abort',abort,{once:true});
      const remaining=fresh?Math.max(1,o.deadline_at-this.now()):Math.max(5000,o.deadline_at-this.now());
      const timer=setTimeout(()=>controller.abort(new ProviderPause('provider_timeout')),remaining);
      const onResponseId=id=>{o.response_id=id;o.state='POLLING';this.save(d);};
      try {
        // Persisted response IDs resume by retrieval, never by another generation POST.
        let rejectAbort;const aborted=new Promise((_,reject)=>{rejectAbort=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',rejectAbort,{once:true});});
        let response;
        try {response=await Promise.race([this.provider.generate({request,instructions,schema:responseSchema,max_output_tokens:this.config.request.max_output_tokens,
          max_response_bytes:this.config.request.max_response_bytes,response_id:o.response_id,onResponseId,signal:controller.signal}),aborted]);}
        finally {controller.signal.removeEventListener('abort',rejectAbort);}
        const usage=response.usage;
        if(usage&&['input_tokens','output_tokens'].every(k=>Number.isInteger(usage[k])&&usage[k]>=0)) {
          o.accounted={input_tokens:usage.input_tokens,output_tokens:usage.output_tokens,estimated_cost:cost(usage,o.prices)};
          if(usage.input_tokens>o.reserved.input_tokens||usage.output_tokens>o.reserved.output_tokens) {
            o.state='LIMIT_BREACH';o.error_code='provider_usage_exceeded_reservation';this.save(d);
            throw new ProviderPause(o.error_code,undefined,'PAUSED_BUDGET');
          }
        }
        let value;
        try { value=validateOutput(response.output,request,this.config.request); }
        catch(e) {
          if(e.model_failure) {
            o.rejected_output=quarantineOutput(response.output,this.config.request);
            o.error_detail=String(e.message||e.code||'model_failure').slice(0,2000);
            o.error_context=e.detail||null;
          }
          throw e;
        }
        const metadata={provider:this.provider.identity,response_id:o.response_id,usage:o.accounted||null,estimated_cost:(o.accounted||o.reserved).estimated_cost,cost_basis:'estimated',billed_cost:null};
        o.result={...value,provider_metadata:metadata};o.state='COMPLETE';o.completed_at=this.now();this.save(d);return o.result;
      } catch(e) {
        if(e.model_failure){o.state='MODEL_FAILED';o.error_code=e.code;this.save(d);throw e;}
        if(o.state!=='LIMIT_BREACH')o.state=o.response_id?'POLLING':'SUBMISSION_UNCERTAIN';
        o.error_code=e.code||'provider_network_error';this.save(d);
        if(controller.signal.aborted&&o.response_id&&this.provider.cancel)await this.provider.cancel(o.response_id).catch(()=>{});
        throw e.factory_pause?e:new ProviderPause('provider_network_error');
      } finally {clearTimeout(timer);signal.removeEventListener('abort',abort);}
    });}catch(e){if(e.message==='job_locked')throw new ProviderPause('provider_concurrency_limit',undefined,'PAUSED_CONCURRENCY');if(e.factory_pause||e.model_failure)throw e;throw new ProviderPause('provider_state_unavailable');}
  }
}
module.exports={ProviderManager,cost};
