'use strict';
// Trusted transport bridge to connected GitHub/Vercel tools. The existing
// release adapter and Factory own all gates, exact-tree checks and transitions.
// No candidate source is imported, modified or regenerated here.
const fs=require('node:fs'),path=require('node:path');
const {FileStore}=require('../../orchestrator/store.cjs');
const {Factory}=require('../../orchestrator/engine.cjs');
const {GitHubVercelAdapter}=require('../../adapters/github-vercel.cjs');
const {readJSON,atomicJSON}=require('../../orchestrator/files.cjs');
const root=path.resolve(process.argv[2]),rpc=path.resolve(process.argv[3]);
const id=require('./proposal.json').game_id;let seq=0;
fs.mkdirSync(rpc,{recursive:true});
async function exchange(kind,payload){
 const key=process.pid+'-'+(++seq),file=path.join(rpc,key+'.response.json');
 atomicJSON(path.join(rpc,'pending.json'),{key,kind,...payload});
 const start=Date.now();while(!fs.existsSync(file)){if(Date.now()-start>300000)throw Error('connected_transport_timeout');await new Promise(r=>setTimeout(r,100));}
 const reply=readJSON(file);fs.rmSync(path.join(rpc,'pending.json'));
 if(reply.error){const e=Error(reply.error);e.status=reply.status;throw e;}return reply.data;
}
class ConnectedRelease extends GitHubVercelAdapter{
 async api(route,method='GET',body){return exchange('github',{route,method,body});}
}
async function run(){
 const store=new FileStore(root),m=store.get(id);
 if(!['RC_READY','PREVIEW_DEPLOYING','PREVIEW_SMOKE','READY_TO_SHIP'].includes(m.state)||m.technical_qa_status!=='PASS'||m.product_qa_status!=='PASS'||m.quality_status!=='PASS')throw Error('all_three_gates_required');
 const release=new ConnectedRelease({baseRef:'main',fetchImpl:async(url,options)=>{
  if(options.method!=='GET')throw Error('preview_get_only');
  const r=await exchange('preview',{url,method:'GET',redirect:'manual'});
  return new Response(Buffer.from(r.body_base64,'base64'),{status:r.status,headers:r.headers});
 }});
 const final=await new Factory({store,release}).run(id,{rc:true});
 atomicJSON(path.join(root,'rc-worker-result.json'),{state:final.state,version:final.version,source_hash:final.source_hash,branch:final.branch,pr_number:final.pr_number,preview_url:final.preview_url});
 console.log(JSON.stringify({state:final.state,branch:final.branch,pr_number:final.pr_number,preview_url:final.preview_url}));
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;});
