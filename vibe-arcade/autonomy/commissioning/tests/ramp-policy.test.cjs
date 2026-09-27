'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {dailyCap,stage}=require('../../cycle/ramp-policy.cjs');

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
