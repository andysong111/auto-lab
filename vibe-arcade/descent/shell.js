/* Deep Descent presentation adapter. No game mutation or platform requests. */
(function(root){'use strict';
const number=n=>n.toLocaleString('en-US');
function create({host,platform,rules,onAction}){
 const shell=LoopJoltGameShell.create({host,onAction,
  slots:{entry:'#entry',paused:'#paused',result:'#result',practice:'#play',ranked:'#ranked',entryNote:'#entryNote',
   pause:'#pause',pauseNote:'#pauseNote',resume:'#resume',replay:'#again',dismiss:'#closeResult',retry:'#retrySave',sound:'#sound',motion:'#motion',
   identity:'#identity',resultIdentity:'#resultIdentity',resultScore:'#resultScore',save:'#save',burst:'#burst'},
  fields:{status:'#status',score:'#score',time:'#time',stage:'#stage',shields:'#shields',charge:'#charge',mode:'#modeTag',best:'#best',official:'#official',
   badge:'#badge',reason:'#reason',rings:'#rings',perfects:'#perfects',combo:'#combo',standing:'#standing',entryNote:'#entryNote'},
  meters:{progress:{fill:'#progress',aria:'.progress'},charge:{fill:'#chargeBar'}}
 });
 function identity(){shell.identity(platform.getPlayer(),platform.renderFlagLabel,{header:'Sign in',result:'YOUR EXPEDITION'});}
 function controls({ready,busy,eligible,capture,playing,sound,reduced}){
  shell.controls({ready,busy,eligible,capture,playing,sound,reduced,hasPlayer:!!platform.getPlayer(),
   entryNote:capture?'Capture mode · no ranked submissions or analytics.':eligible?'Same weekly course. Compete for your flag.':'Practice is ready. The v2 ranking board is not available yet.'});
 }
 function hud({state:s,playing,paused,ranked,capture,best}){
  shell.text({score:number(s.score),time:((rules.MAX_TICKS-s.tick)/60).toFixed(1),stage:s.floor+' / 48 RINGS',
   shields:'● '.repeat(s.health)+'○ '.repeat(3-s.health),charge:s.energy+' / 100',mode:capture?'CAPTURE · PRACTICE':ranked?'RANKED · v2':'PRACTICE',best:number(best)});
  shell.meter('progress',s.floor,48);shell.meter('charge',s.energy,100);shell.attribute('shields','aria-label',s.health+' shields');
  shell.actionState('burst',{disabled:!playing||paused||s.energy<100||s.burst>0,active:s.energy>=100});
 }
 function result({state:s,ranked,wantedRanked,eligible}){
  identity();shell.result({parts:[{text:number(s.score)},{text:'pts',tag:'span'}],values:{
   badge:s.won?'ENGINE BREAKER':s.floor>=32?'EMBER EXPLORER':s.floor>=16?'VAULT DIVER':'FIRST DESCENT',
   reason:{engine_reached:'All 48 rings cleared. The engine is yours.',red_plate:'Your drone landed on a red plate.',closed_gate:'The gate was closed. Wait for it to turn blue.',time_up:'Time is up. Every clean drop takes you deeper.'}[s.reason]||'Your expedition is complete.',
   rings:s.floor+' / 48',perfects:s.perfects,combo:s.maxCombo,standing:''},replayLabel:wantedRanked&&eligible?'Play ranked again':'Play again',
   save:{state:ranked?'saving':'practice',message:ranked?'Verifying your run…':'Practice best saved on this device. Not a ranked score.'}});
 }
 function saving(){shell.save({state:'saving',message:'Verifying your run…'});}
 function saved(result){
  if(result.status==='verified')shell.save({state:'verified',message:'Verified · '+number(result.score)+' points saved.'});
  else if(result.status==='failed')shell.save({state:'failed',message:result.error.message==='invalid_or_expired_login'?'Sign-in expired. This score was not confirmed.':'Save not confirmed. Your local best is safe.',retryable:result.retryable});
 }
 return Object.freeze({identity,controls,hud,result,saving,saved,text:shell.text,
  started:()=>shell.show('playing'),paused:()=>shell.show('paused',{note:'Paused attempts stay in practice; start a new run to compete.'}),
  resumed:()=>shell.show('playing'),entry:()=>shell.show('entry'),destroy:shell.destroy,
  get resultOpen(){return shell.resultOpen;}});
}
root.DescentShell=Object.freeze({create});
})(globalThis);
