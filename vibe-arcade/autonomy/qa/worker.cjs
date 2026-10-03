'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serve} = require('./server.cjs'), {installGuard} = require('./guard.cjs');
const {reviewedTouchProbe} = require('./input-probe.cjs');
const {atomicJSON,readJSON,hashTree,hash} = require('../orchestrator/files.cjs');
const {validate} = require('../orchestrator/manifest.cjs');
const sleep = ms => new Promise(r => setTimeout(r,ms));
const at = (obj,key) => key.split('.').reduce((o,k) => o?.[k], obj);
const snap = page => page.evaluate(() => GameDiagnostics.snapshot());
const progressChanged = (baseline,after) => after?.score!==baseline?.score||after?.progress!==baseline?.progress;
async function execute(config) {
  const {manifest, gameRoot, outDir, policy} = config; validate(manifest);
  fs.mkdirSync(outDir,{recursive:true}); const began=Date.now(), sourceHash=hashTree(gameRoot);
  const report = {schema_version:1, game_id:manifest.game_id, version:manifest.version, source_hash:sourceHash,
    policy_hash:hash(policy), passed:false, hard_failures:[], soft_failures:[], console_errors:[], page_errors:[], browser_cases:[], screenshots:[], side_effects:[], duration_ms:0,
    scope:'isolated browser verification; no claim of fun, retention or production approval'};
  const save = () => { report.duration_ms=Date.now()-began; atomicJSON(path.join(outDir,'qa.json'),report); };
  const fail = (code,message,viewport) => report.hard_failures.push({code,message:String(message).slice(0,1500),viewport});
  let server,browser;
  try {
    server=await serve(gameRoot);
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
    for (const [width,height] of policy.required_viewports) {
      const c={viewport:{width,height},checks:[],passed:false,load_ms:0,resources:[]}, effects=[];
      report.browser_cases.push(c);
      const ctx=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:true,serviceWorkers:'block'});
      await installGuard(ctx,server.origin,effects);
      const p=await ctx.newPage(); p.setDefaultTimeout(3500); p.setDefaultNavigationTimeout(policy.limits.load_ms);
      await p.clock.install();
      const assets=new Map(), broken=[];
      p.on('console',m => { if(m.type()==='error') report.console_errors.push({viewport:width,message:m.text().slice(0,1200)}); });
      p.on('pageerror',e => report.page_errors.push({viewport:width,message:e.message.slice(0,1200)}));
      p.on('response',r => { const u=new URL(r.url()); if(u.origin===server.origin) { assets.set(u.pathname,r.status()); if(r.status()>=400) broken.push(u.pathname); } });
      let current='html',midCaptured=false;
      const capture=async phase=>{const name=`viewport-${width}-${phase}.png`;await p.screenshot({path:path.join(outDir,name),fullPage:true,animations:'disabled',timeout:5000});report.screenshots.push(name);};
      const check=async(name,fn) => { current=name; await fn(); c.checks.push(name); };
      const touch=async(page,probeCtx,probe)=>{const before=await snap(page), value=at(before,manifest.qa.pointer.observation);assert(value!==undefined,'pointer observation missing');const box=await page.locator('[data-game-canvas]').boundingBox(),cdp=await probeCtx.newCDPSession(page);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*probe.point.x,y:box.y+box.height*probe.point.y}]});await page.clock.runFor(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}const after=await snap(page);assert(after.accepted_inputs.pointer>before.accepted_inputs.pointer,'touch not accepted');return {before,value,after,effect:at(after,manifest.qa.pointer.observation)};};
      const budget=async() => {
        const s=await snap(p), dom=await p.locator('*').count();
        assert(Number.isFinite(s.entities)&&s.entities>=0&&s.entities<=policy.limits.max_entities,'runaway entity count');
        assert(dom<=policy.limits.max_dom_nodes,'runaway DOM'); assert(!s.error,'runtime error boundary: '+s.error);
        c.resources.push({tick:s.tick,entities:s.entities,dom}); return s;
      };
      try {
        await check('html',async()=>{ const t=Date.now(), r=await p.goto(server.origin+'/?qa=1&capture=1&seed='+manifest.qa.seed,{waitUntil:'load'}); assert(r?.status()===200,'HTML status');
          try { await p.waitForFunction(()=>!!window.GameDiagnostics); }
          catch(e) { const visible=await p.locator('[data-game-error]').textContent().catch(()=>null); throw Error('diagnostics boot timeout'+(visible&&visible.trim()?': '+visible.trim():'')); }
          c.load_ms=Date.now()-t; assert(c.load_ms<=policy.limits.load_ms,'initial load too slow'); assert((await p.locator('body').innerText()).trim().length>30,'blank page'); });
        await check('assets',async()=>{ assert.equal(broken.length,0,'missing assets'); const urls=await p.locator('script[src],link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>new URL(n.src||n.href).pathname)); assert(urls.length>=3,'missing core/app/view assets'); for(const u of urls) assert(assets.get(u)===200,'asset failed: '+u); });
        await capture('entry');
        await check('start',async()=>{ const before=await snap(p); assert.equal(before.phase,'idle'); assert.equal(before.metadata.game_id,manifest.game_id); assert.equal(before.metadata.version,manifest.version); await p.locator('[data-game-start]').click(); assert.equal((await snap(p)).phase,'playing'); });
        await check('real_clock',async()=>{ const s=await snap(p); await p.waitForFunction(t=>GameDiagnostics.snapshot().tick>t,s.tick,{timeout:policy.limits.freeze_ms}); });
        // Keep real-clock liveness as a separate hard gate; accelerate only the subsequent full lifecycle.
        await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
        // Real-clock liveness may advance autonomous fixtures. Reset to the same
        // deterministic start used by the independent touch parity context.
        await p.reload({waitUntil:'load'});await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.runFor(50);await p.locator('[data-game-start]').click();
        const progressBaseline=await snap(p);let keyboardBaseline,keyboardValue,keyboardEffect;
        await check('keyboard',async()=>{ const before=await snap(p), value=at(before,manifest.qa.keyboard.observation); assert(value!==undefined,'observation missing'); keyboardBaseline=before;keyboardValue=value;await p.keyboard.down(manifest.qa.keyboard.key); await p.clock.runFor(200); await p.keyboard.up(manifest.qa.keyboard.key); const after=await snap(p); assert(after.accepted_inputs.keyboard>before.accepted_inputs.keyboard,'keyboard not accepted'); keyboardEffect=at(after,manifest.qa.keyboard.observation); assert.notDeepEqual(keyboardEffect,value,'keyboard had no core effect'); });
        await check('touch',async()=>{
          const probe=reviewedTouchProbe(manifest),probeEffects=[],freshCtx=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:true,serviceWorkers:'block'});await installGuard(freshCtx,server.origin,probeEffects);const fresh=await freshCtx.newPage();fresh.setDefaultTimeout(3500);fresh.setDefaultNavigationTimeout(policy.limits.load_ms);
          fresh.on('console',m=>{if(m.type()==='error')report.console_errors.push({viewport:width,message:m.text().slice(0,1200)});});fresh.on('pageerror',e=>report.page_errors.push({viewport:width,message:e.message.slice(0,1200)}));
          try{await fresh.clock.install({time:new Date(0)});await fresh.clock.pauseAt(new Date(86400000));await fresh.goto(server.origin+'/?qa=1&capture=1&seed='+manifest.qa.seed,{waitUntil:'load'});await fresh.waitForFunction(()=>!!window.GameDiagnostics);await fresh.clock.runFor(50);await fresh.locator('[data-game-start]').click();let aligned=await snap(fresh),syncMs=0;while(aligned.tick<keyboardBaseline.tick&&syncMs++<policy.limits.freeze_ms){await fresh.clock.runFor(1);aligned=await snap(fresh);}assert.equal(aligned.tick,keyboardBaseline.tick,'touch parity context could not reproduce keyboard tick');const result=await touch(fresh,freshCtx,probe);assert.notDeepEqual(result.effect,result.value,'touch had no core effect for '+(probe.action||probe.source));if(probe.action){assert.equal(manifest.qa.pointer.observation,manifest.qa.keyboard.observation,'reviewed keyboard/touch action must share one observation');assert.deepEqual(result.value,keyboardValue,'keyboard/touch probes did not start from the same deterministic state');if([keyboardValue,keyboardEffect,result.value,result.effect].every(Number.isFinite))assert.equal(Math.sign(result.effect-result.value),Math.sign(keyboardEffect-keyboardValue),'keyboard/touch numeric effects moved in different directions for '+probe.action);else assert.deepEqual(result.effect,keyboardEffect,'keyboard/touch effects differ for '+probe.action);}}finally{await freshCtx.close();}
          assert.equal(probeEffects.length,0,'touch parity probe attempted side effects');await touch(p,ctx,probe);
        });
        await check('progress',async()=>{ await p.clock.runFor(200); const after=await snap(p); assert(progressChanged(progressBaseline,after),'reviewed keyboard/touch actions produced no score/progress change'); });
        await check('interaction',async()=>{ assert((await snap(p)).interactions>0,'no damage/collision/interaction'); });
        await capture('playing');
        await check('pause',async()=>{ await p.locator('[data-game-pause]').click(); const before=await snap(p); assert(before.paused); await p.clock.runFor(300); assert.deepEqual((await snap(p)).state,before.state,'paused simulation changed'); });
        await check('resume',async()=>{ const before=await snap(p); await p.locator('[data-game-resume]').click(); await p.clock.runFor(100); assert((await snap(p)).tick>before.tick); });
        await check('hidden',async()=>{ await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));}); const before=await snap(p); assert(before.paused,'hidden tab not paused'); await p.clock.runFor(500); assert.deepEqual((await snap(p)).state,before.state); await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}); await p.locator('[data-game-resume]').click(); });
        await check('overflow',async()=>{ const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth); assert(overflow<=policy.limits.overflow_px,'horizontal overflow '+overflow+'px'); });
        const cdp=await ctx.newCDPSession(p); const heapBefore=(await cdp.send('Runtime.getHeapUsage')).usedSize;
        await check('terminal',async()=>{
          let previous=(await snap(p)).tick;
          for(let ms=0;ms<manifest.qa.terminal_ms;ms+=500) {
            if((await snap(p)).phase==='finished') break;
            await p.clock.runFor(500); const s=await budget();
            if(!midCaptured&&ms>=Math.min(10000,Math.floor(manifest.qa.terminal_ms/2))){await capture('midgame');midCaptured=true;}
            assert(s.tick>previous||s.phase==='finished','loop freeze'); previous=s.tick;
          }
          assert.equal((await snap(p)).phase,'finished','terminal not reachable within declared bound');
        });
        await check('resources',async()=>{ await budget(); const heapAfter=(await cdp.send('Runtime.getHeapUsage')).usedSize; c.heap_growth=heapAfter-heapBefore; assert(c.heap_growth<=policy.limits.max_heap_growth_bytes,'runaway heap growth'); });
        await cdp.detach();
        const screenshot=`viewport-${width}.png`; await p.screenshot({path:path.join(outDir,screenshot),fullPage:true,animations:'disabled',timeout:5000}); report.screenshots.push(screenshot);
        await check('restart',async()=>{ const old=await snap(p); await p.locator('[data-game-restart]').click(); const s=await snap(p); assert.equal(s.phase,'playing'); assert(s.tick<old.tick); await p.clock.runFor(100); assert((await snap(p)).tick>s.tick); });
        await check('pagehide',async()=>{ await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))); const s=await snap(p); await p.clock.runFor(200); assert((await snap(p)).disposed); assert.deepEqual((await snap(p)).state,s.state); });
        await check('capture_no_writes',async()=>{ await sleep(30); assert.equal(effects.length,0,'capture attempted side effects'); assert.equal((await snap(p)).ranked,false); });
        c.passed=true;
      } catch(e) { fail(current==='real_clock'?'freeze':current==='assets'?'missing_assets':current,e.message,width); }
      finally {
        if(effects.length) { report.side_effects.push(...effects.map(e=>({...e,viewport:width}))); fail('production_side_effect','Attempted network or persistence effects were blocked/audited',width); }
        if(broken.length) fail('missing_assets',broken.join(','),width);
        await ctx.close(); save();
      }
    }
    if(report.console_errors.length) fail('console_error','Browser console errors',null);
    if(report.page_errors.length) fail('pageerror','Uncaught browser errors',null);
    if(hashTree(gameRoot)!==sourceHash) fail('source_tampered','Source changed during QA',null);
    report.passed=report.hard_failures.length===0&&report.browser_cases.every(c=>c.passed);
  } catch(e) { fail('qa_infrastructure',e.message,null); }
  finally { if(browser) await browser.close(); if(server) await server.close(); save(); }
  return report;
}
if(require.main===module) execute(readJSON(process.argv[2])).then(r=>{process.exitCode=r.passed?0:1;}).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={execute,progressChanged};
