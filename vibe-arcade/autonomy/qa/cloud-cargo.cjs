'use strict';
// Trusted commissioning QA. Generated game code runs only inside the Docker Chromium process.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs');
const {atomicJSON,hashTree,hash}=require('../orchestrator/files.cjs');
const seeds=[1,7,23,89,2026,4294967295];
function solve(s){
 assert(Array.isArray(s.cards)&&Array.isArray(s.bays),'missing observable cargo/bay arrays');
 assert.equal(s.cards.length,[4,5,6][s.stage],'4/5/6 cargo progression');assert.equal(s.bays.length,s.stage===0?2:3);
 for(const c of s.cards){assert(Number.isInteger(c.mass)&&c.mass>=1&&c.mass<=5);assert(Number.isInteger(c.energy)&&c.energy>=0&&c.energy<=3);assert.equal(c.bay,-1,'new board must need actual allocation');}
 for(const b of s.bays){assert(Number.isInteger(b.mass)&&b.mass>0);if(s.stage)assert(Number.isInteger(b.energy)&&b.energy>=0);else assert.equal(b.energy,null);}
 const totals=s.bays.map(()=>({mass:0,energy:0}));let solution=null,massSolutions=0,fullSolutions=0,nodes=0;
 function visit(i,assignment){nodes++;if(i===s.cards.length){if(!totals.every((x,k)=>x.mass===s.bays[k].mass))return;massSolutions++;if(totals.every((x,k)=>s.bays[k].energy===null||x.energy===s.bays[k].energy)){fullSolutions++;solution||=[...assignment];}return;}
  for(let k=0;k<s.bays.length;k++){const c=s.cards[i];totals[k].mass+=c.mass;totals[k].energy+=c.energy;visit(i+1,[...assignment,k]);totals[k].mass-=c.mass;totals[k].energy-=c.energy;}}
 visit(0,[]);assert(solution,'no full valid cargo allocation exists');
 return {solution,required_assignments:s.cards.length,mass_solutions:massSolutions,full_solutions:fullSolutions,extra_constraint_exclusions:massSolutions-fullSolutions,enumerated_nodes:nodes};
}
function overlaps(labels){const bad=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(a.text===b.text)continue;const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>1&&h>1&&w*h/Math.min((a.right-a.left)*(a.bottom-a.top),(b.right-b.left)*(b.bottom-b.top))>.25)bad.push({a:a.text,b:b.text});}return bad;}
async function presentationProbe(ctx){await ctx.addInitScript(()=>{
 const c=CanvasRenderingContext2D.prototype,fill=c.fillText,clear=c.clearRect,rect=c.fillRect;let labels=[];
 Object.defineProperty(window,'__cargoText',{value:()=>labels.slice(-100)});
 function reset(x,y,w,h){if(x<=0&&y<=0&&w>=this.canvas.width*.95&&h>=this.canvas.height*.95)labels=[];}
 c.clearRect=function(...a){reset.apply(this,a);return clear.apply(this,a);};c.fillRect=function(...a){reset.apply(this,a);return rect.apply(this,a);};
 c.fillText=function(text,x,y,maxWidth){const m=this.measureText(String(text)),t=this.getTransform(),scale=this.canvas.getBoundingClientRect().width/this.canvas.width;
  let width=Math.min(m.width,maxWidth||Infinity),left=x;if(this.textAlign==='center')left-=width/2;else if(this.textAlign==='right'||this.textAlign==='end')left-=width;
  const fontSize=Number(this.font.match(/([0-9.]+)px/)?.[1]||0),ascent=m.actualBoundingBoxAscent||fontSize*.8,descent=m.actualBoundingBoxDescent||2;
  const point=(px,py)=>({x:(t.a*px+t.c*py+t.e)*scale,y:(t.b*px+t.d*py+t.f)*scale}),a=point(left,y-ascent),b=point(left+width,y+descent);
  if(String(text).trim()&&this.globalAlpha>.3)labels.push({text:String(text),left:a.x,right:b.x,top:a.y,bottom:b.y,font_px:fontSize*Math.abs(t.a)*scale});
  return fill.apply(this,arguments);};
});}
async function press(p,key){await p.keyboard.down(key);await p.clock.runFor(35);await p.keyboard.up(key);await p.clock.runFor(35);}
async function activate(p,ctx,mobile,type,index){
 if(mobile){const s=await p.evaluate(()=>GameDiagnostics.snapshot().state),b=await p.locator('[data-game-canvas]').boundingBox();const x=type==='card'?(index%3+.5)/3:(index+.5)/s.bays.length,y=type==='card'?.55+Math.floor(index/3)*.25:.25;const cdp=await ctx.newCDPSession(p);
  try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*x,y:b.y+b.height*y}]});await p.clock.runFor(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.clock.runFor(40);}finally{await cdp.detach();}
 }else{const s=await p.evaluate(()=>GameDiagnostics.snapshot().state),target=type==='card'?index:s.cards.length+index;for(let i=0;i<s.cards.length+s.bays.length+2;i++){if((await p.evaluate(()=>GameDiagnostics.snapshot().state.focus))===target)break;await press(p,'ArrowRight');}assert.equal(await p.evaluate(()=>GameDiagnostics.snapshot().state.focus),target,'keyboard cannot reach actual card/bay focus');await press(p,'Space');}
}
async function execute(config){
 const {manifest,gameRoot,outDir,policy}=config;assert.equal(manifest.game_id,'GAME-20260922-121');fs.mkdirSync(outDir,{recursive:true});const began=Date.now();
 const r={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:hashTree(gameRoot),policy_hash:hash(policy),passed:false,hard_failures:[],soft_failures:[],console_errors:[],page_errors:[],side_effects:[],browser_cases:[],screenshots:[],duration_ms:0,scope:'Normal keyboard/CDP touch with independent exhaustive cargo allocation, never injected game state; no fun score'};
 const fail=(code,message,seed)=>r.hard_failures.push({code,message:String(message).slice(0,1400),seed});const save=()=>{r.duration_ms=Date.now()-began;atomicJSON(path.join(outDir,'qa.json'),r);};let server,browser;
 try{
 server=await serve(gameRoot);browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(let n=0;n<seeds.length;n++){
  const seed=seeds[n],[width,height]=[[390,844],[768,1024],[390,844],[1280,800],[390,844],[1280,800]][n],mobile=width<600,effects=[],record=seed===23;
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:mobile,serviceWorkers:'block',...(record?{recordVideo:{dir:outDir,size:{width,height}}}:{})});await installGuard(ctx,server.origin,effects);await presentationProbe(ctx);const p=await ctx.newPage();p.setDefaultTimeout(1500);await p.clock.install();
  const c={seed,viewport:{width,height},checks:[],boards:[],goal_progress:[0],input_method:mobile?'CDP touch':'keyboard',state_injection:false,passed:false};r.browser_cases.push(c);
  p.on('pageerror',e=>r.page_errors.push({seed,message:e.message}));p.on('console',m=>{if(m.type()==='error')r.console_errors.push({seed,message:m.text()});});const snap=()=>p.evaluate(()=>GameDiagnostics.snapshot());
  const check=async(code,fn)=>{try{await fn();c.checks.push(code);}catch(e){fail(code,e.message,seed);}};
  const shot=async phase=>{if(seed!==23&&seed!==89)return;const name=`viewport-${width}-${phase}.png`;await p.screenshot({path:path.join(outDir,name),fullPage:true,animations:'disabled',timeout:5000});r.screenshots.push(name);};
  const readable=async phase=>{const labels=await p.evaluate(()=>__cargoText());const conflicts=overlaps(labels);(c.text_evidence||=[]).push({phase,labels,conflicts});assert.equal(conflicts.length,0,`canvas text overlaps: ${JSON.stringify(conflicts.slice(0,6))}`);assert(!labels.some(x=>x.font_px<11.5),`canvas text below12px: ${labels.filter(x=>x.font_px<11.5).map(x=>x.text).join(',')}`);assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1,'page overflow');};
  try{
   await p.goto(server.origin+`/?qa=1&capture=1&seed=${seed}`);await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));
   await check('product_goal',async()=>{assert.match(await p.locator('body').innerText(),/LOAD\s+3\s+AIRSHIPS/i);assert(await p.locator('[data-cargo-goal-progress]').isVisible());assert.match(await p.locator('[data-cargo-goal-progress]').innerText(),/0\s*\/\s*3/);});
   await check('product_best',async()=>{assert(await p.locator('[data-cargo-best]').isVisible());assert.equal(Number(await p.locator('[data-cargo-best]').innerText()),(await snap()).best);assert.match(await p.locator('body').innerText(),/CURRENT SCORE/);assert.match(await p.locator('body').innerText(),/DEVICE BEST/);assert.match(await p.locator('body').innerText(),/LOCAL PRACTICE/);});
   await check('product_mobile_readability',()=>readable('entry'));await shot('entry');await p.locator('[data-game-start]').click();await p.clock.runFor(100);
   // Independent preference checks run BEFORE solver failures can hide them.
   await check('product_reduced_motion',async()=>{for(const reduced of [true,false]){await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await p.clock.runFor(100);assert.equal(await p.locator('[data-cargo-shell]').getAttribute('data-reduced-motion'),String(reduced),'dynamic OS preference not reflected');const observed=await p.evaluate(()=>globalThis.CargoPresentation?.snapshot());assert.equal(observed?.reducedMotion,reduced);if(reduced){assert.equal(observed.particles,0,'particles continue under reduced motion');const animations=await p.locator('*').evaluateAll(ns=>ns.filter(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&parseFloat(s.animationDuration)>.01;}).length);assert.equal(animations,0);}}});
   await check('product_no_audio',async()=>{assert.equal((await p.evaluate(()=>globalThis.CargoPresentation?.snapshot()))?.activeVoices,0);});
   await check('product_mobile_readability',()=>readable('playing'));await shot('playing');
   for(let stage=0;stage<3;stage++){
    const before=await snap();assert.equal(before.state.stage,stage);const plan=solve(before.state);c.boards.push({stage,cards:before.state.cards,bays:before.state.bays,...plan});
    await check('product_depth',async()=>{assert.equal(plan.required_assignments,[4,5,6][stage]);if(stage===2)assert(plan.extra_constraint_exclusions>0,'later energy constraint excludes no mass-valid allocation; decisions not deeper');});
    for(let i=0;i<plan.solution.length;i++){await activate(p,ctx,mobile,'card',i);assert.equal((await snap()).state.selectedCard,i,'card selection mismatch');await activate(p,ctx,mobile,'bay',plan.solution[i]);const after=await snap();if(after.state.stage===stage)assert.equal(after.state.cards[i].bay,plan.solution[i],'normal input assignment not applied');}
    for(let i=0;i<20&&(await snap()).state.stage===stage;i++)await p.clock.runFor(100);
    const after=await snap();assert.equal(after.state.stage,stage+1,'correct full load did not dispatch');assert(after.score>before.score,'dispatch has no score');c.goal_progress.push(after.state.stage);c.boards[stage].actual_assignments=after.state.assignments-before.state.assignments;c.boards[stage].tick=after.tick;assert.equal(c.boards[stage].actual_assignments,plan.required_assignments);
    await check('product_progress',async()=>assert.match(await p.locator('[data-cargo-goal-progress]').innerText(),new RegExp(`${stage+1}\\s*\\/\\s*3`)));
    await check('product_mobile_readability',()=>readable('stage-'+(stage+1)));if(stage===0)await shot('midgame');if(stage===1)await shot('progress');
   }
   for(let i=0;i<105&&(await snap()).phase!=='finished';i++)await p.clock.runFor(500);const end=await snap();assert.equal(end.phase,'finished');assert.equal(end.state.stage,3);assert(end.tick>=900&&end.tick<=3005,'session not15..50seconds');c.terminal={tick:end.tick,score:end.score,best:end.best};
   await check('product_result',async()=>{assert(await p.locator('[data-cargo-result]').isVisible());assert.match(await p.locator('[data-cargo-result]').innerText(),/SKYPORT COMPLETE/i);assert((await p.locator('[data-cargo-result-detail]').innerText()).length>12);assert.equal(Number(await p.locator('[data-cargo-best]').innerText()),end.best);assert(end.best>=end.score&&end.score>0);assert(await p.locator('[data-game-restart]').isVisible());});await check('product_mobile_readability',()=>readable('success'));await shot('success');
   await p.locator('[data-game-restart]').click();await p.clock.runFor(100);await check('product_best_restart',async()=>{assert.equal((await snap()).phase,'playing');assert.equal((await snap()).state.stage,0);assert.equal((await snap()).best,end.best);assert.equal(Number(await p.locator('[data-cargo-best]').innerText()),end.best);});
   if(seed===23){for(let i=0;i<105&&(await snap()).phase!=='finished';i++)await p.clock.runFor(500);await check('product_failure',async()=>{assert.equal((await snap()).phase,'finished');assert.match(await p.locator('[data-cargo-result]').innerText(),/CARGO INCOMPLETE/i);});await check('product_mobile_readability',()=>readable('failure'));await shot('failure');}
   c.passed=!r.hard_failures.some(x=>x.seed===seed);
  }catch(e){fail('product_playthrough',e.message,seed);await shot('failure').catch(()=>{});}
  finally{if(effects.length){r.side_effects.push(...effects.map(e=>({...e,seed})));fail('production_side_effect','capture attempted network/persistence',seed);}const video=record?p.video():null;await ctx.close();if(video){const name='viewport-390-playthrough.webm';fs.renameSync(await video.path(),path.join(outDir,name));r.capture={file:name,kind:'accelerated normal-input diagnostic recording; not human speed'};}save();}
 }
 // Fresh ordinary practice proves GameKit persistence; separate from capture and seed solutions.
 {
 const effects=[],ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});await installGuard(ctx,server.origin,effects);const p=await ctx.newPage();await p.clock.install();p.setDefaultTimeout(1500);p.on('pageerror',e=>r.page_errors.push({mode:'practice',message:e.message}));p.on('console',m=>{if(m.type()==='error')r.console_errors.push({mode:'practice',message:m.text()});});
 try{await p.emulateMedia({reducedMotion:'reduce'});await p.goto(server.origin+'/?seed=314159');await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+100));assert.equal(await p.locator('[data-cargo-shell]').getAttribute('data-reduced-motion'),'true','reduced motion initial load failed');await p.locator('[data-game-start]').click();await p.clock.runFor(100);
 for(let stage=0;stage<3;stage++){const plan=solve(await p.evaluate(()=>GameDiagnostics.snapshot().state));for(let i=0;i<plan.solution.length;i++){await activate(p,ctx,true,'card',i);await activate(p,ctx,true,'bay',plan.solution[i]);}for(let i=0;i<20&&(await p.evaluate(()=>GameDiagnostics.snapshot().state.stage))===stage;i++)await p.clock.runFor(100);}
 for(let i=0;i<105&&(await p.evaluate(()=>GameDiagnostics.snapshot().phase))!=='finished';i++)await p.clock.runFor(500);const end=await p.evaluate(()=>GameDiagnostics.snapshot());assert.equal(end.state.stage,3);assert(end.best>0);await p.locator('[data-game-restart]').click();await p.clock.runFor(100);assert.equal(Number(await p.locator('[data-cargo-best]').innerText()),end.best);await p.reload();await p.waitForFunction(()=>!!window.GameDiagnostics);await p.clock.runFor(100);assert.equal(Number(await p.locator('[data-cargo-best]').innerText()),end.best);
 const key=`playjolt_practice_${manifest.game_id}_${manifest.version}`;assert(effects.length>0);assert(effects.every(e=>e.kind==='storage'&&e.key===key));r.practice_record={passed:true,best:end.best,restart_retained:true,reload_retained:true,reduced_motion_on_load:true,key,writes:effects.length};
 }catch(e){fail('product_practice_best',e.message,null);}finally{for(const e of effects)if(e.kind!=='storage'||e.key!==`playjolt_practice_${manifest.game_id}_${manifest.version}`){r.side_effects.push(e);fail('production_side_effect','unexpected practice side effect',null);}await ctx.close();}
 }
 const boards=r.browser_cases.filter(c=>c.boards.length===3).map(c=>JSON.stringify(c.boards.map(b=>({cards:b.cards,bays:b.bays}))));if(boards.length===6&&new Set(boards).size<4)fail('product_seed_diversity','fewer than four distinct generated manifest sets across six seeds',null);
 if(r.console_errors.length)fail('console_error','product browser console errors',null);if(r.page_errors.length)fail('pageerror','product browser errors',null);if(hashTree(gameRoot)!==r.source_hash)fail('source_tampered','candidate source changed',null);
 r.passed=!r.hard_failures.length&&r.browser_cases.length===6&&r.browser_cases.every(c=>c.passed)&&r.practice_record?.passed===true;
 }catch(e){fail('qa_infrastructure',e.message,null);}finally{if(browser)await browser.close();if(server)await server.close();save();}return r;
}
module.exports={execute,solve,overlaps,seeds};
