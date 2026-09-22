'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {FileStore}=require('../../orchestrator/store.cjs'),{Factory}=require('../../orchestrator/engine.cjs');
const {atomicJSON,requiredFiles}=require('../../orchestrator/files.cjs');
const {compile}=require('../../providers/prompts.cjs');
const {config,pricing}=require('../../providers/config.cjs');
const {ProviderManager}=require('../../providers/manager.cjs');
const {AutonomousWorker}=require('../runtime.cjs');
const source=path.resolve(__dirname,'../../fixtures/dummy');
function output({broken=false,repair=false,content}={}) {
  const files=(repair?['core.js']:requiredFiles).map(name=>({path:name,content:fs.readFileSync(path.join(source,name),'utf8')}));
  if(broken)files.find(f=>f.path==='core.js').content=files.find(f=>f.path==='core.js').content.replace('const BROKEN = false','const BROKEN = true');
  if(content)files.find(f=>f.path==='core.js').content=content;
  return {status:'complete',files,summary:'Deterministic fixture response from a mock provider, no model request.',tests:['existing browser acceptance contract']};
}
class MockProvider {
  constructor({broken=false,permanent=false,handler}={}){this.identity='mock/responses';this.calls=0;this.submissions=0;this.requests=[];this.broken=broken;this.permanent=permanent;this.handler=handler;}
  assertAvailable(){}
  async generate(c){this.calls++;if(!c.response_id)this.submissions++;this.requests.push(c.request);if(this.handler)return this.handler(c,this);c.onResponseId('resp_mock_'+this.calls);return {output:output({broken:this.permanent||(this.broken&&c.request.mode==='build'),repair:c.request.mode==='repair'}),usage:{input_tokens:100,output_tokens:100}};}
}
function setup(t,options={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-ai-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const policy=JSON.parse(JSON.stringify(require('../../control-plane/policy.json')));policy.intake_enabled=true;policy.auto_rc_enabled=false;
  const policyFile=path.join(root,'control-policy.json');atomicJSON(policyFile,policy);
  const limits=config(options.limits),provider=options.provider||new MockProvider();
  const store=new FileStore(root),spec={...require('../../examples/dummy-spec.json'),...options.spec};
  const factory=new Factory({store});
  const manager=new ProviderManager({root,provider,config:limits,prices:pricing(null,{mock:true}),...options.manager});
  const settings={commissioning:true,...options.limits,...options.settings};
  const worker=new AutonomousWorker({root,policyFile,settings,provider,mock:true,...options.worker});
  return {root,store,spec,factory,provider,manager,limits,policy,policyFile,worker};
}
async function request(env) {
  const manifest=await env.factory.create(env.spec),workspace=path.join(env.root,`autonomy/.work/${manifest.game_id}/${manifest.version}`);fs.mkdirSync(workspace,{recursive:true});
  return compile({root:env.root,workspace,manifest,spec:env.spec,operationId:manifest.game_id+'/build/v1',budget:{per_game:env.limits.per_game,request:env.limits.request}});
}
function evidence(name,env,result) {
  if(!process.env.FACTORY_EVIDENCE_DIR)return;
  const dir=path.join(process.env.FACTORY_EVIDENCE_DIR,name);fs.mkdirSync(dir,{recursive:true});
  atomicJSON(path.join(dir,'worker.json'),result);
  fs.cpSync(path.join(env.root,'autonomy/artifacts'),path.join(dir,'artifacts'),{recursive:true});
  atomicJSON(path.join(dir,'manifest.json'),env.store.get(env.spec.game_id));
  const ledger=env.manager.read();if(Object.keys(ledger.operations).length)atomicJSON(path.join(dir,'budget-summary.json'),{cost_basis:ledger.cost_basis,calls:Object.keys(ledger.operations).length,operations:Object.values(ledger.operations).map(({operation_id,state,accounted,reserved})=>({operation_id,state,accounted,reserved}))});
}
module.exports={setup,request,MockProvider,output,source,evidence};
