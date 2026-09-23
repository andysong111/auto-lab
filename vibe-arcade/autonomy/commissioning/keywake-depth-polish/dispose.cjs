'use strict';
// Apply a recorded human-visible QA failure through the unchanged Factory gate.
// No candidate execution or source changes; no provider is configured.
const fs=require('node:fs'),path=require('node:path');
const {FileStore}=require('../../orchestrator/store.cjs'),{Factory}=require('../../orchestrator/engine.cjs');
const {transition}=require('../../orchestrator/manifest.cjs'),{hashTree,readJSON,atomicJSON}=require('../../orchestrator/files.cjs');
const {buildPacket}=require('../release-packet.cjs');
const root=path.resolve(process.argv[2]),id='GAME-20260923-141',store=new FileStore(root);
async function main(){
 const m=store.get(id),review=readJSON(path.join(root,'owner-depth/v6-visual-review.json')),ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.readFileSync(ledgerFile);
 if(m.version!=='v6'||m.repair_attempt!==5||m.max_repair_attempts!==5||review.source_hash!==m.source_hash||hashTree(path.join(root,m.source_path))!==m.source_hash||Object.keys(JSON.parse(ledger).operations).length!==6||!['RC_READY','PREVIEW_DEPLOYING','QA_RUNNING'].includes(m.state))throw Error('exact_exhausted_candidate_required');
 const qaFile=store.artifact(id,'v6/qa.json'),qa=readJSON(qaFile);
 if(m.state==='QA_RUNNING'){
  if(qa.passed||qa.visual_review!=='owner-depth/v6-visual-review.json'||qa.hard_failures.length!==1||qa.hard_failures[0].code!==review.failure.code||!readJSON(store.artifact(id,'v6/qa-before-visual-review.json')).passed)throw Error('unsafe_intake_resume');
 }else{
 if(!qa.passed)throw Error('expected_original_automated_pass');
 fs.copyFileSync(qaFile,store.artifact(id,'v6/qa-before-visual-review.json'));fs.copyFileSync(store.artifact(id,'v6/quality.json'),store.artifact(id,'v6/quality-before-visual-review.json'));
 atomicJSON(path.join(root,'owner-depth/v6-manifest-before-visual-review.json'),m);
 atomicJSON(qaFile,{...qa,passed:false,hard_failures:[...qa.hard_failures,review.failure],visual_review:'owner-depth/v6-visual-review.json'});
 store.put(transition({...m,qa_status:'FAIL',quality_status:'PENDING',release_status:'NONE',failure_reasons:[review.failure]},'QA_RUNNING',{reason:'Visible route topology failure after real Preview review; repair budget exhausted.'}));
 }
 const final=await new Factory({store}).run(id);
 if(final.state!=='REJECTED'||final.quality_status!=='REJECT'||final.failure_reasons.length!==1||final.failure_reasons[0].code!=='product_route_topology_not_visible')throw Error('terminal_rejection_required');
 if(!ledger.equals(fs.readFileSync(ledgerFile))||hashTree(path.join(root,final.source_path))!==m.source_hash)throw Error('ledger_or_source_changed');
 atomicJSON(path.join(root,'terminal-disposition.json'),{state:final.state,version:final.version,technical_qa:final.technical_qa_status,product_qa:final.product_qa_status,quality_gate:final.quality_status,repair_attempt:final.repair_attempt,remaining_repairs:0,total_calls:6,remaining_calls:0,reason:review.failure.code,diagnostic_preview:review.preview_url,rc_commit:review.rc_commit,source_hash:final.source_hash,source_and_ledger_unchanged:true,provider_calls_in_disposition:0,production_authorized:false});
 atomicJSON(path.join(root,'release-review-packet.json'),buildPacket(final,{base_ref:'feeed4ffde39872714f473803a0158ba3700fb08'}));
 console.log(JSON.stringify({state:final.state,quality:final.quality_status,reason:review.failure.code,repair_attempt:final.repair_attempt}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
