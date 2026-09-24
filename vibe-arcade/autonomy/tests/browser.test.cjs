'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,fixture,source,policy}=require('./helpers.cjs');
const {WorkspaceBuilder,WorkspaceRepair}=require('../adapters/workspace.cjs');
const {runQA}=require('../qa/runner.cjs');
const {readJSON,atomicJSON}=require('../orchestrator/files.cjs');
const evidence=process.env.FACTORY_EVIDENCE_DIR;
function save(name,environment,m) {
  if(!evidence)return;
  const dest=path.join(evidence,name);fs.mkdirSync(dest,{recursive:true});
  atomicJSON(path.join(dest,'manifest.json'),m);
  const artifactDir=environment.store.artifact(m.game_id,'repair-history.json');
  if(fs.existsSync(artifactDir))fs.copyFileSync(artifactDir,path.join(dest,'repair-history.json'));
  for(let v=1;v<=Number(m.version.slice(1));v++) {
    for(const file of ['qa.json','quality.json','build.json']) {
      const src=environment.store.artifact(m.game_id,`v${v}/${file}`);
      if(fs.existsSync(src)) {fs.mkdirSync(path.join(dest,'v'+v),{recursive:true});fs.copyFileSync(src,path.join(dest,'v'+v,file));}
    }
    const dir=path.dirname(environment.store.artifact(m.game_id,`v${v}/qa.json`));
    if(fs.existsSync(dir))for(const name of fs.readdirSync(dir).filter(f=>f.endsWith('.png'))) {
      fs.mkdirSync(path.join(dest,'v'+v),{recursive:true});fs.copyFileSync(path.join(dir,name),path.join(dest,'v'+v,name));
    }
  }
}
test('real Chromium: successful factory run covers desktop/tablet/mobile and capture lifecycle',async t=>{
  const env=setup(t),{factory,spec}=env;await factory.create(spec);const m=await factory.run(spec.game_id);
  save('successful',env,m);assert.equal(m.state,'RC_READY');
  const qa=readJSON(factory.artifact(m,'qa.json'));assert(qa.passed);assert.equal(qa.browser_cases.length,3);
  for(const c of qa.browser_cases)assert(c.checks.includes('touch')&&c.checks.includes('real_clock')&&c.checks.includes('terminal'));
  assert.equal(qa.side_effects.length,0);assert.equal(qa.console_errors.length,0);
});
test('real Chromium: factory-owned Phaser 4.2.1 presentation runs locally with canonical GameKit simulation',async t=>{
  const phaserSource=path.resolve(__dirname,'../fixtures/phaser'),env=setup(t,{source:phaserSource}),{factory,spec}=env;
  await factory.create(spec);let m=await factory.run(spec.game_id,{stopAfterQA:true});save('phaser4',env,m);
  const qa=readJSON(factory.artifact(m,'qa.json'));assert.equal(qa.passed,true,JSON.stringify(qa.hard_failures));
  m=await factory.run(spec.game_id);assert.equal(m.state,'RC_READY');const root=factory.source(m);
  assert.equal(qa.side_effects.length,0);
  for(const name of ['phaser.js','phaserkit.js','gamekit.js','manifest.json'])assert(fs.existsSync(path.join(root,name)),name);
  assert(fs.statSync(path.join(root,'phaser.js')).size>500000,'local Phaser runtime should be present, not a CDN stub');
  assert.equal(require('../node_modules/phaser/package.json').version,'4.2.1');
});
test('real Chromium: deliberately frozen fixture -> repair request -> actual repaired QA PASS',async t=>{
  const env=setup(t),{factory,root,spec}=env;factory.builder=new WorkspaceBuilder(fixture(root,'broken'));factory.repairer=new WorkspaceRepair([source]);
  await factory.create(spec);const m=await factory.run(spec.game_id);save('repaired',env,m);
  assert.equal(m.state,'RC_READY');assert.equal(m.repair_attempt,1);assert.equal(m.version,'v2');
  const before=readJSON(factory.store.artifact(m.game_id,'v1/qa.json')),after=readJSON(factory.artifact(m,'qa.json'));
  assert(!before.passed&&before.hard_failures.some(f=>f.code==='freeze'));assert(after.passed);
  const history=factory.repairHistory(m);assert.equal(history[0].result,'PASS');assert(history[0].changed_files.includes('core.js'));
});
test('real Chromium: irreparable fixture exhausts exactly five repairs and rejects automatically',async t=>{
  const env=setup(t),{factory,root,spec}=env,broken=fixture(root,'broken');factory.builder=new WorkspaceBuilder(broken);factory.repairer=new WorkspaceRepair(Array(5).fill(broken));
  await factory.create(spec);const m=await factory.run(spec.game_id);save('irreparable',env,m);
  assert.equal(m.state,'REJECTED');assert.equal(m.repair_attempt,5);assert.equal(m.version,'v6');assert.equal(factory.repairHistory(m).length,5);
  for(let n=1;n<=6;n++)assert.equal(readJSON(factory.store.artifact(m.game_id,`v${n}/qa.json`)).passed,false);
});
for(const [kind,code] of [['write','production_side_effect'],['missing','missing_assets'],['no-touch','touch'],['no-keyboard','keyboard'],['runaway','terminal']]) {
  test('real Chromium catches '+kind+' without production side effects',async t=>{
    const env=setup(t,{spec:{max_repair_attempts:0}}),{factory,root,spec}=env;factory.builder=new WorkspaceBuilder(fixture(root,kind));await factory.create(spec);
    const m=await factory.run(spec.game_id),qa=readJSON(factory.artifact(m,'qa.json'));save(kind,env,m);assert.equal(m.state,'REJECTED');assert(qa.hard_failures.some(f=>f.code===code),JSON.stringify(qa.hard_failures));
    if(kind==='write')assert(qa.side_effects.length&&qa.side_effects.every(e=>e.blocked));
  });
}
test('infinite game loop is stopped at process deadline and records timeout evidence',async t=>{
  const env=setup(t,{spec:{max_repair_attempts:0},qa:c=>runQA({...c,timeoutMs:3000})}),{factory,root,spec}=env;factory.builder=new WorkspaceBuilder(fixture(root,'infinite'));await factory.create(spec);
  const started=Date.now(),m=await factory.run(spec.game_id);save('timeout',env,m);assert.equal(m.state,'REJECTED');assert(Date.now()-started<12000);assert.equal(m.failure_reasons[0].code,'timeout');
});
