/* Isolated real-browser UI and deterministic normal-input tests. Never production POSTs. */
'use strict';
const {chromium}=require(process.env.PW_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUT||'/tmp/retention-qa',ORIGIN='https://retention.test';fs.mkdirSync(out,{recursive:true});
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
const games=[
 {game:'gyro-drop',name:'Deep Descent',url:'/descent',button:'#play',dialog:'#result',score:'#resultScore',save:'#save',again:'#again',rank:'#ranked',close:'#closeResult',rule:'DescentRules'},
 {game:'core-pins',name:'Core Pins',url:'/games/core-pins',button:'#primary',dialog:'#resultDialog',score:'#resultScore',save:'#saveState',again:'#again',rank:'#ranked',close:'#closeResult',rule:'ChallengerRules'},
 {game:'nova-merge',name:'Nova Merge',url:'/games/nova-merge',button:'#primary',dialog:'#resultDialog',score:'#resultScore',save:'#saveState',again:'#again',rank:'#ranked',close:'#closeResult',rule:'ChallengerRules'},
 {game:'orbit-sprint',name:'Orbit Sprint',url:'/games/orbit-sprint',button:'#start',dialog:'#overlay',score:'#overlayTitle',save:'#rankMessage',again:'#start',rank:'#alternatePlay',rule:'OrbitRules'}
];
const fixture=`(()=>{let t=1000,queue=new Map(),n=0,mem=new Map();window.__opt={guest:true,failConfig:false,delayConfig:false,failFinish:0,holdFinish:false,badFinish:false,blockedStorage:false};window.__calls={start:[],finish:[],events:[],storage:[]};
Object.defineProperty(performance,'now',{value:()=>t});Date.now=()=>1789980000000+t;
window.requestAnimationFrame=f=>{queue.set(++n,f);return n;};window.cancelAnimationFrame=i=>queue.delete(i);
window.__frames=count=>{for(let i=0;i<count;i++){t+=1000/60;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(f=>f(t));}};
Object.defineProperty(window,'localStorage',{value:{getItem:k=>{if(__opt.blockedStorage)throw Error('denied');return mem.get(k)||null;},setItem:(k,v)=>{if(__opt.blockedStorage)throw Error('denied');mem.set(k,String(v));__calls.storage.push([k,String(v)]);},removeItem:k=>mem.delete(k)}});
const profile={handle:'QA_Retention',country:'KR'};
window.LoopCommunity={get profile(){return __opt.guest?null:profile;},get authenticated(){return !__opt.guest;},endpoint:'https://mock.invalid/api',
config:async()=>{if(__opt.failConfig)throw Error('network_error');if(__opt.delayConfig)await new Promise(r=>window.__releaseConfig=r);return {seed:7,loginReady:true,rankedGames:[{game:'gyro-drop',version:'gd-descent-v2'},{game:'core-pins',version:'cp-phaser-v1'},{game:'nova-merge',version:'nm-phaser-v1'},{game:'orbit-sprint',version:'orbit-v1'}]};},me:async()=>__opt.guest?null:profile,
renderFlagLabel:(n,c,h)=>n.textContent=c+' '+h,countryName:()=> 'South Korea',logout:()=>{},
api:async(a,b)=>{if(a==='start'){__calls.start.push(b);return {game:b.game,version:({'gyro-drop':'gd-descent-v2','core-pins':'cp-phaser-v1','nova-merge':'nm-phaser-v1','orbit-sprint':'orbit-v1'})[b.game],runId:'00000000-0000-4000-8000-'+String(__calls.start.length).padStart(12,'0'),seed:7};}
if(a==='finish'){__calls.finish.push(JSON.parse(JSON.stringify(b)));if(__opt.failFinish-->0)throw Error('network_error');const g=__calls.start.at(-1).game;const v=g==='gyro-drop'?DescentRules.replay(7,b.actions,b.ticks):g==='orbit-sprint'?OrbitRules.replay(7,b.actions,b.ticks):ChallengerRules.replay(g,7,b.actions,b.ticks);const r=__opt.badFinish?{saved:false,score:999999}:{saved:true,score:v.score};if(__opt.holdFinish){__opt.holdFinish=false;await new Promise(resolve=>window.__releaseSave=resolve);}return r;}}
};window.LJTelemetry={track:(...a)=>__calls.events.push(a)};window.VibeAnalytics={track:(...a)=>__calls.events.push(a)};
})();`;
function observe(name){return `;(()=>{const R=${name},original=R.create;let current;R.create=(...a)=>{const s=original(...a);current=s;return s;};window.__snapshot=()=>JSON.parse(JSON.stringify(current));})();`;}
async function load(browser,g,width=390,opt={},query=''){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),p=await ctx.newPage();const errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(fixture);await p.addInitScript(o=>Object.assign(__opt,o),opt);
 await p.route('**/*',async r=>{
  const u=new URL(r.request().url());if(u.origin!==ORIGIN){if(u.hostname==='mock.invalid')return r.fulfill({contentType:'application/json',body:'{"rows":[]}'});external.push({host:u.hostname,method:r.request().method()});return r.abort();}
  if(['/community/client.js','/analytics.js','/arcade3/telemetry.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:'/* replaced only by isolated QA fixture */'});
  const f=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(root))return r.abort();const file=[f,f+'.html',path.join(f,'index.html')].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!file)return r.fulfill({status:404,body:'missing'});
  let body=fs.readFileSync(file);if(u.pathname==='/descent/core.js')body=body.toString()+observe('DescentRules');if(u.pathname==='/challengers/core.js')body=body.toString()+observe('ChallengerRules');if(u.pathname==='/games/orbit-sprint/core.js')body=body.toString()+observe('OrbitRules');
  return r.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body});
 });
 if(process.env.INLINE_ONLY){
  const file=g.game==='gyro-drop'?'descent/index.html':g.game==='orbit-sprint'?'games/orbit-sprint/index.html':'games/'+g.game+'/index.html';
  const html=fs.readFileSync(path.join(root,file),'utf8'),scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]),styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
  await p.setContent(html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,''));await p.addScriptTag({content:fixture});await p.evaluate(o=>Object.assign(__opt,o),opt);
  for(const css of styles)await p.addStyleTag({content:fs.readFileSync(path.join(root,css),'utf8')});
  for(let src of scripts){
   if(['/community/client.js','/analytics.js','/arcade3/telemetry.js','/experience/entry-hints.js'].includes(src))continue;
   if(src==='/challengers/boot.js')src=g.game==='core-pins'?'/core-pins/bundle.js':'/challengers/game.js';
   let content=fs.readFileSync(path.join(root,src),'utf8');
   if(src==='/descent/core.js')content+=observe('DescentRules');if(src==='/challengers/core.js')content+=observe('ChallengerRules');if(src==='/games/orbit-sprint/core.js')content+=observe('OrbitRules');
   content=content.replaceAll('new URLSearchParams(location.search)',"new URLSearchParams("+JSON.stringify(query)+")");
   await p.addScriptTag({content});
  }
 }else await p.goto(ORIGIN+g.url+query);await p.waitForTimeout(100);await p.evaluate(()=>__frames(10));await p.waitForTimeout(70);assert.deepEqual(errors,[],g.game+' boot errors');return {ctx,p,errors,external};
}
async function end(p,g){
 // Advance frame callbacks only in this offline test. All gameplay still uses original rules.
 await p.evaluate(game=>{
  for(let i=0;i<8200;i++){
   const s=__snapshot();if(!s||!s.alive)break;
   if(game==='nova-merge'&&i%14===0){const c=document.querySelector('#phaser-game canvas'),b=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,pointerType:'mouse',isPrimary:true,buttons:1,button:0,clientX:b.x+b.width*.5,clientY:b.y+b.height*.5,bubbles:true}));c.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,pointerType:'mouse',isPrimary:true,buttons:0,button:0,clientX:b.x+b.width*.5,clientY:b.y+b.height*.5,bubbles:true}));}
   __frames(1);
  }
 },g.game);await p.waitForTimeout(100);
}
const report={scope:'retention-before-new-games',checks:[],productionWrites:0};
async function test(label,fn){await fn();report.checks.push(label);console.log('PASS '+label);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});try{
for(const width of (process.env.QUICK?'390':'390,1280').split(',').map(Number))for(const g of games){
 await test(g.name+' practice/replay/next '+width,async()=>{
  const {ctx,p,errors,external}=await load(browser,g,width);await p.locator(g.button).click();await p.evaluate(()=>__frames(3));assert((await p.evaluate(()=>__snapshot())).tick>0);await end(p,g);
  assert(await p.locator(g.dialog).isVisible());assert(await p.locator('.lj-local-comparison').isVisible());assert.equal(await p.locator(g.again).textContent(),'PLAY AGAIN');assert((await p.locator(g.save).textContent()).includes('Not a ranked score'));
  const previous=await p.evaluate(()=>__snapshot());assert(!previous.alive);const text=await p.locator('.lj-local-comparison').textContent();assert(text.includes('THIS RUN')&&text.includes('DEVICE BEST'));
  assert.equal(await p.locator('a[data-next-game]').count(),1);assert.equal((await p.evaluate(()=>__calls.start)).length,0);assert.equal((await p.evaluate(()=>__calls.finish)).length,0);
  await p.screenshot({path:path.join(out,g.game+'-result-'+width+'.png'),fullPage:true});
  const scroll=await p.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(scroll.scroll<=scroll.client+1,'horizontal overflow');
  await p.locator(g.again).click();await p.evaluate(()=>__frames(3));const current=await p.evaluate(()=>__snapshot());assert(current.alive&&current.tick<previous.tick);assert(!(await p.locator(g.dialog).isVisible()));assert.deepEqual(errors,[]);assert.equal(external.filter(x=>x.method==='POST').length,0);await ctx.close();
 });
}
for(const g of games){
 if(!process.env.INLINE_ONLY)await test(g.name+' intentional auto free / config offline',async()=>{const {p,ctx,errors}=await load(browser,g,390,{failConfig:true},'?play=1&utm_source=threads&utm_campaign=retention&utm_content=qa');await p.evaluate(()=>__frames(5));assert((await p.evaluate(()=>__snapshot())).tick>0);assert(!new URL(p.url()).searchParams.has('play'));assert.equal(new URL(p.url()).searchParams.get('utm_source'),'threads');assert.equal((await p.evaluate(()=>__calls.start)).length,0);assert.deepEqual(errors,[]);await p.goto(ORIGIN+'/');await p.waitForTimeout(80);const cards=p.locator('.game-card');let selected=null;for(let i=0;i<await cards.count();i++){const a=cards.nth(i);if(new URL(await a.getAttribute('href'),ORIGIN).pathname.replace(/\/$/,'')===g.url)selected=a;}assert(selected,'home card must exist');await selected.click();await p.waitForTimeout(100);await p.evaluate(()=>__frames(10));await p.waitForTimeout(50);assert((await p.evaluate(()=>__snapshot())).tick>0,'one home click begins free practice');assert(!new URL(p.url()).searchParams.has('play'));assert.equal((await p.evaluate(()=>__calls.start)).length,0);assert.deepEqual(errors,[]);await ctx.close();});
 await test(g.name+' blocked storage/capture not saved',async()=>{for(const capture of [false,true]){const {p,ctx,errors}=await load(browser,g,390,{blockedStorage:!capture},capture?'?capture=1&play=1':'');assert.equal((await p.evaluate(()=>__snapshot())).tick,0);await p.locator(g.button).click();await end(p,g);assert((await p.locator(g.save).textContent()).includes(capture?'no record written':'storage is unavailable'));assert.equal((await p.evaluate(()=>__calls.storage.filter(x=>/best|lj_ch_/.test(x[0])))).length,0);assert.deepEqual(errors,[]);await ctx.close();}});
 await test(g.name+' ranked pending/confirm/replay isolation',async()=>{
  const {p,ctx,errors}=await load(browser,g,390,{guest:false,holdFinish:true});
  // Orbit chooses ranked as the authenticated default; other games use their dedicated button.
  await p.locator(g.game==='orbit-sprint'?g.button:g.rank).click();await p.waitForTimeout(30);await p.evaluate(()=>__frames(3));await end(p,g);
  assert.equal((await p.evaluate(()=>__calls.start)).length,1);assert.equal((await p.evaluate(()=>__calls.finish)).length,1);
  assert(await p.locator(g.again).isDisabled());assert.equal(await p.locator(g.save).getAttribute('data-state'),'saving');assert.equal(await p.locator('a[data-next-game]').getAttribute('aria-disabled'),'true');
  if(g.close)assert(await p.locator(g.close).isDisabled());await p.evaluate(()=>__releaseSave());await p.waitForTimeout(100);
  assert.equal(await p.locator(g.save).getAttribute('data-state'),'verified');assert((await p.locator(g.save).textContent()).startsWith('Verified'));assert(!(await p.locator(g.again).isDisabled()));
  const payload=await p.evaluate(()=>__calls.finish[0]);assert.deepEqual(Object.keys(payload).sort(),['actions','runId','ticks']);
  await p.locator(g.again).click();await p.waitForTimeout(30);await p.evaluate(()=>__frames(3));assert((await p.evaluate(()=>__snapshot())).alive);assert.equal((await p.evaluate(()=>__calls.start)).length,2);assert.deepEqual(errors,[]);await ctx.close();
 });
 await test(g.name+' failed save exact retry',async()=>{
  const {p,ctx,errors}=await load(browser,g,390,{guest:false,failFinish:1});await p.locator(g.game==='orbit-sprint'?g.button:g.rank).click();await p.waitForTimeout(20);await end(p,g);assert.equal(await p.locator(g.save).getAttribute('data-state'),'failed');
  const retry=g.game==='gyro-drop'?'#retrySave':g.game==='core-pins'?'#pinsRetry':g.game==='nova-merge'?'[data-retry-save]':'#retrySave';assert(await p.locator(retry).isVisible());await p.locator(retry).click();await p.waitForTimeout(100);assert.equal(await p.locator(g.save).getAttribute('data-state'),'verified');const writes=await p.evaluate(()=>__calls.finish);assert.equal(writes.length,2);assert.deepEqual(writes[0],writes[1]);assert.deepEqual(errors,[]);await ctx.close();
 });
}
report.passed=true;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{report.passed=false;report.failure=e.stack;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
