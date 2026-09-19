'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),R=require('../arcade3/core.js'),O=require('../games/orbit-sprint/core.js');
const games=['perfect-timing','reaction-rush','dont-press','orbit-sprint'];
const version=g=>g==='orbit-sprint'?O.VERSION:R.CONFIG[g].version;
const url=g=>g==='orbit-sprint'?'/games/orbit-sprint/':'/arcade3/play.html?game='+g;
const config={loginReady:true,seed:125904,rankedGames:games.map(g=>({game:g,version:version(g)}))};
(async()=>{const server=spawn('python3',['-m','http.server','8793','--directory',root],{stdio:'ignore'});let browser;fs.mkdirSync('experience-qa',{recursive:true});
try{await new Promise(r=>setTimeout(r,700));browser=await chromium.launch({headless:true});
async function context({logged=false,startFails=false}={},viewport={width:390,height:844}){
 const c=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});const writes=[];
 if(logged)await c.addInitScript(()=>sessionStorage.setItem('loopjolt_google_session_v1',JSON.stringify({token:'QA_ONLY_NOT_AUTHENTIC',expires:Date.now()+3600000})));
 await c.route('**/api/event',r=>r.fulfill({status:204,body:''}));
 await c.route('**/functions/v1/loopjolt-community*',async r=>{const u=new URL(r.request().url()),a=u.searchParams.get('action'),b=r.request().postDataJSON();let d,status=200;
  if(a==='config')d=config;else if(a==='profile')d={profile:{handle:'QA_Pilot',country:'KR'}};
  else if(a==='start'){writes.push({a,b});if(startFails){status=401;d={error:'invalid_or_expired_login'};}else d={runId:'11111111-1111-4111-8111-111111111111',seed:125904,version:version(b.game),game:b.game,expiresAt:new Date(Date.now()+900000).toISOString()};}
  else if(a==='finish'){writes.push({a,b});const g=writes.find(x=>x.a==='start').b.game,score=g==='orbit-sprint'?O.replay(125904,b.actions,b.ticks).score:R.replay(g,125904,b.actions,b.ticks).score;d={saved:true,score};}
  else if(a==='board')d={rows:u.searchParams.get('scope')==='nations'?[{rank:1,country_code:'KR',points:592,players:1,contributors:1}]:[{rank:1,handle:'QA_Rival',country_code:'KR',score:900},{rank:2,handle:'QA_Pilot',country_code:'KR',score:592}]};else d={};
  await r.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type'},body:JSON.stringify(d)});
 });return {c,writes};}
for(const viewport of [{width:1440,height:1050},{width:390,height:844}])for(const game of games){
 const {c,writes}=await context({},viewport),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8793'+url(game));
 await p.waitForFunction(()=>document.querySelector('#start').textContent==='Play practice');
 assert(!(await p.locator('#howToPlay').getAttribute('open')));assert.equal(await p.locator('.record-strip').count(),1);
 const signin=await p.locator('#signInRun').getAttribute('href');assert(decodeURIComponent(signin).includes(game==='orbit-sprint'?'/games/orbit-sprint/':'game='+game));
 await p.screenshot({path:`experience-qa/${game}-${viewport.width}-entry.png`,fullPage:true});
 await p.locator('#start').focus();await p.keyboard.press('Space');await p.waitForTimeout(450);assert((await p.evaluate(()=>LoopJoltSnapshot().state.tick))>0);
 assert.equal(await p.evaluate(()=>LoopJoltSnapshot().inputCount),0);assert.equal(writes.length,0);
 await p.locator('#pause').click();assert(await p.locator('#resume').isVisible());await p.locator('#resume').click();assert.equal(await p.evaluate(()=>LoopJoltSnapshot().paused),false);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);await c.close();console.log('ENTRY/PRACTICE',game,viewport.width,'PASS');
}
{const {c}=await context({logged:true,startFails:true});const p=await c.newPage();await p.goto('http://127.0.0.1:8793'+url('perfect-timing'));await p.waitForFunction(()=>document.querySelector('#start').textContent==='Play ranked');await p.locator('#start').click();await p.waitForFunction(()=>document.querySelector('#saveState').textContent.includes('did not start'));assert.equal(await p.evaluate(()=>LoopJoltSnapshot().active),false);await p.locator('#alternatePlay').click();await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>LoopJoltSnapshot().ranked),false);await c.close();console.log('REAUTH FAILURE -> EXPLICIT PRACTICE PASS');}
{const {c,writes}=await context({logged:true});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8793'+url('orbit-sprint'));await p.waitForFunction(()=>document.querySelector('#start').textContent==='Play ranked');await p.clock.install();await p.locator('#start').click();await p.clock.runFor(93000);await p.waitForFunction(()=>document.querySelector('#rankMessage').textContent.startsWith('Verified'));
 assert.deepEqual(writes.map(x=>x.a),['start','finish']);await p.waitForFunction(()=>document.querySelector('#rankSummary').textContent.includes('World #'));assert.equal(await p.locator('#officialBest').textContent(),'592');assert((await p.locator('#nextTarget').textContent()).includes('309'));await p.screenshot({path:'experience-qa/orbit-ranked-result-390.png',fullPage:true});assert.deepEqual(errors,[]);await c.close();console.log('ORBIT CANONICAL MOCKED RANKED RESULT PASS');}
{const {c}=await context();const p=await c.newPage();await p.goto('http://127.0.0.1:8793'+url('perfect-timing'));await p.waitForFunction(()=>document.querySelector('#start').textContent==='Play practice');
 await p.evaluate(()=>{const C=window.LoopCommunity;C.config=async()=>({});let count=0;C.api=async(a,b)=>{window.savedBodies=(window.savedBodies||[]).concat([b]);if(++count===1)throw Error('network_error');return {saved:true,score:300};};window.unitUI=new GameSessionUI({game:'perfect-timing',version:'pt-sky-v1',onPlay:()=>{}});unitUI.phase='playing';unitUI.runProfile={handle:'QA_Pilot',country:'KR'};return unitUI.finished({run:{runId:'11111111-1111-4111-8111-111111111111'},actions:[[1,'drop']],ticks:200,score:300});});
 assert((await p.locator('#saveState').textContent()).includes('not confirmed'));assert(await p.locator('#retrySave').isVisible());await p.evaluate(()=>unitUI.submit());assert((await p.locator('#saveState').textContent()).startsWith('Verified'));assert(await p.evaluate(()=>JSON.stringify(savedBodies[0])===JSON.stringify(savedBodies[1])));assert.equal(await p.locator('#retrySave').isVisible(),false);
 // Deterministically resolve an older board read only after a newer attempt begins.
 const stale=await p.evaluate(async()=>{unitUI.C={authenticated:true,profile:{handle:'QA_Pilot',country:'KR'},endpoint:'https://qa.invalid'};const oldFetch=window.fetch,releases=[];window.fetch=()=>new Promise(resolve=>releases.push(resolve));document.querySelector('#rankSummary').textContent='NEW ATTEMPT';document.querySelector('#officialBest').textContent='UNCHANGED';const job=unitUI.context(unitUI.serial,true);unitUI.serial++;unitUI.phase='playing';for(const done of releases)done({ok:true,json:async()=>({rows:[{handle:'QA_Pilot',country_code:'KR',score:300,rank:1}]})});await job;window.fetch=oldFetch;return [document.querySelector('#rankSummary').textContent,document.querySelector('#officialBest').textContent];});assert.deepEqual(stale,['NEW ATTEMPT','UNCHANGED']);
 // Save-in-progress locks repeat submissions and the next-run links.
 await p.evaluate(()=>{unitUI.phase='playing';unitUI.C.api=()=>new Promise(resolve=>{window.resolveSave=resolve;});unitUI.finished({run:{runId:'11111111-1111-4111-8111-111111111111'},actions:[],ticks:200,score:300});});assert(await p.locator('#start').isDisabled());assert(await p.locator('#resultLinks').evaluate(n=>n.inert));await p.evaluate(()=>resolveSave({saved:true,score:300}));await p.waitForFunction(()=>!document.querySelector('#start').disabled);
 await c.close();console.log('UNCONFIRMED / SAME-RUN RETRY / STALE GUARD / SAVE LOCK PASS');}
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
