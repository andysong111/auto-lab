/* Fixed-tick candidate motion; dash distance, top speed and combat rules stay unchanged. */
(function(root){'use strict';
const finite=n=>typeof n==='number'&&Number.isFinite(n)?n:0;
let mode='responsive';
function reset(p){p.vx=0;p.vy=0;}
function advance(p,x,y,speed){
 x=Math.max(-1,Math.min(1,finite(x)));y=Math.max(-1,Math.min(1,finite(y)));
 const n=Math.max(1,Math.hypot(x,y));x=x/n*speed;y=y/n*speed;
 if(mode==='direct'){p.vx=x;p.vy=y;}else{
  const stopping=Math.hypot(x,y)<.01;
  // ~94% requested speed in four 60Hz ticks; braking is sharper than acceleration.
  const response=stopping?.72:(finite(p.vx)*x+finite(p.vy)*y<0?.74:.52);
  p.vx=finite(p.vx)+(x-finite(p.vx))*response;p.vy=finite(p.vy)+(y-finite(p.vy))*response;
  if(stopping&&Math.hypot(p.vx,p.vy)<.035)reset(p);
 }
 p.x+=p.vx;p.y+=p.vy;
}
function setMode(value){if(!['responsive','direct'].includes(value))throw Error('invalid_motion_mode');mode=value;}
const api=Object.freeze({advance,reset,setMode,get mode(){return mode;}});root.AstraMotion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
