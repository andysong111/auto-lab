'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

test('autonomous cycle directly hands terminal candidates to queue supervisor',()=>{
  const file=path.resolve(__dirname,'../../../../.github/workflows/playjolt-autonomous-cycle.yml');
  const yml=fs.readFileSync(file,'utf8');
  assert.match(yml,/actions:\s*write/);
  assert.match(yml,/Handoff terminal candidate to queue supervisor/);
  assert.match(yml,/REJECTED\|RC_READY\|READY_TO_SHIP/);
  assert.match(yml,/gh workflow run playjolt-candidate-queue-supervisor\.yml/);
  assert.match(yml,/--ref main/);
  assert.match(yml,/-f current_branch="\$GITHUB_REF_NAME"/);
  assert.match(yml,/Non-terminal state .* queue continuation is intentionally held/);
});
