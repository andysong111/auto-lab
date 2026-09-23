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

const GAME_ID='GAME-20260923-161',TITLE='Ember Choir',SLUG='ember-choir';
const seeds=[1,7,23,89,2026,4294967295];
const actionNames=['left','right','up','down'];
const baseVectors={1:[1,2],2:[1,3,6],3:[1,3,6,12]};
const beatCounts={1:[2],2:[2,3],3:[2,3,4]};
function packIndex(seed){const h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0;return ((h^(h>>>13))>>>0)%6;}
function vectorFor(pack,stage,index){const b=baseVectors[stage],n=b.length;return b[(index+(pack%n))%n];}
function targetFor(pack,stage,beat){let t=0;for(let i=0;i<beatCounts[stage][beat];i++)t^=vectorFor(pack,stage,i);return t;}
const id=v=>v.join(':');
function transitions(v,pack){
  const [stage,beat,mask,outcome]=v;if(outcome!=='playing')return [];
  const n=stage+1,edges=[];
  for(let i=0;i<n;i++)edges.push({action:actionNames[i],values:[stage,beat,mask^vectorFor(pack,stage,i),outcome]});
  if(mask===targetFor(pack,stage,beat)){
    if(beat+1<stage)edges.push({action:'fire',values:[stage,beat+1,0,outcome]});
    else if(stage<3)edges.push({action:'fire',values:[stage+1,0,0,outcome]});
    else edges.push({action:'fire',values:[4,0,0,'success']});
  }
  return edges;
}
function graph(pack){
  const initial=[1,0,0,'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(v,pack);
    nodes[k]={values:v,stage:v[0],...(v[3]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function oracle(){
  const model={schema_version:1,projection:['state.stage','state.beat','state.mask','state.outcome'],seeds:{}};
  for(const seed of seeds)model.seeds[String(seed)]=graph(packIndex(seed));
  product.validateModel(model);return model;
}
function actions(){
 return {
  left:{key:'ArrowLeft',touch:{x:.20,y:.34},hold_ms:35,settle_ms:35},
  right:{key:'ArrowRight',touch:{x:.80,y:.34},hold_ms:35,settle_ms:35},
  up:{key:'ArrowUp',touch:{x:.50,y:.14},hold_ms:35,settle_ms:35},
  down:{key:'ArrowDown',touch:{x:.50,y:.56},hold_ms:35,settle_ms:35},
  fire:{key:'Space',touch:{x:.50,y:.92},hold_ms:35,settle_ms:35}
 };
}
function contracts(model){
 const oracleHash=hash(model);
 const productContract={
  schema_version:1,
  objective:{visible_selector:'[data-objective]',expected_text:'Tune 3 forge rings. Awaken the Ember Choir.'},
  progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'RINGS {value} / 3',milestones:[1,2,3]},
  score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left'],['right','right']],no_progress_probes:[['fire'],['up'],['down']]},
  best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
  completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'CHOIR IGNITED',failure_text:'FORGE WENT COLD',max_terminal_latency_ms:100,failure_wait_ms:38000,failure_actions:[]},
  replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
  difficulty:{deterministic_seeds:seeds,oracle_id:'ember-choir-v1',oracle_sha256:oracleHash,projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
  mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]','[data-mute]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
   {x:.09,y:.24,width:.22,height:.16},{x:.69,y:.24,width:.22,height:.16},{x:.39,y:.05,width:.22,height:.16},{x:.39,y:.48,width:.22,height:.16},{x:.30,y:.84,width:.40,height:.14}
  ],min_font_px:14,min_hit_target_px:44},
  reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
  feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
  actions:actions()
 };
 const commercialContract={
  schema_version:1,review_id:'ember-choir-commercial-v1',seed:1,
  visual_legibility:{pairs:[{id:'present-absent-sigil',kind:'action_availability',
   a:{node:'1:0:0:playing',region:{selector:'[data-game-canvas]',x:.09,y:.24,width:.22,height:.16}},
   b:{node:'1:0:0:playing',region:{selector:'[data-game-canvas]',x:.39,y:.05,width:.22,height:.16}},
   action_a:'left',action_b:'up',marker:'Present forge sigil is a solid engraved plate with ember core; absent slot is an open broken socket with no active core.'}]},
  state_distinction:{pairs:[
   {id:'sigil-cold-lit',kind:'state',a:{node:'1:0:0:playing',region:{selector:'[data-game-canvas]',x:.09,y:.24,width:.22,height:.16}},b:{node:'1:0:2:playing',region:{selector:'[data-game-canvas]',x:.09,y:.24,width:.22,height:.16}},state_path:'state.mask',marker:'A toggled sigil changes from dark iron recess to filled incandescent ceramic with a strong halo and linking arc.'},
   {id:'beat-reset-pattern',kind:'state',a:{node:'2:0:2:playing',region:{selector:'[data-game-canvas]',x:.18,y:.20,width:.64,height:.42}},b:{node:'2:1:0:playing',region:{selector:'[data-game-canvas]',x:.18,y:.20,width:.64,height:.42}},state_path:'state.beat',marker:'Successful quench physically locks the completed glyph into the outer ring and reveals a new center recipe constellation, not only a number change.'}
  ]},
  action_feedback:{probes:[
   {id:'toggle',node:'1:0:0:playing',action:'left',kind:'movement',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}},
   {id:'quench',node:'1:0:3:playing',action:'fire',kind:'merge',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}},
   {id:'ascend',node:'2:1:4:playing',action:'fire',kind:'upgrade',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}}
  ]},
  motion:{intermediate_ms:[60,140],settle_ms:500},
  progression_spectacle:{checkpoints:[
   {node:'1:0:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}},
   {node:'2:0:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}},
   {node:'3:0:0:playing',region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74}}
  ],marker:'A two-sigil hand forge becomes a three-sigil rotating kiln and then a four-sigil cathedral forge with a visibly larger chorus of forged ember forms, denser link geometry and larger central flame.'},
  result_presentation:{region:{selector:'[data-game-canvas]',x:.04,y:.04,width:.92,height:.74},success_title:'CHOIR IGNITED',failure_title:'FORGE WENT COLD'},
  audio:{mode:'required',mute_selector:'[data-mute]',primary_probe:'toggle',progress_probe:'ascend'},
  mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
   {role:'player',foreground:{selector:'[data-game-canvas]',x:.43,y:.60,width:.14,height:.12},background:{selector:'[data-game-canvas]',x:.03,y:.62,width:.12,height:.10}},
   {role:'reward',foreground:{selector:'[data-game-canvas]',x:.42,y:.31,width:.16,height:.14},background:{selector:'[data-game-canvas]',x:.03,y:.31,width:.12,height:.10}}
  ]},
  replay_motivation:{selector:'[data-replay-reason]',reason:'Replay this seed to read the coupled sigils and quench each ring with fewer wasted toggles.'},
  performance:{sample_ms:1600}
 };
 return {productContract,commercialContract};
}
function ruleData(){
 return {seed_mapping:'h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0; pack=((h^(h>>>13))>>>0)%6',
  base_vectors:baseVectors,beat_solution_counts:beatCounts,
  vector_rule:'At stage s with n=s+1 active directional sigils, action index i uses base_vectors[s][(i+(pack%n))%n]. Applying a direction XORs state.mask by that vector; same direction twice is reversible.',
  target_rule:'For each beat, target mask is XOR of the first beat_solution_counts[stage][beat] directional vectors in LEFT,RIGHT,UP,DOWN order. FIRE only changes state when mask equals that target; it resets mask and advances beat/stage.'};
}
function proposal(model,productContract,commercialContract){
 const rules=JSON.stringify(ruleData());
 return {
  game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'resonance forge puzzle',mechanic_family:'resonance-forge-toggle-composition',
  controls:['Arrow keys toggle coupled forge sigils.','Space quenches a matched resonance pattern.'],
  mobile_controls:['Tap a sigil to toggle it.','Tap QUENCH when the ring matches the recipe.'],
  max_repair_attempts:5,
  qa:{seed:1,keyboard:{key:'ArrowLeft',observation:'state.mask'},pointer:{observation:'state.pointer_actions'},terminal_ms:39000},
  implementation_contract:{
   goal:'Show exact objective "Tune 3 forge rings. Awaken the Ember Choir." before Start. Ember Choir is a reversible coupled-sigil composition puzzle, not navigation, target shooting, timing, runner, autofire, optical routing or row/column cycling. The player reads a target resonance constellation, toggles forge sigils, and quenches only when the live ring matches it.',
   progression:'Canonical core state starts stage=1, beat=0, mask=0, outcome="playing", completed=0. Stage s has n=s+1 active directional sigils. LEFT/RIGHT/UP/DOWN are reversible XOR transformations defined by the reviewed rule data. FIRE is a no-op unless mask exactly equals the current target. A correct FIRE resets mask to0 and advances beat; after the last beat it advances stage and completed; after stage3 it immediately sets stage=4 and outcome="success". Core also tracks pointer_actions, meaningful_actions, stage_toggle_count and total_toggle_count outside the reviewed projection. No hidden state may affect legal transitions.',
   presentation:'Use an original tactile forge aesthetic: dark iron, glazed ceramic, amber-white heat and cyan cooling accents. The battlefield is a circular forge, not flat cards. Each active sigil is a large engraved plate at fixed directional positions; inactive future positions are broken sockets. Coupled toggles send thick visible energy arcs through the ring. Stage1 is a compact hand forge with two sigils and one central ember; stage2 expands to a three-sigil kiln with multiple locked outer glyphs; stage3 becomes a cathedral forge with four major sigils, layered outer choir forms and a much larger central flame. Growth must visibly change silhouette, footprint, ring count, forged forms and effect scale. Keep settled frames stable. Core export via globalThis.EmberChoirCore only; DOM-free, no window identifier. GameKit owns lifecycle and clock. No external assets.',
   originality:'New mechanic family resonance-forge-toggle-composition: reversible coupled XOR transformations plus explicit recipe matching and multi-beat quenching. It is not Shard Armada aimed-salvo recruitment, Keywake navigation, Prism Relay optical routing, Ribbon Shift row/column cycling, Cloud Cargo assignment, arena survival, tower descent, radial timing or a single-button game. No prior source, characters, art, wording or UI is reused.',
   difficulty:'Implement this exact reviewed RULE DATA: '+rules+' Six deterministic seeds map across all six packs. Stage1 requires one target beat solved by two toggles then quench; stage2 requires two beats solved by 2 then3 toggles plus quenches; stage3 requires three beats solved by2,3,4 toggles plus quenches. Each directional transform is self-inverse, so every branch has a bounded return path and all reachable projections remain solvable. quality.stage=state.stage. quality.complexity equals number of DISTINCT immediately reachable changed projection states under five actions. quality.objective_progress=completed. quality.meaningful_actions is cumulative projection-changing inputs only. quality.reversible_state_key joins stage,beat,mask,outcome; never include score, best, tick or time.',
   mobile_readability:'At 390x844 keep objective, score/best, RINGS progress, full forge, result, Replay and mute in the first viewport. Every DOM label is at least14px and every lifecycle control at least44px high. Canvas control regions exactly match the product contract; make the four sigils physically large enough to satisfy those regions even when a slot is inactive. Use concise copy under650 visible characters. [data-game-progress] is finite integer elapsed seconds. [data-product-progress] exact RINGS {completed} / 3.',
   result:'Success exact CHOIR IGNITED and failure exact FORGE WENT COLD in [data-result]. Success transforms the forge into a large radiant choir crown with all locked glyphs orbiting an expanded central flame and broad non-text rays. Failure visibly collapses the ring into cold fractured ceramic and dim iron. Show CURRENT SCORE and DEVICE BEST from GameKit, Replay in the first mobile viewport, and [data-replay-reason] with a concrete coupled-sigil efficiency reason. Use GameKit restart and no custom persistence.',
   reduced_motion:'Honor initial and live prefers-reduced-motion changes in both directions. presentation() exposes reduced_motion, feedback_active and static_feedback from real visible behavior. Reduced mode removes travel, recoil and particles but retains strong static plate fill, thick linking arcs and a large quench seal for about300ms after input. Do not hide decision information or use diagnostics-only flags.',
   scoring:'Start0. Score only when a whole forge stage completes, never on individual toggles, reversible cycles, waiting or invalid FIRE. Stage awards max(50,300-20*max(0,stage_toggle_count-par[stage-1])) with par [2,5,9], so maximum900. Reset stage_toggle_count on stage completion. Wrong toggles cost efficiency but can always be undone. observe returns finite tick,score,progress=floor(tick/60),interactions=meaningful_actions,entities=actual bounded visible game entities plus state and quality.',
   completion_timing:'A shared 37 second cooling deadline is 2220 GameKit ticks at60Hz. Tick advances only through GameKit simulation. At tick>=2220 set outcome="failure" unless success was completed on that step. core.terminal is true immediately for success or failure; no minimum duration and no post-success waiting. Pause and hidden stop the GameKit clock and sound.',
   action_feedback:'Every sigil toggle immediately acknowledges the selected plate, sends a thick coupling arc at ~60ms, a broad resonance bloom at ~140ms and settles by500ms with the new plate fill. Correct quench visibly locks the completed recipe into an outer ring, resets the inner plates and changes the central flame. Stage ascent expands the entire forge footprint and adds multiple persistent choir forms. Reduced mode uses static equivalents. Audio is REQUIRED: distinct short procedural WebAudio cues for toggle, correct quench/stage ascent, success and failure; one context after user gesture only, mute stops active voices and blocks new sources, <=6 simultaneous voices, cleanup/suspend on pause/hidden/pagehide, no background music or external audio.'
  },product_contract:productContract,commercial_contract:commercialContract
 };
}
function appendRegistry(file,entry){
 const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);
}
function installReviewData(model,productContract,commercialContract){
 const oracleFile=path.join(ROOT,'qa/reviewed/ember-choir-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
 appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'ember-choir-v1',file:'ember-choir-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-23',rationale:'Independent reversible XOR forge graph across six deterministic packs. Stage-entry legal choices increase 2/3/4; each directional branch has an immediate inverse; target beats require increasing 3/7/12 normal inputs including quench. All reachable projections are finite and solvable. Candidate code cannot edit this reviewed data.'});
 appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'ember-choir-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-23',rationale:'Reviewed visible present/absent sigils, cold/lit state, beat reset, toggle/quench/ascent feedback, three-stage forge scale growth, result spectacle, audio, mobile hierarchy and bounded performance. These are concrete normal-player regions; no aesthetic score or candidate self-approval.'});
 product.review(productContract);commercial.review(commercialContract,productContract);
}
async function prepare(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
 if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
 fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
 const model=oracle(),{productContract,commercialContract}=contracts(model),p=proposal(model,productContract,commercialContract);
 installReviewData(model,productContract,commercialContract);
 const commissioningPolicy=readJSON(path.join(__dirname,'../policy.json'));
 const gate=validateProposal(p,{policy:commissioningPolicy,catalog:readJSON(path.join(__dirname,'../catalog.json'))});
 if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
 const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-23'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:3,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:3,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
 const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'sixth-real-game-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
 const auth={schema:'playjolt-sixth-run/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner explicitly said to continue immediately after fifth candidate; one new sixth candidate, build1 + repair5 maximum, <=USD3 estimated. Production remains unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:3,production_authorized:false,base_commit:'db4a2ef2e93e622b17068b564cd7b06bb84473b8'};
 for(const [n,d] of Object.entries({'proposal.json':p,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':cp,'authorization.json':auth,'oracle.json':model}))atomicJSON(path.join(root,n),d);
 await new Factory({store:new FileStore(root)}).create(gate.factory_spec);console.log(JSON.stringify({preflight:'PASS',game_id:GAME_ID,title:TITLE,oracle_hash:hash(model),product_hash:hash(productContract),commercial_hash:hash(commercialContract),warnings:gate.warnings},null,2));
}
function reviews(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!root||!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');
 const model=oracle(),{productContract,commercialContract}=contracts(model),stored=readJSON(path.join(root,'proposal.json'));
 if(stored.game_id!==GAME_ID||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(productContract)||hash(stored.commercial_contract)!==hash(commercialContract))throw Error('recovery_contract_mismatch');
 installReviewData(model,productContract,commercialContract);
 console.log(JSON.stringify({reviews:'PASS',game_id:GAME_ID,oracle_hash:hash(model),product_hash:hash(productContract),commercial_hash:hash(commercialContract),permissions:'0644'},null,2));
}
function continuation(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||''),ledgerFile=path.join(root,'autonomy/.provider/ledger.json');
 const workerFile=path.join(root,'worker-result.json'),manifestFile=path.join(root,'autonomy/jobs',GAME_ID,'manifest.json');
 if(!fs.existsSync(ledgerFile)||!fs.existsSync(workerFile)||!fs.existsSync(manifestFile))throw Error('continuation_checkpoint_missing');
 const ledger=readJSON(ledgerFile),worker=readJSON(workerFile),manifest=readJSON(manifestFile),job=ledger.jobs?.[GAME_ID];
 if(!job||worker.game_id!==GAME_ID||worker.factory_state!=='REPAIRING'||worker.version!=='v3'||manifest.repair_attempt!==2)throw Error('unexpected_continuation_checkpoint');
 if(!['request_input_token_limit','game_wall_clock_limit'].includes(worker.code))throw Error('unexpected_continuation_reason');
 const started=Date.parse(worker.recorded_at),ended=Date.now(),checkpoint=hash(manifest),commit=process.env.GITHUB_SHA||'';
 if(!Number.isSafeInteger(started)||!Number.isSafeInteger(ended)||ended<=started||!/^[a-f0-9]{64}$/.test(commit))throw Error('invalid_continuation_metadata');
 const ops=Object.values(ledger.operations||{}).filter(o=>o.game_id===GAME_ID);
 if(ops.some(o=>(o.started_at||0)>started))throw Error('provider_activity_during_infrastructure_hold');
 job.infrastructure_pauses=[...(job.infrastructure_pauses||[]).filter(p=>p.checkpoint_manifest_sha256!==checkpoint),{
   reason:'infrastructure_repair_hold',system_reviewed:true,owner_authorized:true,
   started_at:started,ended_at:ended,checkpoint_manifest_sha256:checkpoint,resume_commit:commit
 }];
 atomicJSON(ledgerFile,ledger);
 console.log(JSON.stringify({continuation:'PASS',game_id:GAME_ID,paused_ms:ended-started,repair_attempt:manifest.repair_attempt,lifetime_provider_calls:ops.length,checkpoint_manifest_sha256:checkpoint},null,2));
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
 const summary={schema:'playjolt-sixth-real-game/1',game_id:GAME_ID,title:TITLE,runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
 atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='continuation'?continuation():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|continuation|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
