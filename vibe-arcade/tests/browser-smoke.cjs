const {chromium}=require('playwright');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
(async()=>{const root=path.resolve(__dirname,'..');const server=spawn('python3',['-m','http.server','8765','--directory',root],{stdio:'ignore'});let browser;
try{await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch({headless:true});
for(const [name,size] of [['desktop',{width:1366,height:1000}],['mobile',{width:390,height:844}]]) {
 const context=await browser.newContext({viewport:size,isMobile:name==='mobile',hasTouch:name==='mobile'});const errors=[];
 await context.route('**/analytics.js',route=>route.fulfill({contentType:'text/javascript',body:'window.VibeAnalytics={track:()=>{}}'}));
 await context.route('**/functions/v1/loopjolt-community*',route=>{
   const u=new URL(route.request().url()),action=u.searchParams.get('action');
   let body;
   if(action==='config') body={loginReady:false,clientId:'',version:'orbit-v1',seed:125904,rankedGames:[{game:'orbit-sprint',version:'orbit-v1',title:'Orbit Sprint'}]};
   else {
     const game=u.searchParams.get('game')||'orbit-sprint',scope=u.searchParams.get('scope')||'world';
     if(game==='all'&&scope==='world') body={mode:'overall',rankedGameCount:1,overallRule:'Each game gives placement points: 1st 1000, 2nd 990, down to 100th 10.',rows:[{rank:1,handle:'andy',country_code:'KR',points:1000,games_played:1}]};
     else if(scope==='nations') body={mode:game==='all'?'overall':'game',rankedGameCount:1,countryRule:'Country standings sum the top 10 distinct players best scores for this game.',rows:[{rank:1,country_code:'KR',points:392,players:1,contributors:1}]};
     else body={mode:'game',countryRule:'Country standings sum the top 10 distinct players best scores for this game.',rows:[{rank:1,handle:'andy',country_code:'KR',score:392}]};
   }
   return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
 });
 let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/games/orbit-sprint/');await page.locator('#start').click();await page.waitForTimeout(800);await page.locator('#jump').dispatchEvent('pointerdown');await page.waitForTimeout(600);assert(Number((await page.locator('#score').innerText()).replaceAll(',',''))>0);await page.locator('#pause').click();assert.equal(await page.locator('#pause').innerText(),'Resume');await page.locator('#pause').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.close();
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/community/');await page.waitForFunction(()=>document.querySelectorAll('#rows tr').length===1);assert(await page.locator('#login').isDisabled());assert.equal(await page.locator('#country option').count(),250);assert((await page.locator('#rows tr').first().innerText()).includes('🇰🇷'));assert((await page.locator('#rows tr').first().innerText()).includes('andy'));
 await page.getByRole('button',{name:'Country standings',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#rule').textContent.includes('10 distinct'));assert((await page.locator('#rows tr').first().innerText()).includes('🇰🇷'));
 await page.getByRole('button',{name:'Players',exact:true}).click();await page.selectOption('#gameFilter','all');await page.waitForFunction(()=>document.querySelector('#scoreHeader').textContent==='CHAMPIONSHIP');assert((await page.locator('#rows tr').first().innerText()).includes('1,000'));assert((await page.locator('#rows tr').first().innerText()).includes('🇰🇷'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);console.log(name+' browser smoke PASS');await context.close();
}
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
