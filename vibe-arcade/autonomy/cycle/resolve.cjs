'use strict';
const fs=require('node:fs'),path=require('node:path');

const REQUEST_RE=/^vibe-arcade\/autonomy\/commissioning\/([^/]+)\/preflight-request\.json$/;
function fail(message){const e=new Error(message);e.code='auto_cycle_invalid_request';throw e;}
function resolveRequest(root,requestPath){
  const rel=String(requestPath||'').replace(/\\/g,'/');
  const match=REQUEST_RE.exec(rel);if(!match)fail('request_path_not_allowed');
  const full=path.resolve(root,rel),base=path.resolve(root,'vibe-arcade/autonomy/commissioning');
  if(!(full===base||full.startsWith(base+path.sep)))fail('request_path_escape');
  const request=JSON.parse(fs.readFileSync(full,'utf8'));
  for(const key of ['game_id','candidate','runtime'])if(typeof request[key]!=='string'||!request[key].trim())fail('missing_'+key);
  if(request.auto_commission!==true)fail('auto_commission_not_authorized');
  if(request.production_authorized!==false)fail('production_must_remain_off');
  if(!Number.isInteger(request.authorized_provider_calls)||request.authorized_provider_calls<1||request.authorized_provider_calls>6)fail('provider_call_bound');
  if(typeof request.estimated_usd_ceiling!=='number'||request.estimated_usd_ceiling<=0||request.estimated_usd_ceiling>2)fail('cost_bound');
  const dir=path.dirname(full),script=path.join(dir,'commission.cjs');
  if(!fs.existsSync(script))fail('commission_script_missing');
  return {
    slot:match[1],
    request_path:rel,
    candidate_dir:path.posix.dirname(rel),
    commission_script:path.posix.join(path.posix.dirname(rel),'commission.cjs'),
    game_id:request.game_id,
    candidate:request.candidate,
    runtime:request.runtime,
    authorized_provider_calls:request.authorized_provider_calls,
    estimated_usd_ceiling:request.estimated_usd_ceiling,
    production_authorized:false
  };
}
if(require.main===module){
  const requestPath=process.argv[2];if(!requestPath){console.error('usage: node resolve.cjs <preflight-request.json>');process.exit(2);}
  try{process.stdout.write(JSON.stringify(resolveRequest(process.cwd(),requestPath))+'\n');}
  catch(e){console.error(e.code+': '+e.message);process.exit(2);}
}
module.exports={resolveRequest,REQUEST_RE};
