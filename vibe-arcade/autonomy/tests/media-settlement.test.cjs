'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {settle}=require('../qa/media-settlement.cjs');
test('media settlement tolerates short native-event delivery delay',async()=>{
  let t=0,reads=0;
  const result=await settle({
    read:async()=>({native:true,presentation:++reads>=3}),
    matches:s=>s.native&&s.presentation,
    delay:async ms=>{t+=ms;},
    advance:async()=>{},
    now:()=>t,
    timeoutMs:200
  });
  assert(result.polls>=2);assert.equal(result.settled.presentation,true);
});
test('media settlement still fails permanently stale presentation',async()=>{
  let t=0;
  await assert.rejects(()=>settle({
    read:async()=>({native:true,presentation:false}),
    matches:s=>s.native&&s.presentation,
    delay:async ms=>{t+=ms;},
    advance:async()=>{},
    now:()=>t,
    timeoutMs:60
  }),/did not settle/);
});
