'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'arcade3/telemetry.js'),'utf8');
function tab(game){let n=0;const pending=[],store={};const s={URL,URLSearchParams,Blob,Date,Set,location:{search:'',hostname:'vibe-arcade-dun.vercel.app',pathname:'/games/'+game,href:'https://vibe-arcade-dun.vercel.app/games/'+game},crypto:{randomUUID:()=> '00000000-0000-4000-8000-'+String(++n).padStart(12,'0')},sessionStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},localStorage:{getItem:()=>null},document:{referrer:'',addEventListener(){}},navigator:{sendBeacon:(url,b)=>{pending.push(b.text());return true;}},fetch:()=>assert.fail('network forbidden')};s.window=s;vm.runInNewContext(code,s);return {s,events:async()=> (await Promise.all(pending)).map(JSON.parse)};}
for(const game of ['color-trap','dont-press','memory-grid','odd-one-out','perfect-timing','reaction-rush'])test('legacy replay starts a fresh completed attempt: '+game,async()=>{
 const html=fs.readFileSync(path.join(root,'games',game,'index.html'),'utf8');assert.match(html,/dataset\.played\?'replay':'game_start'/);
 const t=tab(game);for(const e of ['game_start','game_finish','replay','game_finish'])t.s.VibeAnalytics.track(e,{game});
 const events=await t.events(),starts=events.filter(e=>e.event==='game_start'),finishes=events.filter(e=>e.event==='game_finish'),replays=events.filter(e=>e.event==='replay');
 assert.equal(starts.length,2);assert.equal(finishes.length,2);assert.equal(replays.length,1);assert.notEqual(starts[0].attempt_id,starts[1].attempt_id);assert.equal(finishes[1].attempt_id,starts[1].attempt_id);assert.equal(replays[0].attempt_id,starts[1].attempt_id);
});
test('unstarted modern replay cannot count as another play',async()=>{const t=tab('core-pins');t.s.LJTelemetry.track('replay','core-pins','test');assert.equal((await t.events()).filter(e=>e.event==='replay').length,0);});
