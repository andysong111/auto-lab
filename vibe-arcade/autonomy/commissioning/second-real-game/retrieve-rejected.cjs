'use strict';
// Read ONLY the six already-created Responses. No generate, POST, retry, Factory.run or candidate execution.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {atomicJSON,readJSON}=require('../../orchestrator/files.cjs'),{readBounded}=require('../../providers/openai.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function audit(){
 const root=process.env.FACTORY_WORKER_ROOT,id='GAME-20260922-121',lf=path.join(root,'autonomy/.provider/ledger.json'),mf=path.join(root,`autonomy/jobs/${id}/manifest.json`);
 const before={ledger:digest(fs.readFileSync(lf)),manifest:digest(fs.readFileSync(mf))},ledger=readJSON(lf),m=readJSON(mf);
 if(m.state!=='REJECTED'||m.repair_attempt!==5)throw Error('rejected_checkpoint_required');
 const ops=Object.values(ledger.operations);if(ops.length!==6||ops.some(o=>o.game_id!==id||o.state!=='MODEL_FAILED'||!/^resp_[A-Za-z0-9_-]+$/.test(o.response_id)))throw Error('six_existing_response_ids_required');
 if(!process.env.OPENAI_API_KEY)throw Error('existing_provider_read_access_required');
 const rows=[];
 for(const o of ops){
  const signal=AbortSignal.timeout(20000);
  const response=await fetch('https://api.openai.com/v1/responses/'+o.response_id,{method:'GET',redirect:'error',signal,headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY}});
  if(!response.ok)throw Error('response_read_http_'+response.status);
  const data=await readBounded(response,1048576,signal);if(data.id!==o.response_id||data.model!=='gpt-5.6-terra')throw Error('response_identity_mismatch');
  const text=(data.output||[]).filter(x=>x.type==='message').flatMap(m=>m.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
  const files=JSON.parse(text).files;const core=files.find(f=>f.path==='core.js')?.content||'';
  const hits=core.split('\n').flatMap((line,i)=>/\b(?:document|window|localStorage|fetch)\b/.test(line)?[{line:i+1,content:line.slice(0,1200)}]:[]);
  const record={operation_id:o.operation_id,response_id:data.id,model:data.model,status:data.status,usage:data.usage,output_text:text,output_sha256:digest(text),retrieved_at:new Date().toISOString(),transport:'GET existing response; no generation call'};
  atomicJSON(path.join(root,'rejected-response-audit',o.version+'.json'),record);
  rows.push({operation_id:o.operation_id,version:o.version,response_id:data.id,output_sha256:record.output_sha256,files:files.map(f=>({path:f.path,sha256:digest(f.content),bytes:Buffer.byteLength(f.content)})),core_guard_matches:hits});
 }
 const after={ledger:digest(fs.readFileSync(lf)),manifest:digest(fs.readFileSync(mf))};if(JSON.stringify(before)!==JSON.stringify(after))throw Error('rejected_state_changed');
 const summary={game_id:id,state:'REJECTED',new_generation_calls:0,read_requests:rows.length,before,after,immutable:true,responses:rows};
 atomicJSON(path.join(root,'rejected-response-audit/summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
audit().catch(e=>{console.error(e.message);process.exitCode=1;});
