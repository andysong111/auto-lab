'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const halo=require('../../lab/taste-calibration/halo-guard-core.js'),radial=require('../gamekit/radialkit.js'),runner=require('../foundry/radial-runner.cjs');
const product=require('../qa/product-contract.cjs'),commercial=require('../qa/commercial/contract.cjs');
const {GoldenProductBuilder}=require('../adapters/golden-product.cjs');

function blueprint(){return {schema:'playjolt-foundry-blueprint/1',game_id:'GAME-20261005-338',title:'Halo Guard Cloud Caravan',slug:'halo-guard-cloud-caravan',runner:'foundry/radial-runner.cjs',family_id:'radial-guarding',design_id:'radial-guarding-market-01',lane:'market-benchmark',golden_baseline_id:'halo-guard-v9',seeds:[...runner.SEEDS],learning_focus:[],foundry:{schema:'playjolt-foundry-lineage/1',lane:'market-benchmark',family_id:'radial-guarding',design_id:'radial-guarding-market-01',runner:'foundry/radial-runner.cjs',learning_focus:[],golden_baseline_id:'halo-guard-v9'},benchmark:{id:'google-play-cute-3d-arcade-en-20261005',url:'https://play.google.com/store/apps/details?id=com.supercell.clashroyale',transferable_principles:['compact role readability','immediate one-thumb action']},copy_policy:{forbidden:['names','branding','art','rules']},novelty_contract:'Preserve the exact golden radial defense and change only one newly reviewed PlayJolt cloud caravan world kit.',theme:{singular:'Wisp',plural:'Wisps',arena:'Skyway',progress:'RESCUED',success:'SKYWAY SECURED',failure:'CORE OVERRUN'},variation:{id:'cloud-caravan-world-kit-01',axis:'world-kit',changed_components:['cloud-caravan-world-kit-v1']}};}
function productBlueprint(){return {schema:'playjolt-foundry-blueprint/1',game_id:'GAME-20261006-339',title:'Halo Guard',slug:'halo-guard',runner:'foundry/radial-runner.cjs',family_id:'radial-guarding',design_id:'radial-guarding-original-02',lane:'original',golden_baseline_id:'halo-guard-v9',seeds:[...runner.SEEDS],learning_focus:[],foundry:{schema:'playjolt-foundry-lineage/1',lane:'original',family_id:'radial-guarding',design_id:'radial-guarding-original-02',runner:'foundry/radial-runner.cjs',learning_focus:[],golden_baseline_id:'halo-guard-v9'},copy_policy:{forbidden:['names','branding','art','rules']},novelty_contract:'Productize the exact owner-approved PlayJolt Halo Guard V9 mechanic and Three.js presentation as an immutable product shell.',theme:{singular:'Wisp',plural:'Wisps',arena:'Sky Citadel',progress:'RESCUED',success:'SKY CITADEL SECURED',failure:'CORE OVERRUN'},variation:{id:'exact-v9-product-shell-01',axis:'product-shell',changed_components:['halo-guard-v9-product-v1']}};}

test('RadialKit preserves exact continuous pointer and keyboard nudge authority',()=>{
  const core=radial.create({id:'halo-guard-v1'}),keyboard=core.create(7),pointer=core.create(7);core.begin(keyboard);core.begin(pointer);
  core.step(keyboard,{actions:{guard_left:true}});core.step(pointer,{pointer:runner.pointFor(Math.PI/2+.36)});
  assert(Math.abs(keyboard.angle-pointer.angle)<1e-12);assert.equal(core.observe(keyboard).quality.reversible_state_key,core.observe(pointer).quality.reversible_state_key);
});

test('RadialKit feedback key follows accepted target intent instead of per-frame easing',()=>{
  const core=radial.create({id:'halo-guard-v1'}),state=core.create(7);core.begin(state);core.step(state,{actions:{guard_left:true}});
  const key=core.observe(state).quality.reversible_state_key;
  for(let index=0;index<12;index++){core.step(state,{});assert.equal(core.observe(state).quality.reversible_state_key,key);}
});

