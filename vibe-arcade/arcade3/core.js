/* LoopJolt Arcade 3: canonical, seeded, 60 Hz rules. Browser and server use this exact file.
 * Visual animation never determines scores. A replay contains inputs, not a claimed score. */
(function(root){
'use strict';
const CONFIG=Object.freeze({
 'reaction-rush':{version:'rr-neon-v1',ticks:3600,title:'Reaction Rush · Neon Siege'},
 'perfect-timing':{version:'pt-sky-v1',ticks:3600,title:'Perfect Timing · Skyforge'},
 'dont-press':{version:'dp-core-v1',ticks:3600,title:"Don't Press · Reactor Shift"}
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function random(s){s.rng=(s.rng+0x6D2B79F5)>>>0;let t=s.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function tri(t,period){const p=((t%period)+period)%period;return 1-Math.abs(p/(period/2)-1);}
function event(s,kind,x=500,y=500,value=0){s.events.push({kind,x,y,value});}
function create(game,seed){if(!CONFIG[game])throw Error('invalid_game');if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('invalid_seed');
 const s={game,version:CONFIG[game].version,rng:seed>>>0,seed,tick:0,score:0,combo:0,maxCombo:0,hits:0,misses:0,health:5,alive:true,won:false,events:[]};
 if(game==='reaction-rush')Object.assign(s,{targets:[],nextSpawn:90,nextId:1,heat:0,energy:0,shots:0,shotAt:-10,bossSpawned:false,bossKills:0});
 if(game==='perfect-timing'){Object.assign(s,{blocks:[{x:300,w:400}],width:400,anchor:300,floor:0,perfects:0,readyAt:60,phase:Math.floor(random(s)*180),health:3,fragments:[]});}
 if(game==='dont-press'){Object.assign(s,{held:false,cycle:0,charge:0,presses:0,resolved:false,faulted:false,safeTicks:0,health:6});nextCycle(s);}
 return s;
}
function streak(s){s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);}
function hurt(s,kind='fault',x=500,y=500){s.health--;s.misses++;s.combo=0;event(s,kind,x,y);if(s.health<=0){s.health=0;s.alive=false;}}
function targetPosition(s,t){const age=s.tick-t.born;return{x:Math.round(t.x+(t.type==='scout'||t.type==='boss'?(tri(age+t.id*9,t.type==='boss'?260:150)-.5)*(t.type==='boss'?180:60):0)),y:t.y};}
function spawn(s){const wave=Math.min(3,Math.floor(s.tick/900)),r=random(s),type=r<.14&&wave>0?'mine':r<.23?'battery':r<.47&&wave>0?'armor':'scout';
 const lane=Math.floor(random(s)*4),row=Math.floor(random(s)*3);
 const obj={id:s.nextId++,type,x:170+lane*215,y:240+row*180,born:s.tick,expires:s.tick+Math.max(130,245-wave*32),hp:type==='armor'?2:1,maxHp:type==='armor'?2:1,r:62,hitAt:-20};
 // A fixed grid plus an occupancy check prevents unreadable overlapping targets.
 if(s.targets.some(t=>Math.abs(targetPosition(s,t).x-obj.x)<100&&Math.abs(t.y-obj.y)<100))return;
 s.targets.push(obj);event(s,'spawn',obj.x,obj.y);
}
function hitTarget(s,t,x,y,pulse=false){
 if(t.type==='mine'){t.hp=0;hurt(s,'mine',x,y);s.heat=Math.min(100,s.heat+18);return;}
 if(t.type==='battery'){t.hp=0;s.heat=Math.max(0,s.heat-35);s.energy=Math.min(10,s.energy+2);s.score+=60;event(s,'battery',x,y,60);return;}
 if(t.type==='boss'&&(s.tick-t.born)%180>100&&!pulse){event(s,'shield',x,y);return;}
 if(s.tick-t.hitAt<6)return;t.hitAt=s.tick;t.hp-=pulse?3:1;s.hits++;event(s,'hit',x,y);
 if(t.hp<=0){streak(s);s.energy=Math.min(10,s.energy+1);const value=t.type==='boss'?1800:80+Math.min(20,s.combo)*10+Math.max(0,40-Math.floor((s.tick-t.born)/5));s.score+=value;if(t.type==='boss'){s.bossKills++;event(s,'boss-down',x,y,value);}else event(s,'destroy',x,y,value);}
}
function reaction(s,a){s.heat=Math.max(0,s.heat-.28);
 if(s.tick>=s.nextSpawn&&s.tick<3180){spawn(s);s.nextSpawn=s.tick+Math.max(42,96-Math.floor(s.tick/75));}
 if(s.tick===2700&&!s.bossSpawned){s.bossSpawned=true;s.targets=s.targets.filter(t=>t.type==='mine');s.targets.push({id:s.nextId++,type:'boss',x:500,y:330,r:92,born:s.tick,expires:3600,hp:14,maxHp:14,hitAt:-20});event(s,'boss');}
 if(a&&a[0]==='tap'&&s.tick-s.shotAt>=6){s.shotAt=s.tick;s.shots++;const x=a[1],y=a[2];
  if(s.heat>88){event(s,'overheat',x,y);}else{s.heat+=12;let found=null;for(let i=s.targets.length-1;i>=0;i--){const t=s.targets[i],p=targetPosition(s,t);if(t.hp>0&&(x-p.x)**2+(y-p.y)**2<=t.r*t.r){found=t;break;}}
   if(found)hitTarget(s,found,x,y);else{s.misses++;s.combo=0;s.score=Math.max(0,s.score-20);event(s,'miss',x,y);}}
 }
 if(a&&a[0]==='pulse'&&s.energy>=8){s.energy-=8;s.heat=0;for(const t of s.targets){if(t.hp>0&&t.type!=='mine'&&t.type!=='battery'){const p=targetPosition(s,t);hitTarget(s,t,p.x,p.y,true);}}event(s,'pulse');}
 for(const t of s.targets){if(s.tick>=t.expires&&t.hp>0&&t.type!=='mine'&&t.type!=='battery'&&t.type!=='boss')hurt(s,'escape',t.x,t.y);}
 s.targets=s.targets.filter(t=>t.hp>0&&s.tick<t.expires);
}
function blockPosition(s){const period=Math.max(62,166-s.floor*4),p=tri(s.tick+s.phase,period);return Math.round(65+p*(870-s.width));}
function timing(s,a){if(!a||a[0]!=='drop'||s.tick<s.readyAt)return;
 const x=blockPosition(s),w=s.width,error=Math.abs(x-s.anchor),tolerance=Math.max(7,15-Math.floor(s.floor/3));let overlap=Math.min(x+w,s.anchor+w)-Math.max(x,s.anchor);const perfect=error<=tolerance;
 if(overlap<=0){hurt(s,'drop-miss',x+Math.floor(w/2),400);s.readyAt=s.tick+48;s.phase=Math.floor(random(s)*180);return;}
 let nx=Math.max(x,s.anchor),nw=overlap;
 if(perfect){nx=s.anchor;nw=w;s.perfects++;streak(s);if(s.combo%3===0){const gain=Math.min(400-w,30);nx-=Math.floor(gain/2);nw+=gain;event(s,'restore',500,350,gain);}}
 else{s.combo=0;s.fragments=[{x:x<s.anchor?x:nx+nw,w:Math.abs(x-s.anchor),born:s.tick}];}
 const quality=Math.round(100*overlap/w);const value=150+Math.max(0,quality)*2+(perfect?150+Math.min(s.combo,10)*40:0);
 s.score+=value;s.floor++;s.hits++;s.width=Math.round(nw);s.anchor=Math.round(nx);s.blocks.push({x:s.anchor,w:s.width,perfect,born:s.tick});s.readyAt=s.tick+28;s.phase=Math.floor(random(s)*180);event(s,perfect?'perfect':'stack',s.anchor+Math.floor(nw/2),400,value);
 if(s.width<25){s.alive=false;event(s,'collapse');}else if(s.floor>=24){s.score+=1500+s.health*100;s.alive=false;s.won=true;event(s,'complete');}
}
function nextCycle(s){s.cycle++;s.start=s.tick;s.duration=Math.max(98,205-s.cycle*4);const choices=['charge','strike','double','wait'];s.instruction=choices[s.cycle<=2?0:Math.floor(random(s)*4)];s.openAt=s.start+Math.floor(s.duration*(.26+random(s)*.10));s.closeAt=s.openAt+Math.floor(s.duration*.34);s.need=Math.max(15,Math.floor((s.closeAt-s.openAt)*.60));s.safeTicks=0;s.presses=0;s.resolved=false;s.faulted=false;event(s,'cycle');}
function safeWindow(s){return s.tick>=s.openAt&&s.tick<s.closeAt&&s.instruction!=='wait';}
function reactorFault(s){if(s.faulted)return;s.faulted=true;hurt(s,'fault',500,430);}
function reactor(s,a){const safe=safeWindow(s);
 if(a&&a[0]==='down'&&!s.held){s.held=true;if(!safe)reactorFault(s);else{s.presses++;if((s.instruction==='strike'&&s.presses>1)||(s.instruction==='double'&&s.presses>2))reactorFault(s);}}
 if(a&&a[0]==='up')s.held=false;
 if(s.held){if(safe)s.safeTicks++;else reactorFault(s);}
 if(!s.resolved&&s.tick>=(s.instruction==='wait'?s.start+s.duration-1:s.closeAt)){s.resolved=true;const ok=!s.faulted&&(s.instruction==='wait'?!s.held:s.instruction==='charge'?s.safeTicks>=s.need:s.instruction==='strike'?s.presses===1:s.presses===2);
  if(ok){streak(s);s.hits++;const value=150+Math.min(20,s.combo)*25+(s.instruction==='charge'?Math.min(100,s.safeTicks):80);s.score+=value;s.charge=Math.min(100,s.charge+4);event(s,'stabilize',500,430,value);}else if(!s.faulted){reactorFault(s);}}
 if(s.tick>=s.start+s.duration&&s.alive)nextCycle(s);
}
function step(s,a){if(!s.alive)return s;s.events=[];
 if(s.game==='reaction-rush')reaction(s,a);else if(s.game==='perfect-timing')timing(s,a);else reactor(s,a);
 s.tick++;if(s.tick>=CONFIG[s.game].ticks){s.alive=false;s.won=s.game==='perfect-timing'?s.floor>=24:s.health>0;if(s.won){s.score+=s.game==='reaction-rush'?s.health*100:s.game==='dont-press'?s.health*100:0;event(s,'complete');}}
 s.score=Math.max(0,Math.round(s.score));return s;
}
function validAction(game,e,ticks,last){if(!Array.isArray(e)||!Number.isInteger(e[0])||e[0]<=last||e[0]<0||e[0]>=ticks)return false;
 const coords=e.length===4&&Number.isInteger(e[2])&&Number.isInteger(e[3])&&e[2]>=0&&e[2]<=1000&&e[3]>=0&&e[3]<=1000;
 if(game==='reaction-rush')return(e[1]==='tap'&&coords)||(e.length===2&&e[1]==='pulse');
 return e.length===2&&(game==='perfect-timing'?e[1]==='drop':['down','up'].includes(e[1]));
}
function replay(game,seed,actions,ticks){const cfg=CONFIG[game];if(!cfg)throw Error('invalid_game');if(!Number.isInteger(ticks)||ticks<1||ticks>cfg.ticks)throw Error('invalid_duration');if(!Array.isArray(actions)||actions.length>1200)throw Error('invalid_inputs');let last=-1;for(const e of actions){if(!validAction(game,e,ticks,last))throw Error('invalid_input_order');last=e[0];}
 const s=create(game,seed);let i=0;while(s.tick<ticks&&s.alive){const e=actions[i];step(s,e&&e[0]===s.tick?actions[i++].slice(1):null);}if(s.alive||s.tick!==ticks||i!==actions.length)throw Error('incomplete_or_extra_inputs');if(s.score>50000)throw Error('score_out_of_bounds');
 return {score:s.score,ticks:s.tick,orbs:Math.min(150,s.hits),maxCombo:Math.min(150,s.maxCombo),won:s.won,version:cfg.version};
}
const api={CONFIG,create,step,replay,targetPosition,blockPosition,safeWindow};root.ArcadeRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
