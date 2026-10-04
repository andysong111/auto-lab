'use strict';
const fs=require('node:fs');
const {gate:calibrationGate}=require('./taste-calibration.cjs');
const FOCUS_RULES=[
  [/^(touch|keyboard)$|input_parity/,'input-parity'],
  [/product_(completion|replay|practice_best|failure_result)|^(terminal|restart)$/,'lifecycle-integrity'],
  [/difficulty/,'difficulty-progression'],[/progress|score_integrity/,'progress-readability'],[/result_presentation/,'result-presentation'],
  [/(action_)?feedback|commercial_motion/,'action-feedback'],[/reduced_motion/,'reduced-motion'],[/mobile_(hierarchy|readability)/,'mobile-hierarchy'],[/state_distinction|route_topology/,'state-distinction']
];
const BLOCKING_FOCUS=['input-parity','lifecycle-integrity'];
const LEGACY_FAMILY_RUNNER='foundry/family-runner.cjs';

function laneFor(sequence){
  if(!Number.isInteger(sequence)||sequence<1)throw Error('invalid_sequence');
  return sequence%2===0?'market-benchmark':'original';
}
function ageDays(captured,date){
  const a=Date.parse(captured+'T00:00:00Z'),b=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(a)||!Number.isFinite(b))return Infinity;
  return Math.floor((b-a)/86400000);
}
function learningFocus(profile){
  const totals=new Map();
  for(const row of profile?.top_failure_codes||[]){
    const rule=FOCUS_RULES.find(([pattern])=>pattern.test(String(row?.code||'')));
    if(rule)totals.set(rule[1],(totals.get(rule[1])||0)+(Number(row?.count)||0));
  }
  const focus=BLOCKING_FOCUS.filter(name=>totals.has(name));
  const remaining=[...totals].filter(([name])=>!focus.includes(name)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  for(const [name] of remaining){if(focus.length===4)break;focus.push(name);}
  return focus;
}
function select({sequence,date,designCatalog,benchmarkCatalog,learningProfile,calibrationPolicy=null}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('invalid_date');
  const lane=laneFor(sequence);
  if(calibrationPolicy){
    const calibration=calibrationGate({sequence,policy:calibrationPolicy,learningProfile});
    if(!calibration.allowed)return {schema:'playjolt-foundry-selection/1',status:'IDLE',sequence,lane,reason:calibration.reason,consecutive_regressions:calibration.consecutive_regressions||0};
  }
  const retired=new Set(learningProfile?.retired_families||[]),used=new Set(learningProfile?.used_design_ids||[]);
  const familyStatus=new Map((designCatalog?.families||[]).map(x=>[x.id,x.status]));
  const benchmarks=new Map((benchmarkCatalog?.sources||[]).map(x=>[x.id,x]));
  const maxAge=Number(benchmarkCatalog?.max_age_days)||45;
  const legacyMax=Number(designCatalog?.policy?.legacy_family_runner_max_sequence);
  const baseEligible=(designCatalog?.designs||[]).filter(x=>x.status==='reviewed'&&x.lane===lane&&familyStatus.get(x.family_id)==='reviewed'&&!retired.has(x.family_id)&&!used.has(x.id)&&(!x.min_sequence||sequence>=x.min_sequence));
  const newRunnerRequired=Number.isInteger(legacyMax)&&sequence>legacyMax;
  const eligible=baseEligible.filter(x=>!Number.isInteger(legacyMax)||sequence<=legacyMax||(x.runner||LEGACY_FAMILY_RUNNER)!==LEGACY_FAMILY_RUNNER).filter(x=>{
    if(lane!=='market-benchmark')return !x.benchmark_id;
    const source=benchmarks.get(x.benchmark_id),captured=source?.captured_at||benchmarkCatalog.captured_at;return source&&ageDays(captured,date)>=0&&ageDays(captured,date)<=maxAge;
  });
  if(!eligible.length)return {schema:'playjolt-foundry-selection/1',status:'IDLE',sequence,lane,reason:newRunnerRequired?'new_interaction_runner_required':lane==='market-benchmark'?'no_fresh_reviewed_market_design':'no_reviewed_original_design'};
  eligible.sort((a,b)=>{
    const as=learningProfile?.families?.[a.family_id]||{},bs=learningProfile?.families?.[b.family_id]||{};
    const av=(as.rc_ready||0)*100-(as.rejected||0)*20-(as.attempts||0),bv=(bs.rc_ready||0)*100-(bs.rejected||0)*20-(bs.attempts||0);
    return bv-av||a.id.localeCompare(b.id);
  });
  const design=eligible[0],benchmark=design.benchmark_id?benchmarks.get(design.benchmark_id):null;
  return {schema:'playjolt-foundry-selection/1',status:'SELECTED',sequence,lane,design,benchmark:benchmark?{id:benchmark.id,publisher:benchmark.publisher,url:benchmark.url,surface:benchmark.surface,transferable_principles:benchmark.transferable_principles}:null,copy_policy:benchmarkCatalog.policy,learning_focus:learningFocus(learningProfile)};
}
function main(){
  const [cmd,sequence,date,designFile,benchmarkFile,learningFile,calibrationFile]=process.argv.slice(2);
  if(cmd!=='select'||!learningFile)throw Error('usage: selector.cjs select SEQUENCE YYYY-MM-DD DESIGNS BENCHMARKS LEARNING');
  const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
  process.stdout.write(JSON.stringify(select({sequence:Number(sequence),date,designCatalog:read(designFile),benchmarkCatalog:read(benchmarkFile),learningProfile:read(learningFile),calibrationPolicy:calibrationFile?read(calibrationFile):null}))+'\n');
}
if(require.main===module){try{main();}catch(e){console.error(e.stack||e);process.exit(2);}}
module.exports={laneFor,ageDays,learningFocus,select};
