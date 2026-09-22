'use strict';
// Verify quarantined provider output as DATA. Never accept, execute or write candidate game files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {readJSON,atomicJSON}=require('../../orchestrator/files.cjs'),{validateOutput}=require('../../providers/output.cjs');
const root=path.resolve(process.argv[2]),id='GAME-20260922-121',digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const ledger=readJSON(path.join(root,'autonomy/.provider/ledger.json')),m=readJSON(path.join(root,`autonomy/jobs/${id}/manifest.json`));
assert.equal(m.state,'REJECTED');assert.equal(m.repair_attempt,5);assert(!fs.existsSync(path.join(root,m.source_path)));assert.equal(Object.keys(ledger.operations).length,6);
const rows=[];
for(const o of Object.values(ledger.operations)){
 assert.equal(o.state,'MODEL_FAILED');const r=readJSON(path.join(root,'rejected-response-audit',o.version+'.json'));assert.equal(r.response_id,o.response_id);assert.equal(r.operation_id,o.operation_id);assert.equal(r.output_sha256,digest(r.output_text));
 assert.equal(r.usage.input_tokens,o.accounted.input_tokens);assert.equal(r.usage.output_tokens,o.accounted.output_tokens);
 const data=JSON.parse(r.output_text),files=data.files.map(f=>({path:f.path,sha256:digest(f.content),bytes:Buffer.byteLength(f.content)}));
 let violation;try{validateOutput(r.output_text,{mode:'build',allowed_paths:files.map(f=>f.path)},{max_response_bytes:1048576,max_file_bytes:131072,max_files:24});}catch(e){violation={code:e.code,message:e.message};}
 assert.equal(violation?.code,'core_dom_dependency');
 rows.push({operation_id:o.operation_id,version:o.version,response_id:r.response_id,output_sha256:r.output_sha256,files,violation});
}
const report={schema:'playjolt-rejected-output-provenance/1',game_id:id,version:m.version,state:m.state,provenance_verified:true,accepted_candidate:false,factory_source_hash:null,accepted_source_directory_exists:false,candidate_manual_edits:0,candidate_executions:0,provider_generation_calls:6,additional_audit_generation_calls:0,responses:rows,note:'GET-retrieved existing provider outputs are quarantined data. All six retain the original DOM-core violation; no Factory source tree, browser QA, quality PASS or release is inferred.'};
atomicJSON(path.join(root,'source-provenance.json'),report);console.log(JSON.stringify({provenance_verified:true,accepted_candidate:false,responses:rows.length,factory_state:m.state}));
