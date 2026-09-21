/* Read-only live Astra P2 release check. Never executes browser JS or submits game data. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base='https://vibe-arcade-dun.vercel.app',out=process.env.QA_OUT||'/tmp/astra-live';fs.mkdirSync(out,{recursive:true});
require('../scripts/build-astra-release.cjs').build(root);
const release=path.join(root,'release/astra-sentinel'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['index.html','style.css','polish.css','arena.js','arena-view.js','motion.js','polish.js','core.js','art.js','app.js'];
const report={at:new Date().toISOString(),commit:process.env.GITHUB_SHA,readOnly:true,checks:[],passed:false};
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'LoopJolt-Astra-P2-ReadOnly-QA/1.0'}});return {status:r.status,text:await r.text(),url:r.url};}
(async()=>{
 let ready=false,expected=hash(fs.readFileSync(path.join(release,'app.js')));
 for(let i=0;i<48;i++){try{const r=await get(base+'/release/astra-sentinel/app.js');if(r.status===200&&hash(r.text)===expected){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}
 assert(ready,'deployment_not_ready');
 const canonical=await get(base+'/games/astra-sentinel');assert.equal(canonical.status,200);
 assert.equal(hash(canonical.text),hash(fs.readFileSync(path.join(release,'index.html'))));report.checks.push({canonicalRoute:true,releaseHtmlExact:true});
 for(const f of files.filter(f=>f!=='index.html')){const route='/release/astra-sentinel/'+f,r=await get(base+route);assert.equal(r.status,200,f);assert.equal(hash(r.text),hash(fs.readFileSync(path.join(release,f))),f+' differs');report.checks.push({route,exactSource:true});}
 assert(canonical.text.includes('Astra Sentinel — Nine-Gate Arena Roguelite'));assert(!/PLAYTEST|NOT LIVE|noindex/.test(canonical.text));assert(canonical.text.includes('SPACE / TAP · READY')===false);
 const alias=await get(base+'/games/astra-sentinel/?utm_source=qa&capture=1');assert.equal(alias.status,200);assert.equal(new URL(alias.url).pathname,'/games/astra-sentinel');assert.equal(new URL(alias.url).searchParams.get('capture'),'1');report.checks.push({canonicalSlashRedirect:true,queryPreserved:true});
 const home=await get(base+'/');assert.equal(home.status,200);assert(home.text.includes('astra-feature')&&home.text.includes('href="/games/astra-sentinel"'));assert.equal((home.text.match(/class="game-card"/g)||[]).length,4);report.checks.push({homeLink:true,existingFourCardsPreserved:true});
 const sitemap=await get(base+'/sitemap.xml');assert.equal(sitemap.status,200);assert(sitemap.text.includes('<loc>'+base+'/games/astra-sentinel</loc>'));report.checks.push({sitemapDiscovery:true});
 const dd=await get(base+'/descent');assert.equal(dd.status,200);assert(dd.text.includes('Deep Descent'));report.checks.push({referenceGameAvailable:true});
 const verify=await get(base+'/google6335338393f57b11.html');assert.equal(verify.status,200);assert.equal(verify.text.trim(),'google-site-verification: google6335338393f57b11.html');report.checks.push({gscVerificationPreserved:true});report.passed=true;
})().catch(e=>{report.error=e.message;process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
