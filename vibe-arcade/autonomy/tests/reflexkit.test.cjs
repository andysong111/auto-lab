'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const kit=require('../gamekit/reflexkit.js');

function press(core,state,action){core.step(state,{actions:{[action]:true}});}
function assertDiagnostics(core,state){const o=core.observe(state);for(const key of ['tick','score','progress','interactions','entities'])assert(Number.isFinite(o[key]),key+' must be finite');assert(o.entities>=0&&o.entities<=64);}

test('ReflexKit requires 2, 4 and 6 direct parries and succeeds on the twelfth hit',()=>{
  for(const seed of [3061,3062,3063,3064,3065,3066]){
    const core=kit.create({id:'threat-parry-v1'}),state=core.create(seed),plans=kit.plan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].sequence.length),[2,4,6]);
    let hits=0;
    for(let stage=1;stage<=3;stage++)for(const action of plans[stage].sequence){press(core,state,action);hits++;if(hits<12)assert.equal(state.outcome,'playing');}
    assert.equal(hits,12);assert.equal(state.outcome,'success');assert.equal(state.completed,3);assert.equal(core.terminal(state),true);
    assertDiagnostics(core,state);
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
    assertDiagnostics(core,state);
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

test('Constellation Weave completes 2, 3 and 4 socket lattices through the protected plan',()=>{
  for(const seed of [3263,3264,3265,3266,3267,3268]){
    const core=kit.create({id:'constellation-weave-v1'}),state=core.create(seed),plans=kit.weavePlan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].sockets),[2,3,4]);
    let weaves=0;
    for(let stage=1;stage<=3;stage++)for(const socket of plans[stage].order){
      press(core,state,kit.weaveActions[socket]);weaves++;
      if(weaves<9)assert.equal(state.outcome,'playing');
    }
    assert.equal(weaves,9);assert.equal(state.woven,9);assert.equal(state.completed,3);
    assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
    assertDiagnostics(core,state);
  }
});

test('Constellation Weave fails honestly when a thread crosses the same socket',()=>{
  const core=kit.create({id:'constellation-weave-v1'}),state=core.create(3263);
  press(core,state,'weave_left');press(core,state,'weave_left');
  assert.equal(state.outcome,'failure');assert.equal(state.completed,0);assert.equal(state.lastWeave,'lattice_overload');
});

test('Constellation Weave rejects later-stage sockets before they unlock',()=>{
  const core=kit.create({id:'constellation-weave-v1'}),state=core.create(3263);
  press(core,state,'weave_up');
  assert.equal(state.outcome,'failure');assert.equal(state.score,0);assert.equal(state.lastWeave,'locked_socket');
});

test('Orbit Dock completes 2, 3 and 4 beacon deliveries through reversible rings',()=>{
  for(const seed of [3361,3362,3363,3364,3365,3366]){
    const core=kit.create({id:'orbit-dock-v1'}),state=core.create(seed),plans=kit.dockPlan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].gate_count),[2,3,4]);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].available.length),[3,4,5]);
    let docks=0;
    for(let stage=1;stage<=3;stage++)for(const target of plans[stage].targets){
      while(state.position!==target)press(core,state,'orbit_right');
      press(core,state,'dock');docks++;
      if(docks<9)assert.equal(state.outcome,'playing');
    }
    assert.equal(docks,9);assert.equal(state.docked,9);assert.equal(state.completed,3);
    assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
    assertDiagnostics(core,state);
  }
});

test('Orbit Dock warns once, allows movement recovery and fails a repeated bad dock',()=>{
  const core=kit.create({id:'orbit-dock-v1'}),state=core.create(3361);
  assert.notEqual(state.position,state.target);press(core,state,'dock');
  assert.equal(state.warning,1);assert.equal(state.outcome,'playing');assert.equal(state.score,0);
  press(core,state,'orbit_right');assert.equal(state.warning,0);assert(state.score>0);
  while(state.position===state.target)press(core,state,'orbit_right');
  press(core,state,'dock');assert.equal(state.warning,1);press(core,state,'dock');
  assert.equal(state.outcome,'failure');assert.equal(state.lastDock,'second_bad_dock');
});

test('Orbit Dock exposes and enforces one authoritative idle deadline',()=>{
  const core=kit.create({id:'orbit-dock-v1'}),state=core.create(3361),initial=state.danger;
  for(let index=0;index<2700;index++)core.step(state,{actions:{}});
  assert(state.danger<initial);assert.equal(state.danger,0);assert.equal(state.outcome,'failure');assert.equal(state.lastDock,'relay_timeout');
});

test('Thermal Vent stabilizes 3, 4 and 5 deterministic pressure beats',()=>{
  for(const seed of [3465,3466,3467,3468,3469,3470]){
    const core=kit.create({id:'thermal-vent-v1'}),state=core.create(seed),plans=kit.ventPlan(seed);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].hazards.length),[3,4,5]);
    assert.deepEqual([1,2,3].map(stage=>plans[stage].available.length),[2,3,4]);
    let beats=0;
    for(let stage=1;stage<=3;stage++)for(const hazard of plans[stage].hazards){press(core,state,hazard===0?'vent_left':'vent_right');beats++;if(beats<12)assert.equal(state.outcome,'playing');assertDiagnostics(core,state);}
    assert.equal(beats,12);assert.equal(state.cooled,12);assert.equal(state.completed,3);assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
  }
});

test('Thermal Vent exposes recoverable warning and authoritative timeout failure',()=>{
  const core=kit.create({id:'thermal-vent-v1'}),state=core.create(3465);let warned=false;
  for(let step=0;step<10&&state.outcome==='playing';step++){press(core,state,state.hazard===0?'vent_right':'vent_left');warned||=state.warning===1;}
  assert.equal(warned,true);
  const idle=core.create(3465),deadline=idle.deadline;for(let tick=0;tick<deadline;tick++)core.step(idle,{actions:{}});
  assert.equal(idle.outcome,'failure');assert.equal(idle.lastVent,'thermal_timeout');assert.equal(core.terminal(idle),true);assertDiagnostics(core,idle);
});
