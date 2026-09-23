'use strict';
// Static migration audit only. Never load/execute an archived game's JS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validateOutput}=require('../providers/output.cjs');
const {evaluate}=require('../orchestrator/quality.cjs');
const {atomicJSON,safePath}=require('../orchestrator/files.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function audit(dir){
 const index=JSON.parse(fs.readFileSync(path.join(dir,'index.json'))),reports=[];
 for(const item of index){
  const file=path.join(dir,item.manifest_file),before=fs.readFileSync(file);if(digest(before)!==item.sha256)throw Error('archived manifest digest mismatch');
  const m=JSON.parse(before),qaFile=path.join(dir,item.name+'-qa.json'),qa=fs.existsSync(qaFile)?JSON.parse(fs.readFileSync(qaFile)):null;
  const gate=evaluate(m,qa);reports.push({...item,diagnostic_gate:gate.decision,product_qa:'UNVERIFIED',reason:'Archived candidate has no reviewed v1 machine contract; original evidence is not upgraded to a new PASS',codes:[...new Set(gate.hard_failures.map(f=>f.code))],manifest_unchanged:digest(fs.readFileSync(file))===item.sha256});
 }
 const quarantined=[];for(const item of index.filter(i=>i.quarantined_core_file)){const sourceFile=safePath(dir,item.quarantined_core_file),before=fs.readFileSync(sourceFile);let validation;
 try{validateOutput({status:'complete',summary:'Archived core text only',tests:[],files:[{path:'core.js',content:before.toString('utf8')}]},{mode:'repair',allowed_paths:['core.js']},{max_response_bytes:1048576,max_file_bytes:262144,max_files:1});validation={passed:true};}catch(e){validation={passed:false,code:e.code,message:e.message,detail:e.detail};}
 quarantined.push({file:item.quarantined_core_file,sha256:digest(before),unchanged:digest(fs.readFileSync(sourceFile))===digest(before),validation});}
 return {schema_version:1,mode:'read-only static migration audit',candidate_execution:false,factory_invoked:false,provider_calls:0,reports,quarantined};
}
if(require.main===module){const result=audit(path.resolve(process.argv[2]));if(process.argv[3])atomicJSON(path.resolve(process.argv[3]),result);else process.stdout.write(JSON.stringify(result,null,2)+'\n');}
module.exports={audit};
