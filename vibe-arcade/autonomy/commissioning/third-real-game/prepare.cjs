'use strict';
// Trusted commissioning setup. Never executes candidate code or modifies production policy.
const fs=require('node:fs'),path=require('node:path');
const {validateProposal}=require('../spec-gate.cjs');
const {atomicJSON}=require('../../orchestrator/files.cjs');
const root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');
if(!process.env.FACTORY_WORKER_ROOT||!root.startsWith(path.resolve(process.env.RUNNER_TEMP||'/tmp')+path.sep))throw Error('dedicated_runner_root_required');
if(fs.existsSync(path.join(root,'autonomy')))throw Error('existing_state_requires_exact_checkpoint_resume');
const proposal=require('./proposal.json'),approval=require('./run-request.json');
const gate=validateProposal(proposal);
if(!gate.passed||approval.game_id!==proposal.game_id||approval.model!=='gpt-5.6-terra'||approval.max_generations!==6||approval.estimated_usd_ceiling!==2||!approval.user_authorized||approval.production_authorized)throw Error('commissioning_gate_failed');
const settings=require('./worker-config.json');
if(settings.per_game.max_estimated_cost>2||settings.global.daily_cost_limit>2||settings.per_game.max_provider_calls>6||settings.release_candidates)throw Error('commissioning_budget_invalid');
const policy=JSON.parse(JSON.stringify(require('../../control-plane/policy.json')));
Object.assign(policy,{mode:'third-real-game-one-candidate',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});
Object.assign(policy.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
for(const [name,data] of Object.entries({'spec-gate.json':gate,'factory-spec.json':gate.factory_spec,'worker-config.json':settings,'control-policy.json':policy,'authorization.json':approval}))atomicJSON(path.join(root,name),data);
console.log(JSON.stringify({game_id:proposal.game_id,spec_gate:'PASS',model:approval.model,max_generations:6,estimated_usd_ceiling:2,production_authorized:false}));
