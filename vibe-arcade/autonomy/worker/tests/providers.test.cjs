'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup,request,MockProvider,output}=require('./helpers.cjs');
const {ProviderManager,estimateInputTokens}=require('../../providers/manager.cjs');
const {ProviderPause,modelError}=require('../../providers/errors.cjs');
const {validateOutput,applyOutput,responseSchema}=require('../../providers/output.cjs');
const {OpenAIProvider}=require('../../providers/openai.cjs');
const {compile,instructions}=require('../../providers/prompts.cjs');
const {requestFor}=require('../../orchestrator/repair.cjs');
const {AIRepairAdapter}=require('../../adapters/ai.cjs');
const {copyGame,atomicJSON,hashTree,hash}=require('../../orchestrator/files.cjs');
const {config,pricing}=require('../../providers/config.cjs');
const policy=require('../../policies/quality-gate.json');
const {normalizeIsolatedResult}=require('../../isolation/docker-qa.cjs');
test('successful mock output is validated, persisted and deduplicated by immutable operation ID',async t=>{
  const e=setup(t),r=await request(e),a=await e.manager.execute(r);
  assert.equal(a.status,'complete');assert.equal(a.provider_metadata.cost_basis,'estimated');assert.equal(a.provider_metadata.billed_cost,null);
  const resumed=new ProviderManager({root:e.root,provider:e.provider,config:e.limits,prices:pricing(null,{mock:true})});
  assert.deepEqual(await resumed.execute(r),a);assert.equal(e.provider.submissions,1);
  await assert.rejects(()=>resumed.execute({...r,immutable_spec:{...r.immutable_spec,title:'tampered'}}),{code:'operation_id_conflict'});
});
for(const [name,value,code] of [
  ['malformed JSON','not json','model_output_invalid_json'],['unexpected metadata',{...output(),provider_metadata:{approved:true}},'model_output_invalid_schema'],
  ['path escape',{...output(),files:[{path:'../../index.html',content:'bad'}]},'path_isolation'],
  ['factory-owned kit',{...output(),files:[{path:'gamekit.js',content:'bad'}]},'path_isolation'],
  ['factory-owned phaser bridge',{...output(),files:[{path:'phaserkit.js',content:'bad'}]},'path_isolation'],
  ['CDN',{...output(),files:[{path:'app.js',content:'fetch("https://cdn.invalid/x.js")'}]},'external_runtime_dependency'],
  ['DOM core',output({content:'document.write("bad")'}),'core_dom_dependency'],
  ['Phaser in core',output({content:'const x=Phaser.VERSION; globalThis.GameCore={create(){return{}},step(){},observe(){return {tick:0,score:0,progress:0,interactions:0,entities:0}},terminal(){return false}};'}),'core_dom_dependency'],
  ['missing files',{...output(),files:[{path:'style.css',content:'body{}'}]},'model_missing_file']]) {
  test('reject '+name,async t=>{const e=setup(t),r=await request(e);assert.throws(()=>validateOutput(value,r,e.limits.request),new RegExp(code));});
}
test('all paths are validated before any file write; existing workspace symlinks are blocked',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),dir=path.join(e.root,`autonomy/.work/${m.game_id}/v1`);
  const outside=path.join(e.root,'protected.txt');fs.writeFileSync(outside,'unchanged');fs.symlinkSync(outside,path.join(dir,'app.js'));
  assert.throws(()=>applyOutput(output(),dir,e.root,m),/path_isolation/);assert.equal(fs.readFileSync(outside,'utf8'),'unchanged');
  assert.throws(()=>applyOutput(output(),e.root,e.root,m),/workspace identity/);
});
test('provider timeout is bounded and unknown submission is never re-posted',async t=>{
  const provider=new MockProvider({handler:()=>new Promise(()=>{})}),e=setup(t,{provider,limits:{request:{timeout_ms:20}}}),r=await request(e);
  await assert.rejects(()=>e.manager.execute(r),{code:'provider_timeout'});
  await assert.rejects(()=>e.manager.execute(r),{code:'provider_submission_uncertain'});assert.equal(provider.submissions,1);
});
test('known response ID survives manager restart; retry is retrieval, not a second generation',async t=>{
  const provider=new MockProvider({handler:async c=>{if(!c.response_id){c.onResponseId('resp_recover');throw new ProviderPause('provider_network_error');}assert.equal(c.response_id,'resp_recover');return {output:output()};}}),e=setup(t,{provider}),r=await request(e);
  await assert.rejects(()=>e.manager.execute(r),{code:'provider_network_error'});
  const next=new ProviderManager({root:e.root,provider,config:e.limits,prices:pricing(null,{mock:true})});assert.equal((await next.execute(r)).status,'complete');assert.equal(provider.submissions,1);
});
test('network failure and model failure remain distinct; cached model failure is not called again',async t=>{
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_failed');throw modelError('model_failure');}}),e=setup(t,{provider}),r=await request(e);
  for(let n=0;n<2;n++)await assert.rejects(()=>e.manager.execute(r),x=>x.code==='model_failure'&&!x.factory_pause);
  assert.equal(provider.calls,1);
});
for(const [name,limits,prices] of [
  ['game call limit',{per_game:{max_provider_calls:1}},null],['daily call limit',{global:{daily_provider_call_limit:1}},null],
  ['input token limit',{per_game:{max_input_tokens:1}},null],['output token limit',{per_game:{max_output_tokens:1}},null],
  ['game cost limit',{per_game:{max_estimated_cost:0}},{input_per_million:1,output_per_million:1}],
  ['daily cost limit',{global:{daily_cost_limit:0}},{input_per_million:1,output_per_million:1}]]) {
  test('budget: '+name,async t=>{const e=setup(t,{limits,manager:prices?{prices}:undefined}),r=await request(e);
    if(name.includes('call limit'))await e.manager.execute(r);
    const calls=e.provider.calls;await assert.rejects(()=>e.manager.execute(name.includes('call limit')?{...r,operation_id:r.game_id+'/repair/1'}:r),x=>x.worker_status==='PAUSED_BUDGET');assert.equal(e.provider.calls,calls);
  });
}
test('wall clock budget includes downtime and refuses new calls after expiry',async t=>{
  let now=100000;const e=setup(t,{manager:{now:()=>now},limits:{per_game:{max_wall_clock_minutes:0.001}}}),r=await request(e);await e.manager.execute(r);now+=61;
  await assert.rejects(()=>e.manager.execute({...r,operation_id:r.game_id+'/repair/1'}),{code:'game_wall_clock_limit'});
});
test('reported usage exceeding reservation permanently pauses without replaying provider',async t=>{
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_over');return {output:output(),usage:{input_tokens:1000000,output_tokens:1}};}}),e=setup(t,{provider}),r=await request(e);
  for(let i=0;i<2;i++)await assert.rejects(()=>e.manager.execute(r),x=>x.worker_status==='PAUSED_BUDGET');assert.equal(provider.calls,1);
});
test('prices require explicit recent estimates and invalid budgets/concurrency are rejected',()=>{
  assert.throws(()=>pricing(),/pricing_not_verified/);assert.throws(()=>pricing({as_of:'2000-01-01',input_per_million:1,output_per_million:1}),/pricing_not_verified/);
  assert.throws(()=>config({global:{max_concurrent_builds:2}}),/global.max_concurrent_builds/);
  assert.equal(pricing({as_of:new Date().toISOString(),input_per_million:1,output_per_million:1}).estimated,true);
});
test('repair compiler preserves original Factory request, QA identity and narrows CSS-only repairs',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),old=path.join(e.root,m.source_path);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),old);
  m.source_hash=hashTree(old);const failures=[{code:'overflow',message:'mobile overflow'}],req=requestFor(m,{hard_failures:failures});
  atomicJSON(e.store.artifact(m.game_id,'v1/qa.json'),{game_id:m.game_id,version:'v1',source_hash:m.source_hash,hard_failures:failures,passed:false,browser_cases:[]});
  const prompt=compile({root:e.root,workspace:old,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id,budget:r.budget});
  assert.equal(prompt.repair_request.operation_id,req.operation_id);assert.equal(prompt.repair_request.repair_stage,'technical');assert(!('qa_failures' in prompt.repair_request));assert.deepEqual(prompt.allowed_paths,['style.css','index.html']);assert.deepEqual(Object.keys(prompt.sources).sort(),['index.html','style.css']);
  assert.throws(()=>validateOutput(output({repair:true}),prompt,e.limits.request),/path_isolation/);
  req.qa_failures=[{code:'production_side_effect',message:'blocked POST'}];assert.throws(()=>compile({root:e.root,workspace:old,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id}),/production_side_effect/);
  assert(instructions.includes('ORIGINAL')&&instructions.includes('No CDN'));assert.deepEqual(policy.fatal_codes,['production_side_effect','path_isolation','source_tampered']);
});
test('OpenAI is unavailable without key/model or explicit paid-call authorization; no fetch occurs',async()=>{
  let calls=0;const p=new OpenAIProvider({apiKey:'',model:'',fetchImpl:()=>calls++});assert.throws(()=>p.assertAvailable(),{code:'provider_unavailable'});
  assert.throws(()=>new OpenAIProvider({apiKey:'fake-test-key',model:'configured-model',paidCallsAuthorized:false}).assertAvailable(),{code:'paid_call_not_authorized'});assert.equal(calls,0);
});
test('OpenAI Responses uses strict file output, durable background ID, no tools, fixed official origin and GET resumption',async()=>{
  const calls=[],ids=[];let polls=0;const completed={id:'resp_test',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output())}]}],usage:{input_tokens:1,output_tokens:2}};
  const p=new OpenAIProvider({apiKey:'fake-test-key',model:'configured-model',paidCallsAuthorized:true,poll_ms:1,fetchImpl:async(url,opts)=>{
    calls.push({url,opts});return new Response(JSON.stringify(opts.method==='POST'?{id:'resp_test',status:'queued'}:completed),{status:200});}});
  const args={request:{operation_id:'GAME-20260921-001/build/v1',game_id:'GAME-20260921-001'},instructions,schema:responseSchema,max_output_tokens:1000,max_response_bytes:100000,onResponseId:id=>ids.push(id),signal:new AbortController().signal};
  await p.generate(args);await p.generate({...args,response_id:'resp_test'});
  assert.equal(calls.filter(c=>c.opts.method==='POST').length,1);assert(calls.every(c=>c.url.startsWith('https://api.openai.com/v1/responses')));
  const body=JSON.parse(calls[0].opts.body);assert(body.background&&body.store);assert.deepEqual(body.tools,[]);assert.equal(body.text.format.strict,true);assert.deepEqual(ids,['resp_test','resp_test']);
  assert.equal(calls[0].opts.headers['X-Client-Request-Id'],args.request.operation_id);
});
for(const [status,code] of [[401,'provider_unavailable'],[429,'provider_rate_limited'],[503,'provider_network_error']])test('OpenAI HTTP '+status+' is classified and never SDK-retried',async()=>{
  let calls=0;const p=new OpenAIProvider({apiKey:'fake',model:'test',paidCallsAuthorized:true,fetchImpl:async()=>{calls++;return new Response('{}',{status});}});
  await assert.rejects(()=>p.http('https://api.openai.com/v1/responses'),{code});assert.equal(calls,1);
});
test('missing provider output is model failure, not a retryable network error',async t=>{
  const e=setup(t,{provider:new MockProvider({handler:async()=>({})})}),r=await request(e);await assert.rejects(()=>e.manager.execute(r),e=>e.model_failure&&e.code==='model_output_invalid_schema');
});
test('ledger storage failure pauses before any provider submission',async t=>{
  const e=setup(t),r=await request(e);e.manager.save=()=>{const err=Error('disk failure');err.code='ENOSPC';throw err;};
  await assert.rejects(()=>e.manager.execute(r),{code:'provider_state_unavailable'});assert.equal(e.provider.calls,0);
});
test('repair scope honors additional protections in the original Factory request',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),work=path.join(e.root,`autonomy/.work/${m.game_id}/v1`);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),work);
  const req=requestFor(m,{hard_failures:[{code:'overflow',message:'layout'}]});req.protected_paths.push('index.html');
  const prompt=compile({root:e.root,workspace:work,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id,budget:r.budget});assert.deepEqual(prompt.allowed_paths,['style.css']);assert.equal(prompt.repair_request.operation_id,req.operation_id);assert.equal(prompt.repair_request.repair_stage,'technical');assert(!('qa_failures' in prompt.repair_request));
});
test('maximum file/output size is rejected before applying any bytes',async t=>{
  const e=setup(t),r=await request(e);assert.throws(()=>validateOutput(output({content:'x'.repeat(e.limits.request.max_file_bytes+1)}),r,e.limits.request),{code:'model_file_too_large'});
  assert.throws(()=>validateOutput('x'.repeat(e.limits.request.max_response_bytes+1),r,e.limits.request),{code:'model_output_too_large'});
});

