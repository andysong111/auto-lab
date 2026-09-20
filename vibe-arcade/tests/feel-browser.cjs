/* Real Phaser + Web Audio lifecycle tests. Local fixtures; zero production requests. */
'use strict';
const {chromium}=require(process.env.PW_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.PW_EXECUTABLE?{executablePath:process.env.PW_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});let checks=0;
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.setContent('<button id="sound">Enable sound</button><div id="game"></div>');
  for(const file of ['vendor/phaser-3.90.0.min.js','feel/phaser-fx.js','feel/audio.js','descent/audio.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await page.evaluate(()=>{
   window.quiet=false;
   class Demo extends Phaser.Scene{constructor(){super('fixture');}create(){window.scene=this;const g=this.add.graphics();g.fillStyle(0xffffff);g.fillCircle(8,8,7);g.generateTexture('star',16,16);g.destroy();this.target=this.add.image(150,100,'star');this.note=this.add.text(20,30,'');
    this.fx=LoopJoltFeelFX.create(this,{reduced:()=>quiet,maxParticles:30,maxFloaters:2});window.fx=this.fx;
   }update(t,dt){this.fx.update(dt);}}
   window.game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:300,height:300,scene:Demo,audio:{noAudio:true}});
   const A=window.AudioContext||window.webkitAudioContext;
   window.synth=LoopJoltFeelAudio.create({contextFactory:()=>{window.context=new A();return context;}});
   document.querySelector('#sound').onclick=()=>{window.audioReady=synth.enable(true);};
  });
  await page.waitForFunction(()=>!!window.fx);await page.evaluate(()=>{fx.burst({x:40,y:50,texture:'star',tint:0xffd080,count:100});fx.floatText({x:50,y:60,text:'321'});fx.pulse(scene.target,{fromX:2,fromY:.5,toX:1,toY:1});});
  assert(await page.evaluate(()=>fx.snapshot().particles<=30));checks++;
  await page.waitForTimeout(1250);assert.equal(await page.evaluate(()=>fx.snapshot().particles),0);assert.equal(await page.evaluate(()=>fx.snapshot().floaters),0);checks++;
  // Clearing this kit must not cancel another owner's tween.
  const ownership=await page.evaluate(()=>{const other=scene.add.image(2,2,'star'),outside=scene.tweens.add({targets:other,x:250,duration:5000});fx.notice(scene.note,'ordinary');fx.pulse(scene.target);fx.clear();return {outsideAlive:!outside.isDestroyed(),owned:fx.snapshot(),targetScale:scene.target.scaleX};});
  assert(ownership.outsideAlive);assert.equal(ownership.owned.tweens,0);assert.equal(ownership.targetScale,.47);checks++;
  await page.evaluate(()=>{quiet=true;fx.shake();fx.burst({x:40,y:50,texture:'star',count:28});fx.pulse(scene.target);});
  assert.equal(await page.evaluate(()=>fx.snapshot().particles),3);assert.equal(await page.evaluate(()=>scene.cameras.main.shakeEffect.isRunning),false);checks++;
  const restart=await page.evaluate(()=>{const old=fx;scene.scene.restart();window.oldFX=old;return true});assert(restart);await page.waitForFunction(()=>window.fx!==window.oldFX);assert(await page.evaluate(()=>oldFX.snapshot().disposed));checks++;
  await page.click('#sound');assert(await page.evaluate(()=>audioReady));assert.equal(await page.evaluate(()=>context.state),'running');checks++;
  assert(await page.evaluate(()=>synth.note(440,1,'sine',.1)));assert.equal(await page.evaluate(()=>synth.snapshot().voices),1);checks++;
  await page.evaluate(()=>synth.enable(false));assert.equal(await page.evaluate(()=>synth.snapshot().voices),0);assert.equal(await page.evaluate(()=>context.state),'suspended');checks++;
  await page.click('#sound');await page.evaluate(()=>audioReady);assert.equal(await page.evaluate(()=>synth.snapshot().voices),0);checks++;
  // Each game's sound recipe stays separate from the reusable voice engine.
  const soundMap=await page.evaluate(async()=>{const a=new DescentAudio();await a.enable(true);a.event({kind:'complete'});const before=a.snapshot();a.reset();const reset=a.snapshot();await a.destroy();return {before,reset,end:a.snapshot()};});assert.equal(soundMap.before.voices,4);assert.equal(soundMap.reset.voices,0);assert(soundMap.end.disposed);checks++;
  await page.evaluate(async()=>{await synth.destroy();game.destroy(true);});assert(await page.evaluate(()=>synth.snapshot().disposed));await page.waitForTimeout(40);assert.deepEqual(errors,[]);assert.equal(requests.length,0);checks++;
  await page.close();
 }
 // Exact note sequences are unchanged from the last released game, without playing audio.
 const legacy=process.env.BASELINE_DIR?path.join(process.env.BASELINE_DIR,'vibe-arcade/descent/audio.js'):null;
 if(legacy&&fs.existsSync(legacy)){
  const old={},next={};vm.runInNewContext(fs.readFileSync(legacy,'utf8'),old);vm.runInNewContext(fs.readFileSync(path.join(root,'feel/audio.js'),'utf8'),next);vm.runInNewContext(fs.readFileSync(path.join(root,'descent/audio.js'),'utf8'),next);
  for(const kind of ['bounce','drop','seal','perfect','shatter','burst','damage','region','focus','complete']){const a=new old.DescentAudio(),b=new next.DescentAudio(),x=[],y=[];a.note=(...q)=>x.push(q);b.note=(...q)=>y.push(q);a.event({kind});b.event({kind});assert.deepEqual(x,y,kind+' changed sound recipe');checks++;}
 }
 console.log('PASS Feel browser checks:',checks,'(real Phaser/Web Audio, voice cleanup, independent tween ownership, reduced motion, shutdown/restart; no production network)');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
