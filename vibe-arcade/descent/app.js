/* Optional ranked session controller. No claimed score is sent to the server. */
(function(){'use strict';
const R=DescentRules,C=LoopCommunity,$=q=>document.querySelector(q);
const capture=new URLSearchParams(location.search).get('capture')==='1';
let state=R.create(125904),seed=125904,playing=false,paused=false,ranked=false,wantedRanked=false;
let busy=false,initialized=false,eligible=false,run=null,epoch=0,saveEpoch=0,actions=[],turn=0,steer=0,burst=false;
let acc=0,lastFrame=performance.now(),clock=RankedClock.create(),best=0,saveData=null;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,soundOn=false,saveBusy=false;
try{best=Number(localStorage.getItem('dd-best-'+R.VERSION)||0)||0;reduced=reduced||localStorage.getItem('dd-less-motion')==='1';soundOn=localStorage.getItem('dd-sound')==='1';}catch{}
const audio=new DescentAudio();
const view=DescentView.make({state:()=>state,isPlaying:()=>playing&&!paused,reduced:()=>reduced,
 action:a=>{if(a[0]==='steer')steer=a[1];},turn:d=>{turn=R.clamp(turn+d,-450,450);},
 ready:()=>{initialized=true;buttons();},contextLost:()=>{pauseRun('Graphics context interrupted. This run is practice only.');}});
function track(event,props={}){if(!capture)window.LJTelemetry?.track(event,R.GAME,R.VERSION,props);}
function text(s){$('#status').textContent=s;}
function profileLabel(){const p=C.profile;if(p){C.renderFlagLabel($('#identity'),p.country,p.handle);C.renderFlagLabel($('#resultIdentity'),p.country,p.handle);}else{$('#identity').textContent='Sign in';$('#resultIdentity').textContent='YOUR EXPEDITION';}}
function buttons(){
 $('#play').disabled=!initialized||busy;$('#play').textContent='Play practice';
 $('#ranked').disabled=!initialized||busy||!eligible||capture;
 $('#ranked').textContent=C.profile?'Play ranked':'Sign in to compete';
 $('#entryNote').textContent=capture?'Capture mode · no ranked submissions or analytics.':eligible?'Same weekly course. Compete for your flag.':'Practice is ready. The v2 ranking board is not available yet.';
 $('#pause').disabled=!playing;$('#motion').setAttribute('aria-pressed',String(reduced));$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').textContent=soundOn?'Sound on':'Sound off';
}
function hud(){
 $('#score').textContent=state.score.toLocaleString('en-US');$('#time').textContent=((R.MAX_TICKS-state.tick)/60).toFixed(1);
 $('#stage').textContent=state.floor+' / 48 RINGS';$('#progress').style.width=(state.floor/48*100)+'%';$('.progress').setAttribute('aria-valuenow',state.floor);
 $('#shields').textContent='● '.repeat(state.health)+'○ '.repeat(3-state.health);$('#shields').setAttribute('aria-label',state.health+' shields');
 $('#charge').textContent=state.energy+' / 100';$('#chargeBar').style.width=state.energy+'%';$('#burst').disabled=!playing||paused||state.energy<100||state.burst>0;$('#burst').classList.toggle('ready',state.energy>=100);
 $('#modeTag').textContent=capture?'CAPTURE · PRACTICE':ranked?'RANKED · v2':'PRACTICE';$('#best').textContent=best.toLocaleString('en-US');
}
async function board(scope){const u=new URL(C.endpoint);u.search=new URLSearchParams({action:'board',game:R.GAME,scope,period:'week'});const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('board_unavailable');const b=await r.json();if(b.version&&b.version!==R.VERSION)throw Error('old_board');return b;}
async function official(){if(!C.profile||!eligible)return;try{const b=await board('world'),p=C.profile;const r=b.rows?.find(x=>x.handle?.toLowerCase()===p.handle.toLowerCase());$('#official').textContent=r?Number(r.score).toLocaleString('en-US'):'Not in top 100';}catch{$('#official').textContent='Unavailable';}}
(async()=>{try{const c=await C.config();if(Number.isInteger(c.seed))seed=c.seed;eligible=!!c.loginReady&&c.rankedGames?.some(g=>g.game===R.GAME&&g.version===R.VERSION);
 if(C.authenticated)try{await C.me();}catch{}profileLabel();buttons();if(!playing&&!busy&&state.tick===0){state=R.create(seed);hud();}official();}catch{eligible=false;buttons();}})();
function downgrade(message){if(ranked){ranked=false;run=null;text(message);track('ranked_downgrade',{reason:message});hud();}}
function pauseRun(message){if(!playing||paused)return;downgrade(message||'Paused. This attempt is now practice only.');paused=true;steer=0;turn=0;$('#paused').hidden=false;$('#pauseNote').textContent='Paused attempts stay in practice; start a new run to compete.';$('#pause').textContent='▶';audio.enable(false);hud();}
function resume(){if(!playing||!paused)return;paused=false;acc=0;lastFrame=performance.now();$('#paused').hidden=true;$('#pause').textContent='Ⅱ';audio.enable(soundOn);view.focus();hud();}
function actionForTick(){
 if(burst){burst=false;return ['burst'];}
 if(steer!==state.steer)return ['steer',steer];
 if(Math.abs(turn)>=1&&state.tick%3===0){const d=R.clamp(Math.round(turn),-150,150);turn-=d;return ['turn',d];}
 return null;
}
async function launch(want){
 if(busy||playing||!initialized)return;
 if(want&&!C.profile){location.href='/community/?panel=profile&returnTo=%2Fdescent%2F';return;}
 if(want&&(!eligible||capture))return;
 busy=true;let startError='';const id=++epoch;saveEpoch++;saveData=null;run=null;ranked=false;wantedRanked=!!want;buttons();$('#entryNote').textContent=want?'Preparing a verified run…':'Preparing…';
 try{
  if(want){const r=await C.api('start',{game:R.GAME,version:R.VERSION});if(r.version!==R.VERSION)throw Error('version_mismatch');run=r;}
  if(id!==epoch)return;
  state=R.create(run?Number(run.seed):seed);ranked=!!run;playing=true;paused=false;actions=[];turn=0;steer=0;burst=false;acc=0;clock=RankedClock.create();lastFrame=performance.now();view.reset();audio.reset();audio.enable(soundOn);$('#entry').hidden=true;$('#paused').hidden=true;$('#pause').textContent='Ⅱ';
  text(ranked?'Official run · unpaused gameplay is verified on the server.':'Practice · drag the tower, not the drone. Space = charged burst.');track('game_start',{ranked});view.focus();hud();
 }catch(e){if(id===epoch){run=null;ranked=false;profileLabel();startError=e.message==='invalid_or_expired_login'?'Sign-in expired. Sign in again before a ranked run.':'Ranked start unavailable. Retry or choose practice.';}}
 finally{if(id===epoch){busy=false;buttons();if(startError)$('#entryNote').textContent=startError;}}
}
function showResult(){
 const p=C.profile;profileLabel();$('#badge').textContent=state.won?'ENGINE BREAKER':state.floor>=32?'EMBER EXPLORER':state.floor>=16?'VAULT DIVER':'FIRST DESCENT';
 $('#resultScore').replaceChildren(document.createTextNode(state.score.toLocaleString('en-US')),Object.assign(document.createElement('span'),{textContent:'pts'}));
 $('#reason').textContent={engine_reached:'All 48 rings cleared. The engine is yours.',red_plate:'Your drone landed on a red plate.',closed_gate:'The gate was closed. Wait for it to turn blue.',time_up:'Time is up. Every clean drop takes you deeper.'}[state.reason]||'Your expedition is complete.';
 $('#rings').textContent=state.floor+' / 48';$('#perfects').textContent=state.perfects;$('#combo').textContent=state.maxCombo;$('#standing').textContent='';$('#retrySave').hidden=true;
 $('#save').className='save';$('#save').textContent=ranked?'Verifying your run…':'Practice best saved on this device. Not a ranked score.';
 $('#again').textContent=wantedRanked&&eligible?'Play ranked again':'Play again';
 if(!$('#result').open)$('#result').showModal();
}
function retryable(error){return ['AbortError','TypeError'].includes(error.name)||['network_error','request_failed','backend_unavailable'].includes(error.message);}
async function submit(payload,id){
 if(saveBusy)return;saveBusy=true;$('#retrySave').hidden=true;$('#save').textContent='Verifying your run…';
 try{
  const r=await C.api('finish',payload);if(id!==saveEpoch)return;
  if(!r.saved||!Number.isFinite(Number(r.score)))throw Error('not_saved');
  $('#save').className='save ok';$('#save').textContent='Verified · '+Number(r.score).toLocaleString('en-US')+' points saved.';saveData=null;track('score_verified',{score:Number(r.score)});
  try{const [players,nations]=await Promise.all([board('world'),board('nations')]);if(id!==saveEpoch)return;const p=C.profile;const mine=players.rows.find(x=>x.handle?.toLowerCase()===p?.handle.toLowerCase()),country=nations.rows.find(x=>p?.country&&x.country_code===p.country);
   $('#standing').textContent=[mine?'World #'+mine.rank:'Outside the displayed top 100',country?C.countryName(p.country)+' #'+country.rank:null].filter(Boolean).join(' · ');if(mine)$('#official').textContent=Number(mine.score).toLocaleString('en-US');
  }catch{if(id===saveEpoch)$('#standing').textContent='Score saved. Rank lookup is temporarily unavailable.';}
 }catch(e){if(id!==saveEpoch)return;$('#save').className='save error';$('#save').textContent=e.message==='invalid_or_expired_login'?'Sign-in expired. This score was not confirmed.':'Save not confirmed. Your local best is safe.';$('#retrySave').hidden=!retryable(e);}
 finally{if(id===saveEpoch)saveBusy=false;}
}
function end(){
 if(!playing)return;playing=false;paused=false;best=Math.max(best,state.score);if(!capture)try{localStorage.setItem('dd-best-'+R.VERSION,String(best));}catch{}
 hud();buttons();track('game_finish',{ranked,score:state.score,floor:state.floor,reason:state.reason});showResult();
 if(ranked&&run){saveData=Object.freeze({runId:run.runId,actions:actions.map(a=>a.slice()),ticks:state.tick});const id=++saveEpoch;saveBusy=false;submit(saveData,id);}run=null;ranked=false;
}
$('#play').onclick=()=>launch(false);$('#ranked').onclick=()=>launch(true);
$('#burst').onclick=()=>{if(playing&&!paused&&state.energy>=100)burst=true;};
$('#pause').onclick=()=>paused?resume():pauseRun();$('#resume').onclick=resume;
$('#closeResult').onclick=()=>{$('#result').close();$('#entry').hidden=false;buttons();};
$('#result').addEventListener('cancel',()=>{$('#entry').hidden=false;buttons();});
$('#again').onclick=()=>{$('#result').close();saveBusy=false;launch(wantedRanked&&eligible&&!capture);};
$('#retrySave').onclick=()=>{if(saveData&&!saveBusy)submit(saveData,++saveEpoch);};
$('#sound').onclick=()=>{soundOn=!soundOn;audio.enable(soundOn);try{localStorage.setItem('dd-sound',soundOn?'1':'0');}catch{}buttons();};
$('#motion').onclick=()=>{reduced=!reduced;try{localStorage.setItem('dd-less-motion',reduced?'1':'0');}catch{}buttons();};
for(const [id,dir] of [['left',-1],['right',1]]){$('#'+id).onpointerdown=e=>{e.preventDefault();steer=dir;$('#'+id).setPointerCapture?.(e.pointerId);};$('#'+id).onpointerup=$('#'+id).onpointercancel=()=>steer=0;}
window.addEventListener('pointerup',()=>steer=0);
window.addEventListener('keydown',e=>{
 if(!playing||$('#result').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
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
