'use strict';
function buildPacket(manifest,{base_ref='main',reviewed_by=null,decision='PENDING'}={}){
  const errors=[];
  if(manifest.state!=='READY_TO_SHIP')errors.push('state_not_ready_to_ship');
  if(manifest.qa_status!=='PASS')errors.push('qa_not_pass');
  if(manifest.quality_status!=='PASS')errors.push('quality_not_pass');
  if(manifest.release_status!=='READY')errors.push('release_not_ready');
  if(!manifest.preview_url)errors.push('preview_missing');
  if(!manifest.source_hash)errors.push('source_hash_missing');
  if(!manifest.rc_commit)errors.push('rc_commit_missing');
  if(!manifest.branch)errors.push('branch_missing');
  if(!manifest.pr_number)errors.push('pr_missing');
  if(manifest.metrics_eligibility!==false)errors.push('metrics_eligibility_unexpected');
  const owner={decision,reviewed_by,recorded_at:decision==='PENDING'?null:new Date().toISOString()};
  if(!['PENDING','APPROVE','REJECT'].includes(decision))errors.push('invalid_owner_decision');
  return {
    schema:'playjolt-release-review/1',
    passed:errors.length===0,
    errors,
    candidate:{game_id:manifest.game_id,version:manifest.version,title:manifest.title,slug:manifest.slug,preview_url:manifest.preview_url,source_hash:manifest.source_hash,branch:manifest.branch,pr_number:manifest.pr_number,pr_url:manifest.pr_url||null,rc_commit:manifest.rc_commit},
    evidence:{qa_status:manifest.qa_status,quality_status:manifest.quality_status,release_status:manifest.release_status,repair_attempt:manifest.repair_attempt,failure_reasons:manifest.failure_reasons||[]},
    owner_review:owner,
    production:{authorized:false,reason:'Production adapter remains disabled until a separate reviewed release action consumes an APPROVE decision.'},
    rollback:{base_ref,restore_commit:base_ref,source_commit:manifest.rc_commit,required:true}
  };
}
module.exports={buildPacket};