test('DOM-core rejection records exact line and quarantines files without applying them',async t=>{
  const bad='(()=>{ const core={create(){},step(){},observe(){},terminal(){}};\nwindow.BadCore=core;\n})();';
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_dom_bad');return {output:output({content:bad}),usage:{input_tokens:100,output_tokens:100}};}});
  const e=setup(t,{provider}),r=await request(e);
  await assert.rejects(()=>e.manager.execute(r),x=>x.code==='core_dom_dependency'&&/line 2 uses window/.test(x.message)&&/globalThis/.test(x.message));
  const op=e.manager.read().operations[r.operation_id];
  assert.equal(op.state,'MODEL_FAILED');assert.equal(op.error_context.file,'core.js');assert.equal(op.error_context.line,2);assert.equal(op.error_context.identifier,'window');
  assert(op.rejected_output.files.some(f=>f.path==='core.js'&&f.content===bad));
  const workspace=path.join(e.root,`autonomy/.work/${r.game_id}/v1`);
  assert.deepEqual(fs.readdirSync(workspace),[],'rejected model files must never be applied to candidate workspace');
});
test('repair compiler receives quarantined rejected source and validation guidance when no accepted workspace exists',async t=>{
  const bad='(()=>{ const core={create(){},step(){},observe(){},terminal(){}};\nwindow.BadCore=core;\n})();';
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_dom_context');return {output:output({content:bad}),usage:{input_tokens:100,output_tokens:100}};}});
  const e=setup(t,{provider}),build=await request(e);
  await assert.rejects(()=>e.manager.execute(build),{code:'core_dom_dependency'});
  const m=e.store.get(e.spec.game_id),req=requestFor(m,{hard_failures:[{code:'build_failed',message:e.manager.read().operations[build.operation_id].error_detail}]});
  const workspace=path.join(e.root,`autonomy/.work/${m.game_id}/v2`);fs.mkdirSync(workspace,{recursive:true});
  const rejected=e.manager.rejectedContext(m.game_id,1);
  const prompt=compile({root:e.root,workspace,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id,budget:build.budget,rejected});
  assert.equal(prompt.model_validation.error_code,'core_dom_dependency');assert.match(prompt.model_validation.error_detail,/globalThis/);
  assert.equal(prompt.sources['core.js'],bad);assert.equal(prompt.empty_workspace,true);
  assert(prompt.gamekit_contract.files['core.js'].includes('globalThis.GameCore'));assert.equal(prompt.gamekit_contract.phaser.version,'4.2.1');assert(prompt.gamekit_contract.factory_supplied.includes('phaser.js')&&prompt.gamekit_contract.factory_supplied.includes('phaserkit.js'));
});
test('quarantine excludes unsafe output paths from future repair context',async t=>{
  const e=setup(t),r=await request(e),bad={...output(),files:[...output().files,{path:'../../steal.txt',content:'secret-looking-data'}]};
  const provider=new MockProvider({handler:async c=>{c.onResponseId('resp_bad_path');return {output:bad,usage:{input_tokens:100,output_tokens:100}};}});e.manager.provider=provider;
  await assert.rejects(()=>e.manager.execute(r),/path_isolation/);
  const q=e.manager.read().operations[r.operation_id].rejected_output;
  assert(q&&!q.files.some(f=>f.path.includes('..')));
});

