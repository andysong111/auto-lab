'use strict';
// Bounded HTTP-only deployed check. Never executes browser JS or sends events/scores.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('../scripts/build-search-metadata.cjs');
async function get(route){const r=await fetch(S.ORIGIN+route,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'LoopJolt-ReadOnly-SEO-Check/1.0'}});assert.equal(r.status,200,route+' HTTP status');return {route,finalUrl:r.url,text:await r.text()};}
(async()=>{
 const checks=[];let ready=false;
 for(let i=0;i<24;i++){try{const r=await get('/');if(r.text.includes('<title>'+S.PAGES['index.html'].title+'</title>')){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}
 assert(ready,'deployed SEO build not ready');
 for(const [file,p] of Object.entries(S.PAGES)){const route=new URL(p.url).pathname,r=await get(route);assert(r.text.includes('<title>'+p.title+'</title>'));assert(r.text.includes('<link rel="canonical" href="'+p.url+'">'));assert.equal((r.text.match(/rel="canonical"/g)||[]).length,1);assert(r.text.includes('property="og:description"'));if(file==='index.html')assert(r.text.includes('<h2>Deep Descent</h2>'));checks.push({route,metadata:true});}
 const map=await get('/sitemap.xml');assert.equal(map.text.trim(),S.sitemap().trim());
 for(const route of S.URLS){const r=await get(route),u=new URL(r.finalUrl),expected=new URL(route,S.ORIGIN);assert.equal(u.origin,expected.origin);assert.equal(u.pathname,expected.pathname);assert.equal(u.search,expected.search);assert(!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(r.text));checks.push({route,status:200,queryPreserved:true});}
 const out=process.env.QA_OUT||'/tmp/loopjolt-search-live';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checkedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA,checks,passed:true,searchEngineIndexationVerified:false,analyticsEventsSent:0},null,2));console.log('PASS: 2 metadata pages, exact sitemap, 8 final URLs. Indexation/rank not claimed.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
