"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),{decide,wilson}=require('./decide.cjs');
function fixture(){return {internalOrBotTrafficExcluded:true,telemetryHealthy:true,factor:'hook',factorsChanged:1,sameChannel:true,matchedObservationWindows:true,control:{ageHours:72,posts:3,views:5000,sessions:1000,startingSessions:300,replayingSessions:90,scope:'content_tagged'},variant:{ageHours:72,posts:3,views:5000,sessions:1000,startingSessions:500,replayingSessions:150,scope:'content_tagged'}};}
test('candidate KEEP is not causal proof',()=>{const r=decide(fixture());assert.equal(r.state,'KEEP');assert.equal(r.causalClaim,false);});
for(const [field,val,state] of [['ageHours',20,'WAIT'],['posts',1,'INSUFFICIENT_DATA'],['sessions',40,'DATA_GAP'],['views',100,'INSUFFICIENT_DATA'],['scope','channel_only','DATA_GAP'],['startingSessions',undefined,'DATA_GAP']])test('guard '+field,()=>{const f=fixture();f.variant[field]=val;assert.equal(decide(f).state,state);});
test('views alone cannot decide',()=>assert.equal(decide({control:{views:100000},variant:{views:200000}}).state,'DATA_GAP'));
test('several factors rejected',()=>{const f=fixture();f.factorsChanged=2;assert.equal(decide(f).state,'INVALID_EXPERIMENT');});
test('unequal windows rejected',()=>{const f=fixture();f.matchedObservationWindows=false;assert.equal(decide(f).state,'INVALID_EXPERIMENT');});
test('overlapping starts inconclusive',()=>{const f=fixture();f.variant.startingSessions=310;assert.equal(decide(f).state,'INCONCLUSIVE');});
test('one loss does not kill',()=>{const f=fixture();[f.control,f.variant]=[f.variant,f.control];assert.equal(decide(f).state,'MODIFY');f.completedLosses=2;assert.equal(decide(f).state,'KILL');});
test('poor replay cannot win',()=>{const f=fixture();f.variant.replayingSessions=1;assert.equal(decide(f).state,'INCONCLUSIVE');});
test('exclusion required',()=>{const f=fixture();delete f.internalOrBotTrafficExcluded;assert.equal(decide(f).state,'DATA_GAP');});
test('Wilson rejects inconsistent counts',()=>{assert.throws(()=>wilson(2,1));const r=wilson(30,100);assert(r.low<.3&&r.high>.3&&r.high<1);});
