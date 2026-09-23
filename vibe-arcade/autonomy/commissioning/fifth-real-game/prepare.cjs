'use strict';
const fs=require('node:fs'),path=require('node:path');
const {gate,product,commercial}=require('./preflight.cjs');
const {atomicJSON}=require('../../orchestrator/files.cjs');
const {Factory}=require('../../orchestrator/engine.cjs');
const {FileStore}=require('../../orchestrator/store.cjs');
async function main(){
 const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
 if(!process.env.FACTORY_WORKER_ROOT||!root.startsWith(path.resolve(process.env.RUNNER_TEMP||'/tmp')+path.sep))throw Error('dedicated_runner_root_required');
 if(fs.existsSync(path.join(root,'autonomy')))throw Error('existing_state_requires_exact_checkpoint_resume');
 const approval=require('./run-request.json'),settings=require('./worker-config.json');
 if(settings.per_game.max_estimated_cost>3||settings.global.daily_cost_limit>3||settings.per_game.max_provider_calls!==6||settings.release_candidates||settings.global.max_concurrent_builds!==1)throw Error('commissioning_budget_invalid');
 const policy=JSON.parse(JSON.stringify(require('../../control-plane/policy.json')));
 Object.assign(policy,{mode:'fifth-real-game-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});
 Object.assign(policy.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
 for(const [name,data] of Object.entries({'spec-gate.json':gate,'product-preflight.json':{schema:'PASS',review:'PASS',approval:product.approval},'commercial-preflight.json':{schema:'PASS',review:'PASS',approval:commercial.approval},'factory-spec.json':gate.factory_spec,'worker-config.json':settings,'control-policy.json':policy,'authorization.json':approval}))atomicJSON(path.join(root,name),data);
 await new Factory({store:new FileStore(root)}).create(gate.factory_spec);
 console.log('Created one isolated SPEC job; release/production disabled.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