test('Halo Guard reduced-motion preference cannot change canonical outcomes',()=>{
  function simulate(reducedMotion){const state=halo.create(77);halo.begin(state);for(let index=0;index<6000&&!halo.terminal(state);index++){const good=state.items.filter(item=>item.r<6&&!item.done&&!item.bad).sort((a,b)=>a.r-b.r)[0];if(good)halo.setTarget(state,good.currentAngle);const bad=state.items.filter(item=>item.bad&&item.r<5).sort((a,b)=>a.r-b.r)[0];if(!good&&bad)halo.setTarget(state,bad.currentAngle+Math.PI);halo.step(state,1/60,{reducedMotion});}return halo.observe(state);}
  const normal=simulate(false),reduced=simulate(true);for(const key of ['outcome','tick','score','progress','lives','barrier'])assert.equal(normal[key],reduced[key],key);
});

test('radial variation runner proves six golden success/failure traces without Production authority',()=>{
  const proof=runner.buildModel(blueprint());assert.equal(proof.interaction_mode,'continuous-radial-v1');assert.equal(Object.keys(proof.seeds).length,6);assert(proof.max_entities<=24);assert.equal(proof.input_parity,'continuous-pointer-and-keyboard-nudge');assert.equal(proof.production_authorized,false);
  for(const seed of runner.SEEDS)for(const control of ['pointer','keyboard']){assert.equal(proof.seeds[seed][control].success.outcome,'success');assert.equal(proof.seeds[seed][control].failure.outcome,'failure');assert(proof.seeds[seed][control].success.progress>=6);}
});

test('radial Product and Commercial contracts review the continuous golden interaction',()=>{
  const bp=blueprint(),model=runner.buildModel(bp),proposal=runner.proposalFor(bp,model);
  assert.equal(product.validateModel(model).interaction_mode,'continuous-radial-v1');assert.equal(product.validate(proposal.product_contract).interaction.mode,'continuous-radial-v1');
  assert.equal(commercial.validate(proposal.commercial_contract).review_id,'halo-guard-cloud-caravan-commercial-v1');assert.doesNotThrow(()=>commercial.semantics(proposal.commercial_contract,proposal.product_contract,model));
  assert.equal(proposal.build_invariants.factory_core.golden_baseline_id,'halo-guard-v9');assert.equal(proposal.build_invariants.construction.prepaid_core_proof.input_timing_parity,'continuous_pointer_and_keyboard_nudge');
});

test('radial runner rejects baseline drift and multi-axis variation',()=>{
  const wrong=blueprint();wrong.golden_baseline_id='other';assert.throws(()=>runner.validateBlueprint(wrong),/golden_baseline_required/);
  const broad=blueprint();broad.variation.changed_components.push('halo-feedback-v1');assert.throws(()=>runner.validateBlueprint(broad),/single_axis_variation_required/);
});

test('approved V9 productization is a zero-provider immutable product shell',()=>{
  const bp=productBlueprint(),model=runner.buildModel(bp),proposal=runner.proposalFor(bp,model);
  assert.equal(runner.validateBlueprint(bp),bp);
  assert.deepEqual(proposal.build_invariants.factory_product,{id:'halo-guard-v9-product-v1',source:'autonomy/foundry/golden/halo-guard-v9/product',renderer:'three-webgl',provider_calls:0,repair_attempts:0,production_authorized:false});
  assert.equal(proposal.max_repair_attempts,0);
  assert.equal(proposal.build_invariants.factory_core.golden_baseline_id,'halo-guard-v9');
});

test('approved V9 builder materializes exact Three.js product source and assets',async t=>{
  const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-halo-v9-product-'));t.after(()=>fs.rmSync(workspace,{recursive:true,force:true}));
  const result=await new GoldenProductBuilder('halo-guard-v9-product-v1').build({workspace});
  for(const file of ['index.html','style.css','core.js','app.js','view/art.js','three.core.min.js','three.module.min.js','halo-sky-citadel-bg-v2.png'])assert(fs.existsSync(path.join(workspace,file)),file);
  assert.match(fs.readFileSync(path.join(workspace,'view/art.js'),'utf8'),/THREE\.WebGLRenderer/);
  assert.match(fs.readFileSync(path.join(workspace,'core.js'),'utf8'),/PlayJoltRadialKit/);
  assert.match(result.cause,/without a provider call/);
});
