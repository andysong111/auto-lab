'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {DockerQA}=require('../../isolation/docker-qa.cjs'),{readJSON,atomicJSON,hash,hashTree}=require('../../orchestrator/files.cjs');
async function run(){const root=process.env.FACTORY_WORKER_ROOT,id='GAME-20260922-131',mf=path.join(root,`autonomy/jobs/${id}/manifest.json`),m=readJSON(mf),source=path.join(root,m.source_path),files=[mf,path.join(root,'autonomy/.provider/ledger.json'),path.join(root,`autonomy/artifacts/${id}/v6/qa.json`)];
 assert.equal(m.state,'REJECTED');assert.equal(m.repair_attempt,5);assert.equal(m.version,'v6');assert.equal(m.source_hash,'ea85f704319bc9e6896d2304c9192d5b1b12a418654a47f8f765991e94c03736');
 const before=files.map(f=>hash(fs.readFileSync(f,'utf8'))),sourceBefore=hashTree(source),policy=readJSON(path.join(__dirname,'../../policies/quality-gate.json'));
 const report=await new DockerQA({limits:{cpus:1,memory_mb:1024,pids:128,timeout_ms:90000}}).run({manifest:m,gameRoot:source,outDir:path.join(root,'motion-audit'),policy:{...policy,limits:{...policy.limits,run_timeout_ms:90000}},product:'ribbon-motion-audit'});
 assert.deepEqual(files.map(f=>hash(fs.readFileSync(f,'utf8'))),before);assert.equal(hashTree(source),sourceBefore);
 const transitions=report.browser_cases.flatMap(c=>c.transitions||[]);const summary={passed:report.passed,source_hash:sourceBefore,state:'REJECTED',repair_attempt:5,model_calls:0,original_qa_ledger_manifest_unchanged:true,original_hashes:before,transitions:transitions.length,virtual_only_mismatches:transitions.filter(t=>!t.immediate_consistent).length,native_settled_failures:transitions.filter(t=>!t.settled_consistent).length,max_delivery_wall_ms:Math.max(...transitions.map(t=>t.wall_ms))};atomicJSON(path.join(root,'motion-audit/summary.json'),summary);console.log(JSON.stringify(summary));
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
