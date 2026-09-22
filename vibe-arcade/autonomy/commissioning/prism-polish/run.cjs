'use strict';
// Trusted commissioning wrapper; existing Worker, Factory and AIRepairAdapter own every game change.
const fs=require('node:fs'),path=require('node:path');
const {AutonomousWorker}=require('../../worker/runtime.cjs');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {atomicJSON,readJSON,hash,hashTree}=require('../../orchestrator/files.cjs');
const {FileStore}=require('../../orchestrator/store.cjs'),{Factory}=require('../../orchestrator/engine.cjs');
const {authorize}=require('../../providers/continuation.cjs');
const {config}=require('../../providers/config.cjs');
const id='GAME-20260922-110',authorization_id='owner-prism-polish-20260922';
class PolishQA extends DockerQA {
 async run(c){
  const base=await super.run(c);
  // Baseline hard/fatal checks are never weakened or skipped.
  if(!base.passed)return base;
  const extendedPolicy={...c.policy,limits:{...c.policy.limits,run_timeout_ms:300000}};
  const extended=await super.run({...c,outDir:path.join(c.outDir,'polish'),policy:extendedPolicy,polish:true});
  const merged={...base,passed:base.passed&&extended.passed,hard_failures:[...base.hard_failures,...extended.hard_failures],
   console_errors:[...base.console_errors,...extended.console_errors],page_errors:[...base.page_errors,...extended.page_errors],
   side_effects:[...base.side_effects,...extended.side_effects],commissioning_contract:require('../../qa/prism-polish-contract.json'),
   polish:{passed:extended.passed,artifact:'polish/qa.json',policy_hash:extended.policy_hash,seeds:extended.browser_cases.map(c=>({seed:c.seed,passed:c.passed,boards:c.boards,terminal:c.terminal,receiver_progress:c.receiver_progress})),practice_record:extended.practice_record||null},
   duration_ms:base.duration_ms+extended.duration_ms};
  atomicJSON(path.join(c.outDir,'qa.json'),merged);return merged;
 }
}
function prepare(root){
 const store=new FileStore(root),before=store.get(id),ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=readJSON(ledgerFile);
 const doneFile=path.join(root,'polish-authorization.json');
 if(fs.existsSync(doneFile)){if(readJSON(doneFile).authorization_id!==authorization_id)throw Error('authorization_conflict');return;}
 if(before.version!=='v4'||before.repair_attempt!==3||before.max_repair_attempts!==5||before.source_hash!=='32c334dadddacc3d5bc337dc013c827bd5ac628aba2b2dac610549a80b4c8de8'||hashTree(path.join(root,before.source_path))!==before.source_hash)throw Error('starting_candidate_mismatch');
 // Restore the final authoritative READY manifest recorded by the preceding commissioning.
 const final=readJSON(path.join(__dirname,'../../evidence/first-real-game/manifest.json'));
 if(final.source_hash!==before.source_hash||final.rc_commit!=='73dd47cbc50db6825c2fcc9d6a19d60136cd5818'||final.state!=='READY_TO_SHIP')throw Error('unverified_starting_manifest');
 store.put(final);
 atomicJSON(path.join(root,'polish-starting-manifest.json'),final);atomicJSON(path.join(root,'polish-starting-ledger.json'),ledger);
 atomicJSON(path.join(root,'polish-starting-repair-history.json'),readJSON(store.artifact(id,'repair-history.json')));
 const authorization=authorize(ledger,final,{authorization_id,reason:'Owner explicitly commissioned bounded AI polish of the same verified v4 candidate; four goals in committed contract. No new game/production. Preserve lifetime six calls, five repairs and USD 2 ceiling.',minutes:45});
 atomicJSON(ledgerFile,ledger);
 const previous=store.artifact(id,'v4/qa.json');if(fs.existsSync(previous))fs.renameSync(previous,store.artifact(id,'v4/qa-before-polish.json'));
 const factory=new Factory({store});factory.move(final,'QA_RUNNING',{qa_status:'RUNNING',quality_status:'PENDING',release_status:'NONE',preview_url:null},{reason:'Owner-authorized stricter polish acceptance, source bytes and repair budget unchanged',authorization_id});
 const control=readJSON(path.join(__dirname,'../../control-plane/policy.json'));control.intake_enabled=true;control.auto_rc_enabled=false;
 atomicJSON(path.join(root,'control-policy.json'),control);
 const settings=readJSON(path.join(__dirname,'../first-real-game/worker-config.json'));settings.isolation={cpus:1,memory_mb:1024,pids:128,timeout_ms:300000};
 atomicJSON(path.join(root,'worker-config.json'),settings);
 atomicJSON(doneFile,authorization);
}
async function main(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
 if(!process.env.FACTORY_WORKER_ROOT||root.startsWith(path.resolve(__dirname,'../../../..')))throw Error('dedicated_state_required');
 prepare(root);
 const settings=readJSON(path.join(root,'worker-config.json')),limits=config(settings);
 const worker=new AutonomousWorker({root,policyFile:path.join(root,'control-policy.json'),settings,qa:new PolishQA({limits:limits.isolation})});
 const result=await worker.runOnce();atomicJSON(path.join(root,'polish-worker-result.json'),result);console.log(JSON.stringify(result));
 if(!['RC_READY','READY_TO_SHIP','REJECTED'].includes(result.status))process.exitCode=2;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={PolishQA,prepare};
