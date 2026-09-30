'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const product=require('../../qa/product-contract.cjs'),commercial=require('../../qa/commercial/contract.cjs');
const {compile,outcomeFromSummary}=require('../../foundry/learning.cjs');
const {laneFor,learningFocus,select}=require('../../foundry/selector.cjs');
const {foundryBlueprintFor,materialize}=require('../../cycle/intake-generator.cjs');
const foundryRunner=require('../../foundry/family-runner.cjs');
const {validateProposal}=require('../spec-gate.cjs');
const designCatalog=require('../../foundry/design-catalog.json'),benchmarkCatalog=require('../../foundry/benchmark-catalog.json');

function validateReviewedProposal(bp,model,proposal){
  const productRegistry=path.resolve(__dirname,'../../qa/reviewed/registry.json');
  const commercialRegistry=path.resolve(__dirname,'../../qa/commercial/reviewed/registry.json');
  const oracle=path.resolve(__dirname,'../../qa/reviewed',bp.slug+'-oracle-v1.json');
  const productBefore=fs.readFileSync(productRegistry),commercialBefore=fs.readFileSync(commercialRegistry),oracleBefore=fs.existsSync(oracle)?fs.readFileSync(oracle):null;
  try{foundryRunner.installReviewData(bp,model,proposal.product_contract,proposal.commercial_contract);return validateProposal(proposal);}
  finally{
    fs.writeFileSync(productRegistry,productBefore);fs.writeFileSync(commercialRegistry,commercialBefore);
    if(oracleBefore)fs.writeFileSync(oracle,oracleBefore);else fs.rmSync(oracle,{force:true});
  }
}

function assertReversibleScoreProbe(model,contract){
  for(const seed of contract.difficulty.deterministic_seeds){
    const graph=model.seeds[String(seed)],start=graph.initial;
    for(const actions of contract.score.reversible_probes){
      let node=start;
      for(const action of actions){const edge=graph.nodes[node].edges.find(x=>x.action===action);assert(edge,`missing ${action} from ${node}`);node=edge.to;}
      assert.equal(node,start,`score probe must return seed ${seed} to its exact initial Oracle node`);
    }
  }
}

function catalogs(status='reviewed'){
  return {
    designCatalog:{families:[{id:'alpha',status},{id:'beta',status}],designs:[
      {id:'alpha-original',lane:'original',family_id:'alpha',status},
      {id:'beta-market',lane:'market-benchmark',family_id:'beta',status,benchmark_id:'play-top'}
    ]},
    benchmarkCatalog:{captured_at:'2026-09-30',max_age_days:45,policy:{forbidden:['copying']},sources:[{id:'play-top',publisher:'Google Play',url:'https://play.google.com/store/apps/category/GAME',surface:'Top charts',transferable_principles:['clear first choice']}]}
  };
}

test('Foundry schedules exactly one market benchmark in every pair',()=>{
  assert.deepEqual([1,2,3,4,5,6].map(laneFor),['original','market-benchmark','original','market-benchmark','original','market-benchmark']);
});

test('learning profile retires a family after three rejections without RC',()=>{
  const outcomes=Array.from({length:3},(_,i)=>({game_id:'G'+i,family_id:'alpha',lane:'original',state:'REJECTED',technical:'FAIL',product:'FAIL',commercial:'FAIL',failure_codes:{progress:1}}));
  const profile=compile({seed:{outcomes},maxFamilyRejections:3});
  assert.deepEqual(profile.retired_families,['alpha']);
  assert.deepEqual(profile.top_failure_codes,[{code:'progress',count:3}]);
});

test('selector excludes retired, used, unreviewed and stale market work',()=>{
  const {designCatalog,benchmarkCatalog}=catalogs();
  let result=select({sequence:1,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{retired_families:[],used_design_ids:[],families:{}}});
  assert.equal(result.design.id,'alpha-original');assert.equal(result.benchmark,null);
  result=select({sequence:2,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{retired_families:[],used_design_ids:[],families:{}}});
  assert.equal(result.design.id,'beta-market');assert.equal(result.benchmark.publisher,'Google Play');assert(result.copy_policy.forbidden.includes('copying'));
  result=select({sequence:2,date:'2026-12-01',designCatalog,benchmarkCatalog,learningProfile:{retired_families:[],used_design_ids:[],families:{}}});
  assert.equal(result.status,'IDLE');assert.equal(result.reason,'no_fresh_reviewed_market_design');
  result=select({sequence:1,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{retired_families:['alpha'],used_design_ids:[],families:{}}});
  assert.equal(result.status,'IDLE');
});

