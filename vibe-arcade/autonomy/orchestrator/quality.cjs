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
  const product=qa?.product_qa;
  if(!manifest.product_contract&&!p.product?.allow_legacy_technical_fixtures)failures.push({code:'product_contract_missing',message:'Technical PASS alone cannot approve a candidate; a reviewed product contract and Docker product evidence are required'});
  if(manifest.product_contract){
    try{const approved=require('../qa/product-contract.cjs').review(manifest.product_contract,{allowFixture:p.product?.allow_fixture_oracles===true}).approval;if(product&&hash(approved)!==hash(product.oracle_approval))failures.push({code:'product_review_changed',message:'Oracle/contract approval changed after QA'});}catch(e){failures.push({code:'product_review_invalid',message:e.message});}
    if(!product||product.source_hash!==manifest.source_hash||product.policy_hash!==hash(p)||product.contract_hash!==hash(manifest.product_contract)||product.game_id!==manifest.game_id||product.version!==manifest.version||product.runner_version!=='product-quality-1'||product.isolation?.engine!=='docker')
      failures.push({code:'product_stale_evidence',message:'Product evidence must match the exact contract, source, policy, runner and Docker isolation'});
    const required=require('../qa/product-worker.cjs').REQUIRED;
    for(const check of required)if(!product?.checks?.some(c=>c.check===check))failures.push({code:'product_missing_check',message:'Product requirement missing or failed: '+check,check});
    if((!product?.passed||product?.checks?.some(c=>c.status!=='PASS'))&&!product?.hard_failures?.length)failures.push({code:'product_failed',message:'Generic product checks did not pass'});
    for(const f of product?.hard_failures||[])if(!failures.some(x=>hash(x)===hash(f)))failures.push(f);
    const seeds=manifest.product_contract.difficulty.deterministic_seeds;
    if(seeds.some(seed=>!product?.seeds?.some(s=>s.seed===seed&&s.passed&&s.runs?.length===2)))failures.push({code:'product_seed_coverage',message:'Every declared deterministic seed requires two normal-input runs'});
    if(product?.oracle_approval?.scope!=='candidate'&&!p.product?.allow_fixture_oracles)failures.push({code:'product_review_scope',message:'A test fixture oracle cannot approve a public candidate'});
  }
  const fatal=failures.some(f=>p.fatal_codes.includes(f.code));
  const decision=failures.length?(fatal||manifest.repair_attempt>=manifest.max_repair_attempts?'REJECT':'REPAIR'):'PASS';
  const heuristics=p.heuristics.map(name=>({name,status:'UNVERIFIED',evidence:null}));
  const controls=heuristics.find(h=>h.name==='control_count'); Object.assign(controls,{status:manifest.controls.length>4?'REVIEW':'OBSERVED',evidence:{desktop:manifest.controls.length,mobile:manifest.mobile_controls.length}});
  const mechanic=heuristics.find(h=>h.name==='mechanic_overlap'); Object.assign(mechanic,{status:['arena-survival','tower-descent','radial-timing','column-merge','auto-runner'].includes(manifest.mechanic_family)?'REVIEW':'UNVERIFIED',evidence:{declared_family:manifest.mechanic_family}});
  return {schema_version:1,decision,hard_failures:failures,soft_failures:qa?.soft_failures||[],heuristics,source_hash:manifest.source_hash,policy_hash:hash(p),
    technical_qa:qa?.technical_qa?.passed===true||(!qa?.technical_qa&&qa?.passed===true)?'PASS':'FAIL',product_qa:product?.passed?'PASS':manifest.product_contract?'FAIL':'UNVERIFIED',
    production_approved:false,metrics_eligibility:false,meaning:manifest.product_contract?'Technical and generic product evidence; no production authorization or claim of fun.':'Legacy technical-only fixture path; product quality UNVERIFIED. New commissioning requires a reviewed product contract.'};
}
module.exports={evaluate};
