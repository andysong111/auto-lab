'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {setup,mockQA,source,atomicJSON}=require('./helpers.cjs');
const {WorkspaceBuilder,WorkspaceRepair}=require('../adapters/workspace.cjs');
const {ProviderPause}=require('../providers/errors.cjs');
test('successful run is idempotent and resumption skips already verified build/QA',async t=>{
  let builds=0,runs=0;const original=new WorkspaceBuilder(source);
  const {factory,store,spec}=setup(t,{builder:{build:async c=>{builds++;return original.build(c);}},qa:async c=>{runs++;return mockQA(c);}});
  await factory.create(spec);let result=await factory.run(spec.game_id);assert.equal(result.state,'RC_READY');
  assert.deepEqual(await factory.create(spec),result);assert.deepEqual(await factory.run(spec.game_id),result);assert.equal(builds,1);assert.equal(runs,1);
  await assert.rejects(()=>factory.create({...spec,title:'Changed'}),/different_spec/);
  fs.appendFileSync(factory.source(result)+'/core.js','\n// unauthorized change');result=await factory.run(spec.game_id);assert.equal(result.state,'REJECTED');assert.equal(result.failure_reasons[0].code,'source_tampered');
});
test('exactly five failed repairs -> REJECTED, with one history entry per attempt',async t=>{
  let qaCalls=0,repairs=0;const adapter=new WorkspaceRepair(Array(5).fill(source));
  const {factory,spec}=setup(t,{repairer:{repair:async c=>{repairs++;return adapter.repair(c);}},qa:async c=>{qaCalls++;return {...await mockQA(c),passed:false,hard_failures:[{code:'freeze',message:'injected QA contract failure'}]};}});
  await factory.create(spec);const m=await factory.run(spec.game_id);assert.equal(m.state,'REJECTED');assert.equal(m.repair_attempt,5);assert.equal(m.version,'v6');assert.equal(repairs,5);assert.equal(qaCalls,6);assert.equal(factory.repairHistory(m).length,5);
  await factory.run(spec.game_id);assert.equal(repairs,5);
});
test('fatal protected-scope failure rejects without calling repair',async t=>{
  const {factory,spec}=setup(t,{builder:{build:async()=>{throw Error('path_isolation');}},repairer:{repair:async()=>{throw Error('must not run');}}});
  await factory.create(spec);const m=await factory.run(spec.game_id);assert.equal(m.state,'REJECTED');assert.equal(m.repair_attempt,0);
});
test('crash after build checkpoint resumes without rebuilding',async t=>{
  let builds=0;const orig=new WorkspaceBuilder(source),{factory,store,spec}=setup(t,{builder:{build:async c=>{builds++;return orig.build(c);}},qa:mockQA});
  await factory.create(spec);let m=factory.move(store.get(spec.game_id),'BUILDING');await factory.build(m);
  const result=await factory.run(spec.game_id);assert.equal(result.state,'RC_READY');assert.equal(builds,1);
});
test('crash during repair reuses attempt and operation id, never resets repair budget',async t=>{
  let first=true;const {factory,store,spec}=setup(t,{repairer:new WorkspaceRepair([source]),qa:async c=>first?(first=false,{...await mockQA(c),passed:false,hard_failures:[{code:'freeze',message:'first QA fails'}]}):mockQA(c)});
  await factory.create(spec);await factory.run(spec.game_id,{stopAfterQA:true});
  const {requestFor}=require('../orchestrator/repair.cjs');let m=store.get(spec.game_id),r=requestFor(m,{hard_failures:m.failure_reasons});
  atomicJSON(store.artifact(m.game_id,'repair-1.json'),r);m=factory.move(m,'REPAIR_PENDING');m=factory.move(m,'REPAIRING',{repair_attempt:1,version:'v2',source_path:`autonomy/games/${m.game_id}/v2`});
  await factory.build(m,r);const end=await factory.run(m.game_id);assert.equal(end.state,'RC_READY');assert.equal(end.repair_attempt,1);
});
test('dead process lock recovers; live and remote host locks remain protected',async t=>{
  const {root,store,spec,factory}=setup(t,{qa:mockQA});await factory.create(spec);
  const file=path.join(root,'autonomy/.locks/'+spec.game_id+'.json');
  atomicJSON(file,{pid:2147483647,host:os.hostname(),token:'crashed'});assert.equal((await factory.run(spec.game_id)).state,'RC_READY');
  atomicJSON(file,{pid:process.pid,host:os.hostname(),token:'active'});await assert.rejects(()=>factory.run(spec.game_id),/job_locked/);
  atomicJSON(file,{pid:2147483647,host:'different-host',token:'remote'});await assert.rejects(()=>factory.run(spec.game_id),/job_locked/);
});

test('missing repair revision remains pending and consumes no repair budget',async t=>{
  const {factory,spec}=setup(t,{repairer:new WorkspaceRepair([]),qa:async c=>({...await mockQA(c),passed:false,hard_failures:[{code:'freeze',message:'broken fixture'}]})});
  await factory.create(spec);await assert.rejects(()=>factory.run(spec.game_id),/repair_workspace_unavailable/);
  const m=factory.store.get(spec.game_id);assert.equal(m.state,'REPAIR_PENDING');assert.equal(m.repair_attempt,0);assert.equal(factory.repairHistory(m).length,0);
});
test('published build descriptor satisfies the shared manifest schema',async t=>{
  const {factory,spec}=setup(t,{qa:mockQA});await factory.create(spec);const m=await factory.run(spec.game_id);
  const descriptor=JSON.parse(fs.readFileSync(path.join(factory.source(m),'manifest.json')));
  require('../orchestrator/manifest.cjs').validate(descriptor);assert.equal(descriptor.version,m.version);assert(!descriptor.source_hash);
});

test('trusted repair infrastructure pause retries the same attempt instead of consuming the next budget slot',async t=>{
  let first=true,repairs=0;
  const {factory,store,spec}=setup(t,{
    repairer:{repair:async()=>{repairs++;throw new ProviderPause('provider_context_compilation_failed','trusted compiler fault','PAUSED_ERROR');}},
    qa:async c=>first?(first=false,{...await mockQA(c),passed:false,hard_failures:[{code:'freeze',message:'initial QA failure'}]}):mockQA(c)
  });
  await factory.create(spec);
  await assert.rejects(()=>factory.run(spec.game_id),e=>e.factory_pause===true&&e.code==='provider_context_compilation_failed');
  let m=store.get(spec.game_id);
  assert.equal(m.state,'REPAIRING');assert.equal(m.repair_attempt,1);assert.equal(m.version,'v2');assert.equal(repairs,1);
  assert(fs.existsSync(store.artifact(m.game_id,'repair-1.json')));assert(!fs.existsSync(store.artifact(m.game_id,'repair-2.json')));
  await assert.rejects(()=>factory.run(spec.game_id),e=>e.factory_pause===true&&e.code==='provider_context_compilation_failed');
  m=store.get(spec.game_id);
  assert.equal(m.state,'REPAIRING');assert.equal(m.repair_attempt,1);assert.equal(m.version,'v2');assert.equal(repairs,2);
  assert(!fs.existsSync(store.artifact(m.game_id,'repair-2.json')));
});
