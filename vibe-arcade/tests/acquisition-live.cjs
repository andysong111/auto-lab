/* Read-only production verification: no event, account or score submissions. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
// Match the production build order, including the concurrently merged stage-3 SEO pass.
require('../scripts/build-search-metadata.cjs').build();require('../scripts/build-discovery.cjs').build();
const root=path.resolve(__dirname,'..'),origin='https://vibe-arcade-dun.vercel.app',out=process.env.QA_OUT||'/tmp/acquisition-live';fs.mkdirSync(out,{recursive:true});
const result={at:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,readOnly:true,checks:[],errors:[]};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'LoopJolt-Acquisition-ReadOnly-QA/1.0'}});return {status:r.status,url:r.url,text:await r.text()};}
(async()=>{
 let ready=false;const expected=hash(fs.readFileSync(path.join(root,'arcade3/telemetry.js')));
 for(let i=0;i<48;i++){try{const r=await get(origin+'/arcade3/telemetry.js');if(r.status===200&&hash(r.text)===expected){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}assert(ready,'deployment_not_ready');
 for(const [route,file] of [['/','index.html'],['/descent','descent/index.html'],['/games/core-pins','games/core-pins/index.html'],['/games/nova-merge','games/nova-merge/index.html'],['/games/orbit-sprint','games/orbit-sprint/index.html'],['/sitemap.xml','sitemap.xml'],['/community/privacy','community/privacy.html'],['/arcade3/telemetry.js','arcade3/telemetry.js'],['/analytics.js','analytics.js'],['/challengers/boot.js','challengers/boot.js'],['/challengers/game.js','challengers/game.js']]){
  const r=await get(origin+route);assert.equal(r.status,200,route);assert.equal(hash(r.text),hash(fs.readFileSync(path.join(root,file))),route+' source mismatch');result.checks.push({route,status:r.status,exactBuildMatch:true});
 }
 for(const slug of ['core-pins','nova-merge']){const u=origin+'/games/'+slug+'?utm_source=threads&utm_medium=organic_social&utm_campaign=flag_challenge_pilot_20260920&utm_content=qa_read_only';const r=await get(u),end=new URL(r.url);assert.equal(r.status,200);assert.equal(end.searchParams.get('utm_content'),'qa_read_only');result.checks.push({route:'/games/'+slug,taggedQueryPreserved:true});}
 const config=await get('https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community?action=config');const c=JSON.parse(config.text);assert(c.playIdReady&&c.loginReady);result.checks.push({existingOptionAReady:true});
 const collector=await get(origin+'/api/event');assert.equal(collector.status,405);result.checks.push({collectorGetRejected:true});
 const edge=await get('https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-acquisition');assert.equal(edge.status,401);result.checks.push({edgeUnauthenticatedRejected:true});
 result.passed=true;
})().catch(e=>{result.passed=false;result.errors.push(e.message);process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));});
