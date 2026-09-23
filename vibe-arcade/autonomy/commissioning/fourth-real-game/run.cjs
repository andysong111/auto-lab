'use strict';
const path=require('node:path');
const {AutonomousWorker}=require('../../worker/runtime.cjs');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {OpenAIProvider}=require('../../providers/openai.cjs');
const {readJSON,atomicJSON}=require('../../orchestrator/files.cjs');
const {auditedProvider}=require('./feedback.cjs');
async function run(){
 const root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json')),controller=new AbortController();
 for(const name of ['SIGINT','SIGTERM'])process.once(name,()=>controller.abort(Error('worker stopped')));
 const docker=new DockerQA({limits:settings.isolation,signal:controller.signal});
 // Logging only: both suites, policy, isolation and all result fields are unchanged.
 const qa={assertAvailable:()=>docker.assertAvailable(),run:async c=>{
  console.log(JSON.stringify({qa_start:c.manifest.game_id,version:c.manifest.version}));
  const result=await docker.run(c);
  console.log(JSON.stringify({qa_end:c.manifest.version,technical:result.technical_qa?.passed,product:result.product_qa?.passed,failures:result.hard_failures.map(f=>({code:f.code,check:f.check,selector:f.selector,state_path:f.state_path,expected:f.expected,actual:f.actual,evidence:f.evidence}))}));
  return result;
 }};
 const worker=new AutonomousWorker({root,settings,policyFile:path.join(root,'control-policy.json'),provider:auditedProvider(new OpenAIProvider(),root),qa,signal:controller.signal});
 const result=await worker.runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result));
 if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;
}
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={run};
