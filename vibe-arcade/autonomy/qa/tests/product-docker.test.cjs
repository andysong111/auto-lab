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
const cases={GOOD:[],BAD_SCORE:['product_score_integrity'],BAD_RESULT:['product_replay'],BAD_MOTION:['product_reduced_motion'],BAD_GOAL:['product_objective'],BAD_FEEDBACK:['product_feedback'],DELAYED_MEDIA_GOOD:[],PERMANENT_MEDIA_BAD:['product_reduced_motion'],MULTI_BAD:['product_score_integrity','product_replay','product_reduced_motion','product_objective','product_feedback']};
let index=900;const results=[];
for(const [variant,expected] of Object.entries(cases))test('Docker Chromium product fixture '+variant,{timeout:200000},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'product-source-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));write(root,variant);
 const spec={game_id:'GAME-00000000-'+(++index),generation:1,title:'Infrastructure fixture '+variant,slug:'product-fixture',genre:'fixture',mechanic_family:'fixture-only',controls:['Arrows or Space toggle'],mobile_controls:['Tap a square'],qa:{seed:7,keyboard:{key:'ArrowRight',observation:'state.interactions'},pointer:{observation:'state.interactions'},terminal_ms:16000},product_contract:contract()};
 const manifest=create(spec);atomicJSON(path.join(root,'manifest.json'),manifest);manifest.source_hash=hashTree(root);
 const out=path.join(dir,variant);const result=await qa.run({manifest,gameRoot:root,outDir:out,policy,suite:'product'});
 const codes=[...new Set(result.hard_failures.map(f=>f.code))];results.push({variant,expected,passed:result.passed,codes,duration_ms:result.duration_ms,source_hash:result.source_hash});atomicJSON(path.join(dir,'fixture-results.json'),results);
 assert.equal(result.isolation.network,'none');assert.equal(result.isolation.readonly,true);assert.equal(result.side_effects.length,0,'capture writes / network attempts');
 for(const code of expected)assert(codes.includes(code),variant+' missing '+code+'; actual '+JSON.stringify(codes));
 if(!expected.length)assert.equal(result.passed,true,JSON.stringify(result.hard_failures));else assert.equal(result.passed,false);
 assert.equal(result.seeds.length,6,'all seeds continue despite independent defects');assert(result.checks.some(c=>c.check==='practice_best'),'best test was not short-circuited');
 if(variant==='GOOD'){
  for(const phase of ['entry','playing','midgame','milestone-1','success','failure','mobile-result'])assert(fs.existsSync(path.join(out,'product-390-'+phase+'.png')),phase);
  assert(fs.existsSync(path.join(out,'product-1280-midgame.png')));assert(fs.existsSync(path.join(out,'product-390-gameplay.webm')));assert(fs.existsSync(path.join(out,'artifact-index.json')));
  const technical=await qa.run({manifest:{...manifest,product_contract:undefined},gameRoot:root,outDir:path.join(dir,'TECHNICAL_GOOD'),policy,suite:'technical'});assert.equal(technical.passed,true,JSON.stringify(technical.hard_failures));
  for(const phase of ['entry','playing','midgame'])assert(fs.existsSync(path.join(dir,'TECHNICAL_GOOD','viewport-390-'+phase+'.png')),'common screenshot preserved '+phase);
 }
 if(variant==='MULTI_BAD'){
  const request=requestFor(manifest,result);atomicJSON(path.join(out,'repair-request.json'),request);assert.equal(request.qa_failures.length,result.hard_failures.length);for(const code of expected){const f=request.qa_failures.find(f=>f.code===code);assert(f.expected!==undefined&&f.actual!==undefined&&f.evidence.length);assert(f.selector||f.state_path);}
 }
});
