'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),build=require('../scripts/build-astra-release.cjs').build;
const out=build(root),dir=path.join(root,'release/astra-sentinel');
test('approved release is Astra v3 with move-only controls',()=>{
  assert.equal(out.version,'astra-v3');assert.equal(out.controls,'move-only');
  const core=fs.readFileSync(path.join(dir,'core.js'),'utf8'),app=fs.readFileSync(path.join(dir,'app.js'),'utf8'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert(core.includes("const VERSION='astra-v3'"));assert(core.includes("name:'VECTOR DRIVE'"));assert(!core.includes("name:'PHASE DRIVE'"));
  assert(!core.includes("if(input.dash===true"));assert(!core.includes("event(s,'dash'"));
  assert(html.includes('rel="canonical" href="https://vibe-arcade-dun.vercel.app/games/astra-sentinel"'));
  assert(!/PLAYTEST|NOT LIVE|noindex|feelSelect|preview\.js/.test(html));
  assert(!/id="dash"|dashNote|dashBar|PHASE DASH|Space dashes|phase through/i.test(html));
  assert(html.includes('That is the whole combat control scheme.'));
  assert(!/dashBuffer|dashRequested|requestDash\(|Key.*Space|phase through/i.test(app));
  assert(app.includes("KEY='loopjolt_astra_v3'"));
  assert(app.includes("crypto.getRandomValues(new Uint32Array(1))[0]"));
  assert(app.includes("navigator.clipboard.writeText"));
  assert.equal(fs.readFileSync(path.join(root,'games/astra-sentinel.html'),'utf8'),html);
});
test('movement remains responsive and dash state can never be activated through production step inputs',()=>{
  const arena=require('../release/astra-sentinel/arena.js');globalThis.AstraArena=arena;
  const motion=require('../release/astra-sentinel/motion.js');globalThis.AstraMotion=motion;
  delete require.cache[require.resolve('../release/astra-sentinel/core.js')];
  const R=require('../release/astra-sentinel/core.js'),s=R.create(7);R.begin(s);const x=s.player.x;
  for(let i=0;i<30;i++)R.step(s,{x:1,dash:true});
  assert(s.player.x>x);assert.equal(s.dashes,0);assert.equal(s.player.dash,0);assert.equal(s.player.inv,0);
});
test('P2 difficulty and safe-lane rules are retained after control simplification',()=>{
  const arena=require('../release/astra-sentinel/arena.js');assert.equal(arena.SCALE,1.4);
  const s={player:{x:504,y:756},enemies:[{type:'boss',boss:3,attack:1}]},w=arena.wallFor(s);
  assert(w&&w.gapWidth>0&&w.delay===96);
  const core=fs.readFileSync(path.join(dir,'core.js'),'utf8'),arenaSource=fs.readFileSync(path.join(dir,'arena.js'),'utf8');
  for(const token of ["quota:stage%3===0?18+stage*2","bossHp:stage===3?1000:stage===6?2650:5100"])assert(arenaSource.includes(token));
  assert(core.includes('s.walls.length===0&&s.stage>=4'));
});
test('build is byte-idempotent',()=>{
  const files=fs.readdirSync(dir).sort(),before=files.map(f=>fs.readFileSync(path.join(dir,f)));
  build(root);assert.deepEqual(files.map(f=>fs.readFileSync(path.join(dir,f))),before);
});
