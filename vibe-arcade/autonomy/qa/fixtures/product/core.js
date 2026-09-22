(function(root){'use strict';
const target=(seed,stage)=>((1<<(stage+2))-1)^(1<<(seed%(stage+2)));
const core={
 create(seed){return {seed,stage:1,completed:0,mask:0,target:target(seed,1),outcome:'playing',tick:0,score:0,actions:0,interactions:0,latch:false};},
 step(s,i){s.tick++;if(s.outcome!=='playing')return;
 const held=!!(i.x||i.y||i.action||i.pointer);
 if(held&&!s.latch){let bit=i.pointer?Math.floor(i.pointer.x*5):i.x<0?0:i.x>0?1:i.y<0?2:i.y>0?3:i.action?4:-1;
 if(bit>=0&&bit<s.stage+2){s.mask^=1<<bit;s.actions++;s.interactions++;if(core.farming)s.score++;
 if(s.mask===s.target){s.completed++;s.score+=100;s.stage++;s.mask=0;s.target=s.stage<=3?target(s.seed,s.stage):0;if(s.stage===4)s.outcome='success';}}}
 s.latch=held;if(s.tick>=900&&s.outcome==='playing')s.outcome='failure';
 },
 observe(s){return {tick:s.tick,score:s.score,progress:Math.floor(s.tick/6),interactions:s.interactions,entities:5,quality:{stage:s.stage,complexity:s.stage<=3?s.stage+2:0,objective_progress:s.completed,meaningful_actions:s.actions,reversible_state_key:s.stage+':'+s.mask}};},
 terminal(s){return s.outcome!=='playing';}
};root.ProductFixtureCore=core;})(globalThis);
