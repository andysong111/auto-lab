/* Original synthesized score, percussion and feedback; no downloaded music. */
(function(root){'use strict';
class Audio{
 constructor(){this.synth=LoopJoltFeelAudio.create({volume:.13,maxVoices:16});this.lastBeat=-1;}
 get enabled(){return this.synth.enabled;}
 enable(value){return this.synth.enable(value);}
 note(...args){return this.synth.note(...args);}
 destroy(){return this.synth.destroy();}
 snapshot(){return this.synth.snapshot();}
 event(e){
  if(e.kind==='bounce')this.note(125,.1,'sine',.3,0,80);
  if(e.kind==='drop')this.note(330,.16,'triangle',.28,0,620);
  if(e.kind==='seal'){[196,294,392].forEach((n,i)=>this.note(n,.3,'triangle',.14,i*.07));}
  if(e.kind==='perfect'){[523,659,784].forEach((n,i)=>this.note(n,.22,'sine',.26,i*.045));}
  if(e.kind==='shatter'||e.kind==='burst'){this.note(100,.32,'triangle',.3,0,38);this.note(780,.18,'sawtooth',.08,0,150);}
  if(e.kind==='damage'){this.note(150,.24,'triangle',.35,0,65);this.note(83,.35,'sine',.24,.06);}
  if(e.kind==='region'||e.kind==='focus'){[392,494,587,784].forEach((n,i)=>this.note(n,.42,'sine',.17,i*.075));}
  if(e.kind==='complete'){[523,659,784,1047].forEach((n,i)=>this.note(n,.6,'triangle',.17,i*.13));}
 }
 update(s,playing){if(!playing||!this.enabled)return;const beat=Math.floor(s.tick/36);if(beat===this.lastBeat)return;this.lastBeat=beat;
  const melody=[196,0,294,330,0,392,294,0],n=melody[beat%8];if(n)this.note(n,.3,'sine',.055);
 }
 reset(){this.lastBeat=-1;this.synth.clear();}
}
root.DescentAudio=Audio;
})(globalThis);
