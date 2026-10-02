'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const product=require('../../qa/product-contract.cjs'),commercial=require('../../qa/commercial/contract.cjs');
const {compile,outcomeFromSummary}=require('../../foundry/learning.cjs');
const {laneFor,learningFocus,select}=require('../../foundry/selector.cjs');
const {foundryBlueprintFor,materialize}=require('../../cycle/intake-generator.cjs');
const foundryRunner=require('../../foundry/family-runner.cjs');
const arcadeRunner=require('../../foundry/arcade-runner.cjs');
const reflexRunner=require('../../foundry/reflex-runner.cjs');
const reflexKit=require('../../gamekit/reflexkit.js');
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
  assert.equal(data.construction.input_source,'input.actions');
  assert.deepEqual(data.construction.action_expressions,Object.keys(contract.actions).map(name=>'input.actions.'+name));
  assert.equal(data.construction.complexity_source,'quality_checkpoints.complexity');
  assert.equal(data.construction.replay_owner,'PlayJoltGameKit');
  for(const seed of contract.difficulty.deterministic_seeds){
    const graph=model.seeds[String(seed)],row=data.seeds[String(seed)];
    let node=graph.initial;assert.deepEqual(row.initial_state,graph.nodes[node].values);assert.deepEqual(row.success_states[0],row.initial_state);
    row.success_actions.forEach((action,index)=>{const edge=graph.nodes[node].edges.find(candidate=>candidate.action===action);assert(edge,`missing invariant ${action} from ${node}`);node=edge.to;assert.deepEqual(row.success_states[index+1],graph.nodes[node].values);});
    assert.equal(graph.nodes[node].success,true);assert.deepEqual(row.terminal_state,graph.nodes[node].values);
    assert.deepEqual(row.preterminal_state,row.success_states.at(-2));assert.equal(row.terminal_action,row.success_actions.at(-1));
    assert.deepEqual(row.quality_checkpoints.map(checkpoint=>checkpoint.stage),[1,2,3]);
    for(const checkpoint of row.quality_checkpoints){
      const checkpointNode=Object.keys(graph.nodes).find(id=>JSON.stringify(graph.nodes[id].values)===JSON.stringify(checkpoint.state));
      const metrics=product.stageMetrics(graph,checkpointNode);
      assert.deepEqual(checkpoint,{state:checkpoint.state,stage:metrics.stage,complexity:metrics.complexity,required_actions:metrics.required_actions});
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

test('selector retires the repeated calibration runner after sequence 28',()=>{
  const {designCatalog,benchmarkCatalog}=catalogs();
  designCatalog.policy={legacy_family_runner_max_sequence:28};
  designCatalog.designs[0].min_sequence=29;
  const result=select({sequence:29,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{retired_families:[],used_design_ids:[],families:{}}});
  assert.equal(result.status,'IDLE');
  assert.equal(result.reason,'new_interaction_runner_required');
});

test('intake accepts only a repository-reviewed Foundry runner path',()=>{
  const {designCatalog,benchmarkCatalog}=catalogs(),learningProfile={retired_families:[],used_design_ids:[],families:{}};
  const selected=select({sequence:1,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile});
  selected.design={...selected.design,runner:'../untrusted.cjs'};
  assert.throws(()=>foundryBlueprintFor(selected,1,'20261002'),/invalid_foundry_runner/);
});

test('sequence 29 selects a reviewed direct-play runner with increasing lane complexity',()=>{
  const used=designCatalog.designs.filter(design=>design.id!=='comet-catching-original-01').map(design=>design.id);
  const learning={retired_families:['permutation-ordering-v1'],used_design_ids:used,families:{},top_failure_codes:[{code:'commercial_action_feedback',count:20}]};
  const selected=select({sequence:29,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(selected.status,'SELECTED');assert.equal(selected.design.family_id,'comet-catching');assert.equal(selected.design.runner,'foundry/arcade-runner.cjs');
  const bp=foundryBlueprintFor(selected,29,'20261002'),model=arcadeRunner.buildModel(bp),proposal=foundryRunner.proposalFor(bp,model);
  assert.equal(bp.game_id,'GAME-20261002-329');assert.equal(bp.title,'Comet Breaker');assert.match(proposal.genre,/direct-control/);assert.match(proposal.implementation_contract.first_ten_seconds,/descending comet/);
  assert.deepEqual(Object.keys(proposal.product_contract.actions),['drift_left','drift_right','burst_shift','phase_cut']);
  assert.equal(Object.hasOwn(proposal.product_contract.actions,'catch_comet'),false);
  product.validateModel(model);product.validate(proposal.product_contract);commercial.validate(proposal.commercial_contract);commercial.semantics(proposal.commercial_contract,proposal.product_contract,model);assertReversibleScoreProbe(model,proposal.product_contract);assertBuildInvariants(model,proposal);
  assert.equal(validateReviewedProposal(bp,model,proposal).passed,true);
  for(const seed of bp.seeds){const graph=model.seeds[String(seed)],rows=proposal.build_invariants.seeds[String(seed)].quality_checkpoints;assert.deepEqual(rows.map(row=>row.complexity),[2,3,4]);assert(graph.nodes[graph.initial].edges.some(edge=>edge.action==='drift_right'));}
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-arcade-intake-'));try{const meta=materialize(root,29,'20261002',selected),commission=fs.readFileSync(path.join(root,'candidate','commission.cjs'),'utf8');assert.equal(meta.family_id,'comet-catching');assert.match(commission,/foundry\/arcade-runner/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('sequence 30 selects the protected timed reflex runner with honest action depth',()=>{
  const used=designCatalog.designs.filter(design=>design.id!=='threat-parry-market-01').map(design=>design.id);
  const learning={retired_families:['permutation-ordering-v1'],used_design_ids:used,families:{},top_failure_codes:[{code:'touch',count:30},{code:'commercial_action_feedback',count:28}]};
  const selected=select({sequence:30,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(selected.status,'SELECTED');assert.equal(selected.design.family_id,'threat-parry');assert.equal(selected.design.runner,'foundry/reflex-runner.cjs');assert.equal(selected.lane,'market-benchmark');
  const bp=foundryBlueprintFor(selected,30,'20261002'),model=reflexRunner.buildModel(bp),proposal=foundryRunner.proposalFor(bp,model);
  assert.equal(bp.game_id,'GAME-20261002-330');assert.equal(bp.title,'Signal Bastion');assert.match(proposal.genre,/reflex defense/);
  assert.deepEqual(Object.keys(proposal.product_contract.actions),['parry_left','parry_right','parry_up','parry_down']);
  assert.equal(proposal.build_invariants.factory_core.runtime,'reflexkit-2');assert.equal(proposal.build_invariants.factory_core.required_script,'./reflexkit.js');
  assert.equal(proposal.build_invariants.factory_core.core_source,"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'threat-parry-v1'});\n");
  product.validateModel(model);product.validate(proposal.product_contract);commercial.validate(proposal.commercial_contract);commercial.semantics(proposal.commercial_contract,proposal.product_contract,model);assertBuildInvariants(model,proposal);
  assert.equal(validateReviewedProposal(bp,model,proposal).passed,true);
  for(const seed of bp.seeds){
    const invariant=proposal.build_invariants.seeds[String(seed)],rows=invariant.quality_checkpoints,core=reflexKit.create({id:'threat-parry-v1'}),state=core.create(seed),project=()=>model.projection.map(key=>product.at({state},key));
    assert.deepEqual(rows.map(row=>row.complexity),[2,3,4]);assert.deepEqual(rows.map(row=>row.required_actions),[2,4,6]);
    assert.equal(invariant.success_actions.length,12);assert.deepEqual(project(),invariant.success_states[0]);
    invariant.success_actions.forEach((action,index)=>{core.step(state,{actions:{[action]:true}});assert.deepEqual(project(),invariant.success_states[index+1]);});
    assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
  }
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-reflex-intake-'));try{const meta=materialize(root,30,'20261002',selected),commission=fs.readFileSync(path.join(root,'candidate','commission.cjs'),'utf8');assert.equal(meta.family_id,'threat-parry');assert.match(commission,/foundry\/reflex-runner/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('sequence 31 selects a distinct protected rift-threading action design',()=>{
  const used=designCatalog.designs.filter(design=>design.id!=='rift-threading-original-01').map(design=>design.id);
  const learning={retired_families:['permutation-ordering-v1'],used_design_ids:used,families:{'threat-parry':{attempts:1,rejected:1,rc_ready:0}},top_failure_codes:[{code:'build_failed',count:6},{code:'commercial_action_feedback',count:28}]};
  const selected=select({sequence:31,date:'2026-10-03',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(selected.status,'SELECTED');assert.equal(selected.design.family_id,'rift-threading');assert.equal(selected.design.runner,'foundry/reflex-runner.cjs');assert.equal(selected.lane,'original');
  const bp=foundryBlueprintFor(selected,31,'20261003'),model=reflexRunner.buildModel(bp),proposal=foundryRunner.proposalFor(bp,model);
  assert.equal(bp.game_id,'GAME-20261003-331');assert.equal(bp.title,'Rift Skimmer');assert.match(proposal.genre,/lane-threading action/);
  assert.deepEqual(Object.keys(proposal.product_contract.actions),['shift_left','shift_right','dash_left','dash_right','surge']);
  assert.equal(proposal.build_invariants.factory_core.runtime,'reflexkit-2');assert.equal(proposal.build_invariants.factory_core.required_script,'./reflexkit.js');
  assert.equal(proposal.build_invariants.factory_core.core_source,"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'rift-thread-v1'});\n");
  product.validateModel(model);product.validate(proposal.product_contract);commercial.validate(proposal.commercial_contract);commercial.semantics(proposal.commercial_contract,proposal.product_contract,model);assertBuildInvariants(model,proposal);
  assert.equal(validateReviewedProposal(bp,model,proposal).passed,true);
  for(const seed of bp.seeds){
    const invariant=proposal.build_invariants.seeds[String(seed)],rows=invariant.quality_checkpoints,core=reflexKit.create({id:'rift-thread-v1'}),state=core.create(seed),project=()=>model.projection.map(key=>product.at({state},key));
    assert.deepEqual(rows.map(row=>row.complexity),[2,3,4]);assert.equal(invariant.success_actions.filter(action=>action==='surge').length,9);
    assert.deepEqual(project(),invariant.success_states[0]);
    invariant.success_actions.forEach((action,index)=>{core.step(state,{actions:{[action]:true}});assert.deepEqual(project(),invariant.success_states[index+1]);});
    assert.equal(state.outcome,'success');assert.equal(core.terminal(state),true);
  }
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-rift-intake-'));try{const meta=materialize(root,31,'20261003',selected),commission=fs.readFileSync(path.join(root,'candidate','commission.cjs'),'utf8');assert.equal(meta.family_id,'rift-threading');assert.match(commission,/foundry\/reflex-runner/);}finally{fs.rmSync(root,{recursive:true,force:true});}
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
  const original=select({sequence:19,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:learning});
  assert.equal(original.status,'SELECTED');assert.equal(original.lane,'original');assert.equal(original.design.family_id,'kinetic-balance');
  const obp=foundryBlueprintFor(original,19,'20261001'),om=foundryRunner.buildModel(obp),op=foundryRunner.proposalFor(obp,om);
  product.validateModel(om);product.validate(op.product_contract);commercial.validate(op.commercial_contract);commercial.semantics(op.commercial_contract,op.product_contract,om);assertReversibleScoreProbe(om,op.product_contract);assertBuildInvariants(om,op);
  const originalGate=validateReviewedProposal(obp,om,op);assert.equal(originalGate.passed,true);assert.deepEqual(originalGate.factory_spec.build_invariants,op.build_invariants);assert.match(op.implementation_contract.difficulty,/Prior Factory outcomes require this correction/);
  const corrupted=structuredClone(op),firstSeed=String(obp.seeds[0]);corrupted.build_invariants.seeds[firstSeed].success_actions[0]='unreviewed_action';
  assert(validateReviewedProposal(obp,om,corrupted).errors.some(error=>error.code==='invalid_build_invariants'));
  const market=select({sequence:20,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[original.design.id]}});
  assert.equal(market.status,'SELECTED');assert.equal(market.lane,'market-benchmark');assert.equal(market.design.family_id,'pressure-allocation');assert.match(market.benchmark.url,/^https:\/\/play\.google\.com\//);
  const mbp=foundryBlueprintFor(market,20,'20261001'),mm=foundryRunner.buildModel(mbp),mp=foundryRunner.proposalFor(mbp,mm);
  product.validateModel(mm);product.validate(mp.product_contract);commercial.validate(mp.commercial_contract);commercial.semantics(mp.commercial_contract,mp.product_contract,mm);assertReversibleScoreProbe(mm,mp.product_contract);assertBuildInvariants(mm,mp);
  assert.equal(validateReviewedProposal(mbp,mm,mp).passed,true);

  const usedPair=[original.design.id,market.design.id];
  const learnedOriginal=select({sequence:21,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:usedPair}});
  assert.equal(learnedOriginal.status,'SELECTED');assert.equal(learnedOriginal.lane,'original');assert.equal(learnedOriginal.design.family_id,'signal-composition');
  const sbp=foundryBlueprintFor(learnedOriginal,21,'20261001'),sm=foundryRunner.buildModel(sbp),sp=foundryRunner.proposalFor(sbp,sm);
  product.validateModel(sm);product.validate(sp.product_contract);commercial.validate(sp.commercial_contract);commercial.semantics(sp.commercial_contract,sp.product_contract,sm);assertReversibleScoreProbe(sm,sp.product_contract);
  assert.equal(validateReviewedProposal(sbp,sm,sp).passed,true);assert.match(sp.implementation_contract.progression,/PULSE A/);assert.match(sp.implementation_contract.action_feedback,/Prior Factory outcomes require this correction/);

  const learnedMarket=select({sequence:22,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...usedPair,learnedOriginal.design.id]}});
  assert.equal(learnedMarket.status,'SELECTED');assert.equal(learnedMarket.lane,'market-benchmark');assert.equal(learnedMarket.design.family_id,'trajectory-interception');assert.match(learnedMarket.benchmark.url,/^https:\/\/play\.google\.com\//);
  const tbp=foundryBlueprintFor(learnedMarket,22,'20261001'),tm=foundryRunner.buildModel(tbp),tp=foundryRunner.proposalFor(tbp,tm);
  product.validateModel(tm);product.validate(tp.product_contract);commercial.validate(tp.commercial_contract);commercial.semantics(tp.commercial_contract,tp.product_contract,tm);assertReversibleScoreProbe(tm,tp.product_contract);
  assert.equal(validateReviewedProposal(tbp,tm,tp).passed,true);assert.match(tp.implementation_contract.progression,/INTERCEPT/);assert.match(tp.implementation_contract.originality,/Forbidden copying/);
  assert.equal(new Set([original,market,learnedOriginal,learnedMarket].map(x=>x.design.family_id)).size,4);

  const learnedPair=[...usedPair,learnedOriginal.design.id,learnedMarket.design.id];
  const nextOriginal=select({sequence:23,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:learnedPair}});
  assert.equal(nextOriginal.status,'SELECTED');assert.equal(nextOriginal.design.family_id,'echo-routing');
  const ebp=foundryBlueprintFor(nextOriginal,23,'20261001'),em=foundryRunner.buildModel(ebp),ep=foundryRunner.proposalFor(ebp,em);
  product.validateModel(em);product.validate(ep.product_contract);commercial.validate(ep.commercial_contract);commercial.semantics(ep.commercial_contract,ep.product_contract,em);assertReversibleScoreProbe(em,ep.product_contract);
  assert.equal(validateReviewedProposal(ebp,em,ep).passed,true);assert.match(ep.implementation_contract.progression,/three-bit switch mask/);

  const nextMarket=select({sequence:24,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...learnedPair,nextOriginal.design.id]}});
  assert.equal(nextMarket.status,'SELECTED');assert.equal(nextMarket.design.family_id,'cadence-buffering');assert.match(nextMarket.benchmark.url,/^https:\/\/play\.google\.com\//);
  const cbp=foundryBlueprintFor(nextMarket,24,'20261001'),cm=foundryRunner.buildModel(cbp),cp=foundryRunner.proposalFor(cbp,cm);
  product.validateModel(cm);product.validate(cp.product_contract);commercial.validate(cp.commercial_contract);commercial.semantics(cp.commercial_contract,cp.product_contract,cm);assertReversibleScoreProbe(cm,cp.product_contract);
  assert.equal(validateReviewedProposal(cbp,cm,cp).passed,true);assert.match(cp.implementation_contract.progression,/ordered beat buffer/);assert.match(cp.implementation_contract.originality,/Forbidden copying/);

  const usedThreePairs=[...learnedPair,nextOriginal.design.id,nextMarket.design.id];
  const invariantOriginal=select({sequence:25,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:usedThreePairs}});
  assert.equal(invariantOriginal.status,'SELECTED');assert.equal(invariantOriginal.design.family_id,'flux-harvesting');
  const fbp=foundryBlueprintFor(invariantOriginal,25,'20261001'),fm=foundryRunner.buildModel(fbp),fp=foundryRunner.proposalFor(fbp,fm);
  product.validateModel(fm);product.validate(fp.product_contract);commercial.validate(fp.commercial_contract);commercial.semantics(fp.commercial_contract,fp.product_contract,fm);assertReversibleScoreProbe(fm,fp.product_contract);assertBuildInvariants(fm,fp);
  assert.equal(validateReviewedProposal(fbp,fm,fp).passed,true);assert.match(fp.implementation_contract.progression,/GATHER FLUX/);

  const invariantMarket=select({sequence:26,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...usedThreePairs,invariantOriginal.design.id]}});
  assert.equal(invariantMarket.status,'SELECTED');assert.equal(invariantMarket.design.family_id,'aperture-shaping');assert.match(invariantMarket.benchmark.url,/^https:\/\/play\.google\.com\//);
  const abp=foundryBlueprintFor(invariantMarket,26,'20261001'),am=foundryRunner.buildModel(abp),ap=foundryRunner.proposalFor(abp,am);
  product.validateModel(am);product.validate(ap.product_contract);commercial.validate(ap.commercial_contract);commercial.semantics(ap.commercial_contract,ap.product_contract,am);assertReversibleScoreProbe(am,ap.product_contract);assertBuildInvariants(am,ap);
  assert.equal(validateReviewedProposal(abp,am,ap).passed,true);assert.match(ap.implementation_contract.progression,/WIDEN APERTURE/);assert.match(ap.implementation_contract.originality,/Forbidden copying/);
  const usedFourPairs=[...usedThreePairs,invariantOriginal.design.id,invariantMarket.design.id];
  const constructedOriginal=select({sequence:27,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:usedFourPairs}});
  assert.equal(constructedOriginal.status,'SELECTED');assert.equal(constructedOriginal.design.family_id,'phase-coupling');
  const pbp=foundryBlueprintFor(constructedOriginal,27,'20261002'),pm=foundryRunner.buildModel(pbp),pp=foundryRunner.proposalFor(pbp,pm);
  product.validateModel(pm);product.validate(pp.product_contract);commercial.validate(pp.commercial_contract);commercial.semantics(pp.commercial_contract,pp.product_contract,pm);assertReversibleScoreProbe(pm,pp.product_contract);assertBuildInvariants(pm,pp);
  assert.equal(validateReviewedProposal(pbp,pm,pp).passed,true);assert.match(pp.implementation_contract.progression,/ADVANCE PAIR/);
  const corruptedCheckpoint=structuredClone(pp);corruptedCheckpoint.build_invariants.seeds[String(pbp.seeds[0])].quality_checkpoints[1].complexity+=1;
  assert(validateReviewedProposal(pbp,pm,corruptedCheckpoint).errors.some(error=>error.code==='invalid_build_invariants'));

  const constructedMarket=select({sequence:28,date:'2026-10-02',designCatalog,benchmarkCatalog,learningProfile:{...learning,used_design_ids:[...usedFourPairs,constructedOriginal.design.id]}});
  assert.equal(constructedMarket.status,'SELECTED');assert.equal(constructedMarket.design.family_id,'gradient-compression');assert.equal(constructedMarket.design.benchmark_id,'google-play-games-en-20261002');
  const gbp=foundryBlueprintFor(constructedMarket,28,'20261002'),gm=foundryRunner.buildModel(gbp),gp=foundryRunner.proposalFor(gbp,gm);
  product.validateModel(gm);product.validate(gp.product_contract);commercial.validate(gp.commercial_contract);commercial.semantics(gp.commercial_contract,gp.product_contract,gm);assertReversibleScoreProbe(gm,gp.product_contract);assertBuildInvariants(gm,gp);
  assert.equal(validateReviewedProposal(gbp,gm,gp).passed,true);assert.match(gp.implementation_contract.progression,/PRESS INWARD/);assert.match(gp.implementation_contract.originality,/Forbidden copying/);
  assert.equal(new Set([original,market,learnedOriginal,learnedMarket,nextOriginal,nextMarket,invariantOriginal,invariantMarket,constructedOriginal,constructedMarket].map(x=>x.design.family_id)).size,10);

  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-foundry-intake-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const meta=materialize(root,22,'20261001',learnedMarket),dir=path.join(root,'candidate');
  assert.equal(meta.lane,'market-benchmark');assert.equal(meta.family_id,'trajectory-interception');assert.match(fs.readFileSync(path.join(dir,'commission.cjs'),'utf8'),/foundry\/family-runner/);
  const blueprint=JSON.parse(fs.readFileSync(path.join(dir,'blueprint.json')));assert.equal(blueprint.runner,'foundry/family-runner.cjs');assert.equal(blueprint.foundry.runner,blueprint.runner);
  const request=JSON.parse(fs.readFileSync(path.join(dir,'queued-request.json')));assert.equal(request.production_authorized,false);assert.equal(request.authorized_provider_calls,6);
  assert.match(request.runtime,/GameKit v3 \+ Feel Kit/);
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
