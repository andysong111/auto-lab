'use strict';
const ACTIVE=new Set(['BUILDING','QA_RUNNING','REPAIR_PENDING','REPAIRING','QUALITY_GATE','RC_READY','PREVIEW_DEPLOYING','PREVIEW_SMOKE']);
function ageMinutes(manifest,now=Date.now()){
  const last=manifest.history?.at(-1)?.at||manifest.created_at;
  const ms=Date.parse(last);return Number.isFinite(ms)?Math.max(0,(now-ms)/60000):null;
}
function classify(manifest,policy,now=Date.now()){
  const rows=[],codes=new Set((manifest.failure_reasons||[]).map(x=>x.code));
  for(const code of policy.owner_alerts.critical_codes||[])if(codes.has(code))rows.push({severity:'critical',code,game_id:manifest.game_id,state:manifest.state,owner_action:true});
  const age=ageMinutes(manifest,now);
  if(manifest.state==='PREVIEW_DEPLOYING'&&age!==null&&age>policy.owner_alerts.stale_preview_minutes)rows.push({severity:'warning',code:'preview_stalled',game_id:manifest.game_id,state:manifest.state,age_minutes:Math.round(age),owner_action:false});
  if(['REPAIR_PENDING','REPAIRING'].includes(manifest.state)&&age!==null&&age>policy.owner_alerts.stale_repair_minutes)rows.push({severity:'warning',code:'repair_stalled',game_id:manifest.game_id,state:manifest.state,age_minutes:Math.round(age),owner_action:false});
  if(manifest.state==='REJECTED'&&!rows.length)rows.push({severity:'info',code:'candidate_rejected',game_id:manifest.game_id,state:manifest.state,owner_action:false});
  return rows;
}
module.exports={ACTIVE,ageMinutes,classify};
