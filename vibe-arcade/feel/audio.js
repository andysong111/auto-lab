/* Feel Kit: lazy, bounded Web Audio synthesis. No downloads, storage, timers or game rules. */
(function(root){'use strict';
const bound=(n,a,b,d)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):d;
function create({contextFactory=()=>{const A=root.AudioContext||root.webkitAudioContext;return A?new A():null;},volume=.13,maxVoices=16}={}){
 let ctx=null,master=null,enabled=false,disposed=false,change=0;const voices=new Set();
 const cap=Math.floor(bound(maxVoices,0,32,16)),level=bound(volume,0,.3,.13);
 function cleanup(v){if(!voices.delete(v))return;v.osc.onended=null;try{v.osc.disconnect();}catch{}try{v.gain.disconnect();}catch{}}
 function clear(){for(const v of [...voices]){try{v.osc.stop();}catch{}cleanup(v);}}
 function gain(value){if(master)try{master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(value,ctx.currentTime);}catch{master.gain.value=value;}}
 async function align(){
  while(ctx&&!disposed&&ctx.state!=='closed'){
   const c=ctx,id=change,want=enabled;
   try{if(want&&c.state!=='running')await c.resume();else if(!want&&c.state!=='suspended')await c.suspend();}catch{return;}
   if(c!==ctx)return;
   if(id===change){gain(want?level:0);return;}
  }
 }
 async function enable(value){
  if(disposed)return false;enabled=!!value;const id=++change;
  if(!enabled){gain(0);clear();if(ctx&&ctx.state!=='closed')try{await ctx.suspend();}catch{}if(id!==change)await align();return false;}
  try{
   if(!ctx){ctx=contextFactory();if(!ctx){enabled=false;return false;}master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);}
   if(ctx.state==='closed'){enabled=false;return false;}
   // Invoke resume in the user gesture, rather than queuing it behind another promise.
   await ctx.resume();
   if(disposed||id!==change||!enabled){await align();return false;}
   gain(level);return ctx.state==='running';
  }catch{if(id===change){enabled=false;gain(0);clear();}return false;}
 }
 function note(freq,duration=.15,type='sine',amplitude=.2,delay=0,to=null){
  if(disposed||!enabled||!ctx||ctx.state!=='running'||voices.size>=cap)return false;
  if(!Number.isFinite(freq)||freq<=0||!Number.isFinite(duration)||duration<=.008||!Number.isFinite(delay)||delay<0||!Number.isFinite(amplitude)||amplitude<=0||!['sine','square','triangle','sawtooth'].includes(type)||(to!==null&&(!Number.isFinite(to)||to<=0)))return false;
  let osc,g;try{
   osc=ctx.createOscillator();g=ctx.createGain();const v={osc,gain:g},t=ctx.currentTime+Math.min(delay,2),dur=Math.min(duration,3);
   voices.add(v);osc.onended=()=>cleanup(v);osc.type=type;osc.frequency.setValueAtTime(bound(freq,20,16000,440),t);
   if(to!==null)osc.frequency.exponentialRampToValueAtTime(bound(to,20,16000,440),t+dur);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.min(amplitude,.4),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
   osc.connect(g);g.connect(master);osc.start(t);osc.stop(t+dur+.02);return true;
  }catch{for(const v of voices)if(v.osc===osc){try{osc.stop();}catch{}cleanup(v);}try{osc?.disconnect();}catch{}try{g?.disconnect();}catch{}return false;}
 }
 function sequence(notes){if(!Array.isArray(notes))return 0;let played=0;for(const args of notes.slice(0,cap)){if(Array.isArray(args)&&note(...args))played++;}return played;}
 async function destroy(){if(disposed)return;disposed=true;enabled=false;++change;gain(0);clear();try{master?.disconnect();}catch{}if(ctx&&ctx.state!=='closed')try{await ctx.close();}catch{}master=null;ctx=null;}
 return Object.freeze({enable,note,sequence,clear,destroy,get enabled(){return enabled;},snapshot:()=>Object.freeze({enabled,voices:voices.size,state:ctx?.state||'uninitialized',disposed})});
}
const api=Object.freeze({create});root.LoopJoltFeelAudio=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
