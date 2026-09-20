/* Browser integration tests. Mock identity and storage only; real rules and rendering.
 * No test user or score reaches the production backend. */
const {chromium}=require(process.env.PW_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUT||'/tmp/descent-qa';fs.mkdirSync(out,{recursive:true});
const inline=process.env.INLINE_QA==='1';let server,browser;
const fixture=`(()=>{window.__calls={start:0,finish:0,payloads:[]};window.__options={failStart:false,failFinish:false,delayFinish:false};let p={handle:'Descent_QA',country:'KR'},stored=null,n=0;
window.LoopCommunity={get profile(){return p},authenticated:true,endpoint:'http://127.0.0.1:8765/mock',
 config:async()=>({seed:7,loginReady:true,rankedGames:[{game:'gyro-drop',version:'gd-descent-v2'}]}),me:async()=>p,countryName:()=> 'South Korea',
 renderFlagLabel:(el,code,handle)=>{el.textContent=code+' '+handle},
 api:async(action,body)=>{if(action==='start'){__calls.start++;if(__options.failStart)throw Error('request_failed');return {runId:'00000000-0000-4000-8000-'+String(++n).padStart(12,'0'),seed:7,version:'gd-descent-v2'};}
 if(action==='finish'){__calls.finish++;__calls.payloads.push(JSON.parse(JSON.stringify(body)));if(__options.failFinish){__options.failFinish=false;throw Error('request_failed');}
 const v=DescentRules.replay(7,body.actions,body.ticks);stored=v.score;const answer={saved:true,score:v.score};if(__options.delayFinish){__options.delayFinish=false;return await new Promise(r=>window.__release=()=>r(answer));}return answer;}}
};
window.LJTelemetry={track:()=>{}};
let time=performance.now(),queue=new Map(),id=0;Object.defineProperty(performance,'now',{value:()=>time});window.requestAnimationFrame=f=>{queue.set(++id,f);return id};window.cancelAnimationFrame=i=>queue.delete(i);
window.__qa={frame:(ms=16.667)=>{time+=ms;const q=[...queue.values()];queue.clear();q.forEach(f=>f(time));},frames:n=>{for(let i=0;i<n;i++)__qa.frame();}};
})();`;
async function load(width=390,capture=false){
 const context=await browser.newContext({viewport:{width,height:width<600?900:1100},isMobile:width<600,hasTouch:width<600});const p=await context.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 await p.route('**/api/event',r=>r.fulfill({status:204,body:''}));await p.route('**/mock*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:'gd-descent-v2',rows:[]})}));
 if(inline){let html=fs.readFileSync(path.join(root,'descent/index.html'),'utf8');const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(x=>x[1]);html=html.replace(/<script src="[^"]+"><\/script>/g,'').replace(/<link rel="stylesheet"[^>]+>/g,'');await p.setContent(html);await p.addStyleTag({content:fs.readFileSync(path.join(root,'descent/style.css'),'utf8')+fs.readFileSync(path.join(root,'community/flags.css'),'utf8')});await p.addScriptTag({content:fixture});for(const f of scripts){if(f.includes('community/client')||f.includes('telemetry'))continue;let content=fs.readFileSync(path.join(root,f),'utf8');if(f.endsWith('/app.js')&&capture)content=content.replace("new URLSearchParams(location.search).get('capture')==='1'","true");await p.addScriptTag({content});}}
 else{await p.addInitScript(fixture);await p.route('**/community/client.js',r=>r.fulfill({contentType:'text/javascript',body:'/* identity mocked */'}));await p.route('**/arcade3/telemetry.js',r=>r.fulfill({contentType:'text/javascript',body:'/* analytics suppressed */'}));await p.goto('http://127.0.0.1:8765/descent/'+(capture?'?capture=1':''),{waitUntil:'domcontentloaded'});}
 await p.waitForTimeout(120);await p.evaluate(()=>__qa.frames(3));await p.waitForSelector('#gameCanvas canvas');return p;
}
async function aim(p,target,frames){await p.evaluate(({target,frames})=>{const s=DescentDiagnostics.snapshot().state,d=DescentRules.mod(target-s.rotation+1800)-1800,code=d<0?'ArrowLeft':'ArrowRight';window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));__qa.frames(Math.max(0,Math.round(Math.abs(d)/40)));window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));__qa.frames(frames||2);},{target,frames});}
async function endWithScore(p){
 // One real clean drop, then three red contacts, entirely via keyboard events.
 let s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);await aim(p,900-s.rings[0].gap);await p.evaluate(()=>__qa.frames(115-DescentDiagnostics.snapshot().state.tick));
 s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);assert(s.floor>=1);
 for(let i=0;i<3;i++){s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);if(!s.alive)break;await aim(p,900-s.rings[s.floor].hazard);await p.evaluate(()=>__qa.frames(Math.max(1,DescentDiagnostics.snapshot().state.nextImpact-DescentDiagnostics.snapshot().state.tick+1)));}
 await p.waitForTimeout(50);assert(await p.locator('#result').isVisible());
}
(async()=>{try{
 if(!inline){server=spawn('python3',['-m','http.server','8765','--directory',root],{stdio:'ignore'});await new Promise(r=>setTimeout(r,700));}
 browser=await chromium.launch({headless:true,...(process.env.PW_EXECUTABLE?{executablePath:process.env.PW_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const width of [360,390,768,1280]){const p=await load(width);assert(await p.locator('#play').isEnabled());assert(await p.locator('#ranked').isEnabled());await p.screenshot({path:path.join(out,'entry-'+width+'.png'),fullPage:true});await p.click('#play');await p.evaluate(()=>__qa.frames(30));assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().playing),true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(p.errors,[]);await p.context().close();}
 {const p=await load();await p.click('#play');await endWithScore(p);assert((await p.locator('#save').innerText()).includes('Practice'));assert.equal(await p.evaluate(()=>__calls.finish),0);await p.context().close();}
 {const p=await load();await p.click('#ranked');await p.waitForTimeout(10);await endWithScore(p);assert((await p.locator('#save').innerText()).includes('Verified'));assert.equal(await p.evaluate(()=>__calls.finish),1);await p.screenshot({path:path.join(out,'verified-result.png'),fullPage:true});assert.deepEqual(p.errors,[]);await p.context().close();}
 {const p=await load();await p.evaluate(()=>__options.failStart=true);await p.click('#ranked');await p.waitForTimeout(20);assert((await p.locator('#entryNote').innerText()).includes('unavailable'));assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().playing),false);await p.context().close();}
 {const p=await load();await p.evaluate(()=>__options.failFinish=true);await p.click('#ranked');await p.waitForTimeout(10);await endWithScore(p);assert(await p.locator('#retrySave').isVisible());await p.click('#retrySave');await p.waitForTimeout(50);assert((await p.locator('#save').innerText()).includes('Verified'));assert.equal(await p.evaluate(()=>__calls.payloads[0].runId===__calls.payloads[1].runId),true);await p.context().close();}
 {const p=await load();await p.click('#ranked');await p.waitForTimeout(10);await p.evaluate(()=>__qa.frame(300));assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().ranked),false);assert((await p.locator('#status').innerText()).includes('practice only'));await endWithScore(p);assert.equal(await p.evaluate(()=>__calls.finish),0);await p.context().close();}
 {const p=await load();await p.click('#ranked');await p.waitForTimeout(10);await p.click('#pause');assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().paused),true);assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().ranked),false);await p.click('#resume');assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().paused),false);await p.context().close();}
 {const p=await load();await p.evaluate(()=>__options.delayFinish=true);await p.click('#ranked');await p.waitForTimeout(10);await endWithScore(p);assert((await p.locator('#save').innerText()).includes('Verifying'));await p.click('#again');await p.waitForTimeout(10);await p.evaluate(()=>__release());await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>DescentDiagnostics.snapshot().playing),true);assert.equal(await p.locator('#result').isVisible(),false);await p.context().close();}
 {const p=await load(390,true);assert(await p.locator('#ranked').isDisabled());await p.click('#play');await endWithScore(p);assert.equal(await p.evaluate(()=>__calls.start+__calls.finish),0);await p.context().close();}
 // Successful full playthrough through the three worlds, generated from actual input events.
 {const p=await load(1280,true);await p.click('#play');await p.evaluate(async()=>{
  for(let i=0;i<5405&&DescentDiagnostics.snapshot().state.alive;i++){
   const s=DescentDiagnostics.snapshot().state,r=DescentRules.ringAt(s);if(!r)break;
   const motion=s.motion+Math.max(0,s.nextImpact-s.tick)*(s.tick<s.focusUntil?1:2),future=DescentRules.ringAt({...s,motion});let target=900-future.gap-Math.trunc(motion*future.speed/2);
   if(!future.open)target+=future.width/2+350;
   const d=DescentRules.mod(target-s.rotation+1800)-1800;
   for(const [code,down] of [['ArrowLeft',d<-21],['ArrowRight',d>21]])window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));
   // When left is needed, dispatch it last because keyup clears steering.
   if(d<-21)window.dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowLeft',bubbles:true}));
   if(s.energy===100&&s.burst===0&&r.kind==='guardian')window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));
   __qa.frame();
   if(s.floor>=16&&!window.__zone1){window.__zone1=DescentDiagnostics.snapshot();}
  }
 });await p.waitForTimeout(30);const s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);console.log('Full input playthrough',s.floor,s.score,s.reason);assert.equal(s.won,true);await p.screenshot({path:path.join(out,'complete-result.png'),fullPage:true});assert.deepEqual(p.errors,[]);await p.context().close();}
 console.log('PASS: 4 viewports, practice, ranked replay, start failure, save retry, frame downgrade, pause, stale response, capture and 48-ring completion.');
}finally{if(browser)await browser.close();if(server)server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
