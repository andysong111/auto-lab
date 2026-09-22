'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {validate,review,stageMetrics,shortest}=require('../product-contract.cjs');
const {contract,model}=require('../fixtures/product/generate.cjs');
const {hash}=require('../../orchestrator/files.cjs');
const {create}=require('../../orchestrator/manifest.cjs');
const {requestFor}=require('../../orchestrator/repair.cjs');
const {evaluate}=require('../../orchestrator/quality.cjs');
const {html}=require('../../control-plane/render.cjs');
const fixture=contract();
test('machine contract: strict ten domains, paths, bounds, immutable declarations',()=>{
 assert.equal(validate(fixture),fixture);for(const key of ['objective','progress','score','best','completion','replay','difficulty','mobile','reduced_motion','feedback']){const bad=structuredClone(fixture);delete bad[key];assert.throws(()=>validate(bad),/product_contract/);}
 for(const mutate of [c=>c.best.selector=c.score.selector,c=>c.mobile.min_font_px=8,c=>c.mobile.min_hit_target_px=20,c=>c.difficulty.deterministic_seeds=[7],c=>c.difficulty.complexity_path='state.score',c=>c.difficulty.projection.push('state.hp'),c=>c.difficulty.complexity_path='quality.elapsed',c=>c.feedback.state_change_path='state.__proto__.x',c=>c.reduced_motion.dynamic_change_required=false,c=>c.completion.max_terminal_latency_ms=10000,c=>c.difficulty.adapter_js='evil.js']){const c=structuredClone(fixture);mutate(c);assert.throws(()=>validate(c));}
});
test('reviewed data oracle is pinned and test-only; no candidate JS adapter',()=>{
 assert.throws(()=>review(fixture),/test oracle/);assert(review(fixture,{allowFixture:true}).model);
 const bad=structuredClone(fixture);bad.difficulty.oracle_sha256='0'.repeat(64);assert.throws(()=>review(bad,{allowFixture:true}),/approval missing/);
 const m=model();for(const seed of fixture.difficulty.deterministic_seeds){const g=m.seeds[seed],plan=shortest(g,g.initial,n=>n.success);assert.equal(plan.length,9);const stages=[g.initial,...plan.filter(e=>g.nodes[e.to].stage>g.nodes[e.from].stage&&!g.nodes[e.to].success).map(e=>e.to)].map(id=>stageMetrics(g,id));assert.deepEqual(stages.map(s=>s.complexity),[3,4,5]);assert.deepEqual(stages.map(s=>s.required_actions),[2,3,4]);}assert.equal(hash(m),fixture.difficulty.oracle_sha256);
});
test('repair preserves every independent exact failure and evidence',()=>{
 const m={game_id:'GAME-00000000-901',version:'v1',repair_attempt:0,max_repair_attempts:5,product_contract:fixture};const failures=['score_integrity','replay','reduced_motion','feedback'].map(check=>({code:'product_'+check,message:check,check,selector:'[data-test]',state_path:'state.mask',expected:0,actual:1,evidence:['product/shot.png']}));const request=requestFor(m,{hard_failures:failures});assert.deepEqual(request.qa_failures,failures);assert.deepEqual(request.product_contract,fixture);assert(request.protected_paths.includes('gamekit.js'));assert(request.product_evidence_index);assert.equal(request.attempt,1);
});
test('product contract can never pass with only technical evidence or stale report',()=>{
 const policy=require('../../policies/quality-gate.json'),m={game_id:'GAME-00000000-901',version:'v1',repair_attempt:0,max_repair_attempts:5,controls:['arrows'],mobile_controls:['tap'],mechanic_family:'fixture',source_hash:'a'.repeat(64),product_contract:fixture};
 const qa={game_id:m.game_id,version:'v1',source_hash:m.source_hash,policy_hash:hash(policy),passed:true,hard_failures:[],browser_cases:policy.required_viewports.map(([width,height])=>({viewport:{width,height},checks:policy.required_checks,passed:true}))};
 let gate=evaluate(m,qa,policy);assert.equal(gate.decision,'REPAIR');assert.equal(gate.technical_qa,'PASS');assert.equal(gate.product_qa,'FAIL');assert(gate.hard_failures.some(f=>f.code==='product_stale_evidence'));
 gate=evaluate({...m,repair_attempt:5},qa,policy);assert.equal(gate.decision,'REJECT');
});
test('dashboard separates technical PASS, product FAIL and Factory repairs, escapes evidence',()=>{
 const output=html({counts:{},automation:{},jobs:[{game_id:'test',title:'fixture',state:'REPAIRING',repair_attempt:3,max_repair_attempts:5,technical_qa:{status:'PASS'},product_qa:{status:'FAIL',failures:['score_integrity','<script>']},quality_gate:{status:'REPAIR'},decision:{action:'RESUME_REPAIR'},metrics:{state:'HOLD'}}]});assert(output.includes('Technical QA'));assert(output.includes('Product QA'));assert(output.includes('3 / 5'));assert(output.includes('score_integrity'));assert(!output.includes('<script>'));assert(output.includes('does not establish product quality'));
});
test('default Quality Gate fails closed for a missing product contract',()=>{
 const policy=require('../../policies/quality-gate.json'),m={game_id:'GAME-00000000-901',version:'v1',repair_attempt:0,max_repair_attempts:5,controls:['arrows'],mobile_controls:['tap'],mechanic_family:'fixture',source_hash:'a'.repeat(64)};
 const qa={game_id:m.game_id,version:'v1',source_hash:m.source_hash,policy_hash:hash(policy),passed:true,hard_failures:[],browser_cases:policy.required_viewports.map(([width,height])=>({viewport:{width,height},checks:policy.required_checks,passed:true}))};
 const r=evaluate(m,qa,policy);assert.equal(r.decision,'REPAIR');assert(r.hard_failures.some(f=>f.code==='product_contract_missing'));
});
test('archived terminal candidates remain read-only; quarantined source is statically rejected',()=>{
 const dir=path.join(__dirname,'../../evidence/generic-product-gate/legacy');const report=require('../legacy-readonly.cjs').audit(dir);assert.equal(report.candidate_execution,false);assert.equal(report.provider_calls,0);assert(report.reports.every(r=>r.manifest_unchanged&&r.terminal_state==='REJECTED'&&r.repair_attempt===5&&r.product_qa==='UNVERIFIED'&&r.diagnostic_gate==='REJECT'));assert(report.quarantined.every(q=>q.unchanged&&q.validation.code==='core_dom_dependency'&&q.validation.detail.identifier==='window'));
});
test('real Worker preflight pauses an unreviewed product spec before any reservation or provider call',async t=>{
 const {setup,MockProvider}=require('../../worker/tests/helpers.cjs');const provider=new MockProvider();provider.identity='test-only-real-provider-interface';
 const e=setup(t,{provider,settings:{pricing:{input_per_million:1,output_per_million:1,as_of:new Date().toISOString()}},worker:{mock:false,qa:{assertAvailable(){},run(){throw Error('must not run');}}}});
 await e.factory.create(e.spec);const r=await e.worker.runOnce();assert.equal(r.status,'PAUSED_SPEC');assert.equal(r.code,'product_contract_unreviewed');assert.equal(provider.calls,0);assert(!fs.existsSync(e.manager.file));assert.equal(e.store.get(e.spec.game_id).state,'SPEC_READY');
});
