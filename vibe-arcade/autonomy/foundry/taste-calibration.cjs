'use strict';
const fs=require('node:fs');

const STATES=new Set(['AWAITING_OWNER_SELECTION','SELECTED_FOR_POLISH','SELECTED','PAUSED_REGRESSION']);

function validatePolicy(policy){
  if(!policy||policy.schema!=='playjolt-owner-taste-calibration/1')throw Error('invalid_taste_calibration_schema');
  if(!STATES.has(policy.state))throw Error('invalid_taste_calibration_state');
  if(!Number.isInteger(policy.required_from_sequence)||policy.required_from_sequence<1)throw Error('invalid_taste_calibration_sequence');
  if(!Number.isInteger(policy.post_selection_policy?.max_candidates_per_utc_day)||policy.post_selection_policy.max_candidates_per_utc_day<1)throw Error('invalid_taste_calibration_daily_cap');
  if(!Number.isInteger(policy.post_selection_policy?.pause_after_consecutive_measured_regressions)||policy.post_selection_policy.pause_after_consecutive_measured_regressions<1)throw Error('invalid_taste_calibration_regression_limit');
  if(policy.post_selection_policy.production_authorized!==false)throw Error('taste_calibration_production_must_remain_false');
  if(['SELECTED_FOR_POLISH','SELECTED'].includes(policy.state)&&!policy.selected_prototype_id)throw Error('taste_calibration_selection_missing');
  return policy;
}

function consecutiveRegressions(profile,fromSequence){
  const rows=(profile?.recent_outcomes||[])
    .filter(row=>Number.isInteger(row.sequence)&&row.sequence>=fromSequence&&Number.isFinite(row.quality_failure_count))
    .sort((a,b)=>a.sequence-b.sequence);
  if(rows.length<2)return 0;
  let count=0;
  for(let i=1;i<rows.length;i++)count=rows[i].quality_failure_count>rows[i-1].quality_failure_count?count+1:0;
  return count;
}

function gate({sequence,policy,learningProfile}){
  validatePolicy(policy);
  if(sequence<policy.required_from_sequence)return {allowed:true,reason:'pre_calibration_history'};
  if(policy.state==='AWAITING_OWNER_SELECTION')return {allowed:false,reason:'owner_taste_calibration_required'};
  if(policy.state==='SELECTED_FOR_POLISH')return {allowed:false,reason:'owner_taste_polish_pending'};
  if(policy.state==='PAUSED_REGRESSION')return {allowed:false,reason:'owner_taste_regression_guard'};
  const regressions=consecutiveRegressions(learningProfile,policy.required_from_sequence);
  if(regressions>=policy.post_selection_policy.pause_after_consecutive_measured_regressions){
    return {allowed:false,reason:'owner_taste_regression_guard',consecutive_regressions:regressions};
  }
  return {allowed:true,reason:'owner_taste_selected',consecutive_regressions:regressions};
}

function effectiveDailyCap(baseCap,policy){
  const cap=Number(baseCap);if(!Number.isInteger(cap)||cap<0)throw Error('invalid_base_daily_cap');
  validatePolicy(policy);
  if(policy.state!=='SELECTED')return 0;
  return Math.min(cap,policy.post_selection_policy.max_candidates_per_utc_day);
}

function main(){
  const [cmd,policyFile,value,profileFile]=process.argv.slice(2);
  if(!cmd||!policyFile)throw Error('usage: taste-calibration.cjs cap|gate POLICY [BASE_CAP|SEQUENCE] [PROFILE]');
  const policy=JSON.parse(fs.readFileSync(policyFile,'utf8'));
  if(cmd==='cap')return process.stdout.write(String(effectiveDailyCap(value,policy))+'\n');
  if(cmd==='gate'){
    const learningProfile=profileFile?JSON.parse(fs.readFileSync(profileFile,'utf8')):{};
    return process.stdout.write(JSON.stringify(gate({sequence:Number(value),policy,learningProfile}))+'\n');
  }
  throw Error('invalid_taste_calibration_command');
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exit(2);}}
module.exports={validatePolicy,consecutiveRegressions,gate,effectiveDailyCap};
