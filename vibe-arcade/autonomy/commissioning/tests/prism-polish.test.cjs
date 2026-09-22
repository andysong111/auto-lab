'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {authorize,assertWindow}=require('../../providers/continuation.cjs');
const {plan}=require('../../qa/prism-polish.cjs');
const id='GAME-20260922-110';
function setup(){const d={jobs:{[id]:{started_at:1}},operations:{}};for(const k of ['build/v1','repair/1','repair/2','repair/3'])d.operations[id+'/'+k]={game_id:id,operation_id:id+'/'+k,state:'COMPLETE',accounted:{estimated_cost:.1}};
 const m={game_id:id,state:'READY_TO_SHIP',qa_status:'PASS',quality_status:'PASS',repair_attempt:3,max_repair_attempts:5,version:'v4',source_hash:'abc'};return {d,m};}
test('explicit follow-up preserves all lifetime operations and original start, allows only remaining repairs',()=>{const {d,m}=setup(),before=JSON.stringify(d.operations);const c=authorize(d,m,{authorization_id:'test',reason:'user follow-up',minutes:45},9000000);assert.equal(JSON.stringify(d.operations),before);assert.equal(d.jobs[id].started_at,1);assert.deepEqual(c.allowed_operations,[id+'/repair/4',id+'/repair/5']);assert.doesNotThrow(()=>assertWindow(d,id,60,9000100,id+'/repair/4'));assert.throws(()=>assertWindow(d,id,60,9000100,id+'/build/v2'));assert.throws(()=>assertWindow(d,id,60,9000100,id+'/repair/6'));});
test('follow-up clock cannot renew on retry and fails closed after deadline',()=>{const {d,m}=setup();const first=authorize(d,m,{authorization_id:'test',reason:'user'},9000000);assert.equal(authorize(d,m,{authorization_id:'test',reason:'retry'},9900000).started_at,9000000);assert.throws(()=>assertWindow(d,id,60,first.expires_at));assert.throws(()=>assertWindow(d,id,15,9000100));assert.throws(()=>authorize(d,m,{authorization_id:'different',reason:'retry'},9900000));});
test('unreconciled response, exhausted repairs or modified ledger cannot resume',()=>{for(const mutate of [({d})=>{d.operations[id+'/repair/3'].state='POLLING';},({m})=>{m.repair_attempt=5;},({m})=>{m.state='REJECTED';}]){const s=setup();mutate(s);assert.throws(()=>authorize(s.d,s.m,{authorization_id:'test',reason:'user'},9000000));}const {d,m}=setup();authorize(d,m,{authorization_id:'test',reason:'user'},9000000);d.operations[id+'/repair/1'].accounted.estimated_cost=0;assert.throws(()=>assertWindow(d,id,60,9000100));});
test('route oracle chooses cheapest alternate route and obeys visible gates',()=>{const s={board:Array.from({length:12},()=>({outlet:0})),target:1};assert.equal(plan(s).cost,0);s.gates=[{x:1,y:0},{x:2,y:2}];assert.throws(()=>plan(s));s.gates=[{x:1,y:0}];assert(plan(s).cost>0);});

test('audio probe measures scheduled AudioParam values instead of default 440 Hz getter',async()=>{
 const vm=require('node:vm'),{audioProbe}=require('../../qa/prism-polish.cjs');
 class Native {createOscillator(){return {frequency:{value:440,setValueAtTime(){}},start(){},disconnect(){},addEventListener(){}};}}
 const scope={window:{AudioContext:Native},Set,Object};
 await audioProbe({addInitScript:fn=>vm.runInNewContext('('+fn.toString()+')()',scope)});
 const c=new scope.window.AudioContext();for(const f of [330,523,784]){const o=c.createOscillator();o.frequency.setValueAtTime(f,0);o.start();}
 const a=scope.window.__polishAudio();assert.deepEqual(Array.from(a.frequencies),[440,440,440]);assert.deepEqual(Array.from(a.scheduled_frequencies,x=>x.value),[330,523,784]);
});
