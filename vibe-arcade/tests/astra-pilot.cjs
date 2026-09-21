/* Offline QA pilot; never imported by the live game. Uses only movement/dash and offered choices. */
const R=require('../games/astra-sentinel/core.js');
function bot(s){const p=s.player;let vx=0,vy=0;
 // Follow an oval path and repel contact enemies / predicted projectiles.
 const a=Math.atan2((p.y-423)/200,(p.x-360)/215)+.16;
 let tx=360+Math.cos(a)*215,ty=423+Math.sin(a)*220;
 const d=Math.hypot(tx-p.x,ty-p.y)||1;vx=(tx-p.x)/d*.65;vy=(ty-p.y)/d*.65;
 for(const e of s.enemies){if(e.warning>0)continue;let dx=p.x-e.x,dy=p.y-e.y,dd=Math.hypot(dx,dy)||1;let w=Math.max(0,135-dd)/65;vx+=dx/dd*w;vy+=dy/dd*w;}
 for(const b of s.hostile){const dx=p.x-(b.x+b.vx*8),dy=p.y-(b.y+b.vy*8),d=Math.hypot(dx,dy)||1,w=Math.max(0,65-d)/25;vx+=dx/d*w;vy+=dy/d*w;}
 for(const z of s.zones){const dx=p.x-z.x,dy=p.y-z.y,d=Math.hypot(dx,dy)||1,w=Math.max(0,z.r+35-d)/18;vx+=dx/d*w;vy+=dy/d*w;}
 vx+=Math.max(0,95-p.x)/20-Math.max(0,p.x-625)/20;vy+=Math.max(0,165-p.y)/20-Math.max(0,p.y-670)/20;
 const length=Math.hypot(vx,vy)||1;
 const risk=s.hostile.some(b=>Math.hypot(p.x-b.x-b.vx*6,p.y-b.y-b.vy*6)<25)||s.enemies.some(e=>e.warning===0&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+25);
 return{x:vx/length,y:vy/length,dash:risk&&p.dashCd===0};
}
function pick(s){const pref=s.player.hp<s.player.maxHp*.55?['repair','armor','twin','rapid','power','arc','orbit','pierce','flux']:['twin','rapid','arc','power','orbit','armor','pierce','flux','repair'];return pref.find(x=>s.offers.includes(x));}
function simulate(seed,move=true){const s=R.create(seed);R.begin(s);let logs=[];for(let f=0;f<45000;f++){if(s.phase==='upgrade'){logs.push({gate:s.stage,time:(s.tick/60).toFixed(1),hp:s.player.hp,upgrade:pick(s)});R.choose(s,pick(s));}if(s.phase!=='playing')break;R.step(s,move?bot(s):{});}return {seed,phase:s.phase,cleared:s.cleared,score:s.score,kills:s.kills,time:(s.tick/60).toFixed(1),hp:s.player.hp,logs,state:s};}
if(require.main===module){for(const move of [false,true])for(const seed of [7,42,74021,998]){const r=simulate(seed,move);delete r.state;console.log(JSON.stringify({move,...r}));}}
module.exports={bot,pick,simulate};
