'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {buildPacket}=require('../release-packet.cjs');
const {authorize,expectedConfirmation,validateChangedPaths}=require('../production-gate.cjs');
const root=path.resolve(__dirname,'../../../..');
function packet(){
  return buildPacket({game_id:'GAME-20260928-401',version:'v2',title:'Owner Gate',slug:'owner-gate',source_path:'autonomy/games/GAME-20260928-401/v2',state:'READY_TO_SHIP',commercial_contract:{},product_contract:{},commercial_qa_status:'PASS',technical_qa_status:'PASS',product_qa_status:'PASS',qa_status:'PASS',quality_status:'PASS',release_status:'READY',preview_url:'https://playjolt-owner-gate.vercel.app',source_hash:'a'.repeat(64),base_commit:'b'.repeat(40),rc_commit:'c'.repeat(40),branch:'factory/GAME-20260928-401',metrics_eligibility:false,repair_attempt:1,failure_reasons:[]},{preview_smoke:{passed:true,method:'GET only; byte identity',checks:[{file:'index.html'}]}});
}
test('release packet binds preview evidence and remains production unauthorized',()=>{
  const p=packet();assert.equal(p.passed,true);assert.equal(p.schema,'playjolt-release-review/2');assert.equal(p.production.authorized,false);assert.equal(p.production.automatic,false);assert.equal(p.evidence.preview_smoke.passed,true);assert.match(p.evidence.preview_smoke.sha256,/^[a-f0-9]{64}$/);
});
test('only repository owner with exact packet digest and phrase can authorize an action',()=>{
  const p=packet(),sha='d'.repeat(64),confirmation=expectedConfirmation('release',p.candidate);
  const ok=authorize(p,{packet_sha256:sha,actual_sha256:sha,actor:'andysong111',repository:'andysong111/auto-lab',action:'release',confirmation});
  assert.equal(ok.authorized,true);assert.equal(ok.production_automatic,false);
  for(const patch of [{actor:'someone-else'},{packet_sha256:'e'.repeat(64)},{confirmation:'RELEASE NOW'},{action:'deploy'}])assert.throws(()=>authorize(p,{packet_sha256:sha,actual_sha256:sha,actor:'andysong111',repository:'andysong111/auto-lab',action:'release',confirmation,...patch}),/production_gate_failed/);
  assert.throws(()=>authorize({...p,candidate:{...p.candidate,preview_url:'https://preview.vercel.app.attacker.invalid'}},{packet_sha256:sha,actual_sha256:sha,actor:'andysong111',repository:'andysong111/auto-lab',action:'release',confirmation}),/preview_url_invalid/);
});
test('production git scope accepts only candidate runtime additions or modifications',()=>{
  const p=packet(),prefix='vibe-arcade/autonomy/games/GAME-20260928-401/v2/';
  assert.equal(validateChangedPaths(p,[`A\t${prefix}index.html`,`M\t${prefix}app.js`]).files,2);
  for(const rows of [[],['A\tvibe-arcade/index.html'],[`D\t${prefix}index.html`],[`R100\t${prefix}old.js\t${prefix}new.js`]])assert.throws(()=>validateChangedPaths(p,rows),/production_git_gate_failed/);
});
test('preview workflow is automatic and production workflow is manual-only with owner gate',()=>{
  const preview=fs.readFileSync(path.join(root,'.github/workflows/playjolt-rc-release-packet.yml'),'utf8');
  assert.match(preview,/workflow_run:/);assert.match(preview,/PlayJolt Autonomous Candidate Cycle/);assert.match(preview,/event.*workflow_dispatch/);assert.match(preview,/ref: main/);assert.match(preview,/rc-continuation\.cjs/);assert.doesNotMatch(preview,/node "\$SCRIPT"|commission\.cjs/);assert.doesNotMatch(preview,/git push origin HEAD:main/);
  const production=fs.readFileSync(path.join(root,'.github/workflows/playjolt-production-release.yml'),'utf8');
  assert.match(production,/workflow_dispatch:/);assert.doesNotMatch(production,/\n\s+(push|schedule|workflow_run):/);assert.match(production,/environment: playjolt-production/);assert.match(production,/test "\$ACTOR" = "\$OWNER"/);assert.match(production,/git merge --ff-only/);assert.match(production,/git revert --no-edit/);assert.doesNotMatch(production,/--force/);
});