test('repair compiler keeps only the active Product stage and tolerates timeout-shaped optional arrays',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),old=path.join(e.root,m.source_path);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),old);
  m.source_hash=hashTree(old);
  const failure={code:'product_timeout',message:'Product QA did not produce a completed report'};
  const req=requestFor(m,{hard_failures:[failure]});
  atomicJSON(e.store.artifact(m.game_id,'v1/qa.json'),{
    game_id:m.game_id,version:'v1',source_hash:m.source_hash,passed:false,hard_failures:[failure],console_errors:[],page_errors:[],browser_cases:[],
    technical_qa:{passed:true},
    product_qa:{passed:false,hard_failures:[failure],screenshots:['product-partial.png'],duration_ms:150000},
    commercial_qa:{passed:false,hard_failures:[{code:'commercial_timeout',message:'deferred'}],screenshots:['commercial-partial.png'],duration_ms:240000}
  });
  const prompt=compile({root:e.root,workspace:old,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id,budget:r.budget});
  assert.equal(prompt.repair_request.repair_stage,'product');
  assert.deepEqual(prompt.qa_evidence.product_qa.checks,[]);
  assert.deepEqual(prompt.qa_evidence.product_qa.artifacts,[]);
  assert.equal(prompt.qa_evidence.product_qa.hard_failures[0].code,'product_timeout');
  assert.equal(prompt.qa_evidence.commercial_qa,null);
  assert(prompt.previous_failures.some(f=>f.code==='product_timeout'));
});

