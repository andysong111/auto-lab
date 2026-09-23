'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {hash}=require('../../orchestrator/files.cjs');
const p=require('./proposal.json'),request=require('./run-request.json');
const product=require('../../qa/product-contract.cjs').review(p.product_contract);
const commercial=require('../../qa/commercial/contract.cjs').review(p.commercial_contract,p.product_contract);
const gate=require('../spec-gate.cjs').validateProposal(p,{policy:require('./commissioning-policy.json')});
assert.equal(gate.passed,true,JSON.stringify(gate.errors));assert.equal(hash(p),request.proposal_sha256);assert.equal(request.game_id,p.game_id);assert.equal(request.model,'gpt-5.6-terra');assert.equal(request.production_authorized,false);assert.equal(request.max_generations,6);assert.equal(request.user_authorized,true);assert.equal(request.estimated_usd_ceiling,3);
const design=require('./design.cjs').build();assert.equal(hash(design.model),product.approval.sha256);
for(const r of design.rows){assert.ok(r.nodes<=128);assert.deepEqual(r.stages.map(s=>s.complexity),[2,3,4]);assert.ok(r.stages[2].required_actions>r.stages[1].required_actions&&r.stages[1].required_actions>r.stages[0].required_actions);}
console.log(JSON.stringify({commissioning:'PASS',product:'PASS',commercial:'PASS',oracle:product.approval.sha256,commercial_approval:commercial.approval.contract_sha256,production_authorized:false}));
module.exports={gate,product,commercial};
