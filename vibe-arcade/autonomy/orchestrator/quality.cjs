'use strict';
const policy=require('../policies/quality-gate.json');
const {hash}=require('./files.cjs');
function evaluate(manifest,qa,p=policy) {
  const failures=[...(qa?.hard_failures||[])];
  if(!qa||qa.source_hash!==manifest.source_hash||qa.game_id!==manifest.game_id||qa.version!==manifest.version||qa.policy_hash!==hash(p)) failures.push({code:'stale_evidence',message:'QA is missing or does not match source, identity and policy'});
  for(const [width,height] of p.required_viewports) {
    const c=qa?.browser_cases?.find(c=>c.viewport.width===width&&c.viewport.height===height);
    for(const name of p.required_checks) if(!c?.passed||!c.checks.includes(name)) failures.push({code:'missing_check',message:`${width}x${height}: ${name}`});
  }
  if(qa?.console_errors?.length||qa?.page_errors?.length||qa?.side_effects?.length) failures.push({code:qa.side_effects?.length?'production_side_effect':'browser_errors',message:'Browser errors or side effects present'});
  if(qa?.passed!==true&&!failures.length) failures.push({code:'qa_failed',message:'QA did not pass'});
  const fatal=failures.some(f=>p.fatal_codes.includes(f.code));
  const decision=failures.length?(fatal||manifest.repair_attempt>=manifest.max_repair_attempts?'REJECT':'REPAIR'):'PASS';
  const heuristics=p.heuristics.map(name=>({name,status:'UNVERIFIED',evidence:null}));
  const controls=heuristics.find(h=>h.name==='control_count'); Object.assign(controls,{status:manifest.controls.length>4?'REVIEW':'OBSERVED',evidence:{desktop:manifest.controls.length,mobile:manifest.mobile_controls.length}});
  const mechanic=heuristics.find(h=>h.name==='mechanic_overlap'); Object.assign(mechanic,{status:['arena-survival','tower-descent','radial-timing','column-merge','auto-runner'].includes(manifest.mechanic_family)?'REVIEW':'UNVERIFIED',evidence:{declared_family:manifest.mechanic_family}});
  return {schema_version:1,decision,hard_failures:failures,soft_failures:qa?.soft_failures||[],heuristics,source_hash:manifest.source_hash,policy_hash:hash(p),
    production_approved:false,metrics_eligibility:false,meaning:'Mechanical release candidate only; baseline-level visual/design quality still requires evidence'};
}
module.exports={evaluate};
