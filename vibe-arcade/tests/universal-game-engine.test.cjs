'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),compiler=require('../autonomy/foundry/game-compiler.cjs');

test('owner-approved Halo Guard compiles from reviewed components and six deterministic seeds',()=>{
  const result=compiler.verify();assert.equal(result.status,'PASS');assert.equal(result.golden,'halo-guard-v9');assert.equal(result.runtime,'halo-guard-core-v1');assert.equal(result.components,8);assert.equal(result.rules,4);assert.equal(result.seeds,6);assert(result.max_entities<=24);assert.equal(result.production,false);
});

test('golden runtime owns gameplay and presentation loads it before the 3D view',()=>{
  const html=fs.readFileSync(path.join(root,'lab/taste-calibration/index.html'),'utf8'),game=fs.readFileSync(path.join(root,'lab/taste-calibration/game.js'),'utf8');
  assert(html.indexOf('./halo-guard-core.js')<html.indexOf('./game.js'));assert.match(game,/window\.HaloGuardCore/);assert.match(game,/Core\.step/);assert.match(game,/Core\.observe/);assert.doesNotMatch(game,/spawnItem\(\).*Math\.random/);
});

test('unreviewed or incomplete component combinations fail closed',()=>{
  const identity=JSON.parse(fs.readFileSync(path.join(root,'autonomy/foundry/golden/halo-guard-v9/identity.json'),'utf8'));
  const registry=JSON.parse(fs.readFileSync(path.join(root,'autonomy/foundry/component-registry.json'),'utf8'));
  const rules=JSON.parse(fs.readFileSync(path.join(root,'autonomy/foundry/rule-modules.json'),'utf8'));
  registry.components.find(row=>row.id==='radial-defense-core-v1').status='incubating';
  assert.throws(()=>compiler.validateRegistry(identity,registry,rules),/unreviewed_component_radial-defense-core-v1/);
});
