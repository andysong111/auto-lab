'use strict';
const protectedPaths=['vibe-arcade/games/**','vibe-arcade/release/**','vibe-arcade/descent/**','vibe-arcade/core-pins/**','vibe-arcade/challengers/**','vibe-arcade/community/**','vibe-arcade/runtime/**','vibe-arcade/measurement/**','vibe-arcade/marketing/**','vibe-arcade/index.html','vibe-arcade/sitemap.xml','vibe-arcade/robots.txt','vibe-arcade/google*.html','loopjolt-backend/**','.github/**','**/.env*','**/secrets/**'];
function requestFor(m,qa) {
  if(m.repair_attempt>=m.max_repair_attempts) throw Error('repair_budget_exhausted');
  return {schema_version:1,game_id:m.game_id,version:m.version,target_version:'v'+(Number(m.version.slice(1))+1),attempt:m.repair_attempt+1,
    max_repair_attempts:m.max_repair_attempts,source_hash:m.source_hash||null,
    qa_failures:qa?.hard_failures?.length?qa.hard_failures:m.failure_reasons,
    ...(m.product_contract?{product_contract:m.product_contract,product_evidence_index:`${m.version}/artifact-index.json`,product_acceptance:'Fix every independent product failure. Preserve exact selectors, diagnostic paths and reviewed oracle. Use expected/actual and evidence references; never alter tests or lower the contract.'}:{}),
    ...(m.commercial_contract?{commercial_contract:m.commercial_contract,commercial_evidence_index:`${m.version}/commercial/artifact-index.json`,commercial_acceptance:'Fix all independent commercial issues using state pairs, local regions, expected/actual pixels, before/intermediate/settled captures, stage and viewport. Preserve contracts and reviewed oracle. Do not change tests or substitute numeric-only progression.'}:{}),
    allowed_scope:['core.js','app.js','view/**','style.css','index.html','README.md','assets/**'],
    protected_paths:[...protectedPaths,'manifest.json','gamekit.js'],
    acceptance_tests:['manifest schema','all three real browser viewports','no console/page errors','start/progress/input/interaction','terminal/restart/pause/resume/hidden','no side effects','source and resource bounds'],
    operation_id:`${m.game_id}/repair/${m.repair_attempt+1}`};
}
module.exports={requestFor,protectedPaths};
