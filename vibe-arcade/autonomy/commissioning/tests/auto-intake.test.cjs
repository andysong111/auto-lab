'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {buildDefinition,writeCandidate}=require('../../cycle/generate.cjs');
const families=require('../../cycle/families.cjs');
const product=require('../../qa/product-contract.cjs');
const commercial=require('../../qa/commercial/contract.cjs');
const {resolveRequest}=require('../../cycle/resolve.cjs');

for(const sequence of [1001,1002]){
  test('trusted autonomous family '+sequence+' has bounded reviewed graph and valid contracts',()=>{
    const def=buildDefinition({date:'20260926',sequence});
    const built=families.build(def);
    product.validate(built.productContract);
    commercial.validate(built.commercialContract);
    commercial.semantics(built.commercialContract,built.productContract,built.model);
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
