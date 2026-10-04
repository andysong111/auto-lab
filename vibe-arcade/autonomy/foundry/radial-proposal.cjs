'use strict';

const {hash}=require('../orchestrator/files.cjs');

const CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltRadialKit.create({id:'halo-guard-v1'});\n";
const region=(x,y,width,height)=>({selector:'[data-game-canvas]',x,y,width,height});
const anchor=(node,value)=>({node,region:value});

function contracts(bp,model){
  const oracleId=bp.slug+'-oracle-v1',oracleHash=hash(model);
  const leftAngle=Math.PI/2+.36,rightAngle=Math.PI/2-.36;
  const actions={
    guard_left:{key:'ArrowLeft',touch:{x:Number((.5+Math.cos(leftAngle)*.42).toFixed(6)),y:Number((.5-Math.sin(leftAngle)*.42).toFixed(6))},hold_ms:34,settle_ms:50},
    guard_right:{key:'ArrowRight',touch:{x:Number((.5+Math.cos(rightAngle)*.42).toFixed(6)),y:Number((.5-Math.sin(rightAngle)*.42).toFixed(6))},hold_ms:34,settle_ms:50}
  };
  const productContract={schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:'Rotate the halo to rescue wisps and keep shard raiders outside the core.'},
    progress:{selector:'[data-progress-value]',state_path:'state.caught',format:'{value} RESCUED',milestones:[1,3,6]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['guard_left','guard_right']],no_progress_probes:[['guard_left']]},
    best:{selector:'[data-game-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result-title]',success_text:bp.theme.success,failure_text:bp.theme.failure,max_terminal_latency_ms:100,failure_wait_ms:45000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:bp.seeds,oracle_id:oracleId,oracle_sha256:oracleHash,projection:model.projection,stage_path:'state.phase',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:{critical_selectors:['[data-objective]','[data-progress-value]','[data-game-score]','[data-game-best]','[data-result-title]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]','[data-game-mute]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[{x:.04,y:.04,width:.92,height:.92}],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:450,action:'guard_left'},
    interaction:{mode:'continuous-radial-v1',target_collection_path:'state.items',target_angle_path:'currentAngle',target_radius_path:'r',hazard_path:'bad',acquire_radius:6,avoid_radius:5,pointer_radius:.42,input_interval_ms:34,max_ticks:2600,min_success_progress:6},
    actions};
  const full=region(.05,.05,.9,.9),shield=region(.08,.08,.84,.84),core=region(.31,.31,.38,.38),upper=region(.08,.05,.84,.42),lower=region(.08,.53,.84,.4);
  const commercialContract={schema_version:1,review_id:bp.slug+'-commercial-v1',seed:bp.seeds[0],
    visual_legibility:{pairs:[{id:'early-late-world-depth',kind:'state',a:anchor('early',full),b:anchor('late',full),state_path:'state.phase',marker:'The same arena must visibly deepen from forgiving early defense to the final pressure phase.'}]},
    state_distinction:{pairs:[{id:'early-mid-threat-density',kind:'state',a:anchor('early',upper),b:anchor('mid',upper),state_path:'state.phase',marker:'Enemy and rescue traffic must make the middle phase visibly distinct without relying on labels.'}]},
    action_feedback:{probes:[{id:'shield-turn',node:'early',action:'guard_left',kind:'movement',region:shield},{id:'rescue-progress',node:'mid',action:'guard_right',kind:'progress',region:full}]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor('early',full),anchor('mid',full),anchor('late',full)],marker:'Increasing pressure must add readable traffic, phase staging and persistent rescued-wisp payoff.'},
    result_presentation:{region:full,success_title:bp.theme.success,failure_title:bp.theme.failure},
    audio:{mode:'required',mute_selector:'[data-game-mute]',primary_probe:'shield-turn',progress_probe:'rescue-progress'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'player',foreground:core,background:lower},{role:'goal',foreground:shield,background:upper},{role:'danger',foreground:upper,background:lower}]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same defense seed to rescue more wisps, preserve barriers and improve the device best.'},
    performance:{sample_ms:2000}};
  return {productContract,commercialContract};
}

