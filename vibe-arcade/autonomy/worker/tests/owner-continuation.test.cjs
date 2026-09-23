'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {activeElapsed}=require('../../providers/active-wall-clock.cjs');
const {ProviderManager}=require('../../providers/manager.cjs');
const pause=(start,end)=>({reason:'owner_review_hold',owner_authorized:true,started_at:start,ended_at:end,checkpoint_manifest_sha256:'a'.repeat(64)});
test('owner review excludes only a closed authorized pause; original active budget remains consumed',()=>{
 const job={started_at:1000,owner_review_pauses:[pause(11000,1011000)]};
 assert.equal(activeElapsed(job,1016000),15000);assert.equal(job.started_at,1000);
 assert.equal(activeElapsed({started_at:1000},1016000),1015000);
 const manager=Object.create(ProviderManager.prototype);manager.config={per_game:{max_wall_clock_minutes:1}};
 manager.now=()=>1061000;assert.throws(()=>manager.assertWallFrom({jobs:{g:job}},'g'),{code:'game_wall_clock_limit'});
});
test('open, overlapping, future, unapproved and unbound pause data are rejected',()=>{
 for(const pauses of [[pause(500,1500)],[pause(11000,30000),pause(20000,40000)],[pause(11000,60000)],
  [{...pause(11000,20000),owner_authorized:false}],[{...pause(11000,20000),checkpoint_manifest_sha256:''}]])
  assert.throws(()=>activeElapsed({started_at:1000,owner_review_pauses:pauses},50000),{code:'invalid_owner_review_pause'});
});
