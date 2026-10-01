'use strict';
const fs=require('node:fs'),path=require('node:path');
const {readJSON}=require('../orchestrator/files.cjs');

const GAME=/^GAME-[0-9]{8}-[0-9]{3,6}$/;
const RETRYABLE=new Set(['provider_timeout','provider_network_error','provider_rate_limited']);
const TERMINAL=new Set(['REJECTED','RC_READY','READY_TO_SHIP','ARCHIVED']);
const MAX_RECOVERY_ATTEMPTS=3;

function load(root,name){const file=path.join(root,name);if(!fs.existsSync(file))throw Error('recovery_file_missing:'+name);return readJSON(file);}
function integer(value,min,max){return Number.isInteger(value)&&value>=min&&value<=max;}
function decimal(value,min,max){return typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;}
function inspect(root,gameId,attempt=0){
  root=path.resolve(root);attempt=Number(attempt);
  if(!GAME.test(gameId))throw Error('recovery_game_id_invalid');
  if(!Number.isInteger(attempt)||attempt<0)throw Error('recovery_attempt_invalid');
  const authorization=load(root,'authorization.json'),settings=load(root,'worker-config.json'),proposal=load(root,'proposal.json');
  const manifest=load(root,`autonomy/jobs/${gameId}/manifest.json`),ledger=load(root,'autonomy/.provider/ledger.json');
  if([authorization.game_id,proposal.game_id,manifest.game_id].some(id=>id!==gameId))throw Error('recovery_game_mismatch');
  if(authorization.production_authorized!==false||!integer(authorization.max_generations,1,6)||!integer(authorization.max_repairs,0,5)||!decimal(authorization.estimated_usd_ceiling,0,2))throw Error('recovery_authorization_bound');
  if(!integer(settings.per_game?.max_provider_calls,1,6)||!decimal(settings.per_game?.max_estimated_cost,0,2)||!integer(settings.global?.daily_provider_call_limit,1,6)||!decimal(settings.global?.daily_cost_limit,0,2)||settings.global?.max_concurrent_builds!==1)throw Error('recovery_worker_bound');
  if(!integer(manifest.repair_attempt,0,5)||!integer(manifest.max_repair_attempts,0,5))throw Error('recovery_repair_bound');
  const operations=Object.values(ledger.operations||{});
  if(operations.some(op=>op.game_id!==gameId))throw Error('recovery_ledger_scope');
  const totals=operations.reduce((sum,op)=>{const usage=op.accounted||op.reserved||{};if(!decimal(usage.estimated_cost,0,2))throw Error('recovery_ledger_cost');return {calls:sum.calls+1,cost:sum.cost+usage.estimated_cost};},{calls:0,cost:0});
  if(totals.calls>6||totals.cost>2+1e-9)throw Error('recovery_budget_bound');
  if(TERMINAL.has(manifest.state))return {recoverable:false,reason:'terminal_candidate',attempt,totals};
  if(attempt>=MAX_RECOVERY_ATTEMPTS)return {recoverable:false,reason:'recovery_attempt_limit',attempt,totals};
  const resultFile=path.join(root,'worker-result.json');
  if(!fs.existsSync(resultFile))return {recoverable:false,reason:'worker_result_missing',attempt,totals};
  const result=readJSON(resultFile);
  if(result.game_id!==gameId||result.status!=='PAUSED_PROVIDER'||!RETRYABLE.has(result.code))return {recoverable:false,reason:'provider_pause_not_recoverable',attempt,totals};
  const pending=operations.filter(op=>op.state==='POLLING'&&typeof op.response_id==='string'&&op.response_id.length>0);
  if(pending.length!==1)return {recoverable:false,reason:'durable_response_not_unique',attempt,totals};
  return {recoverable:true,reason:'durable_response_available',attempt,next_attempt:attempt+1,operation_id:pending[0].operation_id,response_id:pending[0].response_id,totals};
}
function validate(root,gameId,attempt){const result=inspect(root,gameId,attempt);if(!result.recoverable)throw Error('recovery_not_allowed:'+result.reason);return result;}
function main(){const [command,root,gameId,attempt='0']=process.argv.slice(2),result=command==='validate'?validate(root,gameId,attempt):command==='plan'?inspect(root,gameId,attempt):null;if(!result)throw Error('usage validate|plan <root> <game-id> [attempt]');console.log(JSON.stringify(result));}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={inspect,validate,MAX_RECOVERY_ATTEMPTS};
