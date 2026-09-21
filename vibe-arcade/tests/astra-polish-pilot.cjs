/* Offline probe, never loaded by the game. Only allowed movement/dash/offered upgrades. */
'use strict';
const R=require('../labs/astra-sentinel/core.js');
function bot(s,kind='reactive'){
 const p=s.player,k=s.version==='astra-polish-preview2'?1.4:1,cx=360*k,cy=423*k;
 if(kind==='idle')return {};
 const a=Math.atan2((p.y-cy)/(200*k),(p.x-cx)/(215*k))+.16;
 let tx=cx+Math.cos(a)*215*k,ty=cy+Math.sin(a)*220*k,d=Math.hypot(tx-p.x,ty-p.y)||1,vx=(tx-p.x)/d*.65,vy=(ty-p.y)/d*.65;
 if(kind==='circle')return {x:vx,y:vy,dash:false};
 for(const e of s.enemies){if(e.warning>0)continue;const dx=p.x-e.x,dy=p.y-e.y,dd=Math.hypot(dx,dy)||1,w=Math.max(0,135*k-dd)/(65*k);vx+=dx/dd*w;vy+=dy/dd*w;}
 for(const b of s.hostile){const dx=p.x-b.x-b.vx*8,dy=p.y-b.y-b.vy*8,d=Math.hypot(dx,dy)||1,w=Math.max(0,65*k-d)/(25*k);vx+=dx/d*w;vy+=dy/d*w;}
 for(const z of s.zones){const dx=p.x-z.x,dy=p.y-z.y,d=Math.hypot(dx,dy)||1,w=Math.max(0,z.r+35*k-d)/(18*k);vx+=dx/d*w;vy+=dy/d*w;}
 // Old P1 probe has no sweep awareness; adaptive responds to the published safe lane.
 if(kind==='adaptive')for(const w of s.walls||[]){const horizontal=w.axis==='y',across=horizontal?p.y:p.x,perp=horizontal?p.x:p.y,dist=(across-w.line)*w.sign;if(dist>-25){const delta=w.gap-perp,urgent=Math.abs(delta)>w.gapWidth/2-35;if(urgent){if(horizontal)vx+=Math.sign(delta)*2.5;else vy+=Math.sign(delta)*2.5;}else {if(horizontal)vx*=.3;else vy*=.3;}}}
 vx+=Math.max(0,95*k-p.x)/(20*k)-Math.max(0,p.x-625*k)/(20*k);vy+=Math.max(0,165*k-p.y)/(20*k)-Math.max(0,p.y-670*k)/(20*k);
 const length=Math.hypot(vx,vy)||1;let risk=s.hostile.some(b=>Math.hypot(p.x-b.x-b.vx*6,p.y-b.y-b.vy*6)<25*k)||s.enemies.some(e=>!e.warning&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+25*k);
 if(kind==='adaptive')for(const w of s.walls||[]){const across=w.axis==='x'?p.x:p.y,perp=w.axis==='x'?p.y:p.x;if(w.age>w.delay&&Math.abs(across-w.line)<60&&Math.abs(perp-w.gap)>w.gapWidth/2-30){risk=true;if(w.axis==='x'){vx=-w.sign;vy=0;}else{vy=-w.sign;vx=0;}}}
 const n=Math.hypot(vx,vy)||1;
 if(kind==='adaptive'){
  // Select a movement direction from visible hazards, not future random spawns.
  const rules=typeof R!=='undefined'?R:AstraRules,sp=rules.stats(s).speed,B=rules.ARENA.BOUNDS;let best=null;
  for(let i=0;i<16;i++){const ang=i*Math.PI/8,x=Math.cos(ang),y=Math.sin(ang);let score=0;
   for(const f of [5,12,22]){const px=p.x+x*sp*f,py=p.y+y*sp*f;
    if(px<B.left+15||px>B.right-15||py<B.top+15||py>B.bottom-15)score+=50;
    for(const b of s.hostile){const d=Math.hypot(px-b.x-b.vx*f,py-b.y-b.vy*f);score+=Math.max(0,60-d)**2/(f===5?140:240);}
    for(const e of s.enemies){if(e.warning>f)continue;const d=Math.hypot(px-e.x,py-e.y);score+=Math.max(0,e.r+70-d)**2/350;}
    for(const z of s.zones){if(z.age+f>z.delay-8&&z.age+f<z.delay+15){const d=Math.hypot(px-z.x,py-z.y);score+=Math.max(0,z.r+35-d)**2/140;}}
    for(const w of s.walls){const cross=w.axis==='x'?px:py,perp=w.axis==='x'?py:px;const line=w.line+w.sign*w.speed*Math.max(0,f-Math.max(0,w.delay-w.age));if(w.age+f>w.delay&&Math.abs(cross-line)<38&&Math.abs(perp-w.gap)>w.gapWidth/2-25)score+=90;}
   }
   score-=1.7*(x*vx/n+y*vy/n);if(best===null||score<best.score)best={x,y,score};
  }
  return{x:best.x,y:best.y,dash:risk&&p.dashCd===0};
 }
 return{x:vx/n,y:vy/n,dash:risk&&p.dashCd===0};
}
function pick(s){const pref=s.player.hp<s.player.maxHp*.5?['repair','armor','twin','rapid','power','arc','orbit','pierce','flux']:['twin','rapid','arc','power','orbit','armor','pierce','flux','repair'];return pref.find(x=>s.offers.includes(x));}
function simulate(seed,kind='adaptive',rules=R){const s=rules.create(seed);rules.begin(s);let logs=[],maxWall=0;while(s.phase==='playing'||s.phase==='upgrade'){if(s.phase==='upgrade'){const upgrade=pick(s);logs.push({stage:s.stage,tick:s.tick,hp:s.player.hp,upgrade});rules.choose(s,upgrade);}else rules.step(s,bot(s,kind));maxWall=Math.max(maxWall,s.walls?.length||0);}return{seed,kind,phase:s.phase,cleared:s.cleared,time:Math.round(s.tick/60),hp:s.player.hp,score:s.score,damage:s.damageTaken,logs,maxWall,state:s};}
if(require.main===module){for(const kind of ['idle','circle','reactive','adaptive'])for(const seed of [7,42,74021,998,91,19,321,125904]){const {state,...r}=simulate(seed,kind);console.log(JSON.stringify(r));}}
module.exports={bot,pick,simulate};
