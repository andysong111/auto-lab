'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {atomicJSON,readJSON,hashTree,hash}=require('../orchestrator/files.cjs');
const defaultPolicy=require('../policies/quality-gate.json');
function runQA({manifest,gameRoot,outDir,policy=defaultPolicy,timeoutMs=policy.limits.run_timeout_ms}) {
  fs.mkdirSync(outDir,{recursive:true}); const input=path.join(outDir,'qa-input.json'), output=path.join(outDir,'qa.json');
  atomicJSON(input,{manifest,gameRoot,outDir,policy});
  fs.rmSync(output,{force:true});
  // Child process boundary also contains infinite JS loops. No credentials reach this browser process.
  const env={PATH:process.env.PATH,NODE_PATH:process.env.NODE_PATH||'',HOME:process.env.HOME,PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH||'',CHROMIUM_PATH:process.env.CHROMIUM_PATH||''};
  const started=Date.now(); const sourceHash=hashTree(gameRoot);
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[path.join(__dirname,'worker.cjs'),input],{env,detached:process.platform!=='win32',stdio:['ignore','ignore','pipe']});
    let stderr='',timedOut=false,done=false;
    child.stderr.on('data',d=>{stderr=(stderr+d).slice(-2000);});
    function kill() { try { process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL'); } catch {} }
    const timer=setTimeout(()=>{timedOut=true;kill();},timeoutMs);
    const finish=()=>{
      if(done)return;done=true;clearTimeout(timer);kill();
      let report; try{ report=readJSON(output); }catch{}
      if(timedOut||!report||report.source_hash!==sourceHash) {
        report={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:sourceHash,policy_hash:hash(policy),passed:false,
          hard_failures:[{code:timedOut?'timeout':'qa_crash',message:timedOut?'QA worker exceeded process deadline':stderr||'Missing fresh QA result'}],
          soft_failures:[],console_errors:[],page_errors:[],browser_cases:report?.browser_cases||[],screenshots:[],side_effects:[],duration_ms:Date.now()-started};
        atomicJSON(output,report);
      }
      resolve(report);
    };
    child.once('error',finish); child.once('close',finish);
  });
}
module.exports={runQA};
