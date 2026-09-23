(() => {'use strict';globalThis.CommercialFixtureArt=(presentation,defects,cue)=>{
 let prior=null,changed=-10000,lastStage=1,lastMask=0;
 return (ctx,snapshot,size)=>{
  const s=snapshot.state,key=s.stage+':'+s.mask+':'+s.outcome,now=performance.now();
  if(prior!==key){if(prior!==null){changed=now;cue(s.outcome==='success'?'success':s.outcome==='failure'?'failure':s.stage!==lastStage?'progress':'primary');}prior=key;lastStage=s.stage;lastMask=s.mask;}
  const age=now-changed,active=age>=0&&age<320&&!defects.includes('BAD_TELEPORT');
  presentation.feedback_active=active&&!presentation.reduced_motion;presentation.static_feedback=active&&presentation.reduced_motion;
  const w=size.width,h=size.height,stage=defects.includes('BAD_FLAT_PROGRESSION')?1:Math.min(s.stage,3);
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#15273b';ctx.fillRect(0,0,w,h);
  ctx.fillStyle=['#25364a','#246175','#795b30'][stage-1];ctx.fillRect(0,0,w,h*.30);
  for(let i=0;i<stage*2+1;i++){ctx.beginPath();ctx.arc(w*(i+1)/(stage*2+2),h*.14,6+stage*5,0,Math.PI*2);ctx.fillStyle='#9be6c8';ctx.fill();}
  // Local progress action transition covers the reviewed world region.
  if(active&&s.mask===0){ctx.fillStyle=presentation.reduced_motion?'#e7e184':`rgba(240,245,200,${.85*(1-age/320)})`;ctx.fillRect(0,0,w,h*.30);}
  for(let i=0;i<5;i++){
   const enabled=i<s.stage+2||defects.includes('BAD_INVISIBLE_TOPOLOGY'),bad=defects.includes('BAD_HIERARCHY');
   ctx.fillStyle=bad?'#15273b':s.target&(1<<i)?'#ffdf8e':'#485d72';ctx.fillRect(w*(i*.2+.03),h*.33,w*.11,h*.075);
   ctx.fillStyle=enabled?(s.mask&(1<<i)?'#88f4d2':'#657f98'):'#15273b';ctx.fillRect(w*(i*.2+.025),h*.49,w*.15,h*.23);
   if(!enabled){ctx.strokeStyle='#ef8f68';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(w*(i*.2+.045),h*.51);ctx.lineTo(w*(i*.2+.155),h*.70);ctx.moveTo(w*(i*.2+.155),h*.51);ctx.lineTo(w*(i*.2+.045),h*.70);ctx.stroke();}
  }
  if(active&&s.mask!==0){ctx.strokeStyle='#ffdc83';ctx.lineWidth=presentation.reduced_motion?6:4+age*.07;ctx.strokeRect(w*.005,h*.47,w*.20,h*.27);}
  if(s.outcome!=='playing'&&!defects.includes('BAD_RESULT')){ctx.fillStyle=s.outcome==='success'?'#7df0bc':'#fa926d';ctx.fillRect(0,h*.82,w,h*.18);ctx.strokeStyle='#102638';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(w*.43,h*.91);ctx.lineTo(w*.49,h*.96);ctx.lineTo(w*.6,h*.85);ctx.stroke();}
  document.querySelector('[data-best]').textContent=snapshot.best;document.querySelector('[data-product-progress]').textContent='PANELS '+s.completed+' / 3';
  const result=document.querySelector('[data-result]');result.hidden=snapshot.phase!=='finished';result.textContent=s.outcome==='success'?'All panels complete':'Panels incomplete';
 };
};})();
