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

const GAME_ID='GAME-20260924-181',TITLE='Pulse Loom',SLUG='pulse-loom';
const seeds=[6,7,8,9,10,11], actionNames=['left','right','up','down'];
function packIndex(seed){return (seed>>>0)%4;}
function activeCount(stage){return stage+1;}
function flip(code,index){return code^(1<<index);}
function targetFor(pack,stage){
  const n=activeCount(stage);let code=0;
  for(let j=0;j<stage;j++)code|=1<<((pack+j)%n);
  return code;
}
const id=v=>v.join(':');
function transitions(v,pack){
  const [stage,mask,outcome]=v;if(outcome!=='playing')return [];
  const n=activeCount(stage),edges=[];
  for(let i=0;i<n;i++)edges.push({action:actionNames[i],values:[stage,flip(mask,i),outcome]});
  if(mask===targetFor(pack,stage)){
    if(stage<3)edges.push({action:'lock',values:[stage+1,0,'playing']});
    else edges.push({action:'lock',values:[4,0,'success']});
  }
  return edges;
}
function graph(pack){
  const initial=[1,0,'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(v,pack);
    nodes[k]={values:v,stage:v[0],...(v[2]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function oracle(){
  const model={schema_version:1,projection:['state.stage','state.mask','state.outcome'],seeds:{}};
  for(const seed of seeds)model.seeds[String(seed)]=graph(packIndex(seed));
  product.validateModel(model);return model;
}
function actions(){return {
  left:{key:'ArrowLeft',touch:{x:.10,y:.64},hold_ms:35,settle_ms:35},
  right:{key:'ArrowRight',touch:{x:.30,y:.64},hold_ms:35,settle_ms:35},
  up:{key:'ArrowUp',touch:{x:.50,y:.64},hold_ms:35,settle_ms:35},
  down:{key:'ArrowDown',touch:{x:.70,y:.64},hold_ms:35,settle_ms:35},
  lock:{key:'Space',touch:{x:.90,y:.64},hold_ms:35,settle_ms:35}
};}
function region(x,y,width,height){return {selector:'[data-game-canvas]',x,y,width,height};}
function anchor(node,r){return {node,region:r};}
function contracts(model){
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:'Weave 3 pulse rows. Seal the Loom.'},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'ROWS {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left'],['right','right']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'LOOM SEALED',failure_text:'PULSE THREAD BROKE',max_terminal_latency_ms:100,failure_wait_ms:41000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:'pulse-loom-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:48},
    mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
      {x:0,y:.48,width:.2,height:.35},{x:.2,y:.48,width:.2,height:.35},{x:.4,y:.48,width:.2,height:.35},{x:.6,y:.48,width:.2,height:.35},{x:.8,y:.48,width:.2,height:.35}
    ],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions:actions()
  };
  const commercialContract={
    schema_version:1,review_id:'pulse-loom-commercial-v1',seed:6,
    visual_legibility:{pairs:[{id:'active-inactive-thread',kind:'action_availability',a:anchor('1:0:playing',region(.025,.49,.15,.23)),b:anchor('1:0:playing',region(.825,.49,.15,.23)),action_a:'left',action_b:'down',marker:'An active loom pad has a bright cyan pulse core and woven border; an inactive future pad is a dark empty socket with a broken outline.'}]},
    state_distinction:{pairs:[{id:'thread-off-on',kind:'state',a:anchor('1:0:playing',region(.025,.49,.15,.23)),b:anchor('1:1:playing',region(.025,.49,.15,.23)),state_path:'state.mask',marker:'Turning a thread on changes its core fill, outer weave, and the non-text beam reaching the central loom.'}]},
    action_feedback:{probes:[
      {id:'thread-pulse',node:'1:0:playing',action:'left',kind:'movement',region:region(0,.46,.22,.32)},
      {id:'seal-row',node:'1:1:playing',action:'lock',kind:'unlock',region:region(0,.02,1,.42)},
      {id:'third-thread',node:'2:0:playing',action:'up',kind:'movement',region:region(.38,.46,.24,.32)}
    ]},
    motion:{intermediate_ms:[60,130],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor('1:0:playing',region(0,.02,1,.40)),anchor('2:0:playing',region(0,.02,1,.40)),anchor('3:0:playing',region(0,.02,1,.40))],marker:'The loom grows from two pulse threads to three and then four; each sealed row adds a persistent luminous band, more cross-weave geometry and a larger central prism.'},
    result_presentation:{region:region(0,.82,1,.18),success_title:'LOOM SEALED',failure_title:'PULSE THREAD BROKE'},
    audio:{mode:'reviewed_silence',exception:'Pulse Loom intentionally uses silent visual rhythm so the first Phaser experiment isolates rendering, motion, hierarchy and input quality without adding an audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
      {role:'active',foreground:region(.03,.5,.14,.20),background:region(.03,.75,.14,.06)},
      {role:'goal',foreground:region(.42,.12,.16,.10),background:region(.42,.28,.16,.06)}
    ]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and weave all three rows with fewer unnecessary thread flips.'},
    performance:{sample_ms:1200}
  };
  return {productContract,commercialContract};
}
function ruleData(){return {
  seed_mapping:'pack = seed % 4',
  stage_widths:[2,3,4],
  transform_rule:'At stage s, the first s+1 named thread actions are active. Each active action flips only its own reviewed mask bit. Repeating the same action twice returns to the identical reviewed state. LOCK changes reviewed state only when the exact seed-rotated target mask is present.',
  target_rule:'Stage s target contains exactly s ON bits, starting at pack mod active_count and wrapping. Correct LOCK resets mask to zero, increments completed and advances stage; stage3 LOCK succeeds.'
};}
function proposal(model,productContract,commercialContract){
  return {
    game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'phaser pulse-weaving puzzle',mechanic_family:'seeded-pulse-thread-weaving',
    controls:['Arrow keys flip active pulse threads.','Space seals the row when its pattern is correct.'],
    mobile_controls:['Tap one of the active thread pads.','Tap SEAL when the row matches the target.'],
    max_repair_attempts:5,
    qa:{seed:6,keyboard:{key:'ArrowLeft',observation:'state.mask'},pointer:{observation:'state.pointer_actions'},terminal_ms:45000},
    implementation_contract:{
      goal:'Show the exact objective "Weave 3 pulse rows. Seal the Loom." before Start and keep it visible. Each stage shows a target constellation and active thread pads. The player flips threads until the visible row matches the target, then presses SEAL. Finish three rows to win.',
      progression:'Canonical state starts stage=1, mask=0, outcome="playing", completed=0. Stage widths are 2,3,4 active thread actions. Active thread actions flip exactly one reviewed bit; inactive actions and blocked SEAL do not change the reviewed projection. Correct SEAL resets mask, increments completed and advances stage; stage3 SEAL immediately sets stage=4 and outcome="success". pointer_actions increments for accepted pointer/touch attempts; meaningful_actions increments only for reviewed projection-changing edges.',
      presentation:'This is the first Phaser-backed real candidate. Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects through factory-owned PlayJoltPhaserKit only. Create an original neon loom: five bottom thread sockets, a central prism, target constellation near the top, and non-text beams connecting ON threads into the loom. Stage1 uses two active threads; stage2 three plus one persistent woven band; stage3 four plus two woven bands and a larger prism. Do not use candidate Canvas 2D drawing, create Phaser.Game, create a custom RAF loop, or make Phaser physics authoritative.',
      originality:'Pulse Loom uses seeded pulse-thread weaving: a seed rotates the target pattern while each reversible thread flip affects one explicit strand, and the player seals increasingly wide rows. It is not coupled gear synchronization, resonance sigil composition, row/column cycling, cargo assignment, optical routing, auto-running, survival or single-button timing.',
      difficulty:'Implement the reviewed rule data exactly: '+JSON.stringify(ruleData())+' At each stage entry, consequential choice width is 2,3,4 and the shortest target requires exactly 1,2,3 thread flips plus SEAL. quality.stage=state.stage. quality.complexity equals active thread count. quality.objective_progress=completed. quality.meaningful_actions increments once for every reviewed projection-changing edge including successful SEAL, never for blocked SEAL or inactive actions. quality.reversible_state_key is stage:mask:outcome.',
      mobile_readability:'At 390x844 keep objective, ROWS progress, current score, device best, target constellation, active threads, result, Replay and replay reason in the first viewport. Critical DOM text is at least14px, canvas labels are at least14px, and lifecycle controls are at least44px. Avoid small decorative text inside the Phaser canvas; use large non-text pulse symbols and color plus shape.',
      result:'Success text is exactly LOOM SEALED and failure text exactly PULSE THREAD BROKE in data-result. Success expands the prism, joins all threads into three broad luminous woven bands and emits a bounded particle bloom. Failure visibly snaps two beams, dims the prism and offsets the weave. Show CURRENT SCORE and DEVICE BEST from GameKit and the primary Replay action in the initial mobile result viewport.',
      reduced_motion:'Honor both initial and live prefers-reduced-motion changes. GamePresentation.reduced_motion must reflect actual visible behavior, not only platform state. Normal mode uses Phaser tweens for beam travel, prism pulse and bounded particles. Reduced mode removes travel and camera motion but instantly changes thread fill, beam presence and a strong static outline for at least300ms. Do not fake compliance through diagnostics.',
      scoring:'Start score0. Award points only on a successful row SEAL: 200,300,400 minus 20 per extra flip beyond par 1,2,3 with a floor of100 per row. Individual flips, reversible pairs, waiting, blocked SEAL and inactive actions never increase score. observe returns finite tick, score, progress=floor(tick/60), interactions=meaningful_actions and a bounded entity count.',
      completion_timing:'The stall deadline is 2460 GameKit ticks, about41 seconds at60Hz. Tick advances only through GameKit. At tick>=2460 set outcome="failure" unless success completed on that exact step. core.terminal is immediately true for success or failure; there is no minimum success duration or post-success delay.',
      action_feedback:'Every valid thread flip immediately highlights the selected socket, shows a Phaser beam/tween transition at roughly60ms and130ms, and settles by450ms into a stable ON/OFF state. Correct SEAL adds a persistent woven band and visibly expands the loom. Stage3 success creates a large prism transformation. Reduced mode uses static pulse/outline changes instead of travel. Keep effects bounded and deterministic from snapshot state.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(model,productContract,commercialContract){
  const oracleFile=path.join(ROOT,'qa/reviewed/pulse-loom-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'pulse-loom-v1',file:'pulse-loom-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-24',rationale:'Finite binary thread graph across six deterministic seeds. Stage-entry widths are 2/3/4, shortest target flips are 1/2/3 before SEAL, each thread action has a one-input inverse by repeating it, and all reachable reviewed states remain bounded and solvable.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'pulse-loom-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-24',rationale:'Reviewed active/inactive thread visibility, ON/OFF state distinction, Phaser action transitions, three-stage loom growth, explicit result transformation, intentional silence, mobile hierarchy and bounded performance using normal-player regions only.'});
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
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-24'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'eighth-real-game-phaser-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const auth={schema:'playjolt-eighth-run/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner approved the phased Phaser rollout and explicitly instructed development to continue. This authorizes exactly one bounded Phaser-backed eighth candidate after zero-paid preflight. Build1 + repair5 maximum, estimated provider ceiling USD2, Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:'3f490d26ba987bb9aabfe39e5e0527c7b1f241f8'};
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
  const summary={schema:'playjolt-eighth-real-game/1',game_id:GAME_ID,title:TITLE,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
  atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];
Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
