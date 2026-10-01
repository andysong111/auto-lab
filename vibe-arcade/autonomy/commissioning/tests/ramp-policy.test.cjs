'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {dailyCap,stage}=require('../../cycle/ramp-policy.cjs');
const fs=require('node:fs'),path=require('node:path');

test('adaptive candidate ramp starts at one per day',()=>{
  assert.equal(dailyCap(0),1);
  assert.equal(stage(0),'pilot-1');
});
test('one fully autonomous completion raises cap to three',()=>{
  assert.equal(dailyCap(1),3);
  assert.equal(dailyCap(2),3);
  assert.equal(stage(1),'proven-3');
});
test('three fully autonomous completions raise cap to six',()=>{
  assert.equal(dailyCap(3),6);
  assert.equal(dailyCap(12),6);
  assert.equal(stage(3),'stable-6');
});
test('adaptive ramp fails closed on invalid counters',()=>{
  assert.throws(()=>dailyCap(-1),/invalid_success_count/);
  assert.throws(()=>dailyCap(1.5),/invalid_success_count/);
});


test('workflows use the shared adaptive ramp and preserve serial execution',()=>{
  const root=path.resolve(__dirname,'../../../..');
  const supervisor=fs.readFileSync(path.join(root,'.github/workflows/playjolt-candidate-queue-supervisor.yml'),'utf8');
  const intake=fs.readFileSync(path.join(root,'.github/workflows/playjolt-intake-generator.yml'),'utf8');
  const relay=fs.readFileSync(path.join(root,'.github/workflows/playjolt-factory-wake-relay.yml'),'utf8');
  for(const yml of [supervisor,intake]){
    assert.match(yml,/ramp-policy\.cjs cap/);
    assert.match(yml,/commissioning\/auto-/);
    assert.match(yml,/status != "completed"/);
  }
  assert.match(supervisor,/Adaptive daily cap reached/);
  assert.match(supervisor,/cron: '17,47 \* \* \* \*'/);
  assert.match(supervisor,/group: playjolt-candidate-queue-supervisor/);
  assert.match(supervisor,/cancel-in-progress: false/);
  assert.match(intake,/steps\.quota\.outputs\.allowed == 'true'/);
  assert.match(relay,/cron: '7,37 \* \* \* \*'/);
  assert.match(relay,/actions: write/);
  assert.match(relay,/gh workflow run playjolt-candidate-queue-supervisor\.yml/);
  assert.doesNotMatch(relay,/playjolt-intake-generator\.yml|playjolt-autonomous-cycle\.yml|AUTO_PRODUCTION_SHIP/);
});
