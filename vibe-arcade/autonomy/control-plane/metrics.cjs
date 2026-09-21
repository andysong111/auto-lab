'use strict';
const FIELDS=['observed_sessions','starting_sessions','replaying_sessions','game_finish_sessions','error_rate'];
function normalize(raw={}){
  const out={};for(const k of FIELDS)out[k]=typeof raw[k]==='number'&&Number.isFinite(raw[k])&&raw[k]>=0?raw[k]:null;
  out.observed_at=typeof raw.observed_at==='string'?raw.observed_at:null;
  out.age_hours=typeof raw.age_hours==='number'&&Number.isFinite(raw.age_hours)&&raw.age_hours>=0?raw.age_hours:null;
  return out;
}
function readiness(raw,policy){
  const m=normalize(raw),p=policy.phase2_metrics;
  if(!p?.enabled)return {state:'DISABLED',reason:'Phase 2 metrics are not commissioned.',metrics:m};
  const missing=(p.required||FIELDS).filter(k=>m[k]===null);
  if(missing.length)return {state:'DATA_GAP',reason:'Missing required metrics.',missing,metrics:m};
  if(m.age_hours===null||m.age_hours<p.minimum_age_hours)return {state:'WAIT',reason:'Observation window is too young.',metrics:m};
  if(m.observed_sessions<p.minimum_observed_sessions||m.starting_sessions<p.minimum_started_sessions)return {state:'INSUFFICIENT_DATA',reason:'Observed sample is below the commissioning floor.',metrics:m};
  return {state:'ELIGIBLE_FOR_PHASE2_EVALUATION',reason:'Enough observed data for a separate Phase 2 evaluator. No winner is implied.',metrics:m};
}
module.exports={FIELDS,normalize,readiness};
