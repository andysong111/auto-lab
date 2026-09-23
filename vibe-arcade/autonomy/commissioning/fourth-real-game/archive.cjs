'use strict';
// Trusted evidence transport: reads bytes only; never imports candidate code.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicJSON,readJSON,listFiles,hash}=require('../../orchestrator/files.cjs');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const id=require('./proposal.json').game_id;
const manifest=readJSON(path.join(root,`autonomy/jobs/${id}/manifest.json`));
if(manifest.game_id!==id)throw Error('wrong evidence identity');
fs.mkdirSync(out,{recursive:true});
function copy(from,to){const src=path.join(root,from),dst=path.join(out,to);if(!fs.existsSync(src))return;fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);}
for(const n of ['commissioning-summary.json','worker-result.json','authorization.json','spec-gate.json','product-preflight.json','source-provenance.json','provider-feedback-audit.json','release-review-packet.json','protected-transport.json','preview-route-verified.json','workflow-evidence.json','preview-verified.jpg'])copy(n,n);
copy(`autonomy/jobs/${id}/manifest.json`,'manifest.json');copy(`autonomy/jobs/${id}/spec.json`,'immutable-spec.json');
copy('autonomy/.provider/ledger.json','provider-ledger.json');
for(const f of listFiles(path.join(root,'autonomy/.provider/requests')))copy('autonomy/.provider/requests/'+f,'provider-requests/'+f);
for(const f of listFiles(path.join(root,`autonomy/artifacts/${id}`)))copy(`autonomy/artifacts/${id}/`+f,'factory/'+f);
for(const f of listFiles(path.join(root,'autonomy/artifacts/control-plane')))copy('autonomy/artifacts/control-plane/'+f,'control-plane/'+f);
for(const f of listFiles(path.join(root,`autonomy/games/${id}`)))copy(`autonomy/games/${id}/`+f,'sources/'+f+'.txt');
const ledger=readJSON(path.join(root,'autonomy/.provider/ledger.json'));
const operations=Object.values(ledger.operations).filter(o=>o.game_id===id).sort((a,b)=>a.started_at-b.started_at),repairs=[];
for(const op of operations){
 const file=path.join(root,'autonomy/.provider/requests',op.operation_id.replaceAll('/','__')+'.json');if(!fs.existsSync(file))continue;
 const req=readJSON(file);if(req.mode!=='repair')continue;
 const previous=path.join(root,`autonomy/artifacts/${id}/${req.repair_request.version}/qa.json`),qa=fs.existsSync(previous)?readJSON(previous):null;
 const missing=(qa?.hard_failures||[]).filter(f=>!req.previous_failures.some(p=>hash(p)===hash(f)));
 if(missing.length)throw Error('repair lost actionable failures: '+JSON.stringify(missing));
 const nextFile=path.join(root,`autonomy/artifacts/${id}/${op.version}/qa.json`),next=fs.existsSync(nextFile)?readJSON(nextFile):null;
 const nextCodes=new Set((next?.hard_failures||[]).map(f=>f.check||f.code));
 repairs.push({operation_id:op.operation_id,all_failures_forwarded:true,previous_failures:req.previous_failures,failed_product_checks:req.qa_evidence?.product_qa?.checks||[],evidence_artifacts:req.qa_evidence?.product_qa?.artifacts||[],source_paths:Object.keys(req.sources),model_validation:req.model_validation,provider_cause:op.result?.cause||null,provider_changed_paths:op.result?.files?.map(f=>f.path)||[],checks_eliminated:next?[...new Set((qa?.hard_failures||[]).map(f=>f.check||f.code))].filter(c=>!nextCodes.has(c)):null});
}
atomicJSON(path.join(out,'repair-feedback-audit.json'),{game_id:id,passed:true,scope:'Exact compiled-request equality plus observed check changes; provider intent cannot be inferred from passing checks alone.',repairs});
const records=listFiles(out).filter(f=>f!=='artifact-index.json').map(f=>{const b=fs.readFileSync(path.join(out,f));return {path:f,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
atomicJSON(path.join(out,'artifact-index.json'),{game_id:id,state:manifest.state,version:manifest.version,source_hash:manifest.source_hash,files:records});
console.log(JSON.stringify({state:manifest.state,version:manifest.version,files:records.length,bytes:records.reduce((n,f)=>n+f.bytes,0),repair_requests:repairs.length}));
