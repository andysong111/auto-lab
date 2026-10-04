'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {validatePolicy,validateIdea,validateQueue,assetProductionGate,publicationGate}=require('../autonomy/owner-loop/contract.cjs');
const policy=require('../autonomy/owner-loop/policy.json'),queue=require('../marketing/rail/queue.json');

test('owner operating model keeps human work to idea input and approval decision',()=>{
  assert.equal(validatePolicy(policy),policy);
  assert.deepEqual(policy.owner_actions,['submit_idea_or_popular_game_reference','approve_reject_or_advise_from_review_packet']);
  assert.equal(policy.production_auto_publish,false);assert.equal(policy.paid_ads_auto_start,false);
});

test('popular game input transfers principles only under the complete copy boundary',()=>{
  const idea={id:'idea-1',source_type:'POPULAR_GAME_REFERENCE',summary:'Study a successful short-session game',reference_url:'https://play.google.com/example',transferable_principles:['first_action_clarity'],copy_boundary:{forbidden:[...policy.popular_game_reference_policy.forbidden]}};
  assert.equal(validateIdea(idea,policy),idea);
  assert.throws(()=>validateIdea({...idea,copy_boundary:{forbidden:['names_or_branding']}},policy),/popular_game_copy_boundary_incomplete/);
});

test('Halo Guard is on asset production rail but cannot publish before release proof',()=>{
  assert.equal(validateQueue(queue),queue);const entry=queue.games[0];
  assert.deepEqual(assetProductionGate(entry),{allowed:true,state:'ASSET_PRODUCTION_READY'});
  const gate=publicationGate(entry);assert.equal(gate.allowed,false);assert.equal(gate.state,'BLOCKED');
  for(const blocker of ['production_release_missing','live_game_url_missing','marketing_asset_qa_missing','organic_marketing_publication_scope_missing'])assert(gate.blockers.includes(blocker));
  assert.equal(entry.scheduler.scheduled_posts,0);assert.equal(entry.scheduler.published_posts,0);
});

test('publication requires one explicit scoped approval and complete release/marketing evidence',()=>{
  const entry=structuredClone(queue.games[0]);
  entry.owner_decision.scopes.push('production_release','organic_marketing_publication');
  Object.assign(entry.release,{rc_ready:true,exact_source_preview:true,release_packet_sha256:'a'.repeat(64),production_released:true,live_url:'https://playjolt.example/games/halo-guard/'});
  entry.assets.qa_passed=true;entry.scheduler.accounts_connected=true;entry.scheduler.hosted_copy_verified=true;
  assert.deepEqual(publicationGate(entry),{allowed:true,state:'READY_TO_PUBLISH',blockers:[]});
});
