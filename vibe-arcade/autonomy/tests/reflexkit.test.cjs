'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const kit=require('../gamekit/reflexkit.js');

function press(core,state,action){core.step(state,{actions:{[action]:true}});}

test('ReflexKit requires 2, 4 and 6 direct parries and succeeds on the twelfth hit',()=>{
  for(const seed of [3061,3062,3063,3064,3065,3066]){
    const core=kit.create({id:'threat-parry-v1'}),state=core.create(seed),plans=kit.plan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].sequence.length),[2,4,6]);
    let hits=0;
    for(let stage=1;stage<=3;stage++)for(const action of plans[stage].sequence){press(core,state,action);hits++;if(hits<12)assert.equal(state.outcome,'playing');}
    assert.equal(hits,12);assert.equal(state.outcome,'success');assert.equal(state.completed,3);assert.equal(core.terminal(state),true);
  }
});

test('ReflexKit ties visible danger to the authoritative failure deadline',()=>{
  const core=kit.create({id:'threat-parry-v1'}),state=core.create(3061),initial=state.danger;
  for(let index=0;index<420;index++)core.step(state,{actions:{}});
  assert(state.danger<initial);assert.equal(state.outcome,'failure');assert.equal(core.terminal(state),true);
});

test('wrong direction changes canonical state, scores nothing and costs one recovery beat',()=>{
  const core=kit.create({id:'threat-parry-v1'}),state=core.create(3061),before=core.observe(state);
  press(core,state,'parry_left');
  assert.equal(state.miss,1);assert.equal(state.threatIndex,0);assert.equal(state.score,0);assert.equal(core.observe(state).quality.meaningful_actions,before.quality.meaningful_actions+1);
  press(core,state,'parry_right');
  assert.equal(state.miss,0);assert.equal(state.threatIndex,0);assert.equal(state.score,0);
  press(core,state,'parry_right');assert.equal(state.threatIndex,1);assert(state.score>0);
});

test('Rift Thread requires steering plus nine explicit surges across widening stages',()=>{
  for(const seed of [3161,3162,3163,3164,3165,3166]){
    const core=kit.create({id:'rift-thread-v1'}),state=core.create(seed),plans=kit.riftPlan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].openings.length),[2,3,4]);
    let surges=0;
    for(let stage=1;stage<=3;stage++)for(const opening of plans[stage].openings){
      while(state.lane<opening)press(core,state,'shift_right');
      while(state.lane>opening)press(core,state,'shift_left');
      press(core,state,'surge');surges++;
      if(surges<9)assert.equal(state.outcome,'playing');
    }
    assert.equal(surges,9);assert.equal(state.cleared,9);assert.equal(state.completed,3);assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
  }
});

test('Rift Thread uses the same authoritative deadline for danger and collision failure',()=>{
  const core=kit.create({id:'rift-thread-v1'}),state=core.create(3161),deadline=state.deadline;
  for(let index=0;index<deadline;index++)core.step(state,{actions:{}});
  assert.equal(state.danger,0);assert.equal(state.outcome,'failure');assert.equal(state.lastMove,'gate_collision');
});

test('Rift Thread wrong surge fails instead of granting hidden progress',()=>{
  const core=kit.create({id:'rift-thread-v1'}),state=core.create(3161);
  assert.notEqual(state.lane,state.opening);press(core,state,'surge');
  assert.equal(state.outcome,'failure');assert.equal(state.completed,0);assert.equal(state.score,0);assert.equal(state.lastMove,'wrong_surge');
});
