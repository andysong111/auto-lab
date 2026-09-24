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

const GAME_ID='GAME-20260924-171',TITLE='Chrona Mesh',SLUG='chrona-mesh';
const seeds=[6,7,8,9,10,11];
const actionNames=['left','right','up','down'];
const solutionSequences={1:[0],2:[0,1],3:[0,0,1]};

function packIndex(seed){return (seed>>>0)%6;}
function activeCount(stage){return stage+1;}
function decode(code,n){const out=[];for(let i=0;i<n;i++){out.push(code%3);code=Math.floor(code/3);}return out;}
function encode(v){let code=0,p=1;for(const x of v){code+=x*p;p*=3;}return code;}
function vectorFor(pack,stage,index){
 const n=activeCount(stage),v=Array(n).fill(0),p=(index+(pack%n))%n;
 v[p]=(v[p]+1)%3;v[(p+1)%n]=(v[(p+1)%n]+2)%3;return v;
}
function apply(code,pack,stage,index){
 const n=activeCount(stage),v=decode(code,n),delta=vectorFor(pack,stage,index);
 for(let i=0;i<n;i++)v[i]=(v[i]+delta[i])%3;return encode(v);
}
function targetFor(pack,stage){let code=0;for(const i of solutionSequences[stage])code=apply(code,pack,stage,i);return code;}
const id=v=>v.join(':');
function transitions(v,pack){
 const [stage,code,outcome]=v;if(outcome!=='playing')return [];
 const n=activeCount(stage),edges=[];
 for(let i=0;i<n;i++)edges.push({action:actionNames[i],values:[stage,apply(code,pack,stage,i),outcome]});
 if(code===targetFor(pack,stage)){
  if(stage<3)edges.push({action:'lock',values:[stage+1,0,outcome]});
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
 const model={schema_version:1,projection:['state.stage','state.phase_code','state.outcome'],seeds:{}};
 for(const seed of seeds)model.seeds[String(seed)]=graph(packIndex(seed));
 product.validateModel(model);return model;
}
function actions(){
 return {
  left:{key:'ArrowLeft',touch:{x:.20,y:.45},hold_ms:35,settle_ms:35},
  right:{key:'ArrowRight',touch:{x:.80,y:.45},hold_ms:35,settle_ms:35},
  up:{key:'ArrowUp',touch:{x:.50,y:.18},hold_ms:35,settle_ms:35},
  down:{key:'ArrowDown',touch:{x:.50,y:.80},hold_ms:35,settle_ms:35},
  lock:{key:'Space',touch:{x:.50,y:.53},hold_ms:35,settle_ms:35}
 };
}
function contracts(model){
 const oracleHash=hash(model);
 const productContract={
  schema_version:1,
  objective:{visible_selector:'[data-objective]',expected_text:'Synchronize 3 gear trains. Open the Chrona Gate.'},
  progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'TRAINS {value} / 3',milestones:[1,2,3]},
  score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left','left'],['right','right','right']],no_progress_probes:[['lock']]},
  best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
  completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'CHRONA GATE OPEN',failure_text:'GEAR TRAIN STALLED',max_terminal_latency_ms:100,failure_wait_ms:42500,failure_actions:[]},
  replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
  difficulty:{deterministic_seeds:seeds,oracle_id:'chrona-mesh-v1',oracle_sha256:oracleHash,projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
  mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
   {x:.08,y:.33,width:.25,height:.25},{x:.67,y:.33,width:.25,height:.25},{x:.375,y:.04,width:.25,height:.22},{x:.375,y:.68,width:.25,height:.22},{x:.36,y:.40,width:.28,height:.22}
  ],min_font_px:14,min_hit_target_px:44},
  reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
  feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
  actions:actions()
 };
 const commercialContract={
  schema_version:1,review_id:'chrona-mesh-commercial-v1',seed:6,
  visual_legibility:{pairs:[{id:'active-vs-socket',kind:'action_availability',
   a:{node:'1:0:playing',region:{selector:'[data-game-canvas]',x:.08,y:.33,width:.25,height:.25}},
   b:{node:'1:0:playing',region:{selector:'[data-game-canvas]',x:.375,y:.04,width:.25,height:.22}},
   action_a:'left',action_b:'up',marker:'An active brass gear has a bright ivory tooth ring and central phase jewel; a future inactive position is a dark empty bearing socket with a broken outer bracket.'}]},
  state_distinction:{pairs:[
   {id:'gear-phase-zero-one',kind:'state',a:{node:'1:0:playing',region:{selector:'[data-game-canvas]',x:.08,y:.33,width:.25,height:.25}},b:{node:'1:7:playing',region:{selector:'[data-game-canvas]',x:.08,y:.33,width:.25,height:.25}},state_path:'state.phase_code',marker:'A rotated gear visibly changes tooth orientation, jewel segment and coupling spoke position instead of only changing text.'},
   {id:'train-one-two',kind:'state',a:{node:'1:7:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},b:{node:'2:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},state_path:'state.stage',marker:'Locking train one expands the mechanism from two large gears to three meshed gears and adds a persistent luminous timing ring around the central gate.'}
  ]},
  action_feedback:{probes:[
   {id:'spin',node:'1:0:playing',action:'left',kind:'movement',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},
   {id:'lock-train',node:'1:7:playing',action:'lock',kind:'unlock',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},
   {id:'mesh-third',node:'2:0:playing',action:'up',kind:'movement',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}}
  ]},
  motion:{intermediate_ms:[60,140],settle_ms:500},
  progression_spectacle:{checkpoints:[
   {node:'1:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},
   {node:'2:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}},
   {node:'3:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82}}
  ],marker:'The mechanism grows from a two-gear brass escapement into a three-gear clock train and finally a four-gear celestial mesh with an expanded central gate, additional outer timing rings, more coupling spokes and a larger illuminated silhouette.'},
  result_presentation:{region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.82},success_title:'CHRONA GATE OPEN',failure_title:'GEAR TRAIN STALLED'},
  audio:{mode:'reviewed_silence',exception:'Chrona Mesh intentionally uses silent tactile visual feedback so timing, phase, mute state and audio cleanup cannot distract from the deterministic gear-reading puzzle.'},
  mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
   {role:'active',foreground:{selector:'[data-game-canvas]',x:.13,y:.37,width:.16,height:.16},background:{selector:'[data-game-canvas]',x:.01,y:.38,width:.07,height:.09}},
   {role:'goal',foreground:{selector:'[data-game-canvas]',x:.43,y:.43,width:.14,height:.14},background:{selector:'[data-game-canvas]',x:.43,y:.02,width:.14,height:.08}}
  ]},
  replay_motivation:{selector:'[data-replay-reason]',reason:'Replay this seed to recognize the coupled gear vectors and synchronize all three trains with fewer wasted rotations.'},
  performance:{sample_ms:1600}
 };
 return {productContract,commercialContract};
}
function ruleData(){
 return {
  seed_mapping:'pack = seed % 6',
  solution_sequences:solutionSequences,
  transform_rule:'At stage s there are n=s+1 active gear actions. Action index i maps primary=(i+(pack%n))%n, adds +1 mod3 to that gear and +2 mod3 to the next gear. Repeating the same action three times returns to the identical phase state.',
  target_rule:'Stage targets are produced from phase_code 0 by action-index sequences [0], [0,1], [0,0,1] for stages 1,2,3. LOCK changes state only at the exact stage target, resetting phase_code to 0 and advancing stage/completed; stage3 LOCK succeeds.'
 };
}
function proposal(model,productContract,commercialContract){
 const rules=JSON.stringify(ruleData());
 return {
  game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'clockwork synchronization puzzle',mechanic_family:'coupled-gear-phase-synchronization',
  controls:['Arrow keys rotate coupled gears.','Space locks a synchronized train.'],
  mobile_controls:['Tap a gear to rotate its coupled pair.','Tap the center gate to LOCK a synchronized train.'],
  max_repair_attempts:5,
  qa:{seed:6,keyboard:{key:'ArrowLeft',observation:'state.phase_code'},pointer:{observation:'state.pointer_actions'},terminal_ms:45000},
  implementation_contract:{
   goal:'Show the exact objective "Synchronize 3 gear trains. Open the Chrona Gate." before Start and keep it visible. The player reads phase jewels and gear teeth, rotates coupled gears, and presses LOCK only when the current train reaches the reviewed synchronization target.',
   progression:'Canonical state starts stage=1, phase_code=0, outcome="playing", completed=0. Stages contain two, three and four active gears. Arrow actions apply reviewed coupled mod-3 transforms; LOCK is a no-op unless phase_code equals the exact reviewed target. Correct LOCK resets phase_code, increments completed, advances stage, and after stage3 immediately sets stage=4 and outcome="success". Track pointer_actions, meaningful_actions, stage_rotations and total_rotations outside the reviewed projection. pointer_actions increments for every accepted pointer/touch attempt, even when the named action is inactive or LOCK is blocked; meaningful_actions increments only for reviewed projection-changing edges. No hidden state may change legal transitions.',
   presentation:'Use an original celestial clockwork aesthetic with deep charcoal metal, high-contrast ivory/brass gears, cyan phase jewels and restrained violet gate light. Fixed control geometry: LEFT gear center near 20%/45%, RIGHT near80%/45%, UP near50%/18%, DOWN near50%/80%, central LOCK gate near50%/53%. Stage1 visibly has two large meshed gears; stage2 adds a third upper gear and a full timing ring; stage3 adds a fourth lower gear, a second outer timing ring, denser coupling spokes and a substantially larger glowing gate. Settled frames remain stable. Core is DOM-free and exported only via globalThis.ChronaMeshCore. GameKit owns lifecycle and simulation timing. No external assets or network.',
   originality:'Chrona Mesh uses the new coupled-gear-phase-synchronization family: each gear rotation changes two phase wheels in a reversible mod-3 relationship, and players solve three increasingly wide gear trains before locking them. It is not Ember Choir XOR sigil composition, Ribbon Shift row/column cycling, Keywake navigation, Shard Armada salvo recruitment, Cloud Cargo assignment, Prism optical routing, a timing-only game, an auto-runner or arena survival.',
   difficulty:'Implement this exact reviewed RULE DATA: '+rules+' Six deterministic seeds cover packs0-5. Every active gear branch is reversible by repeating that same gear twice more. The independently reviewed shortest stage solutions require one rotation+LOCK, then two rotations+LOCK, then three rotations+LOCK, so both consequential choice width and required actions strictly increase 2/3/4 and 2/3/4 across stages. quality.stage=state.stage. quality.complexity equals the number of distinct immediately reachable changed reviewed projection states at the current stage entry. quality.objective_progress=completed. quality.meaningful_actions increases exactly once for every reviewed projection-changing edge including successful LOCK, never for blocked LOCK or inactive actions. quality.reversible_state_key is stage:phase_code:outcome.',
   mobile_readability:'At390x844 keep objective, TRAINS progress, current score, device best, full gear mechanism, result, Replay and replay reason in the first viewport. Critical DOM text is at least14px and lifecycle controls at least44px. Canvas action regions and touch centers must match the reviewed Product Contract exactly. Avoid small canvas labels; communicate gear phases with large tooth orientation, jewel wedges and coupling spokes. Keep visible text under650 characters. data-game-progress remains finite elapsed integer seconds while data-product-progress is exactly TRAINS {completed} / 3.',
   result:'Success text is exactly CHRONA GATE OPEN and failure text exactly GEAR TRAIN STALLED in data-result. On success all four gears align, the central gate expands into a bright geometric aperture and two broad non-text timing halos lock into place. On failure the train desynchronizes into offset teeth, dim phase jewels and a visibly jammed central gate. Show CURRENT SCORE and DEVICE BEST from GameKit and the primary Replay action in the initial mobile result viewport.',
   reduced_motion:'Honor initial and live prefers-reduced-motion changes in both directions. presentation() exposes reduced_motion, feedback_active and static_feedback from real visible behavior. Normal motion uses visible tooth rotation/coupling sweep between before,60ms,140ms and settled frames. Reduced mode removes rotational travel and sweeping rays but immediately changes tooth/jewel phase plus a strong static coupling outline for at least300ms. Do not fake compliance through diagnostics-only state.',
   scoring:'Start score0. Award points only when a whole train is successfully LOCKED: stage1 200, stage2 300, stage3 400 minus 15 points per rotation beyond par [1,2,3], with a floor of100 per stage. Individual rotations, three-step reversible cycles, waiting, blocked LOCK and inactive controls never increase score. Reset stage_rotations after each successful LOCK. observe returns finite tick, score, progress=floor(tick/60), interactions=meaningful_actions and a bounded entity count.',
   completion_timing:'The shared stall deadline is 2520 GameKit ticks, about42 seconds at60Hz. Tick advances only through GameKit. At tick>=2520 set outcome="failure" unless success was completed on that exact step. core.terminal is true immediately for success or failure; there is no minimum success duration and no post-success waiting. Pause, hidden and page lifecycle remain GameKit-owned.',
   action_feedback:'Every gear rotation visibly acknowledges the selected gear immediately, shows coupled tooth/jewel motion around60ms, a stronger coupling spoke or phase pulse around140ms, and settles by500ms in the new stable phase. Correct LOCK visibly clamps the current train, adds the next persistent gear/ring and enlarges the gate. Stage3 success produces a large aperture transformation. Reduced mode uses static phase/jewel/coupling changes instead of travel. This candidate intentionally uses reviewed silence; do not create AudioContext, sound effects, mute controls or background music.'
  },product_contract:productContract,commercial_contract:commercialContract
 };
}
function appendRegistry(file,entry){
 const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);
}
function installReviewData(model,productContract,commercialContract){
 const oracleFile=path.join(ROOT,'qa/reviewed/chrona-mesh-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
 appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'chrona-mesh-v1',file:'chrona-mesh-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-24',rationale:'Finite coupled mod-3 gear graph across six deterministic packs. Stage-entry choice widths are 2/3/4 and independently shortest required normal inputs including LOCK are 2/3/4. Every gear edge has an exact two-input return path by repeating the same transform, all reachable projections are finite and solvable, and candidate code cannot edit this reviewed data.'});
 appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'chrona-mesh-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-24',rationale:'Reviewed active-vs-socket legibility, gear phase distinction, train expansion, spin/lock/third-gear feedback, three-stage clockwork spectacle, explicit success/failure transformation, intentional silence, mobile hierarchy and bounded performance. Concrete normal-player regions only; no candidate self-approval.'});
 product.review(productContract);commercial.review(commercialContract,productContract);
}
async function prepare(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
 if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
 fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
 const model=oracle(),pair=contracts(model),productContract=pair.productContract,commercialContract=pair.commercialContract,p=proposal(model,productContract,commercialContract);
 installReviewData(model,productContract,commercialContract);
 const commissioningPolicy=readJSON(path.join(__dirname,'../policy.json'));
 const gate=validateProposal(p,{policy:commissioningPolicy,catalog:readJSON(path.join(__dirname,'../catalog.json'))});
 if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
 const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-23'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
 const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'seventh-real-game-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
 const auth={schema:'playjolt-seventh-run/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner explicitly said "응 다음순서 바로 이어가자" after common scaffold v1 merged; this authorizes exactly one seventh candidate using the existing bounded Factory path. Build1 + repair5 maximum, estimated provider ceiling USD2, Production remains unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:'d436714479dd7383cc8eb6fd715b9d51cf0eae27'};
 for(const [n,d] of Object.entries({'proposal.json':p,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':cp,'authorization.json':auth,'oracle.json':model}))atomicJSON(path.join(root,n),d);
 await new Factory({store:new FileStore(root)}).create(gate.factory_spec);
 console.log(JSON.stringify({preflight:'PASS',game_id:GAME_ID,title:TITLE,oracle_hash:hash(model),product_hash:hash(productContract),commercial_hash:hash(commercialContract),warnings:gate.warnings},null,2));
}
function reviews(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!root||!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');
 const model=oracle(),pair=contracts(model),productContract=pair.productContract,commercialContract=pair.commercialContract,stored=readJSON(path.join(root,'proposal.json'));
 if(stored.game_id!==GAME_ID||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(productContract)||hash(stored.commercial_contract)!==hash(commercialContract))throw Error('recovery_contract_mismatch');
 installReviewData(model,productContract,commercialContract);
 console.log(JSON.stringify({reviews:'PASS',game_id:GAME_ID,oracle_hash:hash(model),product_hash:hash(productContract),commercial_hash:hash(commercialContract),permissions:'0644'},null,2));
}
async function run(){
 const root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json')),policyFile=path.join(root,'control-policy.json');
 const docker=new DockerQA({limits:settings.isolation});
 const worker=new AutonomousWorker({root,settings,policyFile,provider:new OpenAIProvider(),qa:docker});
 const result=await worker.runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));
 if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;
}
function summarize(){
 const root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};
 const ops=Object.values(ledger.operations).filter(x=>x.game_id===GAME_ID).sort((a,b)=>a.started_at-b.started_at).map(o=>({operation_id:o.operation_id,version:o.version,state:o.state,response_id:o.response_id,input_tokens:o.accounted?.input_tokens??null,output_tokens:o.accounted?.output_tokens??null,estimated_cost:(o.accounted||o.reserved)?.estimated_cost??null,error_code:o.error_code||null}));
 const m=readJSON(path.join(root,'autonomy/jobs',GAME_ID,'manifest.json'));const total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);
 const summary={schema:'playjolt-seventh-real-game/1',game_id:GAME_ID,title:TITLE,runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
 atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];
Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
