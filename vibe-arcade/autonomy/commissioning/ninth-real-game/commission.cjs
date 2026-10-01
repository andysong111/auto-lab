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

const GAME_ID='GAME-20260925-191',TITLE='Beacon Forge',SLUG='beacon-forge';
const seeds=[12,13,14,15,16,17];
function packIndex(seed){return (seed>>>0)%2;}
function activeCount(stage){return stage+1;}
function bitAt(mask,index){return (mask>>index)&1;}
function setBit(mask,index,value){return value?(mask|(1<<index)):(mask&~(1<<index));}
function targetFor(pack,stage){
  const n=activeCount(stage);let mask=0;
  for(let i=0;i<n;i++)if((pack+i+stage)%2)mask|=1<<i;
  return mask;
}
function initialFor(pack,stage){const n=activeCount(stage);return targetFor(pack,stage)^((1<<n)-1);}
const id=v=>v.join(':');
function transitions(v,pack){
  const [stage,cursor,mask,outcome]=v;if(outcome!=='playing')return [];
  const n=activeCount(stage),edges=[];
  edges.push({action:'left',values:[stage,(cursor+n-1)%n,mask,outcome]});
  edges.push({action:'right',values:[stage,(cursor+1)%n,mask,outcome]});
  edges.push({action:'up',values:[stage,cursor,setBit(mask,cursor,1),outcome]});
  edges.push({action:'down',values:[stage,cursor,setBit(mask,cursor,0),outcome]});
  if(mask===targetFor(pack,stage)){
    if(stage<3)edges.push({action:'lock',values:[stage+1,0,initialFor(pack,stage+1),'playing']});
    else edges.push({action:'lock',values:[4,0,0,'success']});
  }
  return edges;
}
function graph(pack){
  const initial=[1,0,initialFor(pack,1),'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(v,pack);
    nodes[k]={values:v,stage:v[0],...(v[3]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function oracle(){
  const model={schema_version:1,projection:['state.stage','state.cursor','state.mask','state.outcome'],seeds:{}};
  for(const seed of seeds)model.seeds[String(seed)]=graph(packIndex(seed));
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
    objective:{visible_selector:'[data-objective]',expected_text:'Tune 3 beacon tiers. Forge the crown.'},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'TIERS {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','right'],['up','down']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'CROWN FORGED',failure_text:'FORGE COOLED',max_terminal_latency_ms:100,failure_wait_ms:48000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:'beacon-forge-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
      {x:0,y:.54,width:.2,height:.34},{x:.2,y:.54,width:.2,height:.34},{x:.4,y:.54,width:.2,height:.34},{x:.6,y:.54,width:.2,height:.34},{x:.8,y:.54,width:.2,height:.34}
    ],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'up',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions:actions()
  };
  const commercialContract={
    schema_version:1,review_id:'beacon-forge-commercial-v1',seed:12,
    visual_legibility:{pairs:[{id:'active-future-beacon',kind:'action_availability',a:anchor('1:0:2:playing',region(.04,.29,.19,.31)),b:anchor('1:0:2:playing',region(.77,.29,.19,.31)),action_a:'up',action_b:'lock',marker:'An active beacon is a solid luminous pylon with a target ghost and base ring; a future beacon is an empty recessed plinth with a broken outline.'}]},
    state_distinction:{pairs:[{id:'low-raised-beacon',kind:'state',a:anchor('1:0:2:playing',region(.04,.23,.22,.39)),b:anchor('1:0:3:playing',region(.04,.23,.22,.39)),state_path:'state.mask',marker:'Raising a beacon visibly changes its physical height, bright core area, cap position and vertical energy column, not only text or color.'}]},
    action_feedback:{probes:[
      {id:'raise-beacon',node:'1:0:2:playing',action:'up',kind:'movement',region:region(.02,.20,.25,.45)},
      {id:'move-selector',node:'1:0:2:playing',action:'right',kind:'movement',region:region(.02,.42,.50,.22)},
      {id:'forge-tier',node:'1:0:1:playing',action:'lock',kind:'unlock',region:region(0,.03,1,.43)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor('1:0:2:playing',region(0,.03,1,.48)),anchor('2:0:5:playing',region(0,.03,1,.48)),anchor('3:0:10:playing',region(0,.03,1,.48))],marker:'The forge expands from two to three to four active pylons; each completed tier leaves a persistent molten ring, enlarges the central crown core and adds denser overhead geometry.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:'CROWN FORGED',failure_title:'FORGE COOLED'},
    audio:{mode:'reviewed_silence',exception:'Beacon Forge intentionally stays silent for this commissioning slot so touch equivalence, large spatial motion, reduced-motion behavior and integrated repair recovery are evaluated without an additional audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
      {role:'active',foreground:region(.05,.29,.18,.29),background:region(.05,.60,.18,.05)},
      {role:'goal',foreground:region(.40,.08,.20,.13),background:region(.40,.23,.20,.05)}
    ]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and forge all three tiers with fewer cursor moves and height changes.'},
    performance:{sample_ms:1200}
  };
  return {productContract,commercialContract};
}
function ruleData(){return {
  seed_mapping:'pack = seed % 2',
  stage_widths:[2,3,4],
  heights:[0,1],
  transform_rule:'LEFT and RIGHT wrap the selected active beacon. UP sets only the selected beacon HIGH and DOWN sets only the selected beacon LOW. A changed UP can be reversed by DOWN and a changed DOWN can be reversed by UP; LEFT and RIGHT are exact cursor inverses. LOCK changes reviewed state only when every active beacon exactly matches the seeded target heights.',
  target_rule:'Target LOW/HIGH bits alternate by seed parity, beacon index and stage. Each stage begins at the exact active-bit complement of its target, so every active beacon requires one real height correction. A correct LOCK resets cursor to zero, loads the next stage complement, increments completed and advances the stage; stage3 LOCK succeeds.'
};}
function proposal(model,productContract,commercialContract){
  return {
    game_id:GAME_ID,generation:1,title:TITLE,slug:SLUG,genre:'phaser beacon-height tuning puzzle',mechanic_family:'seeded-beacon-height-tuning',
    controls:['Arrow keys select and tune the active beacon.','Space forges the tier when all heights match.'],
    mobile_controls:['Tap LEFT/RIGHT and UP/DOWN to tune the selected beacon.','Tap FORGE when every beacon matches its ghost target.'],
    max_repair_attempts:5,
    qa:{seed:12,keyboard:{key:'ArrowUp',observation:'state.mask'},pointer:{observation:'state.mask'},terminal_ms:52000},
    implementation_contract:{
      goal:'Show the exact objective "Tune 3 beacon tiers. Forge the crown." before Start and keep it visible. Each stage shows 2, then 3, then 4 active beacon pylons with large non-text ghost target heights. Select a beacon, tune it to the ghost height, and FORGE only when every active pylon matches. Complete three tiers to win.',
      progression:'Canonical state starts stage=1, cursor=0, outcome="playing", completed=0, with mask equal to the active-bit complement of the seeded target. Stage widths are 2,3,4 beacons. LEFT/RIGHT wrap selection across only active beacons. UP sets only the selected bit HIGH; DOWN sets only the selected bit LOW. Blocked FORGE does not change the reviewed projection. Correct FORGE resets cursor, loads the next stage complement mask, increments completed and advances stage; stage3 FORGE immediately sets stage=4 and outcome="success". meaningful_actions increments for every reviewed projection-changing edge including successful FORGE, never for blocked FORGE.',
      presentation:'Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects only through factory-owned PlayJoltPhaserKit. Build an original dark foundry with four large pylon plinths, physical towers at two strongly separated LOW/HIGH heights, a bright selector ring, translucent target-height ghosts, a central crown core and persistent molten tier rings. Stage1 activates two pylons, stage2 three, stage3 four. Height changes must move large geometry vertically; selection changes must move a large halo. Do not use candidate Canvas 2D drawing, create Phaser.Game, create a custom RAF loop or make Phaser physics authoritative.',
      originality:'Beacon Forge is seeded LOW/HIGH height tuning with a movable selector and reversible pylons. It is not pulse weaving, coupled gears, resonance sigils, row/column cycling, cargo assignment, optical routing, auto-running, survival, merge, reaction or single-button timing.',
      difficulty:'Implement the reviewed rule data exactly: '+JSON.stringify(ruleData())+' Every stage starts as the exact complement of its seeded LOW/HIGH target, so an efficient solution requires exactly one real height correction per active pylon plus navigation and FORGE. quality.stage=state.stage. quality.complexity=active beacon count. quality.objective_progress=completed. quality.meaningful_actions increments once for each reviewed projection-changing edge. quality.reversible_state_key is stage:cursor:mask:outcome.',
      mobile_readability:'At 390x844 keep objective, TIERS progress, current score, device best, target ghosts, active pylons, five canvas command zones, result, Replay and replay reason in the first viewport. Every critical DOM label is at least14px and lifecycle controls are at least44px. The canvas command zones are large and visually labeled with simple arrows plus a FORGE symbol; do not depend on tiny decorative text.',
      result:'Success text is exactly CROWN FORGED and failure text exactly FORGE COOLED in data-result. Success lifts the central crown core above all four pylons, connects them with three broad molten rings and emits a bounded upward spark bloom. Failure retracts the crown, cools the rings and leaves visible fractured caps. Show CURRENT SCORE and DEVICE BEST from GameKit plus the primary Replay action in the initial mobile result viewport.',
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. GamePresentation.reduced_motion must report actual visible behavior. Normal mode uses Phaser tweens for LOW/HIGH pylon travel, selector glide, crown lift and bounded sparks. Reduced mode performs height/selector changes instantly but adds a strong static outline and cap flare for at least300ms. No camera motion in reduced mode. Do not fake compliance through diagnostics.',
      scoring:'Start score0. Award points only on successful FORGE: stage bases 250,400,550 minus 15 per action beyond efficient par 4,6,8, with a floor of150 per tier. Height changes, cursor moves, waiting and blocked FORGE never award score by themselves. observe returns finite tick, score, progress=floor(tick/60), interactions=meaningful_actions and a bounded entity count.',
      completion_timing:'The stall deadline is 2880 GameKit ticks, about48 seconds at60Hz. Tick advances only through GameKit. At tick>=2880 set outcome="failure" unless success completed on that exact step. core.terminal is immediately true for success or failure; there is no minimum success duration or post-success delay.',
      action_feedback:'Every UP/DOWN immediately marks the selected pylon, shows a large height transition visible around70ms and150ms, and settles by450ms. LEFT/RIGHT move the selector halo with the same intermediate evidence. Correct FORGE stamps a persistent molten tier ring and expands the crown core. Reduced mode uses instant geometry plus a strong static flare. Keep all effects bounded and derived from snapshot state.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(model,productContract,commercialContract){
  const oracleFile=path.join(ROOT,'qa/reviewed/beacon-forge-v1.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:'beacon-forge-v1',file:'beacon-forge-v1.json',sha256:hash(model),scope:'candidate',game_id:GAME_ID,contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation design review 2026-09-25',rationale:'Finite binary beacon graph across six deterministic seeds. Stage widths are 2/3/4, each stage starts at the seeded target complement, cursor changes have exact inverses and every changed height action has an opposite return, all reachable reviewed states remain bounded, and the three stages are solvable without hidden timing.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:'beacon-forge-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'ChatGPT trusted pre-generation commercial review 2026-09-25',rationale:'Reviewed large LOW/HIGH pylon distinction, selector travel, tier forge transition, 2/3/4-pylon progression, explicit crown result transformation, intentional silence, mobile hierarchy and bounded performance using normal-player regions only.'});
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
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-25'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'ninth-real-game-phaser-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const auth={schema:'playjolt-ninth-run/1',game_id:GAME_ID,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner instructed PlayJolt autonomous development to continue after the Phaser rollout and Factory repair-starvation fix. This prepares exactly one bounded ninth candidate after zero-paid preflight; Production remains unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:'6526cfcc504698a9cd1d80a2cbca2485a1b632cd'};
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
  const summary={schema:'playjolt-ninth-real-game/1',game_id:GAME_ID,title:TITLE,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
  atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
const cmd=process.argv[2];
Promise.resolve(cmd==='prepare'?prepare():cmd==='reviews'?reviews():cmd==='run'?run():cmd==='summarize'?summarize():(()=>{throw Error('usage prepare|reviews|run|summarize')})()).catch(e=>{console.error(e.stack);process.exitCode=1});
