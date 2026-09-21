/* P2 candidate rules shared by simulation and warning renderer. No randomness here. */
(function(root){'use strict';
const SCALE=1.4, W=1008,H=1148, B=Object.freeze({left:57*SCALE,right:663*SCALE,top:125*SCALE,bottom:709*SCALE});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function tuning(stage){return {quota:stage%3===0?18+stage*2:12+stage*6,interval:Math.max(30,79-stage*5),hp:1+(stage-1)*.36,speed:SCALE*(1+(stage-1)*.095),damage:12+stage*2.5,bossHp:stage===3?1000:stage===6?2650:5100};}
function bossVolley(e){const n=8+e.boss*2+(e.phase===2?4:0),offset=e.attack*.29;const shots=[];for(let i=0;i<n;i++)shots.push({a:offset+i*2*Math.PI/n,speed:(2.2+e.boss*.3)*SCALE,r:7});if(e.boss>=2)for(let i=-1;i<=1;i++)shots.push({a:e.aim+i*.16,speed:4.2*SCALE,r:6});return shots;}
// Warning and damage use one retained gap. It never snaps to the player's later position.
function wallFor(s){const e=s.enemies.find(e=>e.type==='boss');if(!e)return null;const axis=e.attack%2===0?'x':'y',sign=(Math.floor(e.attack/2)%2===0?1:-1),lo=axis==='x'?B.top:B.left,hi=axis==='x'?B.bottom:B.right;
 const gapWidth=220-(e.boss-1)*20,gap=clamp((axis==='x'?s.player.y:s.player.x)+(e.attack%3-1)*130,lo+gapWidth/2+25,hi-gapWidth/2-25);
 return {axis,sign,gap,gapWidth,age:0,delay:96,speed:(3.6+e.boss*.28)*SCALE,line:axis==='x'?(sign>0?B.left-28:B.right+28):(sign>0?B.top-28:B.bottom+28),life:430};}
function wallPoints(w){const lo=w.axis==='x'?B.top:B.left,hi=w.axis==='x'?B.bottom:B.right,pts=[];for(let p=lo;p<=hi;p+=25){if(Math.abs(p-w.gap)<w.gapWidth/2)continue;pts.push(w.axis==='x'?{x:w.line,y:p}:{x:p,y:w.line});}return pts;}
function updateWall(s,hurt){for(const w of s.walls){w.age++;w.life--;if(w.age>w.delay){w.line+=w.sign*w.speed;const p=s.player,gapAxis=w.axis==='x'?p.y:p.x,cross=w.axis==='x'?p.x:p.y;
 if(Math.abs(gapAxis-w.gap)>=w.gapWidth/2-12&&Math.abs(cross-w.line)<19)hurt(s,tuning(s.stage).damage*1.12,w.axis==='x'?w.line:p.x,w.axis==='y'?w.line:p.y);
 } }s.walls=s.walls.filter(w=>w.life>0&&(w.axis==='x'?w.line>B.left-80&&w.line<B.right+80:w.line>B.top-80&&w.line<B.bottom+80));}
const api=Object.freeze({SCALE,W,H,BOUNDS:B,tuning,bossVolley,wallFor,wallPoints,updateWall});root.AstraArena=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
