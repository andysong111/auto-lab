'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create,validate,transition,transitions}=require('../orchestrator/manifest.cjs');
const {safePath,copyGame,inspectGame}=require('../orchestrator/files.cjs');
const {requestFor}=require('../orchestrator/repair.cjs'),{evaluate}=require('../orchestrator/quality.cjs');
const {setup,mockQA,source,policy}=require('./helpers.cjs');
const spec=require('../examples/dummy-spec.json');
test('manifest schema rejects omissions, traversal, wrong identity, excess repair budget and unknown state',()=>{
  const good=create(spec);assert.equal(validate(good),good);
  for(const patch of [{state:'FUN_90'},{game_id:'../main'},{max_repair_attempts:6},{repair_attempt:1,max_repair_attempts:0},{source_path:'autonomy/games/GAME-20260921-999/v1'},{preview_url:'https://evil.invalid'},{metrics_eligibility:true},{extra:'value'}]) assert.throws(()=>validate({...good,...patch}));
  const missing={...good};delete missing.controls;assert.throws(()=>validate(missing));
});
test('every invalid state edge is rejected; terminal rejection cannot resurrect',()=>{
  for(const from of Object.keys(transitions))for(const to of Object.keys(transitions)) {
    const m={...create(spec),state:from};
    if(transitions[from].includes(to))assert.equal(transition(m,to).state,to);else assert.throws(()=>transition(m,to),/invalid_transition/);
  }
});
test('repair requests cannot exceed five and carry protected paths plus concrete acceptance tests',()=>{
  const m={...create(spec),state:'QA_FAILED',repair_attempt:4};const r=requestFor(m,{hard_failures:[{code:'freeze',message:'Tick did not advance'}]});
  assert.equal(r.attempt,5);assert(r.protected_paths.includes('loopjolt-backend/**'));assert(r.acceptance_tests.length>5);
  assert.throws(()=>requestFor({...m,repair_attempt:5}),/repair_budget/);
  assert.throws(()=>transition({...m,repair_attempt:5},'REPAIR_PENDING'),/repair_budget/);
});
test('symlinks, absolute paths and traversal cannot be imported',t=>{
  const {root}=setup(t);assert.throws(()=>safePath(root,'../outside'));assert.throws(()=>safePath(root,'/tmp/a'));assert.throws(()=>safePath(root,'a\\b'));
  fs.symlinkSync('/tmp',path.join(root,'link'));assert.throws(()=>safePath(root,'link/x'));
  const dir=path.join(root,'copied');copyGame(source,dir);fs.symlinkSync('/etc/passwd',path.join(dir,'secret.js'));assert.throws(()=>inspectGame(dir));
});
test('quality gate requires fresh exhaustive hard evidence; heuristics alone cannot pass',async t=>{
  const {factory,spec,store}=setup(t,{qa:mockQA});await factory.create(spec);const m=await factory.run(spec.game_id);
  const qa=require('node:fs').readFileSync(store.artifact(m.game_id,'v1/qa.json'),'utf8');
  const good=JSON.parse(qa);assert.equal(evaluate(m,good,policy).decision,'PASS');assert.equal(evaluate(m,good,policy).production_approved,false);
  assert.equal(evaluate(m,{...good,browser_cases:[]},policy).decision,'REPAIR');assert.equal(evaluate(m,{...good,source_hash:'stale'},policy).decision,'REPAIR');
  assert.equal(evaluate(m,{...good,hard_failures:[{code:'production_side_effect',message:'blocked POST'}]},policy).decision,'REJECT');
  assert.equal(evaluate({...m,repair_attempt:5},{...good,passed:false},policy).decision,'REJECT');
});
test('fixture core is DOM independent and deterministic for the same seed/input sequence',()=>{
  const core=require('../fixtures/dummy/core.js'),a=core.create(7),b=core.create(7);
  for(let i=0;i<610;i++){const input={x:i<50?1:0,action:i%31===0,pointer:null};core.step(a,input);core.step(b,input);}
  assert.deepEqual(a,b);assert(core.terminal(a));assert(a.interactions>0&&a.score>0);assert.equal(a.tick,600);
});

test('factory Phaser bridge owns the visual runtime and only consumes cloned snapshots',t=>{
  const priorPhaser=globalThis.Phaser,priorKit=globalThis.PlayJoltPhaserKit;let created=0,updated=[],resized=null,destroyed=false;
  class FakeGame{
    constructor(config){
      this.scale={resize:(w,h)=>{resized=[w,h];}};
      this.destroy=remove=>{destroyed=remove===true;};
      const scene={};config.scene.create.call(scene);created++;
    }
  }
  globalThis.Phaser={VERSION:'4.2.1',AUTO:0,Game:FakeGame};
  delete require.cache[require.resolve('../gamekit/phaserkit.js')];
  const kit=require('../gamekit/phaserkit.js'),canvas={width:320,height:180,getBoundingClientRect:()=>({width:320,height:180})};
  const renderer=kit.create({canvas,visuals:{create:()=>{},update:(_scene,s)=>{updated.push(s);s.state.x=999;}}});
  const original={state:{x:1}};renderer.render(original);assert.equal(original.state.x,1);assert.equal(updated.at(-1).state.x,999);
  renderer.resize(640,360);assert.deepEqual(resized,[640,360]);renderer.dispose();assert(destroyed);assert.equal(created,1);assert.equal(renderer.kind,'phaser4');assert.equal(renderer.version,'4.2.1');
  t.after(()=>{if(priorPhaser===undefined)delete globalThis.Phaser;else globalThis.Phaser=priorPhaser;if(priorKit===undefined)delete globalThis.PlayJoltPhaserKit;else globalThis.PlayJoltPhaserKit=priorKit;delete require.cache[require.resolve('../gamekit/phaserkit.js')];});
});
