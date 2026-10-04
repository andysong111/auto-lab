'use strict';
const {chromium}=require('../autonomy/node_modules/playwright');
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),port=8771,out=process.env.FACTORY_EVIDENCE_DIR||path.join(root,'tmp-taste-calibration');

async function finishHaloGuard(page,gameplayPath){
  await page.locator('#startButton').click();
  const canvas=page.locator('#gameCanvas'),box=await canvas.boundingBox();assert(box);
  await page.mouse.move(box.x+box.width*.82,box.y+box.height*.52);await page.mouse.down();await page.mouse.move(box.x+box.width*.18,box.y+box.height*.52,{steps:12});await page.mouse.up();
  await page.waitForFunction(()=>PlayJoltTasteLab.getRuntime()?.phase>=2);
  const runtime=await page.evaluate(()=>PlayJoltTasteLab.getRuntime());assert(runtime.running);assert(runtime.items>0);assert.equal(runtime.lives,4,'missing a rescue character must not cause early core damage');assert(Math.abs(runtime.angle-Math.PI/2)>.2,'pointer input must rotate the shield');
  await page.screenshot({path:gameplayPath,fullPage:true});
  await page.locator('#resultLayer').waitFor({state:'visible',timeout:6000});
  await page.locator('#rating [data-rating="4"]').click();
}

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const python=process.platform==='win32'?'python':'python3',server=spawn(python,['-m','http.server',String(port),'--directory',root],{stdio:'ignore'});let browser;
  try{
    await new Promise(resolve=>setTimeout(resolve,900));
    try{browser=await chromium.launch({headless:true});}catch(error){
      if(!/Executable doesn't exist/.test(String(error?.message||error)))throw error;
      browser=await chromium.launch({headless:true,channel:'chrome'});
    }
    for(const [name,viewport,isMobile] of [['desktop',{width:1440,height:1000},false],['mobile',{width:390,height:844},true]]){
      const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/api/event',route=>route.fulfill({status:204,body:''}));
      await page.goto(`http://127.0.0.1:${port}/lab/taste-calibration/?qa=1`);
      await page.waitForFunction(()=>window.PlayJoltTasteLab?.prototypeIds?.length===1&&window.PlayJoltTasteLab?.version===9&&window.PlayJoltTasteLab?.renderer==='three-webgl'&&window.PlayJoltTasteLab?.isBackgroundReady());
      assert.equal(await page.locator('.prototype-tab').count(),0);assert(await page.locator('#gameCanvas').isVisible());
      const visual=await page.evaluate(()=>PlayJoltTasteLab.getVisualProbe());assert(visual.litPixels>100,'WebGL canvas must render nonblank 3D gameplay');assert.equal(visual.backgroundReady,true,'illustrated sky background must load');assert.equal(visual.width,960);assert.equal(visual.height,600);
      await finishHaloGuard(page,path.join(out,`taste-calibration-${name}-gameplay.png`));assert(await page.locator('#ownerDecision').isVisible());
      await page.locator('#winnerOptions [data-winner="guard"]').click();
      assert.equal(await page.evaluate(()=>PlayJoltTasteLab.getState().winner),'guard');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      await page.screenshot({path:path.join(out,`taste-calibration-${name}.png`),fullPage:true});
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('taste calibration browser PASS');
  }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
