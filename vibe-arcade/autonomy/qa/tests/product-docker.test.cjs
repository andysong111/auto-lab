'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {contract,write}=require('../fixtures/product/generate.cjs');
const {create}=require('../../orchestrator/manifest.cjs');
const {hashTree,atomicJSON}=require('../../orchestrator/files.cjs');
const {requestFor}=require('../../orchestrator/repair.cjs');
const policy={...require('../../policies/quality-gate.json'),product:{...require('../../policies/quality-gate.json').product,allow_fixture_oracles:true}};
const dir=process.env.FACTORY_EVIDENCE_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'product-evidence-'));
const qa=new DockerQA({limits:{cpus:1,memory_mb:1024,pids:128,timeout_ms:180000}});qa.assertAvailable();
const cases={GOOD:[],BAD_GOAL_OPACITY:['product_objective'],BAD_DEADTIME:['product_completion'],BAD_TEXT:['product_mobile_readability'],BAD_SCORE:['product_score_integrity'],BAD_RESULT:['product_replay'],BAD_MOTION:['product_reduced_motion'],BAD_GOAL:['product_objective'],BAD_FEEDBACK:['product_feedback'],DELAYED_MEDIA_GOOD:[],PERMANENT_MEDIA_BAD:['product_reduced_motion'],MULTI_BAD:['product_score_integrity','product_replay','product_reduced_motion','product_objective','product_feedback']};
const shard=Number(process.env.PRODUCT_TEST_SHARD||0),shards=Number(process.env.PRODUCT_TEST_SHARDS||1);assert(Number.isInteger(shards)&&shards>=1&&shards<=3&&Number.isInteger(shard)&&shard>=0&&shard<shards);const results=[];
for(const [caseIndex,[variant,expected]] of Object.entries(cases).entries())if(caseIndex%shards===shard)test('Docker Chromium product fixture '+variant,{timeout:200000},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'product-source-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));write(root,variant);
 const spec={game_id:'GAME-00000000-'+(901+caseIndex),generation:1,title:'Infrastructure fixture '+variant,slug:'product-fixture',genre:'fixture',mechanic_family:'fixture-only',controls:['Arrows or Space toggle'],mobile_controls:['Tap a square'],qa:{seed:7,keyboard:{key:'ArrowRight',observation:'state.interactions'},pointer:{observation:'state.pointerActions'},terminal_ms:16000},product_contract:contract()};
 const manifest=create(spec);atomicJSON(path.join(root,'manifest.json'),manifest);manifest.source_hash=hashTree(root);
 const out=path.join(dir,variant);let result,factory,store,current;
 if(variant==='MULTI_BAD'){
  const {Factory}=require('../../orchestrator/engine.cjs'),{FileStore}=require('../../orchestrator/store.cjs');
  store=new FileStore(root);factory=new Factory({store,policy,builder:{build:async({workspace})=>write(workspace,variant)},repairer:{available:()=>false},qa:config=>qa.run(config)});
  await factory.create(spec);current=await factory.run(spec.game_id,{stopAfterQA:true});assert.equal(current.state,'QUALITY_GATE');assert.equal(current.technical_qa_status,'PASS');assert.equal(current.product_qa_status,'FAIL');
  const combined=JSON.parse(fs.readFileSync(store.artifact(spec.game_id,'v1/qa.json')));result=combined.product_qa;fs.mkdirSync(out,{recursive:true});fs.cpSync(path.dirname(store.artifact(spec.game_id,'v1/qa.json')),out,{recursive:true});
 }else result=await qa.run({manifest,gameRoot:root,outDir:out,policy,suite:'product'});
 const codes=[...new Set(result.hard_failures.map(f=>f.code))];results.push({variant,expected,passed:result.passed,codes,duration_ms:result.duration_ms,source_hash:result.source_hash});atomicJSON(path.join(dir,'fixture-results.json'),results);
 assert.equal(result.isolation.network,'none');assert.equal(result.isolation.readonly,true);assert.equal(result.side_effects.length,0,'capture writes / network attempts');
 const expectedCodes=[...expected,...(['BAD_RESULT','MULTI_BAD'].includes(variant)?['product_failure_result']:[]),...(variant==='BAD_DEADTIME'?['product_replay','product_difficulty','product_practice_best']:[])];assert.deepEqual([...codes].sort(),expectedCodes.sort(),variant+' must fail only for its declared independent defect or direct consequence');
 if(!expected.length)assert.equal(result.passed,true,JSON.stringify(result.hard_failures));else assert.equal(result.passed,false);
 if(variant==='BAD_DEADTIME')assert.equal(result.checks.filter(c=>c.check==='difficulty').length,6,'all seeds attempted even when terminal delay fails');else assert.equal(result.seeds.length,6,'all seeds continue despite independent defects');assert(result.checks.some(c=>c.check==='practice_best'),'best test was not short-circuited');
 if(variant==='GOOD'){
  for(const phase of ['entry','playing','midgame','milestone-1','success','failure','mobile-result'])assert(fs.existsSync(path.join(out,'product-390-'+phase+'.png')),phase);
  assert(fs.existsSync(path.join(out,'product-1280-midgame.png')));assert(fs.existsSync(path.join(out,'product-390-gameplay.webm')));assert(fs.existsSync(path.join(out,'artifact-index.json')));
  const technical=await qa.run({manifest:{...manifest,product_contract:undefined},gameRoot:root,outDir:path.join(dir,'TECHNICAL_GOOD'),policy,suite:'technical'});assert.equal(technical.passed,true,JSON.stringify(technical.hard_failures));
  const gate=require('../../orchestrator/quality.cjs').evaluate(manifest,{...technical,passed:result.passed&&technical.passed,technical_qa:technical,product_qa:result},policy);atomicJSON(path.join(out,'quality-gate.json'),gate);assert.equal(gate.decision,'PASS',JSON.stringify(gate.hard_failures));
  for(const phase of ['entry','playing','midgame'])assert(fs.existsSync(path.join(dir,'TECHNICAL_GOOD','viewport-390-'+phase+'.png')),'common screenshot preserved '+phase);
 }
 if(variant==='MULTI_BAD'){
  await assert.rejects(()=>factory.run(spec.game_id),/repair_workspace_unavailable/);assert.equal(store.get(spec.game_id).state,'REPAIR_PENDING');assert.equal(store.get(spec.game_id).repair_attempt,0);
  const request=JSON.parse(fs.readFileSync(store.artifact(spec.game_id,'repair-1.json')));atomicJSON(path.join(out,'repair-request.json'),request);
  const {compile}=require('../../providers/prompts.cjs');const prompt=compile({root,workspace:path.join(root,current.source_path),manifest:{...current,version:'v2'},spec,request,operationId:request.operation_id,budget:{}});atomicJSON(path.join(out,'repair-feedback-summary.json'),{failures:prompt.previous_failures,product:prompt.qa_evidence.product_qa,allowed_paths:prompt.allowed_paths});
  assert.deepEqual(prompt.previous_failures,request.qa_failures);assert(prompt.qa_evidence.product_qa.checks.length>=expected.length);
  const {snapshot}=require('../../control-plane/control.cjs'),{write:dashboard}=require('../../control-plane/render.cjs');dashboard(snapshot({root}),path.join(out,'control-plane'));assert(request.qa_failures.length>=result.hard_failures.length);for(const code of expected){const f=request.qa_failures.find(f=>f.code===code);assert(f.expected!==undefined&&f.actual!==undefined&&f.evidence.length);assert(f.selector||f.state_path);}
 }
});
