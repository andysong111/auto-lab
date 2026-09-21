/* Anonymous tab-session navigation. Analytics failure must never block gameplay. */
(function(root){'use strict';
if(typeof window==='undefined'||!root.document||root.LJTelemetry?.schema===LoopAcquisition.SCHEMA)return;
const C=LoopAcquisition,q=new URLSearchParams(location.search),K='lj4_acquisition',MAX_IDLE=30*60*1000;
const safeStore={get(k){try{return sessionStorage.getItem(k);}catch{return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch{}},remove(k){try{sessionStorage.removeItem(k);}catch{}}};
if(q.get('internal')==='1')safeStore.set('lj4_internal','1');else if(q.get('internal')==='0')safeStore.remove('lj4_internal');
function optedOut(){try{return localStorage.getItem('lj_analytics_optout')==='1';}catch{return false;}}
const quiet=q.get('capture')==='1'||q.get('qa')==='1'||safeStore.get('lj4_internal')==='1'||['localhost','127.0.0.1','[::1]',''].includes(location.hostname)||navigator.webdriver===true||navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||optedOut();
if(quiet){root.LJTelemetry={schema:C.SCHEMA,track(){},excluded:true};root.VibeAnalytics={track(){},build:'acquisition-v1'};return;}
const uuid=()=>crypto.randomUUID();let session=null;
try{session=JSON.parse(safeStore.get(K)||'null');}catch{}
const now=Date.now(),explicit=['source','medium','campaign','content'].some(k=>q.has('utm_'+k)),incoming=C.attribution(location.search,document.referrer);
if(!session||!C.UUID.test(session.id||'')||!Number.isFinite(session.last)||now-session.last>MAX_IDLE||session.last>now||(explicit||incoming.basis==='referrer')&&JSON.stringify(incoming)!==JSON.stringify(session.a))session={id:uuid(),last:now,a:incoming,starts:{}};
session.starts=session.starts&&typeof session.starts==='object'?session.starts:{};
function persist(){safeStore.set(K,JSON.stringify(session));}
persist();let sentPage=false,current={},seen=new Set();
function track(event,game,build,props={}){
 try{
  if(optedOut()||!C.EVENTS.has(event))return;
  if(event==='page_view'){if(sentPage)return;sentPage=true;}
  const time=Date.now();if(time-session.last>MAX_IDLE){session={id:uuid(),last:time,a:session.a,starts:{}};current={};seen.clear();}
  session.last=time;game=C.GAMES.has(game)?game:C.gameFor(location.href);props=props&&typeof props==='object'?props:{};
  const attemptKey=game||'none';
  if(event==='game_start'){current[attemptKey]=uuid();session.starts[attemptKey]=(session.starts[attemptKey]||0)+1;}
  if(event==='replay'&&session.starts[attemptKey]<2)return;
  const attempt=current[attemptKey]||null;
  const unique=['game_finish','score_verified','ranked_downgrade','replay'].includes(event)?attempt+':'+event:null;
  if(unique&&attempt&&seen.has(unique))return;if(unique&&attempt)seen.add(unique);
  const payload=C.clean({schema:C.SCHEMA,event,event_id:uuid(),session_id:session.id,attempt_id:attempt,path:location.pathname+location.search,build,...session.a,props:{game,ranked:props.ranked,to:props.to}});
  persist();if(!payload)return;
  const text=JSON.stringify(payload),accepted=navigator.sendBeacon?.('/api/event',new Blob([text],{type:'application/json'}));
  if(!accepted)fetch('/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:text,keepalive:true,credentials:'omit'}).catch(()=>{});
  if(event==='game_start'&&session.starts[attemptKey]>1)track('replay',game,build,{ranked:props.ranked});
 }catch{/* Measurement cannot stop gameplay. */}
}
root.LJTelemetry={schema:C.SCHEMA,track,excluded:false};
root.VibeAnalytics={build:'acquisition-v1',track:(event,props={})=>track(event,props.game||C.gameFor(location.href),props.version||'legacy-ui',props)};
track('page_view',C.gameFor(location.href),'acquisition-v1');
document.addEventListener('click',e=>{const el=e.target?.closest?.('#ranked, #signInRun, #alternatePlay, #start');if(!el||el.disabled||el.hidden)return;if(el.id==='ranked'||el.id==='signInRun'||/ranked/i.test(el.textContent||''))track('ranked_entry',C.gameFor(location.href),'acquisition-v1');},true);
})(globalThis);
