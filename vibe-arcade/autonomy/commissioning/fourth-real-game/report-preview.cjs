'use strict';
// Trusted external-observation intake using existing Factory transitions.
const fs=require('node:fs'),path=require('node:path');
const {FileStore}=require('../../orchestrator/store.cjs'),{transition}=require('../../orchestrator/manifest.cjs');
const {hashTree,readJSON,atomicJSON}=require('../../orchestrator/files.cjs');
const {assess}=require('../../qa/preview-route.cjs');
const root=path.resolve(process.argv[2]),observation=readJSON(path.resolve(process.argv[3])),store=new FileStore(root),id=require('./proposal.json').game_id;
async function run(){return store.withLock(id,async()=>{
 const m=store.get(id);if(!['RC_READY','PREVIEW_DEPLOYING','PREVIEW_SMOKE'].includes(m.state)||m.source_hash!==hashTree(path.join(root,m.source_path)))throw Error('preview_checkpoint_required');
 const report=assess(m,observation);if(report.passed)throw Error('no_preview_failure');
 const file=store.artifact(id,m.version+'/qa.json'),qa=readJSON(file);
 if(qa.source_hash!==m.source_hash||!qa.passed)throw Error('original_passing_qa_required');
 fs.copyFileSync(file,store.artifact(id,m.version+'/qa-before-preview.json'));
 atomicJSON(store.artifact(id,m.version+'/preview-route.json'),{source_hash:m.source_hash,observation,...report});
 const failure={code:'preview_asset_resolution',check:report.check,selector:'script[src], link[rel="stylesheet"]',state_path:'document.baseURI',message:'Vercel cleanUrls=true and trailingSlash=false canonicalizes the version directory without a trailing slash. Relative scripts/styles resolve outside the version and GameKit never boots. Fix version-independent HTML base resolution before loading styles/scripts, and keep root Docker QA working. Manifest fetch must share the correct base. Do not change the deployment config, GameKit, tests or core gameplay.',expected:report.failures.map(f=>f.expected),actual:report.failures.map(f=>f.actual),evidence:['preview-route.json']};
 atomicJSON(file,{...qa,passed:false,hard_failures:[...qa.hard_failures,failure],preview_qa:report});
 store.put(transition({...m,qa_status:'PENDING',quality_status:'PENDING',release_status:'NONE',failure_reasons:[failure]},'QA_RUNNING',{reason:'Observed exact Preview asset resolution failure; original Technical/Product reports preserved; repair counter unchanged.'}));
 console.log(JSON.stringify({state:'QA_RUNNING',repair_attempt:m.repair_attempt,version:m.version,source_unchanged:true,failure:report.check}));
});}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});
