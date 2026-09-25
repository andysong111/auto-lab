'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {loadQueue,nextEntry}=require('../../cycle/queue.cjs');

function root(t,entries){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-queue-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const base=path.join(dir,'vibe-arcade/autonomy/cycle');fs.mkdirSync(base,{recursive:true});
  fs.writeFileSync(path.join(base,'queue.json'),JSON.stringify({schema:'playjolt-cycle-queue/1',entries}));
  return dir;
}
test('queue advances only to the next reviewed branch in order',t=>{
  const entries=[
    {branch:'commissioning/ninth-real-game-20260925',request_path:'vibe-arcade/autonomy/commissioning/ninth-real-game/preflight-request.json',game_id:'G9',candidate:'Nine'},
    {branch:'commissioning/tenth-real-game-20260926',request_path:'vibe-arcade/autonomy/commissioning/tenth-real-game/preflight-request.json',game_id:'G10',candidate:'Ten'}
  ];
  const dir=root(t,entries),next=nextEntry(dir,entries[0].branch);
  assert.equal(next.branch,entries[1].branch);assert.equal(next.index,1);
  assert.equal(nextEntry(dir,entries[1].branch),null);
});
test('queue fails closed for unqueued current branches and duplicate targets',t=>{
  let dir=root(t,[{branch:'commissioning/a',request_path:'vibe-arcade/autonomy/commissioning/a/preflight-request.json'}]);
  assert.throws(()=>nextEntry(dir,'commissioning/missing'),/current_branch_not_queued/);
  dir=root(t,[
    {branch:'commissioning/a',request_path:'vibe-arcade/autonomy/commissioning/a/preflight-request.json'},
    {branch:'commissioning/a',request_path:'vibe-arcade/autonomy/commissioning/b/preflight-request.json'}
  ]);
  assert.throws(()=>loadQueue(dir),/duplicate_branch/);
});
