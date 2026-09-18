/* Orbit Sprint rules v1. Same deterministic simulation runs in browser and server.
   No rendering, wall clock, storage, network or randomness outside the seeded PRNG. */
(function(root){
  'use strict';
  const VERSION='orbit-v1', FPS=60, MAX_TICKS=5400, ACTIONS=['left','right','jump','dash'];
  function rng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  function create(seed){const r=rng(seed),rows=[];let at=180;
    while(at<MAX_TICKS){let lane=Math.floor(r()*3),kind=r()<.55?'barrier':'pillar',coin=(lane+1+Math.floor(r()*2))%3;
      rows.push({at,lane,kind,coin,done:false});at+=Math.max(54,110-Math.floor(at/180));}
    return {version:VERSION,seed:seed>>>0,tick:0,lane:1,jumpUntil:0,dashUntil:0,jumpCooldown:0,laneCooldown:0,energy:0,orbs:0,combo:0,maxCombo:0,bonus:0,score:0,alive:true,won:false,rows,row:0,lastEvent:null};
  }
  function step(s,action){if(!s.alive)return s;
    s.lastEvent=null;
    if(action==='left'&&s.tick>=s.laneCooldown){s.lane=Math.max(0,s.lane-1);s.laneCooldown=s.tick+7;}
    if(action==='right'&&s.tick>=s.laneCooldown){s.lane=Math.min(2,s.lane+1);s.laneCooldown=s.tick+7;}
    if(action==='jump'&&s.tick>=s.jumpCooldown){s.jumpUntil=s.tick+42;s.jumpCooldown=s.tick+54;}
    if(action==='dash'&&s.energy>=5&&s.tick>=s.dashUntil){s.energy-=5;s.dashUntil=s.tick+85;s.lastEvent='dash';}
    s.tick++;
    const row=s.rows[s.row];
    if(row&&s.tick>=row.at){
      row.done=true;s.row++;
      const dash=s.tick<s.dashUntil,jump=s.tick<s.jumpUntil;
      if(s.lane===row.lane&&!dash&&!(row.kind==='barrier'&&jump)){s.alive=false;s.combo=0;s.lastEvent='crash';}
      else if(s.lane===row.coin){s.orbs++;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.energy=Math.min(10,s.energy+1);s.bonus+=100+Math.min(10,s.combo)*20;s.lastEvent='orb';}
      else{s.combo=0;s.lastEvent=dash&&s.lane===row.lane?'break':'clear';}
    }
    if(s.tick>=MAX_TICKS&&s.alive){s.alive=false;s.won=true;s.bonus+=1000;s.lastEvent='win';}
    s.score=Math.floor(s.tick/3)+s.bonus;
    return s;
  }
  function replay(seed,actions,ticks){
    if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Invalid seed');
    if(!Number.isInteger(ticks)||ticks<1||ticks>MAX_TICKS)throw new Error('Invalid duration');
    if(!Array.isArray(actions)||actions.length>1800)throw new Error('Invalid inputs');
    let last=-1;
    for(const e of actions){if(!Array.isArray(e)||e.length!==2||!Number.isInteger(e[0])||e[0]<=last||e[0]<0||e[0]>=ticks||!ACTIONS.includes(e[1]))throw new Error('Invalid input order');last=e[0];}
    const s=create(seed);let i=0;
    while(s.tick<ticks&&s.alive){const a=actions[i]&&actions[i][0]===s.tick?actions[i++][1]:undefined;step(s,a);}
    if(s.alive||s.tick!==ticks)throw new Error('Run is not complete');
    return {score:s.score,ticks:s.tick,orbs:s.orbs,maxCombo:s.maxCombo,won:s.won,version:VERSION};
  }
  const api={VERSION,FPS,MAX_TICKS,ACTIONS,create,step,replay};
  root.OrbitRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
