#!/usr/bin/env node
'use strict';
const path=require('node:path');
const {readJSON}=require('./orchestrator/files.cjs');
const {AutonomousWorker}=require('./worker/runtime.cjs');
const {ProviderPause}=require('./providers/errors.cjs');
async function main(argv=process.argv.slice(2)) {
  const [command,...args]=argv,opts={};
  if(!['run-once','loop'].includes(command))throw Error('Usage: node autonomy/worker.cjs run-once|loop [--root dedicated-directory --policy commissioning-policy.json --config worker-config.json]');
  for(let i=0;i<args.length;i+=2){if(!['--root','--policy','--config'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('invalid_worker_option');opts[args[i].slice(2)]=path.resolve(args[i+1]);}
  const controller=new AbortController(),stop=()=>controller.abort(new ProviderPause('worker_stopped',undefined,'PAUSED_SHUTDOWN'));
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
  try {
    const worker=new AutonomousWorker({root:opts.root,policyFile:opts.policy,settings:opts.config?readJSON(opts.config):{},signal:controller.signal});
    const result=await (command==='loop'?worker.loop():worker.runOnce());console.log(JSON.stringify(result,null,2));return result;
  }finally{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
}
if(require.main===module)main().catch(()=>{console.error('worker_configuration_error: inspect config without printing secrets');process.exitCode=1;});
module.exports={main};
