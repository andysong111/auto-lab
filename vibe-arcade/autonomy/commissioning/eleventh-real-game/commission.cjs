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

const GAME_ID='GAME-20260926-211',TITLE='Vector Parade',SLUG='vector-parade';
const seeds=[24,25,26,27,28,29], names=['left','right','up','down'];
function countFor(stage){return stage+2;}
function canonical(n){return Array.from({length:n},(_,i)=>String(i)).join('');}
function swap(order,index){const a=order.split(''),t=a[index];a[index]=a[index+1];a[index+1]=t;return a.join('');}
function targetFor(seed,stage){
  const n=countFor(stage),a=Array.from({length:n},(_,i)=>String(i));
  const r=(seed+stage)%n,rot=a.slice(r).concat(a.slice(0,r));
  if((seed+stage)%2)rot.reverse();
  let out=rot.join('');
  if(out===canonical(n))out=swap(out,0);
  return out;
}
const id=v=>v.join(':');
function transitions(v,seed){
  const [stage,order,outcome]=v;if(outcome!=='playing')return [];
  const n=countFor(stage),edges=[];
  for(let i=0;i<n-1;i++)edges.push({action:names[i],values:[stage,swap(order,i),outcome]});
  if(order===targetFor(seed,stage)){
    if(stage<3)edges.push({action:'lock',values:[stage+1,canonical(countFor(stage+1)),'playing']});
    else edges.push({action:'lock',values:[4,'','success']});
  }
  return edges;
}
function graph(seed){
  const initial=[1,canonical(3),'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(v,seed);
    nodes[k]={values:v,stage:v[0],...(v[2]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function oracle(){
  const model={schema_version:1,projection:['state.stage','state.order','state.outcome'],seeds:{}};
  for(const seed of seeds)model.seeds[String(seed)]=graph(seed);
  product.validateModel(model);return model;
}
function actions(){return {
  left:{key:'ArrowLeft',touch:{x:.10,y:.68},hold_ms:35,settle_ms:35},
  right:{key:'ArrowRight',touch:{x:.30,y:.68},hold_ms:35,settle_ms:35},
  up:{key:'ArrowUp',touch:{x:.50,y:.68},hold_ms:35,settle_ms:35},
  down:{key:'ArrowDown',touch:{x:.70,y:.68},hold_ms:35,settle_ms:35},
  lock:{key:'Space',touch:{x:.90,y:.68},hold_ms:35,settle_ms:35}
};}
function region(x,y,width,height){return {selector:'[data-game-canvas]',x,y,width,height};}
function anchor(node,r){return {node,region:r};}
function contracts(model){
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:'Order 3 vector lines. Lock the parade.'},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'LINES {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left'],['right','right']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'PARADE LOCKED',failure_text:'FORMATION BROKE',max_terminal_latency_ms:100,failure_wait_ms:47000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:'vector-parade-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
      {x:0,y:.53,width:.2,height:.34},{x:.2,y:.53,width:.2,height:.34},{x:.4,y:.53,width:.2,height:.34},{x:.6,y:.53,width:.2,height:.34},{x:.8,y:.53,width:.2,height:.34}
    ],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions:actions()
  };
  const commercialContract={
    schema_version:1,review_id:'vector-parade-commercial-v1',seed:24,
    visual_legibility:{pairs:[{id:'active-future-swap',kind:'action_availability',a:anchor('1:012:playing',region(.03,.48,.27,.24)),b:anchor('1:012:playing',region(.72,.48,.25,.24)),action_a:'left',action_b:'down',marker:'An active adjacent-swap gate is a bright bridge joining two visible vector cards; a future gate is a dark broken connector without the luminous exchange arrow.'}]},
    state_distinction:{pairs:[{id:'first-swap',kind:'state',a:anchor('1:012:playing',region(.05,.22,.58,.34)),b:anchor('1:102:playing',region(.05,.22,.58,.34)),state_path:'state.order',marker:'Swapping the first pair visibly exchanges two large cards, their arrow emblems and their spatial positions; the distinction is geometric rather than text-only.'}]},
    action_feedback:{probes:[
      {id:'swap-first-pair',node:'1:012:playing',action:'left',kind:'movement',region:region(.03,.20,.48,.43)},
      {id:'swap-second-pair',node:'1:012:playing',action:'right',kind:'movement',region:region(.28,.20,.48,.43)},
      {id:'lock-line',node:'1:021:playing',action:'lock',kind:'unlock',region:region(0,.03,1,.45)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor('1:012:playing',region(0,.03,1,.47)),anchor('2:0123:playing',region(0,.03,1,.47)),anchor('3:01234:playing',region(0,.03,1,.47))],marker:'The parade expands from three to four to five vector cards; each locked line leaves a persistent luminous route, adds a new card and enlarges the central formation crest.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:'PARADE LOCKED',failure_title:'FORMATION BROKE'},
    audio:{mode:'reviewed_silence',exception:'Vector Parade intentionally stays silent for this queued slot so adjacent-swap motion, direct multi-action input, reduced-motion behavior and autonomous queue continuation are evaluated without adding an audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
      {role:'active',foreground:region(.05,.24,.20,.28),background:region(.05,.56,.20,.05)},
      {role:'goal',foreground:region(.38,.08,.24,.13),background:region(.38,.23,.24,.05)}
    ]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and lock all three vector lines with fewer unnecessary adjacent swaps.'},
    performance:{sample_ms:1200}
  };
  return {productContract,commercialContract};
}
function ruleData(){return {
  seed_mapping:'Target permutation is a deterministic rotation/reversal of the canonical order using seed and stage, with identity replaced by one adjacent swap.',
  stage_sizes:[3,4,5],
  active_swap_widths:[2,3,4],
  transform_rule:'At each stage the first n-1 named actions are active adjacent-swap gates. Each action swaps exactly one neighboring pair and is its own inverse. LOCK changes reviewed state only when the whole visible order equals the seeded target permutation.',
  target_rule:'Correct LOCK resets the next stage to canonical ascending order, increments completed and advances; stage3 LOCK succeeds immediately.'
};}
function proposal(model,productContract,commercialContract){
  return {
    game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'phaser adjacent-swap ordering puzzle',mechanic_family:'seeded-adjacent-swap-vector-ordering',
    controls:['Arrow keys swap the corresponding adjacent vector pair.','Space locks the line when the order matches.'],
    mobile_controls:['Tap a lit swap gate to exchange its neighboring cards.','Tap LOCK when the full parade matches the target crest.'],
    max_repair_attempts:5,
    qa:{seed:24,keyboard:{key:'ArrowLeft',observation:'state.order'},pointer:{observation:'state.order'},terminal_ms:52000},
    implementation_contract:{
      goal:'Show the exact objective "Order 3 vector lines. Lock the parade." before Start and keep it visible. Each stage shows 3, then 4, then 5 large distinct vector cards plus a target formation. Adjacent swap gates exchange neighboring cards. Match the full visible order and press LOCK. Complete three lines to win.',
      progression:'Canonical state starts stage=1, order="012", outcome="playing", completed=0. Stage sizes are 3,4,5 cards with 2,3,4 active adjacent-swap actions. Each named action swaps exactly one adjacent pair and is an exact self-inverse. Inactive swap actions and blocked LOCK do not change the reviewed projection. Correct LOCK resets the next stage to canonical ascending order, increments completed and advances; stage3 LOCK immediately sets stage=4 and outcome="success". meaningful_actions increments exactly once for every reviewed projection-changing edge including successful LOCK.',
      presentation:'Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects only through factory-owned PlayJoltPhaserKit. Create an original vector parade: large shield-like cards on a horizontal rail, luminous bridges between adjacent cards, a target crest above and persistent route bands for completed stages. A swap must visibly exchange the physical positions of both cards with a crossing arc; later stages add one card and one swap bridge. Do not use candidate Canvas 2D drawing, create Phaser.Game, create a custom RAF loop or make Phaser physics authoritative.',
      originality:'Vector Parade is seeded permutation ordering by reversible adjacent swaps across increasingly long formations. It is not shield orientation composition, beacon height tuning, pulse weaving, toroidal row/column cycling, cargo assignment, optical routing, auto-running, survival, merge, reaction or single-button timing.',
      difficulty:'Implement the reviewed rule data exactly: '+JSON.stringify(ruleData())+' Stage-entry consequential choice width is exactly 2,3,4. quality.stage=state.stage. quality.complexity equals active adjacent-swap count. quality.objective_progress=completed. quality.meaningful_actions increments once per reviewed projection-changing edge. quality.reversible_state_key is stage:order:outcome.',
      mobile_readability:'At 390x844 keep objective, LINES progress, current score, device best, target formation, active cards, swap gates, result, Replay and replay reason in the first viewport. Critical DOM labels are at least14px and lifecycle controls at least44px. Canvas cards and swap gates must remain large enough to distinguish without small text.',
      result:'Success text is exactly PARADE LOCKED and failure text exactly FORMATION BROKE in data-result. Success aligns all five cards into a broad luminous formation, connects every bridge and raises the central crest with a bounded particle ribbon. Failure separates the rail into visible broken gaps and offsets two cards. Show CURRENT SCORE and DEVICE BEST from GameKit plus primary Replay in the initial mobile result viewport.',
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. GamePresentation.reduced_motion must report actual visible behavior. Normal mode uses Phaser tweens for crossing card swaps, bridge sweeps and bounded particles. Reduced mode exchanges card positions instantly but adds a strong static outline/cross marker for at least300ms, with no camera motion. Do not fake compliance through diagnostics.',
      scoring:'Start score0. Award points only on successful LOCK: 250,400,550 minus 15 per extra swap beyond the shortest path for that seeded stage, with a floor of150 per line. Individual swaps, waiting, blocked LOCK and immediate inverse swap pairs never award score. observe returns finite tick, score, progress=floor(tick/60), interactions=meaningful_actions and a bounded entity count.',
      completion_timing:'The stall deadline is 2820 GameKit ticks, about47 seconds at60Hz. Tick advances only through GameKit. At tick>=2820 set outcome="failure" unless success completed on that exact step. core.terminal is immediately true for success or failure; there is no minimum success duration or post-success delay.',
      action_feedback:'Every valid adjacent swap immediately highlights its bridge, shows both cards crossing with visible intermediate positions around70ms and150ms, and settles by450ms. Correct LOCK adds a persistent route band and expands the crest. Stage3 success creates the complete-formation transformation. Reduced mode uses instant exchange plus a strong static cross/outline cue. Keep effects bounded and derived only from snapshot state.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(model,productContract,commercialContract){
  const oracleFile=path.join(ROOT,'qa/reviewed/vector-parade-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'vector-parade-v1',file:'vector-parade-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-26',rationale:'Finite permutation graph across six deterministic seeds. Stage sizes 3/4/5 yield exactly 6/24/120 permutations, each adjacent swap is self-inverse, stage-entry consequential widths are 2/3/4, all states are connected and each seed has a bounded success path.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'vector-parade-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-26',rationale:'Reviewed large physical adjacent-card exchange, legal-vs-future swap gate distinction, 3/4/5-card progression, persistent route spectacle, explicit result formation, intentional silence, mobile hierarchy and bounded performance.'});
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
  const auth={schema:'playjolt-auto-cycle/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner explicitly instructed autonomous PlayJolt development to continue without chat handoffs. This is a pre-reviewed queued candidate with build1 + repair5 maximum, provider calls <=6, estimated model cost <=USD2 and Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:'main'};
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
  const file=path.join(root,'autonomy/jobs',GAME_ID,'manifest.json');
  if(!fs.existsSync(file)){console.log(JSON.stringify({schema:'playjolt-auto-cycle/1',game_id:GAME_ID,title:TITLE,operations:ops,total_calls:ops.length,total_estimated_cost:Number(ops.reduce((n,o)=>n+(o.estimated_cost||0),0).toFixed(8)),factory:null,production_authorized:false},null,2));return;}
  const m=readJSON(file),total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);
  const summary={schema:'playjolt-auto-cycle/1',game_id:GAME_ID,title:TITLE,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
  atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];
Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
