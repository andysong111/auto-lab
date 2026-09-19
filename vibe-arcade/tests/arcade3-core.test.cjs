const {test}=require('node:test');const assert=require('node:assert/strict');const R=require('../arcade3/core.js');
function bot(s){
 if(s.game==='reaction-rush'){if(s.heat>65)return null;const list=s.targets.filter(t=>t.type!=='mine'&&t.hp>0&&(t.type!=='boss'||(s.tick-t.born)%180<=100));const t=list.find(t=>t.type==='battery')||list[0];if(s.energy>=8&&list.length>2)return ['pulse'];if(t&&s.tick-s.shotAt>=9){const p=R.targetPosition(s,t);return ['tap',p.x,p.y];}}
 if(s.game==='perfect-timing'&&s.tick>=s.readyAt&&Math.abs(R.blockPosition(s)-s.anchor)<=7)return ['drop'];
 if(s.game==='dont-press'){if(s.instruction==='wait')return null;if(s.tick===s.openAt+2)return ['down'];if(s.instruction==='charge'&&s.tick===s.closeAt-2)return ['up'];if(s.instruction!=='charge'&&(s.tick===s.openAt+3||s.tick===s.openAt+11))return ['up'];if(s.instruction==='double'&&s.tick===s.openAt+10)return ['down'];}
 return null;
}
function play(g,seed,agent=()=>null){const s=R.create(g,seed),actions=[];while(s.alive){const a=agent(s);if(a)actions.push([s.tick,...a]);R.step(s,a);}return {s,actions};}
for(const game of Object.keys(R.CONFIG)){
 test(game+': seed is deterministic',()=>assert.deepEqual(R.create(game,999),R.create(game,999)));
 test(game+': no-input terminal run verifies',()=>{const {s,actions}=play(game,11);const got=R.replay(game,11,actions,s.tick);assert.equal(got.score,s.score);assert(s.tick<=3600);});
 test(game+': skilled inputs replay exactly across 40 seeds',()=>{for(let seed=1;seed<=40;seed++){const {s,actions}=play(game,seed,bot);const v=R.replay(game,seed,actions,s.tick);assert.equal(v.score,s.score);assert.equal(v.version,R.CONFIG[game].version);assert(s.score>0&&s.score<=50000);assert(s.health>=0);assert(actions.length<=1200);}});
 test(game+': invalid duration, order, actions and types rejected',()=>{for(const t of [0,-1,3601,1.1,NaN,'500',null])assert.throws(()=>R.replay(game,1,[],t));for(const a of [[[2,'up'],[1,'down']],[[2,'drop'],[2,'drop']],[[-1,'drop']],[[1,'fake']],new Array(1201).fill([1,'drop'])])assert.throws(()=>R.replay(game,1,a,500));assert.throws(()=>R.replay(game,1,[],1));});
 test(game+': terminal state cannot accrue more score',()=>{const {s}=play(game,11,bot);const original=JSON.stringify(s);for(let i=0;i<10;i++)R.step(s,['drop']);assert.equal(JSON.stringify(s),original);});
}
test('unknown games and invalid seeds rejected',()=>{for(const seed of [-1,2**32,Infinity,undefined,'123'])assert.throws(()=>R.create('reaction-rush',seed));assert.throws(()=>R.create('missing',10));});
test('Reaction: mines damage shield and cannot reward a combo',()=>{const s=R.create('reaction-rush',1);s.targets=[{id:1,type:'mine',x:500,y:500,born:0,expires:100,hp:1,r:62}];R.step(s,['tap',500,500]);assert.equal(s.health,4);assert.equal(s.score,0);});
test('Reaction: heat limits spraying; pulse requires energy',()=>{const s=R.create('reaction-rush',1);s.heat=100;R.step(s,['tap',0,0]);assert(s.events.some(e=>e.kind==='overheat'));const score=s.score;R.step(s,['pulse']);assert.equal(s.score,score);assert.equal(s.energy,0);});
test('Reaction: boss shield has a visible, verified closed interval',()=>{const s=R.create('reaction-rush',1);s.tick=120;s.nextSpawn=300;s.targets=[{id:1,type:'boss',x:500,y:330,born:0,expires:3600,hp:14,maxHp:14,r:92,hitAt:-20}];const p=R.targetPosition(s,s.targets[0]);R.step(s,['tap',p.x,p.y]);assert.equal(s.targets[0].hp,14);assert(s.events.some(e=>e.kind==='shield'));});
test('Timing: full miss costs a shield, not an arbitrary score',()=>{const s=R.create('perfect-timing',1);s.tick=200;s.readyAt=0;s.width=50;s.anchor=900;R.step(s,['drop']);assert.equal(s.health,2);assert.equal(s.floor,0);});
test('Timing: three perfects restore width, never exceed 400',()=>{const s=R.create('perfect-timing',1);s.width=250;for(let n=0;n<3;n++){s.tick=s.readyAt;s.anchor=R.blockPosition(s);R.step(s,['drop']);}assert.equal(s.perfects,3);assert.equal(s.width,280);});
test('Reactor: holding through the seal is penalized',()=>{const s=R.create('dont-press',1);while(s.tick<s.openAt)R.step(s);R.step(s,['down']);while(s.tick<=s.closeAt)R.step(s);assert.equal(s.health,5);assert.equal(s.score,0);});
test('Reactor: WAIT never gives early points',()=>{const s=R.create('dont-press',1);s.instruction='wait';while(s.tick<s.start+s.duration-1)R.step(s);assert.equal(s.score,0);R.step(s);assert(s.score>0);});
test('Reactor: up/down type and repeated tick are strictly validated',()=>{assert.throws(()=>R.replay('dont-press',1,[[0,'down'],[0,'up']],100));assert.throws(()=>R.replay('dont-press',1,[[0,'tap',0,0]],100));});
test('Reaction: pointer bounds and extra fields are rejected',()=>{for(const a of [[1,'tap',NaN,1],[1,'tap',1001,500],[1,'tap','500',500],[1,'pulse',99]])assert.throws(()=>R.replay('reaction-rush',1,[a],300));});
module.exports={bot,play};
const verify=require('../../loopjolt-backend/verify-run.js');
test('Replay adapter never trusts client claimed score or game',()=>{const {s,actions}=play('reaction-rush',1,bot);const got=verify({game:'reaction-rush',version:'rr-neon-v1',seed:1},{game:'perfect-timing',score:49999,country:'US',actions,ticks:s.tick},{},R);assert.equal(got.score,s.score);assert.notEqual(got.score,49999);});
test('Replay adapter rejects a wrong server-side game version',()=>assert.throws(()=>verify({game:'perfect-timing',version:'old',seed:1},{actions:[],ticks:3600},{},R),/version_mismatch/));
