'use strict';
const {ProviderPause}=require('./errors.cjs');
// Trusted continuation metadata may exclude bounded periods when the Factory is deliberately
// stopped for owner review or for a reviewed infrastructure repair. This never changes the
// original start, operation IDs, calls, tokens, repair attempts or money.
function activeElapsed(job,now){
 if(!job)return 0;
 const rows=[
  ...(job.owner_review_pauses||[]).map(p=>({...p,kind:'owner'})),
  ...(job.infrastructure_pauses||[]).map(p=>({...p,kind:'infrastructure'}))
 ].sort((a,b)=>a.started_at-b.started_at);
 let paused=0,last=job.started_at;
 for(const p of rows){
  const common=Number.isSafeInteger(p.started_at)&&Number.isSafeInteger(p.ended_at)&&
    p.started_at>=last&&p.ended_at>p.started_at&&p.ended_at<=now&&
    /^[a-f0-9]{64}$/.test(p.checkpoint_manifest_sha256||'');
  if(p.kind==='owner'){
    if(!common||p.reason!=='owner_review_hold'||p.owner_authorized!==true)throw new ProviderPause('invalid_owner_review_pause');
  }else{
    if(!common||p.reason!=='infrastructure_repair_hold'||p.system_reviewed!==true||p.owner_authorized!==true||
      !/^[a-f0-9]{64}$/.test(p.resume_commit||''))throw new ProviderPause('invalid_infrastructure_pause');
  }
  paused+=p.ended_at-p.started_at;last=p.ended_at;
 }
 return now-job.started_at-paused;
}
module.exports={activeElapsed};
