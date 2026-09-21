/* Normal-clock HTTP route tests. All non-local requests and writes are blocked. */
'use strict';
const {chromium}=require(process.env.PW_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUT||'/tmp/astra-routes';fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const f=[file,file+'.html',path.join(file,'index.html')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());if(!f){res.writeHead(404);return res.end('missing');}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
const report={checks:[],normalClock:true,accountWrites:0,scoreWrites:0,externalPosts:0};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});try{
for(const width of [390,1280])for(const suffix of ['','/']){
 const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600}),page=await ctx.newPage(),errors=[],responses=[];
 await ctx.route('**/*',r=>{if(r.request().method()!=='GET'){report.externalPosts++;return r.abort();}return r.request().url().startsWith(origin)?r.continue():r.abort();});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin))responses.push([r.url(),r.status()]);});
 await page.goto(origin+'/games/astra-sentinel'+suffix+'?capture=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>!!window.AstraDiagnostics);
 assert.equal(await page.evaluate(()=>AstraDiagnostics.snapshot().state.tick),0);await page.locator('#play').click();await page.keyboard.down('KeyD');await page.waitForTimeout(350);await page.keyboard.up('KeyD');
 const p=await page.evaluate(()=>AstraDiagnostics.snapshot().state.player);assert(p.x>365);
 if(width===390){const b=await page.locator('#game').boundingBox();const session=await ctx.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.45,y:b.y+b.height*.45}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.60,y:b.y+b.height*.45}]});const before=await page.evaluate(()=>AstraDiagnostics.snapshot().state.player.x);await page.waitForTimeout(150);assert((await page.evaluate(()=>AstraDiagnostics.snapshot().state.player.x))>before);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.waitForTimeout(2100);const snap=await page.evaluate(()=>AstraDiagnostics.snapshot());assert(snap.state.tick>50);const resources=await page.evaluate(()=>AstraDiagnostics.resources());assert(resources.voices<=10&&resources.particles<=130&&resources.popups<=22);
 await page.locator('#pause').click();const frozen=await page.evaluate(()=>AstraDiagnostics.snapshot().state.tick);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>AstraDiagnostics.snapshot().state.tick),frozen);
 await page.locator('#resume').click();await page.waitForTimeout(100);assert((await page.evaluate(()=>AstraDiagnostics.snapshot().state.tick))>frozen);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);assert(responses.every(x=>x[1]===200));for(const f of ['core.js','art.js','app.js','style.css'])assert(responses.some(x=>x[0]===origin+'/games/astra-sentinel/'+f));
 await page.screenshot({path:path.join(out,'normal-play-'+width+(suffix?'slash':'clean')+'.png'),fullPage:true});report.checks.push({route:'/games/astra-sentinel'+suffix,width,assetsLoaded:true,movement:true,touch:width===390,soundEnabled:true,pause:true});await ctx.close();
}
assert.equal(report.externalPosts,0);report.passed=true;
}finally{await browser.close();server.close();}})().catch(e=>{report.passed=false;report.error=e.message;process.exitCode=1;server.close();}).finally(()=>{fs.writeFileSync(path.join(out,'routes.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
