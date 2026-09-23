(() => {
  'use strict';
  let reduced = false, token = -1, began = 0, lastTick = -1;
  const DURATION = 260, STATIC = 410;
  const colors = ['#e7b84e','#ec4d9a','#8de9f4'];
  function setReducedMotion(v) { reduced = !!v; }
  function presentation() { const active = token >= 0 && performance.now() - began < (reduced ? STATIC : DURATION); return { reduced_motion:reduced, feedback_active:active, static_feedback:reduced && active }; }
  function round(ctx,x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
  function center(cell,l,t,s) { return [l + (cell % 4 + .5) * s / 4, t + ((cell / 4 | 0) + .5) * s / 4]; }
  function keyName(mask) { return mask === 1 ? 'A' : mask === 2 ? 'B' : 'AB'; }
  function edge(room,a,b) { const lo=Math.min(a,b),hi=Math.max(a,b); return room[0].find((e)=>e[0]===lo&&e[1]===hi); }
  function draw(ctx,snapshot,size) {
    const s=snapshot.state, w=size.width,h=size.height, now=performance.now();
    if (s.tick < lastTick) token=-1;
    if (s.feedback_token !== token) { token=s.feedback_token; began=now; }
    lastTick=s.tick;
    const sc=Math.min(w/390,h/350), font=(n)=>Math.max(14,Math.round(n*sc));
    ctx.clearRect(0,0,w,h); const bg=ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,'#243640');bg.addColorStop(1,'#080d13');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const room=s.stage<=3 ? globalThis.KeywakeCore.roomFor(s.seed,s.stage) : null;
    const side=Math.min(w*.70,h*.55,222*sc), left=(w-side)/2, top=48*sc, cs=side/4;
    ctx.textAlign='center';ctx.font='800 '+font(16)+'px system-ui';ctx.fillStyle='#d9f4f2';ctx.fillText(s.stage<=3?'ROOM '+s.stage+' · PAR '+room[3]:'VAULT OPEN',w/2,22*sc);
    ctx.font='700 '+font(14)+'px system-ui';ctx.fillStyle='#9ebbc0';ctx.fillText(s.stage<=3?'MOVES '+s.room_moves+' · TOTAL '+s.total_moves+' / '+s.total_par:'ALL EXITS REACHED',w/2,42*sc);
    round(ctx,left-8*sc,top-8*sc,side+16*sc,side+16*sc,12*sc);ctx.fillStyle='#111d25';ctx.fill();
    if (room) {
      const floors=new Set(); room[0].forEach((e)=>{floors.add(e[0]);floors.add(e[1]);});
      for(let c=0;c<16;c++) { const x=left+c%4*cs,y=top+(c/4|0)*cs; round(ctx,x+2*sc,y+2*sc,cs-4*sc,cs-4*sc,6*sc);ctx.fillStyle=floors.has(c)?'#314750':'#101820';ctx.fill();ctx.strokeStyle=floors.has(c)?'#587079':'#1b2830';ctx.lineWidth=Math.max(1,sc);ctx.stroke(); }
      room[0].forEach((e)=>{ if(!e[2])return; const open=(s.key_mask&e[2])===e[2], a=center(e[0],left,top,side),b=center(e[1],left,top,side);ctx.strokeStyle=open?'#3a6870':colors[e[2]===2?1:e[2]===1?0:2];ctx.lineWidth=open?3*sc:6*sc;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke(); if(!open){ctx.fillStyle='#f4f6e9';ctx.font='800 '+font(14)+'px system-ui';ctx.fillText(keyName(e[2]),(a[0]+b[0])/2,(a[1]+b[1])/2+5*sc);} });
      const held=(s.key_mask.toString(2).match(/1/g)||[]).length, open=held===room[1].length, ex=center(room[2],left,top,side);ctx.fillStyle=open?'#b7f5e8':'#6f6043';round(ctx,ex[0]-cs*.19,ex[1]-cs*.24,cs*.38,cs*.48,5*sc);ctx.fill();ctx.strokeStyle=open?'#edfff4':'#d4a84e';ctx.lineWidth=2*sc;ctx.stroke();ctx.fillStyle='#172128';ctx.fillRect(ex[0]-cs*.07,ex[1]-cs*.02,cs*.14,cs*.18);
      room[1].forEach((cell,i)=>{if(s.key_mask&(1<<i))return;const p=center(cell,left,top,side),col=colors[i];ctx.strokeStyle=col;ctx.lineWidth=4*sc;ctx.beginPath();ctx.arc(p[0]-6*sc,p[1],6*sc,0,Math.PI*2);ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+15*sc,p[1]);ctx.moveTo(p[0]+10*sc,p[1]);ctx.lineTo(p[0]+10*sc,p[1]+6*sc);ctx.stroke();ctx.fillStyle='#fff';ctx.font='800 '+font(14)+'px system-ui';ctx.fillText('ABC'[i],p[0],p[1]-13*sc);});
    }
    const active=token>=0&&now-began<(reduced?STATIC:DURATION), from=center(s.feedback_from,left,top,side),to=center(s.feedback_to,left,top,side);let p=to;
    if(active&&!reduced&&s.feedback_kind!=='blocked'){const q=Math.min(1,(now-began)/DURATION);p=[from[0]+(to[0]-from[0])*q,from[1]+(to[1]-from[1])*q];ctx.strokeStyle='#58d9d8';ctx.globalAlpha=.55;ctx.lineWidth=4*sc;ctx.beginPath();ctx.moveTo(from[0],from[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.globalAlpha=1;}
    if(active&&(reduced||s.feedback_kind==='blocked')){ctx.strokeStyle=s.feedback_kind==='blocked'?'#ff887d':'#f5ff8d';ctx.lineWidth=4*sc;ctx.strokeRect(to[0]-cs*.28,to[1]-cs*.28,cs*.56,cs*.56);}
    ctx.fillStyle='#5df0ec';ctx.beginPath();ctx.arc(p[0],p[1],cs*.14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9ffff';ctx.beginPath();ctx.arc(p[0]-cs*.04,p[1]-cs*.04,cs*.035,0,Math.PI*2);ctx.fill();
    const labels=['LEFT','UP','RIGHT','DOWN'],py=h*.80,ph=h*.18;for(let i=0;i<4;i++){const x=i*w/4+4*sc,pw=w/4-8*sc;round(ctx,x,py,pw,ph,9*sc);ctx.fillStyle='#213943';ctx.fill();ctx.strokeStyle='#62828b';ctx.lineWidth=1.5*sc;ctx.stroke();ctx.fillStyle='#e7f6f4';ctx.font='800 '+font(14)+'px system-ui';ctx.fillText(labels[i],x+pw/2,py+ph*.58);}
  }
  globalThis.KeywakeArt={draw,presentation,setReducedMotion};
})();
