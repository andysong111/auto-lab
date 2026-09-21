"use strict";
require('../../tests/acquisition.test.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('home handlers retain legacy and canonical game identities',()=>{
const cards=['/descent/','/descent','/challengers/play?game=core-pins','/challengers/play?game=nova-merge','/games/orbit-sprint/','/games/core-pins','/games/nova-merge'].map(url=>({href:'https://vibe-arcade-dun.vercel.app'+url,addEventListener(n,f){this.click=f;}}));
const events=[],node=()=>({hidden:false,textContent:'',replaceChildren(){},append(){},setAttribute(){},addEventListener(){},classList:{add(){},remove(){}}});
const sandbox={URL,AbortController,setTimeout:()=>0,clearTimeout(){},document:{querySelector:node,querySelectorAll:q=>q==='.game-card'?cards:[],addEventListener(){}},WorldLeague:{C:{profile:null},readBoard:()=>new Promise(()=>{}),track:(...a)=>events.push(a),ready:new Promise(()=>{})}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../league/home.js'),'utf8'),sandbox);cards.forEach(a=>a.click());assert.deepEqual(events.map(e=>e[1].to),['gyro-drop','gyro-drop','core-pins','nova-merge','orbit-sprint','core-pins','nova-merge']);
});
