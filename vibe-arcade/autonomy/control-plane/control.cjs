'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validate}=require('../orchestrator/manifest.cjs');
const {ACTIVE,classify}=require('./exceptions.cjs');
const {readiness}=require('./metrics.cjs');
const {readStatus}=require('../worker/status.cjs');
function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function loadPolicy(file=path.join(__dirname,'policy.json')){const p=readJSON(file);if(p.auto_production_ship!==false||p.kill_switches?.production_shipping!==true)throw Error('unsafe_control_policy');return p;}
function listJobs(root){
  const dir=path.join(path.resolve(root),'autonomy/jobs');if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>path.join(dir,x.name,'manifest.json')).filter(fs.existsSync).map(f=>validate(readJSON(f))).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
}
function decision(manifest,policy){
  validate(manifest);
  if(policy.kill_switches.factory)return {action:'HOLD',reason:'factory_kill_switch'};
  if(['REJECTED','ARCHIVED'].includes(manifest.state))return {action:'NONE',reason:manifest.state.toLowerCase()};
  if(manifest.state==='READY_TO_SHIP')return {action:'HOLD_RC',reason:'production_shipping_disabled'};
  if(manifest.state==='RC_READY')return policy.auto_rc_enabled&&!policy.kill_switches.release_candidates?{action:'RUN_PREVIEW_RC',reason:'rc_enabled'}:{action:'HOLD_RC',reason:'rc_disabled'};
  if(['PREVIEW_DEPLOYING','PREVIEW_SMOKE'].includes(manifest.state))return {action:'RESUME_RC',reason:'preview_in_progress'};
  if(['REPAIR_PENDING','REPAIRING','BUILD_FAILED','QA_FAILED','QUALITY_FAILED'].includes(manifest.state))return {action:'RESUME_REPAIR',reason:'repair_flow'};
  if(ACTIVE.has(manifest.state)||['IDEA','SPEC_READY'].includes(manifest.state))return {action:'RESUME_FACTORY',reason:'factory_flow'};
  return {action:'HOLD',reason:'unhandled_supervisory_state'};
}
function snapshot({root,policy=loadPolicy(),provider_ready=false,metrics_by_game={},now=Date.now()}){
  const jobs=listJobs(root),counts={};for(const j of jobs)counts[j.state]=(counts[j.state]||0)+1;
  const incidents=jobs.flatMap(j=>classify(j,policy,now));
  for(const j of jobs){const w=readStatus(root,j);if(w&&policy.owner_alerts.critical_codes.includes(w.code)&&!incidents.some(i=>i.game_id===j.game_id&&i.code===w.code))incidents.push({severity:'critical',code:w.code,game_id:j.game_id,state:j.state,owner_action:true});}
  const active=jobs.filter(j=>ACTIVE.has(j.state)||['IDEA','SPEC_READY'].includes(j.state));
  const today=new Date(now).toISOString().slice(0,10),createdToday=jobs.filter(j=>j.created_at.slice(0,10)===today).length;
  let intakeReason='ready';
  if(policy.kill_switches.factory)intakeReason='factory_kill_switch';
  else if(!policy.intake_enabled)intakeReason='intake_disabled';
  else if(!provider_ready)intakeReason='builder_provider_not_ready';
  else if(active.length>=policy.max_active_jobs)intakeReason='active_job_limit';
  else if(createdToday>=policy.max_daily_new_jobs)intakeReason='daily_create_limit';
  const canCreate=intakeReason==='ready';
  const rows=jobs.map(j=>({game_id:j.game_id,title:j.title,version:j.version,state:j.state,repair_attempt:j.repair_attempt,qa_status:j.qa_status,quality_status:j.quality_status,release_status:j.release_status,preview_url:j.preview_url||null,worker:readStatus(root,j),decision:decision(j,policy),metrics:readiness(metrics_by_game[j.game_id]||{},policy)}));
  return {schema:'playjolt-control-plane/1',generated_at:new Date(now).toISOString(),policy_version:policy.version,mode:policy.mode,worker:readStatus(root),automation:{can_create:canCreate,reason:intakeReason,provider_ready,active_jobs:active.length,created_today:createdToday,auto_rc_enabled:policy.auto_rc_enabled,auto_production_ship:false,kill_switches:policy.kill_switches},counts,total_jobs:jobs.length,incidents,owner_action_required:incidents.some(x=>x.owner_action),jobs:rows};
}
module.exports={loadPolicy,listJobs,decision,snapshot};
