const {chromium}=require('playwright');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
(async()=>{const root=path.resolve(__dirname,'..');const server=spawn('python3',['-m','http.server','8765','--directory',root],{stdio:'ignore'});let browser;
try{await new Promise(r=>setTimeout(r,900));browser=await chromium.launch({headless:true});
for(const [label,viewport] of [['desktop',{width:1280,height:1000}],['mobile',{width:390,height:844}]])for(const game of ['gyro-drop','core-pins','nova-merge']){
 const context=await browser.newContext({viewport,isMobile:label==='mobile',hasTouch:label==='mobile'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/event',r=>r.fulfill({status:204,body:''}));
 await page.route('**/functions/v1/loopjolt-community*',r=>{const u=new URL(r.request().url()),action=u.searchParams.get('action');if(action==='config')return r.fulfill({contentType:'application/json',body:JSON.stringify({seed:125904,loginReady:true,rankedGames:[]})});return r.fulfill({status:401,contentType:'application/json',body:'{"error":"authentication_required"}'});});
 const response=await page.goto('http://127.0.0.1:8765/challengers/play.html?game='+game,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.waitForSelector('#phaser-game canvas');assert.equal(await page.locator('#ranked').isDisabled(),true);await page.locator('#primary').click();await page.waitForTimeout(250);
 if(game==='gyro-drop'){await page.keyboard.press('ArrowRight');await page.waitForTimeout(80);await page.keyboard.press('ArrowLeft');}
 if(game==='core-pins')await page.keyboard.press('Space');
 if(game==='nova-merge'){await page.keyboard.press('4');await page.waitForTimeout(180);await page.keyboard.press('4');}
 await page.waitForTimeout(350);assert((await page.locator('#status').innerText()).includes('Practice run'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);console.log(label,game,'PASS');await context.close();
}

 // A delayed account/config response must not rewind or relabel a practice run already in progress.
 {const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/event',r=>r.fulfill({status:204,body:''}));
 await page.route('**/functions/v1/loopjolt-community*',async r=>{await new Promise(x=>setTimeout(x,700));return r.fulfill({contentType:'application/json',body:JSON.stringify({seed:125904,loginReady:true,rankedGames:[]})});});
 await page.goto('http://127.0.0.1:8765/challengers/play.html?game=gyro-drop',{waitUntil:'domcontentloaded'});await page.waitForSelector('#phaser-game canvas');await page.locator('#primary').click();await page.waitForTimeout(950);assert((await page.locator('#status').innerText()).includes('Practice run'));assert.deepEqual(errors,[]);await context.close();}

 // Ranked clock helper itself is loaded before challenger controller and invalidates a long stall.
 {const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.route('**/api/event',r=>r.fulfill({status:204,body:''}));await page.route('**/functions/v1/loopjolt-community*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({seed:125904,loginReady:true,rankedGames:[]})}));await page.goto('http://127.0.0.1:8765/challengers/play.html?game=core-pins');assert.equal(await page.evaluate(()=>typeof RankedClock.observe),'function');assert.equal(await page.evaluate(()=>{const s=RankedClock.create();return RankedClock.observe(s,300)}),false);await context.close();}
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});