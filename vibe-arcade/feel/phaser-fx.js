/* Feel Kit: presentation-only, scene-scoped Phaser feedback. No game/clock/network access. */
(function(root){'use strict';
const bounded=(n,lo,hi,fallback)=>Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):fallback;
function create(scene,{reduced=()=>false,random=Math.random,maxParticles=90,maxFloaters=5}={}){
 if(!scene?.add||!scene.tweens)throw Error('feel_scene_required');
 const cap=Math.floor(bounded(maxParticles,0,200,90)),floatCap=Math.floor(bounded(maxFloaters,0,20,5));
 let particles=[],floaters=[],disposed=false,quiet=!!reduced();const tweens=new Map();
 const rng=()=>bounded(random(),0,1,.5);
 function cancel(target,settle=true){const item=tweens.get(target);if(!item)return;tweens.delete(target);item.tween.remove();if(settle)item.settle?.();}
 function animate(target,config,settle){
  cancel(target);const item={tween:null,settle};tweens.set(target,item);
  item.tween=scene.tweens.add({...config,targets:target,onComplete:()=>{if(tweens.get(target)===item)tweens.delete(target);}});
 }
 function burst({x,y,texture,tint=0xffffff,count=9,reducedCount=3,scale=.22,scaleVariance=.18,spreadX=8,lift=2,liftVariance=5,gravity=.1,life=45,lifeVariance=15,spin=.15}={}){
  if(disposed||!Number.isFinite(x)||!Number.isFinite(y)||typeof texture!=='string')return 0;
  const limit=Math.floor(bounded(reduced()?reducedCount:count,0,cap,0));let made=0;
  for(let i=0;i<limit&&particles.length<cap;i++){
   const p=scene.add.image(x,y,texture).setTint(tint).setScale(bounded(scale,0,5,.22)+rng()*bounded(scaleVariance,0,5,.18));
   particles.push({p,x,y,vx:(rng()-.5)*bounded(spreadX,0,100,8),vy:-bounded(lift,0,50,2)-rng()*bounded(liftVariance,0,50,5),
    age:0,ttl:bounded(life,1,180,45)+rng()*bounded(lifeVariance,0,120,15),spin:(rng()-.5)*bounded(spin,0,1,.15),gravity:bounded(gravity,-1,2,.1)});made++;
  }return made;
 }
 function floatText({x,y,text,style={},duration=650,rise=.035}={}){
  if(disposed||floaters.length>=floatCap||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const t=scene.add.text(x,y,String(text??''),style);floaters.push({t,age:0,duration:bounded(duration,50,3000,650),rise:bounded(rise,0,1,.035)});return true;
 }
 function notice(target,text,{color='#ffefd4',delay=850,duration=280}={}){
  if(disposed||!target)return;target.setText(String(text)).setColor(color).setAlpha(1);
  animate(target,{alpha:0,delay:bounded(delay,0,5000,850),duration:bounded(duration,1,1500,280)},null);
 }
 function pulse(target,{fromX=.4,fromY=.55,toX=.47,toY=.47,duration=160}={}){
  if(disposed||!target)return;cancel(target);
  const x=bounded(toX,0,10,1),y=bounded(toY,0,10,1),settle=()=>{if(target.scene)target.setScale(x,y);};
  if(reduced()){settle();return;}
  target.setScale(bounded(fromX,0,10,x),bounded(fromY,0,10,y));
  animate(target,{scaleX:x,scaleY:y,duration:bounded(duration,1,1500,160)},settle);
 }
 function shake(duration=110,intensity=.004){
  if(disposed||reduced()||!scene.cameras?.main)return false;
  // Phaser's effect self-expires. Never reset all camera FX or overwrite another active shake.
  if(scene.cameras.main.shakeEffect?.isRunning)return false;
  scene.cameras.main.shake(bounded(duration,1,200,110),bounded(intensity,0,.008,.004));return true;
 }
 function update(dt){
  if(disposed||!Number.isFinite(dt)||dt<0)return;
  const nowQuiet=!!reduced();if(nowQuiet&&!quiet){for(const [target,item] of [...tweens])if(item.settle)cancel(target);}
  quiet=nowQuiet;
  const k=Math.min(dt/16.667,3);
  for(const q of particles){q.age+=k;q.vy+=q.gravity*k;q.x+=q.vx*k;q.y+=q.vy*k;q.p.setPosition(q.x,q.y).setAlpha(Math.max(0,1-q.age/q.ttl));q.p.rotation+=q.spin*k;}
  particles=particles.filter(q=>{if(q.age>=q.ttl){q.p.destroy();return false;}return true;});
  for(const q of floaters){q.age+=dt;q.t.y-=dt*q.rise;q.t.alpha=Math.max(0,1-q.age/q.duration);}
  floaters=floaters.filter(q=>{if(q.age>=q.duration){q.t.destroy();return false;}return true;});
 }
 function clear(){for(const target of [...tweens.keys()])cancel(target);for(const q of particles)q.p.destroy();for(const q of floaters)q.t.destroy();particles=[];floaters=[];}
 function destroy(){if(disposed)return;clear();disposed=true;scene.events?.off('shutdown',destroy);scene.events?.off('destroy',destroy);}
 scene.events?.once('shutdown',destroy);scene.events?.once('destroy',destroy);
 return Object.freeze({burst,floatText,notice,pulse,shake,update,clear,destroy,
  snapshot:()=>Object.freeze({particles:particles.length,floaters:floaters.length,tweens:tweens.size,disposed})});
}
const api=Object.freeze({create});root.LoopJoltFeelFX=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
