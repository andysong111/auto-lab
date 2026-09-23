'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {setup,MockProvider,output}=require('./helpers.cjs');
const {AutonomousWorker}=require('../runtime.cjs');
const {ProviderPause}=require('../../providers/errors.cjs');
const {OpenAIProvider}=require('../../providers/openai.cjs');
const {atomicJSON,readJSON}=require('../../orchestrator/files.cjs');
const {DockerQA,dockerArgs,environment}=require('../../isolation/docker-qa.cjs');
const {mockQA}=require('../../tests/helpers.cjs');
const qa={assertAvailable(){},run:mockQA}; // State-machine test only: never executes generated source.
test('worker mock build reuses Factory transitions and remains unlisted RC_READY',async t=>{
  const e=setup(t,{worker:{qa}});await e.factory.create(e.spec);
  const result=await e.worker.runOnce();assert.equal(result.status,'RC_READY',JSON.stringify(result));assert.equal(e.provider.calls,1);
  assert.equal(e.store.get(e.spec.game_id).repair_attempt,0);assert.equal((await e.worker.runOnce()).status,'IDLE');assert.equal(e.provider.calls,1);
});
for(const [key,value,code] of [['intake_enabled',false,'intake_disabled'],['factory',true,'factory_kill_switch']])test(code+' blocks all provider and isolation calls',async t=>{
  const e=setup(t,{worker:{qa:{assertAvailable(){throw Error('must not access Docker');}}}});await e.factory.create(e.spec);
  if(key==='factory')e.policy.kill_switches.factory=value;else e.policy[key]=value;atomicJSON(e.policyFile,e.policy);
  const result=await e.worker.runOnce();assert.equal(result.code,code);assert.equal(e.provider.calls,0);assert.equal(e.store.get(e.spec.game_id).state,'SPEC_READY');
});
test('provider unavailable and isolation unavailable both fail before reserving/charging or changing Factory',async t=>{
  const e=setup(t,{worker:{qa,provider:new OpenAIProvider({apiKey:'',model:''})}});await e.factory.create(e.spec);
  assert.equal((await e.worker.runOnce()).code,'provider_unavailable');assert(!fs.existsSync(e.manager.file));
  e.worker.provider=e.provider;e.worker.qa=new DockerQA({image:'mutable:tag',limits:e.limits.isolation});
  assert.equal((await e.worker.runOnce()).status,'PAUSED_ISOLATION');assert.equal(e.provider.calls,0);assert.equal(e.store.get(e.spec.game_id).state,'SPEC_READY');
});
test('budget pause preserves BUILDING checkpoint and consumes no repair attempt',async t=>{
  const e=setup(t,{limits:{per_game:{max_input_tokens:1}},worker:{qa}});await e.factory.create(e.spec);
  const result=await e.worker.runOnce();assert.equal(result.status,'PAUSED_BUDGET');assert.equal(result.owner_action,false);
  assert.equal(e.store.get(e.spec.game_id).state,'BUILDING');assert.equal(e.store.get(e.spec.game_id).repair_attempt,0);assert.equal(e.provider.calls,0);
});
test('live kill switch aborts in-flight work and no second generation is submitted',async t=>{
  let e;const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_killed');e.policy.kill_switches.factory=true;atomicJSON(e.policyFile,e.policy);return new Promise(()=>{});}});
  e=setup(t,{provider,worker:{qa}});await e.factory.create(e.spec);
  const result=await e.worker.runOnce();assert.equal(result.status,'PAUSED_KILL_SWITCH');assert.equal(e.store.get(e.spec.game_id).repair_attempt,0);
  assert.equal((await e.worker.runOnce()).status,'PAUSED_KILL_SWITCH');assert.equal(provider.submissions,1);
});
test('global worker lock prevents overlapping jobs/calls',async t=>{
  const e=setup(t,{worker:{qa}});await e.factory.create(e.spec);
  await e.worker.locks.withLock('GAME-00000000-000',async()=>{const r=await e.worker.runOnce();assert.equal(r.status,'PAUSED_CONCURRENCY');});assert.equal(e.provider.calls,0);
});
test('bounded polling backs off and stops after configured polls or intake disable',async t=>{
  const e=setup(t,{limits:{polling:{max_polls:3,interval_ms:100,max_backoff_ms:200}},worker:{qa}});
  const start=Date.now(),r=await e.worker.loop();assert.equal(r.polls,3);assert(Date.now()-start>=290);assert.equal(e.provider.calls,0);
  e.policy.intake_enabled=false;atomicJSON(e.policyFile,e.policy);assert.equal((await e.worker.loop()).polls,1);
});
test('shutdown signal interrupts pending provider, preserving resumable Factory state',async t=>{
  const controller=new AbortController();const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_stop');setTimeout(()=>controller.abort(new ProviderPause('worker_stopped',undefined,'PAUSED_SHUTDOWN')),10);return new Promise(()=>{});}});
  const e=setup(t,{provider,worker:{qa,signal:controller.signal}});await e.factory.create(e.spec);
  assert.equal((await e.worker.runOnce()).status,'PAUSED_SHUTDOWN');assert.equal(e.store.get(e.spec.game_id).state,'BUILDING');
});
test('actual worker process crash after response checkpoint recovers stale locks and resumes GET without new submission',async t=>{
  const e=setup(t,{worker:{qa}});await e.factory.create(e.spec);
  const script=`const {AutonomousWorker}=require(${JSON.stringify(path.resolve(__dirname,'../runtime.cjs'))});
    const provider={identity:'mock/responses',assertAvailable(){},async generate(c){c.onResponseId('resp_crash');process.exit(73);}};
    new AutonomousWorker({root:${JSON.stringify(e.root)},policyFile:${JSON.stringify(e.policyFile)},settings:{commissioning:true},provider,mock:true,qa:{assertAvailable(){}}}).runOnce();`;
  const child=spawnSync(process.execPath,['-e',script],{timeout:10000,encoding:'utf8',env:{PATH:process.env.PATH}});assert.equal(child.status,73,child.stderr);
  assert.equal(e.store.get(e.spec.game_id).state,'BUILDING');assert.equal(e.manager.read().operations[e.spec.game_id+'/build/v1'].response_id,'resp_crash');
  e.worker.provider=new MockProvider({handler:async c=>{assert.equal(c.response_id,'resp_crash');return {output:output()};}});
  e.worker.limits.polling.interval_ms=100;e.worker.limits.polling.max_backoff_ms=200;
  const result=(await e.worker.loop()).results.at(-1);assert.equal(result.status,'RC_READY',JSON.stringify(result));assert.equal(e.worker.provider.submissions,0);
});
test('fatal path escape rejects with existing exception policy; no repair call',async t=>{
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_badpath');return {output:{...output(),files:[{path:'../../index.html',content:'bad'}]}};}}),e=setup(t,{provider,worker:{qa}});await e.factory.create(e.spec);
  const r=await e.worker.runOnce();assert.equal(r.status,'REJECTED');assert.equal(r.owner_action,true);assert.equal(provider.calls,1);assert.equal(e.store.get(e.spec.game_id).repair_attempt,0);
});
test('RC remains behind both worker opt-in and current Control Plane release switch',async t=>{
  let releases=0;const e=setup(t,{settings:{release_candidates:true},worker:{qa,release:{prepare:async()=>{releases++;return {};}}}});await e.factory.create(e.spec);
  assert.equal((await e.worker.runOnce()).status,'RC_READY');assert.equal(releases,0);
  // Explicit reviewed-state fixture: the test below isolates the two RC switches.
  e.store.put({...e.store.get(e.spec.game_id),commercial_contract:require('../../qa/commercial/fixtures/contract.json'),commercial_qa_status:'PASS'});
  e.policy.auto_rc_enabled=true;e.policy.kill_switches.release_candidates=true;atomicJSON(e.policyFile,e.policy);
  assert.equal((await e.worker.runOnce()).status,'IDLE');assert.equal(releases,0);
  e.policy.kill_switches.release_candidates=false;atomicJSON(e.policyFile,e.policy);
  assert.equal((await e.worker.runOnce()).status,'WAITING_RC');assert.equal(releases,1);
  e.policy.kill_switches.release_candidates=true;atomicJSON(e.policyFile,e.policy);assert.equal((await e.worker.runOnce()).status,'IDLE');assert.equal(releases,1);
});
test('container invocation has only candidate/input/artifact mounts, no network, secrets or host execution fallback',()=>{
  process.env.FACTORY_TEST_SECRET='not-a-real-secret';const env=environment();assert(!env.FACTORY_TEST_SECRET&&!env.OPENAI_API_KEY&&!env.GITHUB_TOKEN);delete process.env.FACTORY_TEST_SECRET;
  const args=dockerArgs({name:'test',image:'sha256:'+'a'.repeat(64),candidate:'/tmp/candidate',input:'/tmp/input',artifacts:'/tmp/artifacts',limits:{cpus:1,memory_mb:1024,pids:128}});
  assert(args.includes('--read-only')&&args.includes('--cap-drop')&&args.includes('--pids-limit'));assert.equal(args[args.indexOf('--network')+1],'none');assert(!args.includes('--env')&&!args.includes('--privileged'));assert.equal(args.filter(x=>x==='--mount').length,3);
  assert.throws(()=>dockerArgs({image:'latest'}),/isolation_image_not_pinned/);
});
test('Control Plane reads worker pause overlay without changing Factory state or raising routine owner alerts',async t=>{
  const {snapshot}=require('../../control-plane/control.cjs'),{html}=require('../../control-plane/render.cjs');
  const e=setup(t,{limits:{per_game:{max_input_tokens:1}},worker:{qa}});await e.factory.create(e.spec);await e.worker.runOnce();
  const s=snapshot({root:e.root,policy:e.policy});assert.equal(s.worker.status,'PAUSED_BUDGET');assert.equal(s.jobs[0].worker.status,'PAUSED_BUDGET');assert.equal(s.jobs[0].state,'BUILDING');assert.equal(s.owner_action_required,false);assert(html(s).includes('PAUSED_BUDGET'));
});
for(const [name,exitCode,kind,expected] of [
  ['failed game report',1,'game','freeze'],['infrastructure report',1,'infra','qa_infrastructure'],['crash after pass report',137,'pass','qa_crash'],['mismatched source evidence',0,'tamper','source_tampered']])test('Docker report boundary: '+name,async t=>{
  const {EventEmitter}=require('node:events'),{PassThrough}=require('node:stream');
  const {copyGame,hashTree,hash}=require('../../orchestrator/files.cjs');
  const policy=require('../../policies/quality-gate.json'),e=setup(t),m=await e.factory.create(e.spec),gameRoot=path.join(e.root,m.source_path);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),gameRoot);
  let removals=0;const image='sha256:'+'a'.repeat(64);
  const docker=new DockerQA({image,limits:e.limits.isolation,execSync:(command,args)=>{assert.equal(command,'docker');if(args[0]==='rm')removals++;return {status:0,stdout:image+'\n'};},exec:(command,args,opts)=>{
    assert.equal(command,'docker');assert(!opts.env.OPENAI_API_KEY);const mount=args.find(x=>x.includes('target=/artifacts')),out=mount.match(/source=([^,]+)/)[1];
    const p=new EventEmitter();p.stderr=new PassThrough();process.nextTick(()=>{
      atomicJSON(path.join(out,'qa.json'),{game_id:m.game_id,version:m.version,source_hash:kind==='tamper'?'tampered':hashTree(gameRoot),policy_hash:hash(policy),passed:kind==='pass'||kind==='tamper',hard_failures:kind==='pass'||kind==='tamper'?[]:[{code:kind==='infra'?'qa_infrastructure':'freeze',message:'contract fixture'}]});p.emit('close',exitCode);
    });return p;
  }});
  const args={manifest:m,gameRoot,outDir:e.store.artifact(m.game_id,'v1'),policy};
  if(['infra','tamper'].includes(kind))await assert.rejects(()=>docker.run(args),{code:expected});else{const r=await docker.run(args);assert.equal(r.passed,false);assert.equal(r.hard_failures[0].code,expected);}
  assert.equal(removals,1);
});
test('injected real providers still require verified prices; zero-price mocks require explicit test mode',async t=>{
  const provider=new MockProvider();provider.identity='custom-provider/configured-model';
  const e=setup(t,{provider,worker:{qa,mock:false}});await e.factory.create(e.spec);
  assert.equal((await e.worker.runOnce()).code,'pricing_not_verified');assert.equal(provider.calls,0);
  e.worker.mock=true;assert.equal((await e.worker.runOnce()).code,'invalid_mock_provider');assert.equal(provider.calls,0);
});
