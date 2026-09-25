'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {buildDefinition,writeCandidate}=require('../../cycle/generate.cjs');
const families=require('../../cycle/families.cjs');
const product=require('../../qa/product-contract.cjs');
const commercial=require('../../qa/commercial/contract.cjs');
const {resolveRequest}=require('../../cycle/resolve.cjs');

function assertReviewBound(built){
  for(const seed of built.productContract.difficulty.deterministic_seeds){
    const g=built.model.seeds[String(seed)],plan=product.shortest(g,g.initial,n=>n.success),seen=new Set();
    assert(plan,'success path missing for seed '+seed);
    let actions=plan.length;
    for(const step of plan){
      const n=g.nodes[step.from];if(seen.has(n.stage))continue;seen.add(n.stage);
      for(const edge of n.edges){
        const back=product.shortest(g,edge.to,node=>node===n);
        assert(back,'unbounded return path at stage '+n.stage+' action '+edge.action);
        actions+=1+back.length;
      }
    }
    assert(actions<=built.productContract.difficulty.max_actions,'branch conformance exceeds max_actions: '+actions);
  }
}

for(const sequence of [1001,1002]){
  test('trusted autonomous family '+sequence+' has bounded reviewed graph and valid contracts',()=>{
    const def=buildDefinition({date:'20260926',sequence});
    const built=families.build(def);
    product.validate(built.productContract);
    commercial.validate(built.commercialContract);
    commercial.semantics(built.commercialContract,built.productContract,built.model);
    assertReviewBound(built);
    for(const graph of Object.values(built.model.seeds)){
      const count=Object.keys(graph.nodes).length;
      assert(count>=3&&count<=128,'oracle node bound: '+count);
    }
    assert.equal(built.proposal.game_id,def.game_id);
    assert.equal(built.proposal.title,def.title);
    assert.equal(built.proposal.max_repair_attempts,5);
  });
}

test('generated candidate package opts into bounded generic autonomous cycle',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const rel='vibe-arcade/autonomy/commissioning/auto-20260926-1001',out=path.join(root,rel);
  const def=buildDefinition({date:'20260926',sequence:1001});
  const request=writeCandidate(out,def);
  assert.equal(request.auto_commission,true);
  assert.equal(request.authorized_provider_calls,6);
  assert.equal(request.estimated_usd_ceiling,2);
  assert.equal(request.production_authorized,false);
  const meta=resolveRequest(root,rel+'/preflight-request.json');
  assert.equal(meta.game_id,def.game_id);
  assert(fs.existsSync(path.join(out,'candidate.json')));
  assert(fs.existsSync(path.join(out,'commission.cjs')));
});
