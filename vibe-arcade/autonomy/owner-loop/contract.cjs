'use strict';
const fs=require('node:fs');

const POLICY_SCHEMA='playjolt-owner-loop-policy/1';
const QUEUE_SCHEMA='playjolt-marketing-rail/1';
const OWNER_ACTIONS=['submit_idea_or_popular_game_reference','approve_reject_or_advise_from_review_packet'];
const RELEASE_SCOPES=['production_release','organic_marketing_publication'];

function nonempty(value){return typeof value==='string'&&value.trim().length>0;}
function sha256(value){return typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);}

function validatePolicy(policy){
  if(!policy||policy.schema!==POLICY_SCHEMA)throw Error('invalid_owner_loop_policy_schema');
  if(JSON.stringify(policy.owner_actions)!==JSON.stringify(OWNER_ACTIONS))throw Error('owner_actions_must_remain_input_and_decision_only');
  if(policy.production_auto_publish!==false)throw Error('production_auto_publish_must_remain_false');
  if(policy.paid_ads_auto_start!==false)throw Error('paid_ads_auto_start_must_remain_false');
  const required=['playable_preview','measured_qa_comparison','provider_cost_and_repair_ledger','release_packet_status','marketing_preview'];
  for(const item of required)if(!policy.approval_packet?.required_evidence?.includes(item))throw Error('approval_packet_evidence_missing:'+item);
  return policy;
}

function validateIdea(input,policy){
  validatePolicy(policy);
  if(!input||!nonempty(input.id)||!nonempty(input.summary))throw Error('invalid_owner_idea');
  if(!['OWNER_IDEA','POPULAR_GAME_REFERENCE'].includes(input.source_type))throw Error('invalid_owner_idea_source');
  if(input.source_type==='POPULAR_GAME_REFERENCE'){
    if(!nonempty(input.reference_url))throw Error('popular_game_reference_url_required');
    if(!Array.isArray(input.transferable_principles)||input.transferable_principles.length<1)throw Error('popular_game_principles_required');
    const forbidden=policy.popular_game_reference_policy.forbidden;
    if(!forbidden.every(item=>input.copy_boundary?.forbidden?.includes(item)))throw Error('popular_game_copy_boundary_incomplete');
  }
  return input;
}

function validateEntry(entry){
  if(!entry||!nonempty(entry.rail_id)||!nonempty(entry.game_id)||!nonempty(entry.title))throw Error('invalid_marketing_rail_entry');
  if(!nonempty(entry.source?.commit)||!nonempty(entry.source?.path))throw Error('marketing_source_lineage_missing');
  if(!Array.isArray(entry.owner_decision?.scopes))throw Error('owner_decision_scopes_missing');
  if(entry.publication?.paid_ads_authorized!==false)throw Error('paid_ads_must_remain_false');
  return entry;
}

function validateQueue(queue){
  if(!queue||queue.schema!==QUEUE_SCHEMA||!Array.isArray(queue.games))throw Error('invalid_marketing_rail_schema');
  const ids=new Set();
  for(const entry of queue.games){validateEntry(entry);if(ids.has(entry.rail_id))throw Error('duplicate_marketing_rail_id');ids.add(entry.rail_id);}
  return queue;
}

function assetProductionGate(entry){
  validateEntry(entry);
  const scopes=entry.owner_decision.scopes;
  if(entry.owner_decision.decision!=='APPROVE')return {allowed:false,state:'BLOCKED_OWNER_APPROVAL'};
  if(!scopes.includes('marketing_asset_production'))return {allowed:false,state:'BLOCKED_MARKETING_SCOPE'};
  return {allowed:true,state:entry.assets?.qa_passed?'ASSETS_QA_PASSED':'ASSET_PRODUCTION_READY'};
}

function publicationGate(entry){
  validateEntry(entry);
  const blockers=[],scopes=entry.owner_decision.scopes;
  if(entry.owner_decision.decision!=='APPROVE')blockers.push('owner_approval_missing');
  for(const scope of RELEASE_SCOPES)if(!scopes.includes(scope))blockers.push(scope+'_scope_missing');
  if(entry.release?.rc_ready!==true)blockers.push('rc_ready_missing');
  if(entry.release?.exact_source_preview!==true)blockers.push('exact_source_preview_missing');
  if(!sha256(entry.release?.release_packet_sha256))blockers.push('release_packet_sha256_missing');
  if(entry.release?.production_released!==true)blockers.push('production_release_missing');
  if(!/^https:\/\//.test(entry.release?.live_url||''))blockers.push('live_game_url_missing');
  if(entry.assets?.qa_passed!==true)blockers.push('marketing_asset_qa_missing');
  if(entry.scheduler?.accounts_connected!==true)blockers.push('social_accounts_not_connected');
  if(entry.scheduler?.hosted_copy_verified!==true)blockers.push('hosted_copy_not_verified');
  if(entry.publication?.paid_ads_authorized!==false)blockers.push('paid_ads_boundary_invalid');
  return {allowed:blockers.length===0,state:blockers.length?'BLOCKED':'READY_TO_PUBLISH',blockers};
}

function summarize(queue){
  validateQueue(queue);
  return queue.games.map(entry=>({rail_id:entry.rail_id,title:entry.title,asset_production:assetProductionGate(entry),publication:publicationGate(entry)}));
}

function main(){
  const [policyFile,queueFile]=process.argv.slice(2);
  if(!policyFile||!queueFile)throw Error('usage: contract.cjs POLICY QUEUE');
  validatePolicy(JSON.parse(fs.readFileSync(policyFile,'utf8')));
  process.stdout.write(JSON.stringify(summarize(JSON.parse(fs.readFileSync(queueFile,'utf8'))),null,2)+'\n');
}
if(require.main===module){try{main();}catch(error){console.error(error.message);process.exit(2);}}
module.exports={validatePolicy,validateIdea,validateQueue,assetProductionGate,publicationGate,summarize};
