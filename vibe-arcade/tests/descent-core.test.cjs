const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../descent/core.js');
function run(seed,bot){const s=R.create(seed),actions=[];while(s.alive){const a=bot?.(s)||null;if(a)actions.push([s.tick,...a]);R.step(s,a);}return{s,actions};}
function bot(s){
 const r=R.ringAt(s);if(!r)return null;
 if(s.energy>=100&&s.burst===0&&r.kind==='guardian')return ['burst'];
 // Match the visible gap, except a closed shutter: wait safely on solid stone.
 const future={...s,motion:s.motion+Math.max(0,s.nextImpact-s.tick)*(s.tick<s.focusUntil?1:2)};
 const ring=R.ringAt(future);let target=R.CONTACT-ring.gap-Math.trunc(future.motion*ring.speed/2);
 if(!ring.open)target+=ring.width/2+350;
 const delta=R.mod(target-s.rotation+1800)-1800;
 return Math.abs(delta)>1?['turn',R.clamp(Math.round(delta),-150,150)]:null;
}
test('48 deterministic rings, 12 sectors, three guardian gates',()=>{const s=R.create(4);assert.equal(s.rings.length,48);assert.equal(s.rings.filter(r=>r.kind==='guardian').length,3);assert.equal(s.rings.at(-1).stage,12);assert.deepEqual(s,R.create(4));assert.notDeepEqual(s.rings,R.create(5).rings);});
test('invalid seeds and durations never replay',()=>{for(const seed of [-1,NaN,1.5,2**32,'3'])assert.throws(()=>R.create(seed));for(const ticks of [0,-1,5401,NaN,1.2])assert.throws(()=>R.replay(1,[],ticks));});
test('front contact is 900 and exactly matches gap boundaries',()=>{const s=R.create(1),r=s.rings[0];s.rotation=R.mod(R.CONTACT-r.gap);assert.equal(R.contact(s).kind,'gap');assert.equal(R.contact(s).perfect,true);s.rotation=R.mod(s.rotation+r.width/2+1);assert.equal(R.contact(s).kind,'solid');});
test('red plate damage only happens on contact, not early',()=>{const s=R.create(3);s.rotation=R.mod(R.CONTACT-s.rings[0].hazard);R.step(s);assert.equal(s.health,3);s.tick=s.nextImpact;R.step(s);assert.equal(s.health,2);assert.equal(s.misses,1);});
test('a centered clean fall charges burst and awards a perfect',()=>{const s=R.create(4);s.rotation=R.mod(R.CONTACT-s.rings[0].gap);s.tick=s.nextImpact;R.step(s);assert.equal(s.floor,1);assert.equal(s.perfects,1);assert.equal(s.energy,37);assert(s.score>0);});
test('uncharged burst cannot skip a ring',()=>{const s=R.create(1);s.tick=s.nextImpact;R.step(s,['burst']);assert.equal(s.burst,0);assert.equal(s.floor,0);});
test('charged burst clears exactly three rings and never recharges itself',()=>{const s=R.create(2);s.energy=100;R.step(s,['burst']);assert.equal(s.burst,3);for(let i=0;i<3;i++){s.tick=s.nextImpact;R.step(s);}assert.equal(s.floor,3);assert.equal(s.burst,0);assert.equal(s.energy,0);s.rotation=R.mod(R.CONTACT-s.rings[3].hazard);s.tick=s.nextImpact;R.step(s);assert.equal(s.floor,3);assert.equal(s.health,2);});
test('brittle stone needs two safe contacts and does not count as perfect',()=>{const s=R.create(8);s.floor=s.rings.findIndex(r=>r.kind==='brittle');s.rotation=R.mod(R.CONTACT-s.rings[s.floor].gap+800);const f=s.floor;s.tick=s.nextImpact;R.step(s);assert.equal(s.floor,f);s.tick=s.nextImpact;R.step(s);assert.equal(s.floor,f+1);assert.equal(s.perfects,0);});
test('shutter opens and closes on canonical motion time',()=>{const s=R.create(1);s.floor=15;const r=s.rings[15];s.motion=R.mod(20-r.phase,R.GUARDIANS[0].period);assert.equal(R.ringAt(s).open,false);s.rotation=R.mod(R.CONTACT-r.gap-Math.trunc(s.motion*r.speed/2));assert.equal(R.contact(s).kind,'gate');s.motion=R.mod(160-r.phase,R.GUARDIANS[0].period);assert.equal(R.ringAt(s).open,true);});
test('focus slows obstacles but not ticks or countdown',()=>{const s=R.create(1);s.focusUntil=100;R.step(s);assert.equal(s.tick,1);assert.equal(s.motion,1);s.focusUntil=0;R.step(s);assert.equal(s.motion,3);});
test('idle attempts earn no survival points',()=>{const {s}=run(7);assert.equal(s.score,0);assert.equal(s.floor,0);assert.equal(s.won,false);assert.equal(s.reason,'time_up');});
test('all three regions are completable and deterministic across many seeds',()=>{for(const seed of [1,7,42,125904,987654]){const {s,actions}=run(seed,bot);assert.equal(s.won,true,`seed ${seed}: ${s.reason} at ${s.floor}`);assert.equal(s.floor,48);assert.equal(s.guardians,3);assert(s.score<50000);assert(actions.length<2500);const verified=R.replay(seed,actions,s.tick);assert.equal(verified.score,s.score);assert.equal(verified.ticks,s.tick);}});
test('duplicate, malformed and surplus inputs are rejected',()=>{for(const a of [[[1,'turn',151]],[[1,'turn',0]],[[1,'steer',2]],[[1,'burst',4]],[[2,'turn',1],[2,'burst']],[[3,'burst'],[2,'burst']],[[0,'unknown']]])assert.throws(()=>R.replay(1,a,100));assert.throws(()=>R.replay(1,new Array(2501).fill([1,'burst']),5400));assert.throws(()=>R.replay(1,[],10));});
test('terminal states cannot be extended or change their score',()=>{const {s,actions}=run(2,bot),score=s.score,tick=s.tick;R.step(s,['burst']);assert.equal(s.score,score);assert.equal(s.tick,tick);assert.throws(()=>R.replay(2,actions,tick+1));});

