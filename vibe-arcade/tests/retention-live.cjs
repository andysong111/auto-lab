/* Read-only live comparison of exact built assets. No JS execution, events or scores. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),origin='https://vibe-arcade-dun.vercel.app',out=process.env.QA_OUT||'/tmp/retention-live';
const files=['experience/replay-kit.js','experience/replay-kit.css','experience/entry-hints.js','descent/app.js','core-pins/bundle.js','challengers/boot.js','challengers/game.js','experience/session-ui.js','games/orbit-sprint/game.js'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={at:new Date().toISOString(),commit:process.env.GITHUB_SHA,readOnly:true,productionWrites:0,checks:[],passed:false};
async function get(p){const r=await fetch(origin+p,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'LoopJolt-Retention-ReadOnly-QA/1.0'}});return {status:r.status,text:await r.text(),url:r.url};}
(async()=>{
 let ready=false;for(let i=0;i<36;i++){try{const r=await get('/experience/replay-kit.js');if(r.status===200&&hash(r.text)===hash(fs.readFileSync(path.join(root,files[0])))){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}assert(ready,'deployment_not_ready');
 for(const f of files){const r=await get('/'+f);assert.equal(r.status,200,f);assert.equal(hash(r.text),hash(fs.readFileSync(path.join(root,f))),f+' differs');report.checks.push({file:f,exactBuildMatch:true});}
 for(const [url,file] of [['/','index.html'],['/descent','descent/index.html'],['/games/core-pins','games/core-pins/index.html'],['/games/nova-merge','games/nova-merge/index.html'],['/games/orbit-sprint','games/orbit-sprint/index.html'],['/challengers/play?game=core-pins','challengers/play.html']]){const r=await get(url);assert.equal(r.status,200,url);assert.equal(hash(r.text),hash(fs.readFileSync(path.join(root,file))),url+' HTML differs');report.checks.push({url,exactBuildMatch:true});}
 const verify=await get('/google6335338393f57b11.html');assert.equal(verify.status,200);assert.equal(verify.text.trim(),'google-site-verification: google6335338393f57b11.html');report.checks.push({gscOwnershipPreserved:true});
 const c=await fetch('https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community?action=config',{signal:AbortSignal.timeout(10000)}).then(r=>r.json());assert(c.playIdReady&&c.loginReady);report.checks.push({optionAReady:true});report.passed=true;
})().catch(e=>{report.error=e.message;process.exitCode=1;}).finally(()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
