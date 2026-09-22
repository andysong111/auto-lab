(function(root){'use strict';root.ProductFixtureArt=(p,defects)=>{let prior='',changed=-100,lastBit=0;
return (ctx,s,size)=>{const st=s.state,key=st.stage+':'+st.mask;
 if(key!==prior){if(prior){changed=st.tick;lastBit=st.mask;}prior=key;}
 const age=st.tick-changed;p.feedback_active=!p.reduced_motion&&!defects.includes('BAD_FEEDBACK')&&age>=0&&age<18;
 p.static_feedback=p.reduced_motion&&!defects.includes('BAD_FEEDBACK')&&changed>=0;
 ctx.clearRect(0,0,size.width,size.height);ctx.fillStyle='#102332';ctx.fillRect(0,0,size.width,size.height);
 const scale=size.width/350;ctx.save();ctx.scale(scale,scale);
 ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e9f2f7';ctx.fillText('TARGET · light the matching squares',175,30);
 for(let i=0;i<5;i++){ctx.fillStyle=st.target&(1<<i)?'#ffd482':'#344b5b';ctx.fillRect(i*70+16,52,38,32);
 ctx.fillStyle=st.mask&(1<<i)?'#75f0c3':'#355267';ctx.fillRect(i*70+8,110,54,58);
 ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(String(i+1),i*70+35,146);}
 if(p.feedback_active){ctx.strokeStyle='#ffffff';ctx.lineWidth=2+age*.3;ctx.strokeRect(5+age,102,340-age*2,74);}
 if(p.static_feedback){ctx.fillStyle='#ffd482';ctx.fillRect(5,184,340,4);}
 ctx.restore();
 document.querySelector('[data-best]').textContent=s.best;
 document.querySelector('[data-product-progress]').textContent='PANELS '+st.completed+' / 3';
 const result=document.querySelector('[data-result]');result.hidden=s.phase!=='finished';result.textContent=st.outcome==='success'?'All panels complete':'Panels incomplete';
 };};})(globalThis);
