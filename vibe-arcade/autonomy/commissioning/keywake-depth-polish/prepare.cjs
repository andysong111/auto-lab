'use strict';
// Trusted, explicit owner-contract supersession, not a new Factory job.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {FileStore}=require('../../orchestrator/store.cjs');
const {transition}=require('../../orchestrator/manifest.cjs');
const {hash,hashTree,readJSON,atomicJSON}=require('../../orchestrator/files.cjs');
const {evaluate}=require('../../orchestrator/quality.cjs');
const {review}=require('../../qa/product-contract.cjs');
const {requestFor}=require('../../orchestrator/repair.cjs');
const {compile,instructions}=require('../../providers/prompts.cjs');
const {responseSchema}=require('../../providers/output.cjs');
const {validateProposal}=require('../spec-gate.cjs');
const approval=require('./run-request.json'),proposal=require('./proposal.json'),id=approval.game_id;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepare(root,archive,now=Date.now()){
 if(fs.existsSync(root))throw Error('resume_requires_empty_dedicated_root');
 if(digest(fs.readFileSync(archive))!==approval.checkpoint_zip_sha256)throw Error('checkpoint_zip_mismatch');
 execFileSync('python',['-c','import zipfile,pathlib,sys; r=pathlib.Path(sys.argv[2]); z=zipfile.ZipFile(sys.argv[1]); assert all((r/n).resolve().is_relative_to(r.resolve()) for n in z.namelist()); z.extractall(r)',archive,root]);
 const ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),store=new FileStore(root),original=store.get(id),mf=store.file(id);
 const ledger=readJSON(ledgerFile),oldOps=hash(ledger.operations),originalSpec=readJSON(path.join(path.dirname(mf),'spec.json'));
 if(digest(fs.readFileSync(ledgerFile))!==approval.checkpoint_ledger_sha256||digest(fs.readFileSync(mf))!==approval.checkpoint_manifest_sha256)throw Error('checkpoint_ledger_or_manifest_changed');
 if(original.state!=='READY_TO_SHIP'||original.version!=='v3'||original.repair_attempt!==2||original.max_repair_attempts!==5||original.source_hash!==approval.checkpoint_source_hash||hashTree(path.join(root,original.source_path))!==original.source_hash)throw Error('checkpoint_identity');
 const ops=Object.values(ledger.operations);if(ops.length!==3||ops.some(o=>o.game_id!==id||o.state!=='COMPLETE'||!o.response_id)||!approval.user_authorized||approval.production_authorized)throw Error('operation_or_authorization_mismatch');
 const gate=validateProposal(proposal);if(!gate.passed)throw Error(JSON.stringify(gate.errors));review(proposal.product_contract);
 const evidenceDir=path.join(root,'owner-depth');fs.mkdirSync(evidenceDir,{recursive:true});
 for(const [name,value] of Object.entries({'v3-manifest.json':original,'v3-spec.json':originalSpec,'v3-ledger.json':ledger,'authorization.json':approval}))atomicJSON(path.join(evidenceDir,name),value);
 const qaFile=store.artifact(id,'v3/qa.json'),qa=readJSON(qaFile);if(!qa.passed)throw Error('v3_original_qa_not_passed');
 fs.copyFileSync(qaFile,store.artifact(id,'v3/qa-before-owner-hold.json'));fs.copyFileSync(store.artifact(id,'v3/quality.json'),store.artifact(id,'v3/quality-before-owner-hold.json'));
 const failure={code:'owner_difficulty_too_low',check:'owner_decision_depth',selector:'[data-game-canvas]',state_path:'state.stage / state.cell / state.key_mask',message:'Owner played v3: too simple and too easy. Implement the revised immutable_spec exactly: six distinct 4x4 key/gate route layouts; later stages require more consequential decisions and meaningful moves; key order changes shortest path cost. Preserve proven lifecycle/Preview base fixes. This authorized contract supersedes v3 gameplay requirements; do not tune timer/HP/speed or merely enlarge a corridor.',expected:{minimum_shortest:[6,10,14],minimum_route_decisions:[3,4,5],six_distinct_layouts:true,key_order_regret_at_least:4},actual:{owner_feedback:approval.owner_feedback,shortest:[2,4,6],entry_width:[2,3,4],seed_topology:'transforms of the same three rooms'},evidence:['owner-depth/authorization.json','owner-depth/v3-manifest.json','owner-depth/contract-supersession.json']};
 atomicJSON(qaFile,{...qa,passed:false,hard_failures:[...qa.hard_failures,failure],owner_review:{decision:'HOLD',feedback:approval.owner_feedback}});
 let m=store.put(transition({...original,qa_status:'FAIL',quality_status:'PENDING',release_status:'NONE',failure_reasons:[failure]},'QA_RUNNING',{reason:'Owner real-play quality failure; v3 READY superseded, original automated evidence preserved.'}));
 m=store.put(transition(m,'QUALITY_GATE',{reason:'Owner observation intake; no candidate code changes.'}));
 const result=evaluate(m,readJSON(qaFile));if(result.decision!=='REPAIR'||result.hard_failures.some(f=>f.code!=='owner_difficulty_too_low'))throw Error('unexpected_owner_quality_failure:'+JSON.stringify(result));
 atomicJSON(store.artifact(id,'v3/quality.json'),result);
 m=store.put(transition({...m,quality_status:'REPAIR',failure_reasons:result.hard_failures},'QUALITY_FAILED',{reason:'owner_difficulty_too_low; lifetime repair remains2/5.'}));
 const supersession={game_id:id,authorized:true,from_version:'v3',first_target_version:'v4',failure_code:failure.code,old_spec_sha256:hash(originalSpec),new_spec_sha256:hash(gate.factory_spec),old_contract_sha256:hash(original.product_contract),new_contract_sha256:hash(proposal.product_contract),candidate_source_unchanged:true,lifetime_repair_before:2,lifetime_calls_before:3,operation_ids:ops.map(o=>o.operation_id)};
 atomicJSON(path.join(evidenceDir,'contract-supersession.json'),supersession);
 atomicJSON(path.join(path.dirname(mf),'spec.json'),gate.factory_spec);atomicJSON(path.join(root,'factory-spec.json'),gate.factory_spec);
 m=store.put({...m,product_contract:proposal.product_contract,revision:m.revision+1,history:[...m.history,{from:m.state,to:m.state,at:new Date(now).toISOString(),reason:'Explicit owner-authorized contract supersession for repairs3..5; immutable v3 source/spec retained in owner-depth.'}]});
 const ready=original.history.findLast(h=>h.to==='READY_TO_SHIP'),pauseStart=Date.parse(ready.at);
 if(now<=pauseStart||ledger.jobs[id].owner_review_pauses?.length)throw Error('owner_continuation_already_applied');
 // Exclude only time AFTER the completed READY checkpoint while it awaited
 // owner review. All prior active/wall time and the original start stay intact.
 ledger.jobs[id].owner_review_pauses=[{reason:'owner_review_hold',owner_authorized:true,started_at:pauseStart,ended_at:now,checkpoint_manifest_sha256:approval.checkpoint_manifest_sha256}];
 if(hash(ledger.operations)!==oldOps)throw Error('prior_operations_changed');atomicJSON(ledgerFile,ledger);
 atomicJSON(path.join(evidenceDir,'wall-clock-continuation.json'),{original_started_at:ledger.jobs[id].started_at,prior_active_ms:pauseStart-ledger.jobs[id].started_at,excluded_review_wait_ms:now-pauseStart,lifetime_active_limit_ms:3600000,remaining_active_ms:3600000-(pauseStart-ledger.jobs[id].started_at),prior_operations_sha256:oldOps,repair_budget_reset:false});
 const settings=structuredClone(require('../fourth-real-game/worker-config.json'));settings.base_ref=approval.base_main;
 if(settings.per_game.max_provider_calls!==6||settings.per_game.max_estimated_cost!==2||settings.release_candidates)throw Error('budget_contract_changed');atomicJSON(path.join(root,'worker-config.json'),settings);
 const policy=readJSON(path.join(root,'control-policy.json'));Object.assign(policy,{mode:'same-id-owner-depth-polish',intake_enabled:true,auto_rc_enabled:false});Object.assign(policy.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});atomicJSON(path.join(root,'control-policy.json'),policy);
 atomicJSON(path.join(root,'spec-gate.json'),gate);atomicJSON(path.join(root,'product-preflight.json'),{passed:true,oracle:review(proposal.product_contract).approval});atomicJSON(path.join(root,'authorization-depth.json'),approval);
 const req=requestFor(m,{hard_failures:m.failure_reasons}),compiled=compile({root,workspace:path.join(root,original.source_path),manifest:{...m,version:'v4'},spec:gate.factory_spec,request:req,operationId:req.operation_id,budget:{per_game:settings.per_game,request:settings.request}});
 const reserveInput=Buffer.byteLength(JSON.stringify({instructions,request:compiled,responseSchema}))+2048;
 if(reserveInput>settings.request.max_input_tokens)throw Error('repair_preflight_request_too_large:'+reserveInput);
 atomicJSON(path.join(evidenceDir,'repair-3-preflight.json'),{operation_id:compiled.operation_id,estimated_input_reservation:reserveInput,limit:settings.request.max_input_tokens,prior_operations_sha256:oldOps,old_source_hash:hashTree(path.join(root,original.source_path)),spec_sha256:hash(gate.factory_spec),owner_failure_forwarded:compiled.previous_failures.some(f=>f.code===failure.code)});
 return {state:m.state,repair_attempt:m.repair_attempt,calls:ops.length,reserveInput,source_unchanged:true,old_operation_ids_unchanged:true};
}
async function main(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||''),tmp=path.resolve(process.env.RUNNER_TEMP||'');if(!root.startsWith(tmp+path.sep)||!process.env.GITHUB_RUN_ID||process.env.GITHUB_RUN_ATTEMPT!=='1')throw Error('one_shot_isolated_runner_required');
 const api=route=>JSON.parse(execFileSync('gh',['api','--method','GET','repos/andysong111/auto-lab/'+route],{encoding:'utf8',maxBuffer:4*1024*1024}));
 const runs=api('actions/workflows/playjolt-keywake-depth.yml/runs?branch=commissioning%2Fkeywake-depth-polish-20260923&per_page=100').workflow_runs;
 if(runs.some(r=>String(r.id)!==process.env.GITHUB_RUN_ID))throw Error('prior_depth_execution_exists_do_not_resubmit');
 const zip=execFileSync('gh',['api','--method','GET','repos/andysong111/auto-lab/actions/artifacts/'+approval.checkpoint_artifact_id+'/zip'],{maxBuffer:64*1024*1024}),archive=path.join(tmp,'keywake-v3-verified.zip');fs.writeFileSync(archive,zip);
 console.log(JSON.stringify(prepare(root,archive)));
}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={prepare};
