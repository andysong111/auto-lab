/* Core Pins keeps its original colors/timbres. Shared Kit owns resource lifetime. */
(function(root){'use strict';
function createFX(scene,reduced){
 if(!scene.textures.exists('cp-dot')){const g=scene.add.graphics();g.fillStyle(0xffffff,1);g.fillCircle(5,5,5);g.generateTexture('cp-dot',10,10);g.destroy();}
 const fx=LoopJoltFeelFX.create(scene,{reduced,maxParticles:64,maxFloaters:5});
 return Object.freeze({event:e=>{
  const hit=e.kind==='pin'||e.kind==='finish',bad=e.kind==='collision';if(!hit&&!bad)return;
  fx.burst({x:360,y:380,texture:'cp-dot',tint:bad?0xff657e:0xd5ff68,count:bad?16:e.kind==='finish'?24:10,reducedCount:3,scale:.4,scaleVariance:.6,spreadX:8,lift:1,liftVariance:5,gravity:.06,life:24,lifeVariance:12,spin:0});
  if(e.value)fx.floatText({x:300,y:211,text:'+'+e.value,style:{fontFamily:'system-ui',fontSize:'18px',fontStyle:'bold',color:'#d5ff68',fixedWidth:120,align:'center'},rise:50/650});
  if(bad)fx.shake(140,.008);
 },update:dt=>fx.update(dt),reset:()=>fx.clear(),destroy:()=>fx.destroy(),snapshot:()=>fx.snapshot()});
}
function createAudio(){const synth=LoopJoltFeelAudio.create({volume:.1,maxVoices:12});return Object.freeze({enable:x=>synth.enable(x),event:e=>{if(!['pin','finish','collision'].includes(e.kind))return;const bad=e.kind==='collision';synth.note(bad?120:760,.14,bad?'sawtooth':'triangle',.22,0,bad?55:1200);},reset:()=>synth.clear(),destroy:()=>synth.destroy(),snapshot:()=>synth.snapshot()});}
root.CorePinsFeel=Object.freeze({createFX,createAudio});
})(globalThis);
