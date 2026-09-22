'use strict';
const {ProviderPause}=require('./errors.cjs');
const defaults=Object.freeze({
  per_game:{max_provider_calls:6,max_input_tokens:240000,max_output_tokens:96000,max_estimated_cost:0.50,max_wall_clock_minutes:15},
  global:{daily_provider_call_limit:6,daily_cost_limit:0.50,max_concurrent_builds:1},
  request:{max_input_tokens:60000,max_output_tokens:16000,timeout_ms:120000,max_response_bytes:524288,max_file_bytes:65536,max_files:24},
  isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:180000},
  polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}
});
function bounded(value,min,max,name,integer=false) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw new ProviderPause('invalid_worker_config',name);
  return value;
}
function config(raw={}) {
  const c={};for(const k of Object.keys(defaults))c[k]={...defaults[k],...raw[k]};
  const bounds={per_game:{max_provider_calls:[1,6,true],max_input_tokens:[1,1000000,true],max_output_tokens:[1,200000,true],max_estimated_cost:[0,10],max_wall_clock_minutes:[0.001,240]},
    global:{daily_provider_call_limit:[1,100,true],daily_cost_limit:[0,100],max_concurrent_builds:[1,1,true]},
    request:{max_input_tokens:[1,100000,true],max_output_tokens:[1,32000,true],timeout_ms:[1,300000,true],max_response_bytes:[100,1048576,true],max_file_bytes:[10,262144,true],max_files:[1,32,true]},
    isolation:{cpus:[0.5,2],memory_mb:[512,2048,true],pids:[64,256,true],timeout_ms:[1000,300000,true]},
    polling:{interval_ms:[100,30000,true],max_backoff_ms:[100,60000,true],max_polls:[1,1000,true],max_jobs:[1,1,true]}};
  for(const [section,fields] of Object.entries(bounds))for(const [key,[min,max,int]] of Object.entries(fields))bounded(c[section][key],min,max,section+'.'+key,int);
  if(c.polling.max_backoff_ms<c.polling.interval_ms)throw new ProviderPause('invalid_worker_config','backoff below interval');
  return c;
}
function pricing(raw,{mock=false,now=Date.now()}={}) {
  if(mock)return {input_per_million:0,output_per_million:0,as_of:'mock',estimated:true};
  if(!raw||!Number.isFinite(Date.parse(raw.as_of))||now-Date.parse(raw.as_of)>30*86400000||Date.parse(raw.as_of)>now+86400000)throw new ProviderPause('pricing_not_verified');
  return {input_per_million:bounded(raw.input_per_million,0.000001,1000,'input price'),output_per_million:bounded(raw.output_per_million,0.000001,1000,'output price'),as_of:raw.as_of,estimated:true};
}
module.exports={config,defaults,pricing};
