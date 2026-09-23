'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {setup,MockProvider,output,source,evidence}=require('./helpers.cjs');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {copyGame,atomicJSON,readJSON}=require('../../orchestrator/files.cjs');
const policy=require('../../policies/quality-gate.json');
function isolated(e){const qa=new DockerQA({image:process.env.FACTORY_QA_IMAGE,limits:e.limits.isolation});qa.assertAvailable();e.worker.qa=qa;return qa;}
// Deliberately no skip branch: this suite must fail closed if Docker/isolation is unavailable.
test('container probe: no production secrets, no candidate/root write, no socket, non-root, raw egress blocked',async t=>{
  const e=setup(t),qa=isolated(e),m=await e.factory.create(e.spec),dir=path.join(e.root,m.source_path);copyGame(source,dir);
  process.env.FACTORY_TEST_SECRET='fixture-secret-must-not-cross-boundary';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-only';
  try {const r=await qa.run({manifest:m,gameRoot:dir,outDir:e.store.artifact(m.game_id,'probe'),policy,probe:true});assert(Object.values(r).every(v=>v===true));atomicJSON(e.store.artifact(m.game_id,'probe.json'),r);evidence('isolation-probe',e,r);}
  finally{delete process.env.FACTORY_TEST_SECRET;delete process.env.SUPABASE_SERVICE_ROLE_KEY;}
});
test('AI mock files -> isolated Chromium failure -> compiled targeted repair -> three viewport PASS',async t=>{
  const e=setup(t,{provider:new MockProvider({broken:true})});isolated(e);await e.factory.create(e.spec);
  const r=await e.worker.runOnce();evidence('ai-repair-pass',e,r);assert.equal(r.status,'RC_READY',JSON.stringify(r));const m=e.store.get(e.spec.game_id);
  assert.equal(m.repair_attempt,1);assert.equal(e.provider.submissions,2);
  const before=readJSON(e.store.artifact(m.game_id,'v1/qa.json')),after=readJSON(e.store.artifact(m.game_id,'v2/qa.json'));
  assert(before.hard_failures.some(f=>f.code==='freeze'));assert(after.passed);assert.equal(after.browser_cases.length,3);assert(after.browser_cases.every(c=>c.checks.includes('touch')));assert.equal(after.side_effects.length,0);
  assert.deepEqual(e.provider.requests[1].allowed_paths,['core.js','app.js']);const rr=readJSON(e.store.artifact(m.game_id,'repair-1.json'));assert.equal(e.provider.requests[1].repair_request.operation_id,rr.operation_id);assert.equal(e.provider.requests[1].repair_request.attempt,rr.attempt);assert(!('qa_failures' in e.provider.requests[1].repair_request));
  assert.equal((await e.worker.runOnce()).status,'IDLE');assert.equal(e.provider.calls,2);
});
test('AI mock repair fails five times -> existing Factory REJECTED; exactly six total provider generations',async t=>{
  const e=setup(t,{provider:new MockProvider({permanent:true})});isolated(e);await e.factory.create(e.spec);
  const r=await e.worker.runOnce();evidence('ai-five-repairs-rejected',e,r);assert.equal(r.status,'REJECTED',JSON.stringify(r));const m=e.store.get(e.spec.game_id);
  assert.equal(m.repair_attempt,5);assert.equal(m.version,'v6');assert.equal(e.provider.submissions,6);assert.equal(readJSON(e.store.artifact(m.game_id,'repair-history.json')).length,5);
  assert.equal((await e.worker.runOnce()).status,'IDLE');assert.equal(e.provider.calls,6);
});
test('obfuscated production POST is contained and fatal; never fed to AI repair',async t=>{
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_write');const value=output();value.files.find(f=>f.path==='app.js').content+='\nfetch(["https:","","production.invalid","score"].join("/"),{method:"POST",body:"fixture"}).catch(()=>{});';return {output:value};}});
  const e=setup(t,{provider});isolated(e);await e.factory.create(e.spec);const r=await e.worker.runOnce();evidence('ai-side-effect-rejected',e,r);
  assert.equal(r.status,'REJECTED',JSON.stringify(r));assert.equal(e.provider.calls,1);const qa=readJSON(e.store.artifact(e.spec.game_id,'v1/qa.json'));
  assert(qa.hard_failures.some(f=>f.code==='production_side_effect'));assert(qa.side_effects.length&&qa.side_effects.every(e=>e.blocked));
});
test('runaway candidate is stopped by container deadline and child processes removed',async t=>{
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_loop');const value=output();value.files.find(f=>f.path==='core.js').content=value.files.find(f=>f.path==='core.js').content.replace('s.tick++;','while(true) {} s.tick++;');return {output:value};}});
  const e=setup(t,{provider,spec:{max_repair_attempts:0},limits:{isolation:{timeout_ms:4000}}});isolated(e);await e.factory.create(e.spec);
  const started=Date.now(),r=await e.worker.runOnce();evidence('ai-timeout',e,r);assert.equal(r.status,'REJECTED',JSON.stringify(r));assert(Date.now()-started<20000);
  assert.equal(e.store.get(e.spec.game_id).failure_reasons[0].code,'timeout');
  const containers=spawnSync('docker',['ps','-aq','--filter','name=playjolt-qa-'],{encoding:'utf8'});assert.equal(containers.status,0);assert.equal(containers.stdout.trim(),'');
});
