'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {review,shortest,stageMetrics}=require('../../qa/product-contract.cjs');
const {validateProposal}=require('../spec-gate.cjs');
const proposal=require('./proposal.json');
test('paid preflight: spec/schema/pinned data oracle, six seeds, true choices and path depth',()=>{
 assert.equal(validateProposal(proposal).passed,true);
 const {model,approval}=review(proposal.product_contract);assert.equal(approval.scope,'candidate');
 assert.equal(Object.keys(model.seeds).length,6);
 for(const g of Object.values(model.seeds)){
  assert.equal(Object.keys(g.nodes).length,47);
  const plan=shortest(g,g.initial,n=>n.success),stages=new Map();
  for(const step of plan)if(!stages.has(g.nodes[step.from].stage))stages.set(g.nodes[step.from].stage,stageMetrics(g,step.from));
  assert.deepEqual([...stages.values()].map(s=>[s.complexity,s.required_actions]),[[2,2],[3,4],[4,6]]);
  assert.equal(plan.length,12);
 }
});
test('reviewed seed-one farming probes return without progress and feedback action changes state',()=>{
 const {model}=review(proposal.product_contract),g=model.seeds['1'];
 for(const seq of [...proposal.product_contract.score.reversible_probes,...proposal.product_contract.score.no_progress_probes]){
  let id=g.initial;for(const action of seq)id=g.nodes[id].edges.find(e=>e.action===action)?.to||id;
  assert.equal(id,g.initial);
 }
 assert.ok(g.nodes[g.initial].edges.some(e=>e.action===proposal.product_contract.feedback.action));
});
