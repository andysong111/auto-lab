/* Core Pins proof migration: game flow/clock only; shared modules own platform/UI/FX. */
(function(){'use strict';
const R=ChallengerRules,GAME='core-pins',cfg=R.CONFIG[GAME],capture=new URLSearchParams(location.search).get('capture')==='1';
const P=LoopJoltRuntime.create({game:GAME,version:cfg.version,capture,maxTicks:cfg.ticks,maxInputs:2000,adapter:LoopJoltCommunityAdapter.create(LoopCommunity)});
let state=R.create(GAME,125904),playing=false,paused=false,ranked=false,wantedRanked=false,ready=false,busy=false,eligible=false,disposed=false;
let inputs=[],pending=null,acc=0,lastFrame=performance.now(),clock=RankedClock.create(),epoch=0,frameId=0,best=0,sound=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{const value=Number(localStorage.getItem('lj_ch_'+cfg.version));best=Number.isFinite(value)&&value>0?value:0;sound=localStorage.getItem('cp-sound')!=='0';reduced=reduced||localStorage.getItem('cp-reduced')==='1';}catch{}
const audio=CorePinsFeel.createAudio(),ui=CorePinsShell.create(action);
const Replay=window.LoopJoltReplayKit,kit=Replay?.create({game:GAME,result:'#resultDialog',score:'#resultScore',again:'#again',save:'#saveState',retry:'#pinsRetry',dismiss:'#closeResult'});
if(Replay)best=Replay.loadBest('lj_ch_'+cfg.version);
const autoStart=Replay?.autoPractice({ready:()=>ready&&!busy&&!playing,start:()=>launch(false)});
const view=CorePinsView.create({state:()=>state,playing:()=>playing&&!paused&&!ui.resultOpen,reduced:()=>reduced,throw:()=>record(),ready:()=>{ready=true;buttons();autoStart?.();},contextLost:()=>pause('Graphics interrupted. This attempt is practice only.')});
function track(event,props={}){if(!capture)window.LJTelemetry?.track(event,GAME,cfg.version,props);}
function buttons(){ui.controls({ready,busy,eligible,capture,hasPlayer:!!P.getPlayer(),playing,sound,reduced});}
function identity(){ui.identity(P.getPlayer(),P.renderFlagLabel);}
function hud(){ui.hud(state,best);}
function record(){if(playing&&!paused&&!busy&&state.alive&&!ui.resultOpen&&!pending)pending=['throw'];}
async function boot(){try{const b=await P.boot();if(disposed)return;eligible=b.eligible;identity();buttons();if(!playing&&!busy&&state.tick===0){state=R.create(GAME,b.seed);hud();ui.status(capture?'Capture mode · practice only':eligible?'Practice is instant. Ranked runs require sign-in.':'Practice ready. Ranked board activates after verification.');}}
 catch{if(disposed)return;eligible=false;buttons();if(!playing&&!busy&&state.tick===0)ui.status('Practice ready. Ranking service is unavailable.');}}
function downgrade(message){if(ranked){P.downgrade();ranked=false;ui.status(message);track('ranked_downgrade',{reason:message});}}
function pause(message){if(!playing||paused)return;downgrade(message||'Paused. This attempt is practice only.');paused=true;pending=null;audio.enable(false);ui.show('paused',{note:'Paused attempts stay in practice. Start a new run to compete.'});buttons();}
function resume(){if(!playing||!paused)return;paused=false;acc=0;lastFrame=performance.now();ui.show('playing');audio.enable(sound);view.focus();buttons();}
async function launch(want){
 if(disposed||busy||playing||!ready||P.saving||kit?.saving)return;
 if(want&&!P.getPlayer()){ui.show('entry');location.href='/community/?panel=profile&returnTo=%2Fchallengers%2Fplay%3Fgame%3Dcore-pins';return;}
 if(want&&(!eligible||capture))return;
 const id=++epoch;busy=true;ranked=false;wantedRanked=want;buttons();ui.status('Preparing…');audio.reset();audio.enable(sound);
 try{
  const prepared=want?await P.startRanked():P.startPractice();
  if(disposed||id!==epoch)return;
  state=R.create(GAME,prepared.seed);ranked=prepared.ranked;playing=true;paused=false;inputs=[];pending=null;acc=0;clock=RankedClock.create();lastFrame=performance.now();view.reset();ui.show('playing');kit?.begin();hud();view.focus();
  ui.status(ranked?'Ranked run · server will replay your inputs.':'Practice run · score stays on this device.');track('game_start',{ranked});
 }catch(e){if(id===epoch&&!disposed){ranked=false;identity();ui.show('entry');ui.status(e.message==='invalid_or_expired_login'?'Sign-in expired. Sign in again or choose practice.':'Ranked start failed. Nothing was submitted.');audio.enable(false);}}
 finally{if(id===epoch&&!disposed){busy=false;buttons();}}
}
async function submit(operation){
 const id=epoch;ui.save({state:'saving',message:'Verifying this run…'});kit?.saved({state:'saving'});
 const result=await operation;if(disposed||id!==epoch)return;
 if(!P.isCurrent(result)){kit?.saved({state:'failed',retryable:false});return;}
 if(result.status==='verified'){
  ui.save({state:'verified',message:'Verified · '+result.score.toLocaleString()+' saved.'});kit?.saved({state:'verified',score:result.score});track('score_verified',{score:result.score});
  try{const [players,nations]=await Promise.all([P.readBoard('world'),P.readBoard('nations')]);if(disposed||!P.isCurrent(result))return;const p=P.getPlayer(),mine=players.rows.find(r=>r.handle?.toLowerCase()===p?.handle.toLowerCase()),country=nations.rows.find(r=>p?.country&&r.country_code===p.country);
   ui.standing([mine?'World #'+mine.rank:null,country?P.countryName(p.country)+' #'+country.rank:null].filter(Boolean).join(' · ')||'Official leaderboard updated.');
  }catch{if(!disposed&&P.isCurrent(result))ui.standing('Score saved. Rank lookup is temporarily unavailable.');}
 }else if(result.status==='failed'){
  ui.save({state:'failed',message:result.error.message==='invalid_or_expired_login'?'Sign-in expired. This score was not confirmed.':'Save not confirmed. Your local best is safe.',retryable:result.retryable});kit?.saved({state:'failed',retryable:result.retryable});
 }
}
function finish(){if(!playing)return;playing=false;paused=false;pending=null;
 const local=Replay?.record({score:state.score,previousBest:best,key:'lj_ch_'+cfg.version,capture});
 best=local?local.best:Math.max(best,state.score);
 if(!local&&!capture)try{localStorage.setItem('lj_ch_'+cfg.version,String(best));}catch{}
 hud();buttons();identity();track('game_finish',{ranked,score:state.score,ticks:state.tick});ui.result(state,ranked);
 if(local){kit.complete(local,{ranked:wantedRanked&&eligible&&!capture});kit.saved({state:ranked?'saving':'practice'});}
 if(ranked)submit(P.submitRun({actions:inputs,ticks:state.tick}));ranked=false;
}
function action(name){
 if(disposed)return;
 if(name==='practice')launch(false);else if(name==='ranked')launch(true);
 else if(name==='pause')paused?resume():pause();else if(name==='resume')resume();
 else if(name==='replay')launch(wantedRanked&&eligible&&!capture);
 else if(name==='retry'&&P.canRetry&&!P.saving)submit(P.retrySave());
 else if(name==='dismiss')buttons();
 else if(name==='sound'){sound=!sound;audio.enable(sound&&!paused);if(!capture)try{localStorage.setItem('cp-sound',sound?'1':'0');}catch{}buttons();}
 else if(name==='motion'){reduced=!reduced;if(!capture)try{localStorage.setItem('cp-reduced',reduced?'1':'0');}catch{}buttons();}
}
function key(e){
 if(!playing||ui.resultOpen||/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName))return;
 if(!['Space','KeyP','Escape'].includes(e.code))return;e.preventDefault();e.stopPropagation();
 if(e.code==='Space')record();else if(!e.repeat)paused?resume():pause();
}
function visibility(){if(!document.hidden)return;if(playing)pause('Tab hidden. This attempt is practice only.');
 if(busy){epoch++;P.downgrade();busy=false;audio.enable(false);ui.show('entry');ui.status('Start interrupted. Try again when this tab is visible.');buttons();}}
function frame(now){if(disposed)return;const raw=Math.max(0,now-lastFrame);lastFrame=now;
 if(playing&&!paused){if(ranked&&!RankedClock.observe(clock,raw))downgrade('Frame timing became unstable. This attempt is practice only.');acc+=Math.min(100,raw)/1000;let n=0;
  while(acc>=1/60&&state.alive&&n++<6){const a=pending;pending=null;if(a){if(inputs.length<2000)inputs.push([state.tick,...a]);else downgrade('Input limit reached. This attempt is practice only.');}
   R.step(state,a);if(state.events.length){view.events(state.events);state.events.forEach(e=>audio.event(e));}acc-=1/60;
  }hud();if(!state.alive)finish();
 }frameId=requestAnimationFrame(frame);
}
function leave(e){if(e.persisted){visibility();if(playing)pause('Page suspended. This attempt is practice only.');audio.enable(false);return;}
 disposed=true;epoch++;P.downgrade();cancelAnimationFrame(frameId);audio.destroy();view.destroy();kit?.destroy();ui.destroy();window.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',leave);}
window.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',leave);
// No state setter, score injection, token or production automation API.
window.CorePinsDiagnostics=Object.freeze({snapshot:()=>({state:JSON.parse(JSON.stringify(state)),playing,paused,ranked,version:cfg.version,capture,inputCount:inputs.length}),resources:()=>({fx:view.snapshot(),audio:audio.snapshot()})});
hud();buttons();identity();track('page_view');track('game_open');boot();frameId=requestAnimationFrame(frame);
})();