test('guardians have different seal counts and shift the opening after a hit',()=>{
 for(const region of [0,1,2]){
  const s=R.create(42);s.floor=region*16+15;const start=s.floor;
  for(let n=0;n<R.GUARDIANS[region].seals;n++){
   const boss=R.GUARDIANS[region];s.motion=R.mod(boss.openFrom+25-s.rings[s.floor].phase,boss.period)-2;
   const future=R.ringAt({...s,motion:s.motion+2});s.rotation=R.mod(R.CONTACT-future.gap-Math.trunc((s.motion+2)*future.speed/2));s.tick=s.nextImpact;
   const before=R.ringAt(s).gap;R.step(s);
   if(n<boss.seals-1){assert.equal(s.floor,start);assert.equal(s.guardianHits,n+1);assert.notEqual(R.ringAt(s).gap,before);assert(s.events.some(e=>e.kind==='seal'));}
   else{assert.equal(s.floor,start+1);assert.equal(s.guardians,1);assert.equal(s.guardianHits,0);}
  }
  assert.equal(s.sealsBroken,R.GUARDIANS[region].seals);
 }
});
test('one burst cannot skip a multi-seal guardian',()=>{
 const s=R.create(1);s.floor=31;s.energy=100;s.tick=s.nextImpact;R.step(s,['burst']);
 assert.equal(s.floor,31);assert.equal(s.burst,0);assert.equal(s.energy,0);assert.equal(s.guardianHits,1);assert.equal(s.guardians,0);
 // Hold no controls on dangerous stone: it cannot auto-clear the remaining seal.
 const r=R.ringAt(s);s.rotation=R.mod(R.CONTACT-r.hazard-Math.trunc((s.motion+2)*r.speed/2));s.tick=s.nextImpact;R.step(s);
 assert.equal(s.floor,31);assert.equal(s.guardianHits,1);
});
test('full playthrough breaks all six seals without inventing survival points',()=>{
 const {s,actions}=run(7,bot);assert(s.won);assert.equal(s.sealsBroken,6);assert.equal(s.guardians,3);
 assert.equal(R.replay(7,actions,s.tick).score,s.score);assert(s.tick<=5400);
});
test('ordinary burst is bounded even across pickup floors',()=>{
 const s=R.create(13);s.floor=5;s.energy=100;R.step(s,['burst']);
 for(let n=0;n<3;n++){s.tick=s.nextImpact;R.step(s);}
 assert.equal(s.floor,8);assert.equal(s.burst,0);assert(s.energy<100);
});

module.exports={bot,run};
