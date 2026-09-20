/* Opt-in production smoke for the user's approved deployment. Creates exactly one
 * random, disposable Play ID, submits NO scores, then deletes only that account.
 * Never prints secrets, network bodies or traces. Browser assertions use live endpoints. */
'use strict';
const {chromium,request}=require('playwright');
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const ORIGIN='https://vibe-arcade-dun.vercel.app';
const EDGE='https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community';
const OUT=process.env.QA_OUT||'/tmp/play-id-live';
const id='qa_'+crypto.randomBytes(5).toString('hex');
const password=crypto.randomBytes(32).toString('base64url'),replacement=crypto.randomBytes(32).toString('base64url');
const checks=[];let browser,ctx,api,created=false,deleted=false,recovery;
function ok(label,value){assert(value,label);checks.push(label);}
async function post(context,action,body={},edge=false,origin=ORIGIN){const res=await context.post((edge?EDGE:ORIGIN+'/api/play-id')+'?action='+action,{headers:{Origin:origin,'Content-Type':'application/json'},data:body,timeout:30000});let data={};try{data=await res.json();}catch{}return {status:res.status(),data};}
async function signIn(context,pass,country='KR',recover=false,code){const pre=await post(context,'auth_prepare',{id,password:pass,country,consent:true,age16:true,recover,...(code?{recoveryCode:code}:{})},true);ok('credential preparation '+(recover?'recovery':'login'),pre.status===200&&!!pre.data.ticket&&!pre.data.token);const ex=await post(context,'auth_exchange',{ticket:pre.data.ticket});ok('HttpOnly session exchange',ex.status===200&&!ex.data.token);return {pre:pre.data,session:ex.data};}
(async()=>{
 if(process.env.LOOPJOLT_LIVE_AUTH_SMOKE!=='approved-option-a')throw Error('explicit_live_smoke_opt_in_required');
 fs.mkdirSync(OUT,{recursive:true});
 api=await request.newContext();
 // Wait for both the reviewed UI and the explicitly enabled backend, not just HTTP 200.
 let ready=false;
 for(let i=0;i<60;i++){
  try{const c=await api.get(EDGE+'?action=config',{timeout:10000});const cfg=await c.json();const js=await api.get(ORIGIN+'/community/client.js',{timeout:10000});if(cfg.playIdReady&&(await js.text()).includes('auth_prepare')){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,5000));
 }
 ok('reviewed frontend and backend ready',ready);
 browser=await chromium.launch({headless:true});
 ctx=await browser.newContext({viewport:{width:430,height:932}});
 // Prevent QA navigation being counted as acquisition. No auth/game data is mocked.
 await ctx.route('**/api/event*',r=>r.abort());
 await ctx.route('**/api/telemetry*',r=>r.abort());
 const page=await ctx.newPage();const pageErrors=[];page.on('pageerror',()=>pageErrors.push('page_error'));
 page.on('response',async res=>{if(res.url().endsWith('?action=auth_prepare')&&res.status()===200){try{const d=await res.json();if(d.created)created=true;}catch{}}});
 const denied=await post(ctx.request,'profile',{},false,'https://untrusted.invalid');ok('cross-origin cookie request denied',denied.status===403);
 for(const [route,button,diagnostic] of [
  ['/descent/?capture=1','#play','DescentDiagnostics'],
  ['/challengers/play?game=core-pins&capture=1','#primary','CorePinsDiagnostics']
 ]){
  await page.goto(ORIGIN+route,{waitUntil:'networkidle'});
  await page.waitForFunction(sel=>!document.querySelector(sel).disabled,button);
  ok('guest start enabled '+route,await page.locator(button).isEnabled());
  await page.click(button);
  await page.waitForFunction(name=>globalThis[name]?.snapshot().state.tick>30,diagnostic);
  ok('guest gameplay active '+route,await page.evaluate(name=>!globalThis[name].snapshot().ranked,diagnostic));
 }
 await page.goto(ORIGIN+'/challengers/play?game=nova-merge&capture=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.querySelector('#primary').disabled);
 await page.click('#primary');await page.keyboard.press('4');await page.waitForTimeout(400);
 ok('Nova Merge free play starts without account',!(await page.locator('#status').textContent()).includes('Preparing'));
 await page.goto(ORIGIN+'/community/?panel=profile&returnTo=%2Fdescent%2F',{waitUntil:'networkidle'});
 await page.waitForSelector('#quickForm');
 await page.screenshot({path:path.join(OUT,'PlayID_Entry_mobile.png'),fullPage:true});
 await page.fill('#playId',id);await page.fill('#playPassword',password);await page.selectOption('#quickCountry','KR');await page.check('#quickConsent');
 await page.click('#quickContinue');
 await page.waitForSelector('#recoveryResult:not([hidden])',{timeout:40000});created=true;
 recovery=await page.locator('#recoveryCode').textContent();ok('one-time recovery displayed',/^ljr_[a-f0-9]{48}$/.test(recovery));
 const cookies=await ctx.cookies();const cookie=cookies.find(c=>c.name==='__Host-loopjolt_play');
 ok('secure HttpOnly SameSite cookie',!!cookie&&cookie.httpOnly&&cookie.secure&&cookie.sameSite==='Lax');
 const jsState=await page.evaluate(()=>({cookie:document.cookie,local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage)}));
 ok('session and recovery secrets not in script-readable storage',![cookie.value,recovery,password].some(s=>Object.values(jsState).some(v=>v.includes(s))));
 await page.click('#finishQuick');await page.waitForURL(ORIGIN+'/descent/');
 await page.waitForFunction(()=>LoopCommunity.profile?.handle?.startsWith('qa_'));
 ok('returns to selected game with identity',await page.evaluate(who=>LoopCommunity.profile.handle===who,id));
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>!!LoopCommunity.profile);
 ok('refresh keeps identity',await page.evaluate(who=>LoopCommunity.profile.handle===who,id));
 let r=await post(ctx.request,'save_profile',{handle:id,country:'US',consent:true,age16:true});
 ok('country switching is locked',r.status===400&&r.data.error==='country_locked_30_days');
 r=await post(ctx.request,'start',{game:'core-pins',version:'cp-phaser-v1'});ok('ranked start accepts Play ID',r.status===200&&!!r.data.runId);
 // No finish call: no QA score enters a public board. Deletion removes the unused run.
 r=await post(ctx.request,'auth_logout');ok('logout success',r.status===200);
 r=await post(ctx.request,'profile');ok('logged-out profile denied',r.status===401);
 r=await post(ctx.request,'auth_prepare',{id,password:password+'!',country:'KR'},true);ok('wrong password denied',r.status===401);
 const logged=await signIn(ctx.request,password,'US');ok('login never changes existing flag',logged.session.profile.country==='KR');
 r=await post(ctx.request,'auth_exchange',{ticket:logged.pre.ticket});ok('exchange replay denied',r.status===401);
 const beforeReset=await ctx.storageState();
 const recovered=await signIn(ctx.request,replacement,'KR',true,recovery);ok('recovery code rotates',!!recovered.pre.recoveryCode&&recovered.pre.recoveryCode!==recovery);
 const old=await request.newContext({storageState:beforeReset});r=await post(old,'profile');ok('recovery revokes prior session',r.status===401);await old.dispose();
 r=await post(ctx.request,'auth_prepare',{id,password:replacement,recover:true,recoveryCode:recovery},true);ok('used recovery code rejected',r.status===401);
 r=await post(ctx.request,'profile');ok('failed recovery preserves current session',r.status===200);
 r=await post(ctx.request,'delete_profile',{confirmation:'DELETE MY LOOPJOLT ACCOUNT'});ok('disposable QA account deleted',r.status===200);deleted=r.status===200;
 ok('no uncaught browser page errors',pageErrors.length===0);
 fs.writeFileSync(path.join(OUT,'live-auth-result.json'),JSON.stringify({sourceCommit:process.env.GITHUB_SHA,checks,passed:checks.length,createdTestAccount:created,deletedTestAccount:deleted,rankedScoresSubmitted:0,realEndpoints:true},null,2));
 console.log('PASS live Option A: '+checks.length+' checks; temporary account deleted; no ranked score submitted.');
})().catch(e=>{console.error('LIVE OPTION A FAILED:',String(e.message).slice(0,250));process.exitCode=1;}).finally(async()=>{
 if(created&&!deleted&&ctx){try{const r=await post(ctx.request,'delete_profile',{confirmation:'DELETE MY LOOPJOLT ACCOUNT'});deleted=r.status===200;}catch{}}
 if(created&&!deleted&&ctx){for(const pass of [replacement,password]){try{await signIn(ctx.request,pass);const r=await post(ctx.request,'delete_profile',{confirmation:'DELETE MY LOOPJOLT ACCOUNT'});if(r.status===200){deleted=true;break;}}catch{}}}
 if(created&&!deleted){console.error('QA cleanup requires review: '+id);process.exitCode=1;}
 try{await ctx?.close();await browser?.close();await api?.dispose();}catch{}
});
