'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {hash,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {validateProposal}=require('../commissioning/spec-gate.cjs');
const product=require('../qa/product-contract.cjs');
const commercial=require('../qa/commercial/contract.cjs');
const {Factory}=require('../orchestrator/engine.cjs');
const {FileStore}=require('../orchestrator/store.cjs');
const {AutonomousWorker}=require('../worker/runtime.cjs');
const {DockerQA}=require('../isolation/docker-qa.cjs');
const {OpenAIProvider}=require('../providers/openai.cjs');

const ACTION_NAMES=['left','right','up'];
const PRIMITIVES=new Set(['adjacent','prefix_reverse','star','prefix_rotate','suffix_reverse','suffix_rotate']);
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/,SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,SIG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message){const e=new Error(message);e.code='template_blueprint_invalid';throw e;}
function cleanWord(v,min=2,max=40){
  if(typeof v!=='string'||v.length<min||v.length>max||!/^[A-Za-z][A-Za-z0-9 -]*$/.test(v))fail('invalid_theme_text');
  return v.trim();
}
function validateBlueprint(bp){
  if(!bp||bp.schema!=='playjolt-permutation-blueprint/1')fail('schema');
  if(!ID.test(bp.game_id||''))fail('game_id');
  if(typeof bp.title!=='string'||bp.title.length<3||bp.title.length>48)fail('title');
  if(!SLUG.test(bp.slug||''))fail('slug');
  if(!SIG.test(bp.signature_id||''))fail('signature_id');
  if(!Array.isArray(bp.ops)||bp.ops.length!==3||bp.ops.some(x=>!PRIMITIVES.has(x)))fail('ops');
  if(!Array.isArray(bp.seeds)||bp.seeds.length!==6||new Set(bp.seeds).size!==6||bp.seeds.some(x=>!Number.isInteger(x)||x<0||x>1000000))fail('seeds');
  if(!bp.theme||typeof bp.theme!=='object')fail('theme');
  const theme={
    singular:cleanWord(bp.theme.singular),
    plural:cleanWord(bp.theme.plural),
    arena:cleanWord(bp.theme.arena),
    progress:cleanWord(bp.theme.progress,3,16).toUpperCase(),
    success:cleanWord(bp.theme.success,3,40).toUpperCase(),
    failure:cleanWord(bp.theme.failure,3,40).toUpperCase()
  };
  return {...bp,theme};
}
function sizeFor(stage){return stage+1;}
function canonical(stage){return Array.from({length:sizeFor(stage)},(_,i)=>String(i)).join('');}
function applyPrimitive(order,index,kind){
  const a=order.split(''),n=a.length,k=index+2;
  if(index<0||index>=n-1)throw Error('inactive_operation');
  if(kind==='adjacent'){const t=a[index];a[index]=a[index+1];a[index+1]=t;}
  else if(kind==='prefix_reverse')a.splice(0,k,...a.slice(0,k).reverse());
  else if(kind==='star'){const t=a[0];a[0]=a[index+1];a[index+1]=t;}
  else if(kind==='prefix_rotate'){const seg=a.slice(0,k);a.splice(0,k,...seg.slice(1),seg[0]);}
  else if(kind==='suffix_reverse'){const s=n-k;a.splice(s,k,...a.slice(s).reverse());}
  else if(kind==='suffix_rotate'){const s=n-k,seg=a.slice(s);a.splice(s,k,...seg.slice(1),seg[0]);}
  else throw Error('unknown_primitive');
  return a.join('');
}
function stageSpace(bp,stage){
  const initial=canonical(stage),nodes={[initial]:{distance:0}},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const order=queue[i],d=nodes[order].distance;
    for(let action=0;action<stage;action++){
      const next=applyPrimitive(order,action,bp.ops[action]);
      if(!nodes[next]){nodes[next]={distance:d+1};queue.push(next);}
    }
  }
  const first=new Set();
  for(let action=0;action<stage;action++)first.add(applyPrimitive(initial,action,bp.ops[action]));
  if(first.size!==stage||first.has(initial))fail('non_distinct_stage_actions');
  if(queue.length<2||queue.length>120)fail('stage_space_bound');
  return {initial,nodes,orders:queue,max_distance:Math.max(...Object.values(nodes).map(x=>x.distance))};
}
function targetFor(bp,seed,stage){
  const space=stageSpace(bp,stage),desired=Math.min(space.max_distance,Math.max(1,stage+(seed%2)));
  let pool=space.orders.filter(x=>space.nodes[x].distance===desired);
  if(!pool.length){const max=space.max_distance;pool=space.orders.filter(x=>space.nodes[x].distance===max);}
  pool=pool.filter(x=>x!==space.initial).sort();
  if(!pool.length)fail('target_pool_empty');
  return pool[(seed+stage)%pool.length];
}
const id=v=>v.join(':');
function transitions(bp,seed,v){
  const [stage,order,outcome]=v;if(outcome!=='playing')return [];
  const edges=[];
  for(let i=0;i<stage;i++)edges.push({action:ACTION_NAMES[i],values:[stage,applyPrimitive(order,i,bp.ops[i]),outcome]});
  if(order===targetFor(bp,seed,stage)){
    if(stage<3)edges.push({action:'lock',values:[stage+1,canonical(stage+1),'playing']});
    else edges.push({action:'lock',values:[4,'','success']});
  }
  return edges;
}
function graph(bp,seed){
  const initial=[1,canonical(1),'playing'],nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const v=queue[i],k=id(v);if(nodes[k])continue;
    const raw=transitions(bp,seed,v);
    nodes[k]={values:v,stage:v[0],...(v[2]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);
  }
  return {initial:id(initial),nodes};
}
function buildModel(input){
  const bp=validateBlueprint(input),model={schema_version:1,projection:['state.stage','state.order','state.outcome'],seeds:{}};
  for(const seed of bp.seeds)model.seeds[String(seed)]=graph(bp,seed);
  product.validateModel(model);return model;
}
function actions(){
  return {
    left:{key:'ArrowLeft',touch:{x:.14,y:.68},hold_ms:35,settle_ms:35},
    right:{key:'ArrowRight',touch:{x:.39,y:.68},hold_ms:35,settle_ms:35},
    up:{key:'ArrowUp',touch:{x:.64,y:.68},hold_ms:35,settle_ms:35},
    lock:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}
  };
}
function region(x,y,width,height){return {selector:'[data-game-canvas]',x,y,width,height};}
function anchor(node,r){return {node,region:r};}
function opLabel(kind,index){
  const k=index+2;
  if(kind==='adjacent')return 'swap positions '+(index+1)+' and '+(index+2);
  if(kind==='prefix_reverse')return 'reverse the first '+k+' cards';
  if(kind==='star')return 'swap the first card with position '+(index+2);
  if(kind==='prefix_rotate')return 'rotate the first '+k+' cards left';
  if(kind==='suffix_reverse')return 'reverse the last '+k+' cards';
  if(kind==='suffix_rotate')return 'rotate the last '+k+' cards left';
  return kind;
}
function contracts(input,model){
  const bp=validateBlueprint(input),seed=bp.seeds[0],t=bp.theme;
  const objective='Arrange 3 '+t.plural+' formations. Lock the '+t.arena+'.';
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:objective},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:t.progress+' {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','left']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:t.success,failure_text:t.failure,max_terminal_latency_ms:100,failure_wait_ms:45000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:bp.seeds,oracle_id:bp.slug+'-oracle-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[
      {x:0,y:.52,width:.25,height:.36},{x:.25,y:.52,width:.25,height:.36},{x:.50,y:.52,width:.25,height:.36},{x:.75,y:.52,width:.25,height:.36}
    ],min_font_px:14,min_hit_target_px:44},
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'left',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions:actions()
  };
  const initial1='1:'+canonical(1)+':playing',afterLeft='1:'+applyPrimitive(canonical(1),0,bp.ops[0])+':playing';
  const initial2='2:'+canonical(2)+':playing',initial3='3:'+canonical(3)+':playing',lockNode='1:'+targetFor(bp,seed,1)+':playing';
  const commercialContract={
    schema_version:1,review_id:bp.slug+'-commercial-v1',seed,
    visual_legibility:{pairs:[{id:'active-future-operation',kind:'action_availability',a:anchor(initial1,region(.06,.46,.25,.25)),b:anchor(initial1,region(.56,.46,.25,.25)),action_a:'left',action_b:'up',marker:'The active operation gate is a bright solid bridge between large '+t.plural+' cards; a future gate is a dark broken connector with no exchange trail.'}]},
    state_distinction:{pairs:[{id:'first-operation-state',kind:'state',a:anchor(initial1,region(.05,.22,.55,.36)),b:anchor(afterLeft,region(.05,.22,.55,.36)),state_path:'state.order',marker:'The first operation visibly changes the spatial order and geometry of the large '+t.plural+' cards, not only text or color.'}]},
    action_feedback:{probes:[
      {id:'first-operation',node:initial1,action:'left',kind:'movement',region:region(.03,.18,.58,.48)},
      {id:'second-operation',node:initial2,action:'right',kind:'movement',region:region(.22,.18,.58,.48)},
      {id:'lock-formation',node:lockNode,action:'lock',kind:'unlock',region:region(0,.03,1,.46)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor(initial1,region(0,.03,1,.48)),anchor(initial2,region(0,.03,1,.48)),anchor(initial3,region(0,.03,1,.48))],marker:'The '+t.arena+' expands from two to three to four large '+t.plural+' cards; each locked formation leaves a persistent luminous band and enlarges the central crest.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:t.success,failure_title:t.failure},
    audio:{mode:'reviewed_silence',exception:'This autonomous template intentionally uses silent visual motion so state clarity, input equivalence, reduced-motion behavior and bounded effects are evaluated without adding an audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[
      {role:'active',foreground:region(.05,.24,.22,.30),background:region(.05,.58,.22,.05)},
      {role:'goal',foreground:region(.39,.08,.22,.13),background:region(.39,.23,.22,.05)}
    ]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and lock all three '+t.plural+' formations with fewer unnecessary operations.'},
    performance:{sample_ms:1200}
  };
  return {productContract,commercialContract,objective};
}
function ruleData(bp){
  return {
    stage_sizes:[2,3,4],
    active_operation_widths:[1,2,3],
    operations:bp.ops.map((x,i)=>({action:ACTION_NAMES[i],primitive:x,meaning:opLabel(x,i)})),
    target_rule:'For each seed and stage, trusted Oracle chooses a reachable non-initial permutation at a bounded graph distance. Correct LOCK resets the next stage to canonical order and stage3 LOCK succeeds immediately.'
  };
}
function proposalFor(input,model){
  const bp=validateBlueprint(input),pair=contracts(bp,model),t=bp.theme,rules=ruleData(bp);
  const opText=rules.operations.map(x=>x.action+' = '+x.meaning).join('; ');
  return {
    game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:'phaser permutation operations puzzle',mechanic_family:'seeded-'+bp.signature_id+'-permutation-ordering',
    controls:['Arrow keys apply the lit formation operations.','Space locks a formation when its order matches the target.'],
    mobile_controls:['Tap a lit operation gate to rearrange the visible cards.','Tap LOCK when the whole formation matches the target.'],
    max_repair_attempts:5,
    qa:{seed:bp.seeds[0],keyboard:{key:'ArrowLeft',observation:'state.order'},pointer:{observation:'state.order'},terminal_ms:50000},
    implementation_contract:{
      goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Each stage shows 2, then 3, then 4 large '+t.plural+' cards plus a target formation. Apply only the currently lit operations and press LOCK when the complete order matches.',
      progression:'Canonical state starts stage=1, order="01", outcome="playing", completed=0. Stage sizes are 2,3,4 cards with exactly 1,2,3 active operations. '+opText+'. Inactive actions and blocked LOCK do not change the reviewed projection. Correct LOCK resets the next stage to canonical ascending order, increments completed and advances; stage3 LOCK immediately sets stage=4 and outcome="success". meaningful_actions increments exactly once for every reviewed projection-changing edge including successful LOCK.',
      presentation:'Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects only through factory-owned PlayJoltPhaserKit. Build an original '+t.arena+' containing large distinct '+t.plural+' cards, luminous operation gates, a target crest and persistent bands for completed stages. Every operation must move or transform the full affected card geometry with obvious before/intermediate/settled states. Do not use candidate Canvas 2D drawing, create Phaser.Game, create a custom RAF loop or make Phaser physics authoritative.',
      originality:'This candidate uses the trusted operation signature "'+bp.signature_id+'" with primitives '+bp.ops.join(', ')+'. It is a bounded permutation-operations puzzle and must not copy prior branded layouts, art, code, row/column cycling, auto-running, survival, merge, reaction or single-button timing.',
      difficulty:'Implement the trusted rule data exactly: '+JSON.stringify(rules)+' Each seed target is generated by the reviewed Oracle and is reachable from the canonical stage entry. quality.stage=state.stage. quality.complexity equals the number of active operations (1,2,3). quality.objective_progress=completed. quality.meaningful_actions increments once per reviewed projection-changing edge. quality.reversible_state_key is stage:order:outcome.',
      mobile_readability:'At 390x844 keep objective, '+t.progress+' progress, current score, device best, target formation, active cards, operation gates, result, Replay and replay reason in the first viewport. Critical DOM labels are at least14px and lifecycle controls at least44px. Use large symbols and geometry rather than tiny decorative canvas text.',
      result:'Success text is exactly '+t.success+' and failure text exactly '+t.failure+' in data-result. Success assembles all four cards into one complete luminous '+t.arena+' formation with a bounded crest bloom. Failure separates visible card edges and breaks the central band. Show CURRENT SCORE and DEVICE BEST from GameKit plus primary Replay in the initial mobile result viewport.',
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. GamePresentation.reduced_motion must report actual visible behavior. Normal mode uses Phaser tweens for card movement, gate sweeps and bounded particles. Reduced mode applies the permutation instantly but adds a strong static outline/cross cue for at least300ms, with no camera motion. Do not fake compliance through diagnostics.',
      scoring:'Start score0. Award points only on successful LOCK: stage bases 220,360,520 minus 12 per extra operation beyond a small stage baseline, with a floor of140 per formation. Individual operations, waiting, blocked LOCK and immediate inverse/return sequences never award score. observe returns finite tick, score, progress=meaningful_actions, interactions=meaningful_actions and a bounded entity count.',
      completion_timing:'The stall deadline is 2700 GameKit ticks, about45 seconds at60Hz. Tick advances only through GameKit. At tick>=2700 set outcome="failure" unless success completed on that exact step. core.terminal is immediately true for success or failure; there is no minimum success duration or post-success delay.',
      action_feedback:'Every valid operation immediately highlights its gate, shows the affected large cards in visibly different intermediate positions around70ms and150ms, and settles by450ms. Correct LOCK adds a persistent luminous band and expands the crest. Stage3 success creates the complete-formation transformation. Reduced mode uses instant state change plus a strong static cue. Keep effects bounded and derived only from snapshot state.'
    },
    product_contract:pair.productContract,commercial_contract:pair.commercialContract
  };
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(bp,model,productContract,commercialContract){
  const oracleId=bp.slug+'-oracle-v1',oracleFile=path.join(ROOT,'qa/reviewed/'+oracleId+'.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:oracleId,file:oracleId+'.json',sha256:hash(model),scope:'candidate',game_id:bp.game_id,contract_sha256:hash(productContract),reviewed_by:'PlayJolt trusted permutation template reviewer',rationale:'Trusted finite permutation DSL: three stages contain 2/6/24 order states, active operation widths increase 1/2/3, all operations are fixed permutations with bounded return paths, targets are selected only from reachable reviewed states and the full oracle remains below 128 nodes.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:bp.slug+'-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'PlayJolt trusted permutation template reviewer',rationale:'Trusted visual contract uses normal-player regions for legal-vs-future operation visibility, whole-card state distinction, action transitions, 2/3/4-card progression, explicit result transformation, mobile hierarchy and bounded performance.'});
  product.review(productContract);commercial.review(commercialContract,productContract);
}
function load(candidateDir){
  const file=path.join(path.resolve(candidateDir),'blueprint.json');
  return validateBlueprint(JSON.parse(fs.readFileSync(file,'utf8')));
}
async function prepare(candidateDir){
  const bp=load(candidateDir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
  if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
  fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
  const model=buildModel(bp),p=proposalFor(bp,model),pair={productContract:p.product_contract,commercialContract:p.commercial_contract};
  installReviewData(bp,model,pair.productContract,pair.commercialContract);
  const commissioningPolicy=readJSON(path.join(ROOT,'commissioning/policy.json'));
  const gate=validateProposal(p,{policy:commissioningPolicy,catalog:readJSON(path.join(ROOT,'commissioning/catalog.json'))});
  if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-26'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'autonomous-template-intake',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const auth={schema:'playjolt-auto-template/1',game_id:bp.game_id,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner authorized autonomous PlayJolt development without chat handoffs. Candidate was produced by the trusted permutation DSL and is bounded to build1 + repair5, provider calls <=6, estimated model cost <=USD2 and Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:process.env.GITHUB_SHA||'main'};
  for(const [n,d] of Object.entries({'proposal.json':p,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':cp,'authorization.json':auth,'oracle.json':model}))atomicJSON(path.join(root,n),d);
  await new Factory({store:new FileStore(root)}).create(gate.factory_spec);
  console.log(JSON.stringify({preflight:'PASS',game_id:bp.game_id,title:bp.title,signature:bp.signature_id,runtime:'Phaser 4.2.1 + GameKit v2',oracle_hash:hash(model),product_hash:hash(pair.productContract),commercial_hash:hash(pair.commercialContract),warnings:gate.warnings},null,2));
}
function reviews(candidateDir){
  const bp=load(candidateDir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!root||!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');
  const model=buildModel(bp),p=proposalFor(bp,model),stored=readJSON(path.join(root,'proposal.json'));
  if(stored.game_id!==bp.game_id||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(p.product_contract)||hash(stored.commercial_contract)!==hash(p.commercial_contract))throw Error('recovery_contract_mismatch');
  installReviewData(bp,model,p.product_contract,p.commercial_contract);
  console.log(JSON.stringify({reviews:'PASS',game_id:bp.game_id,signature:bp.signature_id,runtime:'Phaser 4.2.1',permissions:'0644'},null,2));
}
async function run(candidateDir){
  const bp=load(candidateDir),root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json')),policyFile=path.join(root,'control-policy.json');
  const worker=new AutonomousWorker({root,settings,policyFile,provider:new OpenAIProvider(),qa:new DockerQA({limits:settings.isolation})});
  const result=await worker.runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));
  if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;
}
function summarize(candidateDir){
  const bp=load(candidateDir),root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};
  const ops=Object.values(ledger.operations).filter(x=>x.game_id===bp.game_id).sort((a,b)=>a.started_at-b.started_at).map(o=>({operation_id:o.operation_id,version:o.version,state:o.state,response_id:o.response_id,input_tokens:o.accounted?.input_tokens??null,output_tokens:o.accounted?.output_tokens??null,estimated_cost:(o.accounted||o.reserved)?.estimated_cost??null,error_code:o.error_code||null}));
  const file=path.join(root,'autonomy/jobs',bp.game_id,'manifest.json'),total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);
  if(!fs.existsSync(file)){console.log(JSON.stringify({schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:null,production_authorized:false},null,2));return;}
  const m=readJSON(file),summary={schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,signature:bp.signature_id,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,failure_reasons:m.failure_reasons},production_authorized:false};
  atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
async function main(candidateDir,cmd=process.argv[2]){
  if(cmd==='prepare')return prepare(candidateDir);
  if(cmd==='reviews')return reviews(candidateDir);
  if(cmd==='run')return run(candidateDir);
  if(cmd==='summarize')return summarize(candidateDir);
  throw Error('usage prepare|reviews|run|summarize');
}
module.exports={validateBlueprint,applyPrimitive,stageSpace,targetFor,buildModel,contracts,proposalFor,main,PRIMITIVES};
