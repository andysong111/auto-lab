'use strict';
const path=require('node:path');
const {AutonomousWorker}=require('../../worker/runtime.cjs'),{DockerQA}=require('../../isolation/docker-qa.cjs');
const {OpenAIProvider}=require('../../providers/openai.cjs');
const {readJSON,atomicJSON,hash}=require('../../orchestrator/files.cjs');
const {checkFeedback,auditedProvider}=require('./feedback.cjs');
class ProductQA{
 constructor({limits,signal}){this.limits=limits;this.signal=signal;}
 assertAvailable(){new DockerQA({limits:this.limits,signal:this.signal}).assertAvailable();}
 async run(c){
  const common=await new DockerQA({limits:{...this.limits,timeout_ms:150000},signal:this.signal}).run({...c,outDir:path.join(c.outDir,'common')});
  if(common.side_effects.length)return common; // fatal remains fatal, no more candidate execution
  const product=await new DockerQA({limits:this.limits,signal:this.signal}).run({...c,outDir:path.join(c.outDir,'product'),product:'ribbon-shift',policy:{...c.policy,limits:{...c.policy.limits,run_timeout_ms:300000}}});
  const result={...common,passed:common.passed&&product.passed,hard_failures:[...common.hard_failures,...product.hard_failures],console_errors:[...common.console_errors,...product.console_errors],page_errors:[...common.page_errors,...product.page_errors],side_effects:[...common.side_effects,...product.side_effects],screenshots:[...common.screenshots.map(x=>'common/'+x),...product.screenshots.map(x=>'product/'+x)],duration_ms:common.duration_ms+product.duration_ms,product_evidence:{passed:product.passed,report:'product/qa.json',seeds:product.browser_cases.map(x=>x.seed),source_hash:product.source_hash},policy_hash:hash(c.policy)};
  atomicJSON(path.join(c.outDir,'qa.json'),result);return result;
 }
}
async function run(){const root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json')),controller=new AbortController();for(const name of ['SIGINT','SIGTERM'])process.once(name,()=>controller.abort(Error('worker stopped')));
 const worker=new AutonomousWorker({root,settings,policyFile:path.join(root,'control-policy.json'),provider:auditedProvider(new OpenAIProvider(),root),beforeProvider:()=>checkFeedback(root),qa:new ProductQA({limits:settings.isolation,signal:controller.signal}),signal:controller.signal});
 const result=await worker.runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result));if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;
}
if(require.main===module)run().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={ProductQA};
