'use strict';
const fs=require('node:fs');
const FOCUS_RULES=[
  [/difficulty/,'difficulty-progression'],[/progress/,'progress-readability'],[/result_presentation|failure_result/,'result-presentation'],
  [/action_feedback|commercial_motion/,'action-feedback'],[/reduced_motion/,'reduced-motion'],[/mobile_hierarchy/,'mobile-hierarchy'],[/state_distinction/,'state-distinction']
];

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
  const focus=[];
  for(const row of profile?.top_failure_codes||[]){
    const rule=FOCUS_RULES.find(([pattern])=>pattern.test(String(row?.code||'')));
    if(rule&&!focus.includes(rule[1]))focus.push(rule[1]);
    if(focus.length===4)break;
  }
  return focus;
}
function select({sequence,date,designCatalog,benchmarkCatalog,learningProfile}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('invalid_date');
  const lane=laneFor(sequence),retired=new Set(learningProfile?.retired_families||[]),used=new Set(learningProfile?.used_design_ids||[]);
  const familyStatus=new Map((designCatalog?.families||[]).map(x=>[x.id,x.status]));
  const benchmarks=new Map((benchmarkCatalog?.sources||[]).map(x=>[x.id,x]));
  const maxAge=Number(benchmarkCatalog?.max_age_days)||45;
  const eligible=(designCatalog?.designs||[]).filter(x=>x.status==='reviewed'&&x.lane===lane&&familyStatus.get(x.family_id)==='reviewed'&&!retired.has(x.family_id)&&!used.has(x.id)&&(!x.min_sequence||sequence>=x.min_sequence)).filter(x=>{
    if(lane!=='market-benchmark')return !x.benchmark_id;
    const source=benchmarks.get(x.benchmark_id);return source&&ageDays(benchmarkCatalog.captured_at,date)>=0&&ageDays(benchmarkCatalog.captured_at,date)<=maxAge;
  });
  if(!eligible.length)return {schema:'playjolt-foundry-selection/1',status:'IDLE',sequence,lane,reason:lane==='market-benchmark'?'no_fresh_reviewed_market_design':'no_reviewed_original_design'};
  eligible.sort((a,b)=>{
    const as=learningProfile?.families?.[a.family_id]||{},bs=learningProfile?.families?.[b.family_id]||{};
    const av=(as.rc_ready||0)*100-(as.rejected||0)*20-(as.attempts||0),bv=(bs.rc_ready||0)*100-(bs.rejected||0)*20-(bs.attempts||0);
    return bv-av||a.id.localeCompare(b.id);
  });
  const design=eligible[0],benchmark=design.benchmark_id?benchmarks.get(design.benchmark_id):null;
  return {schema:'playjolt-foundry-selection/1',status:'SELECTED',sequence,lane,design,benchmark:benchmark?{id:benchmark.id,publisher:benchmark.publisher,url:benchmark.url,surface:benchmark.surface,transferable_principles:benchmark.transferable_principles}:null,copy_policy:benchmarkCatalog.policy,learning_focus:learningFocus(learningProfile)};
}
function main(){
  const [cmd,sequence,date,designFile,benchmarkFile,learningFile]=process.argv.slice(2);
  if(cmd!=='select'||!learningFile)throw Error('usage: selector.cjs select SEQUENCE YYYY-MM-DD DESIGNS BENCHMARKS LEARNING');
  const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
  process.stdout.write(JSON.stringify(select({sequence:Number(sequence),date,designCatalog:read(designFile),benchmarkCatalog:read(benchmarkFile),learningProfile:read(learningFile)}))+'\n');
}
if(require.main===module){try{main();}catch(e){console.error(e.stack||e);process.exit(2);}}
module.exports={laneFor,ageDays,learningFocus,select};
