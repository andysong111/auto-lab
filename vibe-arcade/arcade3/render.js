/* Original procedural art. Animation/effects are cosmetic and never change game rules. */
(function(root){
'use strict';
const palettes={
 'reaction-rush':{sky:['#060e24','#173055','#07303c'],a:'#62f6e3',b:'#be92ff',hot:'#ff607f'},
 'perfect-timing':{sky:['#192650','#784763','#f8b47e'],a:'#ffd692',b:'#b6efff',hot:'#ff8677'},
 'dont-press':{sky:['#070f1c','#142835','#092b28'],a:'#a9ff79',b:'#5cdae3',hot:'#ff7963'}
};
class Renderer{
 constructor(canvas,game){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.game=game;this.p=palettes[game];this.particles=[];this.labels=[];this.flash=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.t=0;}
 rect(x,y,w,h,color,r=0){const c=this.ctx;c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 line(points,color,width=2){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
 poly(points,color,stroke){const c=this.ctx;c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 circle(x,y,r,color,stroke,width=2){const c=this.ctx;c.beginPath();c.arc(x,y,Math.max(0,r),0,Math.PI*2);if(color){c.fillStyle=color;c.fill();}if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}}
 text(txt,x,y,size=22,color='#fff',align='center',weight=700){const c=this.ctx;c.textAlign=align;c.font=weight+' '+size+'px system-ui,sans-serif';c.fillStyle=color;c.fillText(txt,x,y);}
 glow(color,blur){this.ctx.shadowColor=color;this.ctx.shadowBlur=this.reduced?0:blur;}
 resetGlow(){this.ctx.shadowBlur=0;}
 robot(x,y,size,color,mood='happy',now=0){const c=this.ctx;c.save();c.translate(x,y+(this.reduced?0:Math.sin(now/500)*4));c.scale(size/100,size/100);
 this.line([[-29,44],[-43,60],[-31,70]],color,6);this.line([[29,44],[43,60],[31,70]],color,6);
 this.rect(-29,35,58,43,'#202e46',13);this.rect(-16,49,32,12,color,4);this.circle(0,55,3,'#15242f');
 this.line([[0,-39],[0,-54]],'#bfe6ed',4);this.circle(0,-58,6,color);this.glow(color,10);this.rect(-49,-34,98,70,'#c3dee6',22);this.resetGlow();this.rect(-39,-24,78,51,'#0a1727',14);
 if(mood==='alert'){this.line([[-24,-4],[-8,3]],color,5);this.line([[8,3],[24,-4]],color,5);}else{this.circle(-19,0,7,color);this.circle(19,0,7,color);}
 this.line([[-9,14],[0,18],[9,14]],color,3);this.circle(-55,2,9,'#344763',color);this.circle(55,2,9,'#344763',color);
 this.poly([[-16,78],[0,104+(this.reduced?0:Math.sin(now/70)*7)],[16,78]],color);c.restore();}
 effects(events,now){for(const e of events){const color=['fault','mine','escape','miss','drop-miss'].includes(e.kind)?this.p.hot:this.p.a;
  if(['destroy','boss-down','perfect','stabilize','stack','fault','mine','battery','hit'].includes(e.kind)){
   if(!this.reduced)for(let i=0;i<(e.kind==='boss-down'?36:12);i++)this.particles.push({x:e.x,y:e.y,vx:Math.cos(i*2.4)*(30+i*4),vy:Math.sin(i*2.4)*(30+i*4),color,born:now});
   if(e.value>0)this.labels.push({x:e.x,y:e.y-40,text:'+'+e.value,color,born:now});
  }
  if(['pulse','complete','boss-down'].includes(e.kind))this.flash=now;
 }
 this.particles=this.particles.slice(-180);this.labels=this.labels.slice(-10);
 }
 background(s,now){const c=this.ctx,p=this.p;const g=c.createLinearGradient(0,0,0,1000);g.addColorStop(0,p.sky[0]);g.addColorStop(.58,p.sky[1]);g.addColorStop(1,p.sky[2]);this.rect(0,0,1000,1000,g);
 for(let i=0;i<42;i++){const x=(i*179+23)%1000,y=(i*i*7+37)%620;this.circle(x,y,i%4===0?1.8:1,'#bbf9ff66');}
 if(this.game==='perfect-timing'){
  const sun=c.createRadialGradient(730,280,25,730,280,280);sun.addColorStop(0,'#ffdfb355');sun.addColorStop(1,'#fff0');this.rect(450,0,550,570,sun);this.circle(730,230,68,'#ffd4a580');
  for(let i=0;i<8;i++){const x=(i*193+(this.reduced?0:now/140))%1200-100,y=150+(i*77)%400;this.rect(x,y,150+i%3*40,12,'#ffe5d514',14);}
 }else if(this.game==='reaction-rush'){
  this.circle(805,185,108,null,p.a+'19',3);this.circle(805,185,78,null,p.b+'20');this.line([[0,790],[1000,790]],p.a+'35');
  for(let i=0;i<16;i++){const x=i*74,h=65+(i*137)%180;this.rect(x,825-h,61,h,'#091a34');for(let j=0;j<5;j++)this.rect(x+10,850-h+j*25,7,7,(j+i)%3===0?p.a+'55':p.b+'22');}
  for(let i=0;i<6;i++)this.line([[500+(i-2.5)*75,790],[500+(i-2.5)*250,1000]],p.a+'18');
 }else{
  for(let i=0;i<6;i++){this.line([[32+i*8,0],[32+i*8,175+i*18],[100+i*16,240+i*18],[100+i*16,930]],'#65868522',3);this.line([[968-i*8,0],[968-i*8,175+i*18],[900-i*16,240+i*18],[900-i*16,930]],'#65868522',3);}
 }
}
 reaction(s,now){const c=this.ctx,p=this.p;this.rect(44,115,912,668,'#04112655',22);this.line([[44,173],[44,115],[113,115]],p.a,3);this.line([[887,783],[956,783],[956,725]],p.a,3);
 this.text(s.tick>=2700?'FINAL WAVE · BREAK THE AEGIS':'SECTOR '+(Math.floor(s.tick/900)+1)+' · PROTECT THE CITY',500,92,20,p.a);let targets=s.targets;
 if(s.tick===0&&!targets.length)targets=[{id:1,type:'scout',x:285,y:330,born:0,r:62,hp:1,maxHp:1},{id:2,type:'armor',x:695,y:360,born:0,r:62,hp:2,maxHp:2},{id:3,type:'mine',x:540,y:610,born:0,r:62,hp:1,maxHp:1}];
 for(const t of targets){const q=ArcadeRules.targetPosition(s,t);c.save();c.translate(q.x,q.y);let scale=t.type==='boss'?1.7:1;const age=s.tick-t.born;if(!this.reduced)scale*=Math.min(1,Math.max(.35,age/10));if(s.tick===0)scale=1;c.scale(scale,scale);
  if(t.type==='mine'){c.rotate(this.reduced?0:now/1400);const a=[];for(let i=0;i<8;i++)a.push([Math.cos(i*Math.PI/4)*50,Math.sin(i*Math.PI/4)*50]);this.glow(p.hot,14);this.poly(a,'#522033',p.hot);this.resetGlow();c.rotate(this.reduced?0:-now/1400);this.line([[-17,-17],[17,17]],'#fff',7);this.line([[17,-17],[-17,17]],'#fff',7);}
  else if(t.type==='battery'){this.glow('#8effac',15);this.circle(0,0,39,'#0d4038','#8effac',3);this.resetGlow();this.rect(-6,-22,12,44,'#a4ffc9',3);this.rect(-22,-6,44,12,'#a4ffc9',3);}
  else{const armored=t.type!=='scout',col=armored?p.b:p.a;this.glow(col,17);this.poly([[-55,-14],[-28,-24],[-20,-47],[20,-47],[28,-24],[55,-14],[55,8],[27,16],[18,34],[-18,34],[-27,16],[-55,8]],'#203958',col);this.resetGlow();this.rect(-27,-26,54,37,'#091521',8);this.circle(-12,-8,7,col);this.circle(12,-8,7,col);this.line([[-10,22],[10,22]],col,4);
   if(armored){this.rect(-40,53,80,6,'#2a2c54',3);this.rect(-40,53,80*t.hp/t.maxHp,6,col,3);}
   if(t.type==='boss'){const shield=(s.tick-t.born)%180>100;this.circle(0,0,61,null,shield?'#aecfffcc':'#ffbb7440',shield?7:2);this.text(shield?'SHIELDED':'EXPOSED',0,-73,11,shield?'#bdd8ff':'#ffdcac');}
  }
  if(t.expires&&t.type!=='boss'){const life=1-(s.tick-t.born)/(t.expires-t.born);c.beginPath();c.strokeStyle=p.a+'66';c.lineWidth=2;c.arc(0,0,66,-Math.PI/2,-Math.PI/2+Math.PI*2*life);c.stroke();}c.restore();
 }
 this.robot(110,869,78,p.a,s.health<=2?'alert':'happy',now);this.text('PIX / SENTINEL',212,854,17,p.a,'left');this.text(s.energy>=8?'PULSE READY — CLEAR THE SWARM':'8 energy unlocks your pulse',212,882,17,'#c5dcf3','left');
 this.rect(212,910,650,10,'#082233',5);this.rect(212,910,650*s.heat/100,10,s.heat>80?p.hot:p.a,5);this.text('WEAPON HEAT',212,947,12,'#afc5d9','left');this.text(Math.round(s.heat)+'%',862,947,12,'#afc5d9','right');
}
 block(x,y,w,color,highlight=false){const dx=46,dy=25,h=28;this.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],color);this.poly([[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]],highlight?'#eefee4':'#c9e0df');this.poly([[x+w,y],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h]],highlight?'#abe9cd':'#477797');this.line([[x,y],[x+w,y],[x+w+dx,y-dy]],'#fff9',2);}
 timing(s,now){const p=this.p,c=this.ctx;this.text('SKYFORGE / FLOOR '+s.floor+' OF 24',500,93,20,'#ffdfb5');
 const top=705-Math.min(s.floor,11)*34,baseY=705+Math.max(0,s.floor-11)*34;
 this.poly([[110,795],[225,736],[835,736],[900,795],[760,834],[256,834]],'#332f4c');this.poly([[256,834],[760,834],[733,910],[283,910]],'#272b43');this.line([[260,846],[755,846]],'#ffc79788',3);
 s.blocks.forEach((b,i)=>{const y=baseY-i*34;if(y>800)return;const colors=['#6173ce','#657fd2','#6b96d5','#75b1d9','#86c4d8','#a5daca'];const col=colors[i%6];this.block(b.x,y,b.w,col,!!b.perfect);});
 const x=ArcadeRules.blockPosition(s),y=top-78+(this.reduced?0:Math.sin(now/250)*2);
 this.line([[s.anchor,top-70],[s.anchor,top+22]],'#fff4',1);this.line([[s.anchor+s.width,top-70],[s.anchor+s.width,top+22]],'#fff4',1);
 this.glow(p.a,13);this.block(x,y,s.width,'#f4ad73',s.combo>1);this.resetGlow();
 if(s.fragments)for(const f of s.fragments){const dt=(s.tick-f.born)/60;if(dt<1.2){c.save();c.globalAlpha=1-dt/1.2;this.block(f.x,top+dt*dt*250,f.w,'#ba7084');c.restore();}}
 this.robot(810,590,73,p.a,s.width<80?'alert':'happy',now);this.text('AXIS / BUILDER',790,714,13,p.a);
 this.text(s.combo>=2?'ONE MORE PERFECT = REPAIR':s.combo>0?'PERFECT CHAIN ×'+s.combo:'ALIGN · DROP · CLIMB',500,897,22,'#ffe3c0');this.rect(214,935,572,10,'#1e244380',6);this.rect(214,935,572*s.floor/24,10,p.a,6);
 this.text('3 perfect drops restore a little width',500,979,15,'#ffe3c0aa');
}
 reactor(s,now){const c=this.ctx,p=this.p,safe=ArcadeRules.safeWindow(s),remaining=(s.start+s.duration-s.tick)/s.duration,angle=(s.tick-s.start)/s.duration*Math.PI*2-Math.PI/2,center={x:500,y:432};
 this.text('REACTOR SHIFT / CYCLE '+s.cycle,500,92,20,p.a);const col=safe?p.b:s.instruction==='wait'?p.a:p.hot;
 for(let i=0;i<3;i++){this.circle(500,432,160+i*36,null,i===0?col+'aa':p.a+'25',i===0?5:2);}
 const a0=(s.openAt-s.start)/s.duration*Math.PI*2-Math.PI/2,a1=(s.closeAt-s.start)/s.duration*Math.PI*2-Math.PI/2;
 c.beginPath();c.strokeStyle=s.instruction==='wait'?'#46624f':'#5cdae3';c.lineWidth=12;c.arc(500,432,232,a0,a1);c.stroke();
 c.beginPath();c.strokeStyle='#f2ffee';c.lineWidth=8;c.arc(500,432,248,angle-.015,angle+.015);c.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6;this.line([[500+Math.cos(a)*270,432+Math.sin(a)*270],[500+Math.cos(a)*282,432+Math.sin(a)*282]],'#719e8655',3);}
 this.glow(col,24);this.circle(500,432,137,'#09232e',col,4);this.resetGlow();this.circle(500,432,109,'#112e3c','#82aeab44');
 // CORE is a mechanical character with an expressive iris and segmented casing.
 this.circle(500,428,s.held?62:54,'#0b1a28',col,3);this.glow(col,16);this.circle(500+(s.faulted?18:0),428,20,col);this.resetGlow();this.circle(493,420,6,'#fff');
 this.line([[418,493],[437,503]],col,5);this.line([[563,503],[582,493]],col,5);
 const labels={charge:'HOLD IN CYAN',strike:'TAP ONCE IN CYAN',double:'TAP TWICE IN CYAN',wait:'DO NOT TOUCH'};
 const sub=s.instruction==='wait'?'Keep your hands off this cycle':s.instruction==='charge'?Math.min(s.safeTicks,s.need)+' / '+s.need+' charge ticks':s.presses+' / '+(s.instruction==='double'?2:1)+' taps';
 this.rect(166,762,668,118,'#071923dd',20);this.text(labels[s.instruction],500,812,30,s.instruction==='wait'?p.a:p.b);this.text(s.faulted?'FAULT · RESET FOR NEXT CYCLE':safe?'WINDOW OPEN — '+sub:s.resolved?'CYCLE RESOLVED':'SEALED · WAIT FOR THE CYAN WINDOW',500,850,16,s.faulted?p.hot:'#b7d2d7');
 this.rect(166,919,668,10,'#1c393a',5);this.rect(166,919,668*s.charge/100,10,p.a,5);this.text('STABILITY '+s.charge+'%',166,955,14,p.a,'left');this.text('CORE / SHIFT OPERATOR',834,955,13,'#98aebb','right');
 if(s.instruction==='charge'){this.rect(434,574,132,8,'#1c4850',5);this.rect(434,574,132*Math.min(1,s.safeTicks/s.need),8,p.b,5);}
}
 draw(s,now){const c=this.ctx;c.save();c.setTransform(this.canvas.width/1000,0,0,this.canvas.height/1000,0,0);this.background(s,now);if(this.game==='reaction-rush')this.reaction(s,now);else if(this.game==='perfect-timing')this.timing(s,now);else this.reactor(s,now);
 this.particles=this.particles.filter(v=>now-v.born<550);for(const p of this.particles){const age=(now-p.born)/550;c.globalAlpha=1-age;this.rect(p.x+p.vx*age,p.y+p.vy*age,5,5,p.color,1);}c.globalAlpha=1;
 this.labels=this.labels.filter(v=>now-v.born<900);for(const p of this.labels){const age=(now-p.born)/900;c.globalAlpha=1-age;this.text(p.text,p.x,p.y-age*65,26,p.color);}c.globalAlpha=1;
 if(!this.reduced&&now-this.flash<350){c.globalAlpha=(1-(now-this.flash)/350)*.10;this.rect(0,0,1000,1000,this.p.a);c.globalAlpha=1;}c.restore();}
}
root.ArcadeRenderer=Renderer;
})(globalThis);
