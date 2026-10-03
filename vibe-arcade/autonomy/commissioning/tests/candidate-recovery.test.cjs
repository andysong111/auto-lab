'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspect,validate,MAX_RECOVERY_ATTEMPTS}=require('../../cycle/recovery.cjs');

function fixture(t,patch={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-recovery-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const game='GAME-20261001-322',write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
  write('authorization.json',{game_id:game,max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,...patch.authorization});
  write('worker-config.json',{per_game:{max_provider_calls:6,max_estimated_cost:2},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},...patch.settings});
  write('proposal.json',{game_id:game});write(`autonomy/jobs/${game}/manifest.json`,{game_id:game,state:'BUILDING',repair_attempt:0,max_repair_attempts:5,...patch.manifest});
  write('autonomy/.provider/ledger.json',{operations:{[game+'/build/v1']:{operation_id:game+'/build/v1',game_id:game,state:'POLLING',response_id:'resp_saved',reserved:{estimated_cost:.4}}},...patch.ledger});
  write('worker-result.json',{game_id:game,status:'PAUSED_PROVIDER',code:'provider_timeout',...patch.result});
  return {root,game};
}

test('durable provider response is recoverable without resetting candidate budget',t=>{
  const f=fixture(t),plan=validate(f.root,f.game,0);assert.equal(plan.recoverable,true);assert.equal(plan.next_attempt,1);assert.equal(plan.totals.calls,1);assert.equal(plan.operation_id,f.game+'/build/v1');
  assert.equal(MAX_RECOVERY_ATTEMPTS,6);assert.equal(inspect(f.root,f.game,MAX_RECOVERY_ATTEMPTS-1).recoverable,true);
});
test('recovery fails closed for uncertain submission, terminal candidate, limits and attempt exhaustion',t=>{
  let f=fixture(t,{ledger:{operations:{}}});assert.equal(inspect(f.root,f.game,0).recoverable,false);
  f=fixture(t,{manifest:{state:'REJECTED'}});assert.equal(inspect(f.root,f.game,0).reason,'terminal_candidate');
  f=fixture(t,{authorization:{production_authorized:true}});assert.throws(()=>inspect(f.root,f.game,0),/authorization_bound/);
  f=fixture(t);assert.equal(inspect(f.root,f.game,MAX_RECOVERY_ATTEMPTS).reason,'recovery_attempt_limit');
});
test('workflow restores only same-branch ancestor artifacts and self-dispatches bounded recovery',()=>{
  const yml=fs.readFileSync(path.resolve(__dirname,'../../../../.github/workflows/playjolt-autonomous-cycle.yml'),'utf8');
  assert.match(yml,/recovery_run_id:/);assert.match(yml,/recovery_attempt:/);assert.match(yml,/Restore durable provider checkpoint/);
  assert.match(yml,/git merge-base --is-ancestor/);assert.match(yml,/gh run download/);assert.match(yml,/recovery\.cjs validate/);assert.match(yml,/recovery\.cjs plan/);
  assert.match(yml,/gh workflow run playjolt-autonomous-cycle\.yml/);assert.match(yml,/-f recovery_run_id="\$GITHUB_RUN_ID"/);assert.match(yml,/-f recovery_attempt="\$NEXT"/);
  assert.match(yml,/AUTO_PRODUCTION_SHIP=false/);
});
