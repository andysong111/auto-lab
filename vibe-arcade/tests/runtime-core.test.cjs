'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Runtime=require('../runtime/core.js'),Community=require('../runtime/community-adapter.js');
const ID='12345678-1234-4234-8234-123456789012',VERSION='gd-descent-v2';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
const micro=()=>new Promise(r=>setImmediate(r));
function setup(extra={}){
 let player={handle:'tester',country:'KR',token:'MUST_NOT_LEAK'},calls={start:[],finish:[],load:0,logout:0};
 const adapter={config:async()=>({seed:7,loginReady:true,rankedGames:[{game:'gyro-drop',version:VERSION}]}),
 authenticated:()=>!!player,getPlayer:()=>player,loadPlayer:async()=>{calls.load++;return player},logout:()=>{player=null;calls.logout++},
 start:async p=>{calls.start.push(p);return {runId:ID,game:'gyro-drop',version:VERSION,seed:7}},
 finish:async p=>{calls.finish.push(p);return {saved:true,score:392}},
 readBoard:async p=>({version:VERSION,rows:[],query:p}),googleButton:(...a)=>a,renderFlagLabel:(...a)=>a,countryName:c=>c};
 Object.assign(adapter,extra.adapter||{});
 const runtime=Runtime.create({game:'gyro-drop',version:VERSION,adapter,...extra.options});
 return {runtime,adapter,calls,setPlayer:p=>{player=p}};
}
const trace=()=>({actions:[[0,'steer',1],[12,'steer',0]],ticks:100});
async function ready(extra){const x=setup(extra);await x.runtime.boot();return x;}
test('boot returns public profile only; no credential or clientID is exposed',async()=>{
 const {runtime,calls}=await ready();const p=runtime.getPlayer();assert.equal(p.token,undefined);assert(Object.isFrozen(p));assert.equal(calls.load,1);assert(runtime.eligible);
});
test('guest practice works before or without any backend request',async()=>{
 const {runtime,calls,setPlayer}=setup();setPlayer(null);const p=runtime.startPractice();assert.equal(p.seed,125904);assert.equal(p.ranked,false);assert.equal((await runtime.submitRun(trace())).status,'practice');assert.equal(calls.start.length+calls.finish.length,0);
});
test('capture cannot start ranked or submit even through Runtime API',async()=>{
 const {runtime,calls}=await ready({options:{capture:true}});await assert.rejects(runtime.startRanked(),/capture_mode/);runtime.startPractice();assert.equal((await runtime.submitRun(trace())).status,'practice');assert.equal(calls.start.length+calls.finish.length,0);
});
test('ranked requires config eligibility and a public authenticated profile',async()=>{
 const {runtime,setPlayer}=setup();await assert.rejects(runtime.startRanked(),/game_validator_unavailable/);await runtime.boot();setPlayer(null);await assert.rejects(runtime.startRanked(),/authentication_required/);
});
test('unavailable config never blocks practice and can be retried',async()=>{
 const x=setup();x.adapter.config=async()=>{throw Error('offline')};await assert.rejects(x.runtime.boot(),/offline/);assert.equal(x.runtime.eligible,false);assert.equal(x.runtime.startPractice().ranked,false);x.adapter.config=async()=>({seed:9,loginReady:true,rankedGames:[{game:'gyro-drop',version:VERSION}]});await x.runtime.boot();assert.equal(x.runtime.startPractice().seed,9);
});
test('profile request expiry is tolerated at boot while keeping practice available',async()=>{
 const x=setup();x.adapter.loadPlayer=async()=>{x.setPlayer(null);throw Error('invalid_or_expired_login')};const c=await x.runtime.boot();assert.equal(c.player,null);assert.equal(x.runtime.startPractice().ranked,false);
});
test('duplicate starts coalesce into one request and preserve explicit version',async()=>{
 const d=deferred();let n=0;const x=await ready({adapter:{start:p=>{n++;assert.deepEqual(p,{game:'gyro-drop',version:VERSION});return d.promise}}});const a=x.runtime.startRanked(),b=x.runtime.startRanked();assert.equal(a,b);await micro();assert.equal(n,1);d.resolve({runId:ID,seed:7,version:VERSION});assert.equal((await a).seed,7);await assert.rejects(x.runtime.startRanked(),/run_in_progress/);
});
test('failed starts never silently fall back to a ranked attempt',async()=>{
 const x=await ready({adapter:{start:()=>{throw Error('request_failed')}}});await assert.rejects(x.runtime.startRanked(),/request_failed/);assert.equal((await x.runtime.submitRun(trace())).status,'practice');x.adapter.start=async()=>({runId:ID,seed:7,version:VERSION});assert.equal((await x.runtime.startRanked()).ranked,true);
});
for(const [name,response] of Object.entries({version:{runId:ID,seed:7,version:'old'},game:{runId:ID,seed:7,game:'other',version:VERSION},id:{runId:'bad',seed:7,version:VERSION},seed:{runId:ID,seed:-1,version:VERSION}}))test('invalid ranked '+name+' fails before play',async()=>{
 const x=await ready({adapter:{start:async()=>response}});await assert.rejects(x.runtime.startRanked());assert.equal((await x.runtime.submitRun(trace())).status,'practice');
});
test('late start cannot restore ranked mode after downgrade or practice',async()=>{
 const d=deferred(),x=await ready({adapter:{start:()=>d.promise}});const a=x.runtime.startRanked();x.runtime.startPractice();d.resolve({runId:ID,seed:7,version:VERSION});await assert.rejects(a,/stale_operation/);assert.equal((await x.runtime.submitRun(trace())).status,'practice');
});
test('identity changes during start reject that attempt',async()=>{
 const d=deferred(),x=await ready({adapter:{start:()=>d.promise}});const a=x.runtime.startRanked();x.setPlayer({handle:'other',country:'US'});d.resolve({runId:ID,seed:7,version:VERSION});await assert.rejects(a,/invalid_or_expired_login/);
});
test('submit sends ONLY immutable runId/actions/ticks, never claimed score/country',async()=>{
 const x=await ready();await x.runtime.startRanked();const body=trace(),p=x.runtime.submitRun({...body,score:99999,country:'US',game:'fake'});body.actions[0][2]=-1;body.actions.push([14,'burst']);const result=await p;
 assert.equal(result.status,'verified');assert.equal(result.score,392);const sent=x.calls.finish[0];assert.deepEqual(Object.keys(sent),['runId','actions','ticks']);assert.deepEqual(sent.actions,trace().actions);assert(Object.isFrozen(sent.actions[0]));assert.equal(x.runtime.canRetry,false);
});
test('concurrent submit and retry produce only one in-flight finish request',async()=>{
 const d=deferred();let n=0;const x=await ready({adapter:{finish:()=>{n++;return d.promise}}});await x.runtime.startRanked();const a=x.runtime.submitRun(trace()),b=x.runtime.submitRun(trace()),c=x.runtime.retrySave();assert.equal(a,b);assert.equal(b,c);await micro();assert.equal(n,1);d.resolve({saved:true,score:1});await a;await x.runtime.submitRun(trace());assert.equal(n,1);
});
test('transient failure retries the exact same input snapshot and run ID',async()=>{
 let n=0;const seen=[];const x=await ready({adapter:{finish:p=>{seen.push(p);if(++n===1)throw Error('request_failed');return {saved:true,score:123,duplicate:true}}}});await x.runtime.startRanked();assert.equal((await x.runtime.submitRun(trace())).status,'failed');assert(x.runtime.canRetry);const answer=await x.runtime.retrySave();assert.equal(answer.status,'verified');assert.equal(answer.duplicate,true);assert.equal(seen[0],seen[1]);assert.equal(x.runtime.canRetry,false);
});
for(const code of ['invalid_or_expired_login','invalid_game_replay','excessive_elapsed_time','run_expired','version_mismatch'])test(code+' never offers a futile save retry',async()=>{
 let n=0;const x=await ready({adapter:{finish:()=>{n++;throw Error(code)}}});await x.runtime.startRanked();const a=await x.runtime.submitRun(trace());assert.equal(a.retryable,false);assert.equal(x.runtime.canRetry,false);await x.runtime.retrySave();assert.equal(n,1);
});
for(const name of ['AbortError','TimeoutError','TypeError'])test(name+' is an unconfirmed retriable result, not verified',async()=>{
 const x=await ready({adapter:{finish:()=>{const e=Error('transport');e.name=name;throw e}}});await x.runtime.startRanked();assert.equal((await x.runtime.submitRun(trace())).status,'failed');assert(x.runtime.canRetry);
});
for(const response of [{saved:false,score:123},{saved:true,score:null},{saved:true,score:'123'},{saved:true,score:-1},{saved:true,score:50001}])test('invalid success payload '+JSON.stringify(response)+' is not verified',async()=>{
 const x=await ready({adapter:{finish:async()=>response}});await x.runtime.startRanked();const a=await x.runtime.submitRun(trace());assert.equal(a.status,'failed');assert.equal(a.error.message,'not_saved');
});
test('late successful finish is ignored after a new practice attempt',async()=>{
 const d=deferred(),x=await ready({adapter:{finish:()=>d.promise}});await x.runtime.startRanked();const a=x.runtime.submitRun(trace());await micro();x.runtime.startPractice();d.resolve({saved:true,score:200});const r=await a;assert.equal(r.status,'stale');assert.equal(x.runtime.isCurrent(r),false);assert.equal(x.runtime.saving,false);
});
test('late failed finish cannot overwrite the next ranked save or its busy state',async()=>{
 const d=deferred();let n=0;const x=await ready({adapter:{finish:()=>++n===1?d.promise:Promise.resolve({saved:true,score:222})}});await x.runtime.startRanked();const a=x.runtime.submitRun(trace());await micro();await x.runtime.startRanked();const b=await x.runtime.submitRun(trace());d.reject(Error('request_failed'));assert.equal((await a).status,'stale');assert.equal(b.status,'verified');assert(x.runtime.isCurrent(b));assert(!x.runtime.canRetry);
});
test('paused/downgraded runs never submit and cannot restore rank without a new start',async()=>{
 const x=await ready();await x.runtime.startRanked();x.runtime.downgrade();assert.equal((await x.runtime.submitRun(trace())).status,'practice');assert.equal(x.calls.finish.length,0);await x.runtime.startRanked();assert.equal(x.calls.start.length,2);
});
test('runtime logout invalidates pending operations and delegates credential removal',async()=>{
 const x=await ready();await x.runtime.startRanked();x.runtime.logout();assert.equal(x.calls.logout,1);assert.equal(x.runtime.getPlayer(),null);assert.equal((await x.runtime.submitRun(trace())).status,'practice');
});
test('profile changed after play cannot submit with another player',async()=>{
 const x=await ready();await x.runtime.startRanked();x.setPlayer({handle:'other',country:'JP'});assert.equal((await x.runtime.submitRun(trace())).retryable,false);assert.equal(x.calls.finish.length,0);
});
test('malformed traces reject before network IO',async()=>{
 for(const body of [{actions:[],ticks:0},{actions:[[0,'steer',1],[0,'burst']],ticks:10},{actions:[[9,'turn',NaN]],ticks:10},{actions:[[0,'turn',{}]],ticks:10},{actions:new Array(2501).fill([0,'burst']),ticks:10}]){
 const x=await ready();await x.runtime.startRanked();const a=await x.runtime.submitRun(body);assert.equal(a.status,'failed');assert(!a.retryable);assert.equal(x.calls.finish.length,0);}
});
test('world/country reads preserve game/version and never change verified save state',async()=>{
 const x=await ready();await x.runtime.startRanked();const r=await x.runtime.submitRun(trace());assert.deepEqual((await x.runtime.readBoard('nations')).query,{game:'gyro-drop',scope:'nations',period:'week'});x.adapter.readBoard=async()=>{throw Error('offline')};await assert.rejects(x.runtime.readBoard());assert(x.runtime.isCurrent(r));assert.equal((await x.runtime.submitRun(trace())).status,'verified');
});
test('board refuses different rules or malformed rows and invalid filters',async()=>{
 const x=await ready();x.adapter.readBoard=async()=>({version:'old',rows:[]});await assert.rejects(x.runtime.readBoard(),/old_board/);x.adapter.readBoard=async()=>({version:VERSION});await assert.rejects(x.runtime.readBoard(),/board_unavailable/);await assert.rejects(x.runtime.readBoard('wrong'),/invalid_board/);
});
test('late boot config may change next seed but never rewrites an active ranked run',async()=>{
 const x=await ready();await x.runtime.startRanked();x.adapter.config=async()=>({seed:100,loginReady:true,rankedGames:[{game:'gyro-drop',version:VERSION}]});await x.runtime.boot();await x.runtime.submitRun(trace());assert.equal(x.calls.finish[0].runId,ID);assert.equal(x.runtime.startPractice().seed,100);
});
test('community adapter delegates auth and writes without reading/storing credentials',async()=>{
 const seen=[],c={profile:{handle:'a',country:'KR'},authenticated:true,endpoint:'https://example.invalid/api',config:async()=>({}),me:async()=>c.profile,logout:()=>seen.push('logout'),googleButton:(...a)=>seen.push(['google',...a]),renderFlagLabel:(...a)=>a,countryName:x=>x,api:(action,body)=>{seen.push({action,body});return Promise.resolve({})}};
 const a=Community.create(c,async(url,options)=>{seen.push({url:String(url),options});return {ok:true,json:async()=>({rows:[],version:VERSION})}});
 await a.start({game:'g',version:'v'});await a.finish({runId:ID,actions:[],ticks:60});a.googleButton('target');a.logout();await a.readBoard({game:'g',scope:'world',period:'week'});
 assert.equal(seen[0].action,'start');assert.equal(seen[1].action,'finish');assert.equal(seen[2][0],'google');assert.equal(seen[3],'logout');assert(!seen[4].options.headers);assert.equal(seen[4].options.cache,'no-store');assert(seen[4].options.signal);assert(seen[4].url.includes('action=board'));
});
test('existing real Community client preserves tab session and clears it on 401 through adapter',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 const KEY='loopjolt_google_session_v1',store=new Map([[KEY,JSON.stringify({token:'QA_LOCAL_ONLY',expires:Date.now()+60000})]]),requests=[];let expired=false;
 const sandbox={URL,URLSearchParams,Intl,Date,AbortController,setTimeout,clearTimeout,
  document:{readyState:'loading',addEventListener(){}},
  sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  fetch:async(url,options)=>{requests.push({url,options});const action=new URL(url).searchParams.get('action');let data;
   if(action==='config')data={seed:7,loginReady:true,rankedGames:[{game:'gyro-drop',version:VERSION}]};
   if(action==='profile')data={profile:{handle:'tester',country:'KR'}};
   if(action==='start')data={runId:ID,version:VERSION,seed:7};
   if(action==='finish')data=expired?{error:'invalid_or_expired_login'}:{saved:true,score:392};
   return {ok:!(expired&&action==='finish'),status:expired&&action==='finish'?401:200,json:async()=>data};
  }};
 sandbox.window=sandbox;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../community/client.js'),'utf8'),sandbox);
 const runtime=Runtime.create({game:'gyro-drop',version:VERSION,adapter:Community.create(sandbox.LoopCommunity,sandbox.fetch)});
 await runtime.boot();assert.equal(runtime.getPlayer().handle,'tester');assert.equal(store.size,1);
 await runtime.startRanked();assert.equal((await runtime.submitRun(trace())).status,'verified');
 assert(requests.some(r=>r.options.headers?.Authorization==='Bearer QA_LOCAL_ONLY'));assert(!JSON.stringify(runtime.getPlayer()).includes('QA_LOCAL_ONLY'));
 await runtime.startRanked();expired=true;const r=await runtime.submitRun(trace());assert.equal(r.status,'failed');assert.equal(r.error.message,'invalid_or_expired_login');assert.equal(store.has(KEY),false);assert.equal(runtime.getPlayer(),null);assert(!runtime.canRetry);
});
