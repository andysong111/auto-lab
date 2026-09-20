/* Deep Descent art-direction adapter. Only this file knows the game's feedback cues. */
(function(root){'use strict';
function create(scene,{reduced,region,origin,notice,helper,hero,guardian,themes,regions}){
 const fx=LoopJoltFeelFX.create(scene,{reduced,maxParticles:90,maxFloaters:5});
 function pop(text,color='#ffefd4'){helper.setAlpha(0);fx.notice(notice,text,{color,delay:850,duration:280});}
 function particles(kind,value){
  fx.burst({x:origin.x,y:origin.y,texture:kind==='shatter'||kind==='crumble'?'dd-debris':'dd-particle',
   tint:kind==='damage'?0xff7d86:kind==='shatter'?0xffcf83:themes[region()].accent,
   count:kind==='shatter'?28:kind==='damage'?14:9,reducedCount:3,scale:kind==='shatter'?.28:.22});
  if(value)fx.floatText({x:origin.x+63,y:origin.y-54,text:'+'+value,style:{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#fff5d1'}});
 }
 function events(items){for(const e of items){
  if(['drop','perfect','shatter','crumble'].includes(e.kind)){
   particles(e.kind,e.value);fx.pulse(hero,{fromX:.4,fromY:.55,toX:.47,toY:.47,duration:160});
   if(e.guardian)pop('GUARDIAN CLEARED');else if(e.kind==='perfect')pop('PERFECT DROP');else if(e.kind==='shatter')pop('BREAK THROUGH!');
  }
  if(e.kind==='seal'){pop('SEAL BROKEN · '+e.remaining+' LEFT','#e4d2ff');particles('shatter',e.value);fx.pulse(guardian,{fromX:.62,fromY:.62,toX:.54,toY:.54,duration:190});}
  if(e.kind==='burst'){pop('3-FLOOR BURST','#ffe493');particles('shatter');}
  if(e.kind==='damage'){pop(e.cause==='gate'?'WAIT FOR BLUE':'AVOID THE RED','#ffc4af');particles('damage');fx.shake(110,.004);}
  if(e.kind==='focus')pop('FOCUS · SLOWER RINGS','#d4c1ff');
  if(e.kind==='region')pop(regions[e.region].toUpperCase());
  if(e.kind==='complete')pop('ENGINE REACHED','#fff2a5');
 }}
 return Object.freeze({pop,events,update:fx.update,reset:fx.clear,destroy:fx.destroy,snapshot:fx.snapshot});
}
root.DescentFeel=Object.freeze({create});
})(globalThis);
