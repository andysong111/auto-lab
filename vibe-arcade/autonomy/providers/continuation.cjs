'use strict';
// Trusted operator action for an explicitly approved follow-up on an already verified RC.
// It never changes lifetime call/token/cost totals or Factory repair/version counters.
const {hash}=require('../orchestrator/files.cjs');
const {ProviderPause}=require('./errors.cjs');
function authorize(d,m,{authorization_id,reason,minutes=45},now=Date.now()) {
  const job=d.jobs[m.game_id],ops=Object.values(d.operations).filter(o=>o.game_id===m.game_id);
  if(!job||!authorization_id||!reason||!Number.isInteger(minutes)||minutes<1||minutes>60)throw Error('invalid_continuation');
  if(job.continuation){if(job.continuation.authorization_id!==authorization_id)throw Error('continuation_already_authorized');return job.continuation;}
  if(m.state!=='READY_TO_SHIP'||m.qa_status!=='PASS'||m.quality_status!=='PASS'||m.repair_attempt>=m.max_repair_attempts||m.max_repair_attempts>5||ops.some(o=>o.state!=='COMPLETE')||ops.length!==m.repair_attempt+1)throw Error('continuation_requires_reconciled_ready_candidate');
  job.continuation={authorization_id,reason,started_at:now,expires_at:now+minutes*60000,
    original_started_at:job.started_at,starting_version:m.version,source_hash:m.source_hash,
    prior_operations_hash:hash(Object.fromEntries(ops.map(o=>[o.operation_id,o]))),prior_operation_ids:ops.map(o=>o.operation_id),
    allowed_operations:Array.from({length:m.max_repair_attempts-m.repair_attempt},(_,i)=>`${m.game_id}/repair/${m.repair_attempt+1+i}`)};
  return job.continuation;
}
function assertWindow(d,id,minutes,now,operationId) {
  const j=d.jobs[id];if(!j)return;
  const c=j.continuation;
  if(c){
    if(!Number.isFinite(c.started_at)||!Number.isFinite(c.expires_at)||c.expires_at-c.started_at>60*60000||c.expires_at<=c.started_at||now<c.started_at||now>=c.expires_at||!Array.isArray(c.allowed_operations)||operationId&&!c.allowed_operations.includes(operationId))throw new ProviderPause('game_wall_clock_limit',undefined,'PAUSED_BUDGET');
    const prior=Object.fromEntries(c.prior_operation_ids.map(k=>[k,d.operations[k]]));
    if(Object.values(prior).some(o=>!o||o.state!=='COMPLETE')||hash(prior)!==c.prior_operations_hash)throw new ProviderPause('continuation_ledger_changed');
  }else if(now-j.started_at>=minutes*60000)throw new ProviderPause('game_wall_clock_limit',undefined,'PAUSED_BUDGET');
}
module.exports={authorize,assertWindow};
