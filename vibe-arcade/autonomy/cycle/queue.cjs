'use strict';
const fs=require('node:fs'),path=require('node:path');
const {resolveRequest}=require('./resolve.cjs');

function fail(message){const e=new Error(message);e.code='auto_cycle_queue_invalid';throw e;}
function loadQueue(root,file='vibe-arcade/autonomy/cycle/queue.json'){
  const full=path.resolve(root,file),base=path.resolve(root,'vibe-arcade/autonomy/cycle');
  if(!(full===base||full.startsWith(base+path.sep)))fail('queue_path_escape');
  const q=JSON.parse(fs.readFileSync(full,'utf8'));
  if(q.schema!=='playjolt-cycle-queue/1'||!Array.isArray(q.entries)||q.entries.length>32)fail('invalid_queue');
  const seen=new Set();
  for(const row of q.entries){
    if(!row||typeof row!=='object'||typeof row.branch!=='string'||!/^commissioning\/[a-z0-9._/-]+$/i.test(row.branch))fail('invalid_branch');
    if(typeof row.request_path!=='string')fail('invalid_request_path');
    if(seen.has(row.branch))fail('duplicate_branch');seen.add(row.branch);
  }
  return q;
}
function nextEntry(root,currentBranch,{queueFile}={}){
  const q=loadQueue(root,queueFile);
  const i=q.entries.findIndex(x=>x.branch===currentBranch);
  if(i<0)fail('current_branch_not_queued');
  const row=q.entries[i+1]||null;
  if(!row)return null;
  // The target request must already exist in the checked-out target ref when the
  // workflow dispatches it. Local validation is optional because the supervisor
  // normally runs on main, not the target candidate branch.
  return {...row,index:i+1};
}
function validateCheckedOutEntry(root,row){
  const meta=resolveRequest(root,row.request_path);
  if(meta.production_authorized!==false)fail('production_must_remain_off');
  return {...row,...meta};
}
if(require.main===module){
  const cmd=process.argv[2],arg=process.argv[3];
  try{
    if(cmd==='next')process.stdout.write(JSON.stringify(nextEntry(process.cwd(),arg))+'\n');
    else if(cmd==='validate')process.stdout.write(JSON.stringify(validateCheckedOutEntry(process.cwd(),{request_path:arg}))+'\n');
    else throw Error('usage: queue.cjs next <current-branch> | validate <request-path>');
  }catch(e){console.error((e.code||'error')+': '+e.message);process.exit(2);}
}
module.exports={loadQueue,nextEntry,validateCheckedOutEntry};
