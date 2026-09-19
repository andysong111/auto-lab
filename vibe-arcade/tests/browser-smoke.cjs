const {chromium}=require('playwright');const assert=require('node:assert/strict');const {spawn,execFileSync}=require('node:child_process');const path=require('node:path');
const root=path.resolve(__dirname,'..');
// The application build copies pinned, integrity-checked SVG assets onto the same origin.
execFileSync('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['scripts/build-flags.cjs'],{cwd:root,stdio:'inherit'});
async function loadedFlag(page,selector,code='KR'){
 await page.waitForFunction(({selector,code})=>{const img=document.querySelector(selector+' img.lj-flag');return img&&img.dataset.country===code&&img.complete&&img.naturalWidth>0;},{selector,code});
 const src=await page.locator(selector+' img.lj-flag').first().getAttribute('src');assert.equal(src,'/assets/flags/7.5.0/'+code.toLowerCase()+'.svg');
}
(async()=>{const server=spawn('python3',['-m','http.server','8765','--directory',root],{stdio:'ignore'});let browser;
try{await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({headless:true});
for(const [name,size] of [['desktop',{width:1366,height:1000}],['mobile',{width:390,height:844}]]) {
 const context=await browser.newContext({viewport:size,isMobile:name==='mobile',hasTouch:name==='mobile'});const errors=[],externalImages=[];
 context.on('request',r=>{if(r.resourceType()==='image'&&!r.url().startsWith('http://127.0.0.1:8765/'))externalImages.push(r.url());});
 await context.route('**/analytics.js',route=>route.fulfill({contentType:'text/javascript',body:'window.VibeAnalytics={track:()=>{}}'}));
 await context.route('**/api/event',route=>route.fulfill({status:204,body:''}));
 await context.route('**/functions/v1/loopjolt-community*',route=>{
   const u=new URL(route.request().url()),action=u.searchParams.get('action');let body;
   if(action==='config') body={loginReady:false,clientId:'',version:'orbit-v1',seed:125904,rankedGames:[{game:'orbit-sprint',version:'orbit-v1',title:'Orbit Sprint'},{game:'perfect-timing',version:'pt-sky-v1',title:'Perfect Timing · Skyforge'}]};
   else if(action==='profile')body={profile:{handle:'TestPilot',country:'KR'}};
   else {
     const game=u.searchParams.get('game')||'orbit-sprint',scope=u.searchParams.get('scope')||'world';
     if(game==='all'&&scope==='world')body={mode:'overall',rankedGameCount:2,overallRule:'Each game gives placement points: 1st 1000, 2nd 990.',rows:[{rank:1,handle:'andy',country_code:'KR',points:2000,games_played:2}]};
     else if(scope==='nations')body={mode:game==='all'?'overall':'game',rankedGameCount:2,countryRule:'Country standings sum the top 10 distinct players best scores for this game.',rows:[{rank:1,country_code:'KR',points:592,players:1,contributors:1}]};
     else body={mode:'game',countryRule:'Country standings sum the top 10 distinct players best scores for this game.',rows:[{rank:1,handle:'andy',country_code:'KR',score:592}]};
   }
   return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type'},body:JSON.stringify(body)});
 });
 let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/games/orbit-sprint/');await page.locator('#start').click();await page.waitForTimeout(800);await page.locator('#jump').dispatchEvent('pointerdown');await page.waitForTimeout(600);assert(Number((await page.locator('#score').innerText()).replaceAll(',',''))>0);await page.locator('#pause').click();assert.equal(await page.locator('#pause').innerText(),'Resume');await page.locator('#pause').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.close();
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/community/?game=perfect-timing');await page.waitForFunction(()=>document.querySelectorAll('#rows tr').length===1);await loadedFlag(page,'#rows tr:first-child');await page.waitForFunction(()=>document.querySelector('#login').disabled);assert.equal(await page.locator('#country option').count(),250);assert((await page.locator('#rows tr').first().innerText()).includes('andy'));assert((await page.locator('#rows tr').first().innerText()).includes('592'));
 await page.getByRole('button',{name:'Country standings',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#nameHeader').textContent==='COUNTRY');await loadedFlag(page,'#rows tr:first-child');
 await page.getByRole('button',{name:'Players',exact:true}).click();await page.selectOption('#gameFilter','all');await page.waitForFunction(()=>document.querySelector('#scoreHeader').textContent==='CHAMPIONSHIP');await loadedFlag(page,'#rows tr:first-child');assert((await page.locator('#rows tr').first().innerText()).includes('2,000'));
 await page.getByRole('button',{name:'Players in country',exact:true}).click();await page.selectOption('#countryFilter','JP');await loadedFlag(page,'#countryFilterFlagPreview','JP');
 await page.evaluate(()=>sessionStorage.setItem('loopjolt_google_session_v1',JSON.stringify({token:'QA-not-a-real-token',expires:Date.now()+3600000})));await page.reload();await page.waitForFunction(()=>document.querySelector('#accountTitle').textContent.includes('TestPilot'));await loadedFlag(page,'#accountTitle');
 // Established profiles now intentionally hide editing behind a disclosure; exercise it.
 await page.locator('#profileDetails summary').click();await loadedFlag(page,'#countryFlagPreview');
 await page.selectOption('#country','US');await loadedFlag(page,'#countryFlagPreview','US');await page.selectOption('#country','');assert.equal(await page.locator('#countryFlagPreview img').count(),0);assert((await page.locator('#countryFlagPreview').innerText()).includes('No country selected'));
 const safe=await page.evaluate(()=>{const n=document.createElement('div');LoopCommunity.renderFlagLabel(n,'../../bad','<img src=x onerror=alert(1)>');return {imgs:n.querySelectorAll('img').length,text:n.textContent};});assert.equal(safe.imgs,0);assert(safe.text.includes('<img'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 for(const [url,selector] of [['/games/orbit-sprint/','#playerLink'],['/arcade3/play.html?game=reaction-rush','#identity'],['/arcade3/play.html?game=perfect-timing','#identity'],['/arcade3/play.html?game=dont-press','#identity']]){
  await page.goto('http://127.0.0.1:8765'+url);await page.waitForFunction(selector=>document.querySelector(selector).textContent.includes('TestPilot'),selector);await loadedFlag(page,selector);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await context.route('**/assets/flags/7.5.0/br.svg',r=>r.abort());
 await page.evaluate(()=>{const n=document.createElement('div');n.id='fallback-test';document.body.append(n);LoopCommunity.renderFlagLabel(n,'BR','SafePilot');});
 await page.waitForFunction(()=>document.querySelector('#fallback-test .lj-flag-placeholder')?.textContent==='BR');
 assert.deepEqual(externalImages,[]);assert.deepEqual(errors,[]);console.log(name+' browser/real-image-flag smoke PASS');await context.close();
}
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
