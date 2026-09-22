'use strict';
// Trusted, opt-in commissioning tests. Candidate code executes only in the Docker browser.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs');
const {atomicJSON,hashTree,hash}=require('../orchestrator/files.cjs');
const contract=require('./prism-polish-contract.json');
const seeds=[1,7,23,89,2026,4294967295];
function plan(s){
  assert.equal(s.board.length,12,'expected original 4x3 routing board');let best=null;
  const gates=s.gates||[];
  function visit(x,row,steps,cost){
    if(x===4){if(row===s.target&&(!best||cost<best.cost))best={steps,cost};return;}
    if(gates.some(g=>g.x===x&&g.y!==row))return;
    for(const outlet of [-1,0,1]){
      const next=row+outlet;if(next<0||next>2)continue;
      const turns=(outlet-s.board[row*4+x].outlet+3)%3;
      visit(x+1,next,[...steps,{x,y:row,turns,outlet}],cost+turns);
    }
  }
  visit(0,1,[],0);assert(best,'impossible board: no valid route');return best;
}
async function audioProbe(ctx){
  await ctx.addInitScript(()=>{
    const active=new Set(),stats={contexts:0,started:0,ended:0,peak:0,frequencies:[],scheduled_frequencies:[]};
    Object.defineProperty(window,'__polishAudio',{value:()=>({...stats,active:active.size})});
    const Native=window.AudioContext;if(!Native)return;
    class ObservedAudio extends Native {
      constructor(...args){super(...args);stats.contexts++;}
      createOscillator(){const o=super.createOscillator(),start=o.start.bind(o),disconnect=o.disconnect.bind(o);
        const schedule=o.frequency.setValueAtTime.bind(o.frequency);o.frequency.setValueAtTime=(value,at)=>{stats.scheduled_frequencies.push({value,at});return schedule(value,at);};
        o.start=(...args)=>{active.add(o);stats.started++;stats.peak=Math.max(stats.peak,active.size);stats.frequencies.push(o.frequency.value);return start(...args);};
        o.addEventListener('ended',()=>{active.delete(o);stats.ended++;});
        o.disconnect=(...args)=>{active.delete(o);return disconnect(...args);};return o;
      }
    }
    window.AudioContext=ObservedAudio;
  });
}
async function press(page,k){await page.keyboard.down(k);await page.clock.runFor(40);await page.keyboard.up(k);await page.clock.runFor(40);}
async function rotate(page,ctx,mobile,x,y){
  if(mobile){const b=await page.locator('[data-game-canvas]').boundingBox(),cdp=await ctx.newCDPSession(page);
    try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*(.08+(x+.5)*.84/4),y:b.y+b.height*(.23+(y+.5)*.52/3)}]});await page.clock.runFor(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(60);}finally{await cdp.detach();}
  }else{const c=await page.evaluate(()=>GameDiagnostics.snapshot().state.cursor);
    for(let n=0;n<Math.abs(x-c.x);n++)await press(page,x>c.x?'ArrowRight':'ArrowLeft');
    for(let n=0;n<Math.abs(y-c.y);n++)await press(page,y>c.y?'ArrowDown':'ArrowUp');await press(page,'Space');}
}
async function execute(config){
 const {manifest,gameRoot,outDir,policy}=config;
 assert.equal(manifest.game_id,'GAME-20260922-110','polish is scoped to existing Prism Relay');
 fs.mkdirSync(outDir,{recursive:true});const started=Date.now();
 const report={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:hashTree(gameRoot),policy_hash:hash(policy),passed:false,hard_failures:[],soft_failures:[],console_errors:[],page_errors:[],browser_cases:[],screenshots:[],side_effects:[],duration_ms:0,commissioning_contract:contract,scope:'Independent shortest-route oracle plus real browser inputs; no fun/retention claim'};
 let browser,server;const save=()=>{report.duration_ms=Date.now()-started;atomicJSON(path.join(outDir,'qa.json'),report);};
 const fail=(code,message,seed)=>report.hard_failures.push({code,message:String(message).slice(0,1500),seed});
 try{
  server=await serve(gameRoot);browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const dimensions=[[390,844],[768,1024],[390,844],[1280,800],[390,844],[1280,800]];
  for(let index=0;index<seeds.length;index++){
   const seed=seeds[index],[width,height]=dimensions[index],mobile=width<600,effects=[],record=seed===23;
   const c={seed,viewport:{width,height},checks:[],boards:[],receiver_progress:[0],input_method:mobile?'CDP touch':'keyboard',state_injection:false,passed:false};report.browser_cases.push(c);
   const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:true,serviceWorkers:'block',...(record?{recordVideo:{dir:outDir,size:{width,height}}}:{})});
   await installGuard(ctx,server.origin,effects);await audioProbe(ctx);const p=await ctx.newPage();p.setDefaultTimeout(1800);
   await p.clock.install();
   p.on('pageerror',e=>report.page_errors.push({seed,message:e.message}));p.on('console',m=>{if(m.type()==='error')report.console_errors.push({seed,message:m.text()});});
   const snap=()=>p.evaluate(()=>GameDiagnostics.snapshot());
   const check=async(name,fn)=>{try{await fn();c.checks.push(name);}catch(e){fail(name,e.message,seed);}};
   const capture=async name=>{if(seed!==23&&seed!==89)return;const file=`viewport-${width}-${name}.png`;await p.screenshot({path:path.join(outDir,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);};
   try{
    await p.goto(server.origin+'/?qa=1&capture=1&seed='+seed);await p.waitForFunction(()=>!!window.GameDiagnostics);
    await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
    await check('polish_goal',async()=>{assert.match(await p.locator('body').innerText(),/LIGHT\s+3\s+RECEIVERS/i);assert(await p.locator('[data-prism-receivers]').isVisible());assert.match(await p.locator('[data-prism-receivers]').innerText(),/0\s*\/\s*3/);});
    await check('polish_best',async()=>{assert(await p.locator('[data-prism-best]').isVisible());assert.match(await p.locator('body').innerText(),/DEVICE BEST|BEST SCORE/i);assert.match(await p.locator('body').innerText(),/LOCAL PRACTICE/i);});
    await capture('entry');await p.locator('[data-game-start]').click();await p.clock.runFor(100);
    for(let stage=0;stage<3;stage++){
     const before=await snap(),solution=plan(before.state),target=before.state.target;
     c.boards.push({stage:stage+1,required_rotations:solution.cost,changed_prisms:solution.steps.filter(s=>s.turns).length,target,gates:before.state.gates||[],board:before.state.board,solution:solution.steps});
     await check('polish_depth',async()=>{assert(solution.cost>=[2,4,6][stage],`stage ${stage+1}: shortest solution ${solution.cost}, required >=${[2,4,6][stage]}; count ALL alternative routes, not scrambled tiles`);if(stage)assert(solution.cost>c.boards[stage-1].required_rotations,'later board not more complex');assert(solution.steps.filter(s=>s.turns).length>=(stage?2:1),'too few meaningful prism changes');});
     for(const step of solution.steps){for(let n=0;n<step.turns;n++){if((await snap()).state.circuits!==stage)break;await rotate(p,ctx,mobile,step.x,step.y);}}
     // Stay under timeout, but allow deliberate short charge/celebration transitions.
     for(let n=0;n<16&&(await snap()).state.circuits===stage;n++)await p.clock.runFor(100);
     const after=await snap();assert.equal(after.state.circuits,stage+1,'normal input solution did not charge next receiver');assert(after.score>before.score,'receiver did not score');
     c.receiver_progress.push(after.state.circuits);c.boards[stage].actual_rotations=after.state.rotations-before.state.rotations;c.boards[stage].tick=after.tick;
     await check('polish_progress',async()=>{assert.match(await p.locator('[data-prism-receivers]').innerText(),new RegExp((stage+1)+'\\s*\\/\\s*3'));});
     if(stage===0)await capture('midgame');if(stage===1)await capture('charged');
    }
    await check('polish_receiver_targets',async()=>assert.equal(new Set(c.boards.map(b=>b.target)).size,3,'three receivers must be distinct'));
    for(let i=0;i<95&&(await snap()).phase!=='finished';i++)await p.clock.runFor(500);
    const end=await snap();assert.equal(end.phase,'finished');assert(end.tick>=900&&end.tick<=3600,'session outside 15-60s');assert.equal(end.state.circuits,3);c.terminal={tick:end.tick,score:end.score,best:end.best};
    await check('polish_result',async()=>{assert.match(await p.locator('[data-prism-result]').innerText(),/RELAY COMPLETE/i);assert.equal(Number(await p.locator('[data-prism-best]').innerText()),end.best);assert(end.best>=end.score);});
    await capture('success');c.audio=await p.evaluate(()=>__polishAudio());c.feedback=await p.evaluate(()=>globalThis.PrismRelayFeedback?.snapshot()||null);
    if(seed===23){
     await check('polish_audio',async()=>{
      const button=p.locator('[data-prism-sound]');assert(await button.isVisible());assert.equal(await button.getAttribute('aria-pressed'),'true');
      assert(c.audio.started>5,'no real WebAudio event feedback');assert(c.audio.peak<=8,'more than 8 simultaneous voices');assert(c.audio.contexts<=1,'AudioContext leak');assert(new Set(c.audio.scheduled_frequencies.map(f=>f.value)).size>=3,'feedback pitches indistinguishable');
      await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');await p.locator('[data-game-restart]').click();await p.clock.runFor(100);
      const muted=await p.evaluate(()=>__polishAudio());await rotate(p,ctx,mobile,0,1);await p.clock.runFor(100);assert.equal((await p.evaluate(()=>__polishAudio())).started,muted.started,'mute still starts voices');
      await button.click();await p.clock.runFor(50);await rotate(p,ctx,mobile,0,1);await p.clock.runFor(100);assert((await p.evaluate(()=>__polishAudio())).started>muted.started,'unmute never restores real oscillator');
      await p.locator('[data-game-pause]').click();await new Promise(r=>setTimeout(r,650));const paused=await p.evaluate(()=>__polishAudio());assert.equal(paused.active,0,'voices not cleaned on pause');await p.locator('[data-game-resume]').click();
     });
     // Audio check may have restarted the game; no direct state injection.
     if((await snap()).phase==='finished')await p.locator('[data-game-restart]').click();
     await check('polish_best_restart',async()=>{await p.clock.runFor(100);assert.equal((await snap()).best,end.best);assert.equal(Number(await p.locator('[data-prism-best]').innerText()),end.best);});
     await p.emulateMedia({reducedMotion:'reduce'});await p.clock.runFor(100);
     await check('polish_reduced_motion',async()=>{assert(await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));const feedback=await p.evaluate(()=>globalThis.PrismRelayFeedback?.snapshot());assert(feedback?.reducedMotion===true,'no reduced-motion presentation evidence');const motion=await p.locator('*').evaluateAll(ns=>ns.filter(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&parseFloat(s.animationDuration)>.01;}).length);assert.equal(motion,0,'CSS continues nonessential animation under reduced motion');});
     c.reduced_motion={system_requested:await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),presentation:await p.evaluate(()=>globalThis.PrismRelayFeedback?.snapshot()||null)};
     await capture('reduced');
     for(let i=0;i<100&&(await snap()).phase!=='finished';i++)await p.clock.runFor(500);
     await check('polish_failure',async()=>{assert.equal((await snap()).phase,'finished');assert.match(await p.locator('[data-prism-result]').innerText(),/RELAY INCOMPLETE/i);});await capture('failure');c.feedback_after_failure=await p.evaluate(()=>globalThis.PrismRelayFeedback?.snapshot()||null);c.audio_after=await p.evaluate(()=>__polishAudio());
    }
    await check('polish_overflow',async()=>assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1));
    c.passed=!report.hard_failures.some(f=>f.seed===seed);
   }catch(e){fail('polish_playthrough',e.message,seed);}
   finally{if(effects.length){report.side_effects.push(...effects);fail('production_side_effect','Polish capture attempted network or record writes',seed);}const video=record?p.video():null;await ctx.close();if(video){const file='viewport-390-playthrough.webm';fs.renameSync(await video.path(),path.join(outDir,file));report.capture={file,kind:'accelerated normal-input diagnostic capture, not human play'};}save();}
  }
  // Independently test local practice even when another polish gate fails.
  {
   const effects=[],ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
   await installGuard(ctx,server.origin,effects);const p=await ctx.newPage();await p.clock.install();
   p.on('pageerror',e=>report.page_errors.push({mode:'practice',message:e.message}));p.on('console',m=>{if(m.type()==='error')report.console_errors.push({mode:'practice',message:m.text()});});
   try{
    await p.goto(server.origin+'/?seed=314159');await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));await p.locator('[data-game-start]').click();await p.clock.runFor(100);
    for(let stage=0;stage<3;stage++){const s=await p.evaluate(()=>GameDiagnostics.snapshot());for(const step of plan(s.state).steps)for(let n=0;n<step.turns;n++)await rotate(p,ctx,true,step.x,step.y);await p.clock.runFor(1100);}
    for(let i=0;i<100&&(await p.evaluate(()=>GameDiagnostics.snapshot().phase))!=='finished';i++)await p.clock.runFor(500);
    const end=await p.evaluate(()=>GameDiagnostics.snapshot());assert.equal(end.state.circuits,3);assert(end.best>0);await p.locator('[data-game-restart]').click();await p.clock.runFor(100);assert.equal(Number(await p.locator('[data-prism-best]').innerText()),end.best);
    await p.reload();await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.runFor(100);const loaded=await p.evaluate(()=>GameDiagnostics.snapshot());assert.equal(loaded.best,end.best);assert.equal(Number(await p.locator('[data-prism-best]').innerText()),end.best);
    const key=`playjolt_practice_${manifest.game_id}_${manifest.version}`;assert(effects.length>0);assert(effects.every(e=>e.kind==='storage'&&e.key===key),'practice wrote outside GameKit local record');
    await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.runFor(100);
    report.reduced_motion_on_load=await p.evaluate(()=>({system:matchMedia('(prefers-reduced-motion: reduce)').matches,presentation:globalThis.PrismRelayFeedback?.snapshot()||null}));
    report.practice_record={passed:true,best:end.best,restart_retained:true,reload_retained:true,key,writes:effects.length,scope:'disposable browser-local practice storage only; capture contexts made zero writes'};
   }catch(e){fail('polish_practice_best',e.message,null);for(const e of effects)if(e.kind!=='storage'||e.key!==`playjolt_practice_${manifest.game_id}_${manifest.version}`){report.side_effects.push(e);fail('production_side_effect','Unexpected practice side effect',null);}}
   finally{await ctx.close();}
  }
  if(report.page_errors.length)fail('pageerror','Uncaught polish browser errors',null);if(report.console_errors.length)fail('console_error','Polish browser console errors',null);
  if(hashTree(gameRoot)!==report.source_hash)fail('source_tampered','Source changed during polish QA',null);
  report.passed=!report.hard_failures.length&&report.browser_cases.length===seeds.length&&report.browser_cases.every(c=>c.passed)&&report.practice_record?.passed===true;
 }catch(e){fail('qa_infrastructure',e.message,null);}finally{if(browser)await browser.close();if(server)await server.close();save();}
 return report;
}
module.exports={execute,plan,seeds,audioProbe};
