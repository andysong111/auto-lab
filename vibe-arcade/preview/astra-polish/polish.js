/* Presentation-only state. Never changes canonical positions, damage, time or RNG. */
(function(root){'use strict';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const palette=[{accent:'#97f7d5',gold:'#e8d4a3',metal:'#adc9bb',deep:'#183d47'}, {accent:'#c0b9ff',gold:'#e3d9b6',metal:'#b0accb',deep:'#292d54'}, {accent:'#ffce8d',gold:'#ffe4b7',metal:'#d0b69e',deep:'#4a293c'}];
let quality='high';
function poly(c,p,fill,stroke,w=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function line(c,p,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.stroke();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function ring(c,x,y,r,color,w=1,a0=0,a1=TAU){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(x,y,r,a0,a1);c.stroke();}
const lights=new Map();
function glow(c,x,y,r,color,alpha=.35){let v=lights.get(color);if(!v){v=document.createElement('canvas');v.width=v.height=96;const q=v.getContext('2d'),g=q.createRadialGradient(48,48,1,48,48,48);g.addColorStop(0,color);g.addColorStop(.25,color+'90');g.addColorStop(1,color+'00');q.fillStyle=g;q.fillRect(0,0,96,96);lights.set(color,v);}c.save();c.globalAlpha*=alpha;c.drawImage(v,x-r,y-r,r*2,r*2);c.restore();}
function metal(c,x1,y1,x2,y2,t,bright=false){const g=c.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,bright?'#fff9dc':'#eaf3df');g.addColorStop(.18,t.metal);g.addColorStop(.45,bright?t.gold:t.metal);g.addColorStop(.51,'#668480');g.addColorStop(1,t.deep);return g;}
// Armor attachments are drawn as articulated parts rather than scaling one flat polygon.
function hero(c,x,y,tier=0,time=0,aim=-Math.PI/2,scale=1,moving=false,pose={}){
 const t=palette[Math.min(2,Math.floor(tier/3))],motion=pose.motion!==false,gait=motion?(pose.gait??time*12):0,
 stride=motion?(pose.speed??(moving?1:0)):0,lean=motion?(pose.lean||0):0,recoil=motion?(pose.recoil||0):0,bob=motion?Math.sin(time*3)*1.1+Math.abs(Math.sin(gait))*stride*1.6:0;
 c.save();c.translate(x,y);c.scale(scale,scale);
 oval(c,2,8,22+tier*.7,8,'#020c164d');oval(c,2,8,14,4,'#020c1666');glow(c,0,-2,32,t.accent,.13);
 // The ground anchor is never leaned or displaced; collision stays readable.
 c.save();c.translate(0,-bob);c.rotate(lean*.07);if(recoil)c.translate(-Math.cos(aim)*recoil*2.1,-Math.sin(aim)*recoil*1.2);
 // Split cloth panels trail the acceleration and settle after releasing movement.
 const flutter=motion?Math.sin(time*7)*1.7+lean*5:0;
 for(const side of [-1,1]){poly(c,[[side*8,-31],[side*19,-23],[side*(24+tier*.4)-flutter,19],[side*7-flutter*.4,8]],t.deep,t.accent+'55',.9);line(c,[[side*12,-22],[side*16-flutter*.6,10]],t.gold+'44');}
 // Three wing configurations grow independently of the torso.
 if(tier>=4)for(const side of [-1,1]){const f=motion?Math.sin(time*3.8+side)*.03:0;c.save();c.translate(side*15,-28);c.rotate(side*(.05+f+stride*.12));
  const reach=23+(tier-4)*2.7;poly(c,[[0,0],[side*reach,-25],[side*(reach-4),-10],[side*10,16]],metal(c,0,-25,side*reach,15,t),t.gold,.9);
  const feathers=tier>=7?4:3;for(let i=0;i<feathers;i++){const a=5+i*6,top=-10-i*4;poly(c,[[side*a,top],[side*(reach+10-i*3),top-20+i*2],[side*(reach-1-i*3),top+4],[side*(a-2),top+14]],i%2?t.deep:t.metal,t.gold+'aa',.7);line(c,[[side*(a+2),top],[side*(reach+3-i*3),top-11]],t.accent+'b0',1);}
  c.restore();}
 // Boots/joints step in opposition, planted at the original collision anchor.
 for(const side of [-1,1]){const lift=Math.sin(gait+ (side===1?Math.PI:0))*stride*4;
  line(c,[[side*7,-9],[side*10,1+lift],[side*10,11+lift]],'#0d2734',8);
  oval(c,side*9,-2+lift,4,3,t.gold);poly(c,[[side*5,0+lift],[side*14,0+lift],[side*16,12+lift],[side*4,12+lift]],metal(c,side*5,0,side*16,12,t),t.deep,1);
  line(c,[[side*5,10+lift],[side*14,10+lift]],t.accent,1.4);
 }
 // Spine reactor and layered breastplate with carved seams.
 poly(c,[[-14,-31],[-9,-10],[0,-4],[9,-10],[14,-31],[0,-37]],t.deep,'#8abaaa',1);
 poly(c,[[-17,-30],[-11,-11],[0,-5],[11,-11],[17,-30],[0,-39]],metal(c,-15,-37,17,-5,t),t.deep,1.5);
 poly(c,[[-13,-29],[-9,-13],[-2,-8],[-4,-25]],'#eef4d570');poly(c,[[13,-29],[9,-13],[2,-8],[4,-25]],t.deep+'90');
 poly(c,[[-7,-29],[0,-34],[7,-29],[5,-17],[0,-12],[-5,-17]],'#102c39',t.gold,.8);
 glow(c,0,-24,11,t.accent,.48);poly(c,[[0,-31],[4,-25],[0,-17],[-4,-25]],t.accent,'#f4ffe6',.8);
 line(c,[[-10,-28],[-8,-20]],t.gold,1);line(c,[[10,-28],[8,-20]],t.gold,1);
 // Shoulder armor gains a second plate and inset energy channels.
 for(const side of [-1,1]){const a=motion?Math.sin(gait+side)*stride*1.7:0;c.save();c.translate(0,a);
  poly(c,[[side*13,-32],[side*24,-30],[side*28,-18],[side*20,-12],[side*13,-17]],metal(c,side*13,-33,side*28,-12,t),t.deep,1.3);
  line(c,[[side*16,-30],[side*23,-28],[side*25,-20]],'#f5efd69a',.85);
  if(tier>=1){poly(c,[[side*14,-33],[side*23,-38],[side*30,-31],[side*26,-23],[side*18,-27]],metal(c,side*14,-38,side*30,-23,t,true),t.deep,1);line(c,[[side*20,-33],[side*26,-30]],t.accent,1.6);}
  if(tier>=3){poly(c,[[side*25,-31],[side*34,-41],[side*30,-22]],t.gold,t.deep,.7);}
  c.restore();}
 // Recoiling blaster with a proper barrel, aperture and tier-dependent rails.
 c.save();c.rotate(aim);c.translate(-recoil*3,0);
 poly(c,[[8,-8],[30,-9],[35,-5],[35,5],[30,8],[8,8]],metal(c,7,-8,35,8,t),t.deep,1.3);
 poly(c,[[18,-6],[38,-6],[42,-3],[42,3],[18,4]],t.deep,t.metal,.9);
 line(c,[[17,-7],[32,-7]],t.gold,1);line(c,[[20,-2],[40,-2]],t.accent,1.8);
 if(tier>=2){line(c,[[22,-10],[43,-10]],t.gold,2);line(c,[[22,8],[43,8]],t.gold,2);}
 if(tier>=6){poly(c,[[30,-12],[44,-9],[45,-6],[28,-7]],t.accent+'77',t.gold,.7);}
 if(recoil>.12){glow(c,45,0,12,t.accent,recoil*.5);poly(c,[[42,-4],[49,-2],[59+recoil*6,0],[49,2],[42,4]],'#edffe3',t.accent,.7);}
 c.restore();
 // Faceted helmet with a raised jaw, brow, paired optics and venting.
 poly(c,[[-14,-47],[-8,-57],[8,-57],[14,-47],[12,-33],[0,-27],[-12,-33]],metal(c,-15,-57,17,-29,t),t.deep,1.7);
 poly(c,[[-11,-49],[-6,-55],[6,-55],[10,-50],[0,-48]],'#ffffe399');line(c,[[-11,-47],[0,-50],[11,-47]],t.gold,.8);
 poly(c,[[-11,-44],[11,-44],[9,-35],[0,-32],[-9,-35]],'#061e2e',t.metal,.7);
 line(c,[[-8,-40],[-2,-39]],t.accent,2.1);line(c,[[2,-39],[8,-40]],t.accent,2.1);line(c,[[-2,-34],[2,-34]],t.gold,.8);
 line(c,[[-12,-42],[-12,-36]],'#f5ecd277',.9);line(c,[[12,-42],[12,-36]],t.accent+'66',.9);
 if(tier>=1)poly(c,[[-3,-56],[0,-68-tier*.8],[4,-56],[0,-53]],t.gold,t.deep,.8);
 if(tier>=5)for(const side of [-1,1]){poly(c,[[side*12,-46],[side*21,-53],[side*20,-36],[side*13,-34]],metal(c,side*12,-53,side*21,-34,t,true),t.deep,.8);line(c,[[side*16,-44],[side*18,-48]],t.accent,1);}
 if(tier>=7){c.strokeStyle=t.gold+'bb';c.lineWidth=1.3;c.beginPath();c.ellipse(0,-65,24,7,0,0,TAU);c.stroke();for(let i=0;i<3;i++)poly(c,[[-9+i*7,-57],[-6+i*7,-71],[i*7,-57]],t.gold);}
 if(tier>=8){for(const side of [-1,1]){poly(c,[[side*36,-29],[side*60,-58],[side*48,-27],[side*31,-9]],t.accent+'22',t.gold+'99',.8);line(c,[[side*42,-28],[side*54,-47]],t.accent+'a0',1);}}
 c.restore();c.restore();
}
function decorate(canvas,region){const c=canvas.getContext('2d'),t=palette[region];c.save();
 // Bake low-contrast stone bevels and chipped tesserae once, not on every frame.
 poly(c,[[66,107],[654,107],[685,146],[685,707],[635,749],[85,749],[35,707],[35,146]]);c.clip();
 for(let row=0;row<13;row++)for(let col=0;col<10;col++){const x=col*76+(row%2?-36:0),y=108+row*51;line(c,[[x+3,y+3],[x+70,y+3]],'#ecf0d914',1);line(c,[[x+72,y+5],[x+72,y+47],[x+3,y+47]],'#010d182d',1);
  if((row*11+col*7)%9===0){poly(c,[[x+8,y+5],[x+19,y+8],[x+14,y+14],[x+6,y+11]],'#dae0c508');}
 }
 // Geometric mosaic inlays and a refracted edge light change by world.
 for(let i=0;i<24;i++){const a=i*TAU/24,x=360+Math.cos(a)*206,y=429+Math.sin(a)*179;c.save();c.translate(x,y);c.rotate(a);poly(c,[[-3,-7],[3,-7],[6,0],[3,7],[-3,7],[-6,0]],null,t.gold+'35',.7);c.restore();}
 for(const side of [-1,1]){line(c,[[360+side*270,159],[360+side*270,685]],t.accent+'30',1);for(const y of [210,380,548,682]){const x=360+side*270;poly(c,[[x,y-6],[x+4,y],[x,y+6],[x-4,y]],t.gold+'99');}}
 // Keep cinematic shafts low-opacity and static: projectiles remain foreground.
 const g=c.createLinearGradient(480,100,180,730);g.addColorStop(0,t.accent+'10');g.addColorStop(.7,t.accent+'02');g.addColorStop(1,'#00000000');poly(c,[[430,103],[540,103],[311,743],[160,743]],g);
 c.restore();
 // Outside the playable platform, foreground vines / prism shards / solar rubble.
 for(let i=0;i<7;i++){const x=48+i*106,y=779+(i%3)*8;if(region===0){line(c,[[x,y-14],[x+4,y+18],[x-4,y+41]],'#578f78',2);for(let j=0;j<3;j++)oval(c,x+4-j*3,y+j*10,6,2.4,'#8ab08b77');}else if(region===1){poly(c,[[x,y-14],[x+9,y+8],[x+4,y+31],[x-7,y+9]],'#8b84cb44',t.accent+'44');}else{poly(c,[[x-10,y],[x+9,y-7],[x+19,y+12],[x-5,y+19]],'#81595655',t.gold+'25');}}
 return canvas;
}
function create(){let trails=[],bursts=[],sparks=[],waves=[],enemyRecoil=new Map(),px=360,py=540,lastTick=-1,lean=0,speed=0,gait=0,recoil=0,hurt=0,age=0,motion=true,tier=-1;
 function reset(){trails=[];bursts=[];sparks=[];waves=[];enemyRecoil.clear();lastTick=-1;lean=speed=gait=recoil=hurt=age=0;tier=-1;}
 function effects(events){for(const e of events){
  if(e.kind==='shot')recoil=1;
  if(e.kind==='hurt'){hurt=.28;}
  if(e.kind==='hit'){enemyRecoil.set(e.id,{life:.13,dx:e.dx||0,dy:e.dy||-1});for(let i=0;i<(quality==='low'?2:4)&&sparks.length<64;i++){const a=age*4.73+i*2.4;sparks.push({x:e.x,y:e.y,vx:Math.cos(a)*(38+i*17),vy:Math.sin(a)*(38+i*17),life:.19+i*.015,max:.25,color:'#f6e0b4'});}}
  if(e.kind==='kill'&&bursts.length<20){bursts.push({x:e.x,y:e.y,life:e.boss?.65:.26,max:e.boss?.65:.26,r:e.boss?65:22,boss:!!e.boss});}
  if(e.kind==='evolve'){waves.push({life:.65,max:.65,tier:e.tier});}
 }}
 function advance(s,dt,reduced=false,paused=false){motion=!reduced;dt=paused?0:Math.min(.05,Math.max(0,dt));age+=dt;const p=s.player;
  if(tier!==s.tier){tier=s.tier;trails=[];}const ticks=lastTick<0?1:Math.max(1,s.tick-lastTick),dx=lastTick<0?0:(p.x-px)/ticks,dy=lastTick<0?0:(p.y-py)/ticks;
  const smoothing=1-Math.exp(-18*dt);speed+=(Math.min(1,Math.hypot(dx,dy)/3.3)-speed)*smoothing;lean+=(clamp(dx/3.3,-1,1)-lean)*smoothing;gait+=dt*(4+speed*11);recoil=Math.max(0,recoil-dt*9);hurt=Math.max(0,hurt-dt);
  if(s.tick!==lastTick){if(p.dash>0&&motion){trails.push({x:p.x,y:p.y,life:.18,max:.18,tier:s.tier,aim:p.aim??-Math.PI/2});const cap=quality==='low'?3:7;while(trails.length>cap)trails.shift();}px=p.x;py=p.y;lastTick=s.tick;}
  for(const a of [trails,bursts,sparks,waves])for(const f of a){f.life-=dt;if(f.vx){f.x+=f.vx*dt;f.y+=f.vy*dt;}}
  trails=trails.filter(x=>x.life>0);bursts=bursts.filter(x=>x.life>0);sparks=sparks.filter(x=>x.life>0);waves=waves.filter(x=>x.life>0).slice(-2);
  for(const [id,r] of enemyRecoil){r.life-=dt;if(r.life<=0)enemyRecoil.delete(id);}return {speed,gait,lean,recoil,motion};
 }
 function before(c,s){const t=palette[Math.min(2,Math.floor((s.stage-1)/3))];
  if(motion)for(const f of trails){c.save();c.globalAlpha=(f.life/f.max)*.18;hero(c,f.x,f.y,f.tier,0,f.aim,1,false,{motion:false});c.restore();}
  for(const b of bursts){const p=1-b.life/b.max;c.save();c.globalAlpha=(1-p)*.75;ring(c,b.x,b.y,b.r*(.25+p),b.boss?t.gold:'#f6c0a5',b.boss?3:1.7);if(quality!=='low')for(let i=0;i<6;i++){const a=i*TAU/6;line(c,[[b.x+Math.cos(a)*b.r*p,b.y+Math.sin(a)*b.r*p],[b.x+Math.cos(a)*(b.r*p+9*(1-p)),b.y+Math.sin(a)*(b.r*p+9*(1-p))]],t.gold,1.4);}c.restore();}
  for(const f of sparks){c.save();c.globalAlpha=Math.max(0,f.life/f.max);line(c,[[f.x,f.y],[f.x-f.vx*.023,f.y-f.vy*.023]],f.color,1.4);c.restore();}
  if(s.player.dash>0){const p=s.player,a=Math.atan2(p.dy,p.dx);c.save();c.translate(p.x,p.y);c.rotate(a);line(c,[[-35,-13],[10,-13]],t.accent+'77',1);line(c,[[-43,13],[7,13]],t.accent+'aa',1.5);c.restore();}
  for(const w of waves){const p=1-w.life/w.max;c.save();c.globalAlpha=motion?(1-p)*.7:.22;ring(c,s.player.x,s.player.y,motion?28+p*90:38,t.accent,1.5);c.restore();}
 }
 function telegraphs(c,s){const t=palette[Math.min(2,Math.floor((s.stage-1)/3))];
  for(const z of s.zones){const q=clamp(z.age/z.delay,0,1);c.save();c.globalAlpha=z.age>=z.delay?.65:.8;ring(c,z.x,z.y,z.r,'#ffe0a0',1,-Math.PI/2,-Math.PI/2+TAU*q);for(let i=0;i<4;i++){const a=i*TAU/4;line(c,[[z.x+Math.cos(a)*(z.r+3),z.y+Math.sin(a)*(z.r+3)],[z.x+Math.cos(a)*(z.r+8),z.y+Math.sin(a)*(z.r+8)]],'#ffcad0',1.5);}c.restore();}
  for(const e of s.enemies){if(e.type!=='boss'||e.warning>0)continue;
   // Telegraph exactly the coming radial shot angles, not random decorative lines.
   if(e.cool>0&&e.cool<=50){const n=8+e.boss*2+(e.phase===2?4:0),q=1-e.cool/50;c.save();c.globalAlpha=.2+q*.5;for(let i=0;i<n;i++){const a=e.attack*.29+i*TAU/n,r0=e.r+18,r1=r0+13+q*20;line(c,[[e.x+Math.cos(a)*r0,e.y+Math.sin(a)*r0],[e.x+Math.cos(a)*r1,e.y+Math.sin(a)*r1]],'#ffc38e',2);}c.restore();}
   if(e.phase===2)ring(c,e.x,e.y,e.r+9,'#ff968066',1.2);
  }
 }
 function enemyPose(c,e){const r=enemyRecoil.get(e.id);if(!r||!motion)return;c.translate(r.dx*r.life*12,r.dy*r.life*12);}
 function finish(c,s){if(hurt>0){c.save();const g=c.createRadialGradient(360,420,265,360,420,490);g.addColorStop(0,'#c9496400');g.addColorStop(1,'#ce4a64');c.globalAlpha=Math.min(.20,hurt*.6);c.fillStyle=g;c.fillRect(0,0,720,820);c.restore();}}
 return {reset,effects,advance,before,telegraphs,enemyPose,finish,resources:()=>({afterimages:trails.length,hitSparks:sparks.length,deathRings:bursts.length,evolutionRings:waves.length,glowTextures:lights.size}),pose:()=>({speed,gait,lean,recoil,motion})};
}
const api={hero,decorate,create,setQuality(q){if(!['low','high'].includes(q))throw Error('invalid_fx_quality');quality=q;},get quality(){return quality;}};root.AstraPolish=Object.freeze(api);
})(globalThis);
