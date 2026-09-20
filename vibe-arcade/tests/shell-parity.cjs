/* Stage 2-2 unchanged-experience gate. Baseline is the owner-approved released build.
 * This uses a MOCK public player and canonical rules; never writes production data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {chromium}=require(process.env.PW_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..'),base=process.env.SHELL_BASE_REF;
if(!base&&!process.env.BASELINE_DIR)throw Error('Provide SHELL_BASE_REF explicitly for this one-time parity comparison.');
const out=process.env.SHELL_QA_OUT||'/tmp/shell22-parity';fs.mkdirSync(out,{recursive:true});
const baseline=p=>process.env.BASELINE_DIR?fs.readFileSync(path.join(process.env.BASELINE_DIR,p),'utf8'):cp.execFileSync('git',['show',base+':'+p],{cwd:repo,encoding:'utf8'});
function unchanged(){
 const paths=['descent/core.js','descent/view.js','descent/art.js','descent/audio.js','descent/style.css','community/client.js','community/flags.css','arcade3/clock.js','arcade3/telemetry.js','package.json','package-lock.json','runtime/core.js','runtime/community-adapter.js'];
 for(const p of paths)assert.equal(fs.readFileSync(path.join(root,p),'utf8'),baseline('vibe-arcade/'+p),'Protected file changed: '+p);
 const html=fs.readFileSync(path.join(root,'descent/index.html'),'utf8').replace(/<script src="(?:\/shell\/core|\/descent\/shell)\.js"><\/script>/g,'');
 assert.equal(html,baseline('vibe-arcade/descent/index.html'),'HTML markup/copy changed');
}
const fixture=`(()=>{let time=1000,q=new Map(),n=0,random=7;Math.random=()=>((random=Math.imul(random,1664525)+1013904223>>>0)/4294967296);
Object.defineProperty(performance,'now',{value:()=>time});Date.now=()=>1789869989000+time;
window.requestAnimationFrame=f=>{q.set(++n,f);return n};window.cancelAnimationFrame=i=>q.delete(i);
window.__qa={frame:()=>{time+=16.667;const current=[...q.values()];q.clear();current.forEach(f=>f(time));},frames:n=>{for(let i=0;i<n;i++)__qa.frame();}};
window.__calls={start:[],finish:[],events:[]};const player={handle:'QA_Parity',country:'KR'};
window.LoopCommunity={profile:player,authenticated:true,endpoint:'https://qa.invalid/api',
 config:async()=>({seed:7,loginReady:true,rankedGames:[{game:'gyro-drop',version:'gd-descent-v2'}]}),me:async()=>player,
 renderFlagLabel:(target,c,h)=>{target.textContent=c+' '+h},countryName:()=> 'South Korea',
 api:async(action,payload)=>{if(action==='start'){__calls.start.push(payload);return {runId:'00000000-0000-4000-8000-000000000001',seed:7,version:'gd-descent-v2'};}
 if(action==='finish'){__calls.finish.push(JSON.parse(JSON.stringify(payload)));const v=DescentRules.replay(7,payload.actions,payload.ticks);return {saved:true,score:v.score};}}
};window.LJTelemetry={track:(...a)=>__calls.events.push(a)};
})();`;
async function load(browser,width,before){
 const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'}),p=await context.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 await p.route('https://qa.invalid/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:'gd-descent-v2',rows:[]})}));
 let html=before?baseline('vibe-arcade/descent/index.html'):fs.readFileSync(path.join(root,'descent/index.html'),'utf8');
 const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
 html=html.replace(/<script src="[^"]+"><\/script>/g,'').replace(/<link rel="stylesheet"[^>]+>/g,'');await p.setContent(html);
 await p.addStyleTag({content:fs.readFileSync(path.join(root,'descent/style.css'),'utf8')+fs.readFileSync(path.join(root,'community/flags.css'),'utf8')});
 await p.addScriptTag({content:fixture});
 for(const file of scripts){if(file.includes('community/client')||file.includes('telemetry'))continue;const data=before&&file==='/descent/app.js'?baseline('vibe-arcade'+file):fs.readFileSync(path.join(root,file),'utf8');await p.addScriptTag({content:data});}
 await p.waitForTimeout(60);await p.evaluate(()=>__qa.frames(3));await p.waitForSelector('#gameCanvas canvas');await p.waitForTimeout(60);
 return p;
}
async function sample(p,label){
 await p.waitForTimeout(50);
 const state=await p.evaluate(()=>({game:DescentDiagnostics.snapshot(),fields:[...document.querySelectorAll('[id]')].filter(n=>!['gameCanvas'].includes(n.id)&&!n.querySelector('canvas')).map(n=>({id:n.id,text:n.textContent,hidden:n.hidden,disabled:n.disabled,class:n.className})),calls:__calls}));
 const png=await p.screenshot({path:path.join(out,label+'.png'),fullPage:true});return {state,png};
}
async function aim(p,target){await p.evaluate(target=>{
 const s=DescentDiagnostics.snapshot().state,d=DescentRules.mod(target-s.rotation+1800)-1800,code=d<0?'ArrowLeft':'ArrowRight';
 window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));__qa.frames(Math.max(0,Math.round(Math.abs(d)/40)));
 window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));__qa.frames(2);
 },target);}
async function finish(p){
 let s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);await aim(p,900-s.rings[0].gap);await p.evaluate(()=>__qa.frames(115-DescentDiagnostics.snapshot().state.tick));
 for(let i=0;i<3;i++){s=await p.evaluate(()=>DescentDiagnostics.snapshot().state);if(!s.alive)break;await aim(p,900-s.rings[s.floor].hazard);await p.evaluate(()=>__qa.frames(Math.max(1,DescentDiagnostics.snapshot().state.nextImpact-DescentDiagnostics.snapshot().state.tick+1)));}
 await p.waitForTimeout(70);assert(await p.locator('#result').isVisible());
}
async function pixelDifference(browser,a,b){
 if(a.equals(b))return {pixels:0,maxChannelDelta:0};
 const p=await browser.newPage();
 try{return await p.evaluate(async({a,b})=>{
  const decode=async x=>{const image=await createImageBitmap(await (await fetch('data:image/png;base64,'+x)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return {w:c.width,h:c.height,data:ctx.getImageData(0,0,c.width,c.height).data}};
  const x=await decode(a),y=await decode(b);if(x.w!==y.w||x.h!==y.h)return {pixels:-1,maxChannelDelta:255};let pixels=0,maxChannelDelta=0;for(let i=0;i<x.data.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(x.data[i+c]-y.data[i+c]);if(d)changed=true;maxChannelDelta=Math.max(maxChannelDelta,d);}if(changed)pixels++;}return {pixels,maxChannelDelta};
 },{a:a.toString('base64'),b:b.toString('base64')});}finally{await p.close();}
}
(async()=>{unchanged();let browser;const report=[];
 try{
 browser=await chromium.launch({headless:true,...(process.env.PW_EXECUTABLE?{executablePath:process.env.PW_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const width of [390,1280]){
  const samples=[];
  for(const before of [true,false]){
   const p=await load(browser,width,before),prefix=(before?'before':'after')+'-'+width,shots=[];
   shots.push(await sample(p,prefix+'-entry'));
   await p.click('#ranked');await p.waitForTimeout(30);await p.evaluate(()=>__qa.frames(32));shots.push(await sample(p,prefix+'-play'));
   await finish(p);shots.push(await sample(p,prefix+'-result'));assert.deepEqual(p.errors,[]);samples.push(shots);await p.context().close();
  }
  for(let i=0;i<3;i++){const label=['entry','play','result'][i];assert.deepEqual(samples[0][i].state,samples[1][i].state,`${width} ${label}: behavior/DOM/transport drift`);
   const delta=await pixelDifference(browser,samples[0][i].png,samples[1][i].png);report.push({width,state:label,...delta});/* Allow at most 8 low-amplitude rounded-border antialias pixels, not layout/text/game differences. */assert(delta.pixels>=0&&delta.pixels<=8&&delta.maxChannelDelta<=8,`${width} ${label}: visual difference ${JSON.stringify(delta)}`);}
 }
 fs.writeFileSync(path.join(out,'parity.json'),JSON.stringify({baseline:base,report},null,2));console.log(JSON.stringify({baseline:base,report},null,2));
 }finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
