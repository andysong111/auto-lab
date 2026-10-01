'use strict';
const fs=require('node:fs'),path=require('node:path');

function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function walk(dir,out=[]){
  if(!dir||!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,out);
    else if(entry.isFile()&&entry.name==='commissioning-summary.json'&&fs.statSync(full).size<=1024*1024)out.push(full);
  }
  return out;
}
function outcomeFromSummary(summary){
  if(!summary||summary.schema!=='playjolt-auto-template/1'||!summary.game_id||!summary.factory)return null;
  const reasons=Array.isArray(summary.factory.failure_reasons)?summary.factory.failure_reasons:[],failure_codes={};
  for(const row of reasons){const code=String(row?.code||'unknown');failure_codes[code]=(failure_codes[code]||0)+1;}
  const lineage=summary.foundry||{};
  return {
    game_id:summary.game_id,title:summary.title||summary.game_id,
    family_id:lineage.family_id||'permutation-ordering-v1',lane:lineage.lane||'legacy',design_id:lineage.design_id||null,
    state:summary.factory.state,technical:summary.factory.technical_qa_status,product:summary.factory.product_qa_status,
    commercial:summary.factory.commercial_qa_status,repairs:summary.factory.repair_attempt,
    provider_calls:summary.total_calls,estimated_cost_usd:summary.total_estimated_cost,failure_codes
  };
}
function compile({seed,outcomeRoot,maxFamilyRejections=3}){
  const byGame=new Map();
  for(const row of seed?.outcomes||[])byGame.set(row.game_id,row);
  for(const file of walk(outcomeRoot)){
    try{const row=outcomeFromSummary(readJSON(file));if(row)byGame.set(row.game_id,row);}catch{}
  }
  const families={},failures={};
  for(const row of byGame.values()){
    const id=row.family_id||'unknown';
    const stat=families[id]||(families[id]={attempts:0,rejected:0,rc_ready:0,technical_pass:0,product_pass:0,commercial_pass:0,provider_calls:0,estimated_cost_usd:0,failure_codes:{}});
    stat.attempts++;
    if(row.state==='REJECTED')stat.rejected++;
    if(row.state==='RC_READY'||row.state==='READY_TO_SHIP')stat.rc_ready++;
    if(row.technical==='PASS')stat.technical_pass++;
    if(row.product==='PASS')stat.product_pass++;
    if(row.commercial==='PASS')stat.commercial_pass++;
    stat.provider_calls+=Number(row.provider_calls)||0;stat.estimated_cost_usd+=Number(row.estimated_cost_usd)||0;
    for(const [code,count] of Object.entries(row.failure_codes||{})){
      stat.failure_codes[code]=(stat.failure_codes[code]||0)+count;failures[code]=(failures[code]||0)+count;
    }
  }
  const retired_families=[];
  for(const [id,stat] of Object.entries(families)){
    stat.estimated_cost_usd=Number(stat.estimated_cost_usd.toFixed(6));
    if(stat.rejected>=maxFamilyRejections&&stat.rc_ready===0)retired_families.push(id);
  }
  const used_design_ids=[...byGame.values()].map(x=>x.design_id).filter(Boolean);
  const top_failure_codes=Object.entries(failures).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,24).map(([code,count])=>({code,count}));
  return {schema:'playjolt-learning-profile/1',outcome_count:byGame.size,families,retired_families:retired_families.sort(),used_design_ids:[...new Set(used_design_ids)].sort(),top_failure_codes};
}
function main(){
  const [cmd,seedFile,outcomeRoot,outFile]=process.argv.slice(2);
  if(cmd!=='compile'||!seedFile||!outFile)throw Error('usage: learning.cjs compile SEED_JSON OUTCOME_ROOT OUT_JSON');
  const profile=compile({seed:readJSON(seedFile),outcomeRoot});fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(outFile,JSON.stringify(profile,null,2)+'\n');process.stdout.write(JSON.stringify(profile)+'\n');
}
if(require.main===module){try{main();}catch(e){console.error(e.stack||e);process.exit(2);}}
module.exports={outcomeFromSummary,compile};
