'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {review,shortest,stageMetrics}=require('../../qa/product-contract.cjs');
const {validateProposal}=require('../spec-gate.cjs');
const proposal=require('./proposal.json'),catalog=require('./layouts.json'),report=require('./oracle-review.json');
test('same-ID depth contract fits unchanged Generic v1 bounds and all states can finish',()=>{
 assert.equal(proposal.game_id,'GAME-20260923-141');assert.equal(proposal.max_repair_attempts,5);assert.equal(validateProposal(proposal).passed,true);
 const {model}=review(proposal.product_contract);assert.equal(Object.keys(model.seeds).length,6);
 for(const g of Object.values(model.seeds)){
  assert.ok(Object.keys(g.nodes).length<=128);
  for(const id of Object.keys(g.nodes))assert.ok(shortest(g,id,n=>n.success),'every reachable state solvable');
  const plan=shortest(g,g.initial,n=>n.success),stages=new Map();
  for(const s of plan)if(!stages.has(g.nodes[s.from].stage))stages.set(g.nodes[s.from].stage,stageMetrics(g,s.from));
  const a=[...stages.values()];assert.deepEqual(a.map(s=>s.complexity),[2,3,4]);
  a.forEach((s,i)=>assert.ok(s.required_actions>=[6,10,14][i]));
  assert.ok(a[0].required_actions<a[1].required_actions&&a[1].required_actions<a[2].required_actions);
  assert.ok(plan.length+18<=64);
 }
});
test('route choices and key-order regret are consequential and later rooms strictly deepen',()=>{
 for(const row of report.seeds){
  const a=row.stages;assert.deepEqual(a.slice(0,2).map(s=>s.consequential_decisions),[3,4]);assert.ok(a[2].consequential_decisions>=5);
  for(const [i,s] of a.entries()){
   assert.ok(s.gates.some(g=>g.without_gate_shortest<s.shortest));
   if(i)assert.ok(Object.keys(s.orders).length>=2&&s.order_gap>=4);
  }
 }
});
function canon(edges){
 const variants=[];
 for(let v=0;v<8;v++){
  const transform=c=>{let x=c%4,y=Math.floor(c/4);if(v&4)x=3-x;for(let i=0;i<(v&3);i++)[x,y]=[3-y,x];return y*4+x;};
  variants.push(JSON.stringify(edges.map(e=>e.slice(0,2).map(transform).sort((a,b)=>a-b)).sort((a,b)=>a[0]-b[0]||a[1]-b[1])));
 }
 return variants.sort()[0];
}
test('six seeds select six genuinely different layouts beyond rotation/mirroring',()=>{
 assert.equal(new Set(report.seeds.map(s=>s.pack)).size,6);
 for(let stage=0;stage<3;stage++){
  assert.equal(new Set(catalog.packs.map(p=>canon(p.rooms[stage].edges))).size,6);
  assert.ok(new Set(catalog.packs.map(p=>JSON.stringify(p.rooms[stage].keys))).size>=5);
  assert.ok(new Set(catalog.packs.map(p=>JSON.stringify(p.rooms[stage].edges.filter(e=>e[2])))).size>=5);
  assert.equal(new Set(catalog.packs.map(p=>JSON.stringify(p.metrics[stage].optimal_inputs))).size,6);
 }
});
test('score probes return to identical objective projection and feedback starts with legal movement',()=>{
 const {model}=review(proposal.product_contract),g=model.seeds['1'];
 for(const seq of [...proposal.product_contract.score.reversible_probes,...proposal.product_contract.score.no_progress_probes]){
  let id=g.initial;for(const action of seq)id=g.nodes[id].edges.find(e=>e.action===action)?.to||id;assert.equal(id,g.initial);
 }
 assert.ok(g.nodes[g.initial].edges.some(e=>e.action===proposal.product_contract.feedback.action));
});
