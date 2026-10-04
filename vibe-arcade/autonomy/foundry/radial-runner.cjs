'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..'),GOLDEN_ID='halo-guard-v9',SEEDS=[7,19,42,77,998,74021];
const GOLDEN=path.join(__dirname,'golden',GOLDEN_ID),core=require('../../lab/taste-calibration/halo-guard-core.js'),radial=require('../gamekit/radialkit.js');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail=code=>{const error=Error(code);error.code='radial_runner_invalid';throw error;};

function validateBlueprint(bp){
  if(!bp||bp.schema!=='playjolt-foundry-blueprint/1'||bp.runner!=='foundry/radial-runner.cjs'||bp.family_id!=='radial-guarding')fail('radial_blueprint_identity');
  if(bp.golden_baseline_id!==GOLDEN_ID||bp.foundry?.golden_baseline_id!==GOLDEN_ID)fail('golden_baseline_required');
  if(!Array.isArray(bp.seeds)||JSON.stringify(bp.seeds)!==JSON.stringify(SEEDS))fail('golden_seed_set_required');
  const variation=bp.variation;
  if(!variation||!['difficulty','world-kit','progression'].includes(variation.axis)||!Array.isArray(variation.changed_components)||variation.changed_components.length!==1)fail('single_axis_variation_required');
  if(typeof variation.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variation.id))fail('variation_id');
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
  return {schema:'playjolt-radial-variation-proof/1',golden_baseline_id:GOLDEN_ID,runtime:radial.VERSION,variation:bp.variation,seeds:traces,max_entities:maxEntities,input_parity:'continuous-pointer-and-keyboard-nudge',production_authorized:false};
}
async function main(dir,command){
  if(command!=='verify')throw Error('radial_runner_zero_paid_verify_only');
  const bp=read(path.join(path.resolve(dir),'blueprint.json')),result=buildModel(bp);process.stdout.write(JSON.stringify(result)+'\n');return result;
}
module.exports={GOLDEN_ID,SEEDS,validateBlueprint,buildModel,main,pointFor,runTrace};
