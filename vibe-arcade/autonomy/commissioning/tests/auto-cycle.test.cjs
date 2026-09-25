'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {resolveRequest}=require('../../cycle/resolve.cjs');

function fixture(t,request){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-cycle-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const rel='vibe-arcade/autonomy/commissioning/tenth-real-game/preflight-request.json';
  const full=path.join(root,rel);fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,JSON.stringify(request));
  fs.writeFileSync(path.join(path.dirname(full),'commission.cjs'),'// trusted candidate script\n');
  return {root,rel};
}
function good(){return {
  game_id:'GAME-20260926-201',candidate:'Test Candidate',runtime:'Phaser 4.2.1 + GameKit v2',
  auto_commission:true,authorized_provider_calls:6,estimated_usd_ceiling:2,production_authorized:false
};}

test('autonomous cycle accepts only explicitly authorized bounded commissioning requests',t=>{
  const {root,rel}=fixture(t,good()),meta=resolveRequest(root,rel);
  assert.equal(meta.game_id,'GAME-20260926-201');
  assert.equal(meta.commission_script,'vibe-arcade/autonomy/commissioning/tenth-real-game/commission.cjs');
  assert.equal(meta.authorized_provider_calls,6);
  assert.equal(meta.estimated_usd_ceiling,2);
  assert.equal(meta.production_authorized,false);
});

test('autonomous cycle fails closed when paid continuation is not explicitly authorized',t=>{
  const {root,rel}=fixture(t,{...good(),auto_commission:false});
  assert.throws(()=>resolveRequest(root,rel),/auto_commission_not_authorized/);
});

test('autonomous cycle enforces provider, cost and production ceilings',t=>{
  let f=fixture(t,{...good(),authorized_provider_calls:7});assert.throws(()=>resolveRequest(f.root,f.rel),/provider_call_bound/);
  f=fixture(t,{...good(),estimated_usd_ceiling:2.01});assert.throws(()=>resolveRequest(f.root,f.rel),/cost_bound/);
  f=fixture(t,{...good(),production_authorized:true});assert.throws(()=>resolveRequest(f.root,f.rel),/production_must_remain_off/);
});

test('autonomous cycle rejects arbitrary request paths and missing trusted commission scripts',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-cycle-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  assert.throws(()=>resolveRequest(root,'../preflight-request.json'),/request_path_not_allowed/);
  const rel='vibe-arcade/autonomy/commissioning/tenth-real-game/preflight-request.json',full=path.join(root,rel);
  fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,JSON.stringify(good()));
  assert.throws(()=>resolveRequest(root,rel),/commission_script_missing/);
});
