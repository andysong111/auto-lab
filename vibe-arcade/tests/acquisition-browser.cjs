'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUT||'/tmp/acquisition-browser';fs.mkdirSync(out,{recursive:true});
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),name=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!name.startsWith(root+path.sep)&&name!==root){res.writeHead(403);return res.end();}let file=[name,name+'.html',path.join(name,'index.html')].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!file){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});let tested=[];
try{for(const viewport of [{width:430,height:932},{width:1280,height:800}]){const ctx=await browser.newContext({viewport});let externalWrites=0;await ctx.route('**/*',route=>{if(route.request().url().startsWith(origin))return route.continue();if(route.request().method()==='POST')externalWrites++;return route.abort();});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [slug,route,diagnostic] of [['core-pins','/games/core-pins','CorePinsDiagnostics'],['nova-merge','/games/nova-merge',null],['core-pins','/challengers/play?game=core-pins','CorePinsDiagnostics'],['nova-merge','/challengers/play?game=nova-merge',null]]){
await page.goto(origin+route+(route.includes('?')?'&':'?')+'capture=1',{waitUntil:'networkidle'});
await page.waitForFunction(()=>!document.querySelector('#primary').disabled);assert.equal((await page.locator('#title').textContent()).toLowerCase().replaceAll(' ','-'),slug);
assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://vibe-arcade-dun.vercel.app/games/'+slug);
await page.click('#primary');if(diagnostic){await page.waitForFunction(name=>globalThis[name]?.snapshot().state.tick>30,diagnostic);}else{await page.waitForTimeout(200);const c=page.locator('#phaser-game canvas'),box=await c.boundingBox();await c.click({position:{x:box.width/2,y:box.height/2}});await page.waitForTimeout(100);assert((await page.locator('#status').textContent()).includes('Practice run'));}
assert(await page.evaluate(()=>LJTelemetry.excluded));assert.equal(await page.evaluate(()=>sessionStorage.getItem('lj4_acquisition')),null);
if(route.startsWith('/games/'))await page.screenshot({path:path.join(out,slug+'-'+viewport.width+'.png'),fullPage:true});
tested.push({slug,route,viewport:viewport.width,practiceStarted:true,canonical:true});
}
assert.deepEqual(errors,[]);assert.equal(externalWrites,0);await ctx.close();}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({tested,passed:tested.length,gameAccountsCreated:0,scoresSubmitted:0,productionTelemetrySent:0},null,2));console.log('PASS: '+tested.length+' canonical/legacy browser routes; no external writes.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
