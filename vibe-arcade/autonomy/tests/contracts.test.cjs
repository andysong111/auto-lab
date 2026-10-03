'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {create,validate,transition,transitions}=require('../orchestrator/manifest.cjs');
const {safePath,copyGame,inspectGame}=require('../orchestrator/files.cjs');
const {requestFor}=require('../orchestrator/repair.cjs'),{evaluate}=require('../orchestrator/quality.cjs');
const {setup,mockQA,source,policy}=require('./helpers.cjs');
const spec=require('../examples/dummy-spec.json');
test('manifest schema rejects omissions, traversal, wrong identity, excess repair budget and unknown state',()=>{
  const good=create(spec);assert.equal(validate(good),good);
  for(const patch of [{state:'FUN_90'},{game_id:'../main'},{max_repair_attempts:6},{repair_attempt:1,max_repair_attempts:0},{source_path:'autonomy/games/GAME-20260921-999/v1'},{preview_url:'https://evil.invalid'},{metrics_eligibility:true},{extra:'value'}]) assert.throws(()=>validate({...good,...patch}));
  const missing={...good};delete missing.controls;assert.throws(()=>validate(missing));
});
test('every invalid state edge is rejected; terminal rejection cannot resurrect',()=>{
  for(const from of Object.keys(transitions))for(const to of Object.keys(transitions)) {
    const m={...create(spec),state:from};
    if(transitions[from].includes(to))assert.equal(transition(m,to).state,to);else assert.throws(()=>transition(m,to),/invalid_transition/);
  }
});
test('repair requests cannot exceed five and carry protected paths plus concrete acceptance tests',()=>{
  const m={...create(spec),state:'QA_FAILED',repair_attempt:4};const r=requestFor(m,{hard_failures:[{code:'freeze',message:'Tick did not advance'}]});
  assert.equal(r.attempt,5);assert(r.protected_paths.includes('loopjolt-backend/**'));assert(r.acceptance_tests.length>5);
  assert.throws(()=>requestFor({...m,repair_attempt:5}),/repair_budget/);
  assert.throws(()=>transition({...m,repair_attempt:5},'REPAIR_PENDING'),/repair_budget/);
});
test('symlinks, absolute paths and traversal cannot be imported',t=>{
  const {root}=setup(t);assert.throws(()=>safePath(root,'../outside'));assert.throws(()=>safePath(root,'/tmp/a'));assert.throws(()=>safePath(root,'a\\b'));
  fs.symlinkSync('/tmp',path.join(root,'link'));assert.throws(()=>safePath(root,'link/x'));
  const dir=path.join(root,'copied');copyGame(source,dir);fs.symlinkSync('/etc/passwd',path.join(dir,'secret.js'));assert.throws(()=>inspectGame(dir));
});
test('quality gate requires fresh exhaustive hard evidence; heuristics alone cannot pass',async t=>{
  const {factory,spec,store}=setup(t,{qa:mockQA});await factory.create(spec);const m=await factory.run(spec.game_id);
  const qa=require('node:fs').readFileSync(store.artifact(m.game_id,'v1/qa.json'),'utf8');
  const good=JSON.parse(qa);assert.equal(evaluate(m,good,policy).decision,'PASS');assert.equal(evaluate(m,good,policy).production_approved,false);
  assert.equal(evaluate(m,{...good,browser_cases:[]},policy).decision,'REPAIR');assert.equal(evaluate(m,{...good,source_hash:'stale'},policy).decision,'REPAIR');
  assert.equal(evaluate(m,{...good,hard_failures:[{code:'production_side_effect',message:'blocked POST'}]},policy).decision,'REJECT');
  assert.equal(evaluate({...m,repair_attempt:5},{...good,passed:false},policy).decision,'REJECT');
});
test('fixture core is DOM independent and deterministic for the same seed/input sequence',()=>{
  const core=require('../fixtures/dummy/core.js'),a=core.create(7),b=core.create(7);
  for(let i=0;i<610;i++){const input={x:i<50?1:0,action:i%31===0,pointer:null};core.step(a,input);core.step(b,input);}
  assert.deepEqual(a,b);assert(core.terminal(a));assert(a.interactions>0&&a.score>0);assert.equal(a.tick,600);
});

