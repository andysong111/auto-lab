/* LoopJolt Platform Runtime v1. No DOM, rules, credentials, storage or rendering.
 * An adapter owns transport/auth. A game owns inputs, timing and every UI decision.
 * Generation numbers isolate old network responses from a newly started attempt.
 */
(function(root){
'use strict';
const RETRY_NAMES=new Set(['AbortError','TimeoutError','TypeError']);
const RETRY_CODES=new Set(['network_error','request_failed','backend_unavailable']);
const retryable=e=>RETRY_NAMES.has(e?.name)||RETRY_CODES.has(e?.message);
const validSeed=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function create({game,version,adapter,capture=false,maxTicks=5400,maxInputs=2500,fallbackSeed=125904}){
 if(!game||!version||!adapter||!validSeed(fallbackSeed))throw Error('invalid_runtime_config');
 let generation=0,seed=fallbackSeed,eligible=false,mode='idle',run=null,owner='';
 let startFlight=null,saveFlight=null,saveData=null,lastSave=null,saveState='idle';
 function getPlayer(){
  const p=adapter.getPlayer();
  // Only public profile fields leave this boundary; tokens never enter Runtime.
  return p?Object.freeze({handle:p.handle,country:p.country,countryChangedAt:p.countryChangedAt}):null;
 }
 function playerKey(){const p=getPlayer();return p?String(p.handle).toLowerCase()+'|'+(p.country||''):'';}
 function invalidate(nextMode='practice'){
  generation++;mode=nextMode;run=null;owner='';startFlight=null;saveFlight=null;
  saveData=null;lastSave=null;saveState='idle';
 }
 function outcome(id,status,extra={}){return Object.freeze({generation:id,status,...extra});}
 function stale(id){return outcome(id,'stale');}
 function isCurrent(result){return !!result&&result.generation===generation&&result.status!=='stale';}
 async function boot(){
  try{
   const config=await adapter.config();if(validSeed(config.seed))seed=config.seed;
   eligible=!!config.loginReady&&!!config.rankedGames?.some(g=>g.game===game&&g.version===version);
   if(adapter.authenticated())try{await adapter.loadPlayer();}catch{} // Guest practice is always independent.
   return Object.freeze({seed,eligible,player:getPlayer()});
  }catch(e){eligible=false;throw e;}
 }
 function startPractice(){invalidate();return Object.freeze({seed,ranked:false,generation});}
 function startRanked(){
  if(startFlight)return startFlight;
  if(capture)return Promise.reject(Error('capture_mode'));
  if(!eligible)return Promise.reject(Error('game_validator_unavailable'));
  if(!getPlayer())return Promise.reject(Error('authentication_required'));
  if(mode==='ranked')return Promise.reject(Error('run_in_progress'));
  invalidate('preparing');const id=generation,account=playerKey();
  const flight=(async()=>{
   try{
    const r=await Promise.resolve().then(()=>adapter.start({game,version}));
    if(id!==generation)throw Error('stale_operation');
    if(account!==playerKey())throw Error('invalid_or_expired_login');
    if(r?.version!==version||(r.game&&r.game!==game))throw Error('version_mismatch');
    const n=Number(r.seed);
    if(!UUID.test(r.runId)||!validSeed(n))throw Error('invalid_run');
    run=Object.freeze({runId:r.runId,game,version,seed:n});owner=account;mode='ranked';
    return Object.freeze({...run,ranked:true,generation:id});
   }catch(e){if(id===generation){mode='idle';run=null;owner='';}throw e;}
   finally{if(id===generation)startFlight=null;}
  })();
  startFlight=flight;return flight;
 }
 function downgrade(){invalidate('practice');}
 function snapshotPayload(actions,ticks){
  if(!Number.isInteger(ticks)||ticks<1||ticks>maxTicks)throw Error('invalid_duration');
  if(!Array.isArray(actions)||actions.length>maxInputs)throw Error('invalid_inputs');
  let last=-1;
  const copy=actions.map(a=>{
   if(!Array.isArray(a)||a.length<2||a.length>5||!Number.isInteger(a[0])||a[0]<=last||a[0]>=ticks||a[0]<0
      ||a.some(v=>typeof v!=='string'&&!(typeof v==='number'&&Number.isFinite(v)))
      ||a.some(v=>typeof v==='string'&&v.length>32))throw Error('invalid_inputs');
   last=a[0];return Object.freeze(a.slice());
  });
  // Do not accept a score/country/game from the browser for the finish request.
  return Object.freeze({runId:run.runId,actions:Object.freeze(copy),ticks});
 }
 function sendSaved(){
  if(saveFlight)return saveFlight;
  if(!saveData)return Promise.resolve(outcome(generation,'failed',{error:Error('run_not_ready'),retryable:false}));
  const id=generation,payload=saveData;
  saveState='saving';
  const flight=(async()=>{
   try{
    if(owner!==playerKey())throw Error('invalid_or_expired_login');
    const r=await Promise.resolve().then(()=>adapter.finish(payload));
    if(id!==generation)return stale(id);
    if(owner!==playerKey()){invalidate('idle');return stale(id);}
    if(r?.saved!==true||!Number.isSafeInteger(r.score)||r.score<0||r.score>50000)throw Error('not_saved');
    saveData=null;saveState='verified';
    lastSave=outcome(id,'verified',{score:r.score,duplicate:r.duplicate===true});return lastSave;
   }catch(error){
    if(id!==generation)return stale(id);
    saveState='failed';lastSave=outcome(id,'failed',{error,retryable:retryable(error)});
    if(!lastSave.retryable)saveData=null;return lastSave;
   }finally{if(id===generation)saveFlight=null;}
  })();
  saveFlight=flight;return flight;
 }
 function submitRun({actions,ticks}={}){
  if(saveFlight)return saveFlight;
  if(lastSave)return Promise.resolve(lastSave); // New arguments must not overwrite a retry snapshot.
  if(capture||mode!=='ranked'||!run)return Promise.resolve(outcome(generation,'practice'));
  try{saveData=snapshotPayload(actions,ticks);}catch(error){
   mode='finished';saveState='failed';lastSave=outcome(generation,'failed',{error,retryable:false});return Promise.resolve(lastSave);
  }
  mode='finished';run=null;return sendSaved();
 }
 function retrySave(){
  if(saveFlight)return saveFlight;
  if(!lastSave?.retryable||!saveData)return Promise.resolve(lastSave||outcome(generation,'failed',{error:Error('retry_unavailable'),retryable:false}));
  return sendSaved();
 }
 async function readBoard(scope='world',period='week',country=''){
  if(!['world','nations','country'].includes(scope)||!['week','all'].includes(period))throw Error('invalid_board');
  const query={game,scope,period};if(scope==='country')query.country=country;
  const b=await adapter.readBoard(query);
  if(!b||!Array.isArray(b.rows))throw Error('board_unavailable');
  if(b.version&&b.version!==version)throw Error('old_board');
  return b;
 }
 function logout(){invalidate('idle');adapter.logout();}
 return Object.freeze({boot,getPlayer,startPractice,startRanked,downgrade,submitRun,retrySave,readBoard,isCurrent,logout,
  googleButton:(...args)=>adapter.googleButton(...args),
  renderFlagLabel:(...args)=>adapter.renderFlagLabel(...args),countryName:c=>adapter.countryName(c),
  get eligible(){return eligible;},get saving(){return saveState==='saving';},
  get canRetry(){return !!saveData&&saveState==='failed'&&lastSave?.retryable===true;}
 });
}
const api=Object.freeze({create});root.LoopJoltRuntime=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
