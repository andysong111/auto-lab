'use strict';
const {ProviderPause}=require('./errors.cjs');
// Trusted owner continuation metadata may exclude a CLOSED review wait. It
// never changes the original start, operation IDs, calls, tokens or money.
function activeElapsed(job,now){
 if(!job)return 0;
 let paused=0,last=job.started_at;
 for(const p of job.owner_review_pauses||[]){
  if(p.reason!=='owner_review_hold'||p.owner_authorized!==true||
    !Number.isSafeInteger(p.started_at)||!Number.isSafeInteger(p.ended_at)||
    p.started_at<last||p.ended_at<=p.started_at||p.ended_at>now||
    !/^[a-f0-9]{64}$/.test(p.checkpoint_manifest_sha256||''))
    throw new ProviderPause('invalid_owner_review_pause');
  paused+=p.ended_at-p.started_at;last=p.ended_at;
 }
 return now-job.started_at-paused;
}
module.exports={activeElapsed};