test('unexpected trusted repair-context compiler fault pauses before provider submission',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),old=path.join(e.root,m.source_path);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),old);
  m.source_hash=hashTree(old);
  const req=requestFor(m,{hard_failures:[{code:'freeze',message:'repair me'}]});
  const qaFile=e.store.artifact(m.game_id,'v1/qa.json');fs.mkdirSync(path.dirname(qaFile),{recursive:true});fs.writeFileSync(qaFile,'{broken json');
  let calls=0;
  const manager={rejectedContext:()=>null,config:e.limits,execute:async()=>{calls++;throw Error('must not submit');},guard:async()=>{},signal:null};
  const adapter=new AIRepairAdapter({root:e.root,manager});
  await assert.rejects(()=>adapter.repair({workspace:old,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id}),
    e=>e.factory_pause===true&&e.code==='provider_context_compilation_failed'&&e.worker_status==='PAUSED_ERROR');
  assert.equal(calls,0);
});

test('isolated timeout preserves trusted partial QA evidence instead of collapsing it to a bare timeout',()=>{
  const manifest={game_id:'GAME-20260923-999',version:'v5'},source='abc123',started=1000;
  const partial={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:source,policy_hash:hash(policy),passed:false,
    hard_failures:[{code:'commercial_action_feedback',message:'partial defect'}],checks:[{check:'action_feedback',status:'FAIL'}],artifacts:[{path:'commercial-390-before.png'}],
    screenshots:['commercial-390-before.png'],side_effects:[],console_errors:[],page_errors:[],browser_cases:[],duration_ms:239000};
  const result=normalizeIsolatedResult({result:partial,outcome:{code:124,expired:true},manifest,source,policy,started,now:()=>241500});
  assert.equal(result.passed,false);assert.equal(result.checks.length,1);assert.equal(result.artifacts.length,1);assert(result.hard_failures.some(f=>f.code==='commercial_action_feedback'));
  assert(result.hard_failures.some(f=>f.code==='timeout'&&f.partial_report===true));assert.equal(result.duration_ms,240500);
});