test('factory Phaser bridge owns cloned snapshots and canonical feedback/result presentation',t=>{
  const priorPhaser=globalThis.Phaser,priorKit=globalThis.PlayJoltPhaserKit,priorFeel=globalThis.LoopJoltFeelFX;let created=0,updated=[],resized=null,destroyed=false,feelDestroyed=false;
  let updateScene=null;
  class FakeGame{
    constructor(config){
      this.scale={width:320,height:180,resize:(w,h)=>{resized=[w,h];this.scale.width=w;this.scale.height=h;}};
      this.destroy=remove=>{destroyed=remove===true;};
      const chain={setDepth(){return this;},setOrigin(){return this;},setText(){return this;},setPosition(){return this;},setFontSize(){return this;},setVisible(){return this;},clear(){return this;},lineStyle(){return this;},strokeCircle(){return this;},fillStyle(){return this;},fillCircle(){return this;},fillRoundedRect(){return this;},fillRect(){return this;},strokeRect(){return this;}};
      const scene={add:{graphics:()=>Object.create(chain),text:()=>Object.create(chain)}};config.scene.create.call(scene);updateScene=delta=>config.scene.update.call(scene,0,delta);created++;
    }
  }
  globalThis.Phaser={VERSION:'4.2.1',AUTO:0,Game:FakeGame};
  globalThis.LoopJoltFeelFX={create:scene=>({update:delta=>{scene.feelDelta=delta;},destroy:()=>{feelDestroyed=true;}})};
  delete require.cache[require.resolve('../gamekit/phaserkit.js')];
  const kit=require('../gamekit/phaserkit.js'),canvas={width:320,height:180,getBoundingClientRect:()=>({width:320,height:180})};
  const renderer=kit.create({canvas,visuals:{create:()=>{},update:(_scene,s)=>{updated.push(s);s.state.x=999;}}});
  const original={state:{x:1,outcome:'playing'},quality:{reversible_state_key:'a'},progress:0,presentation:{}};renderer.render(original);assert.equal(original.state.x,1);assert.equal(updated.at(-1).state.x,999);assert.equal(renderer.presentation().feedback_active,false);
  renderer.render({...original,state:{x:2,outcome:'playing'},quality:{reversible_state_key:'b'}});assert.equal(renderer.presentation().feedback_active,true);for(let index=0;index<5;index++)updateScene(100);assert.equal(renderer.presentation().feedback_active,false);assert.equal(renderer.presentation().static_feedback,true);
  renderer.render({...original,state:{x:3,outcome:'success'},quality:{reversible_state_key:'c'}});assert.equal(renderer.presentation().protected_result,true);
  renderer.resize(640,360);assert.deepEqual(resized,[640,360]);renderer.dispose();assert(destroyed);assert(feelDestroyed);assert.equal(created,1);assert.equal(renderer.kind,'phaser4');assert.equal(renderer.version,'4.2.1');
  t.after(()=>{if(priorPhaser===undefined)delete globalThis.Phaser;else globalThis.Phaser=priorPhaser;if(priorKit===undefined)delete globalThis.PlayJoltPhaserKit;else globalThis.PlayJoltPhaserKit=priorKit;if(priorFeel===undefined)delete globalThis.LoopJoltFeelFX;else globalThis.LoopJoltFeelFX=priorFeel;delete require.cache[require.resolve('../gamekit/phaserkit.js')];});
});

test('GameKit owns bounded gesture-gated audio, mute, pause and pagehide cleanup',t=>{
  const saved=new Map(),names=['window','document','location','matchMedia','localStorage','performance','devicePixelRatio','requestAnimationFrame','cancelAnimationFrame','ResizeObserver','LoopJoltFeelAudio','PlayJoltGameKit','GameDiagnostics'];
  for(const name of names)saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  t.after(()=>{for(const [name,descriptor] of saved){delete globalThis[name];if(descriptor)Object.defineProperty(globalThis,name,descriptor);}delete require.cache[require.resolve('../gamekit/gamekit.js')];});
  class Node extends EventTarget{constructor(){super();this.hidden=false;this.textContent='';this.attrs={};}setAttribute(k,v){this.attrs[k]=v;}getBoundingClientRect(){return {x:0,y:0,width:390,height:520};}focus(){}setPointerCapture(){}}
  const nodes=new Map(),get=selector=>{if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);};
  const doc=new EventTarget();doc.hidden=false;doc.querySelector=get;
  const win=new EventTarget(),media=new EventTarget();media.matches=false;
  let raf=0,enabled=false,destroyed=false,createdAudio=0;const audio=[];
  Object.assign(globalThis,{window:win,document:doc,location:{search:'?seed=7&qa=1'},matchMedia:()=>media,localStorage:{getItem:()=>null,setItem:()=>{}},performance:{now:()=>0},devicePixelRatio:1,requestAnimationFrame:()=>++raf,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}disconnect(){}},LoopJoltFeelAudio:{create:options=>{createdAudio++;assert.equal(options.maxVoices,8);return {enable:value=>{enabled=!!value;audio.push(['enable',enabled]);},note:()=>audio.push(['note']),sequence:()=>audio.push(['sequence']),destroy:()=>{destroyed=true;},get enabled(){return enabled;}};}}});
  delete require.cache[require.resolve('../gamekit/gamekit.js')];
  const kit=require('../gamekit/gamekit.js'),canvas=get('[data-game-canvas]');
  const core={create:()=>({outcome:'playing'}),step:()=>{},observe:s=>({tick:0,score:0,progress:0,interactions:0,entities:0,quality:{meaningful_actions:0}}),terminal:()=>false};
  const product={progress:{state_path:'progress'},completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure'}};
  const game=kit.create({core,renderer:{render(){},resize(){},dispose(){}},canvas,seed:7,metadata:{game_id:'GAME-20261002-999',version:'v1',product_contract:product,commercial_contract:{audio:{mode:'required',mute_selector:'[data-mute]'}}}});
  assert.equal(createdAudio,0,'audio runtime must stay uninitialized before a player gesture');
  get('[data-game-start]').dispatchEvent(new Event('click'));assert.equal(createdAudio,0,'Start must not create AudioContext before gameplay input');
  const key=new Event('keydown');Object.defineProperties(key,{code:{value:'ArrowLeft'},repeat:{value:false}});win.dispatchEvent(key);assert.deepEqual(audio.at(-1),['enable',true]);assert.equal(createdAudio,1);
  get('[data-mute]').dispatchEvent(new Event('click'));assert.deepEqual(audio.at(-1),['enable',false]);
  get('[data-mute]').dispatchEvent(new Event('click'));assert.deepEqual(audio.at(-1),['enable',true]);
  get('[data-game-pause]').dispatchEvent(new Event('click'));assert.deepEqual(audio.at(-1),['enable',false]);
  const hide=new Event('pagehide');Object.defineProperty(hide,'persisted',{value:false});win.dispatchEvent(hide);assert.equal(destroyed,true);
  game.dispose();
});
