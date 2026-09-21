/* Read-only, bounded proof collector for one owner-approved public Reel.
 * No credentials, publishing, profiles, scores, stealth browser or proxy changes.
 * A successful collector run is not automatically a passed publication gate. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const OUT=process.env.QA_OUT||'/tmp/loopjolt-first-release';
const INPUT='https://static.metricool.com/planner/202609/7005118-file-14822683884890234499.mp4';
const REEL='https://www.instagram.com/reel/Ddh9RSXDUJH/';
const PROFILE='https://www.instagram.com/playloopjolt/';
const EXPECTED='e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad';
const report={checkedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA,
 candidate:'dd_fc01_instagram',uuid:'9065192409182392302',publicUrl:REEL,
 hostedInput:{verified:false},platform:{verified:false},profile:{verified:false},
 fileVisualReviewPending:true,fanoutAllowed:false,notes:['One legitimate public QA visit may be counted by Instagram. No engagement actions.']};
fs.mkdirSync(OUT,{recursive:true});
function write(name,value){fs.writeFileSync(path.join(OUT,name),JSON.stringify(value,null,2));}
function cmd(name,args){const p=spawnSync(name,args,{encoding:'utf8',timeout:120000,maxBuffer:5e6});if(p.error)throw p.error;return {code:p.status,stdout:p.stdout,stderr:p.stderr};}
function mediaHost(u,kind){try{const x=new URL(u);if(x.protocol!=='https:')return false;return kind==='hosted'?x.hostname==='static.metricool.com':/(^|\.)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(x.hostname);}catch{return false;}}
async function download(url,file,kind){
 if(!mediaHost(url,kind))throw Error('unexpected_media_host');
 let next=url,response;
 for(let hop=0;hop<4;hop++){
  response=await fetch(next,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(response.status>=300&&response.status<400){next=new URL(response.headers.get('location'),next).href;await response.body?.cancel();if(!mediaHost(next,kind))throw Error('unexpected_redirect_host');continue;}break;
 }
 if(!response.ok)throw Error('http_'+response.status);
 const max=50*1024*1024;if(Number(response.headers.get('content-length'))>max)throw Error('media_too_large');
 const chunks=[];let bytes=0;
 for await(const c of response.body){bytes+=c.length;if(bytes>max)throw Error('media_too_large');chunks.push(c);}
 const data=Buffer.concat(chunks);if(data.subarray(0,64).indexOf(Buffer.from('ftyp'))<0)throw Error('not_mp4');
 fs.writeFileSync(file,data);return {bytes,sha256:crypto.createHash('sha256').update(data).digest('hex')};
}
function scan(file,label){
 const probe=cmd('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]);if(probe.code)throw Error('probe_failed');
 const meta=JSON.parse(probe.stdout),v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');
 if(!v)throw Error('video_missing');
 const decode=cmd('ffmpeg',['-v','error','-i',file,'-f','null','-']);
 const whole=cmd('ffmpeg',['-hide_banner','-i',file,'-an','-vf','freezedetect=n=-50dB:d=0.60','-f','null','-']);
 const roi=cmd('ffmpeg',['-hide_banner','-i',file,'-t','12','-an','-vf','scale=1080:1920,crop=790:920:145:420,freezedetect=n=-45dB:d=0.60','-f','null','-']);
 const audio=cmd('ffmpeg',['-hide_banner','-i',file,'-vn','-af','volumedetect','-f','null','-']);
 for(const [key,value] of Object.entries({decode,whole,roi,audio}))fs.writeFileSync(path.join(OUT,label+'-'+key+'.log'),value.stderr||'');
 const duration=Number(v.duration||meta.format.duration),aspectOK=Math.abs(v.width/v.height-9/16)<0.003;
 const freeze=roi.stderr.split('\n').filter(l=>l.includes('freeze_start:'));
 const frames=[];
 for(const [i,t] of [0,4.5,9,13.5,17.9].entries()){
  const name=label+'-'+i+'.jpg';const r=cmd('ffmpeg',['-v','error','-ss',String(t),'-i',file,'-frames:v','1','-vf','scale=270:480','-q:v','2','-y',path.join(OUT,name)]);if(r.code===0&&fs.existsSync(path.join(OUT,name)))frames.push(name);
 }
 return {duration,width:v.width,height:v.height,fps:v.avg_frame_rate,frames:v.nb_frames,audioPresent:!!a,fullDecode:decode.code===0&&!decode.stderr.trim(),roiFreezeStarts:freeze,wholeFreezeStarts:whole.stderr.split('\n').filter(l=>l.includes('freeze_start:')),checkpointFrames:frames,
 technicalPassed:decode.code===0&&!decode.stderr.trim()&&roi.code===0&&freeze.length===0&&aspectOK&&duration>17.8&&duration<18.2&&!!a&&frames.length===5};
}
async function playback(page,selector){return page.locator(selector).first().evaluate(async v=>{
 if(!v.videoWidth||!Number.isFinite(v.duration)||v.duration>25)return {completed:false,reason:'unexpected_video'};
 v.loop=false;v.muted=true;v.playbackRate=1;v.currentTime=0;
 const start=performance.now(),before=v.getVideoPlaybackQuality?.();let samples=0,maxGap=0,last=0,waiting=0,stalled=0;
 v.addEventListener('waiting',()=>waiting++);v.addEventListener('stalled',()=>stalled++);
 let active=true;function frame(now){if(!active)return;samples++;if(last)maxGap=Math.max(maxGap,now-last);last=now;v.requestVideoFrameCallback?.(frame);}v.requestVideoFrameCallback?.(frame);
 return await new Promise(resolve=>{let done=false;const finish=reason=>{if(done)return;done=true;active=false;clearTimeout(timer);const q=v.getVideoPlaybackQuality?.();resolve({completed:reason==='ended',reason,currentTime:v.currentTime,duration:v.duration,rate:v.playbackRate,elapsedMs:performance.now()-start,frameCallbacks:samples,maxFrameCallbackGapMs:maxGap,decodedFrames:(q?.totalVideoFrames||0)-(before?.totalVideoFrames||0),droppedFrames:(q?.droppedVideoFrames||0)-(before?.droppedVideoFrames||0),waiting,stalled});};const timer=setTimeout(()=>finish('timeout'),30000);v.addEventListener('ended',()=>finish('ended'),{once:true});v.play().catch(()=>finish('play_rejected'));});
 });}
(async()=>{
 const hosted=path.join(OUT,'metricool-hosted.mp4');
 try{const d=await download(INPUT,hosted,'hosted'),qa=scan(hosted,'hosted');report.hostedInput={...d,...qa,expectedHashMatch:d.sha256===EXPECTED,verified:d.sha256===EXPECTED&&qa.technicalPassed};}catch(e){report.hostedInput.error=e.code||e.message?.split('\n')[0]||'fetch_failed';}
 let browser,ctx;
 try{
  browser=await chromium.launch({headless:true});ctx=await browser.newContext({viewport:{width:430,height:932}});const page=await ctx.newPage();page.setDefaultTimeout(12000);
  // First test downloaded hosted input at normal speed; distinct from Instagram.
  if(report.hostedInput.verified){
   const server=require('node:http').createServer((req,res)=>{if(req.url==='/video'){const b=fs.readFileSync(hosted);res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':b.length});res.end(b);}else{res.writeHead(200,{'Content-Type':'text/html'});res.end('<video id="proof" src="/video" controls playsinline style="width:360px"></video>');}});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   try{await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.querySelector('video').readyState>=2);report.hostedInput.playback=await playback(page,'video');report.hostedInput.verified&&=report.hostedInput.playback.completed;}finally{server.close();}
  }
  const response=await page.goto(REEL,{waitUntil:'domcontentloaded',timeout:30000});report.platform.httpStatus=response?.status();await page.waitForTimeout(6000);
  report.platform.finalPath=new URL(page.url()).pathname;report.platform.pageTitle=await page.title();
  const visible=(await page.locator('body').innerText()).slice(0,15000);
  report.platform.identityVisible=visible.includes('playloopjolt');report.platform.captionVisible=visible.includes('Which flag clears 48');
  report.platform.videoElements=await page.locator('video').count();
  report.platform.loginWall=!report.platform.videoElements&&(/Log in|Login|Log Into/i.test(visible)||/login|challenge/.test(report.platform.finalPath));
  await page.screenshot({path:path.join(OUT,'instagram-public-page.png')});
  if(report.platform.videoElements&&report.platform.identityVisible&&report.platform.captionVisible){
   report.platform.playback=await playback(page,'video');
   const source=await page.locator('video').first().evaluate(v=>v.currentSrc);report.platform.sourceHost=source.startsWith('https:')?new URL(source).hostname:'blob_or_unavailable';
   if(mediaHost(source,'platform')){const target=path.join(OUT,'instagram-transcoded.mp4');const d=await download(source,target,'platform');report.platform.media={...d,...scan(target,'platform')};}
   report.platform.verified=report.platform.playback.completed&&report.platform.media?.technicalPassed===true;
  }
  await page.goto(PROFILE,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(3000);
  const hrefs=await page.locator('a').evaluateAll(nodes=>nodes.map(a=>a.href));
  const links=[];for(const href of hrefs){try{let u=new URL(href);if(u.hostname==='l.instagram.com'&&u.searchParams.get('u'))u=new URL(u.searchParams.get('u'));if(u.hostname==='vibe-arcade-dun.vercel.app')links.push(u.origin+u.pathname);}catch{}}
  report.profile.links=[...new Set(links)];report.profile.verified=links.includes('https://vibe-arcade-dun.vercel.app/ig');
  await page.screenshot({path:path.join(OUT,'instagram-profile.png')});
 }catch(e){report.browserError=e.code||e.message?.split('\n')[0]||'browser_failed';}finally{await ctx?.close().catch(()=>{});await browser?.close().catch(()=>{});}
 report.fanoutAllowed=false; // Human/assistant visual evidence review is separate.
 write('first-release-inspection.json',report);
 console.log(JSON.stringify({hostedInputVerified:report.hostedInput.verified,platformVerified:report.platform.verified,profileVerified:report.profile.verified,fileVisualReviewPending:true,fanoutAllowed:false}));
 // Workflow GREEN means all factual technical subchecks passed, never stage completion.
 if(!report.hostedInput.verified||!report.platform.verified||!report.profile.verified)process.exitCode=2;
})().catch(e=>{report.fatal=e.code||'collector_error';write('first-release-inspection.json',report);console.error('Collector failed; inspect JSON, no publication authorized.');process.exitCode=2;});
