'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DockerQA}=require('../../isolation/docker-qa.cjs'),{create}=require('../../orchestrator/manifest.cjs'),{hashTree,atomicJSON}=require('../../orchestrator/files.cjs');
const {contract,product,write,variants}=require('../commercial/fixtures/generate.cjs');
const {requestFor}=require('../../orchestrator/repair.cjs');
const policy={...require('../../policies/quality-gate.json'),product:{...require('../../policies/quality-gate.json').product,allow_fixture_oracles:true}};
const qa=new DockerQA({limits:{cpus:1,memory_mb:1024,pids:128,timeout_ms:240000}});qa.assertAvailable();
const dir=process.env.FACTORY_EVIDENCE_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'commercial-evidence-'));
const defects={COMMERCIAL_GOOD:[],BAD_INVISIBLE_TOPOLOGY:['product_route_topology_not_visible'],BAD_TELEPORT:['commercial_action_feedback','commercial_motion'],BAD_FLAT_PROGRESSION:['commercial_progression_spectacle'],BAD_RESULT:['commercial_result_presentation'],BAD_HIERARCHY:['commercial_mobile_hierarchy'],BAD_AUDIO:['commercial_audio'],BAD_MOBILE_DENSITY:['commercial_mobile_density']};
defects.MULTI_COMMERCIAL_BAD=[...new Set(Object.values(defects).flat())];
const shard=Number(process.env.COMMERCIAL_TEST_SHARD||0),shards=Number(process.env.COMMERCIAL_TEST_SHARDS||1);assert(Number.isInteger(shards)&&shards>=1&&shards<=3&&Number.isInteger(shard)&&shard>=0&&shard<shards);const rows=[];
for(const [i,variant] of variants.entries())if(i%shards===shard)test('isolated Commercial '+variant,{timeout:260000},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'commercial-fixture-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));write(root,variant);
 const spec={game_id:'GAME-00000000-'+(950+i),title:'Commercial infrastructure '+variant,slug:'commercial-fixture',genre:'fixture',mechanic_family:'fixture-only',controls:['Arrow switches'],mobile_controls:['Tap a switch'],qa:{seed:7,keyboard:{key:'ArrowRight',observation:'state.interactions'},pointer:{observation:'state.pointerActions'},terminal_ms:16000},product_contract:product,commercial_contract:contract()};
 const m=create(spec);atomicJSON(path.join(root,'manifest.json'),m);m.source_hash=hashTree(root);const out=path.join(dir,variant);
 const q=await qa.run({manifest:m,gameRoot:root,outDir:out,policy,suite:'commercial'}),codes=[...new Set(q.hard_failures.map(f=>f.code))];
 rows.push({variant,passed:q.passed,codes,duration_ms:q.duration_ms,source_hash:q.source_hash});atomicJSON(path.join(dir,'fixture-results.json'),rows);
 assert.equal(q.isolation.network,'none');assert.equal(q.isolation.readonly,true);assert.equal(q.side_effects.length,0);assert.equal(q.source_hash,m.source_hash);
 const expected=defects[variant];assert.equal(q.passed,!expected.length,JSON.stringify(q.hard_failures));for(const code of expected)assert(codes.includes(code),JSON.stringify({missing:code,failures:q.hard_failures}));
 // Secondary aggregate review failure is expected for a visual defect. No unrelated categories may regress.
 const allowed=new Set([...expected,...(expected.some(x=>x!=='commercial_audio')?['commercial_visual_review']:[])]);if(variant!=='MULTI_COMMERCIAL_BAD')assert(codes.every(c=>allowed.has(c)),JSON.stringify(q.hard_failures));
 assert(q.checks.some(c=>c.check==='performance'),'independent checks complete after defects');assert(q.evidence_complete,'all seven phases captured');
 if(variant==='COMMERCIAL_GOOD'){
  assert.equal(q.checks.find(c=>c.check==='audio'&&c.event==='success').actual.starts,1,'only the final success cue can satisfy success audio');
  assert(q.checks.find(c=>c.check==='audio'&&c.event==='mute').actual.peak_voices>=1,'mute exercised after a sound was active');
  assert(q.checks.filter(c=>c.check==='reduced_motion').every(c=>c.status==='PASS'));assert(q.checks.some(c=>c.viewport.width===1280));assert.equal(q.visual_review.aesthetics,'UNVERIFIED');
  const technical=await qa.run({manifest:m,gameRoot:root,outDir:path.join(out,'technical'),policy,suite:'technical'}),prod=await qa.run({manifest:m,gameRoot:root,outDir:path.join(out,'product'),policy,suite:'product'});
  const gate=require('../../orchestrator/quality.cjs').evaluate(m,{...technical,passed:technical.passed&&prod.passed&&q.passed,technical_qa:technical,product_qa:prod,commercial_qa:q},policy);atomicJSON(path.join(out,'quality-gate.json'),gate);assert.equal(gate.decision,'PASS',JSON.stringify(gate.hard_failures));
 }
 if(variant==='MULTI_COMMERCIAL_BAD'){
  const request=requestFor(m,{hard_failures:q.hard_failures});atomicJSON(path.join(out,'repair-request.json'),request);assert.deepEqual(request.qa_failures,q.hard_failures);for(const code of expected){const f=request.qa_failures.find(f=>f.code===code);assert(f.expected!==undefined&&f.actual!==undefined);assert(f.viewport);assert(f.evidence.length);}
  assert(q.checks.filter(c=>c.check==='audio'&&c.status==='FAIL').length>=3,'audio defects independently collected');
  const {html}=require('../../control-plane/render.cjs');fs.writeFileSync(path.join(out,'control-plane.html'),html({counts:{QA_FAILED:1},automation:{can_create:false},jobs:[{...m,state:'QA_FAILED',technical_qa:{status:'PASS'},product_qa:{status:'PASS'},commercial_polish:{status:'FAIL',failures:codes},quality_gate:{status:'FAIL'},decision:{action:'RESUME_REPAIR'},metrics:{state:'DISABLED'}}]}));
 }
});
