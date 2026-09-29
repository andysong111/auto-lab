'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

test('autonomous cycle directly hands eligible RCs to Preview and all terminal candidates to queue supervisor',()=>{
  const file=path.resolve(__dirname,'../../../../.github/workflows/playjolt-autonomous-cycle.yml');
  const yml=fs.readFileSync(file,'utf8');
  assert.match(yml,/actions:\s*write/);
  assert.match(yml,/Handoff eligible RC to Preview and release packet/);
  assert.match(yml,/RC_READY\|READY_TO_SHIP/);
  assert.match(yml,/gh workflow run playjolt-rc-release-packet\.yml/);
  assert.match(yml,/-f source_run_id="\$GITHUB_RUN_ID"/);
  assert.match(yml,/RC Preview dispatch failed after three attempts/);
  assert.match(yml,/Handoff terminal candidate to queue supervisor/);
  assert.match(yml,/REJECTED\|RC_READY\|READY_TO_SHIP/);
  assert.match(yml,/gh workflow run playjolt-candidate-queue-supervisor\.yml/);
  assert.match(yml,/--ref main/);
  assert.match(yml,/-f current_branch="\$GITHUB_REF_NAME"/);
  assert.match(yml,/Non-terminal state .* queue continuation is intentionally held/);
  assert(yml.indexOf('Handoff eligible RC to Preview and release packet')<yml.indexOf('Handoff terminal candidate to queue supervisor'));
});
