'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'lab/taste-calibration'),policyFile=path.join(root,'autonomy/foundry/taste-calibration.json');
const {validatePolicy,effectiveDailyCap,gate,consecutiveRegressions}=require('../autonomy/foundry/taste-calibration.cjs');

test('owner-selected Halo Guard polish remains zero-paid, private and blocks sequence 38',()=>{
  const policy=validatePolicy(JSON.parse(fs.readFileSync(policyFile,'utf8')));
  assert.equal(policy.state,'SELECTED_FOR_POLISH');assert.equal(policy.required_from_sequence,38);assert.equal(policy.selected_prototype_id,'radial-guard-c');
  assert.equal(policy.prototypes.find(x=>x.id==='kinetic-launch-a').owner_disposition,'REJECTED');assert.equal(policy.prototypes.find(x=>x.id==='chain-reaction-b').owner_disposition,'REJECTED');assert.equal(policy.prototypes.find(x=>x.id==='radial-guard-c').owner_disposition,'SELECTED_FOR_POLISH');
  assert.equal(policy.post_selection_policy.max_candidates_per_utc_day,1);assert.equal(policy.post_selection_policy.pause_after_consecutive_measured_regressions,2);assert.equal(policy.post_selection_policy.production_authorized,false);
  assert.equal(effectiveDailyCap(6,policy),0);assert.deepEqual(gate({sequence:38,policy,learningProfile:{}}),{allowed:false,reason:'owner_taste_polish_pending'});
  const html=fs.readFileSync(path.join(lab,'index.html'),'utf8'),js=fs.readFileSync(path.join(lab,'game.js'),'utf8');
  assert.match(html,/noindex,nofollow/);assert.match(html,/Arc Relay와 Bloom Circuit은 탈락/);assert.match(html,/Halo Guard 보강판/);
  assert.doesNotMatch(js,/kinetic-launch-a/);assert.doesNotMatch(js,/chain-reaction-b/);assert.match(js,/radial-guard-c/);assert.match(js,/OVERDRIVE/);assert.match(js,/halo-guardian-v1\.png/);assert.match(js,/rescue-wisp-v1\.png/);assert.match(js,/shard-raider-v1\.png/);assert.doesNotMatch(html+js,/https?:\/\//);
  for(const file of ['halo-guardian-v1.png','rescue-wisp-v1.png','shard-raider-v1.png']){const asset=path.join(lab,'assets',file);assert(fs.existsSync(asset));assert(fs.statSync(asset).size<1_500_000)}
});

test('selected calibration clamps throughput to one and pauses after two measured regressions',()=>{
  const policy={...JSON.parse(fs.readFileSync(policyFile,'utf8')),state:'SELECTED',selected_prototype_id:'kinetic-launch-a',owner_selected_at:'2026-10-05T00:00:00Z'};
  assert.equal(effectiveDailyCap(6,policy),1);assert.equal(effectiveDailyCap(1,policy),1);
  const profile={recent_outcomes:[
    {sequence:38,quality_failure_count:8},{sequence:39,quality_failure_count:11},{sequence:40,quality_failure_count:14}
  ]};
  assert.equal(consecutiveRegressions(profile,38),2);
  assert.equal(gate({sequence:41,policy,learningProfile:profile}).reason,'owner_taste_regression_guard');
  profile.recent_outcomes.push({sequence:41,quality_failure_count:10});
  assert.equal(gate({sequence:42,policy,learningProfile:profile}).allowed,true);
});
