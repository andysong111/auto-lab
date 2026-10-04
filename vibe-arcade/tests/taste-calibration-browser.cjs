'use strict';
const {chromium}=require('../autonomy/node_modules/playwright');
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),port=8771,out=process.env.FACTORY_EVIDENCE_DIR||path.join(root,'tmp-taste-calibration');

async function finishPrototype(page,id){
  await page.locator(`[data-game="${id}"]`).click();
  await page.locator('#startButton').click();
  const canvas=page.locator('#gameCanvas'),box=await canvas.boundingBox();assert(box);
  if(id==='launch'){
    await page.mouse.move(box.x+box.width*.5,box.y+box.height*.82);await page.mouse.down();await page.mouse.move(box.x+box.width*.54,box.y+box.height*.46,{steps:5});await page.mouse.up();
  }else if(id==='chain'){
    await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);
  }else{
    await page.mouse.move(box.x+box.width*.82,box.y+box.height*.52);await page.mouse.down();await page.mouse.up();
  }
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
      await page.waitForFunction(()=>window.PlayJoltTasteLab?.prototypeIds?.length===3);
      assert.equal(await page.locator('.prototype-tab').count(),3);assert(await page.locator('#gameCanvas').isVisible());
      const pixels=await page.locator('#gameCanvas').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let lit=0;for(let i=0;i<data.length;i+=160)if(data[i]+data[i+1]+data[i+2]>30)lit++;return lit});assert(pixels>100,'canvas must render nonblank gameplay');
      for(const id of ['launch','chain','guard'])await finishPrototype(page,id);
      assert.equal(await page.locator('#testedCount').innerText(),'3');assert(await page.locator('#ownerDecision').isVisible());
      await page.locator('#winnerOptions [data-winner="chain"]').click();
      assert.equal(await page.evaluate(()=>PlayJoltTasteLab.getState().winner),'chain');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      await page.screenshot({path:path.join(out,`taste-calibration-${name}.png`),fullPage:true});
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('taste calibration browser PASS');
  }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
