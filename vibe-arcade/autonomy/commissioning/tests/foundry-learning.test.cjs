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
function assertBuildInvariants(model,proposal){
  const data=proposal.build_invariants,contract=proposal.product_contract;
  assert.equal(data.source,'reviewed-foundry-oracle');
  assert.equal(data.oracle_sha256,contract.difficulty.oracle_sha256);
  assert.deepEqual(data.projection,model.projection);
  assert.deepEqual(data.actions,contract.actions);
  assert.equal(data.lifecycle.replay_selector,contract.replay.selector);
  for(const seed of contract.difficulty.deterministic_seeds){
    const graph=model.seeds[String(seed)],row=data.seeds[String(seed)];
    let node=graph.initial;assert.deepEqual(row.initial_state,graph.nodes[node].values);assert.deepEqual(row.success_states[0],row.initial_state);
    row.success_actions.forEach((action,index)=>{const edge=graph.nodes[node].edges.find(candidate=>candidate.action===action);assert(edge,`missing invariant ${action} from ${node}`);node=edge.to;assert.deepEqual(row.success_states[index+1],graph.nodes[node].values);});
    assert.equal(graph.nodes[node].success,true);assert.deepEqual(row.terminal_state,graph.nodes[node].values);
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

test('blocking input and lifecycle failures cannot be crowded out by polish counts',()=>{
  const focus=learningFocus({top_failure_codes:[{code:'product_difficulty',count:100},{code:'commercial_result_presentation',count:90},{code:'commercial_mobile_hierarchy',count:80},{code:'touch',count:3},{code:'product_completion',count:3},{code:'product_replay',count:3}]});
  assert.deepEqual(focus,['input-parity','lifecycle-integrity','difficulty-progression','result-presentation']);
});

test('bounded learning profile retains lower-ranked blocking failures',()=>{
  const failure_codes={touch:1,product_completion:1};
  for(let index=0;index<13;index++)failure_codes['commercial_noise_'+index]=20-index;
  const profile=compile({seed:{outcomes:[{game_id:'G-blocking',family_id:'alpha',lane:'original',state:'REJECTED',technical:'FAIL',product:'FAIL',commercial:'FAIL',failure_codes}]}});
  assert(profile.top_failure_codes.some(row=>row.code==='touch'));
  assert(profile.top_failure_codes.some(row=>row.code==='product_completion'));
  assert.deepEqual(learningFocus(profile).slice(0,2),['input-parity','lifecycle-integrity']);
});

test('Foundry materializes distinct reviewed original and market families',t=>{
  const learning={retired_families:['permutation-ordering-v1'],used_design_ids:[],families:{},top_failure_codes:[{code:'product_difficulty',count:30},{code:'commercial_result_presentation',count:25},{code:'commercial_mobile_hierarchy',count:20},{code:'commercial_action_feedback',count:18}]};
  const original=select({sequence:19,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(original.status,'SELECTED');assert.equal(original.lane,'original');assert.equal(original.design.family_id,'kinetic-balance');
  const obp=foundryBlueprintFor(original,19,'20261001'),om=foundryRunner.buildModel(obp),op=foundryRunner.proposalFor(obp,om);
  product.validateModel(om);product.validate(op.product_contract);commercial.validate(op.commercial_contract);commercial.semantics(op.commercial_contract,op.product_contract,om);assertReversibleScoreProbe(om,op.product_contract);assertBuildInvariants(om,op);
  const originalGate=validateReviewedProposal(obp,om,op);assert.equal(originalGate.passed,true);assert.deepEqual(originalGate.factory_spec.build_invariants,op.build_invariants);assert.match(op.implementation_contract.difficulty,/Prior Factory outcomes require this correction/);
  const corrupted=structuredClone(op),firstSeed=String(obp.seeds[0]);corrupted.build_invariants.seeds[firstSeed].success_actions[0]='unreviewed_action';
  assert(validateReviewedProposal(obp,om,corrupted).errors.some(error=>error.code==='invalid_build_invariants'));
  const market=select({sequence:20,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[original.design.id]}});
  assert.equal(market.status,'SELECTED');assert.equal(market.lane,'market-benchmark');assert.equal(market.design.family_id,'pressure-allocation');assert.match(market.benchmark.url,/^https:\/\/play\.google\.com\//);
  const mbp=foundryBlueprintFor(market,20,'20261001'),mm=foundryRunner.buildModel(mbp),mp=foundryRunner.proposalFor(mbp,mm);
  product.validateModel(mm);product.validate(mp.product_contract);commercial.validate(mp.commercial_contract);commercial.semantics(mp.commercial_contract,mp.product_contract,mm);assertReversibleScoreProbe(mm,mp.product_contract);assertBuildInvariants(mm,mp);
  assert.equal(validateReviewedProposal(mbp,mm,mp).passed,true);

  const usedPair=[original.design.id,market.design.id];
  const learnedOriginal=select({sequence:21,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:usedPair}});
  assert.equal(learnedOriginal.status,'SELECTED');assert.equal(learnedOriginal.lane,'original');assert.equal(learnedOriginal.design.family_id,'signal-composition');
  const sbp=foundryBlueprintFor(learnedOriginal,21,'20261001'),sm=foundryRunner.buildModel(sbp),sp=foundryRunner.proposalFor(sbp,sm);
  product.validateModel(sm);product.validate(sp.product_contract);commercial.validate(sp.commercial_contract);commercial.semantics(sp.commercial_contract,sp.product_contract,sm);assertReversibleScoreProbe(sm,sp.product_contract);
  assert.equal(validateReviewedProposal(sbp,sm,sp).passed,true);assert.match(sp.implementation_contract.progression,/PULSE A/);assert.match(sp.implementation_contract.action_feedback,/Prior Factory outcomes require this correction/);

  const learnedMarket=select({sequence:22,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...usedPair,learnedOriginal.design.id]}});
  assert.equal(learnedMarket.status,'SELECTED');assert.equal(learnedMarket.lane,'market-benchmark');assert.equal(learnedMarket.design.family_id,'trajectory-interception');assert.match(learnedMarket.benchmark.url,/^https:\/\/play\.google\.com\//);
  const tbp=foundryBlueprintFor(learnedMarket,22,'20261001'),tm=foundryRunner.buildModel(tbp),tp=foundryRunner.proposalFor(tbp,tm);
  product.validateModel(tm);product.validate(tp.product_contract);commercial.validate(tp.commercial_contract);commercial.semantics(tp.commercial_contract,tp.product_contract,tm);assertReversibleScoreProbe(tm,tp.product_contract);
  assert.equal(validateReviewedProposal(tbp,tm,tp).passed,true);assert.match(tp.implementation_contract.progression,/INTERCEPT/);assert.match(tp.implementation_contract.originality,/Forbidden copying/);
  assert.equal(new Set([original,market,learnedOriginal,learnedMarket].map(x=>x.design.family_id)).size,4);

  const learnedPair=[...usedPair,learnedOriginal.design.id,learnedMarket.design.id];
  const nextOriginal=select({sequence:23,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:learnedPair}});
  assert.equal(nextOriginal.status,'SELECTED');assert.equal(nextOriginal.design.family_id,'echo-routing');
  const ebp=foundryBlueprintFor(nextOriginal,23,'20261001'),em=foundryRunner.buildModel(ebp),ep=foundryRunner.proposalFor(ebp,em);
  product.validateModel(em);product.validate(ep.product_contract);commercial.validate(ep.commercial_contract);commercial.semantics(ep.commercial_contract,ep.product_contract,em);assertReversibleScoreProbe(em,ep.product_contract);
  assert.equal(validateReviewedProposal(ebp,em,ep).passed,true);assert.match(ep.implementation_contract.progression,/three-bit switch mask/);

  const nextMarket=select({sequence:24,date:'2026-10-01',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...learnedPair,nextOriginal.design.id]}});
  assert.equal(nextMarket.status,'SELECTED');assert.equal(nextMarket.design.family_id,'cadence-buffering');assert.match(nextMarket.benchmark.url,/^https:\/\/play\.google\.com\//);
  const cbp=foundryBlueprintFor(nextMarket,24,'20261001'),cm=foundryRunner.buildModel(cbp),cp=foundryRunner.proposalFor(cbp,cm);
  product.validateModel(cm);product.validate(cp.product_contract);commercial.validate(cp.commercial_contract);commercial.semantics(cp.commercial_contract,cp.product_contract,cm);assertReversibleScoreProbe(cm,cp.product_contract);
  assert.equal(validateReviewedProposal(cbp,cm,cp).passed,true);assert.match(cp.implementation_contract.progression,/ordered beat buffer/);assert.match(cp.implementation_contract.originality,/Forbidden copying/);

  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-foundry-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const meta=materialize(root,22,'20261001',learnedMarket),dir=path.join(root,'candidate');
  assert.equal(meta.lane,'market-benchmark');assert.equal(meta.family_id,'trajectory-interception');assert.match(fs.readFileSync(path.join(dir,'commission.cjs'),'utf8'),/foundry\/family-runner/);
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
