'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const GOLDEN=path.join(__dirname,'golden/halo-guard-v9/identity.json');
const REGISTRY=path.join(__dirname,'component-registry.json');
const RULES=path.join(__dirname,'rule-modules.json');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail=code=>{throw Error('golden_preflight:'+code);};
const fields=['outcome','reason','tick','phase','score','progress','best_combo','lives','barrier'];

function validateRegistry(identity,registry,rules){
  if(registry?.schema!=='playjolt-reviewed-components/1')fail('component_schema');
  if(rules?.schema!=='playjolt-rule-modules/1')fail('rule_schema');
  const components=new Map((registry.components||[]).map(row=>[row.id,row]));
  if(components.size!==(registry.components||[]).length)fail('duplicate_component');
  for(const id of identity.components){const row=components.get(id);if(!row||row.status!=='reviewed')fail('unreviewed_component_'+id);for(const compatible of row.compatible_with||[])if(!components.has(compatible))fail('missing_compatibility_'+compatible);}
  const modules=new Map((rules.modules||[]).map(row=>[row.id,row]));
  for(const id of identity.rule_modules){const row=modules.get(id);if(!row||row.status!=='reviewed')fail('unreviewed_rule_'+id);for(const required of row.requires||[])if(!identity.components.includes(required))fail('rule_component_'+required);}
  const categories=new Set(identity.components.map(id=>components.get(id).category));
  for(const required of ['mechanic-runtime','input-adapter','lifecycle','difficulty','character-roles','environment-camera','feedback-audio','mobile-accessibility'])if(!categories.has(required))fail('missing_category_'+required);
  return components;
}
function chooseTarget(state,mode){
  const desired=state.items.filter(item=>item.r<6&&!item.done&&(mode==='failure'?item.bad:!item.bad)).sort((a,b)=>a.r-b.r)[0];
  if(desired)return desired.currentAngle;
  if(mode==='success'){const danger=state.items.filter(item=>item.bad&&item.r<5).sort((a,b)=>a.r-b.r)[0];if(danger)return danger.currentAngle+Math.PI;}
  return null;
}
function snapshot(core,state){const observed=core.observe(state),out={};for(const key of fields)out[key]=observed[key];return out;}
function simulate(core,seed,mode,oracle){
  const state=core.create(seed);core.begin(state);let maxEntities=0;
  for(let index=0;index<6000&&!core.terminal(state);index++){
    const target=chooseTarget(state,mode);if(target!==null)core.setTarget(state,target);
    core.step(state,oracle.step_seconds,{reducedMotion:oracle.reduced_motion});maxEntities=Math.max(maxEntities,state.items.length);
  }
  if(!core.terminal(state))fail('oracle_nonterminal_'+seed+'_'+mode);
  return {snapshot:snapshot(core,state),maxEntities};
}
function verifyInputParity(core){
  for(const [direction,delta] of [['left',.36],['right',-.36]]){
    const keyboard=core.create(7),pointer=core.create(7);core.begin(keyboard);core.begin(pointer);core.nudge(keyboard,direction);core.setTarget(pointer,pointer.targetAngle+delta);core.step(keyboard,.05,{reducedMotion:true});core.step(pointer,.05,{reducedMotion:true});
    if(Math.abs(keyboard.angle-pointer.angle)>1e-12)fail('input_parity_'+direction);
  }
}
function verify({identityFile=GOLDEN,registryFile=REGISTRY,rulesFile=RULES}={}){
  const identity=read(identityFile),registry=read(registryFile),rules=read(rulesFile);
  if(identity?.schema!=='playjolt-golden-play/1'||identity.status!=='reviewed'||identity.production_authorized!==false)fail('identity');
  const runtime=path.join(ROOT,identity.runtime.path);if(!fs.existsSync(runtime)||hash(runtime)!==identity.runtime.sha256)fail('runtime_sha256');
  for(const screenshot of identity.visual_evidence.screenshots)if(!fs.existsSync(path.join(ROOT,screenshot)))fail('visual_evidence');
  validateRegistry(identity,registry,rules);
  delete require.cache[require.resolve(runtime)];const core=require(runtime);if(core.VERSION!==identity.runtime.id)fail('runtime_version');
  verifyInputParity(core);
  const oracle=read(path.join(ROOT,identity.oracle));if(oracle.schema!=='playjolt-golden-oracle/1'||oracle.runtime!==core.VERSION||Object.keys(oracle.seeds).length!==6)fail('oracle_schema');
  let maxEntities=0;
  for(const [seedText,expected] of Object.entries(oracle.seeds))for(const mode of ['success','failure']){
    const first=simulate(core,Number(seedText),mode,oracle),second=simulate(core,Number(seedText),mode,oracle),motion=simulate(core,Number(seedText),mode,{...oracle,reduced_motion:!oracle.reduced_motion});maxEntities=Math.max(maxEntities,first.maxEntities,second.maxEntities,motion.maxEntities);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(expected[mode]))fail('oracle_'+seedText+'_'+mode);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(second.snapshot))fail('replay_'+seedText+'_'+mode);
    if(JSON.stringify(first.snapshot)!==JSON.stringify(motion.snapshot))fail('reduced_motion_outcome_'+seedText+'_'+mode);
  }
  if(maxEntities>identity.performance.max_active_entities)fail('entity_bound');
  return {schema:'playjolt-golden-preflight/1',status:'PASS',golden:identity.id,runtime:core.VERSION,components:identity.components.length,rules:identity.rule_modules.length,seeds:Object.keys(oracle.seeds).length,max_entities:maxEntities,reduced_motion_equivalence:'score-progress-terminal',production:false};
}
function main(){if(process.argv[2]!=='verify')throw Error('usage: game-compiler.cjs verify');process.stdout.write(JSON.stringify(verify())+'\n');}
if(require.main===module){try{main();}catch(error){console.error(error.stack||error);process.exit(2);}}
module.exports={validateRegistry,simulate,verify};
