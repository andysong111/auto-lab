'use strict';
const fs=require('node:fs'),path=require('node:path');
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function validBuildInvariants(data,product,commercial,model){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.schema_version!==1||data.source!=='reviewed-foundry-oracle'||Buffer.byteLength(JSON.stringify(data))>60000)return false;
  const difficulty=product?.difficulty,lifecycle=data.lifecycle||{},diagnostics=data.diagnostics||{},construction=data.construction||{},radialMode=product?.interaction?.mode==='continuous-radial-v1'&&model?.interaction_mode==='continuous-radial-v1';
  if(!difficulty||!product?.objective?.visible_selector||!product?.progress?.selector||!product?.score?.selector||!product?.best?.selector||!product?.completion?.state_path||!product?.replay?.selector||!product?.feedback?.active_probe_path||!product?.reduced_motion?.presentation_probe_path||!Array.isArray(commercial?.action_feedback?.probes))return false;
  if(data.oracle_id!==difficulty.oracle_id||data.oracle_sha256!==difficulty.oracle_sha256||JSON.stringify(data.projection)!==JSON.stringify(difficulty.projection)||JSON.stringify(data.actions)!==JSON.stringify(product.actions))return false;
  const expectedLifecycle={objective_selector:product.objective.visible_selector,progress_selector:product.progress.selector,progress_state_path:product.progress.state_path,score_selector:product.score.selector,best_selector:product.best.selector,outcome_state_path:product.completion.state_path,success_value:product.completion.success_value,failure_value:product.completion.failure_value,result_selector:product.completion.result_selector,replay_selector:product.replay.selector};
  const expectedDiagnostics={stage_path:difficulty.stage_path,complexity_path:difficulty.complexity_path,objective_progress_path:radialMode?'quality.objective_progress':difficulty.objective_progress_path,meaningful_actions_path:difficulty.meaningful_actions_path,reversible_state_path:difficulty.reversible_state_path,feedback_active_path:product.feedback.active_probe_path,static_feedback_path:product.feedback.static_probe_path,reduced_motion_path:product.reduced_motion.presentation_probe_path};
  if(JSON.stringify(lifecycle)!==JSON.stringify(expectedLifecycle)||JSON.stringify(diagnostics)!==JSON.stringify(expectedDiagnostics))return false;
  const expectedConstruction=radialMode?{input_owner:'PlayJoltGameKit',input_source:'input.pointer + input.actions',action_expressions:['input.pointer','input.actions.guard_left','input.actions.guard_right'],complexity_source:'quality.stage + quality.complexity',terminal_owner:'GameCore',terminal_rule:'terminal(state) is true exactly when the protected Halo Guard outcome becomes success or failure; GameKit observes it in the same frame.',replay_owner:'PlayJoltGameKit',replay_rule:'Do not implement a second restart handler. GameKit invokes the protected core create(seed) path.',presentation_rule:'The golden guardian, wisp, raider and shield roles stay readable. Shield motion must appear at 70ms and 150ms before settling by 450ms; the one reviewed world-kit change may not alter mechanics.',presentation_floor:{mobile_owner:'PlayJoltGameKit',critical_label_min_px:14,lifecycle_control_min_px:44,active_goal_distinctions:['luminance','shape','position'],intermediate_motion_ms:[70,150],settle_ms:450,audio_owner:'PlayJoltGameKit',audio_activation:'accepted_player_input',contrast_palette:{background:'#071c2a',active:'#ffffff',goal:'#5ce0a1',warning:'#ff4e65'}}}:{input_owner:'PlayJoltGameKit',input_source:'input.actions',action_expressions:Object.keys(product.actions).map(name=>'input.actions.'+name),complexity_source:'quality_checkpoints.complexity',terminal_owner:'GameCore',terminal_rule:'terminal(state) is true exactly when outcome_state_path equals success_value or failure_value; the terminal action changes outcome in the same step.',replay_owner:'PlayJoltGameKit',replay_rule:'Do not implement a second restart handler. GameKit invokes core.create(seed) and restores the seed initial_state.',presentation_rule:'Active and goal geometry must differ by luminance, shape and position. Every accepted gameplay action must move a major object at the 70ms and 150ms intermediate probes before settling by 450ms.',presentation_floor:{mobile_owner:'PlayJoltGameKit',critical_label_min_px:14,lifecycle_control_min_px:44,active_goal_distinctions:['luminance','shape','position'],intermediate_motion_ms:[70,150],settle_ms:450,audio_owner:'PlayJoltGameKit',audio_activation:'accepted_player_input',contrast_palette:{background:'#06131f',active:'#ffffff',goal:'#00e5ff',warning:'#ff3b6b'}}};
  const proof=construction.prepaid_core_proof,baseConstruction={...construction};delete baseConstruction.prepaid_core_proof;
  if(JSON.stringify(baseConstruction)!==JSON.stringify(expectedConstruction))return false;
  if(data.factory_core!==undefined){
    const core=data.factory_core;
    const approved=[
      {runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'threat-parry-v1'});\n",time_authority:'state.deadline and state.danger are advanced by the same factory core that decides parry, score, progress, success and failure.',stage_action_counts:[2,4,6]},
      {runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'rift-thread-v1'});\n",time_authority:'state.deadline and state.danger are advanced by the same factory core that decides lane movement, surge collision, score, progress, success and failure.',stage_action_counts:[2,3,4]},
      {runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'constellation-weave-v1'});\n",time_authority:'state.litMask, state.usedMask and state.moves are advanced by the same factory core that decides thread legality, score, progress, success and overload failure.',stage_action_counts:[2,3,4]},
      {runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'orbit-dock-v1'});\n",time_authority:'state.position, state.target, state.warning, state.deadline and state.danger are advanced by the same factory core that decides orbit movement, warned recovery, timeout, score, progress, success and second-bad-dock failure.',stage_action_counts:[3,4,5]},
      {runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'thermal-vent-v1'});\n",time_authority:'state.deadline, state.danger, both chamber temperatures and each hazard beat are advanced by the same factory core that decides vent effects, score, warning, progress, success and overload failure.',stage_action_counts:[2,3,4],diagnostic_entities:'finite numeric count'}
      ,{runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'current-surf-v1'});\n",time_authority:'state.band, state.target, state.deadline and state.danger are advanced by the same factory core that decides carving movement, warning recovery, score, progress, success and collision failure.',stage_action_counts:[2,3,4],diagnostic_entities:'finite numeric count'}
      ,{runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'pulse-cascade-v1'});\n",time_authority:'state.cue, state.warning, state.deadline and state.danger are advanced by the same factory core that decides chain links, score, progress, recovery, success and repeated-link failure.',stage_action_counts:[2,3,4],diagnostic_entities:'finite numeric count'}
      ,{runtime:'reflexkit-5',required_script:'./reflexkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'gravity-tilt-v1'});\n",time_authority:'state.x, state.y, target coordinates, warning, deadline and danger are advanced by the same factory core that decides checkpoint alignment, score, progress, recovery, success and repeated-tilt failure.',stage_action_counts:[2,3,4],diagnostic_entities:'finite numeric count'}
      ,{runtime:'radialkit-1',required_script:'./radialkit.js',core_source:"globalThis.GameCore = globalThis.PlayJoltRadialKit.create({id:'halo-guard-v1'});\n",time_authority:'The factory-owned Halo Guard core advances spawn timing, collision, score, progress, phase, barriers, lives, success and failure. Candidate code is presentation-only.',interaction_mode:'continuous-radial-v1',golden_baseline_id:'halo-guard-v9',max_active_entities:model?.max_entities}
    ];
    if(!core||!approved.some(item=>JSON.stringify(core)===JSON.stringify(item)))return false;
    if(!proof||proof.runtime!==core.runtime||proof.seeds!==difficulty.deterministic_seeds.length||proof.oracle_sha256!==data.oracle_sha256||proof.diagnostics!=='finite_numeric'||proof.replay!=='exact_initial_state'||proof.input_timing_parity!==(radialMode?'continuous_pointer_and_keyboard_nudge':'score_progress_projection'))return false;
  }else if(proof!==undefined)return false;
  if(data.factory_product!==undefined){
    const approved={id:'halo-guard-v9-product-v1',source:'autonomy/foundry/golden/halo-guard-v9/product',renderer:'three-webgl',provider_calls:0,repair_attempts:0,production_authorized:false};
    if(!radialMode||JSON.stringify(data.factory_product)!==JSON.stringify(approved))return false;
  }
  const expectedProbes=commercial.action_feedback.probes.map(probe=>({id:probe.id,node:probe.node,action:probe.action,kind:probe.kind}));
  if(JSON.stringify(data.commercial_probes)!==JSON.stringify(expectedProbes))return false;
  const seeds=data.seeds||{},expectedSeeds=difficulty.deterministic_seeds.map(String);
  if(JSON.stringify(Object.keys(seeds).sort())!==JSON.stringify(expectedSeeds.sort()))return false;
  if(!model||JSON.stringify(model.projection)!==JSON.stringify(data.projection))return false;
  if(radialMode)return JSON.stringify(seeds)===JSON.stringify(model.seeds)&&model.production_authorized===false;
  return Object.entries(seeds).every(([seed,row])=>{
    const graph=model.seeds?.[seed];
    if(!graph||!Array.isArray(row.initial_state)||JSON.stringify(row.initial_state)!==JSON.stringify(graph.nodes[graph.initial]?.values)||!Array.isArray(row.success_actions)||row.success_actions.length<1||row.success_actions.length>difficulty.max_actions||!Array.isArray(row.success_states)||row.success_states.length!==row.success_actions.length+1||JSON.stringify(row.success_states[0])!==JSON.stringify(row.initial_state)||!Array.isArray(row.quality_checkpoints)||row.quality_checkpoints.length<1)return false;
    const stageNodes=[];
    for(const state of row.success_states){const node=Object.values(graph.nodes).find(candidate=>JSON.stringify(candidate.values)===JSON.stringify(state));if(!node)return false;if(!node.success&&!stageNodes.some(candidate=>candidate.stage===node.stage))stageNodes.push(node);}
    const expectedCheckpoints=stageNodes.map(node=>{const metrics=require('../qa/product-contract.cjs').stageMetrics(graph,Object.keys(graph.nodes).find(id=>graph.nodes[id]===node));return {state:node.values,stage:metrics.stage,complexity:metrics.complexity,required_actions:metrics.required_actions};});
    if(JSON.stringify(row.quality_checkpoints)!==JSON.stringify(expectedCheckpoints))return false;
    let node=graph.initial;
    for(let index=0;index<row.success_actions.length;index++){
      const action=row.success_actions[index];if(!Object.hasOwn(data.actions,action))return false;
      const edge=graph.nodes[node].edges.find(candidate=>candidate.action===action);if(!edge)return false;
      node=edge.to;if(JSON.stringify(row.success_states[index+1])!==JSON.stringify(graph.nodes[node].values))return false;
    }
    const terminalStep=row.success_actions.length-1;
    return graph.nodes[node].success===true&&JSON.stringify(row.preterminal_state)===JSON.stringify(row.success_states[terminalStep])&&row.terminal_action===row.success_actions[terminalStep]&&JSON.stringify(row.terminal_state)===JSON.stringify(graph.nodes[node].values);
  });
}
function validateProposal(proposal,{policy=readJSON(path.join(__dirname,'policy.json')),catalog=readJSON(path.join(__dirname,'catalog.json'))}={}){
  const errors=[],warnings=[];let reviewedProduct=null;
  const req=['game_id','title','slug','genre','mechanic_family','controls','mobile_controls','qa','implementation_contract','product_contract'];
  for(const k of req)if(proposal[k]===undefined||proposal[k]===null||proposal[k]==='')errors.push({code:'missing_field',field:k});
  if(!ID.test(proposal.game_id||''))errors.push({code:'invalid_game_id'});
  if(!SLUG.test(proposal.slug||''))errors.push({code:'invalid_slug'});
  if(!Array.isArray(proposal.controls)||proposal.controls.length<1||proposal.controls.length>policy.controls.max_desktop_instructions)errors.push({code:'desktop_control_complexity'});
  if(!Array.isArray(proposal.mobile_controls)||proposal.mobile_controls.length<1||proposal.mobile_controls.length>policy.controls.max_mobile_instructions)errors.push({code:'mobile_control_complexity'});
  const terminal=proposal.qa?.terminal_ms;
  if(!Number.isInteger(terminal)||terminal<policy.session.terminal_ms_min||terminal>policy.session.terminal_ms_max)errors.push({code:'terminal_window',min:policy.session.terminal_ms_min,max:policy.session.terminal_ms_max});
  if(!proposal.qa?.keyboard?.key||!/^state\.[a-zA-Z0-9_.]+$/.test(proposal.qa?.keyboard?.observation||''))errors.push({code:'keyboard_probe'});
  if(!/^state\.[a-zA-Z0-9_.]+$/.test(proposal.qa?.pointer?.observation||''))errors.push({code:'pointer_probe'});
  if(proposal.product_contract?.actions){
    const action=Object.values(proposal.product_contract.actions).find(value=>value?.key===proposal.qa?.keyboard?.key);
    if(!action||!Number.isFinite(action.touch?.x)||!Number.isFinite(action.touch?.y))errors.push({code:'technical_input_probe_unmapped'});
    if(!policy.product_quality?.allow_fixture_oracles&&proposal.qa?.keyboard?.observation!==proposal.qa?.pointer?.observation)errors.push({code:'technical_input_probe_observation_mismatch'});
  }
  const family=norm(proposal.mechanic_family);
  const blocked=new Set(policy.blocked_mechanic_families.map(norm));
  const rejected=new Set((policy.rejected_mechanic_families||[]).map(x=>norm(x.mechanic_family)));
  if(blocked.has(family))errors.push({code:'mechanic_family_blocked',mechanic_family:proposal.mechanic_family});
  if(rejected.has(family))errors.push({code:'rejected_mechanic_family',mechanic_family:proposal.mechanic_family});
  const titles=new Set(catalog.games.map(g=>norm(g.title))),slugs=new Set(catalog.games.map(g=>norm(g.id)));
  if(titles.has(norm(proposal.title)))errors.push({code:'title_collision',title:proposal.title});
  if(slugs.has(norm(proposal.slug)))errors.push({code:'slug_collision',slug:proposal.slug});
  if(catalog.games.length>=policy.max_public_games_before_validation)errors.push({code:'catalog_cap_reached',count:catalog.games.length});
  if(proposal.max_repair_attempts!==undefined&&proposal.max_repair_attempts>policy.technical_budget.max_repair_attempts)errors.push({code:'repair_budget_too_high'});
  let implementation;
  const data=proposal.implementation_contract;
  if(data!==undefined){
    const keys=['goal','progression','presentation','originality','difficulty','mobile_readability','result','reduced_motion','scoring','completion_timing','action_feedback'];
    if(proposal.build_invariants)keys.unshift('first_ten_seconds','tension_curve','mastery_hook','replay_hook','sensory_payoff');
    if(!data||typeof data!=='object'||Array.isArray(data)||Buffer.byteLength(JSON.stringify(data))>20000||
      !keys.every(k=>typeof data[k]==='string'&&data[k].trim().length>=20))errors.push({code:'invalid_implementation_contract'});
    else implementation=JSON.parse(JSON.stringify(data));
  }
  if(!proposal.commercial_contract&&!policy.product_quality?.allow_fixture_oracles)errors.push({code:'missing_field',field:'commercial_contract'});
  if(proposal.commercial_contract){try{require('../qa/commercial/contract.cjs').review(proposal.commercial_contract,proposal.product_contract,{allowFixture:policy.product_quality?.allow_fixture_oracles===true});}catch(e){errors.push({code:'invalid_commercial_contract',field:'commercial_contract',message:e.message});}}
  if(proposal.product_contract){try{reviewedProduct=require('../qa/product-contract.cjs').review(proposal.product_contract,{allowFixture:policy.product_quality?.allow_fixture_oracles===true});}catch(e){errors.push({code:'invalid_product_contract',field:'product_contract',message:e.message});}}
  if(proposal.build_invariants!==undefined&&!validBuildInvariants(proposal.build_invariants,proposal.product_contract,proposal.commercial_contract,reviewedProduct?.model))errors.push({code:'invalid_build_invariants',field:'build_invariants'});
  const words=new Set(family.split('-').filter(Boolean));
  for(const g of catalog.games){
    const gw=new Set(norm(g.mechanic_family).split('-').filter(Boolean));
    const overlap=[...words].filter(x=>gw.has(x)).length/Math.max(1,Math.min(words.size,gw.size));
    if(overlap>=0.75)warnings.push({code:'mechanic_similarity_review',game:g.id,overlap:Number(overlap.toFixed(2))});
  }
  const factory_spec={game_id:proposal.game_id,generation:proposal.generation||1,title:proposal.title,slug:proposal.slug,genre:proposal.genre,mechanic_family:proposal.mechanic_family,
    controls:proposal.controls,mobile_controls:proposal.mobile_controls,max_repair_attempts:proposal.max_repair_attempts??policy.technical_budget.max_repair_attempts,qa:proposal.qa,implementation_contract:implementation,product_contract:proposal.product_contract,...(proposal.build_invariants?{build_invariants:proposal.build_invariants}:{}),...(proposal.commercial_contract?{commercial_contract:proposal.commercial_contract}:{})};
  return {passed:errors.length===0,errors,warnings,factory_spec,commissioning:{owner_review_required:true,auto_production_ship:false,max_provider_calls:policy.technical_budget.max_provider_calls,max_estimated_model_cost_usd:policy.technical_budget.max_estimated_model_cost_usd}};
}
module.exports={validateProposal,validBuildInvariants,norm,readJSON};
