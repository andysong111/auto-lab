'use strict';
// A trusted entrypoint imposes a deadline inside the container too. Docker --init
// reaps children and exit of PID 1 ends all remaining processes even if the host dies.
const {spawn}=require('node:child_process');
const {readJSON}=require('../orchestrator/files.cjs');
if(process.argv[2]==='probe') {require('./probe.cjs');}
else {
  const config=readJSON('/input/qa.json');
  const duration=Math.min(300000,Math.max(1000,config.deadline_ms||config.policy.limits.run_timeout_ms));
  const scripts={'ribbon-shift':'ribbon-shift.cjs','ribbon-motion-audit':'ribbon-motion-audit.cjs'};
  if(config.product&&!Object.hasOwn(scripts,config.product))throw Error('unknown_product_qa');
  const script='/opt/factory/qa/'+(scripts[config.product]||'worker.cjs');
  const child=spawn(process.execPath,[script,'/input/qa.json'],{env:{PATH:'/usr/bin:/bin',HOME:'/tmp',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'},stdio:'inherit'});
  const timer=setTimeout(()=>process.exit(124),duration);
  child.once('exit',code=>{clearTimeout(timer);process.exit(code??1);});
  child.once('error',()=>{clearTimeout(timer);process.exit(125);});
}
