/* Original code-painted world, creatures and evolving sentinel. No third-party art. */
(function(root){'use strict';
const TAU=Math.PI*2,THEMES=[
 {ink:'#102d34',sky:'#143b43',floor:'#193e43',tile:'#21484b',edge:'#698976',light:'#85f5d1',gold:'#d6c18b',mist:'#84b6a0',name:'VERDANT RELIQUARY'},
 {ink:'#171f3a',sky:'#302a53',floor:'#282a4b',tile:'#343552',edge:'#7971a0',light:'#b6a5ff',gold:'#d3cbe7',mist:'#9780bb',name:'PRISM FOUNDRY'},
 {ink:'#2b1d2a',sky:'#592f37',floor:'#443039',tile:'#563d42',edge:'#bd8868',light:'#ffcf84',gold:'#ffdfa3',mist:'#d78c63',name:'SOLAR CITADEL'}
];
function poly(c,pts,fill,stroke,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function line(c,pts,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}
function glow(c,x,y,r,color,alpha=.4){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function seed(n){return()=>((n=Math.imul(n,1664525)+1013904223)>>>0)/4294967296;}
function background(region){const t=THEMES[region],v=document.createElement('canvas');v.width=720;v.height=820;const c=v.getContext('2d'),r=seed(330+region);
const bg=c.createLinearGradient(0,0,0,820);bg.addColorStop(0,t.sky);bg.addColorStop(.65,t.ink);bg.addColorStop(1,'#060d19');c.fillStyle=bg;c.fillRect(0,0,720,820);
glow(c,565,68,270,t.light,.18);ellipse(c,574,67,39,39,t.gold+'a0');ellipse(c,560,57,35,35,t.sky);
for(let i=0;i<55;i++)ellipse(c,r()*720,r()*820,r()*1.2+.4,r()*1.2+.4,t.gold+'60');
// Distant architecture changes by world, not just a palette swap.
for(let i=0;i<15;i++){const x=i*59-65,y=64+r()*160; if(region===0){poly(c,[[x,y],[x+60,y+4],[x+47,y+75],[x+20,y+97]],'#15353ecc');line(c,[[x+4,y],[x+57,y+4]],t.mist+'77',4);line(c,[[x+25,y],[x+17,y+120]],'#75b3a040',2);}else if(region===1){poly(c,[[x,y-75],[x+24,y+8],[x+8,y+75],[x-14,y]],'#54487566',t.mist+'33');poly(c,[[x,y-75],[x+1,y+65],[x-14,y]],t.light+'18');}else{c.fillStyle='#351f2baa';c.fillRect(x,y-70,20,150);c.strokeStyle=t.gold+'33';c.lineWidth=4;c.beginPath();c.arc(x+10,y+20,38,0,TAU);c.stroke();}}
// A suspended, beveled temple platform with readable walkable bounds.
const floor=[[65,103],[655,103],[689,145],[689,711],[638,753],[82,753],[31,711],[31,145]];
poly(c,floor.map(([x,y])=>[x,y+28]),'#0b1926','#23333f',3);poly(c,[[31,711],[82,753],[638,753],[689,711],[689,744],[638,786],[82,786],[31,744]],'#18262b',t.edge+'77');
poly(c,floor,t.floor,t.edge,2);c.save();poly(c,floor);c.clip();
for(let row=0;row<13;row++)for(let col=0;col<10;col++){const x=col*76+(row%2?-36:0),y=108+row*51;poly(c,[[x,y],[x+73,y],[x+73,y+48],[x,y+48]],r()>.5?t.tile:t.floor,'#ffffff05');if(r()>.87)line(c,[[x+8,y+4],[x+19,y+20],[x+16,y+32]],t.edge+'25');}
const wash=c.createLinearGradient(30,0,680,800);wash.addColorStop(0,t.light+'10');wash.addColorStop(.5,'#00000000');wash.addColorStop(1,'#00000050');c.fillStyle=wash;c.fillRect(0,100,720,700);
c.strokeStyle=t.edge+'45';c.lineWidth=2;for(const rad of [102,156,208]){c.beginPath();c.ellipse(360,429,rad,rad*.87,0,0,TAU);c.stroke();}
for(let i=0;i<12;i++){const a=i*TAU/12;c.save();c.translate(360+Math.cos(a)*181,429+Math.sin(a)*157);c.rotate(a+Math.PI/2);line(c,[[-6,-10],[6,-10],[0,0],[6,10],[-6,10]],t.gold+'55',1.5);c.restore();}
poly(c,[[360,376],[409,429],[360,482],[311,429]],null,t.light+'25',2);poly(c,[[360,397],[389,429],[360,461],[331,429]],t.light+'06',t.light+'22');c.restore();
for(const side of [-1,1])for(const y of [150,320,490,674]){const x=360+side*304;ellipse(c,x+9,y+19,26,12,'#00000035');poly(c,[[x-16,y],[x+16,y],[x+13,y+26],[x-13,y+26]],'#253636',t.edge);poly(c,[[x-21,y-9],[x,y-20],[x+21,y-9],[x,y+2]],t.gold+'99',t.edge);poly(c,[[x-12,y-12],[x-9,y-57],[x+9,y-57],[x+12,y-12]],t.ink,t.edge);ellipse(c,x,y-54,14,7,t.edge);ellipse(c,x,y-58,8,5,t.light);glow(c,x,y-57,37,t.light,.28);if(region===0){line(c,[[x-5,y-20],[x-20,y+15],[x-13,y+54]],'#539c78',3);for(let i=0;i<3;i++)ellipse(c,x-12-i*2,y+10+i*12,6,3,'#76a788');}if(region===1){poly(c,[[x,y-94],[x+10,y-64],[x,y-49],[x-10,y-64]],t.light+'aa',t.gold);}if(region===2){for(let i=0;i<3;i++)poly(c,[[x-9+i*8,y-52],[x-7+i*8,y-83-i%2*12],[x-3+i*8,y-52]],'#ffcf86aa');}}
// Exit gate and stairs. Visual only: room clears drive progression.
for(let i=0;i<5;i++)poly(c,[[284-i*9,96+i*8],[436+i*9,96+i*8],[445+i*9,104+i*8],[275-i*9,104+i*8]],i%2?t.floor:t.tile,t.edge+'50');
for(const x of [296,424]){poly(c,[[x-15,115],[x-15,37],[x+15,37],[x+15,115]],t.ink,t.edge,2);poly(c,[[x-20,39],[x,28],[x+20,39],[x,50]],t.gold+'aa',t.edge);}
line(c,[[297,45],[319,17],[401,17],[423,45]],t.gold+'aa',9);line(c,[[312,75],[333,48],[387,48],[408,75]],t.light+'aa',2);
for(let i=0;i<8;i++){const x=95+i*76;poly(c,[[x,765],[x+40,765],[x+25,811],[x+10,795]],'#203036',t.edge+'33');}
return v;}
function hero(c,x,y,tier=0,time=0,aim=-Math.PI/2,scale=1,moving=false){const t=THEMES[Math.min(2,Math.floor(tier/3))],gold=tier>=6?'#fff1b5':tier>=3?'#c8bcf2':'#cce9de',bob=Math.sin(time*4)*1.6;
c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,7,21+tier,9,'#00000055');glow(c,0,1,31+tier,t.light,.2);c.translate(0,bob);
// Cape, then mechanical wings, then armor: each tier has a visible addition.
const wind=Math.sin(time*7)*(moving?6:2);poly(c,[[-10,-21],[-23-wind,13],[-5,7],[0,18],[6,7],[23-wind,13],[10,-21]],tier>=6?'#de9c6544':'#245b6788',t.light+'44');
if(tier>=4)for(const side of [-1,1]){poly(c,[[side*12,-29],[side*(41+(tier-4)*3),-44],[side*32,-14],[side*17,0]],'#324857',gold,1.3);poly(c,[[side*19,-26],[side*33,-34],[side*26,-11]],t.light+'70');}
if(tier>=7){c.strokeStyle=t.gold+'aa';c.lineWidth=2;c.beginPath();c.ellipse(0,-54,28,9,0,0,TAU);c.stroke();for(let i=0;i<3;i++)poly(c,[[-7+i*7,-49],[-4+i*7,-62],[i*7,-49]],t.gold);}
const step=moving?Math.sin(time*18)*5:0;for(const side of [-1,1]){c.fillStyle='#152b3a';c.fillRect(side<0?-13:4,-7,9,18+step*side);poly(c,[[side*5,5+step*side],[side*14,5+step*side],[side*16,13+step*side],[side*4,13+step*side]],gold,'#304957',1);}
poly(c,[[-16,-29],[-11,-8],[0,0],[11,-8],[16,-29],[0,-36]],gold,'#263e4a',2);poly(c,[[-7,-28],[0,-33],[7,-28],[5,-13],[0,-8],[-5,-13]],'#173848',t.light,1);ellipse(c,0,-22,4,6,t.light);
for(const side of [-1,1]){poly(c,[[side*13,-32],[side*(22+(tier>=1?4:0)),-30],[side*(24+(tier>=1?4:0)),-15],[side*14,-18]],tier>=1?gold:'#577b83','#263e4a',1.5);if(tier>=2)line(c,[[side*18,-27],[side*23,-24]],t.light,3);}
// Blaster follows the auto-target; muzzle position is cosmetic, bullets use the ground origin.
c.save();c.rotate(aim);c.fillStyle='#28414b';c.fillRect(6,-7,27+(tier>=2?5:0),12);poly(c,[[13,-9],[32,-8],[38,-4],[32,0],[13,0]],gold,'#294450');line(c,[[23,-4],[38,-4]],t.light,3);c.restore();
const helmet=c.createLinearGradient(-14,-55,12,-26);helmet.addColorStop(0,'#f1f4e5');helmet.addColorStop(.5,gold);helmet.addColorStop(1,'#72958e');poly(c,[[-14,-46],[-8,-55],[8,-55],[14,-46],[12,-32],[0,-26],[-12,-32]],helmet,'#24414a',2);poly(c,[[-10,-44],[10,-44],[8,-35],[-8,-35]],'#092e3d');line(c,[[-8,-40],[8,-40]],t.light,2.5);line(c,[[-8,-50],[4,-50]],'#ffffff88',1.5);
if(tier>=1)poly(c,[[-3,-54],[0,-65-tier],[4,-54]],t.gold,'#324a51');if(tier>=5)for(const side of [-1,1])line(c,[[side*12,-44],[side*21,-51],[side*20,-35]],t.gold,2);
if(tier>=8){glow(c,0,-23,24,t.light,.2);for(const side of [-1,1])poly(c,[[side*32,-33],[side*58,-64],[side*42,-25]],t.light+'44',t.gold+'99');}
c.restore();}
function enemy(c,e,time,theme){c.save();c.translate(e.x,e.y);const w=e.warning>0?Math.max(.1,1-e.warning/100):1;c.globalAlpha=w;ellipse(c,3,9,e.r*1.2,e.r*.45,'#00000055');const hurt=e.flash>0,red=hurt?'#fff4db':'#fc8494',dark=theme.ink,metal=hurt?'#ffdfd0':'#665267';
if(e.type==='boss'){
 const b=e.boss,size=1+b*.08;c.scale(size,size);glow(c,0,-5,80,theme.light,.17);c.save();c.rotate(time*.28);for(let i=0;i<6+b;i++){const a=i*TAU/(6+b);poly(c,[[Math.cos(a)*64,Math.sin(a)*64-14],[Math.cos(a+.15)*42,Math.sin(a+.15)*42-14],[Math.cos(a-.15)*42,Math.sin(a-.15)*42-14]],theme.gold+'bb',theme.light+'66');}c.restore();
for(const side of [-1,1]){poly(c,[[side*26,-39],[side*64,-51],[side*72,-18],[side*44,15],[side*24,1]],metal,theme.gold,2);poly(c,[[side*40,-35],[side*56,-32],[side*53,-6]],theme.gold+'44');poly(c,[[side*17,5],[side*37,12],[side*35,31],[side*12,30]],dark,theme.edge,2);}
const m=c.createLinearGradient(-25,-70,35,34);m.addColorStop(0,theme.gold);m.addColorStop(.4,metal);m.addColorStop(1,dark);poly(c,[[-37,-51],[-19,-70],[19,-70],[37,-51],[30,6],[0,30],[-30,6]],m,theme.gold,2.5);
poly(c,[[-27,-43],[-16,-55],[16,-55],[27,-43],[21,-17],[-21,-17]],'#071925',theme.gold+'77');for(const side of [-1,1]){line(c,[[side*8,-39],[side*18,-39]],red,5);poly(c,[[side*20,-58],[side*(35+b*6),-85],[side*31,-53]],theme.gold,'#182533');}
ellipse(c,0,-3,15,17,dark);glow(c,0,-3,24,red,.7);poly(c,[[0,-17],[11,-3],[0,11],[-11,-3]],red,'#fff1b0');
if(e.cool<50&&e.cool>0){c.strokeStyle=red+'aa';c.lineWidth=2;c.beginPath();c.arc(0,0,70+(50-e.cool)*.2,0,TAU);c.stroke();}
}else if(e.type==='wisp'){
 c.translate(0,Math.sin(time*4+e.id)*5-12);for(let i=0;i<3;i++)line(c,[[i*9-9,2],[i*12-12,18],[Math.sin(time*5+i)*7+i*9-9,28]],'#b58bcc',2);poly(c,[[0,-28],[20,-6],[12,12],[-12,12],[-20,-6]],metal,'#dcaddf',1.5);poly(c,[[0,-18],[11,-3],[0,7],[-11,-3]],red);if(e.cool<35){glow(c,0,-4,25,red,.45);}
}else if(e.type==='lancer'){
 c.rotate(e.cool<40?e.aim+Math.PI/2:Math.sin(time+e.id)*.2);poly(c,[[-14,13],[-21,-11],[0,-38],[21,-11],[14,13],[0,5]],metal,red,1.5);poly(c,[[0,-27],[7,-6],[0,4],[-7,-6]],'#ffd397');line(c,[[-13,12],[-19,24]],red,3);line(c,[[13,12],[19,24]],red,3);
}else if(e.type==='tank'){
 for(const side of [-1,1]){poly(c,[[side*16,-11],[side*32,-12],[side*35,10],[side*21,15]],metal,'#c89788');poly(c,[[side*7,5],[side*20,7],[side*20,19],[side*6,18]],dark,'#b79586');}
 poly(c,[[-25,-27],[0,-39],[25,-27],[21,8],[0,15],[-21,8]],metal,'#e5c096',2);poly(c,[[-15,-19],[15,-19],[11,-4],[-11,-4]],dark);line(c,[[-8,-12],[8,-12]],red,3);
}else{
 const a=Math.sin(time*14+e.id)*5;for(const side of [-1,1])for(let i=0;i<3;i++)line(c,[[side*8,i*7-17],[side*(18+i*2),i*9-13+a*(i%2?1:-1)],[side*(24-i*3),i*10+1]],'#788b89',3);
 poly(c,[[0,-31],[15,-14],[12,6],[0,13],[-12,6],[-15,-14]],metal,'#acb8a6',1.5);poly(c,[[0,-21],[8,-10],[0,0],[-8,-10]],red);line(c,[[-8,-23],[-13,-35]],'#c6c5ac',2);line(c,[[8,-23],[13,-35]],'#c6c5ac',2);
}
if(e.hp<e.maxHp&&e.type!=='boss'){c.fillStyle='#0b151c';c.fillRect(-19,-47,38,4);c.fillStyle=red;c.fillRect(-19,-47,38*Math.max(0,e.hp/e.maxHp),4);}c.restore();}
function make(canvas){const c=canvas.getContext('2d',{alpha:false}),maps=THEMES.map((_,i)=>background(i));let particles=[],popups=[],rays=[],rings=[],shake=0;let frames=0,lastTime=0;
function effects(events){for(const e of events){if(['kill','dash','hurt','heal','evolve','clear'].includes(e.kind)){const color=e.kind==='hurt'?'#ff8e96':e.kind==='heal'?'#b2ffd2':e.kind==='kill'?'#ffd2a1':'#9af3dd';const n=e.boss?30:e.kind==='kill'?9:14;for(let i=0;i<n&&particles.length<130;i++){const a=i*2.399+(e.x||360)*.02;particles.push({x:e.x||360,y:e.y||420,vx:Math.cos(a)*(25+i%5*20),vy:Math.sin(a)*(25+i%5*20),life:.35+i%3*.1,max:.6,color,size:e.boss?4:2.5});}if(e.kind==='hurt')shake=6;if(e.kind==='kill'&&e.boss)shake=10;}
if(e.kind==='arc')rays.push({...e,life:.22});if(e.kind==='blast')rings.push({...e,life:.32});if(['hit','heal'].includes(e.kind)&&popups.length<22)popups.push({x:e.x,y:e.y-32,life:.65,text:e.kind==='heal'?'+10':String(e.amount),color:e.kind==='heal'?'#abffd2':'#edf4d8'});}}
function draw(s,time,opts={}){const dt=Math.min(.045,lastTime?(time-lastTime):.016);lastTime=time;frames++;const region=Math.min(2,Math.floor((s.stage-1)/3)),t=THEMES[region],p=s.player,at=opts.reduced?0:time;
c.save();c.clearRect(0,0,720,820);c.drawImage(maps[region],0,0);if(shake>0&&!opts.reduced){c.translate(Math.sin(time*93)*shake,Math.cos(time*77)*shake*.7);}shake=Math.max(0,shake-dt*35);
// Moving motes and the slowly turning gate energy never hide a frozen simulation.
if(!opts.reduced)for(let i=0;i<13;i++){const x=(i*151+Math.sin(at*.15+i)*18)%700,y=(i*97-at*9)%720;ellipse(c,x,y,1.2,1.2,t.light+'77');}
glow(c,360,74,45,t.light,.24+Math.sin(at*2)*.05);c.strokeStyle=t.light+'80';c.lineWidth=1.5;c.beginPath();c.ellipse(360,79,29+Math.sin(at)*2,36,0,0,TAU);c.stroke();
for(const z of s.zones){const q=Math.min(1,z.age/z.delay);ellipse(c,z.x,z.y,z.r,z.r,'#fc63721a');c.strokeStyle='#ff8e97';c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.stroke();c.setLineDash([]);c.beginPath();c.arc(z.x,z.y,z.r*q,0,TAU);c.stroke();line(c,[[z.x-7,z.y],[z.x+7,z.y]],'#ffd0c6');line(c,[[z.x,z.y-7],[z.x,z.y+7]],'#ffd0c6');}
for(const e of s.enemies){if(e.warning>0){const q=e.warning/(e.boss?120:45);ellipse(c,e.x,e.y,e.r+12,e.r*.7+5,'#fc6b8120');c.strokeStyle='#ffa6a1';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,e.r+12,e.r*.7+5,0,0,TAU*(1-q));c.stroke();}if((e.type==='wisp'&&e.cool<35||e.type==='lancer'&&e.cool<40&&e.cool>0)&&e.warning===0){const d=e.type==='lancer'?180:250;line(c,[[e.x,e.y],[e.x+Math.cos(e.aim)*d,e.y+Math.sin(e.aim)*d]],'#ff8a9755',2);}}
for(const h of s.pickups){glow(c,h.x,h.y,18,'#abffd2',.3);poly(c,[[h.x,h.y-7],[h.x+6,h.y],[h.x,h.y+7],[h.x-6,h.y]],'#b0ffd6');}
for(const b of s.bullets){line(c,[[b.x-b.vx*2.4,b.y-b.vy*2.4],[b.x,b.y]],b.drone?'#e1d5ff':'#93fadc',b.drone?2.5:4);ellipse(c,b.x,b.y,2,2,'#f9fff0');}
const entities=s.enemies.map(e=>({y:e.y,e}));entities.push({y:p.y,player:true});entities.sort((a,b)=>a.y-b.y);for(const it of entities)if(it.player){if(s.phase==='ready'){hero(c,360,355,0,at,-.65,3.1,false);}else {c.save();c.globalAlpha=p.inv>0?.7:1;hero(c,p.x,p.y,s.tier,at,p.aim||-Math.PI/2,1,opts.moving);c.restore();}}else enemy(c,it.e,at,t);
for(let i=0;i<Math.floor(s.tier/3);i++){const a=s.tick*.025+i*TAU/Math.floor(s.tier/3),x=p.x+Math.cos(a)*43,y=p.y+Math.sin(a)*30;ellipse(c,x,y+8,10,4,'#00000040');poly(c,[[x,y-12],[x+10,y],[x,y+7],[x-10,y]],t.gold,t.light);ellipse(c,x,y-2,3,3,t.light);}
for(let i=0;i<s.upgrades.orbit;i++){const a=s.tick*.065+i*TAU/s.upgrades.orbit,x=p.x+Math.cos(a)*64,y=p.y+Math.sin(a)*64;c.save();c.translate(x,y);c.rotate(a);poly(c,[[-15,-4],[11,-7],[18,0],[-11,6]],t.gold,t.light);c.restore();}
if(p.dash>0){ellipse(c,p.x,p.y,22,22,t.light+'15');c.strokeStyle=t.light;c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,24,0,TAU);c.stroke();}
for(const b of s.hostile){ellipse(c,b.x,b.y,b.r+4,b.r+4,'#fc7a9230');ellipse(c,b.x,b.y,b.r,b.r,'#ff8292');ellipse(c,b.x-1,b.y-1,b.r*.45,b.r*.45,'#fff0b6');}
for(const r of rays){r.life-=dt;line(c,[[r.x,r.y],[(r.x+r.x2)/2+12,(r.y+r.y2)/2-11],[r.x2,r.y2]],'#e1ccff',2.5);}
for(const r of rings){r.life-=dt;c.strokeStyle='#ffb9a0';c.globalAlpha=Math.max(0,r.life/.32);c.lineWidth=5;c.beginPath();c.arc(r.x,r.y,r.r*(1.15-r.life),0,TAU);c.stroke();c.globalAlpha=1;}
for(const f of particles){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;c.globalAlpha=Math.max(0,f.life/f.max);c.fillStyle=f.color;c.fillRect(f.x,f.y,f.size,f.size);}c.globalAlpha=1;
for(const f of popups){f.life-=dt;f.y-=dt*24;c.globalAlpha=Math.max(0,Math.min(1,f.life*3));c.font='bold 12px system-ui';c.textAlign='center';c.fillStyle=f.color;c.fillText(f.text,f.x,f.y);}c.globalAlpha=1;
particles=particles.filter(x=>x.life>0);popups=popups.filter(x=>x.life>0);rays=rays.filter(x=>x.life>0);rings=rings.filter(x=>x.life>0);
// Exact ground-level player collision reference, health and phase-recharge ring.
c.strokeStyle=t.light+'aa';c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y+3,14,6,0,0,TAU);c.stroke();if(p.hp<p.maxHp){c.fillStyle='#08121e';c.fillRect(p.x-20,p.y+20,40,4);c.fillStyle=p.hp/p.maxHp<.3?'#ff8592':t.light;c.fillRect(p.x-20,p.y+20,40*p.hp/p.maxHp,4);}
if(s.stageTick<130&&s.phase==='playing'){const fade=Math.min(1,s.stageTick/15,(130-s.stageTick)/25);c.globalAlpha=fade;c.fillStyle='#071321cc';c.fillRect(170,329,380,91);c.textAlign='center';c.fillStyle=t.gold;c.font='600 11px system-ui';c.fillText('GATE '+String(s.stage).padStart(2,'0')+' / 09',360,353);c.fillStyle='#f1f3e3';c.font='600 23px system-ui';c.fillText(t.name,360,384);c.globalAlpha=1;}
if(opts.joy){const j=opts.joy;ellipse(c,j.x,j.y,43,43,'#d5fff012');c.strokeStyle='#d5fff070';c.lineWidth=1;c.beginPath();c.arc(j.x,j.y,43,0,TAU);c.stroke();ellipse(c,j.x+j.dx*31,j.y+j.dy*31,16,16,'#d5fff060');}
c.restore();}
function portrait(cv,tier,time=0){const x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);const t=THEMES[Math.min(2,Math.floor(tier/3))];glow(x,cv.width/2,cv.height*.55,cv.width*.45,t.light,.16);x.strokeStyle=t.light+'33';x.lineWidth=1;for(const rad of [.26,.36,.46]){x.beginPath();x.arc(cv.width/2,cv.height*.54,cv.width*rad,0,TAU);x.stroke();}hero(x,cv.width/2,cv.height*.68,tier,time,-.65,cv.width/120);}
return {draw,effects,portrait,reset(){particles=[];popups=[];rays=[];rings=[];shake=0;},resources:()=>({particles:particles.length,popups:popups.length,rays:rays.length,rings:rings.length,frames})};}
root.AstraArt=Object.freeze({make,hero,THEMES});
})(globalThis);
