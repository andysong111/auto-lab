'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {ID,safePath}=require('../orchestrator/files.cjs');
const {ProviderPause}=require('../providers/errors.cjs');
// Linux advisory locks serialize worker/ledger operations even when two processes
// simultaneously recover after a crash. Existing Factory job locks stay unchanged.
class ProcessLock {
  constructor(root){this.root=path.resolve(root);}
  async withLock(id,fn) {
    if(!ID.test(id))throw new ProviderPause('invalid_lock_id');
    if(process.platform!=='linux')throw new ProviderPause('worker_lock_unavailable',undefined,'PAUSED_ISOLATION');
    const file=safePath(this.root,`autonomy/.locks/${id}.kernel`);fs.mkdirSync(path.dirname(file),{recursive:true});
    const lost=new AbortController();let acquired=false,closing=false,closed=false;
    // No shell, no secrets. Closing the parent's stdin (including SIGKILL/crash)
    // releases the lock in the helper; --no-fork leaves no flock grandchild.
    const child=spawn('flock',['--nonblock','--no-fork',file,process.execPath,'-e',
      'process.stdin.resume();process.stdin.once("end",()=>process.exit(0));process.stdout.write("LOCKED\\n");'],
      {env:{PATH:process.env.PATH||'/usr/bin:/bin'},stdio:['pipe','pipe','ignore']});
    child.stdin.on('error',()=>{});
    child.once('close',()=>{closed=true;if(acquired&&!closing)lost.abort(new ProviderPause('worker_lock_lost',undefined,'PAUSED_ERROR'));});
    try {
      await new Promise((resolve,reject)=>{
        let output='';const timer=setTimeout(()=>finish(new ProviderPause('worker_lock_unavailable',undefined,'PAUSED_ISOLATION')),10000);
        const onError=()=>finish(new ProviderPause('worker_lock_unavailable',undefined,'PAUSED_ISOLATION'));
        const onClose=code=>finish(code===1?Error('job_locked'):new ProviderPause('worker_lock_unavailable',undefined,'PAUSED_ISOLATION'));
        const onData=b=>{output=(output+b).slice(-64);if(output==='LOCKED\n'){acquired=true;finish();}};
        function finish(error){clearTimeout(timer);child.removeListener('error',onError);child.removeListener('close',onClose);child.stdout.removeListener('data',onData);error?reject(error):resolve();}
        child.once('error',onError);child.once('close',onClose);child.stdout.on('data',onData);
      });
      if(lost.signal.aborted)throw lost.signal.reason;
      return await fn(lost.signal);
    } finally {
      closing=true;child.stdin.end();
      if(!closed)await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill('SIGKILL');resolve();},2000);child.once('close',()=>{clearTimeout(timer);resolve();});});
    }
  }
}
module.exports={ProcessLock};
