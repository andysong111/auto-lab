'use strict';
const protectedPaths=['vibe-arcade/games/**','vibe-arcade/release/**','vibe-arcade/descent/**','vibe-arcade/core-pins/**','vibe-arcade/challengers/**','vibe-arcade/community/**','vibe-arcade/runtime/**','vibe-arcade/measurement/**','vibe-arcade/marketing/**','vibe-arcade/index.html','vibe-arcade/sitemap.xml','vibe-arcade/robots.txt','vibe-arcade/google*.html','loopjolt-backend/**','.github/**','**/.env*','**/secrets/**'];
const technicalCodes=new Set([
  'build_failed','missing_assets','html','assets','start','real_clock','keyboard','touch','freeze','progress','interaction','terminal',
  'resources','pause','resume','hidden','restart','pagehide','overflow','severe_overflow','layout','timeout','console_error','page_error'
]);
const repairStageOrder=Object.freeze(['technical','product','commercial','quality']);
function classifyFailureStage(failure){
  const code=String(failure?.code||'');
  if(code.startsWith('product_'))return 'product';
  if(code.startsWith('commercial_'))return 'commercial';
  if(technicalCodes.has(code))return 'technical';
  return 'quality';
}
function failureCounts(rows){
  const counts={technical:0,product:0,commercial:0,quality:0};
  for(const row of rows||[])counts[classifyFailureStage(row)]++;
  return counts;
}
function selectRepairStage(rows){
  const counts=failureCounts(rows);
  return repairStageOrder.find(stage=>counts[stage]>0)||'technical';
}
function requestFor(m,qa) {
  if(m.repair_attempt>=m.max_repair_attempts) throw Error('repair_budget_exhausted');
  const allFailures=qa?.hard_failures?.length?qa.hard_failures:m.failure_reasons;
  const repair_stage=selectRepairStage(allFailures);
  const qa_failures=allFailures.filter(f=>classifyFailureStage(f)===repair_stage);
  const deferred_failure_counts=failureCounts(allFailures);
  deferred_failure_counts[repair_stage]=0;
  return {schema_version:1,game_id:m.game_id,version:m.version,target_version:'v'+(Number(m.version.slice(1))+1),attempt:m.repair_attempt+1,
    max_repair_attempts:m.max_repair_attempts,source_hash:m.source_hash||null,repair_stage,repair_strategy:'targeted',deferred_failure_counts,
    qa_failures,
    ...(m.product_contract?{product_contract:m.product_contract,product_evidence_index:`${m.version}/artifact-index.json`,product_acceptance:'Fix every independent product failure. Preserve exact selectors, diagnostic paths and reviewed oracle. Use expected/actual and evidence references; never alter tests or lower the contract.'}:{}),
    ...(m.commercial_contract?{commercial_contract:m.commercial_contract,commercial_evidence_index:`${m.version}/commercial/artifact-index.json`,commercial_acceptance:'Fix all independent commercial issues using state pairs, local regions, expected/actual pixels, before/intermediate/settled captures, stage and viewport. Preserve contracts and reviewed oracle. Do not change tests or substitute numeric-only progression.'}:{}),
    allowed_scope:['core.js','app.js','view/**','style.css','index.html','README.md','assets/**'],
    protected_paths:[...protectedPaths,'manifest.json','gamekit.js'],
    acceptance_tests:['manifest schema','all three real browser viewports','no console/page errors','start/progress/input/interaction','terminal/restart/pause/resume/hidden','no side effects','source and resource bounds'],
    operation_id:`${m.game_id}/repair/${m.repair_attempt+1}`};
}
function failureKey(f){
  const v=f?.viewport;return JSON.stringify([f?.code||'',f?.check||'',f?.selector||'',f?.state_path||'',f?.probe||'',f?.phase||'',v?.width??v??null,v?.height??null]);
}
function noMeaningfulImprovement(previous,current){
  if(!previous||!current||previous.repair_stage!==current.repair_stage)return false;
  const before=new Set((previous.qa_failures||[]).map(failureKey)),after=new Set((current.qa_failures||[]).map(failureKey));
  if(!before.size)return false;
  let persisted=0;for(const key of before)if(after.has(key))persisted++;
  return persisted>=Math.ceil(before.size*.8)&&after.size>=before.size;
}
function planRepair(m,qa,previousRequests=[]){
  const request=requestFor(m,qa),last=previousRequests.at(-1),prior=previousRequests.at(-2);
  if(noMeaningfulImprovement(last,request)&&noMeaningfulImprovement(prior,last))request.repair_strategy='structural_rewrite';
  return request;
}
module.exports={requestFor,planRepair,protectedPaths,classifyFailureStage,selectRepairStage,failureCounts,repairStageOrder,noMeaningfulImprovement,failureKey};
