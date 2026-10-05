'use strict';

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const {serve}=require('../qa/server.cjs');
const {createDriver}=require('../qa/radial-browser.cjs');
const raster=require('../qa/commercial/raster.cjs');
const {materialize}=require('./halo-v9-product-fixture.cjs');

function pixelDiversity(buffer){
  const png=raster.decode(buffer);
  const buckets=new Set();
  for(let index=0;index<png.data.length;index+=png.channels*41){const r=png.data[index]>>5,g=png.data[index+1]>>5,b=png.data[index+2]>>5;buckets.add(`${r}:${g}:${b}`);}
  return buckets.size;
}

async function waitForDiagnostics(page,errors){
  try{await page.waitForFunction(()=>!!globalThis.GameDiagnostics,null,{timeout:8000});}
  catch(error){const visible=await page.locator('[data-game-error]').textContent().catch(()=>''),body=await page.locator('body').innerText().catch(()=> '');throw Error(`diagnostics boot timeout: ${visible||errors.join(' | ')||body.slice(0,500)||error.message}`);}
}

test('approved Halo Guard V9 renders real WebGL and completes the protected loop',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-halo-v9-browser-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const {model,contract}=await materialize(root),server=await serve(root);t.after(()=>server.close());
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});t.after(()=>browser.close());
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
    const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage();
    try{
      const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
      await page.clock.install({time:new Date(0)});await page.clock.pauseAt(new Date(86400000));await page.goto(server.origin+'/?qa=1&capture=1&seed=7',{waitUntil:'load'});await waitForDiagnostics(page,errors);await page.clock.runFor(50);
      assert.equal(await page.evaluate(()=>{const c=document.querySelector('[data-game-canvas]');return !!(c.getContext('webgl2')||c.getContext('webgl'));}),true,'Three.js WebGL context');
      const image=await page.locator('.stage').screenshot({animations:'disabled'});assert(pixelDiversity(image)>8,'rendered playfield has visual variation');
      await page.locator('[data-game-start]').click();const before=await page.evaluate(()=>GameDiagnostics.snapshot());
      await page.keyboard.down('ArrowLeft');await page.clock.runFor(90);await page.keyboard.up('ArrowLeft');await page.clock.runFor(20);const moved=await page.evaluate(()=>GameDiagnostics.snapshot());
      assert.notEqual(moved.state.targetAngle,before.state.targetAngle,'keyboard changes protected shield target');assert.equal(moved.presentation.feedback_active,true);
      await page.clock.runFor(500);assert.equal((await page.evaluate(()=>GameDiagnostics.snapshot())).presentation.feedback_active,false,'feedback settles instead of retriggering forever');
      if(viewport.width===390){
        await page.locator('[data-game-restart]').click().catch(()=>{});await page.reload({waitUntil:'load'});await waitForDiagnostics(page,errors);await page.clock.runFor(50);await page.locator('[data-game-start]').click();
        const driver=createDriver(contract,model,(ok,message,actual)=>assert.ok(ok,`${message}: ${JSON.stringify(actual)}`));
        const terminal=await driver.drive({p:page,ctx},{outcome:'success',inputMode:'touch'});
        assert.equal(terminal.phase,'finished');assert.equal(terminal.state.outcome,'success');assert(terminal.score>0);assert(terminal.progress>=6);
        assert.match(await page.locator('[data-result-title]').innerText(),/SKY CITADEL SECURED/);
        await page.locator('[data-game-restart]').click();const replay=await page.evaluate(()=>GameDiagnostics.snapshot());assert.equal(replay.phase,'playing');assert.equal(replay.progress,0);assert.equal(replay.score,0);
      }
      assert.deepEqual(errors,[]);
    }finally{await ctx.close();}
  }
});
