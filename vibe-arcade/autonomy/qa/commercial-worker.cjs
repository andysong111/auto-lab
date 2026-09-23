'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {serve}=require('./server.cjs'),{installGuard}=require('./guard.cjs'),{canvasAudit}=require('./product-browser.cjs');
const {hash,hashTree,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {review,LIMITS}=require('./commercial/contract.cjs'),{at,identify,shortest}=require('./product-contract.cjs');
const raster=require('./commercial/raster.cjs'),{audioAudit,frameAudit,boxes}=require('./commercial/browser.cjs');
const visual=require('./commercial/visual-review.cjs');
const VERSION='commercial-polish-1';
const REQUIRED=['visual_legibility','state_distinction','action_feedback','motion','reduced_motion','progression_spectacle','mobile_hierarchy','mobile_density','result_presentation','replay_motivation','audio','performance','capture_no_writes','visual_evidence','visual_review'];
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function expect(ok,expected,actual){if(!ok){const e=Error(expected);e.expected=expected;e.actual=actual;throw e;}}
async function execute({manifest,gameRoot,outDir,policy},reviewer=new visual.MachineCorroboration()){
 const source=hashTree(gameRoot),c=manifest.commercial_contract,p=manifest.product_contract,began=Date.now();fs.mkdirSync(outDir,{recursive:true});
 const r={schema_version:1,runner_version:VERSION,suite:'commercial',game_id:manifest.game_id,version:manifest.version,source_hash:source,policy_hash:hash(policy),contract_hash:hash(c||null),product_contract_hash:hash(p||null),passed:false,hard_failures:[],checks:[],browser_cases:[],artifacts:[],screenshots:[],side_effects:[],console_errors:[],page_errors:[],duration_ms:0,scope:'Reviewed normal-input visual guards; aesthetic equivalence, fun, retention and real-phone FPS remain unverified.'};
 let browser,server,oracle,vp={width:390,height:844},evidence=[],seq=0;
 const save=()=>{r.duration_ms=Date.now()-began;atomicJSON(path.join(outDir,'qa.json'),r);atomicJSON(path.join(outDir,'artifact-index.json'),{source_hash:source,contract_hash:r.contract_hash,artifacts:r.artifacts});};
 async function check(name,details,fn){evidence=[];const row={check:name,viewport:vp,...details};try{row.actual=await fn();row.status='PASS';}catch(e){row.status='FAIL';row.expected=e.expected||details.expected||'commercial contract';row.actual=e.actual??e.message;row.message=String(e.message).slice(0,1200);const code=name==='visual_legibility'?'product_route_topology_not_visible':'commercial_'+name;r.hard_failures.push({code,message:row.message,check:name,viewport:vp,...details,expected:row.expected,actual:row.actual,evidence:[...evidence]});}row.evidence=[...evidence];r.checks.push(row);save();return row;}
 const snap=page=>page.evaluate(()=>GameDiagnostics.snapshot());
 async function session({reduced=false,real=false,video=false}={}){
  const effects=[],ctx=await browser.newContext({viewport:vp,hasTouch:true,isMobile:vp.width===390,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference',...(video?{recordVideo:{dir:outDir,size:vp}}:{})});let finalAudio=null;
  await installGuard(ctx,server.origin,effects);await ctx.exposeBinding('__commercialAudioFinal',(_s,v)=>{finalAudio=v;});await ctx.addInitScript(canvasAudit);await ctx.addInitScript(audioAudit);if(real)await ctx.addInitScript(frameAudit);
  const page=await ctx.newPage();page.setDefaultTimeout(1800);page.setDefaultNavigationTimeout(8000);
  page.on('pageerror',e=>r.page_errors.push(e.message.slice(0,500)));page.on('console',m=>{if(m.type()==='error')r.console_errors.push(m.text().slice(0,500));});
  if(!real){await page.clock.install({time:new Date(0)});await page.clock.pauseAt(new Date(86400000));}
  await page.goto(server.origin+'/?seed='+c.seed+'&qa=1&capture=1');await page.waitForFunction(()=>!!globalThis.GameDiagnostics,null,{polling:20});if(!real)await page.clock.runFor(50);
  const s={page,ctx,real,finalAudio:()=>finalAudio,advance:ms=>real?page.waitForTimeout(ms):page.clock.runFor(ms)};
  s.close=async()=>{const v=page.video();await ctx.close();r.side_effects.push(...effects);if(v){const old=await v.path(),file=`commercial-${vp.width}-gameplay-${seq++}.webm`;fs.renameSync(old,path.join(outDir,file));r.artifacts.push({path:file,phase:'gameplay',kind:'video',viewport:vp,sha256:digest(fs.readFileSync(path.join(outDir,file)))});}};
  return s;
 }
 async function withSession(options,fn){const s=await session(options);try{return await fn(s);}finally{await s.close();}}
 async function start(s){await s.page.locator('[data-game-start]').click();expect((await snap(s.page)).phase==='playing','normal Start must enter playing',(await snap(s.page)).phase);}
 async function input(s,id,{settle=0}={}){
  const a=p.actions[id],before=await snap(s.page);expect(!!a,'declared player action',id);
  if(vp.width===390){const b=await s.page.locator(p.mobile.canvas_selector).boundingBox(),cdp=await s.ctx.newCDPSession(s.page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*a.touch.x,y:b.y+b.height*a.touch.y}]});await s.advance(a.hold_ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await s.page.keyboard.down(a.key);await s.advance(a.hold_ms);await s.page.keyboard.up(a.key);}
  await s.advance(Math.max(20,settle));const after=await snap(s.page),kind=vp.width===390?'pointer':'keyboard';expect(after.accepted_inputs[kind]>before.accepted_inputs[kind],'real input accepted',{before:before.accepted_inputs,after:after.accepted_inputs});return after;
 }
 async function reach(s,node){await start(s);const g=oracle.graph,plan=shortest(g,g.initial,n=>n===g.nodes[node]);expect(plan&&plan.length<=p.difficulty.max_actions,'reviewed bounded normal-input path',node);
  expect(identify(oracle.model,g,await snap(s.page))===g.initial,'actual initial state agrees with reviewed oracle',node);
  for(const edge of plan){const next=await input(s,edge.action,{settle:c.motion.settle_ms});expect(identify(oracle.model,g,next)===edge.to,'actual player transition agrees with oracle',{expected:edge.to,actual:identify(oracle.model,g,next)});}await s.advance(c.motion.settle_ms);
 }
 async function capture(s,phase,regions=[]){
  const geometry=await boxes(s.page,regions,p.mobile.canvas_selector),file=`commercial-${vp.width}-${phase}-${seq++}.png`,b=await s.page.screenshot({animations:'allow',timeout:5000});fs.writeFileSync(path.join(outDir,file),b);
  r.artifacts.push({path:file,kind:'screenshot',phase,viewport:vp,sha256:digest(b),regions:geometry.regions,text_masks:geometry.masks});r.screenshots.push(file);evidence.push(file);
  const png=raster.decode(b);return {file,geometry,samples:geometry.regions.map(region=>raster.sample(png,region,geometry.masks))};
 }
 async function anchor(a,phase){return withSession({},async s=>{await reach(s,a.node);return capture(s,phase,[a.region]);});}
 async function visible(page,selector){const e=page.locator(selector);expect(await e.count()===1&&await e.isVisible(),'one visible '+selector,false);const b=await e.boundingBox();expect(b&&b.x>=0&&b.y>=0&&b.x+b.width<=vp.width+1&&b.y+b.height<=vp.height+1,'first-viewport control/text '+selector,b);return (await e.innerText()).trim();}
 try{
  oracle=review(c,p,{allowFixture:policy.product?.allow_fixture_oracles===true});r.oracle_approval=oracle.approval;
  server=await serve(gameRoot);try{browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});}catch(e){r.hard_failures.push({code:'qa_infrastructure',message:e.message});throw e;}
  for(const [width,height] of policy.required_viewports){vp={width,height};const initialFailures=r.hard_failures.length;
   await check('entry',{},()=>withSession({},s=>capture(s,'entry')));
   for(const name of ['visual_legibility','state_distinction'])for(const pair of c[name].pairs)await check(name,{category:'visual_legibility',state_pair:pair,visual_region:[pair.a.region,pair.b.region]},async()=>{
    const a=await anchor(pair.a,'pair-before'),b=await anchor(pair.b,'pair-after'),m=raster.compare(a.samples[0],b.samples[0]);expect(raster.distinct(m,LIMITS),'decision-relevant states have visible non-text pixel distinction',m);return m;
   });
   for(const probe of c.action_feedback.probes){
    for(const reduced of [false,true])await check(reduced?'reduced_motion':'action_feedback',{category:'feedback',probe:probe.id,stage:oracle.graph.nodes[probe.node].stage,selector:probe.region.selector,visual_region:probe.region,state_path:p.difficulty.reversible_state_path},()=>withSession({reduced},async s=>{
     await reach(s,probe.node);const before=await capture(s,'before',[probe.region]),old=await snap(s.page),next=await input(s,probe.action),expected=oracle.graph.nodes[probe.node].edges.find(e=>e.action===probe.action).to;
     expect(identify(oracle.model,oracle.graph,next)===expected,'feedback action matches reviewed state change',{expected,actual:identify(oracle.model,oracle.graph,next)});
     expect(at(old,p.difficulty.reversible_state_path)!==at(next,p.difficulty.reversible_state_path),'meaningful feedback action',next.quality);
     const frames=[];let elapsed=0;for(const ms of [...c.motion.intermediate_ms,c.motion.settle_ms]){await s.advance(ms-elapsed);elapsed=ms;frames.push(await capture(s,ms===c.motion.settle_ms?'settled':'intermediate',[probe.region]));}
     const settled=frames.at(-1).samples[0],d=raster.compare(before.samples[0],frames[0].samples[0]);expect(raster.distinct(d,LIMITS),'action visibly changes its local region',d);
     if(reduced){expect(at(await snap(s.page),p.reduced_motion.presentation_probe_path)===true,'reduced motion honored',false);return {static_alternative:d};}
     const ds=frames.slice(0,-1).map(f=>raster.compare(f.samples[0],settled)),motion=raster.compare(frames[0].samples[0],frames[1].samples[0]);
     // Intermediate frames must differ from both settled AND each other: teleport plus a static badge cannot pass.
     expect(ds.every(x=>x.mean_delta>=.008&&x.changed_fraction>=.02)&&motion.mean_delta>=.004,'before/intermediate/settled transition, not instant teleport',{intermediate_to_settled:ds,between_intermediates:motion});return {delta:d,motion,frames:frames.map(f=>f.file)};
    }));
   }
   await check('motion',{category:'feedback'},async()=>{const rows=r.checks.filter(x=>x.check==='action_feedback'&&x.viewport.width===width);evidence=rows.flatMap(x=>x.evidence);expect(rows.length===c.action_feedback.probes.length&&rows.every(x=>x.status==='PASS'),'all declared core actions have visible transitions',rows.map(x=>({probe:x.probe,status:x.status})));return rows.length;});
   await check('progression_spectacle',{category:'progression',state_path:p.difficulty.stage_path,visual_region:c.progression_spectacle.checkpoints},async()=>{
    const frames=[];for(const [i,a] of c.progression_spectacle.checkpoints.entries())frames.push(await anchor(a,['early','mid','late'][i]));
    const deltas=[raster.compare(frames[0].samples[0],frames[1].samples[0]),raster.compare(frames[1].samples[0],frames[2].samples[0])];expect(deltas.every(m=>raster.distinct(m,LIMITS)),'early/mid/late visibly progress after masking all text',deltas);return deltas;
   });
   await withSession({},async s=>{await reach(s,oracle.graph.initial);
    await check('mobile_hierarchy',{category:'hierarchy',selector:c.mobile_hierarchy.gameplay_selector},async()=>{
     const roles=c.mobile_hierarchy.roles,im=await capture(s,'hierarchy',roles.flatMap(x=>[x.foreground,x.background])),b=await s.page.locator(c.mobile_hierarchy.gameplay_selector).boundingBox(),ratio=b.width*b.height/(width*height);
     const contrast=roles.map((x,i)=>({role:x.role,contrast:raster.contrast(im.samples[2*i],im.samples[2*i+1])}));expect(contrast.every(x=>x.contrast>=LIMITS.contrast),'important objects contrast against their local background',contrast);expect(width!==390||ratio>=LIMITS.min_gameplay_area,'gameplay occupies a clear mobile focal area',{ratio,min:LIMITS.min_gameplay_area});return {contrast,gameplay_area_ratio:ratio};
    });
    await check('mobile_density',{category:'hierarchy',selector:'body'},async()=>{const im=await capture(s,'density');const g=im.geometry;expect(g.text_area<=LIMITS.max_text_area&&g.text_chars<=LIMITS.max_text_chars,'bounded visible text density',{text_area:g.text_area,text_chars:g.text_chars});return g;});
   });
   for(const success of [true,false])await check('result_presentation',{category:'result',outcome:success?'success':'failure',selector:p.completion.result_selector,visual_region:c.result_presentation.region},()=>withSession({video:width===390&&success},async s=>{
    await start(s);await s.advance(c.motion.settle_ms);const before=await capture(s,'result-before',[c.result_presentation.region]);
    if(success){for(const edge of shortest(oracle.graph,oracle.graph.initial,n=>n.success)){const next=await input(s,edge.action,{settle:c.motion.settle_ms});expect(identify(oracle.model,oracle.graph,next)===edge.to,'result route conforms to oracle',edge.to);}}
    else{for(const id of p.completion.failure_actions)await input(s,id);await s.advance(p.completion.failure_wait_ms);}
    const state=await snap(s.page);expect(state.phase==='finished'&&at(state,p.completion.state_path)===(success?p.completion.success_value:p.completion.failure_value),'real terminal outcome',state.phase);
    await s.advance(c.motion.settle_ms);const after=await capture(s,success?'success':'failure',[c.result_presentation.region]),m=raster.compare(before.samples[0],after.samples[0]);expect(raster.distinct(m,LIMITS),'non-text completion/failure visual response',m);
    const title=await visible(s.page,p.completion.result_selector);expect(title.includes(success?c.result_presentation.success_title:c.result_presentation.failure_title),'explicit outcome title',title);
    for(const [selector,value] of [[p.score.selector,state.score],[p.best.selector,state.best]])expect(Number(await visible(s.page,selector))===value,'visible result score / best agrees with GameKit',selector);
    await visible(s.page,p.replay.selector);await s.page.locator(p.replay.selector).click();expect(identify(oracle.model,oracle.graph,await snap(s.page))===oracle.graph.initial,'result replay resets actual state',await snap(s.page));return m;
   }));
   await check('replay_motivation',{selector:c.replay_motivation.selector},()=>withSession({},async s=>{await start(s);const text=await visible(s.page,c.replay_motivation.selector);expect(text.length>=12,'visible route/skill replay motivation',text);return {text,reviewed_reason:c.replay_motivation.reason};}));
   await check('performance',{state_path:'entities'},()=>withSession({real:true},async s=>{
    await start(s);const nodes=await s.page.locator('*').count();await s.advance(c.performance.sample_ms);const f=await s.page.evaluate(()=>__CommercialFrames()),n=await s.page.locator('*').count(),state=await snap(s.page);
    await capture(s,'performance');expect(f.count>=10&&f.max_gap_ms<LIMITS.max_frame_gap_ms&&n<=LIMITS.max_dom&&n-nodes<=LIMITS.max_dom_growth&&state.entities<=LIMITS.max_entities,'bounded headless frame gaps, DOM and entities',{frames:f.count,max_gap_ms:f.max_gap_ms,nodes:n,growth:n-nodes,entities:state.entities});return {frames:f.count,max_gap_ms:f.max_gap_ms,nodes:n,entities:state.entities,meaning:'Docker headless guard, not phone FPS'};
   }));
   r.browser_cases.push({viewport:vp,passed:r.hard_failures.length===initialFailures});
  }
  vp={width:390,height:844};
  if(c.audio.mode==='reviewed_silence')await check('audio',{},async()=>({mode:c.audio.mode,reviewed_exception:c.audio.exception,approval:r.oracle_approval.id}));
  else for(const event of ['primary','progress','success','failure','mute','pause','pagehide'])await check('audio',{event,selector:c.audio.mute_selector},()=>withSession({real:true},async s=>{
    await capture(s,'audio-'+event);
    const pre=await s.page.evaluate(()=>__CommercialAudioAudit());expect(!pre.events.some(e=>['start','resume'].includes(e.kind))&&pre.contexts===0,'no AudioContext/autoplay before player gesture',pre);
    await start(s);
    const probe=c.action_feedback.probes.find(p=>p.id===c.audio[event==='progress'?'progress_probe':'primary_probe']);
    const pathTo=shortest(oracle.graph,oracle.graph.initial,n=>n===oracle.graph.nodes[probe.node]);for(const e of pathTo)await input(s,e.action,{settle:150});
    let terminalAction=null;
    if(event==='success'){const current=identify(oracle.model,oracle.graph,await snap(s.page)),route=shortest(oracle.graph,current,n=>n.success);expect(route?.length>0,'normal-input success audio route',current);for(const e of route.slice(0,-1))await input(s,e.action,{settle:240});terminalAction=route.at(-1).action;}
    if(event==='mute'){await input(s,probe.action);await visible(s.page,c.audio.mute_selector);await s.page.locator(c.audio.mute_selector).click();await s.advance(180);}
    // Isolate the final success input: earlier route SFX cannot satisfy this event.
    const before=await s.page.evaluate(()=>__CommercialAudioAudit()),time=await s.page.evaluate(()=>performance.now());
    if(event==='success'){await input(s,terminalAction);expect(at(await snap(s.page),p.completion.state_path)===p.completion.success_value,'success SFX follows real completion',await snap(s.page));}
    else if(event==='failure')await s.advance(p.completion.failure_wait_ms);
    else await input(s,probe.action);
    if(event==='pause')await s.page.locator('[data-game-pause]').click();
    if(event==='pagehide'){await s.page.goto('about:blank');await s.page.waitForTimeout(80);}
    else await s.advance(50);
    const after=event==='pagehide'?s.finalAudio():await s.page.evaluate(()=>__CommercialAudioAudit());expect(!!after,'pagehide audio cleanup report observed',after);
    const events=after.events.filter(e=>e.time>=time),starts=events.filter(e=>e.kind==='start'),energy=events.filter(e=>e.kind==='energy').map(e=>e.rms),audible=energy.some(n=>n>.0001);
    if(['primary','progress','success','failure'].includes(event))expect(starts.length>0&&audible,'audible user-gesture SFX for '+event,{starts:starts.length,energy});
    if(event==='mute')expect(starts.length===0&&!audible,'mute prevents core SFX',{starts:starts.length,energy});
    if(event==='pause')expect(after.running_contexts===0,'audio settles suspended/closed on pause',after);
    if(event==='pagehide')expect(after.running_contexts===0||after.pagehide_cleanup_contexts===after.contexts,'each context receives native suspend/close during pagehide without a later resume',after);
    expect(after.contexts<=LIMITS.max_contexts&&after.peak_voices<=LIMITS.max_voices&&after.events.every(e=>!['start','context','resume'].includes(e.kind)||e.after_gesture),'bounded audio contexts/voices, only after gesture',after);
    return {event,starts:starts.length,audible,contexts:after.contexts,peak_voices:after.peak_voices,running_contexts:after.running_contexts,pagehide_cleanup_contexts:after.pagehide_cleanup_contexts};
  }));
 }catch(e){await check('contract_or_infrastructure',{},()=>{throw e;});}
 finally{
  if(browser)await browser.close();if(server)await server.close();
  await check('capture_no_writes',{},async()=>{expect(r.side_effects.length===0,'zero production/storage/network writes',r.side_effects);return {writes:r.side_effects.length};});
  if(r.side_effects.length)r.hard_failures.push({code:'production_side_effect',message:'Commercial QA detected forbidden side effects',actual:r.side_effects});
  if(r.page_errors.length||r.console_errors.length)r.hard_failures.push({code:'commercial_browser_errors',message:'Browser errors',actual:{page:r.page_errors,console:r.console_errors}});
  if(hashTree(gameRoot)!==source)r.hard_failures.push({code:'source_tampered',message:'Commercial source changed'});
  await check('visual_evidence',{},async()=>{r.evidence_complete=visual.evidenceComplete(r,outDir);expect(r.evidence_complete,'all seven required screenshot/video phases exist and match hashes',r.artifacts.map(a=>a.phase));return true;});
  await check('visual_review',{},async()=>{const input=visual.packet(r,c);r.visual_review=visual.validateResponse(await reviewer.review(input),input);expect(r.visual_review.status==='COMPLETE'&&!r.visual_review.issues.some(i=>i.severity==='critical'),'complete corroborating review with no critical visual issues',r.visual_review);return {provider:r.visual_review.provider,aesthetics:r.visual_review.aesthetics};});
  for(const name of REQUIRED)if(!r.checks.some(x=>x.check===name))r.hard_failures.push({code:'commercial_missing_check',message:'Missing or physically blocked '+name,check:name});
  r.passed=r.hard_failures.length===0;save();
 }
 return r;
}
if(require.main===module){if(process.argv[2]!=='/input/qa.json'||!fs.existsSync('/input/qa.json'))throw Error('Commercial QA requires Docker; no host fallback');execute(readJSON(process.argv[2])).then(r=>{process.exitCode=r.passed?0:1;}).catch(e=>{console.error(e.stack);process.exitCode=1;});}
module.exports={execute,VERSION,REQUIRED};
