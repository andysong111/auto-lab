'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..'),GOLDEN_ID='halo-guard-v9',SEEDS=[7,19,42,77,998,74021];
const GOLDEN=path.join(__dirname,'golden',GOLDEN_ID),core=require('../../lab/taste-calibration/halo-guard-core.js'),radial=require('../gamekit/radialkit.js');
const radialModel=require('../qa/radial-model.cjs');
const {hash,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {validateProposal}=require('../commissioning/spec-gate.cjs');
const product=require('../qa/product-contract.cjs'),commercial=require('../qa/commercial/contract.cjs');
const {Factory}=require('../orchestrator/engine.cjs'),{FileStore}=require('../orchestrator/store.cjs');
const {AutonomousWorker}=require('../worker/runtime.cjs'),{DockerQA}=require('../isolation/docker-qa.cjs'),{OpenAIProvider}=require('../providers/openai.cjs');
const {continuePreview,writeReleasePacket}=require('../commissioning/rc-continuation.cjs');
const proposal=require('./radial-proposal.cjs');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
const fail=code=>{const error=Error(code);error.code='radial_runner_invalid';throw error;};
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/,SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEARNING_FOCUS=new Set(['input-parity','lifecycle-integrity','difficulty-progression','progress-readability','result-presentation','action-feedback','reduced-motion','mobile-hierarchy','state-distinction']);
function text(value,min=2,max=80){if(typeof value!=='string'||value.length<min||value.length>max||!/^[A-Za-z][A-Za-z0-9 -]*$/.test(value))fail('text');return value;}

function validateBlueprint(bp){
  if(!bp||bp.schema!=='playjolt-foundry-blueprint/1'||!ID.test(bp.game_id||'')||!SLUG.test(bp.slug||'')||bp.runner!=='foundry/radial-runner.cjs'||bp.family_id!=='radial-guarding'||!SLUG.test(bp.design_id||''))fail('radial_blueprint_identity');
  text(bp.title,3,64);
  if(bp.lane!=='market-benchmark'||!bp.foundry||bp.foundry.schema!=='playjolt-foundry-lineage/1'||bp.foundry.lane!==bp.lane||bp.foundry.family_id!==bp.family_id||bp.foundry.design_id!==bp.design_id||bp.foundry.runner!==bp.runner)fail('radial_lineage');
  if(!Array.isArray(bp.learning_focus)||bp.learning_focus.length>4||new Set(bp.learning_focus).size!==bp.learning_focus.length||bp.learning_focus.some(value=>!LEARNING_FOCUS.has(value))||JSON.stringify(bp.foundry.learning_focus)!==JSON.stringify(bp.learning_focus))fail('radial_learning_focus');
  if(!SLUG.test(bp.benchmark?.id||'')||typeof bp.benchmark?.url!=='string'||!bp.benchmark.url.startsWith('https://play.google.com/')||!Array.isArray(bp.benchmark.transferable_principles)||bp.benchmark.transferable_principles.length<2||!Array.isArray(bp.copy_policy?.forbidden)||bp.copy_policy.forbidden.length<4)fail('radial_benchmark');
  if(typeof bp.novelty_contract!=='string'||bp.novelty_contract.length<40||bp.novelty_contract.length>500)fail('radial_novelty_contract');
  for(const key of ['singular','plural','arena','progress','success','failure'])text(bp.theme?.[key],key==='progress'?4:2,48);
  if(bp.golden_baseline_id!==GOLDEN_ID||bp.foundry?.golden_baseline_id!==GOLDEN_ID)fail('golden_baseline_required');
  if(!Array.isArray(bp.seeds)||JSON.stringify(bp.seeds)!==JSON.stringify(SEEDS))fail('golden_seed_set_required');
  const variation=bp.variation;
  if(!variation||!['difficulty','world-kit','progression'].includes(variation.axis)||!Array.isArray(variation.changed_components)||variation.changed_components.length!==1)fail('single_axis_variation_required');
  if(typeof variation.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variation.id))fail('variation_id');
  const components=read(path.join(__dirname,'component-registry.json')).components||[],component=components.find(row=>row.id===variation.changed_components[0]);
  if(!component||component.status!=='reviewed'||component.category!=='world-kit')fail('reviewed_world_kit_required');
  return bp;
}
function chooseTarget(state,mode){
  const desired=state.items.filter(item=>item.r<6&&!item.done&&(mode==='failure'?item.bad:!item.bad)).sort((a,b)=>a.r-b.r)[0];
  if(desired)return desired.currentAngle;
  if(mode==='success'){const danger=state.items.filter(item=>item.bad&&item.r<5).sort((a,b)=>a.r-b.r)[0];if(danger)return danger.currentAngle+Math.PI;}
  return null;
}
function pointFor(angle){return {x:.5+Math.cos(angle)*.42,y:.5-Math.sin(angle)*.42};}
function snapshot(state){const value=core.observe(state);return Object.fromEntries(['outcome','reason','tick','phase','score','progress','best_combo','lives','barrier'].map(key=>[key,value[key]]));}
function runTrace(seed,mode){
  const adapter=radial.create({id:'halo-guard-v1'}),state=adapter.create(seed);adapter.begin(state);let maxEntities=0;
  for(let index=0;index<6000&&!adapter.terminal(state);index++){
    const target=chooseTarget(state,mode),input=target===null?{}:{pointer:pointFor(target)};
    adapter.step(state,input);maxEntities=Math.max(maxEntities,state.items.length);
  }
  if(!adapter.terminal(state))fail('nonterminal_'+seed+'_'+mode);
  return {snapshot:snapshot(state),maxEntities,quality:adapter.observe(state).quality};
}
function runControlTrace(seed,mode,control){
  const adapter=radial.create({id:'halo-guard-v1'}),state=adapter.create(seed);adapter.begin(state);let maxEntities=0,held=null;
  for(let interval=0;interval<3000&&!adapter.terminal(state);interval++){
    const target=chooseTarget(state,mode);let desired=null;
    if(target!==null&&control==='keyboard'){
      const delta=radialModel.signedAngle(target,state.targetAngle);
      if(Math.abs(delta)>.1)desired=delta>0?'left':'right';
    }
    const pointer=target===null?null:pointFor(target);
    for(let step=0;step<2&&!adapter.terminal(state);step++){
      let input={};
      if(control==='pointer'&&pointer)input={pointer};
      if(control==='keyboard'&&desired){
        if(step===0&&desired!==held)input={actions:{[desired==='left'?'guard_left':'guard_right']:true}};
        else input={x:desired==='left'?-1:1};
      }
      adapter.step(state,input);maxEntities=Math.max(maxEntities,state.items.length);
    }
    held=desired;
  }
  if(!adapter.terminal(state))fail('nonterminal_'+seed+'_'+mode+'_'+control);
  return {snapshot:snapshot(state),maxEntities};
}
function verifyInputParity(){
  const adapter=radial.create({id:'halo-guard-v1'});
  for(const [action,delta] of [['guard_left',.36],['guard_right',-.36]]){
    const keyboard=adapter.create(7),pointer=adapter.create(7);adapter.begin(keyboard);adapter.begin(pointer);
    adapter.step(keyboard,{actions:{[action]:true}});adapter.step(pointer,{pointer:pointFor(pointer.targetAngle+delta)});
    if(Math.abs(keyboard.angle-pointer.angle)>1e-12||adapter.observe(keyboard).quality.reversible_state_key!==adapter.observe(pointer).quality.reversible_state_key)fail('input_parity_'+action);
  }
}
function buildModel(input){
  const bp=validateBlueprint(input),identity=read(path.join(GOLDEN,'identity.json')),oracle=read(path.join(GOLDEN,'oracle.json'));
  if(identity.runtime.id!==core.VERSION||identity.runtime.sha256!==digest(path.join(ROOT,identity.runtime.path)))fail('golden_runtime_drift');
  verifyInputParity();let maxEntities=0;const traces={};
  for(const seed of bp.seeds){traces[String(seed)]={};for(const mode of ['success','failure']){
    const first=runTrace(seed,mode),second=runTrace(seed,mode);maxEntities=Math.max(maxEntities,first.maxEntities,second.maxEntities);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(oracle.seeds[String(seed)][mode]))fail('oracle_'+seed+'_'+mode);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(second.snapshot))fail('replay_'+seed+'_'+mode);
    traces[String(seed)][mode]=first.snapshot;
  }}
  if(maxEntities>identity.performance.max_active_entities)fail('entity_bound');
  const seeds={};
  for(const seed of bp.seeds){seeds[String(seed)]={pointer:{},keyboard:{}};for(const control of ['pointer','keyboard'])for(const mode of ['success','failure']){
    const first=runControlTrace(seed,mode,control),second=runControlTrace(seed,mode,control);maxEntities=Math.max(maxEntities,first.maxEntities,second.maxEntities);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(second.snapshot))fail('control_replay_'+seed+'_'+mode+'_'+control);
    seeds[String(seed)][control][mode]=first.snapshot;
  }}
  const model={schema_version:1,interaction_mode:radialModel.MODE,golden_baseline_id:GOLDEN_ID,runtime:radial.VERSION,variation:bp.variation,
    projection:['state.phase','state.caught','state.lives','state.barrier','state.outcome'],anchors:{initial:{tick:0,stage:1},early:{tick:360,stage:1},mid:{tick:1200,stage:2},late:{tick:2040,stage:3}},seeds,
    golden_traces:traces,max_entities:maxEntities,input_parity:'continuous-pointer-and-keyboard-nudge',production_authorized:false};
  return radialModel.validate(model);
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(row=>row.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(bp,model,productContract,commercialContract){
  const oracleId=bp.slug+'-oracle-v1',oracleFile=path.join(ROOT,'autonomy/qa/reviewed',oracleId+'.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'autonomy/qa/reviewed/registry.json'),{id:oracleId,file:oracleId+'.json',sha256:hash(model),scope:'candidate',game_id:bp.game_id,contract_sha256:hash(productContract),reviewed_by:'PlayJolt golden radial reviewer',rationale:'Reviewed continuous Halo Guard golden model with six deterministic pointer and keyboard success/failure traces, bounded entities and no production authority.'});
  appendRegistry(path.join(ROOT,'autonomy/qa/commercial/reviewed/registry.json'),{id:bp.slug+'-commercial-v1',scope:'candidate',contract_sha256:hash(commercialContract),product_contract_sha256:hash(productContract),reviewed_by:'PlayJolt golden radial reviewer',rationale:'Reviewed continuous-radial visual anchors, shield motion, character readability, progression, result, mobile hierarchy, gesture audio and performance evidence.'});
  product.review(productContract);commercial.review(commercialContract,productContract);
}
function load(dir){return validateBlueprint(readJSON(path.join(path.resolve(dir),'blueprint.json')));}
async function prepare(dir){
  const bp=load(dir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
  if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
  fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});
  const model=buildModel(bp),candidate=proposal.proposalFor(bp,model);installReviewData(bp,model,candidate.product_contract,candidate.commercial_contract);
  const gate=validateProposal(candidate,{policy:readJSON(path.join(ROOT,'autonomy/commissioning/policy.json')),catalog:readJSON(path.join(ROOT,'autonomy/commissioning/catalog.json'))});
  if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-26'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const control=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'autonomy/control-plane/policy.json'))));Object.assign(control,{mode:'autonomous-foundry-v2',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(control.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const authorization={schema:'playjolt-foundry-authorization/1',game_id:bp.game_id,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner approved Halo Guard V9 as the golden gameplay baseline and authorized one reviewed market-benchmark variation axis. This candidate preserves the exact golden mechanic and changes only the reviewed cloud-caravan world kit. Build1 + repair5, provider calls <=6, estimated cost <=USD2, Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:process.env.GITHUB_SHA||'main'};
  for(const [name,data] of Object.entries({'proposal.json':candidate,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':control,'authorization.json':authorization,'oracle.json':model}))atomicJSON(path.join(root,name),data);
  await new Factory({store:new FileStore(root)}).create(gate.factory_spec);
  console.log(JSON.stringify({preflight:'PASS',game_id:bp.game_id,title:bp.title,golden_baseline_id:bp.golden_baseline_id,variation:bp.variation,foundry:bp.foundry,runtime:'Phaser 4.2.1 + GameKit v3 + RadialKit v1 + Feel Kit',oracle_hash:hash(model),product_hash:hash(candidate.product_contract),commercial_hash:hash(candidate.commercial_contract),warnings:gate.warnings,production_authorized:false},null,2));
}
function reviews(dir){
  const bp=load(dir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');
  const model=buildModel(bp),candidate=proposal.proposalFor(bp,model),stored=readJSON(path.join(root,'proposal.json'));
  if(stored.game_id!==bp.game_id||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(candidate.product_contract)||hash(stored.commercial_contract)!==hash(candidate.commercial_contract))throw Error('recovery_contract_mismatch');
  installReviewData(bp,model,candidate.product_contract,candidate.commercial_contract);console.log(JSON.stringify({reviews:'PASS',game_id:bp.game_id,family:bp.family_id,lane:bp.lane,golden_baseline_id:bp.golden_baseline_id,variation:bp.variation,runtime:'Phaser 4.2.1 + RadialKit v1',permissions:'0644',production_authorized:false},null,2));
}
async function run(dir){const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json'));const result=await new AutonomousWorker({root,settings,policyFile:path.join(root,'control-policy.json'),provider:new OpenAIProvider(),qa:new DockerQA({limits:settings.isolation})}).runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;}
async function preview(dir){const bp=load(dir),result=await continuePreview(process.env.FACTORY_WORKER_ROOT,bp.game_id);console.log(JSON.stringify({schema:'playjolt-preview-continuation/1',game_id:bp.game_id,state:result.state,preview_url:result.preview_url||null,rc_commit:result.rc_commit||null,base_commit:result.base_commit||null,production_authorized:false},null,2));}
function releasePacket(dir){const bp=load(dir);console.log(JSON.stringify(writeReleasePacket(process.env.FACTORY_WORKER_ROOT,bp.game_id),null,2));}
function summarize(dir){
  const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};
  const operations=Object.values(ledger.operations).filter(row=>row.game_id===bp.game_id).sort((a,b)=>a.started_at-b.started_at).map(row=>({operation_id:row.operation_id,version:row.version,state:row.state,response_id:row.response_id,input_tokens:row.accounted?.input_tokens??null,output_tokens:row.accounted?.output_tokens??null,estimated_cost:(row.accounted||row.reserved)?.estimated_cost??null,error_code:row.error_code||null}));
  const manifestFile=path.join(root,'autonomy/jobs',bp.game_id,'manifest.json'),total=operations.reduce((sum,row)=>sum+(row.estimated_cost||0),0),base={schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,signature:bp.design_id,foundry:bp.foundry,golden_baseline_id:bp.golden_baseline_id,variation:bp.variation,runtime:'phaser-4.2.1-radialkit-1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations,total_calls:operations.length,total_estimated_cost:Number(total.toFixed(8)),production_authorized:false};
  if(!fs.existsSync(manifestFile)){console.log(JSON.stringify({...base,factory:null},null,2));return;}
  const manifest=readJSON(manifestFile),summary={...base,factory:{state:manifest.state,version:manifest.version,repair_attempt:manifest.repair_attempt,technical_qa_status:manifest.technical_qa_status,product_qa_status:manifest.product_qa_status,commercial_qa_status:manifest.commercial_qa_status,quality_status:manifest.quality_status,source_hash:manifest.source_hash,preview_url:manifest.preview_url||null,rc_commit:manifest.rc_commit||null,base_commit:manifest.base_commit||null,failure_reasons:manifest.failure_reasons}};atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));
}
async function main(dir,command=process.argv[2]){if(command==='verify'){const bp=load(dir),result=buildModel(bp);process.stdout.write(JSON.stringify(result)+'\n');return result;}if(command==='prepare')return prepare(dir);if(command==='reviews')return reviews(dir);if(command==='run')return run(dir);if(command==='preview')return preview(dir);if(command==='release-packet')return releasePacket(dir);if(command==='summarize')return summarize(dir);throw Error('usage verify|prepare|reviews|run|preview|release-packet|summarize');}
module.exports={GOLDEN_ID,SEEDS,validateBlueprint,buildModel,installReviewData,proposalFor:proposal.proposalFor,contracts:proposal.contracts,buildInvariants:proposal.buildInvariants,main,pointFor,runTrace,runControlTrace,chooseTarget};
