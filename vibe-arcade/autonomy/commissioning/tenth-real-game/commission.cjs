'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const {hash,atomicJSON,readJSON}=require('../../orchestrator/files.cjs');
const {validateProposal}=require('../spec-gate.cjs');
const product=require('../../qa/product-contract.cjs');
const commercial=require('../../qa/commercial/contract.cjs');
const {Factory}=require('../../orchestrator/engine.cjs');
const {FileStore}=require('../../orchestrator/store.cjs');
const {AutonomousWorker}=require('../../worker/runtime.cjs');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {OpenAIProvider}=require('../../providers/openai.cjs');

const GAME_ID='GAME-20260926-201',TITLE='Shield Mosaic',SLUG='shield-mosaic';
const seeds=[18,19,20,21,22,23], names=['left','right','up','down'];
function activeCount(stage){return stage+1;}
function pow3(n){let v=1;for(let i=0;i<n;i++)v*=3;return v;}
function digit(code,index){return Math.floor(code/pow3(index))%3;}
function cycle(code,index){const p=pow3(index),old=digit(code,index);return code+(((old+1)%3)-old)*p;}
function targetFor(seed,stage){
  const n=activeCount(stage);let code=0;
  for(let i=0;i<n;i++)code+=(1+((seed+i+stage)%2))*pow3(i);
  return code;
}
const id=v=>v.join(':');
function transitions(v,seed){
  const [stage,code,outcome]=v;if(outcome!=='playing')return [];
  const n=activeCount(stage),edges=[];
  for(let i=0;i<n;i++)edges.push({action:names[i],values:[stage,cycle(code,i),outcome]});
  if(code===targetFor(seed,stage)){
    if(stage<3)edges.push({action:'lock',values:[stage+1,0,'playing']});
    else edges.push({action:'lock',values:[4,0,'success']});
  }
  return edges;
}
function graph(seed){
  const initial=[1,0,'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(v,seed);
    nodes[k]={values:v,stage:v[0],...(v[2]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function oracle(){
  const model={schema_version:1,projection:['state.stage','state.code','state.outcome'],seeds:{}};
  for(const seed of seeds)model.seeds[String(seed)]=graph(seed);
  product.validateModel(model);return model;
}
function actions(){return {
  left:{key:'ArrowLeft',touch:{x:.10,y:.67},hold_ms:35,settle_ms:35},
  right:{key:'ArrowRight',touch:{x:.30,y:.67},hold_ms:35,settle_ms:35},
  up:{key:'ArrowUp',touch:{x:.50,y:.67},hold_ms:35,settle_ms:35},
  down:{key:'ArrowDown',touch:{x:.70,y:.67},hold_ms:35,settle_ms:35},
  lock:{key:'Space',touch:{x:.90,y:.67},hold_ms:35,settle_ms:35}
};}
function region(x,y,width,height){return {selector:'[data-game-canvas]',x,y,width,height};}
function anchor(node,r){return {node,region:r};}
function contracts(model){
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:'Align 3 shield rings. Seal the mosaic.'},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'RINGS {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left','left'],['right','right','right']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'MOSAIC SEALED',failure_text:'SHIELD FRACTURED',max_terminal_latency_ms:100,failure_wait_ms:47000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:'shield-mosaic-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
      {x:0,y:.52,width:.2,height:.35},{x:.2,y:.52,width:.2,height:.35},{x:.4,y:.52,width:.2,height:.35},{x:.6,y:.52,width:.2,height:.35},{x:.8,y:.52,width:.2,height:.35}
    ],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions:actions()
  };
  const commercialContract={
    schema_version:1,review_id:'shield-mosaic-commercial-v1',seed:18,
    visual_legibility:{pairs:[{id:'active-future-segment',kind:'action_availability',a:anchor('1:0:playing',region(.05,.28,.19,.32)),b:anchor('1:0:playing',region(.76,.28,.19,.32)),action_a:'left',action_b:'down',marker:'An active shield segment is a solid luminous plate with three visible orientation notches; a future segment is a recessed dark socket with a broken rim.'}]},
    state_distinction:{pairs:[{id:'segment-orientation',kind:'state',a:anchor('1:0:playing',region(.05,.24,.21,.37)),b:anchor('1:1:playing',region(.05,.24,.21,.37)),state_path:'state.code',marker:'Cycling one segment rotates its large plate geometry, notch direction and energy edge, creating a non-text pixel difference across the whole segment.'}]},
    action_feedback:{probes:[
      {id:'rotate-segment',node:'1:0:playing',action:'left',kind:'movement',region:region(.02,.20,.27,.43)},
      {id:'second-segment',node:'1:0:playing',action:'right',kind:'movement',region:region(.24,.20,.27,.43)},
      {id:'seal-ring',node:'1:8:playing',action:'lock',kind:'unlock',region:region(0,.03,1,.44)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor('1:0:playing',region(0,.03,1,.47)),anchor('2:0:playing',region(0,.03,1,.47)),anchor('3:0:playing',region(0,.03,1,.47))],marker:'The mosaic expands from two to three to four large shield segments; each sealed ring leaves a persistent outer halo, adds denser interlocking geometry and enlarges the central crest.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:'MOSAIC SEALED',failure_title:'SHIELD FRACTURED'},
    audio:{mode:'reviewed_silence',exception:'Shield Mosaic intentionally uses silent visual rotation for this autonomous slot so direct multi-action input, large orientation motion, reduced-motion behavior and queue continuation are evaluated without adding an audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
      {role:'active',foreground:region(.05,.28,.18,.30),background:region(.05,.60,.18,.05)},
      {role:'goal',foreground:region(.39,.08,.22,.13),background:region(.39,.23,.22,.05)}
    ]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and align all three shield rings with fewer unnecessary rotations.'},
    performance:{sample_ms:1200}
  };
  return {productContract,commercialContract};
}
function ruleData(){return {
  seed_mapping:'Each active segment target orientation is 1 or 2, derived from seed + segment index + stage parity.',
  stage_widths:[2,3,4],
  orientations:[0,1,2],
  transform_rule:'At stage s the first s+1 named segment actions are active. Each active action cycles only its own segment orientation 0->1->2->0. Repeating the same segment action three times returns to the identical reviewed state. LOCK changes reviewed state only when all active segment orientations equal the seeded target.',
  target_rule:'Every active target orientation is nonzero. Correct LOCK resets code to zero, increments completed and advances stage; stage3 LOCK succeeds immediately.'
};}
function proposal(model,productContract,commercialContract){
  return {
    game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'phaser shield-orientation puzzle',mechanic_family:'seeded-shield-orientation-mosaic',
    controls:['Arrow keys rotate the matching active shield segment.','Space seals the ring when all orientations match.'],
    mobile_controls:['Tap an active segment command to rotate that plate.','Tap SEAL when the whole ring matches the target crest.'],
    max_repair_attempts:5,
    qa:{seed:18,keyboard:{key:'ArrowLeft',observation:'state.code'},pointer:{observation:'state.code'},terminal_ms:52000},
    implementation_contract:{
      goal:'Show the exact objective "Align 3 shield rings. Seal the mosaic." before Start and keep it visible. Each stage shows 2, then 3, then 4 active shield plates and a large target crest. Every active plate has three geometric orientations. Rotate plates until all orientations match the target, then SEAL. Complete three rings to win.',
      progression:'Canonical state starts stage=1, code=0, outcome="playing", completed=0. Stage widths are 2,3,4 direct segment actions. Each named segment action cycles exactly one base-3 orientation digit. Inactive segment actions and blocked SEAL do not change the reviewed projection. Correct SEAL resets code, increments completed and advances stage; stage3 SEAL immediately sets stage=4 and outcome="success". meaningful_actions increments exactly once for every reviewed projection-changing edge including successful SEAL.',
      presentation:'Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects only through factory-owned PlayJoltPhaserKit. Build an original defensive mosaic with four large plate sockets around a central crest, each plate having three unmistakable geometric orientations. Rotation must move the full plate and its notch geometry, not just recolor it. Stage1 activates two plates, stage2 three, stage3 four; sealed stages add persistent halo rings and interlocking shield bands. Do not use candidate Canvas 2D drawing, create Phaser.Game, create a custom RAF loop or make Phaser physics authoritative.',
      originality:'Shield Mosaic is seeded direct multi-segment orientation composition with three-state plates and explicit ring sealing. It is not beacon height tuning, pulse-thread weaving, gear synchronization, resonance sigils, row/column cycling, cargo assignment, optical routing, auto-running, survival, merge, reaction or single-button timing.',
      difficulty:'Implement the reviewed rule data exactly: '+JSON.stringify(ruleData())+' Stage-entry consequential choice width is exactly 2,3,4. Every target orientation is nonzero, so each active plate requires one or two rotations before SEAL. quality.stage=state.stage. quality.complexity equals active segment count. quality.objective_progress=completed. quality.meaningful_actions increments once per reviewed projection-changing edge. quality.reversible_state_key is stage:code:outcome.',
      mobile_readability:'At 390x844 keep objective, RINGS progress, current score, device best, target crest, active plates, five canvas command zones, result, Replay and replay reason in the first viewport. Critical DOM labels are at least14px and lifecycle controls at least44px. Use large arrows/plate symbols rather than tiny decorative canvas text.',
      result:'Success text is exactly MOSAIC SEALED and failure text exactly SHIELD FRACTURED in data-result. Success interlocks all four plates into a bright complete shield, expands the central crest and emits a bounded radial shard-light bloom. Failure separates two plate edges, dims the crest and leaves a visible fractured gap. Show CURRENT SCORE and DEVICE BEST from GameKit plus primary Replay in the initial mobile result viewport.',
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. GamePresentation.reduced_motion must report actual visible behavior. Normal mode uses Phaser tweens for plate rotation, halo sweep and bounded particles. Reduced mode changes orientation instantly but adds a strong static edge flare and notch outline for at least300ms, with no camera motion. Do not fake compliance through diagnostics.',
      scoring:'Start score0. Award points only on successful SEAL: 250,400,550 minus 15 per extra rotation beyond the seeded shortest target distance, with a floor of150 per ring. Individual rotations, waiting, blocked SEAL and three-rotation reversible cycles never award score. observe returns finite tick, score, progress=floor(tick/60), interactions=meaningful_actions and a bounded entity count.',
      completion_timing:'The stall deadline is 2820 GameKit ticks, about47 seconds at60Hz. Tick advances only through GameKit. At tick>=2820 set outcome="failure" unless success completed on that exact step. core.terminal is immediately true for success or failure; there is no minimum success duration or post-success delay.',
      action_feedback:'Every valid segment rotation immediately marks that plate, shows a large geometric rotation visible around70ms and150ms, and settles by450ms. Correct SEAL adds a persistent halo ring and expands the central crest. Stage3 success creates the complete-shield transformation. Reduced mode uses instant geometry plus a strong static flare. Keep effects bounded and derived only from snapshot state.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(model,productContract,commercialContract){
  const oracleFile=path.join(ROOT,'qa/reviewed/shield-mosaic-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'shield-mosaic-v1',file:'shield-mosaic-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-26',rationale:'Finite base-3 direct-segment graph across six deterministic seeds. Stage-entry widths are 2/3/4, every target digit is nonzero, repeating one active action three times returns to the identical reviewed state, all reachable states are bounded under 128 nodes per seed, and all stages remain solvable.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'shield-mosaic-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-26',rationale:'Reviewed large three-orientation plate distinction, direct segment rotation feedback, 2/3/4-segment progression, persistent ring spectacle, explicit shield result transformation, intentional silence, mobile hierarchy and bounded performance.'});
  product.review(productContract);commercial.review(commercialContract,productContract);
}
async function prepare(){
  const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
  if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
  fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
  const model=oracle(),pair=contracts(model),p=proposal(model,pair.productContract,pair.commercialContract);
  installReviewData(model,pair.productContract,pair.commercialContract);
  const commissioningPolicy=readJSON(path.join(__dirname,'../policy.json'));
  const gate=validateProposal(p,{policy:commissioningPolicy,catalog:readJSON(path.join(__dirname,'../catalog.json'))});
  if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-26'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'autonomous-cycle-reviewed-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const auth={schema:'playjolt-auto-cycle/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner explicitly instructed autonomous PlayJolt development to continue without chat handoffs. This candidate is a pre-reviewed queued slot with build1 + repair5 maximum, provider calls <=6, estimated model cost <=USD2 and Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:'main'};
  for(const [n,d] of Object.entries({'proposal.json':p,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':cp,'authorization.json':auth,'oracle.json':model}))atomicJSON(path.join(root,n),d);
  await new Factory({store:new FileStore(root)}).create(gate.factory_spec);
  console.log(JSON.stringify({preflight:'PASS',game_id:GAME_ID,title:TITLE,runtime:'Phaser 4.2.1 + GameKit v2',oracle_hash:hash(model),product_hash:hash(pair.productContract),commercial_hash:hash(pair.commercialContract),warnings:gate.warnings},null,2));
}
function reviews(){
  const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!root||!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');
  const model=oracle(),pair=contracts(model),stored=readJSON(path.join(root,'proposal.json'));
  if(stored.game_id!==GAME_ID||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(pair.productContract)||hash(stored.commercial_contract)!==hash(pair.commercialContract))throw Error('recovery_contract_mismatch');
  installReviewData(model,pair.productContract,pair.commercialContract);
  console.log(JSON.stringify({reviews:'PASS',game_id:GAME_ID,runtime:'Phaser 4.2.1',permissions:'0644'},null,2));
}
async function run(){
  const root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json')),policyFile=path.join(root,'control-policy.json');
  const worker=new AutonomousWorker({root,settings,policyFile,provider:new OpenAIProvider(),qa:new DockerQA({limits:settings.isolation})});
  const result=await worker.runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));
  if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;
}
function summarize(){
  const root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};
  const ops=Object.values(ledger.operations).filter(x=>x.game_id===GAME_ID).sort((a,b)=>a.started_at-b.started_at).map(o=>({operation_id:o.operation_id,version:o.version,state:o.state,response_id:o.response_id,input_tokens:o.accounted?.input_tokens??null,output_tokens:o.accounted?.output_tokens??null,estimated_cost:(o.accounted||o.reserved)?.estimated_cost??null,error_code:o.error_code||null}));
  const m=readJSON(path.join(root,'autonomy/jobs',GAME_ID,'manifest.json')),total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);
  const summary={schema:'playjolt-auto-cycle/1',game_id:GAME_ID,title:TITLE,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
  atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];
Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
