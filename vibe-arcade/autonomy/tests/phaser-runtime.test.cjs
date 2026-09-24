'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('./helpers.cjs');
const fixture=path.resolve(__dirname,'../fixtures/phaser');

test('Phaser 4 lane injects pinned runtime and passes real browser technical QA',async t=>{
  const runtime=process.env.FACTORY_PHASER_RUNTIME;
  assert(runtime&&fs.existsSync(runtime),'FACTORY_PHASER_RUNTIME must point to the verified pinned runtime');
  const env=setup(t,{source:fixture,phaserRuntimePath:runtime,spec:{render_runtime:'phaser4'}});
  await env.factory.create(env.spec);
  const m=await env.factory.run(env.spec.game_id);
  assert.equal(m.state,'RC_READY',JSON.stringify(m.failure_reasons));
  const game=env.factory.source(m);
  for(const file of ['phaser-runtime.js','phaser-gamekit.js','gamekit.js'])assert(fs.existsSync(path.join(game,file)),file);
  assert.equal(JSON.parse(fs.readFileSync(path.join(game,'manifest.json'))).render_runtime,'phaser4');
});
