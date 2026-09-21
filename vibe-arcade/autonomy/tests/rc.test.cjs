'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {assertBranch,assertFiles,previewURL,smokePreview,GitHubVercelAdapter}=require('../adapters/github-vercel.cjs');
const {setup,mockQA}=require('./helpers.cjs');
test('release adapter cannot target main or production alias or protected paths',()=>{
  const id='GAME-20260921-001';assert.equal(assertBranch(id,'factory/'+id),'factory/'+id);
  for(const b of ['main','feature/test','factory/../main'])assert.throws(()=>assertBranch(id,b));
  for(const f of ['vibe-arcade/index.html','loopjolt-backend/edge/index.ts',`vibe-arcade/autonomy/games/${id}/v1/../secret.js`])assert.throws(()=>assertFiles(id,'v1',[f]));
  assert.equal(previewURL('https://vibe-arcade-unique-a2bsangsa.vercel.app'),'https://vibe-arcade-unique-a2bsangsa.vercel.app');
  for(const url of ['https://vibe-arcade-dun.vercel.app','http://evil.vercel.app','https://evil.invalid','https://x.vercel.app?token=secret'])assert.throws(()=>previewURL(url));
  assert.throws(()=>new GitHubVercelAdapter().productionShip(),/AUTO_PRODUCTION_SHIP=false/);
});
test('preview smoke matches every deployed runtime byte and only performs GET',async t=>{
  const {factory,spec}=setup(t,{qa:mockQA});await factory.create(spec);let m=await factory.run(spec.game_id);m={...m,preview_url:'https://vibe-arcade-rc.vercel.app'};
  const methods=[],root=factory.source(m),prefix=`/autonomy/games/${m.game_id}/${m.version}/`;
  const fetchImpl=async(url,options)=>{methods.push(options.method);const relative=new URL(url).pathname.slice(prefix.length);return new Response(fs.readFileSync(path.join(root,relative)));};
  const r=await smokePreview({manifest:m,gameRoot:root,fetchImpl});assert(r.passed);assert(r.checks.length>=6);assert(methods.every(x=>x==='GET'));
  const bad=await smokePreview({manifest:m,gameRoot:root,fetchImpl:async()=>new Response('stale')});assert(!bad.passed);assert(bad.hard_failures[0].message.includes('source_mismatch'));
  const redirect=await smokePreview({manifest:m,gameRoot:root,fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://vibe-arcade-dun.vercel.app/'}})});assert(!redirect.passed);
});
test('orchestrator resumes preview wait and smoke failure without rebuilding or spending repair attempts',async t=>{
  let prepared=0,smoked=0,qaCalls=0;
  const release={prepare:async({manifest:m})=>({branch:'factory/'+m.game_id,pr_number:1,pr_url:'https://github.com/andysong111/auto-lab/pull/1',rc_commit:'a'.repeat(40),...(++prepared>1?{preview_url:'https://vibe-arcade-rc.vercel.app',deployment_id:'1'}:{})}),smoke:async()=>({passed:++smoked>1})};
  const {factory,spec}=setup(t,{release,qa:c=>{qaCalls++;return mockQA(c);}});await factory.create(spec);
  assert.equal((await factory.run(spec.game_id,{rc:true})).state,'PREVIEW_DEPLOYING');
  assert.equal((await factory.run(spec.game_id,{rc:true})).state,'PREVIEW_SMOKE');
  const m=await factory.run(spec.game_id,{rc:true});assert.equal(m.state,'READY_TO_SHIP');assert.equal(m.repair_attempt,0);assert.equal(qaCalls,1);
});
test('GitHub adapter creates only isolated blobs/branch/draft PR, resumes CI and reuses one commit',async t=>{
  const crypto=require('node:crypto');
  const {factory,store,spec}=setup(t,{qa:mockQA});await factory.create(spec);const m=await factory.run(spec.game_id),gameRoot=factory.source(m);
  const base='b'.repeat(40),built='c'.repeat(40),calls=[],blobs=new Map();let head=null,tree=[],pr=null,ready=false,unsafe=false;
  const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  const fetchImpl=async(url,options)=>{
    const route=url.split('/repos/andysong111/auto-lab/')[1],method=options.method||'GET',body=options.body?JSON.parse(options.body):null;calls.push({route,method,body});
    if(route==='git/ref/heads/factory/'+m.game_id)return head?respond({object:{sha:head}}):respond({},404);
    if(route==='commits/main')return respond({sha:base});
    if(route==='git/refs'&&method==='POST'){assert.equal(body.ref,'refs/heads/factory/'+m.game_id);head=body.sha;return respond({object:{sha:head}});}
    if(route.startsWith('compare/'))return respond({files:unsafe?[{filename:'vibe-arcade/index.html',status:'modified'}]:tree.map(t=>({filename:t.path,status:'added'}))});
    if(route.startsWith('git/commits/')&&method==='GET')return respond({tree:{sha:'tree'}});
    if(route==='git/trees/tree?recursive=1')return respond({tree,truncated:false});
    if(route==='git/blobs') {const bytes=Buffer.from(body.content,'base64'),sha=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');blobs.set(sha,bytes);return respond({sha});}
    if(route==='git/trees'&&method==='POST'){tree=body.tree;for(const entry of tree)assert(entry.path.startsWith(`vibe-arcade/autonomy/games/${m.game_id}/v1/`));return respond({sha:'new-tree'});}
    if(route==='git/commits'&&method==='POST')return respond({sha:built});
    if(route==='git/refs/heads/factory/'+m.game_id&&method==='PATCH'){assert.equal(body.force,false);head=body.sha;return respond({object:{sha:head}});}
    if(route.startsWith('pulls?'))return respond(pr?[pr]:[]);
    if(route==='pulls'&&method==='POST'){assert(body.draft);assert.equal(body.base,'main');pr={number:45,html_url:'https://github.com/andysong111/auto-lab/pull/45'};return respond(pr);}
    if(route.endsWith('/check-runs?per_page=100'))return respond({total_count:3,check_runs:['Factory contracts','Factory browser','Factory regression'].map(name=>({name,conclusion:ready?'success':null}))});
    if(route.endsWith('/status'))return respond({state:ready?'success':'pending'});
    if(route.startsWith('deployments?'))return respond([{id:9,sha:built,production_environment:false,environment:'Preview'}]);
    if(route==='deployments/9/statuses?per_page=1')return respond([{state:'success',environment_url:'https://vibe-arcade-rc.vercel.app'}]);
    throw Error('unhandled fake GitHub route '+method+' '+route);
  };
  const adapter=new GitHubVercelAdapter({token:'test-token',fetchImpl});
  const pending=await adapter.prepare({manifest:m,gameRoot,store});assert(!pending.preview_url);assert.equal(pending.pr_number,45);
  ready=true;const passed=await adapter.prepare({manifest:m,gameRoot,store});assert.equal(passed.preview_url,'https://vibe-arcade-rc.vercel.app');
  assert.equal(calls.filter(c=>c.method==='POST'&&c.route==='git/commits').length,1);assert.equal(calls.filter(c=>c.method==='POST'&&c.route==='pulls').length,1);
  unsafe=true;await assert.rejects(()=>adapter.prepare({manifest:m,gameRoot,store}),/branch_path_isolation/);
});

test('preview bypass is scoped to validated origin and absent from artifacts',async t=>{
  const {factory,spec}=setup(t,{qa:mockQA});await factory.create(spec);const m={...await factory.run(spec.game_id),preview_url:'https://vibe-arcade-rc.vercel.app'};
  const root=factory.source(m),secret='test-only-preview-token',seen=[];
  const adapter=new GitHubVercelAdapter({previewBypassToken:secret,fetchImpl:async(url,o)=>{
    assert.equal(new URL(url).origin,m.preview_url);assert.equal(o.method,'GET');seen.push(o.headers['x-vercel-protection-bypass']);
    const rel=new URL(url).pathname.split('/v1/')[1];return new Response(fs.readFileSync(path.join(root,rel)));
  }});
  const result=await adapter.smoke({manifest:m,gameRoot:root});assert(result.passed);assert(seen.every(v=>v===secret));assert(!JSON.stringify(result).includes(secret));
});
