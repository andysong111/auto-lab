'use strict';
// Trusted independent oracle. Candidate code is loaded only by Chromium inside Docker.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs');
const {atomicJSON,readJSON,hashTree,hash}=require('../orchestrator/files.cjs');
const {overlaps,presentationProbe}=require('./presentation-probe.cjs');
const {setReducedMotionAndWait}=require('./media-settlement.cjs');
const seeds=[1,7,23,89,2026,4294967295],target=[0,1,2,3,4,5,6,7,8];
function shift(board,op){const out=[...board],cells=op<3?[op*3,op*3+1,op*3+2]:[op-3,op,op+3];for(let i=0;i<3;i++)out[cells[(i+1)%3]]=board[cells[i]];return out;}
function oracle(maxDepth=4){const map=new Map([[target.join(','),[]]]),queue=[target];for(let i=0;i<queue.length;i++){const b=queue[i],solution=map.get(b.join(','));if(solution.length===maxDepth)continue;for(let op=0;op<6;op++){const pred=shift(shift(b,op),op),key=pred.join(',');if(!map.has(key)){map.set(key,[op,...solution]);queue.push(pred);}}}return map;}
const solutions=oracle();
function solve(state){assert.equal(state.board?.length,9,'observable board missing');assert.deepEqual([...state.board].sort((a,b)=>a-b),target,'invalid tile permutation');const solution=solutions.get(state.board.join(','));assert(solution,'board has no solution within contracted depth4');return {solution,required_actions:solution.length,axes:[...new Set(solution.map(x=>x<3?'row':'column'))],displaced_tiles:state.board.filter((x,i)=>x!==i).length};}
async function press(p,key){await p.keyboard.down(key);await p.clock.runFor(40);await p.keyboard.up(key);await p.clock.runFor(40);}
async function activate(p,ctx,mobile,op){
 if(mobile){const b=await p.locator('[data-game-canvas]').boundingBox(),x=op<3?.88:.18+(op-3)*.24,y=op<3?.22+op*.24:.90,cdp=await ctx.newCDPSession(p);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*x,y:b.y+b.height*y}]});await p.clock.runFor(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.clock.runFor(100);}finally{await cdp.detach();}}
 else{for(let i=0;i<6&&(await p.evaluate(()=>GameDiagnostics.snapshot().state.cursor))!==op;i++)await press(p,'ArrowRight');assert.equal(await p.evaluate(()=>GameDiagnostics.snapshot().state.cursor),op,'keyboard handle unreachable');await press(p,'Space');await p.clock.runFor(100);}
}
async function execute({manifest,gameRoot,outDir,policy}){
 assert.equal(manifest.game_id,'GAME-20260922-131');fs.mkdirSync(outDir,{recursive:true});const started=Date.now();
 const r={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:hashTree(gameRoot),policy_hash:hash(policy),passed:false,hard_failures:[],soft_failures:[],console_errors:[],page_errors:[],side_effects:[],browser_cases:[],screenshots:[],duration_ms:0,scope:'Independent reverse-BFS shortest paths, actual keyboard/CDP touch, no game-state injection; public-quality evidence is not a fun score'};
 const fail=(code,message,seed)=>r.hard_failures.push({code,message:String(message).slice(0,1400),seed}),save=()=>{r.duration_ms=Date.now()-started;atomicJSON(path.join(outDir,'qa.json'),r);};let server,browser;
 try{
  server=await serve(gameRoot);browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(let n=0;n<seeds.length;n++){
   const seed=seeds[n],[width,height]=[[390,844],[768,1024],[390,844],[1280,800],[390,844],[1280,800]][n],mobile=width<600,effects=[],record=seed===23;
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:mobile,serviceWorkers:'block',...(record?{recordVideo:{dir:outDir,size:{width,height}}}:{})});await installGuard(ctx,server.origin,effects);await presentationProbe(ctx);const p=await ctx.newPage();p.setDefaultTimeout(1500);p.setDefaultNavigationTimeout(5000);await p.clock.install();
   const c={seed,viewport:{width,height},checks:[],boards:[],goal_progress:[0],input_method:mobile?'CDP touch':'keyboard',state_injection:false,passed:false};r.browser_cases.push(c);
   p.on('console',m=>{if(m.type()==='error')r.console_errors.push({seed,message:m.text()});});p.on('pageerror',e=>r.page_errors.push({seed,message:e.message}));const snap=()=>p.evaluate(()=>GameDiagnostics.snapshot());
   const check=async(code,fn)=>{try{await fn();c.checks.push(code);}catch(e){fail(code,e.message,seed);}};
   const shot=async phase=>{if(seed!==23&&seed!==89)return;const name=`viewport-${width}-${phase}.png`;await p.screenshot({path:path.join(outDir,name),fullPage:true,animations:'disabled',timeout:5000});r.screenshots.push(name);};
   const readable=async phase=>{const labels=await p.evaluate(()=>__factoryText()),conflicts=overlaps(labels);(c.text_evidence||=[]).push({phase,labels,conflicts});assert.equal(conflicts.length,0,`canvas label overlaps: ${JSON.stringify(conflicts.slice(0,6))}`);assert(!labels.some(x=>x.font_px<11.5),'canvas label below12CSSpx');assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1,'horizontal overflow');const b=await p.locator('[data-game-canvas]').boundingBox();if(width===390)assert(b.width>=300,'mobile board too small');};
   try{
    await p.goto(server.origin+`/?qa=1&capture=1&seed=${seed}`);await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
    await check('product_goal',async()=>{assert.match(await p.locator('body').innerText(),/RESTORE\s+3\s+MOSAICS/i);assert(await p.locator('[data-ribbon-goal-progress]').isVisible());assert.match(await p.locator('[data-ribbon-goal-progress]').innerText(),/0\s*\/\s*3/);});
    await check('product_best',async()=>{assert(await p.locator('[data-ribbon-best]').isVisible());assert.equal(Number(await p.locator('[data-ribbon-best]').innerText()),(await snap()).best);const body=await p.locator('body').innerText();for(const label of ['CURRENT SCORE','DEVICE BEST','LOCAL PRACTICE'])assert(body.includes(label),'missing '+label);});
    await check('product_readability',()=>readable('entry'));await shot('entry');await p.locator('[data-game-start]').click();await p.clock.runFor(100);
    // Check early defects independently, even when a later board cannot be solved.
    await check('product_reduced_motion',async()=>{for(const reduced of [true,false]){const transition=await setReducedMotionAndWait(p,reduced);(c.motion_evidence||=[]).push({requested:reduced,...transition});assert.equal(await p.locator('html').getAttribute('data-reduced-motion'),String(reduced));const view=await p.evaluate(()=>globalThis.RibbonPresentation?.snapshot());assert.equal(view?.reducedMotion,reduced);assert.equal(view.activeVoices,0);assert(view.particles>=0&&view.particles<=32);if(reduced){assert.equal(view.particles,0);assert.equal(await p.locator('*').evaluateAll(ns=>ns.filter(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&parseFloat(s.animationDuration)>.01;}).length),0);}}});
    await check('product_readability',()=>readable('playing'));await shot('playing');
    for(let stage=0;stage<3;stage++){
     const before=await snap();assert.equal(before.state.stage,stage);assert.equal(before.state.solved,stage);const plan=solve(before.state);c.boards.push({stage,initial_board:before.state.board,...plan});
     await check('product_depth',async()=>{assert.equal(plan.required_actions,stage+2,'minimum solution length differs from2/3/4');assert.equal(plan.axes.length,2,'shortest solution does not require both row and column decisions');});
     for(let i=0;i<plan.solution.length;i++){const prev=await snap(),expected=shift(prev.state.board,plan.solution[i]);await activate(p,ctx,mobile,plan.solution[i]);const after=await snap();assert.equal(after.state.moves,prev.state.moves+1,'normal action not counted exactly once');if(i<plan.solution.length-1)assert.deepEqual(after.state.board,expected,'strip shift changed wrong tiles');}
     for(let k=0;k<12&&(await snap()).state.solved===stage;k++)await p.clock.runFor(100);
     const after=await snap();assert.equal(after.state.solved,stage+1,'correct board not restored');assert(after.score>before.score,'restoration has no actual score');c.boards[stage].actual_actions=after.state.moves-before.state.moves;c.goal_progress.push(after.state.solved);
     await check('product_progress',async()=>assert.match(await p.locator('[data-ribbon-goal-progress]').innerText(),new RegExp(`${stage+1}\\s*\\/\\s*3`)));
     await check('product_readability',()=>readable('restored-'+(stage+1)));if(stage===0)await shot('midgame');if(stage===1)await shot('progress');
     if(stage<2)for(let k=0;k<12&&(await snap()).state.stage===stage;k++)await p.clock.runFor(100);
    }
    for(let k=0;k<95&&(await snap()).phase!=='finished';k++)await p.clock.runFor(500);const end=await snap();assert.equal(end.phase,'finished');assert.equal(end.state.outcome,'complete');assert(end.tick>=900&&end.tick<=2705);c.terminal={tick:end.tick,score:end.score,best:end.best};
    await check('product_result',async()=>{assert(await p.locator('[data-ribbon-result]').isVisible());assert.match(await p.locator('[data-ribbon-result]').innerText(),/MOSAICS RESTORED/i);assert((await p.locator('[data-ribbon-detail]').innerText()).length>12);assert.equal(Number(await p.locator('[data-ribbon-best]').innerText()),end.best);assert(end.best>=end.score&&end.score>0);assert(await p.locator('[data-game-restart]').isVisible());});await check('product_readability',()=>readable('success'));await shot('success');
    await p.locator('[data-game-restart]').click();await p.clock.runFor(100);await check('product_replay_best',async()=>{const s=await snap();assert.equal(s.phase,'playing');assert.equal(s.state.solved,0);assert.equal(s.best,end.best);assert.equal(Number(await p.locator('[data-ribbon-best]').innerText()),end.best);});
    if(seed===23){for(let k=0;k<95&&(await snap()).phase!=='finished';k++)await p.clock.runFor(500);await check('product_failure',async()=>{assert.equal((await snap()).phase,'finished');assert.equal((await snap()).state.outcome,'failure');assert.match(await p.locator('[data-ribbon-result]').innerText(),/TIME UP/i);});await check('product_readability',()=>readable('failure'));await shot('failure');}
    c.passed=!r.hard_failures.some(x=>x.seed===seed);
   }catch(e){fail('product_playthrough',e.message,seed);await shot('failure').catch(()=>{});}
   finally{if(effects.length){r.side_effects.push(...effects.map(e=>({...e,seed})));fail('production_side_effect','capture network/persistence attempted',seed);}const video=record?p.video():null;await ctx.close();if(video){const name='viewport-390-playthrough.webm';fs.renameSync(await video.path(),path.join(outDir,name));r.capture={file:name,kind:'Accelerated normal-input QA capture, not human speed'};}save();}
  }
  // A separate fresh no-account practice origin proves actual GameKit best persistence.
  {
   const effects=[],ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await installGuard(ctx,server.origin,effects);const p=await ctx.newPage();p.setDefaultTimeout(1500);await p.clock.install();
   p.on('pageerror',e=>r.page_errors.push({mode:'practice',message:e.message}));p.on('console',m=>{if(m.type()==='error')r.console_errors.push({mode:'practice',message:m.text()});});
   const snap=()=>p.evaluate(()=>GameDiagnostics.snapshot()),key=`playjolt_practice_${manifest.game_id}_${manifest.version}`;
   try{await p.emulateMedia({reducedMotion:'reduce'});await p.goto(server.origin+'/?seed=314159');await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));assert.equal(await p.locator('html').getAttribute('data-reduced-motion'),'true');await p.locator('[data-game-start]').click();await p.clock.runFor(100);
    for(let stage=0;stage<3;stage++){const plan=solve((await snap()).state);for(const op of plan.solution)await activate(p,ctx,true,op);for(let k=0;k<12&&(await snap()).state.stage===stage&&stage<2;k++)await p.clock.runFor(100);}
    for(let k=0;k<95&&(await snap()).phase!=='finished';k++)await p.clock.runFor(500);const end=await snap();assert.equal(end.state.solved,3);assert(end.best>0);await p.locator('[data-game-restart]').click();await p.clock.runFor(100);assert.equal(Number(await p.locator('[data-ribbon-best]').innerText()),end.best);await p.reload();await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.runFor(100);assert.equal(Number(await p.locator('[data-ribbon-best]').innerText()),end.best);assert(effects.length>0&&effects.every(e=>e.kind==='storage'&&e.key===key));r.practice_record={passed:true,best:end.best,key,writes:effects.length,restart_retained:true,reload_retained:true,reduced_motion_on_load:true};
   }catch(e){fail('product_practice_best',e.message,null);}finally{for(const e of effects)if(e.kind!=='storage'||e.key!==key){r.side_effects.push(e);fail('production_side_effect','unexpected practice side effect',null);}await ctx.close();}
  }
  const sequences=r.browser_cases.filter(c=>c.boards.length===3).map(c=>JSON.stringify(c.boards.map(b=>b.initial_board)));if(sequences.length===6&&new Set(sequences).size<4)fail('product_seed_diversity','fewer than4distinct sequences',null);
  if(r.console_errors.length)fail('console_error','product console errors',null);if(r.page_errors.length)fail('pageerror','product page errors',null);if(hashTree(gameRoot)!==r.source_hash)fail('source_tampered','source changed',null);
  r.passed=!r.hard_failures.length&&r.browser_cases.length===6&&r.browser_cases.every(c=>c.passed)&&r.practice_record?.passed===true;
 }catch(e){fail('qa_infrastructure',e.message,null);}finally{if(browser)await browser.close();if(server)await server.close();save();}return r;
}
if(require.main===module)execute(readJSON(process.argv[2])).then(r=>process.exitCode=r.passed?0:1).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={execute,shift,solve,oracle,seeds};
