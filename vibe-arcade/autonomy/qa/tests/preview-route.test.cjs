'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{assess}=require('../preview-route.cjs');
const manifest={game_id:'GAME-20260101-999',version:'v2'},origin='https://example-preview.vercel.app',prefix='/autonomy/games/GAME-20260101-999/v2/';
const assets=['core.js','app.js','gamekit.js','view/art.js'].map(f=>({selector:'script[src]',attribute:'./'+f,resolved_url:origin+prefix+f}));
test('canonical directory without slash is valid when assets resolve inside exact version',()=>assert.equal(assess(manifest,{entry_url:origin+prefix.slice(0,-1),assets}).passed,true));
test('bare relative paths receive the same check as dot-prefixed paths',()=>{
 const r=assess(manifest,{entry_url:origin+prefix.slice(0,-1),assets:assets.map(a=>({...a,attribute:a.attribute.slice(2),resolved_url:a.resolved_url.replace('/v2/','/')}))});
 assert.equal(r.failures.length,4);assert.equal(r.checked,4);
});
test('all independently misresolved resources are reported, with exact expected/actual',()=>{
 const r=assess(manifest,{entry_url:origin+prefix.slice(0,-1),assets:assets.map(a=>({...a,resolved_url:a.resolved_url.replace('/v2/','/')}))});
 assert.equal(r.passed,false);assert.equal(r.failures.length,4);assert.equal(r.failures[0].expected,origin+prefix+'core.js');
});
test('unrelated identity and incomplete observations cannot enter preview repair',()=>{
 assert.throws(()=>assess(manifest,{entry_url:origin+'/another',assets}),/identity/);
 assert.throws(()=>assess(manifest,{entry_url:origin+prefix.slice(0,-1)+'0',assets}),/identity/);
 assert.throws(()=>assess(manifest,{entry_url:origin+prefix,assets:[]}),/incomplete/);
});
