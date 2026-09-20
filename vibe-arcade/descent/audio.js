/* Original synthesized score, percussion and feedback; no downloaded music. */
(function(root){'use strict';
class Audio{
 constructor(){this.ctx=null;this.enabled=false;this.voices=0;this.lastBeat=-1;}
 async enable(value){this.enabled=value;if(!value){if(this.ctx)await this.ctx.suspend().catch(()=>{});return;}
  if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.13;this.master.connect(this.ctx.destination);}
  await this.ctx.resume().catch(()=>{});
 }
 note(freq,duration=.15,type='sine',gain=.2,delay=0,to=null){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.voices>=16)return;
  const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),v=c.createGain();this.voices++;
  o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+duration);
  v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(gain,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(v);v.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();v.disconnect();this.voices--;};
 }
 event(e){
  if(e.kind==='bounce')this.note(125,.1,'sine',.3,0,80);
  if(e.kind==='drop')this.note(330,.16,'triangle',.28,0,620);
  if(e.kind==='perfect'){[523,659,784].forEach((n,i)=>this.note(n,.22,'sine',.26,i*.045));}
  if(e.kind==='shatter'||e.kind==='burst'){this.note(100,.32,'triangle',.3,0,38);this.note(780,.18,'sawtooth',.08,0,150);}
  if(e.kind==='damage'){this.note(150,.24,'triangle',.35,0,65);this.note(83,.35,'sine',.24,.06);}
  if(e.kind==='region'||e.kind==='focus'){[392,494,587,784].forEach((n,i)=>this.note(n,.42,'sine',.17,i*.075));}
  if(e.kind==='complete'){[523,659,784,1047].forEach((n,i)=>this.note(n,.6,'triangle',.17,i*.13));}
 }
 update(s,playing){if(!playing||!this.enabled)return;const beat=Math.floor(s.tick/36);if(beat===this.lastBeat)return;this.lastBeat=beat;
  const melody=[196,0,294,330,0,392,294,0],n=melody[beat%8];if(n)this.note(n,.3,'sine',.055);
 }
 reset(){this.lastBeat=-1;}
}
root.DescentAudio=Audio;
})(globalThis);
