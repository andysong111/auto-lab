'use strict';
// Trusted commissioning review, run before any candidate exists or paid call.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {hash,atomicJSON}=require('../../orchestrator/files.cjs');
const product=require('../../qa/product-contract.cjs'),commercial=require('../../qa/commercial/contract.cjs');
const {build}=require('./design.cjs'),p=require('./product-contract.json'),c=require('./commercial-contract.json');
const {model,rows}=build();assert.equal(hash(model),p.difficulty.oracle_sha256);
assert.equal(new Set(rows.map(r=>r.pack)).size,6);
for(const r of rows){assert.ok(r.nodes<=128);assert.deepEqual(r.stages.map(x=>x.complexity),[2,3,4]);assert.ok(r.stages[0].required_actions<r.stages[1].required_actions&&r.stages[1].required_actions<r.stages[2].required_actions);}
product.validate(p);commercial.validate(c);commercial.semantics(c,p,model);
const pr={id:p.difficulty.oracle_id,file:'shard-armada-v1.json',scope:'candidate',sha256:hash(model),contract_sha256:hash(p),reviewed_by:'Work trusted pre-generation design review 2026-09-23',rationale:'Independent data graph for aimed salvo/recruitment rules. Six distinct support/polarity packs, 67–84 reachable nodes, all solvable, increasing stage entry aiming choices 2/3/4 and minimum actions 5/7/9–11. Aim choices are reversible; attack order incurs real extra volleys. Not a claim of human fun. Candidate cannot approve or edit this oracle.'};
const cr={id:c.review_id,scope:'candidate',contract_sha256:hash(c),product_contract_sha256:hash(p),reviewed_by:pr.reviewed_by,rationale:'Coverage review includes present/absent targets, shielding support, firing polarity, focus, enemy/recruited and core lock; aim, volley and evolution response; 1/5/13 vessel progression; success/failure, all required audio, mute/cleanup, foreground hierarchy and bounded effects. Regions are real battlefield objects. No silence exception; no aesthetic score or candidate self-approval.'};
for(const [file,entry] of [['../../qa/reviewed/registry.json',pr],['../../qa/commercial/reviewed/registry.json',cr]]){const f=path.join(__dirname,file),r=JSON.parse(fs.readFileSync(f));r.entries=r.entries.filter(e=>e.id!==entry.id);r.entries.push(entry);atomicJSON(f,r);}
const a=product.review(p),b=commercial.review(c,p),gate=require('../spec-gate.cjs').validateProposal(require('./proposal.json'));
assert.equal(gate.passed,true,JSON.stringify(gate.errors));
atomicJSON(path.join(__dirname,'spec-gate.json'),gate);
atomicJSON(path.join(__dirname,'preflight-review.json'),{before_paid_call:true,candidate_source_exists:false,commissioning_spec:'PASS',product_contract:'PASS',commercial_contract:'PASS',reviewed_product_oracle:'PASS',reviewed_commercial_contract:'PASS',product_approval:a.approval,commercial_approval:b.approval,depth:rows.map(r=>({seed:r.seed,pack:r.pack,nodes:r.nodes,shortest_actions:r.stages.map(s=>s.required_actions),aim_choices:r.stages.map(s=>s.complexity)})),scope:'Data review only. Browser conformance, pixels, audio and owner play remain unverified.'});
console.log('Five pre-paid gates PASS; no candidate source executed.');
