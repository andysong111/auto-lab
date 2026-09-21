'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),build=require('../scripts/build-astra-release.cjs').build;
const out=build(root),dir=path.join(root,'release/astra-sentinel');
delete require.cache[require.resolve('../release/astra-sentinel/core.js')];
const R=require('../release/astra-sentinel/core.js');
test('approved release is P2 at canonical route, not review UI',()=>{
  assert.equal(out.version,'astra-v2');assert.equal(R.VERSION,'astra-v2');assert.equal(R.ARENA.SCALE,1.4);
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert(html.includes('rel="canonical" href="https://vibe-arcade-dun.vercel.app/games/astra-sentinel"'));
  assert(!/PLAYTEST|NOT LIVE|noindex|feelSelect|preview\.js/.test(html));
  for(const f of ['arena.js','arena-view.js','motion.js','polish.js','core.js','art.js','app.js'])assert(html.includes('/release/astra-sentinel/'+f));
  const v=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')); 
  assert(!v.rewrites);
  assert.equal(fs.readFileSync(path.join(root,'games/astra-sentinel.html'),'utf8'),html);
});
test('dash keeps original screen-space reach in the 1.4x arena',()=>{
  const s=R.create(7);R.begin(s);const y=s.player.y;R.step(s,{y:-1,dash:true});
  assert.equal(s.dashes,1);assert(s.player.inv>0);assert(Math.abs((y-s.player.y)-12.6)<1e-9);
  assert(Math.abs((y-s.player.y)/R.ARENA.SCALE-9)<1e-9);
});
test('button and Space use buffered dash request so fixed-step timing cannot drop a click',()=>{
  const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
  for(const token of ['dashBuffer=0','function requestDash()','pointerdown','dashBuffer=Math.max(dashBuffer,3)','state.dashes>beforeDash'])assert(app.includes(token));
  assert(app.includes("'SPACE / TAP · READY'"));
});
test('production seed and records are not tied to review seed or preview namespace',()=>{
  const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
  assert(app.includes("KEY='loopjolt_astra_v2'"));
  assert(app.includes("crypto.getRandomValues(new Uint32Array(1))[0]"));
  assert(!app.includes('loopjolt_astra_polish_preview'));
  assert(app.includes("navigator.clipboard.writeText"));
});
test('P2 difficulty and safe-lane rules remain identical to tested candidate except version/UI promotion',()=>{
  const preview=fs.readFileSync(path.join(root,'labs/astra-sentinel/core.js'),'utf8').replace("const VERSION='astra-polish-preview2'","const VERSION='astra-v2'");
  assert.equal(fs.readFileSync(path.join(dir,'core.js'),'utf8'),preview);
  const s=R.create(42);R.begin(s);s.stage=9;const b={type:'boss',boss:3,attack:1,hp:100,maxHp:1000,phase:1,x:500,y:250};
  s.enemies=[b];const w=R.ARENA.wallFor(s);assert(w&&w.gapWidth>0&&w.delay===96);
});
test('build is byte-idempotent',()=>{
  const files=fs.readdirSync(dir).sort(),before=files.map(f=>fs.readFileSync(path.join(dir,f)));
  build(root);assert.deepEqual(files.map(f=>fs.readFileSync(path.join(dir,f))),before);
});
