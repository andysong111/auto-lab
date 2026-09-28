'use strict';
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(value))).digest('hex');
function buildPacket(manifest,{base_ref='main',reviewed_by=null,decision='PENDING',preview_smoke=null}={}){
  const errors=[];
  if(manifest.state!=='READY_TO_SHIP')errors.push('state_not_ready_to_ship');
  if(manifest.qa_status!=='PASS')errors.push('qa_not_pass');
  if(!manifest.product_contract||manifest.product_qa_status!=='PASS')errors.push('product_qa_not_pass');
  if(!manifest.commercial_contract||manifest.commercial_qa_status!=='PASS')errors.push('commercial_qa_not_pass');
  if(manifest.technical_qa_status!=='PASS')errors.push('technical_qa_not_pass');
  if(manifest.quality_status!=='PASS')errors.push('quality_not_pass');
  if(manifest.release_status!=='READY')errors.push('release_not_ready');
  if(!manifest.preview_url)errors.push('preview_missing');
  if(!manifest.source_hash)errors.push('source_hash_missing');
  if(!manifest.rc_commit)errors.push('rc_commit_missing');
  if(!manifest.branch)errors.push('branch_missing');
  if(!manifest.base_commit||!(/^[a-f0-9]{40}$/).test(manifest.base_commit))errors.push('base_commit_missing');
  if(!preview_smoke?.passed)errors.push('preview_smoke_missing');
  if(manifest.metrics_eligibility!==false)errors.push('metrics_eligibility_unexpected');
  const owner={decision,reviewed_by,recorded_at:decision==='PENDING'?null:new Date().toISOString()};
  if(!['PENDING','APPROVE','REJECT'].includes(decision))errors.push('invalid_owner_decision');
  return {
    schema:'playjolt-release-review/2',
    passed:errors.length===0,
    errors,
    candidate:{game_id:manifest.game_id,version:manifest.version,title:manifest.title,slug:manifest.slug,source_path:manifest.source_path,preview_url:manifest.preview_url,source_hash:manifest.source_hash,branch:manifest.branch,pr_number:manifest.pr_number||null,pr_url:manifest.pr_url||null,rc_commit:manifest.rc_commit,deployment_id:manifest.deployment_id||null},
    evidence:{commercial_qa_status:manifest.commercial_qa_status||'UNVERIFIED',technical_qa_status:manifest.technical_qa_status||'UNVERIFIED',product_qa_status:manifest.product_qa_status||'UNVERIFIED',qa_status:manifest.qa_status,quality_status:manifest.quality_status,release_status:manifest.release_status,repair_attempt:manifest.repair_attempt,failure_reasons:manifest.failure_reasons||[],preview_smoke:{passed:preview_smoke?.passed===true,sha256:preview_smoke?digest(preview_smoke):null,method:preview_smoke?.method||null,checks:preview_smoke?.checks?.length||0}},
    owner_review:owner,
    production:{authorized:false,automatic:false,reason:'Production requires a repository-owner workflow dispatch that validates this packet SHA-256 and an exact confirmation phrase.'},
    rollback:{base_ref,base_commit:manifest.base_commit||null,restore_commit:manifest.base_commit||null,source_commit:manifest.rc_commit,required:true}
  };
}
module.exports={buildPacket,digest};