test('candidate summary becomes bounded learning data with immutable lineage',()=>{
  const row=outcomeFromSummary({schema:'playjolt-auto-template/1',game_id:'GAME-20261001-401',title:'Test',foundry:{family_id:'alpha',lane:'market-benchmark',design_id:'alpha-1'},total_calls:6,total_estimated_cost:.5,factory:{state:'REJECTED',repair_attempt:5,technical_qa_status:'PASS',product_qa_status:'FAIL',commercial_qa_status:'FAIL',failure_reasons:[{code:'progress'},{code:'progress'},{code:'hierarchy'}]}});
  assert.deepEqual({family:row.family_id,lane:row.lane,design:row.design_id,codes:row.failure_codes},{family:'alpha',lane:'market-benchmark',design:'alpha-1',codes:{progress:2,hierarchy:1}});
});

test('recurring bounded failure codes become next-build correction priorities',()=>{
  const focus=learningFocus({top_failure_codes:[{code:'commercial_result_presentation',count:9},{code:'product_difficulty',count:8},{code:'commercial_mobile_hierarchy',count:7},{code:'unknown_untrusted_text',count:99},{code:'commercial_action_feedback',count:5}]});
  assert.deepEqual(focus,['result-presentation','difficulty-progression','mobile-hierarchy','action-feedback']);
});

test('Foundry materializes distinct reviewed original and market families',t=>{
  const learning={retired_families:['permutation-ordering-v1'],used_design_ids:[],families:{},top_failure_codes:[{code:'product_difficulty',count:30},{code:'commercial_result_presentation',count:25}]};
  const original=select({sequence:19,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(original.status,'SELECTED');assert.equal(original.lane,'original');assert.equal(original.design.family_id,'kinetic-balance');
  const obp=foundryBlueprintFor(original,19,'20261001'),om=foundryRunner.buildModel(obp),op=foundryRunner.proposalFor(obp,om);
  product.validateModel(om);product.validate(op.product_contract);commercial.validate(op.commercial_contract);commercial.semantics(op.commercial_contract,op.product_contract,om);assertReversibleScoreProbe(om,op.product_contract);
  assert.equal(validateReviewedProposal(obp,om,op).passed,true);assert.match(op.implementation_contract.difficulty,/Prior Factory outcomes require this correction/);
  const market=select({sequence:20,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[original.design.id]}});
  assert.equal(market.status,'SELECTED');assert.equal(market.lane,'market-benchmark');assert.equal(market.design.family_id,'pressure-allocation');assert.match(market.benchmark.url,/^https:\/\/play\.google\.com\//);
  const mbp=foundryBlueprintFor(market,20,'20261001'),mm=foundryRunner.buildModel(mbp),mp=foundryRunner.proposalFor(mbp,mm);
  product.validateModel(mm);product.validate(mp.product_contract);commercial.validate(mp.commercial_contract);commercial.semantics(mp.commercial_contract,mp.product_contract,mm);assertReversibleScoreProbe(mm,mp.product_contract);
  assert.equal(validateReviewedProposal(mbp,mm,mp).passed,true);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-foundry-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const meta=materialize(root,20,'20261001',market),dir=path.join(root,'candidate');
  assert.equal(meta.lane,'market-benchmark');assert.equal(meta.family_id,'pressure-allocation');assert.match(fs.readFileSync(path.join(dir,'commission.cjs'),'utf8'),/foundry\/family-runner/);
  const request=JSON.parse(fs.readFileSync(path.join(dir,'queued-request.json')));assert.equal(request.production_authorized,false);assert.equal(request.authorized_provider_calls,6);
});

test('workflows learn before generation and preserve serial production-off limits',()=>{
  const intake=fs.readFileSync(path.resolve(__dirname,'../../../../.github/workflows/playjolt-intake-generator.yml'),'utf8');
  const cycle=fs.readFileSync(path.resolve(__dirname,'../../../../.github/workflows/playjolt-autonomous-cycle.yml'),'utf8');
  assert.match(intake,/Compile Factory learning and select the next design lane/);
  assert(intake.indexOf('Compile Factory learning')<intake.indexOf('Materialize trusted candidate'));
  assert.match(intake,/No provider call will be made/);
  assert.match(intake,/steps\.foundry\.outputs\.ready == 'true'/);
  assert.match(intake,/An autonomous candidate is already active; intake remains idle/);
  assert.match(cycle,/playjolt-learning-outcome-/);
  assert.match(cycle,/AUTO_PRODUCTION_SHIP=false/);
  assert.match(cycle,/provider_calls<=/);
  assert.match(cycle,/production=false/);
});