test('request input budget is token-estimated, not raw UTF-8 bytes',()=>{
  const payload={instructions:'x'.repeat(60000),request:{blob:'y'.repeat(40000)},schema:{type:'object'}};
  const e=estimateInputTokens(payload);
  assert(e.bytes>100000);assert(e.tokens<100000);
});

test('structural repair keeps broad candidate scope after staged stagnation',async t=>{
  const e=setup(t),r=await request(e),m=e.store.get(e.spec.game_id),work=path.join(e.root,m.source_path);copyGame(path.resolve(__dirname,'../../fixtures/dummy'),work);
  m.source_hash=hashTree(work);const failure={code:'overflow',message:'persistent layout'};
  const req=requestFor(m,{hard_failures:[failure]});req.repair_strategy='structural_rewrite';
  atomicJSON(e.store.artifact(m.game_id,'v1/qa.json'),{game_id:m.game_id,version:'v1',source_hash:m.source_hash,hard_failures:[failure],passed:false,browser_cases:[]});
  const prompt=compile({root:e.root,workspace:work,manifest:{...m,version:'v2'},spec:e.spec,request:req,operationId:req.operation_id,budget:r.budget});
  assert(prompt.allowed_paths.includes('core.js'));assert(prompt.allowed_paths.includes('app.js'));assert(prompt.allowed_paths.includes('style.css'));assert(prompt.allowed_paths.includes('index.html'));
});

test('presentation runtime bypass is rejected while PhaserKit helper usage is allowed',async t=>{
  const e=setup(t),r=await request(e),base=output();
  const app=JSON.parse(JSON.stringify(base));app.files.find(f=>f.path==='app.js').content='new Phaser.Game({});';
  assert.throws(()=>validateOutput(app,r,e.limits.request),/presentation_runtime_bypass/);
  const art=JSON.parse(JSON.stringify(base));art.files.find(f=>f.path==='view/art.js').content='function sync(scene){scene.tweens.add({targets:{}})}';
  assert.throws(()=>validateOutput(art,r,e.limits.request),/presentation_runtime_bypass/);
  const safe=JSON.parse(JSON.stringify(base));safe.files.find(f=>f.path==='view/art.js').content='function sync(scene,snapshot,api){api.tween({x:0},{x:1,duration:100})} globalThis.GameArt={create(){},sync};';
  assert.doesNotThrow(()=>validateOutput(safe,r,e.limits.request));
});
