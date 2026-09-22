'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateProposal}=require('../spec-gate.cjs');
const {solve,overlaps}=require('../../qa/cloud-cargo.cjs');
const proposal=require('../second-real-game/proposal.json'),settings=require('../second-real-game/worker-config.json');
test('second candidate honors latest rejected-family and implementation contract gate',()=>{const r=validateProposal(proposal);assert.equal(r.passed,true);assert.equal(r.warnings.length,0);assert.deepEqual(r.factory_spec.implementation_contract,proposal.implementation_contract);assert.equal(settings.per_game.max_provider_calls,6);assert.equal(settings.per_game.max_estimated_cost,2);assert.equal(settings.release_candidates,false);assert.equal(proposal.max_repair_attempts,5);assert.equal(validateProposal({...proposal,mechanic_family:'spatial-optical-routing'}).passed,false);});
test('independent cargo oracle finds valid allocations and rejects impossible targets',()=>{const cards=[1,2,3,4].map(mass=>({mass,energy:1,bay:-1})),s={stage:0,cards,bays:[{mass:4,energy:null},{mass:6,energy:null}]};const p=solve(s);assert.equal(p.required_assignments,4);const sums=[0,0];p.solution.forEach((b,i)=>sums[b]+=cards[i].mass);assert.deepEqual(sums,[4,6]);assert.throws(()=>solve({...s,bays:[{mass:11,energy:null},{mass:1,energy:null}]}),/no full valid/);});
test('late resource constraint excludes mass-only solutions',()=>{const s={stage:2,cards:[0,0,1,1,2,2].map(energy=>({mass:1,energy,bay:-1})),bays:[{mass:2,energy:0},{mass:2,energy:2},{mass:2,energy:4}]};const p=solve(s);assert(p.mass_solutions>p.full_solutions);assert.equal(p.required_assignments,6);});
test('canvas collision measurement rejects overlapping different labels, preserves repeated shadows',()=>{const a={text:'MASS',left:0,right:30,top:0,bottom:14},b={text:'SCORE',left:5,right:40,top:0,bottom:14};assert.equal(overlaps([a,b]).length,1);assert.equal(overlaps([a,{...a}]).length,0);assert.equal(overlaps([a,{...b,top:20,bottom:34}]).length,0);});

test('core export validation explains the browser-only export and accepts the DOM-independent contract',()=>{
 const {validateOutput}=require('../../providers/output.cjs'),{contract}=require('../../providers/prompts.cjs');
 const req={mode:'repair',empty_workspace:false,allowed_paths:['core.js']},limits={max_response_bytes:10000,max_file_bytes:10000,max_files:2};
 const output=content=>({status:'complete',files:[{path:'core.js',content}],summary:'contract test',tests:[]});
 assert.throws(()=>validateOutput(output('const core={};\nwindow.ExampleCore=core;'),req,limits),e=>e.code==='core_dom_dependency'&&e.message.includes('line 2')&&e.message.includes('globalThis.YourCore'));
 assert.equal(validateOutput(output('const core={}; globalThis.ExampleCore=core;'),req,limits).status,'complete');
 assert.match(contract.files['core.js'],/globalThis/);
 // The same hard gate remains: no relaxation for actual browser access or comments.
 assert.throws(()=>validateOutput(output('/* window */ globalThis.ExampleCore={};'),req,limits),e=>e.code==='core_dom_dependency');
});
