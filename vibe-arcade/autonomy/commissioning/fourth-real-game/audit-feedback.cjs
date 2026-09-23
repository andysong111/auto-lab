'use strict';
// Read-only audit of private ledger/requests; never applies or evaluates candidate text.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {readJSON,atomicJSON,hash}=require('../../orchestrator/files.cjs');
const {allowedFile,inScope}=require('../../providers/output.cjs');
const root=path.resolve(process.argv[2]),id=require('./proposal.json').game_id;
const file=path.join(root,'autonomy/.provider/ledger.json'),ledger=readJSON(file),before=hash(fs.readFileSync(file,'utf8'));
const ops=Object.values(ledger.operations).filter(x=>x.game_id===id).sort((a,b)=>a.started_at-b.started_at),cases=[];
for(let i=0;i<ops.length;i++){
 const op=ops[i];if(op.state!=='MODEL_FAILED')continue;
 const q=op.rejected_output,entry={operation_id:op.operation_id,error_code:op.error_code,error_detail:op.error_detail,error_context:op.error_context,quarantined:!!q,quarantined_files:q?.files.map(f=>({path:f.path,sha256:hash(f.content)})),accepted_version_exists:fs.existsSync(path.join(root,`autonomy/games/${id}/${op.version}`)),next_request:null};
 if(q){assert(q.files.every(f=>allowedFile(f.path)&&!f.path.includes('..')&&!f.path.includes('\\')));assert.equal(entry.accepted_version_exists,false,'validation rejected version was applied');}
 const next=ops[i+1],requestFile=next&&path.join(root,'autonomy/.provider/requests',next.operation_id.replaceAll('/','__')+'.json');
 if(requestFile&&fs.existsSync(requestFile)){
  const req=readJSON(requestFile);assert.equal(req.model_validation?.operation_id,op.operation_id);assert.equal(req.model_validation?.error_code,op.error_code);assert.equal(req.model_validation?.error_detail,op.error_detail||null);
  const names=Object.keys(req.sources),eligible=q?.files.filter(f=>inScope(f.path,req.allowed_paths)&&!inScope(f.path,req.protected_paths))||[];
  assert(names.every(n=>allowedFile(n)&&inScope(n,req.allowed_paths)&&!inScope(n,req.protected_paths)));
  if(req.empty_workspace)for(const f of eligible)assert.equal(req.sources[f.path],f.content,'quarantined source absent/different in repair');
  entry.next_request={operation_id:next.operation_id,empty_workspace:req.empty_workspace,validation_exact:true,sources:names,source_bytes:names.reduce((n,f)=>n+Buffer.byteLength(req.sources[f]),0),quarantine_matches:req.empty_workspace?true:null};
 }
 cases.push(entry);
}
assert.equal(hash(fs.readFileSync(file,'utf8')),before);
const report={game_id:id,passed:true,actual_validation_failures:cases.length,cases,ledger_unchanged:true,ledger_sha256:before,scope:cases.length?'Actual rejected-output feedback audit':'No real output validation failure occurred; conditional behavior covered by mock provider/worker tests.'};
atomicJSON(path.join(root,'provider-feedback-audit.json'),report);console.log(JSON.stringify(report,null,2));
