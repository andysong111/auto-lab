'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const product=require('../../qa/product-contract.cjs'),commercial=require('../../qa/commercial/contract.cjs');
const {SIGNATURES,THEMES,blueprintFor,materialize}=require('../../cycle/intake-generator.cjs');
const {buildModel,proposalFor,stageSpace,targetFor}=require('../../cycle/template-runner.cjs');

test('all trusted intake signatures produce bounded reachable reviewed contracts',()=>{
  assert.equal(THEMES.length,SIGNATURES.length);
  assert.equal(new Set(SIGNATURES.map(x=>x.id)).size,SIGNATURES.length);
  assert.equal(new Set(SIGNATURES.map(x=>x.ops.join(','))).size,SIGNATURES.length);
  for(let sequence=1;sequence<=SIGNATURES.length;sequence++){
    const bp=blueprintFor(sequence,'20260926'),model=buildModel(bp),proposal=proposalFor(bp,model);
    product.validateModel(model);product.validate(proposal.product_contract);commercial.validate(proposal.commercial_contract);
    commercial.semantics(proposal.commercial_contract,proposal.product_contract,model);
    for(const seed of bp.seeds){
      const graph=model.seeds[String(seed)],ids=Object.keys(graph.nodes);
      assert(ids.length<=128,bp.signature_id+' exceeded oracle bound');
      assert(product.shortest(graph,graph.initial,n=>n.success),bp.signature_id+' missing success path');
      const seen=[1,2,3].map(stage=>stageSpace(bp,stage));
      assert.deepEqual(seen.map((x,i)=>new Set(Array.from({length:i+1},(_,a)=>require('../../cycle/template-runner.cjs').applyPrimitive(x.initial,a,bp.ops[a]))).size),[1,2,3]);
      for(let stage=1;stage<=3;stage++){
        const target=targetFor(bp,seed,stage);
        assert.notEqual(target,stageSpace(bp,stage).initial);
        assert.equal(proposal.implementation_contract.difficulty.includes(`\"${seed}\":`),true);
        assert.equal(proposal.implementation_contract.difficulty.includes(`\"${stage}\":\"${target}\"`),true);
      }
    }
    const probe={x:.72,y:.55},actions=proposal.product_contract.actions;
    const nearest=Object.entries(actions).map(([name,spec])=>({name,distance:Math.hypot(probe.x-spec.touch.x,probe.y-spec.touch.y)})).sort((a,b)=>a.distance-b.distance)[0];
    assert.deepEqual(nearest.name,'left');assert(nearest.distance<=.22);
  }
});

test('trusted intake materialization is bounded and production-off',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const meta=materialize(root,1,'20260926'),dir=path.join(root,'candidate');
  assert.equal(meta.branch,'commissioning/auto-20260926-01');
  assert.equal(meta.game_id,'GAME-20260926-301');
  for(const name of ['commission.cjs','blueprint.json','queued-request.json'])assert(fs.existsSync(path.join(dir,name)),name);
  const request=JSON.parse(fs.readFileSync(path.join(dir,'queued-request.json')));
  assert.equal(request.auto_commission,true);
  assert.equal(request.authorized_provider_calls,6);
  assert.equal(request.estimated_usd_ceiling,2);
  assert.equal(request.production_authorized,false);
  assert.match(fs.readFileSync(path.join(dir,'commission.cjs'),'utf8'),/template-runner/);
});

test('trusted intake pool fails closed after reviewed signatures are exhausted',()=>{
  assert.throws(()=>blueprintFor(SIGNATURES.length+1,'20260926'),/trusted_template_pool_exhausted/);
});


test('intake workflow treats draft PR creation as best effort and still dispatches the cycle',()=>{
  const file=path.resolve(__dirname,'../../../../.github/workflows/playjolt-intake-generator.yml');
  const yml=fs.readFileSync(file,'utf8');
  assert.match(yml,/Open draft candidate PR \(best effort\)/);
  assert.match(yml,/continue-on-error:\s*true/);
  const pr=yml.indexOf('Open draft candidate PR (best effort)');
  const dispatch=yml.indexOf('Dispatch bounded autonomous cycle');
  assert(pr>=0&&dispatch>pr,'bounded autonomous cycle must follow best-effort PR creation');
  assert.match(yml,/gh workflow run playjolt-autonomous-cycle\.yml/);
});
