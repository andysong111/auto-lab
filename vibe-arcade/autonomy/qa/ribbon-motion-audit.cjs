'use strict';
// Post-terminal, model-free investigation. It cannot mutate Factory state or candidate source.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs');
const {atomicJSON,readJSON,hashTree,hash}=require('../orchestrator/files.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function execute({manifest,gameRoot,outDir,policy}){
 fs.mkdirSync(outDir,{recursive:true});const started=Date.now(),r={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:hashTree(gameRoot),policy_hash:hash(policy),passed:false,hard_failures:[],soft_failures:[],console_errors:[],page_errors:[],browser_cases:[],screenshots:[],side_effects:[],duration_ms:0,scope:'Read-only audit of native media delivery versus virtual-clock-only assertions; no candidate/Factory/provider edits'};
 let server,browser;try{server=await serve(gameRoot);browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const seed of [1,7,23,89,2026,4294967295]){
  const effects=[],ctx=await browser.newContext({viewport:{width:seed%2?1280:390,height:seed%2?800:844},serviceWorkers:'block'});await installGuard(ctx,server.origin,effects);
  await ctx.addInitScript(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),events=[];q.addEventListener('change',e=>events.push({matches:e.matches}));globalThis.__nativeMotionEvidence=()=>({matches:q.matches,events:[...events]});});
  const p=await ctx.newPage();p.setDefaultTimeout(2500);p.on('pageerror',e=>r.page_errors.push({seed,message:e.message}));p.on('console',m=>{if(m.type()==='error')r.console_errors.push({seed,message:m.text()});});await p.clock.install();const c={seed,transitions:[],passed:false};r.browser_cases.push(c);
  const snapshot=()=>p.evaluate(()=>({native:__nativeMotionEvidence(),dom:document.documentElement.dataset.reducedMotion,presentation:RibbonPresentation.snapshot(),tick:GameDiagnostics.snapshot().tick}));
  try{await p.emulateMedia({reducedMotion:'no-preference'});await p.goto(server.origin+`/?qa=1&capture=1&seed=${seed}`);await p.waitForFunction(()=>!!globalThis.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));await p.locator('[data-game-start]').click();await p.clock.runFor(100);
   for(const requested of [true,false,true,false,true,false]){
    await p.keyboard.down('Space');await p.clock.runFor(40);await p.keyboard.up('Space');
    const before=await snapshot(),t=Date.now();await p.emulateMedia({reducedMotion:requested?'reduce':'no-preference'});await p.clock.runFor(100);const immediate=await snapshot();
    const consistent=s=>s.native.matches===requested&&s.dom===String(requested)&&s.presentation.reducedMotion===requested&&(!requested||s.presentation.particles===0);
    let settled=immediate;for(let polls=0;!consistent(settled)&&polls<40;polls++){await sleep(20);await p.clock.runFor(20);settled=await snapshot();}
    const evidence={requested,before,after_virtual_100ms:immediate,immediate_consistent:consistent(immediate),after_native_delivery:settled,settled_consistent:consistent(settled),wall_ms:Date.now()-t};c.transitions.push(evidence);
    assert(consistent(settled),'native/preference/presentation do not converge within bounded800ms');assert.equal(settled.presentation.activeVoices,0);assert(settled.presentation.particles<=32);
   }c.passed=true;
  }catch(e){r.hard_failures.push({code:'motion_audit',message:e.message,seed});}finally{await ctx.close();if(effects.length){r.side_effects.push(...effects);r.hard_failures.push({code:'production_side_effect',message:'audit side effect',seed});}}
 }
 if(r.console_errors.length||r.page_errors.length)r.hard_failures.push({code:'browser_error',message:'audit browser errors'});assert.equal(hashTree(gameRoot),r.source_hash);r.passed=!r.hard_failures.length&&r.browser_cases.every(c=>c.passed);
 }catch(e){r.hard_failures.push({code:'qa_infrastructure',message:e.message});}finally{if(browser)await browser.close();if(server)await server.close();r.duration_ms=Date.now()-started;atomicJSON(path.join(outDir,'qa.json'),r);}return r;
}
if(require.main===module)execute(readJSON(process.argv[2])).then(r=>process.exitCode=r.passed?0:1).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={execute};
