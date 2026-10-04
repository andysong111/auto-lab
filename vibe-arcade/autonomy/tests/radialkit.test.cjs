'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const halo=require('../../lab/taste-calibration/halo-guard-core.js'),radial=require('../gamekit/radialkit.js'),runner=require('../foundry/radial-runner.cjs');

function blueprint(){return {schema:'playjolt-foundry-blueprint/1',runner:'foundry/radial-runner.cjs',family_id:'radial-guarding',golden_baseline_id:'halo-guard-v9',seeds:[...runner.SEEDS],foundry:{golden_baseline_id:'halo-guard-v9'},variation:{id:'halo-world-kit-01',axis:'world-kit',changed_components:['toy-sky-environment-v1']}};}

test('RadialKit preserves exact continuous pointer and keyboard nudge authority',()=>{
  const core=radial.create({id:'halo-guard-v1'}),keyboard=core.create(7),pointer=core.create(7);core.begin(keyboard);core.begin(pointer);
  core.step(keyboard,{actions:{guard_left:true}});core.step(pointer,{pointer:runner.pointFor(Math.PI/2+.36)});
  assert(Math.abs(keyboard.angle-pointer.angle)<1e-12);assert.equal(core.observe(keyboard).quality.reversible_state_key,core.observe(pointer).quality.reversible_state_key);
});

test('Halo Guard reduced-motion preference cannot change canonical outcomes',()=>{
  function simulate(reducedMotion){const state=halo.create(77);halo.begin(state);for(let index=0;index<6000&&!halo.terminal(state);index++){const good=state.items.filter(item=>item.r<6&&!item.done&&!item.bad).sort((a,b)=>a.r-b.r)[0];if(good)halo.setTarget(state,good.currentAngle);const bad=state.items.filter(item=>item.bad&&item.r<5).sort((a,b)=>a.r-b.r)[0];if(!good&&bad)halo.setTarget(state,bad.currentAngle+Math.PI);halo.step(state,1/60,{reducedMotion});}return halo.observe(state);}
  const normal=simulate(false),reduced=simulate(true);for(const key of ['outcome','tick','score','progress','lives','barrier'])assert.equal(normal[key],reduced[key],key);
});

test('radial variation runner proves six golden success/failure traces without Production authority',()=>{
  const proof=runner.buildModel(blueprint());assert.equal(proof.schema,'playjolt-radial-variation-proof/1');assert.equal(Object.keys(proof.seeds).length,6);assert(proof.max_entities<=24);assert.equal(proof.input_parity,'continuous-pointer-and-keyboard-nudge');assert.equal(proof.production_authorized,false);
});

test('radial runner rejects baseline drift and multi-axis variation',()=>{
  const wrong=blueprint();wrong.golden_baseline_id='other';assert.throws(()=>runner.validateBlueprint(wrong),/golden_baseline_required/);
  const broad=blueprint();broad.variation.changed_components.push('halo-feedback-v1');assert.throws(()=>runner.validateBlueprint(broad),/single_axis_variation_required/);
});
