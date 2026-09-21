/* Separate native-page evidence collection: hosted-file player failures must not
 * skip Instagram. No login, stealth, proxies, likes, comments, or publications. */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const OUT=process.env.QA_OUT||'/tmp/loopjolt-first-release';fs.mkdirSync(OUT,{recursive:true});
const r={checkedAt:new Date().toISOString(),reel:'https://www.instagram.com/reel/Ddh9RSXDUJH/',platformVerified:false,profileVerified:false,fanoutAllowed:false};
const safe=e=>String(e.message||'error').split('\n')[0].slice(0,200);
(async()=>{let browser,ctx;
try{
 browser=await chromium.launch({headless:true});ctx=await browser.newContext({viewport:{width:430,height:932},recordVideo:{dir:path.join(OUT,'native-recording'),size:{width:430,height:932}}});
 const page=await ctx.newPage();page.setDefaultTimeout(10000);
 try{
  const response=await page.goto(r.reel,{waitUntil:'domcontentloaded',timeout:30000});r.httpStatus=response?.status();await page.waitForTimeout(6000);
  r.finalPath=new URL(page.url()).pathname;r.title=await page.title();const text=await page.locator('body').innerText();
  r.identityVisible=text.includes('playloopjolt');r.captionVisible=text.includes('Which flag clears 48');r.videoElements=await page.locator('video').count();
  r.loginWall=/login|challenge/.test(r.finalPath)||(!r.videoElements&&/Log in|Login|Log Into/i.test(text));
  await page.screenshot({path:path.join(OUT,'instagram-public-page.png')});
  if(r.videoElements===1&&r.identityVisible&&r.captionVisible&&!r.loginWall){
   r.mediaBefore=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:Number.isFinite(v.duration)?v.duration:null,readyState:v.readyState,error:v.error?.code||null}));
   r.playback=await page.locator('video').evaluate(async v=>{
    if(!Number.isFinite(v.duration)||v.duration>25)return {completed:false,reason:'unexpected_video'};
    v.loop=false;v.muted=true;v.playbackRate=1;v.currentTime=0;const begin=performance.now();let calls=0,last=0,gap=0,active=true;
    function frame(t){if(!active)return;calls++;if(last)gap=Math.max(gap,t-last);last=t;v.requestVideoFrameCallback?.(frame);}v.requestVideoFrameCallback?.(frame);
    return await new Promise(resolve=>{let done=false;function finish(reason){if(done)return;done=true;active=false;clearTimeout(timer);const q=v.getVideoPlaybackQuality?.();resolve({completed:reason==='ended',reason,duration:v.duration,currentTime:v.currentTime,rate:v.playbackRate,elapsedMs:performance.now()-begin,frameCallbacks:calls,maxFrameCallbackGapMs:gap,decodedFrames:q?.totalVideoFrames,droppedFrames:q?.droppedVideoFrames});}const timer=setTimeout(()=>finish('timeout'),30000);v.addEventListener('ended',()=>finish('ended'),{once:true});v.play().catch(()=>finish('play_rejected'));});
   });
   const source=await page.locator('video').evaluate(v=>v.currentSrc);
   if(/^https:\/\//.test(source)&&/(^|\.)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(new URL(source).hostname)){
    const response=await ctx.request.get(source,{timeout:30000,maxRedirects:0});if(response.ok()){const bytes=await response.body();if(bytes.length<=50*1024*1024&&bytes.subarray(0,64).includes(Buffer.from('ftyp'))){fs.writeFileSync(path.join(OUT,'instagram-transcoded.mp4'),bytes);r.nativeBytesSaved=bytes.length;}}
   }
  }
 }catch(e){r.reelError=safe(e);await page.screenshot({path:path.join(OUT,'instagram-error.png')}).catch(()=>{});}
 try{
  await page.goto('https://www.instagram.com/playloopjolt/',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(3000);
  r.profileFinalPath=new URL(page.url()).pathname;const hrefs=await page.locator('a').evaluateAll(n=>n.map(a=>a.href));const links=[];
  for(const h of hrefs){try{let u=new URL(h);if(u.hostname==='l.instagram.com'&&u.searchParams.get('u'))u=new URL(u.searchParams.get('u'));if(u.hostname==='vibe-arcade-dun.vercel.app')links.push(u.origin+u.pathname);}catch{}}
  r.profileLinks=[...new Set(links)];r.profileVerified=links.includes('https://vibe-arcade-dun.vercel.app/ig');await page.screenshot({path:path.join(OUT,'instagram-profile.png')});
 }catch(e){r.profileError=safe(e);}
}finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});}
// Metadata/playback are not a substitute for byte, pixel, sound and crop review.
fs.writeFileSync(path.join(OUT,'native-instagram-inspection.json'),JSON.stringify(r,null,2));
console.log(JSON.stringify({nativeVideoElements:r.videoElements,loginWall:r.loginWall,playbackCompleted:r.playback?.completed,nativeBytesSaved:r.nativeBytesSaved,profileVerified:r.profileVerified,platformVerified:false}));
})().catch(e=>{r.error=safe(e);fs.writeFileSync(path.join(OUT,'native-instagram-inspection.json'),JSON.stringify(r,null,2));process.exitCode=2;});