function buildInvariants(bp,model,productContract,commercialContract){
  const difficulty=productContract.difficulty;
  return {schema_version:1,source:'reviewed-foundry-oracle',oracle_id:difficulty.oracle_id,oracle_sha256:difficulty.oracle_sha256,projection:model.projection,actions:productContract.actions,
    lifecycle:{objective_selector:productContract.objective.visible_selector,progress_selector:productContract.progress.selector,progress_state_path:productContract.progress.state_path,score_selector:productContract.score.selector,best_selector:productContract.best.selector,outcome_state_path:productContract.completion.state_path,success_value:productContract.completion.success_value,failure_value:productContract.completion.failure_value,result_selector:productContract.completion.result_selector,replay_selector:productContract.replay.selector},
    diagnostics:{stage_path:difficulty.stage_path,complexity_path:difficulty.complexity_path,objective_progress_path:'quality.objective_progress',meaningful_actions_path:difficulty.meaningful_actions_path,reversible_state_path:difficulty.reversible_state_path,feedback_active_path:productContract.feedback.active_probe_path,static_feedback_path:productContract.feedback.static_probe_path,reduced_motion_path:productContract.reduced_motion.presentation_probe_path},
    construction:{input_owner:'PlayJoltGameKit',input_source:'input.pointer + input.actions',action_expressions:['input.pointer','input.actions.guard_left','input.actions.guard_right'],complexity_source:'quality.stage + quality.complexity',terminal_owner:'GameCore',terminal_rule:'terminal(state) is true exactly when the protected Halo Guard outcome becomes success or failure; GameKit observes it in the same frame.',replay_owner:'PlayJoltGameKit',replay_rule:'Do not implement a second restart handler. GameKit invokes the protected core create(seed) path.',presentation_rule:'The golden guardian, wisp, raider and shield roles stay readable. Shield motion must appear at 70ms and 150ms before settling by 450ms; the one reviewed world-kit change may not alter mechanics.',presentation_floor:{mobile_owner:'PlayJoltGameKit',critical_label_min_px:14,lifecycle_control_min_px:44,active_goal_distinctions:['luminance','shape','position'],intermediate_motion_ms:[70,150],settle_ms:450,audio_owner:'PlayJoltGameKit',audio_activation:'accepted_player_input',contrast_palette:{background:'#071c2a',active:'#ffffff',goal:'#5ce0a1',warning:'#ff4e65'}},prepaid_core_proof:{runtime:'radialkit-1',seeds:bp.seeds.length,oracle_sha256:difficulty.oracle_sha256,diagnostics:'finite_numeric',replay:'exact_initial_state',input_timing_parity:'continuous_pointer_and_keyboard_nudge'}},
    factory_core:{runtime:'radialkit-1',required_script:'./radialkit.js',core_source:CORE_SOURCE,time_authority:'The factory-owned Halo Guard core advances spawn timing, collision, score, progress, phase, barriers, lives, success and failure. Candidate code is presentation-only.',interaction_mode:'continuous-radial-v1',golden_baseline_id:bp.golden_baseline_id,max_active_entities:model.max_entities},
    commercial_probes:commercialContract.action_feedback.probes.map(probe=>({id:probe.id,node:probe.node,action:probe.action,kind:probe.kind})),seeds:model.seeds};
}

function proposalFor(bp,model){
  const {productContract,commercialContract}=contracts(bp,model),build_invariants=buildInvariants(bp,model,productContract,commercialContract),market=bp.lane==='market-benchmark';
  const lineage=market?'Market evidence transfers only compact 3D role readability, immediate one-thumb action and a coherent themed world. Do not copy any observed name, character, art, layout, asset, audio, code, economy or distinctive ruleset.':'This is an original PlayJolt golden-baseline variation.';
  return {game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:'continuous radial arcade defense',mechanic_family:bp.family_id+'-'+bp.design_id,
    controls:['Move the pointer around the arena to rotate the shield.','Arrow Left and Arrow Right nudge the same shield target.'],mobile_controls:['Drag anywhere on the arena to rotate the shield with one thumb.'],max_repair_attempts:5,
    qa:{seed:bp.seeds[0],keyboard:{key:'ArrowLeft',observation:'state.targetAngle'},pointer:{observation:'state.targetAngle'},terminal_ms:45000},
    implementation_contract:{
      first_ten_seconds:'Start immediately reveals the guardian, shield, rescue wisps and shard raiders. The first drag rotates the shield and produces visible, gesture-gated feedback within one second.',
      tension_curve:'Preserve the exact golden forty-second three-phase pressure curve, two barriers and four core lives. Do not tune spawn timing, collision, scoring, success or failure.',
      mastery_hook:'Players improve by reading friendly and hostile character silhouettes, rotating the shield earlier and preserving barriers while rescuing more wisps.',
      replay_hook:'Replay uses the same seed so the player can improve rescued-wisp count, combo and device best through cleaner defense.',
      sensory_payoff:'Shield movement has readable intermediate motion; rescues, blocked raiders, barrier loss, phase escalation, success and failure each receive distinct bounded visual and gesture-audio feedback.',
      goal:'Keep the visible objective exact: rotate the halo to rescue wisps and keep shard raiders outside the core for the complete defense window.',
      progression:'Use the protected Halo Guard runtime without reimplementing it. Show exact rescued-wisp progress, score, phase, lives, barriers and increasingly dense traffic across the full playfield.',
      presentation:'Preserve the approved compact toy-3D guardian, wisp, raider and shield roles. Change only the reviewed cloud-caravan world kit: sparse rounded floating homes and soft travel lights in the distant background, with no new gameplay geometry or UI layout.',
      originality:lineage+' The cloud-caravan environment is newly authored for PlayJolt and remains subordinate to the readable characters and interception ring.',
      difficulty:'The exact halo-guard-v9 golden core, six seeds, forty-second timing, collision authority, score, progress, barriers, lives, success and failure are immutable.',
      mobile_readability:'At 390x844 keep the full circular arena, objective, rescued count, current score, device best, result and Replay in the initial viewport. Critical labels are at least 14px and lifecycle controls at least 44px.',
      result:'Success and failure must transform the whole arena, show exact titles '+bp.theme.success+' or '+bp.theme.failure+', preserve score and device best, and expose Replay immediately.',
      reduced_motion:'Honor initial and live reduced-motion changes without changing canonical score, progress, collision or terminal outcomes. Replace movement effects with strong static spatial cues.',
      scoring:'Only the protected core may award score. Steering alone scores zero; rescued wisps, combo and overdrive retain the exact golden authority.',
      completion_timing:'The protected core finishes success at the complete defense window and failure when the final life is lost. GameKit owns the lifecycle transition and replay.',
      action_feedback:'Every accepted drag or keyboard nudge visibly moves the shield through intermediate positions. Rescue and raider contacts are spatially obvious and remain readable over the new background.'},
    build_invariants,product_contract:productContract,commercial_contract:commercialContract};
}

module.exports={CORE_SOURCE,contracts,buildInvariants,proposalFor};
