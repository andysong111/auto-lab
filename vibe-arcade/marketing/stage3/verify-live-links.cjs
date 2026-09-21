/* Read-only release preflight. No sign-ins, no account creation, no score/event POSTs. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ORIGIN='https://vibe-arcade-dun.vercel.app';
const root=path.resolve(__dirname,'../..'),out=process.env.QA_OUT||'/tmp/loopjolt-stage3';fs.mkdirSync(out,{recursive:true});
const report={sourceCommit:process.env.GITHUB_SHA||null,checkedAt:new Date().toISOString(),readOnly:true,sourceParityRequired:process.env.EXPECT_DEPLOYED==='1',checks:[],profiles:[],backendConfig:null,errors:[]};
async function trace(u){const chain=[];for(let i=0;i<6;i++){const r=await fetch(u,{redirect:'manual',headers:{'User-Agent':'LoopJolt-Release-Preflight/1.0'},signal:AbortSignal.timeout(15000)});chain.push({url:u,status:r.status});if([301,302,303,307,308].includes(r.status)){u=new URL(r.headers.get('location'),u).href;await r.body?.cancel();continue;}return{chain,url:u,status:r.status,text:await r.text()};}throw Error('redirect_loop');}
const expect=(condition,label)=>{if(!condition)throw Error(label);};
(async()=>{
 if(report.sourceParityRequired){const wanted=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'league/home.js'))).digest('hex');for(let i=0;i<36;i++){try{const r=await trace(ORIGIN+'/league/home.js');if(crypto.createHash('sha256').update(r.text).digest('hex')===wanted)break;}catch{}await new Promise(r=>setTimeout(r,5000));}}
 for(const [slug,network] of [['ig','instagram'],['yt','youtube'],['tt','tiktok'],['th','threads'],['fb','facebook']]){
  try{const r=await trace(ORIGIN+'/'+slug),u=new URL(r.url);expect(r.status===200&&u.origin===ORIGIN,'invalid_landing');expect(u.searchParams.get('utm_source')===network&&u.searchParams.get('utm_medium')==='profile'&&u.searchParams.get('utm_campaign')==='alwayson','attribution_lost');expect(r.text.includes('/arcade3/telemetry.js'),'landing_telemetry_missing');report.checks.push({kind:'profile-route',slug,network,passed:true,chain:r.chain});}catch(e){report.errors.push(slug+': '+e.message);}
 }
 const campaign='flag_challenge_pilot_20260920';
 for(const [route,content,marker] of [['/descent/','dd_fc01','/descent/app.js'],['/challengers/play?game=core-pins','cp_fc01','/challengers/boot.js'],['/challengers/play?game=nova-merge','nm_fc01','/challengers/boot.js']]){
  const u=new URL(route,ORIGIN);for(const [k,v]of Object.entries({utm_source:'threads',utm_medium:'organic_social',utm_campaign:campaign,utm_content:content}))u.searchParams.set(k,v);
  try{const r=await trace(u.href),end=new URL(r.url);expect(r.status===200&&end.origin===ORIGIN&&r.text.includes(marker),'game_route_invalid');for(const k of ['utm_source','utm_medium','utm_campaign','utm_content'])expect(end.searchParams.get(k)===u.searchParams.get(k),'tracking_lost_'+k);report.checks.push({kind:'direct-game-route',content,passed:true,chain:r.chain});}catch(e){report.errors.push(content+': '+e.message);}
 }
 for(const file of ['league/home.js','arcade3/telemetry.js','community/client.js']){
  try{const r=await trace(ORIGIN+'/'+file);const a=crypto.createHash('sha256').update(r.text).digest('hex'),b=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');report.checks.push({kind:'source-parity',file,passed:a===b,liveSha256:a,expectedSha256:b});}catch(e){report.errors.push(file+': '+e.message);}
 }
 try{const r=await fetch('https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community?action=config',{signal:AbortSignal.timeout(15000)});const c=await r.json();report.backendConfig={status:r.status,playIdReady:c.playIdReady===true,loginReady:c.loginReady===true};expect(report.backendConfig.playIdReady,'play_id_not_ready');}catch(e){report.errors.push('backend: '+e.message);}
 for(const [network,url] of [['instagram','https://www.instagram.com/playloopjolt/'],['youtube','https://www.youtube.com/channel/UCKl5Kh2Nju1C67mBBcVb7Mw/about'],['tiktok','https://www.tiktok.com/@loopjolt2'],['threads','https://www.threads.com/@playloopjolt']]){
  try{const r=await trace(url);const escaped=r.text.replace(/\\u0026/g,'&').replace(/\\\//g,'/');const urls=[...new Set((escaped.match(/https?:[^\s"<>\\]+/g)||[]).filter(x=>x.startsWith(ORIGIN)).map(x=>x.slice(0,300)))].slice(0,8);report.profiles.push({network,status:r.status,foundSiteUrls:urls,websiteFieldVerified:false,reason:'HTTP text only; website/link field ownership and rendering not confirmed'});}catch(e){report.profiles.push({network,websiteFieldVerified:false,reason:e.message});}
 }
 report.passed=report.errors.length===0&&report.checks.every(c=>c.passed||c.kind==='source-parity'&&!report.sourceParityRequired);fs.writeFileSync(path.join(out,'live-links.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
})().catch(e=>{report.errors.push(e.message);fs.writeFileSync(path.join(out,'live-links.json'),JSON.stringify(report,null,2));console.error(e.message);process.exitCode=1;});
