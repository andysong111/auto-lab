'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs'),{settle}=require('./media-settlement.cjs');
const {atomicJSON,hashTree,hash,readJSON}=require('../orchestrator/files.cjs');
const {validate:validateManifest}=require('../orchestrator/manifest.cjs');
const {validate,review,at,identify,shortest,stageMetrics}=require('./product-contract.cjs');
const {canvasAudit,geometry,collisions,terminalTimeline}=require('./product-browser.cjs');
const VERSION='product-quality-1';
const REQUIRED=['objective','progress','score_best','completion','score_integrity','replay','mobile_readability','reduced_motion','feedback','failure_result','practice_best','capture_no_writes','difficulty'];
const snap=p=>p.evaluate(()=>GameDiagnostics.snapshot());
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function expect(ok,expected,actual){if(!ok){const e=Error('Expected '+JSON.stringify(expected)+'; actual '+JSON.stringify(actual));e.expected=expected;e.actual=actual;throw e;}}
async function execute(config){
 const {manifest,gameRoot,outDir,policy}=config;validateManifest(manifest);fs.mkdirSync(outDir,{recursive:true});
 const began=Date.now(),source=hashTree(gameRoot),contract=manifest.product_contract;
 const r={schema_version:1,runner_version:VERSION,suite:'product',game_id:manifest.game_id,version:manifest.version,source_hash:source,policy_hash:hash(policy),contract_hash:hash(contract||null),passed:false,hard_failures:[],soft_failures:[],checks:[],browser_cases:[],seeds:[],console_errors:[],page_errors:[],side_effects:[],practice_effects:[],screenshots:[],artifacts:[],duration_ms:0,scope:'Reviewed finite-model conformance and sampled normal-input product evidence; not proof of fun or all possible seeds.'};
 const save=()=>{r.duration_ms=Date.now()-began;atomicJSON(path.join(outDir,'qa.json'),r);atomicJSON(path.join(outDir,'artifact-index.json'),{schema_version:1,game_id:r.game_id,version:r.version,source_hash:source,contract_hash:r.contract_hash,artifacts:r.artifacts});};
 let evidence=[],currentViewport=null,server,browser,oracle;
 const check=async(name,details,fn)=>{const row={check:name,viewport:currentViewport,...details};try{row.actual=await fn();row.status='PASS';}catch(e){row.status='FAIL';row.expected=e.expected??details.expected??'contract requirement';row.actual=e.actual??e.message;const f={code:'product_'+name,message:e.message.slice(0,1800),check:name,viewport:currentViewport,...details,...(e.actual?.selector?{selector:e.actual.selector}:{}),expected:row.expected,actual:row.actual,evidence:[...evidence]};r.hard_failures.push(f);}r.checks.push(row);save();return row.status==='PASS';};
 async function capture(p,label){const file=`product-${currentViewport.width}-${label}.png`;await p.screenshot({path:path.join(outDir,file),fullPage:false,timeout:5000});r.screenshots.push(file);r.artifacts.push({path:file,kind:'screenshot',phase:label,viewport:currentViewport,sha256:digest(fs.readFileSync(path.join(outDir,file)))});evidence=[file];return file;}
 async function probeImage(p,label,selector){const file=`product-${currentViewport.width}-${label}.png`,bytes=await p.locator(selector).screenshot();fs.writeFileSync(path.join(outDir,file),bytes);const row={path:file,kind:'screenshot',phase:label,selector,viewport:currentViewport,sha256:digest(bytes)};r.artifacts.push(row);r.screenshots.push(file);return row;}
 async function session(width,height,seed,{practice=false,reducedMotion='no-preference',video=false}={}){
  const effects=[],ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width===390,serviceWorkers:'block',reducedMotion,...(video?{recordVideo:{dir:outDir,size:{width,height}}}:{})});
  await installGuard(ctx,server.origin,effects);await ctx.addInitScript(canvasAudit);
  const p=await ctx.newPage();p.setDefaultTimeout(1200);p.setDefaultNavigationTimeout(policy.limits.load_ms);
  p.on('console',m=>{if(m.type()==='error')r.console_errors.push(m.text().slice(0,800));});p.on('pageerror',e=>r.page_errors.push(e.message.slice(0,800)));
  await p.clock.install();const navigation=Date.now();await p.goto(server.origin+'/?seed='+seed+(practice?'':'&qa=1&capture=1'));
  await p.waitForFunction(()=>!!globalThis.GameDiagnostics);await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now())+50));
  // Install after Playwright's clock replaces requestAnimationFrame; otherwise the observer is silently overwritten.
  await p.evaluate(terminalTimeline,{statePath:contract.completion.state_path});
  const close=async()=>{await p.waitForTimeout(30);(practice?r.practice_effects:r.side_effects).push(...effects.map(e=>({...e,practice,viewport:{width,height}})));const v=p.video();await ctx.close();if(v){const old=await v.path(),file=`product-${width}-gameplay.webm`;fs.renameSync(old,path.join(outDir,file));r.artifacts.push({path:file,kind:'video',phase:'gameplay',viewport:{width,height},sha256:digest(fs.readFileSync(path.join(outDir,file)))});}};
  return {p,ctx,effects,navigation,close};
 }
 async function start(p){await p.locator('[data-game-start]').click();expect((await snap(p)).phase==='playing','playing after normal start',(await snap(p)).phase);}
 async function input(p,ctx,id,mode='keyboard'){
  const a=contract.actions[id];expect(!!a,'declared normal action',id);const before=await snap(p);
  if(mode==='touch'){const b=await p.locator(contract.mobile.canvas_selector).boundingBox();expect(!!b,'visible canvas',b);const cdp=await ctx.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*a.touch.x,y:b.y+b.height*a.touch.y}]});await p.clock.runFor(a.hold_ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await p.keyboard.down(a.key);await p.clock.runFor(a.hold_ms);await p.keyboard.up(a.key);}
  await p.clock.runFor(a.settle_ms);const after=await snap(p),kind=mode==='touch'?'pointer':'keyboard';
  expect(after.accepted_inputs[kind]>before.accepted_inputs[kind],'GameKit accepted normal '+mode+' input',{before:before.accepted_inputs,after:after.accepted_inputs});return after;
 }
 async function visible(p,selector,{initial=true}={}){
  const l=p.locator(selector);expect(await l.count()===1,'one visible element',selector);expect(await l.isVisible(),'visible '+selector,false);
  const perceptible=await l.evaluate(e=>{let opacity=1;for(let n=e;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);const s=getComputedStyle(e),transparent=c=>c==='transparent'||/rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(c);return opacity>=.1&&!transparent(s.color)&&!transparent(s.webkitTextFillColor);});expect(perceptible,'perceptible text (including ancestor opacity)',selector);
  const b=await l.boundingBox(),vp=p.viewportSize();expect(!initial||(b.x>=0&&b.y>=0&&b.x+b.width<=vp.width+1&&b.y+b.height<=vp.height+1),'inside initial viewport',{selector,box:b,viewport:vp});const text=(await l.innerText()).trim();expect(text.length>0,'non-empty visible text',selector);return text;
 }
 async function progress(p){const s=await snap(p),actual=await visible(p,contract.progress.selector),expected=contract.progress.format.replace('{value}',String(at(s,contract.progress.state_path)));expect(actual===expected,expected,actual);return {state:at(s,contract.progress.state_path),text:actual};}
 async function readability(p){const g=await geometry(p,contract),issues=[];
  if(g.overflow>1)issues.push({kind:'overflow',actual:g.overflow});
  for(const item of g.critical)if(item.font_px<contract.mobile.min_font_px)issues.push({kind:'font',...item});
  for(const pair of collisions(g.critical))issues.push({kind:'DOM collision',pair});
  for(const item of g.canvas_text)if(item.font_px<contract.mobile.min_font_px)issues.push({kind:'canvas font',...item});
  for(const pair of collisions(g.canvas_text))issues.push({kind:'canvas text collision',pair});
  for(const item of g.canvas_text)if(item.x<g.canvas.x-1||item.y<g.canvas.y-1||item.x+item.width>g.canvas.x+g.canvas.width+1||item.y+item.height>g.canvas.y+g.canvas.height+1)issues.push({kind:'canvas clipped text',item});
  for(const item of g.controls)if(item.width<contract.mobile.min_hit_target_px||item.height<contract.mobile.min_hit_target_px)issues.push({kind:'hit target',...item});
  for(const rect of contract.mobile.canvas_control_regions)if(!g.canvas||rect.width*g.canvas.width<contract.mobile.min_hit_target_px||rect.height*g.canvas.height<contract.mobile.min_hit_target_px||rect.x+rect.width>1.001||rect.y+rect.height>1.001)issues.push({kind:'canvas hit target',rect});
  expect(!issues.length,'readable text, non-colliding labels, >=44px controls',issues);return g;
 }
 async function motion(p){const records=[];
  for(const desired of [true,false,true,false]){await p.emulateMedia({reducedMotion:desired?'reduce':'no-preference'});
   const read=()=>p.evaluate(k=>({native:matchMedia('(prefers-reduced-motion: reduce)').matches,presentation:k.split('.').reduce((a,b)=>a?.[b],GameDiagnostics.snapshot())}),contract.reduced_motion.presentation_probe_path);
   const initial=await read();const result=await settle({read,advance:ms=>p.clock.runFor(ms),timeoutMs:800,matches:v=>v.native===desired&&v.presentation===desired});records.push({desired,initial,...result});}
  return records;
 }
 async function feedback(p,ctx,mode,reduced){
  await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await settle({read:async()=>at(await snap(p),contract.reduced_motion.presentation_probe_path),advance:ms=>p.clock.runFor(ms),matches:v=>v===reduced});
  const prefix='feedback-'+(reduced?'reduced':'motion'),before=await snap(p),initialFrame=await probeImage(p,prefix+'-before',contract.feedback.visual_probe),initial=initialFrame.sha256;
  const after=await input(p,ctx,contract.feedback.action,mode);
  expect(at(before,contract.feedback.state_change_path)!==at(after,contract.feedback.state_change_path),'meaningful observable state change',{before:at(before,contract.feedback.state_change_path),after:at(after,contract.feedback.state_change_path)});
  const frames=[];for(const ms of [0,60,contract.feedback.settle_ms]){if(ms)await p.clock.runFor(ms);const s=await snap(p),frame=await probeImage(p,prefix+'-'+ms,contract.feedback.visual_probe);frames.push({ms,path:frame.path,visual:frame.sha256,active:at(s,contract.feedback.active_probe_path),static:at(s,contract.feedback.static_probe_path)});}
  evidence=[initialFrame.path,...frames.map(f=>f.path)];
  if(reduced)expect(frames.some(f=>f.static===true&&f.visual!==initial),'visible static reduced-motion feedback',frames);
  else expect(frames[0].active===true&&frames.at(-1).active===false&&new Set(frames.map(f=>f.visual)).size>=3,'visible intermediate transition and settled state (not a final-state teleport)',frames);
  // Undo via the same normal action only if the approved model declares that cycle.
  return {before:initial,frames};
 }
 async function runPlan(p,ctx,seed,mode,{captureMilestones=false,exerciseBranches=false}={}){
  const {model}=oracle,g=model.seeds[seed];let s=await snap(p),id=identify(model,g,s);expect(id===g.initial,'reviewed initial projection',{id,state:s.state});
  const plan=shortest(g,id,n=>n.success);expect(plan&&plan.length<=contract.difficulty.max_actions,'bounded solvable oracle',plan?.length);
  const traces=[],stages=[],milestones=new Set(),perStage=new Map();let executed=0;
  for(const step of plan){
   s=await snap(p);const n=g.nodes[step.from];
   if(!perStage.has(n.stage)){const metrics=stageMetrics(g,step.from);expect(at(s,contract.difficulty.stage_path)===metrics.stage,'stage cross-check',{metric:at(s,contract.difficulty.stage_path),oracle:metrics.stage});expect(at(s,contract.difficulty.complexity_path)===metrics.complexity,'complexity agrees with reviewed consequential transition width',{declared:at(s,contract.difficulty.complexity_path),derived:metrics.complexity});perStage.set(n.stage,{...metrics,actual_actions:0,observed_choices:[]});
    if(exerciseBranches)for(const edge of n.edges){
     const returnPath=shortest(g,edge.to,node=>node===n);expect(returnPath!==null,'reviewed bounded return path for each consequential choice',{stage:n.stage,action:edge.action});
     for(const probe of [edge,...returnPath]){expect(++executed<=contract.difficulty.max_actions,'bounded total normal-input probes',executed);const prior=await snap(p),next=await input(p,ctx,probe.action,mode);expect(identify(model,g,next)===probe.to,'observed alternative matches reviewed edge', {action:probe.action,expected:probe.to,actual:identify(model,g,next)});expect(at(next,contract.difficulty.meaningful_actions_path)-at(prior,contract.difficulty.meaningful_actions_path)===1,'one meaningful action per alternative edge',next.quality);}
     expect(identify(model,g,await snap(p))===step.from,'choice probe returns to stage entry',await snap(p));perStage.get(n.stage).observed_choices.push(edge.action);
    }
    s=await snap(p);
   }
   expect(++executed<=contract.difficulty.max_actions,'bounded total normal inputs',executed);const before=s,after=await input(p,ctx,step.action,mode);id=identify(model,g,after);expect(id===step.to,'reviewed normal-input transition '+step.to,{actual:id,projection:model.projection.map(k=>at(after,k))});
   const delta=at(after,contract.difficulty.meaningful_actions_path)-at(before,contract.difficulty.meaningful_actions_path);expect(delta===1,'one meaningful action for one observed model edge',delta);perStage.get(n.stage).actual_actions++;
   expect(at(before,contract.difficulty.reversible_state_path)!==at(after,contract.difficulty.reversible_state_path),'reversible key covers model change',{before:at(before,contract.difficulty.reversible_state_path),after:at(after,contract.difficulty.reversible_state_path)});
   const pr=await progress(p);milestones.add(pr.state);traces.push({action:step.action,node:id,projection:model.projection.map(k=>at(after,k)),score:after.score,quality:after.quality});
   if(captureMilestones&&contract.progress.milestones.includes(pr.state)&&!r.artifacts.some(a=>a.path===`product-${currentViewport.width}-milestone-${pr.state}.png`))await capture(p,'milestone-'+pr.state);
   if(captureMilestones&&perStage.size===2&&!r.artifacts.some(a=>a.path===`product-${currentViewport.width}-midgame.png`))await capture(p,'midgame');
  }
  stages.push(...perStage.values());expect(stages.length>=2,'at least two independently modeled stages',stages);
  for(const stage of stages)expect(stage.actual_actions===stage.required_actions,'observed actions match independently computed shortest path',stage);
  for(let i=1;i<stages.length;i++)expect(stages[i].complexity>stages[i-1].complexity&&stages[i].actual_actions>stages[i-1].actual_actions,'each later stage adds choices and required normal actions',stages);
  expect(stages.at(-1).complexity>stages[0].complexity&&stages.at(-1).actual_actions>stages[0].actual_actions,'later consequential choices AND meaningful actions increase',stages);
  for(const milestone of contract.progress.milestones)expect(milestones.has(milestone),'visible goal milestone '+milestone,[...milestones]);
  return {seed,mode,traces,stages,milestones:[...milestones],deterministic_hash:hash(traces)};
 }
 try{
  validate(contract);
  await check('difficulty_review',{state_path:'difficulty.oracle_sha256'},async()=>{oracle=review(contract,{allowFixture:policy.product?.allow_fixture_oracles===true});r.oracle_approval=oracle.approval;return oracle.approval;});
  server=await serve(gameRoot);try{browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});}catch(e){r.hard_failures.push({code:'qa_infrastructure',message:'Trusted Chromium could not launch: '+e.message});throw e;}
  for(const [width,height] of policy.required_viewports){currentViewport={width,height};evidence=[];let ses;
   const count=r.hard_failures.length,mode=width===390?'touch':'keyboard';
   try{
    ses=await session(width,height,contract.difficulty.deterministic_seeds[0],{video:width===390});const {p,ctx}=ses;
    await capture(p,'entry');
    await check('objective',{selector:contract.objective.visible_selector},async()=>{const text=await visible(p,contract.objective.visible_selector);expect(text.includes(contract.objective.expected_text)&&text.replace(/\W/g,'').length>=12,'meaningful declared objective text',text);expect(Date.now()-ses.navigation<=5000,'objective visible within first five seconds',Date.now()-ses.navigation);return text;});
    await check('progress',{selector:contract.progress.selector,state_path:contract.progress.state_path},()=>progress(p));
    await check('score_best',{selector:contract.best.selector,state_path:'best'},async()=>{const s=await snap(p);for(const c of [contract.score,contract.best])expect(await visible(p,c.label_selector)===c.expected_label,c.expected_label,await p.locator(c.label_selector).innerText());const a=await visible(p,contract.score.selector),b=await visible(p,contract.best.selector);expect(Number(a)===s.score&&Number(b)===s.best,'GameKit score / best separately',{score:a,best:b,snapshot:{score:s.score,best:s.best}});return {score:a,best:b};});
    await check('mobile_readability',{phase:'entry',selector:contract.mobile.canvas_selector},()=>readability(p));
    await start(p);await capture(p,'playing');
    await check('reduced_motion',{state_path:contract.reduced_motion.presentation_probe_path},()=>motion(p));
    // Restore the initial preference even when a stale probe failed above.
    await p.emulateMedia({reducedMotion:'no-preference'});await p.clock.runFor(100);
    await check('score_integrity',{state_path:contract.difficulty.reversible_state_path,selector:contract.score.selector},async()=>{
     const rows=[];for(const [kind,probes] of [['reversible',contract.score.reversible_probes],['no-progress',contract.score.no_progress_probes]])for(const actions of probes){const before=await snap(p);for(const id of actions)await input(p,ctx,id,mode);const after=await snap(p);const a=oracle?identify(oracle.model,oracle.model.seeds[before.seed],before):at(before,contract.difficulty.reversible_state_path),b=oracle?identify(oracle.model,oracle.model.seeds[after.seed],after):at(after,contract.difficulty.reversible_state_path);expect(a!==undefined&&a===b&&at(before,contract.progress.state_path)===at(after,contract.progress.state_path),'probe returns to identical reviewed objective state',{kind,actions,before:a,after:b});expect(after.score<=before.score,'no score gain for no objective progress',{kind,actions,before:before.score,after:after.score});rows.push({kind,actions,before:before.score,after:after.score});}return {probes:rows,coverage:rows.length?'declared bounded cycles':'NO_PROBES_DECLARED'};});
    await check('feedback',{state_path:contract.feedback.state_change_path,selector:contract.feedback.visual_probe},()=>feedback(p,ctx,mode,false));
    // Separate fresh sessions prevent a failed probe from poisoning success/replay.
    await ses.close();ses=null;
    ses=await session(width,height,contract.difficulty.deterministic_seeds[0]);await start(ses.p);
    await check('progress',{phase:'milestones',state_path:contract.progress.state_path},async()=>{expect(!!oracle,'reviewed oracle available',false);const data=await runPlan(ses.p,ses.ctx,contract.difficulty.deterministic_seeds[0],mode,{captureMilestones:true});return data.stages;});
    await check('completion',{state_path:contract.completion.state_path,selector:contract.completion.result_selector},async()=>{let s=await snap(ses.p);expect(at(s,contract.completion.state_path)===contract.completion.success_value,'objective success reachable by normal input',s.state);let elapsed=0;while(s.phase!=='finished'&&elapsed<contract.completion.max_terminal_latency_ms){await ses.p.clock.runFor(20);elapsed+=20;s=await snap(ses.p);}expect(s.phase==='finished','terminal within '+contract.completion.max_terminal_latency_ms+'ms of objective success',{phase:s.phase,latency_ms:elapsed});expect((await visible(ses.p,contract.completion.result_selector)).includes(contract.completion.success_text),contract.completion.success_text,await ses.p.locator(contract.completion.result_selector).innerText());await capture(ses.p,'success');if(width===390)await capture(ses.p,'mobile-result');const timeline=await ses.p.evaluate(()=>__ProductTerminalTimeline()),success=timeline.find(t=>t.value===contract.completion.success_value),terminal=timeline.find(t=>t.value===contract.completion.success_value&&t.phase==='finished');const latency=success&&terminal?terminal.time-success.time:null;expect(latency!==null&&latency<=contract.completion.max_terminal_latency_ms,'frame-observed bounded success-to-terminal latency',{latency_ms:latency,timeline});return {latency_ms:latency,timeline};});
    await check('mobile_readability',{phase:'result',selector:contract.completion.result_selector},()=>readability(ses.p));
    await check('replay',{selector:contract.replay.selector},async()=>{await visible(ses.p,contract.replay.selector,{initial:width===390});const before=await snap(ses.p);await ses.p.locator(contract.replay.selector).click();const after=await snap(ses.p);expect(before.phase==='finished'&&after.phase==='playing'&&after.tick<before.tick&&oracle&&identify(oracle.model,oracle.model.seeds[after.seed],after)===oracle.model.seeds[after.seed].initial,'real fresh restart from result',{before:before.phase,after:after.phase,tick:after.tick,progress:at(after,contract.progress.state_path)});return {before_tick:before.tick,after_tick:after.tick};});
    await check('capture_no_writes',{},async()=>{await ses.p.waitForTimeout(30);expect(!ses.effects.length,'zero capture writes',ses.effects);return {writes:ses.effects.length};});
   }catch(e){await check('lifecycle',{blocked:true},()=>{throw e;});}
   finally{if(ses)await ses.close();}
   // Independent initial-reduce / static-feedback / failure path still run.
   let other;
   try{other=await session(width,height,contract.difficulty.deterministic_seeds[0],{reducedMotion:'reduce'});
    await check('reduced_motion',{phase:'initial_reduce',state_path:contract.reduced_motion.presentation_probe_path},async()=>{const s=await snap(other.p);expect(at(s,contract.reduced_motion.presentation_probe_path)===true,'initial reduce honored',s.presentation);return s.presentation;});await start(other.p);
    await check('feedback',{phase:'static_reduce',state_path:contract.feedback.static_probe_path,selector:contract.feedback.visual_probe},()=>feedback(other.p,other.ctx,mode,true));
    await check('failure_result',{state_path:contract.completion.state_path,selector:contract.completion.result_selector},async()=>{for(const id of contract.completion.failure_actions)await input(other.p,other.ctx,id,mode);for(let ms=0;ms<contract.completion.failure_wait_ms&&(await snap(other.p)).phase==='playing';ms+=250)await other.p.clock.runFor(250);const s=await snap(other.p);expect(s.phase==='finished'&&at(s,contract.completion.state_path)===contract.completion.failure_value,'failure terminal through normal actions / idle',s.state);expect((await visible(other.p,contract.completion.result_selector)).includes(contract.completion.failure_text),contract.completion.failure_text,await other.p.locator(contract.completion.result_selector).innerText());await capture(other.p,'failure');await visible(other.p,contract.replay.selector,{initial:width===390});return {phase:s.phase,outcome:at(s,contract.completion.state_path)};});
   }catch(e){await check('failure_path',{blocked:true},()=>{throw e;});}finally{if(other)await other.close();}
   r.browser_cases.push({viewport:currentViewport,passed:r.hard_failures.length===count,checks:r.checks.filter(c=>c.viewport?.width===width)});save();
  }
  currentViewport={width:390,height:844};
  for(const seed of contract.difficulty.deterministic_seeds){await check('difficulty',{seed,state_path:contract.difficulty.complexity_path},async()=>{expect(!!oracle,'reviewed oracle available',false);const runs=[];for(let repeat=0;repeat<2;repeat++){const ses=await session(390,844,seed);try{await start(ses.p);runs.push(await runPlan(ses.p,ses.ctx,seed,repeat?'keyboard':'touch',{exerciseBranches:true}));expect((await snap(ses.p)).phase==='finished','normal-input terminal',await snap(ses.p));}finally{await ses.close();}}expect(runs[0].deterministic_hash===runs[1].deterministic_hash,'same seed deterministic across keyboard/touch replay',runs.map(x=>x.deterministic_hash));r.seeds.push({seed,passed:true,runs});return {seed,hash:runs[0].deterministic_hash,stages:runs[0].stages};});}
  await check('practice_best',{selector:contract.best.selector,state_path:'best'},async()=>{expect(!!oracle,'reviewed oracle available',false);const ses=await session(390,844,contract.difficulty.deterministic_seeds[0],{practice:true});try{await start(ses.p);await runPlan(ses.p,ses.ctx,contract.difficulty.deterministic_seeds[0],'touch');const s=await snap(ses.p);expect(s.best===s.score&&s.best>0,'completed practice updates GameKit best',s.best);await ses.p.reload();await ses.p.waitForFunction(()=>!!globalThis.GameDiagnostics);const next=await snap(ses.p);expect(next.best===s.best&&Number(await visible(ses.p,contract.best.selector))===s.best,'device best survives practice reload',{before:s.best,after:next.best});const key='playjolt_practice_'+manifest.game_id+'_'+manifest.version;expect(ses.effects.length>=1&&ses.effects.every(e=>e.kind==='storage'&&e.key===key),'only exact GameKit practice best storage write',ses.effects);return {before:s.best,after:next.best,writes:ses.effects};}finally{await ses.close();}});
 }catch(e){await check('contract_or_infrastructure',{},()=>{throw e;});}
 finally{
  if(browser)await browser.close();if(server)await server.close();
  const illegal=[...r.side_effects,...r.practice_effects].filter(e=>!e.practice||e.kind!=='storage'||e.key!=='playjolt_practice_'+manifest.game_id+'_'+manifest.version);
  if(illegal.length)r.hard_failures.push({code:'production_side_effect',message:'Product QA detected forbidden persistence/network effects',actual:illegal});
  if(r.console_errors.length||r.page_errors.length)r.hard_failures.push({code:'product_browser_errors',message:'Browser errors during product QA',actual:{console:r.console_errors,page:r.page_errors}});
  if(hashTree(gameRoot)!==source)r.hard_failures.push({code:'source_tampered',message:'Source changed during product QA'});
  for(const name of REQUIRED)if(!r.checks.some(c=>c.check===name))r.hard_failures.push({code:'product_missing_check',message:'Physically blocked or missing check: '+name,check:name,expected:'executed',actual:'blocked'});
  r.passed=r.hard_failures.length===0;save();
 }
 return r;
}
if(require.main===module){if(!fs.existsSync('/input/qa.json')||process.argv[2]!=='/input/qa.json')throw Error('Product browser QA requires the Docker entrypoint; no host fallback');execute(readJSON(process.argv[2])).then(r=>{process.exitCode=r.passed?0:1;}).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={execute,VERSION,REQUIRED};
