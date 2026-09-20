/* Optional ranked session controller. No claimed score is sent to the server. */
(function(){'use strict';
const R=DescentRules,$=q=>document.querySelector(q);
const capture=new URLSearchParams(location.search).get('capture')==='1';
const P=LoopJoltRuntime.create({game:R.GAME,version:R.VERSION,capture,maxTicks:R.MAX_TICKS,maxInputs:R.MAX_INPUTS,adapter:LoopJoltCommunityAdapter.create(LoopCommunity)});
let state=R.create(125904),seed=125904,playing=false,paused=false,ranked=false,wantedRanked=false;
let busy=false,initialized=false,eligible=false,epoch=0,actions=[],turn=0,steer=0,burst=false;
let acc=0,lastFrame=performance.now(),clock=RankedClock.create(),best=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,soundOn=false;
try{best=Number(localStorage.getItem('dd-best-'+R.VERSION)||0)||0;reduced=reduced||localStorage.getItem('dd-less-motion')==='1';soundOn=localStorage.getItem('dd-sound')==='1';}catch{}
const audio=new DescentAudio();
const UI=DescentShell.create({host:document,platform:P,rules:R,onAction:handleShellAction});
const view=DescentView.make({state:()=>state,isPlaying:()=>playing&&!paused,reduced:()=>reduced,
 action:a=>{if(a[0]==='steer')steer=a[1];},turn:d=>{turn=R.clamp(turn+d,-450,450);},
 ready:()=>{initialized=true;buttons();},contextLost:()=>{pauseRun('Graphics context interrupted. This run is practice only.');}});
function track(event,props={}){if(!capture)window.LJTelemetry?.track(event,R.GAME,R.VERSION,props);}
function text(s){UI.text({status:s});}
function profileLabel(){UI.identity();}
function buttons(){UI.controls({ready:initialized,busy,eligible,capture,playing,sound:soundOn,reduced});}
function hud(){UI.hud({state,playing,paused,ranked,capture,best});}
const board=scope=>P.readBoard(scope);
async function official(){if(!P.getPlayer()||!eligible)return;try{const b=await board('world'),p=P.getPlayer();const r=b.rows?.find(x=>x.handle?.toLowerCase()===p.handle.toLowerCase());UI.text({official:r?Number(r.score).toLocaleString('en-US'):'Not in top 100'});}catch{UI.text({official:'Unavailable'});}}
(async()=>{try{const c=await P.boot();seed=c.seed;eligible=c.eligible;
 profileLabel();buttons();if(!playing&&!busy&&state.tick===0){state=R.create(seed);hud();}official();}catch{eligible=false;buttons();}})();
function downgrade(message){if(ranked){P.downgrade();ranked=false;text(message);track('ranked_downgrade',{reason:message});hud();}}
function pauseRun(message){if(!playing||paused)return;downgrade(message||'Paused. This attempt is now practice only.');paused=true;steer=0;turn=0;UI.paused();audio.enable(false);hud();}
function resume(){if(!playing||!paused)return;paused=false;acc=0;lastFrame=performance.now();UI.resumed();audio.enable(soundOn);view.focus();hud();}
function actionForTick(){
 if(burst){burst=false;return ['burst'];}
 if(steer!==state.steer)return ['steer',steer];
 if(Math.abs(turn)>=1&&state.tick%3===0){const d=R.clamp(Math.round(turn),-150,150);turn-=d;return ['turn',d];}
 return null;
}
async function launch(want){
 if(busy||playing||!initialized)return;
 if(want&&!P.getPlayer()){location.href='/community/?panel=profile&returnTo=%2Fdescent%2F';return;}
 if(want&&(!eligible||capture))return;
 busy=true;let startError='';const id=++epoch;ranked=false;wantedRanked=!!want;buttons();UI.text({entryNote:want?'Preparing a verified run…':'Preparing…'});
 try{
  const prepared=want?await P.startRanked():P.startPractice();
  if(id!==epoch)return;
  state=R.create(prepared.seed);ranked=prepared.ranked;playing=true;paused=false;actions=[];turn=0;steer=0;burst=false;acc=0;clock=RankedClock.create();lastFrame=performance.now();view.reset();audio.reset();audio.enable(soundOn);UI.started();
  text(ranked?'Official run · unpaused gameplay is verified on the server.':'Practice · drag the tower, not the drone. Space = charged burst.');track('game_start',{ranked});view.focus();hud();
 }catch(e){if(id===epoch){ranked=false;profileLabel();startError=e.message==='invalid_or_expired_login'?'Sign-in expired. Sign in again before a ranked run.':'Ranked start unavailable. Retry or choose practice.';}}
 finally{if(id===epoch){busy=false;buttons();if(startError){UI.entry();UI.text({entryNote:startError});}}}
}
function showResult(){UI.result({state,ranked,wantedRanked,eligible});}
async function submit(operation){
 UI.saving();
 const result=await operation;if(!P.isCurrent(result))return;
 if(result.status==='verified'){
  UI.saved(result);track('score_verified',{score:result.score});
  try{const [players,nations]=await Promise.all([board('world'),board('nations')]);if(!P.isCurrent(result))return;const p=P.getPlayer();const mine=players.rows.find(x=>x.handle?.toLowerCase()===p?.handle.toLowerCase()),country=nations.rows.find(x=>p?.country&&x.country_code===p.country);
   UI.text({standing:[mine?'World #'+mine.rank:'Outside the displayed top 100',country?P.countryName(p.country)+' #'+country.rank:null].filter(Boolean).join(' · ')});if(mine)UI.text({official:Number(mine.score).toLocaleString('en-US')});
  }catch{if(P.isCurrent(result))UI.text({standing:'Score saved. Rank lookup is temporarily unavailable.'});}
 }else if(result.status==='failed'){
  UI.saved(result);
 }
}
function end(){
 if(!playing)return;playing=false;paused=false;best=Math.max(best,state.score);if(!capture)try{localStorage.setItem('dd-best-'+R.VERSION,String(best));}catch{}
 hud();buttons();track('game_finish',{ranked,score:state.score,floor:state.floor,reason:state.reason});showResult();
 if(ranked)submit(P.submitRun({actions,ticks:state.tick}));ranked=false;
}
function handleShellAction(action){
 if(action==='practice')launch(false);
 if(action==='ranked')launch(true);
 if(action==='pause')paused?resume():pauseRun();
 if(action==='resume')resume();
 if(action==='dismiss')buttons();
 if(action==='replay')launch(wantedRanked&&eligible&&!capture);
 if(action==='retry'&&P.canRetry&&!P.saving)submit(P.retrySave());
 if(action==='sound'){soundOn=!soundOn;audio.enable(soundOn);try{localStorage.setItem('dd-sound',soundOn?'1':'0');}catch{}buttons();}
 if(action==='motion'){reduced=!reduced;try{localStorage.setItem('dd-less-motion',reduced?'1':'0');}catch{}buttons();}
}
$('#burst').onclick=()=>{if(playing&&!paused&&state.energy>=100)burst=true;};
for(const [id,dir] of [['left',-1],['right',1]]){$('#'+id).onpointerdown=e=>{e.preventDefault();steer=dir;$('#'+id).setPointerCapture?.(e.pointerId);};$('#'+id).onpointerup=$('#'+id).onpointercancel=()=>steer=0;}
window.addEventListener('pointerup',()=>steer=0);
window.addEventListener('keydown',e=>{
 if(!playing||UI.resultOpen||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD','KeyP','Escape'].includes(e.code)){
  e.preventDefault();e.stopPropagation();
  if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)paused?resume():pauseRun();return;}
  if(paused)return;if(e.code==='ArrowLeft'||e.code==='KeyA')steer=-1;if(e.code==='ArrowRight'||e.code==='KeyD')steer=1;if(e.code==='Space'&&!e.repeat&&state.energy>=100)burst=true;
 }
},true);
window.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code))steer=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pauseRun('Tab hidden. This attempt is practice only.');});
function frame(now){
 const dt=now-lastFrame;lastFrame=now;
 if(playing&&!paused){
  if(ranked&&!RankedClock.observe(clock,dt))downgrade('Frame timing changed. This attempt is practice only.');
  acc+=Math.min(Math.max(0,dt),100)/1000;let n=0;
  while(acc>=1/60&&state.alive&&n++<6){
   const a=actionForTick();if(a){if(actions.length<R.MAX_INPUTS)actions.push([state.tick,...a]);else downgrade('Input limit reached. This attempt is practice only.');}
   R.step(state,a);if(state.events.length){view.events(state.events);state.events.forEach(e=>audio.event(e));}audio.update(state,true);acc-=1/60;
  }
  hud();if(!state.alive)end();
 }
 requestAnimationFrame(frame);
}
// Read-only diagnostics, no credentials or production input injection. Useful for performance QA.
window.DescentDiagnostics=Object.freeze({snapshot:()=>({state:JSON.parse(JSON.stringify(state)),playing,paused,ranked,version:R.VERSION,inputCount:actions.length})});
hud();buttons();track('game_open');requestAnimationFrame(frame);
})();
