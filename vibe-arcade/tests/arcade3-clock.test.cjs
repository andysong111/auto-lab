const {test}=require('node:test');const assert=require('node:assert/strict');const C=require('../arcade3/clock.js');
test('regular 60, 30, 20 and 10 FPS do not discard simulation time',()=>{for(const ms of [1000/60,1000/30,50,100]){const c=C.create();for(let n=0;n<3600;n++)assert(C.observe(c,ms));assert.equal(c.discardedMs,0);}});
test('a frame stall above 250ms invalidates ranked eligibility',()=>{const c=C.create();assert.equal(C.observe(c,251),false);assert.equal(C.observe(c,16),false);});
test('repeated 8 FPS frames cannot buy extra reaction time',()=>{const c=C.create();for(let n=0;n<6;n++)assert(C.observe(c,125));assert.equal(C.observe(c,125),false);});
test('small isolated jitter is tolerated but accumulated lost time is bounded',()=>{const c=C.create();assert(C.observe(c,150));assert(C.observe(c,150));assert(C.observe(c,150));assert.equal(C.observe(c,101),false);});
test('invalid timing values fail closed',()=>{for(const ms of [-1,NaN,Infinity])assert.equal(C.observe(C.create(),ms),false);});
