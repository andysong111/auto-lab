import * as THREE from './vendor/three.module.min.js';

const canvas=document.querySelector('#gameCanvas');
const ui={score:document.querySelector('#score'),time:document.querySelector('#time'),combo:document.querySelector('#combo'),start:document.querySelector('#startLayer'),result:document.querySelector('#resultLayer'),startButton:document.querySelector('#startButton'),replay:document.querySelector('#replayButton'),resultTitle:document.querySelector('#resultTitle'),resultScore:document.querySelector('#resultScore'),decision:document.querySelector('#ownerDecision'),decisionStatus:document.querySelector('#decisionStatus'),phase:document.querySelector('#scenePhase'),core:document.querySelector('#sceneCore'),overdrive:document.querySelector('#overdriveFill')};
const A=window.VibeAnalytics||{track:()=>{}},qa=new URLSearchParams(location.search).get('qa')==='1';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORE='playjolt_taste_calibration_halo_v7',prototype={id:'radial-guard-c',title:'Halo Guard'};
let game=null,raf=0,last=0,audioCtx=null;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(960,600,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a31);scene.fog=new THREE.Fog(0x101a31,18,30);
const camera=new THREE.PerspectiveCamera(42,1.6,.1,100);camera.position.set(0,0,16);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xc8fbff,0x071019,2.2));
const keyLight=new THREE.DirectionalLight(0xffffff,3.4);keyLight.position.set(-5,7,10);keyLight.castShadow=true;scene.add(keyLight);
const rimLight=new THREE.PointLight(0x35f0bf,16,20);rimLight.position.set(5,-3,7);scene.add(rimLight);

const MAT={
  white:new THREE.MeshStandardMaterial({color:0xf7fbff,roughness:.28,metalness:.18}),
  mint:new THREE.MeshStandardMaterial({color:0x55e2a6,roughness:.3,metalness:.2,emissive:0x0c553c,emissiveIntensity:.45}),
  cyan:new THREE.MeshStandardMaterial({color:0x31dff0,roughness:.18,metalness:.22,emissive:0x0a9fb0,emissiveIntensity:1.7}),
  gold:new THREE.MeshStandardMaterial({color:0xffcf54,roughness:.26,metalness:.55,emissive:0x8b5900,emissiveIntensity:.55}),
  dark:new THREE.MeshStandardMaterial({color:0x101a25,roughness:.32,metalness:.55}),
  red:new THREE.MeshStandardMaterial({color:0xef3950,roughness:.28,metalness:.5,emissive:0x65000d,emissiveIntensity:.65}),
  coral:new THREE.MeshStandardMaterial({color:0xff706f,roughness:.2,metalness:.24,emissive:0xb51a22,emissiveIntensity:1.5}),
  stone:new THREE.MeshStandardMaterial({color:0x536b82,roughness:.76,metalness:.08}),
  stoneDark:new THREE.MeshStandardMaterial({color:0x253b54,roughness:.8,metalness:.08}),
  grass:new THREE.MeshStandardMaterial({color:0x2d7277,roughness:.68,metalness:.04,emissive:0x092c32,emissiveIntensity:.22}),
  violet:new THREE.MeshStandardMaterial({color:0x806de6,roughness:.34,metalness:.28,emissive:0x241c70,emissiveIntensity:.55}),
  cloud:new THREE.MeshStandardMaterial({color:0xdff8ff,roughness:.82,metalness:0,transparent:true,opacity:.72})
};
function addMesh(parent,geometry,material,position=[0,0,0],scale=[1,1,1]){const value=new THREE.Mesh(geometry,material);value.position.set(...position);value.scale.set(...scale);value.castShadow=true;value.receiveShadow=true;parent.add(value);return value}
function sphere(parent,r,material,position,scale){return addMesh(parent,new THREE.SphereGeometry(r,24,16),material,position,scale)}
function capsule(parent,r,length,material,position,rotation=[0,0,0],scale=[1,1,1]){const value=addMesh(parent,new THREE.CapsuleGeometry(r,length,6,12),material,position,scale);value.rotation.set(...rotation);return value}
function cone(parent,r,h,material,position,rotation=[0,0,0]){const value=addMesh(parent,new THREE.ConeGeometry(r,h,5),material,position);value.rotation.set(...rotation);return value}

function createGuardian(){
  const group=new THREE.Group();
  sphere(group,1.02,MAT.white,[0,.45,0],[1.05,.86,.72]);sphere(group,.82,MAT.mint,[0,-.55,0],[.82,.92,.64]);
  sphere(group,.78,MAT.dark,[0,.52,.63],[1,.48,.24]);sphere(group,.2,MAT.cyan,[-.34,.6,.82],[1.2,.68,.28]);sphere(group,.2,MAT.cyan,[.34,.6,.82],[1.2,.68,.28]);
  sphere(group,.34,MAT.cyan,[0,-.45,.62],[1,.82,.3]);
  capsule(group,.28,.48,MAT.white,[-1.02,-.45,0],[0,0,.24]);capsule(group,.28,.48,MAT.white,[1.02,-.45,0],[0,0,-.24]);
  sphere(group,.35,MAT.mint,[-1.2,-.72,.08]);sphere(group,.35,MAT.mint,[1.2,-.72,.08]);
  capsule(group,.26,.45,MAT.white,[-.48,-1.38,0],[0,0,.06]);capsule(group,.26,.45,MAT.white,[.48,-1.38,0],[0,0,-.06]);
  sphere(group,.42,MAT.white,[-.52,-1.72,.18],[1.12,.7,.9]);sphere(group,.42,MAT.white,[.52,-1.72,.18],[1.12,.7,.9]);
  cone(group,.3,.85,MAT.gold,[-1.05,.54,-.15],[0,0,-.62]);cone(group,.3,.85,MAT.gold,[1.05,.54,-.15],[0,0,.62]);
  group.scale.set(.85,.85,.85);return group;
}
function createWisp(){
  const group=new THREE.Group();sphere(group,.55,MAT.white,[0,0,0],[1.12,.86,.82]);
  sphere(group,.16,MAT.dark,[-.22,.09,.45],[.8,1,.45]);sphere(group,.16,MAT.dark,[.22,.09,.45],[.8,1,.45]);sphere(group,.08,MAT.cyan,[-.2,.1,.53]);sphere(group,.08,MAT.cyan,[.2,.1,.53]);
  sphere(group,.42,MAT.mint,[-.46,.33,-.08],[.36,1.15,.2]);sphere(group,.42,MAT.mint,[.46,.33,-.08],[.36,1.15,.2]);
  for(let i=0;i<3;i++)sphere(group,.18-i*.025,MAT.cyan,[-.72-i*.25,-.04-i*.05,-.18],[1.35,.62,.45]);
  group.scale.set(.72,.72,.72);return group;
}
function createRaider(){
  const group=new THREE.Group();addMesh(group,new THREE.DodecahedronGeometry(.72,1),MAT.red,[0,0,0],[1.18,.9,.72]);sphere(group,.38,MAT.dark,[0,-.02,.56],[1,.86,.35]);sphere(group,.2,MAT.coral,[0,-.02,.78],[1.2,1,.3]);
  cone(group,.28,.9,MAT.dark,[-.55,.58,-.06],[0,0,-.62]);cone(group,.28,.9,MAT.dark,[.55,.58,-.06],[0,0,.62]);
  capsule(group,.18,.48,MAT.red,[-.74,-.48,0],[0,0,.7]);capsule(group,.18,.48,MAT.red,[.74,-.48,0],[0,0,-.7]);
  for(const side of [-1,1]){cone(group,.13,.4,MAT.coral,[side*.92,-.76,.2],[0,0,side*.24]);cone(group,.13,.4,MAT.coral,[side*.66,-.84,.2],[0,0,-side*.22])}
  group.scale.set(.68,.68,.68);return group;
}

function createTower(x,y,scale=1){
  const tower=new THREE.Group();
  addMesh(tower,new THREE.CylinderGeometry(.62,.78,1.75,8),MAT.stone,[0,0,0]);
  addMesh(tower,new THREE.CylinderGeometry(.82,.82,.25,8),MAT.stoneDark,[0,.95,0]);
  cone(tower,.92,1.15,MAT.violet,[0,1.55,0]);
  for(const side of [-1,1])sphere(tower,.11,MAT.gold,[side*.28,.2,.66],[.8,1.3,.35]);
  tower.position.set(x,y,-2.1);tower.scale.setScalar(scale);return tower;
}
function createCloud(x,y,z,scale=1){
  const cloud=new THREE.Group();
  sphere(cloud,.72,MAT.cloud,[-.7,0,0],[1.25,.72,.7]);sphere(cloud,.9,MAT.cloud,[0,.18,0],[1.35,.78,.72]);sphere(cloud,.62,MAT.cloud,[.82,-.02,0],[1.25,.68,.65]);
  cloud.position.set(x,y,z);cloud.scale.setScalar(scale);return cloud;
}
const sceneryMotion=[];
function createEnvironment(){
  const environment=new THREE.Group();
  const moon=new THREE.Mesh(new THREE.CircleGeometry(2.15,48),new THREE.MeshBasicMaterial({color:0x7b9bc1,transparent:true,opacity:.18}));moon.position.set(6.1,3.5,-5.8);environment.add(moon);
  const courtyard=addMesh(environment,new THREE.CylinderGeometry(4.35,4.58,.42,18),MAT.stoneDark,[0,0,-1.75]);courtyard.rotation.x=Math.PI/2;
  const lawn=addMesh(environment,new THREE.CylinderGeometry(3.48,3.48,.1,18),MAT.grass,[0,0,-1.4]);lawn.rotation.x=Math.PI/2;
  addMesh(environment,new THREE.TorusGeometry(4.28,.065,8,72),MAT.gold,[0,0,-1.25]);
  for(let i=0;i<7;i++){
    const rock=addMesh(environment,new THREE.ConeGeometry(.32+(i%3)*.06,1.2+(i%2)*.36,6),MAT.stone,[-3.25+i*1.08,-4.72+(i%2)*.08,-2.55]);
    rock.rotation.z=Math.PI+(i-3)*.025;rock.scale.x=.82+(i%3)*.12;
  }
  environment.add(createTower(-6.75,-2.55,.78),createTower(6.8,-2.35,.72),createTower(-7.05,3.35,.38),createTower(7.15,3.15,.36));
  const clouds=[createCloud(-7.45,2.55,-4.6,1.02),createCloud(7.55,2.35,-4.8,.86),createCloud(-7.7,-3.45,-4.3,.58)];
  for(const [index,cloud] of clouds.entries()){environment.add(cloud);sceneryMotion.push({kind:'cloud',object:cloud,origin:cloud.position.x,speed:.00012+index*.000025,range:.28+index*.04})}
  for(const side of [-1,1]){
    const crystal=addMesh(environment,new THREE.OctahedronGeometry(.24,0),MAT.violet,[side*7.15,side<0?.3:1.05,-1.9],[.72,1.45,.72]);sceneryMotion.push({kind:'crystal',object:crystal,offset:side});
    const beacon=new THREE.PointLight(side<0?0x8c7cff:0x54efc0,5,5);beacon.position.set(side*6.7,-2.1,-.4);environment.add(beacon);sceneryMotion.push({kind:'beacon',object:beacon,offset:side});
  }
  return environment;
}

const world=new THREE.Group();scene.add(world);
const environment=createEnvironment();world.add(environment);
const grid=new THREE.GridHelper(20,16,0x446d7c,0x28485b);grid.rotation.x=Math.PI/2;grid.position.z=-1.15;grid.material.transparent=true;grid.material.opacity=.14;world.add(grid);
const ringMat=new THREE.MeshStandardMaterial({color:0x1b4c5c,emissive:0x0b2934,emissiveIntensity:.8,roughness:.45});
const baseRing=new THREE.Mesh(new THREE.TorusGeometry(3.92,.055,8,96),ringMat);world.add(baseRing);
const innerRing=new THREE.Mesh(new THREE.TorusGeometry(2.25,.035,8,72),ringMat);innerRing.position.z=-.4;world.add(innerRing);
const guardian=createGuardian();guardian.position.z=.1;world.add(guardian);
const shieldMaterial=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x35dca8,emissiveIntensity:1.2,roughness:.22,metalness:.28});
const shield=new THREE.Mesh(new THREE.TorusGeometry(3.92,.2,12,40,1.05),shieldMaterial);shield.position.z=.25;shield.castShadow=true;world.add(shield);
const starsGeometry=new THREE.BufferGeometry(),stars=[];for(let i=0;i<150;i++)stars.push((Math.random()-.5)*20,(Math.random()-.5)*12,-3-Math.random()*8);starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:0x4e8393,size:.035})));

const state=loadState();
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORE))||{};return {runs:saved.runs||{},ratings:saved.ratings||{},tags:saved.tags||{},winner:saved.winner==='guard'?'guard':null}}catch{return{runs:{},ratings:{},tags:{},winner:null}}}
function saveState(){localStorage.setItem(STORE,JSON.stringify(state));renderReview()}
function tone(freq,duration=.07,type='sine',gain=.025){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+duration+.02)}
function angleDistance(a,b){return Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI)}
function pointerAngle(event){const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=.5-(event.clientY-rect.top)/rect.height;return Math.atan2(y,x)}

class HaloGuard3D{
  constructor(){this.duration=qa?3.4:40;this.items=[];this.effects=[];this.running=false;this.setup()}
  setup(){this.dispose();this.left=this.duration;this.score=0;this.combo=0;this.bestCombo=0;this.caught=0;this.lives=4;this.barrier=2;this.angle=Math.PI/2;this.targetAngle=this.angle;this.spawn=.35;this.spawnCount=0;this.phase=1;this.energy=0;this.overdrive=0;this.elapsed=0;this.guardianKick=0;syncHud()}
  start(){this.running=true;this.setup()}
  dispose(){for(const item of this.items||[])world.remove(item.model);for(const effect of this.effects||[])world.remove(effect.mesh);this.items=[];this.effects=[]}
  pointerMove(event){this.targetAngle=pointerAngle(event)}pointerDown(event){this.pointerMove(event);tone(340,.045,'triangle')}
  keyDown(code){if(code==='ArrowLeft')this.targetAngle+=.36;if(code==='ArrowRight')this.targetAngle-=.36}
  spawnItem(){this.spawnCount++;const bad=this.spawnCount===3||Math.random()<.09+this.phase*.035,angle=-Math.PI+Math.random()*Math.PI*2,model=bad?createRaider():createWisp();model.position.z=.45;world.add(model);this.items.push({angle,currentAngle:angle,r:7.6,speed:.84+this.phase*.16+Math.random()*.14,bad,pulse:Math.random()*6.2,wobble:.018+Math.random()*.025,model,done:false})}
  shock(x,y,color){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide}),mesh=new THREE.Mesh(new THREE.RingGeometry(.14,.22,32),material);mesh.position.set(x,y,.8);world.add(mesh);this.effects.push({mesh,life:.55})}
  removeItem(item){item.done=true;world.remove(item.model)}
  catchItem(item){const a=item.currentAngle,x=Math.cos(a)*3.92,y=Math.sin(a)*3.92;this.removeItem(item);this.guardianKick=.32;
    if(item.bad){const absorbed=this.barrier>0;if(absorbed)this.barrier--;else this.lives--;this.combo=0;this.energy=Math.max(0,this.energy-25);this.shock(x,y,absorbed?0xffd166:0xff4e65);tone(absorbed?260:120,absorbed?.1:.16,absorbed?'triangle':'sawtooth',.04);if(this.lives<=0)finish('방어선 붕괴');return}
    this.caught++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.energy=Math.min(100,this.energy+12+Math.min(8,this.combo));if(this.energy>=100&&this.overdrive<=0){this.overdrive=5.5;this.energy=0;tone(980,.18,'triangle',.05)}const points=(70+this.combo*12)*(this.overdrive>0?2:1);this.score+=points;this.shock(x,y,this.overdrive>0?0xffd166:0x5ce0a1);tone(640+Math.min(420,this.combo*20),.055,'sine',.03)
  }
  tick(dt){if(!this.running)return;this.left=Math.max(0,this.left-dt);this.elapsed+=dt;this.guardianKick=Math.max(0,this.guardianKick-dt*2.4);this.overdrive=Math.max(0,this.overdrive-dt);if(this.left<=0){finish('방어 완료');return}
    const nextPhase=qa?Math.min(3,1+Math.floor(this.elapsed/1.1)):Math.min(3,1+Math.floor(this.caught/10));if(nextPhase!==this.phase){this.phase=nextPhase;tone(520+this.phase*140,.14,'triangle',.04)}
    let d=((this.targetAngle-this.angle+Math.PI*3)%(Math.PI*2))-Math.PI;this.angle+=d*Math.min(1,dt*(10+this.phase));this.spawn-=dt;if(this.spawn<=0){this.spawnItem();this.spawn=Math.max(.34,.92-this.phase*.12-(this.overdrive>0?.05:0))}
    for(const item of this.items){item.pulse+=dt*(item.bad?9:6);item.currentAngle=item.angle+(reducedMotion?0:Math.sin(item.pulse*.7)*item.wobble);item.r-=item.speed*(item.bad&&item.r<5.7?1.16:1)*dt;if(item.r<4.45&&item.r>3.45&&!item.done&&angleDistance(item.currentAngle,this.angle)<(this.overdrive>0?.6:.42))this.catchItem(item);if(item.r<1.75&&!item.done){this.removeItem(item);if(!item.bad){this.combo=0;this.energy=Math.max(0,this.energy-10)}}}
    this.items=this.items.filter(item=>!item.done);for(const effect of this.effects){effect.life-=dt;effect.mesh.scale.addScalar(dt*4);effect.mesh.material.opacity=Math.max(0,effect.life*1.7)}this.effects=this.effects.filter(effect=>{if(effect.life>0)return true;world.remove(effect.mesh);effect.mesh.geometry.dispose();effect.mesh.material.dispose();return false});syncHud()
  }
  animate(now){innerRing.rotation.z=-now*.00018;baseRing.rotation.z=now*.0001;guardian.position.y=(reducedMotion?0:Math.sin(now*.0022)*.08)-this.guardianKick*.18;guardian.rotation.y=(reducedMotion?0:Math.sin(now*.0014)*.12);guardian.scale.setScalar(.85+this.guardianKick*.1);shield.rotation.z=this.angle-.525;shieldMaterial.color.setHex(this.overdrive>0?0xffd166:0xffffff);shieldMaterial.emissive.setHex(this.overdrive>0?0xc67900:0x35dca8);shield.scale.setScalar(this.overdrive>0?1.08:1);
    for(const motion of sceneryMotion){if(motion.kind==='cloud')motion.object.position.x=motion.origin+Math.sin(now*motion.speed)*motion.range;else if(motion.kind==='crystal'){motion.object.rotation.y=now*.0012*motion.offset;motion.object.position.y=.35+(reducedMotion?0:Math.sin(now*.002+motion.offset)*.12)}else motion.object.intensity=6.2+(reducedMotion?0:Math.sin(now*.003+motion.offset)*1.4)}
    for(const item of this.items){const a=item.currentAngle;item.model.position.set(Math.cos(a)*item.r,Math.sin(a)*item.r,.4+Math.sin(item.pulse)*.28);item.model.rotation.z=a-Math.PI/2;item.model.rotation.y+=item.bad?.045:.028;const pulse=1+(reducedMotion?0:Math.sin(item.pulse)*.06);item.model.scale.setScalar(pulse)}
  }
}

function syncHud(){if(!game)return;ui.score.textContent=Math.round(game.score);ui.time.textContent=Math.ceil(game.left);ui.combo.textContent=game.combo;ui.phase.textContent=game.overdrive>0?'OVERDRIVE':`PHASE ${game.phase}`;ui.phase.style.color=game.overdrive>0?'#ffd166':'#5ce0a1';ui.core.textContent=`코어 ${game.lives} / 4 · 수호막 ${game.barrier}`;ui.overdrive.style.width=`${game.overdrive>0?game.overdrive/5.5*100:game.energy}%`;ui.overdrive.style.background=game.overdrive>0?'#ffd166':'#5ce0a1'}
function start(){cancelAnimationFrame(raf);game?.dispose();game=new HaloGuard3D();game.start();ui.start.hidden=true;ui.result.hidden=true;last=performance.now();A.track('calibration_game_start',{prototype:prototype.id,version:7,renderer:'three-webgl'});raf=requestAnimationFrame(loop)}
function loop(now){const dt=Math.min(.034,(now-last)/1000||0);last=now;if(game?.running)game.tick(dt);game?.animate(now);renderer.render(scene,camera);if(game?.running)raf=requestAnimationFrame(loop)}
function finish(reason='기록 완료'){if(!game?.running)return;game.running=false;cancelAnimationFrame(raf);const score=Math.round(game.score);state.runs.guard=(state.runs.guard||0)+1;saveState();ui.resultTitle.textContent=reason;ui.resultScore.textContent=score.toLocaleString()+'점 · 최고 콤보 '+game.bestCombo;ui.result.hidden=false;tone(score>500?880:520,.16,'triangle',.04);A.track('calibration_game_finish',{prototype:prototype.id,score,best_combo:game.bestCombo,version:7})}
function renderReview(){const completed=(state.runs.guard||0)>0,rated=Number.isInteger(state.ratings.guard);ui.decision.hidden=!(completed&&rated);document.querySelectorAll('#rating button').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.rating)===state.ratings.guard));document.querySelectorAll('#tags button').forEach(button=>button.classList.toggle('is-selected',(state.tags.guard||[]).includes(button.dataset.tag)));document.querySelectorAll('#winnerOptions button').forEach(button=>button.classList.toggle('is-selected',state.winner==='guard'));ui.decisionStatus.textContent=state.winner==='guard'?'Halo Guard 보강판이 이 브라우저의 기준으로 저장되었습니다. 공장 재시작은 별도 승인 전까지 보류됩니다.':''}
function visualProbe(){renderer.render(scene,camera);const gl=renderer.getContext(),pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let lit=0;for(let i=0;i<pixels.length;i+=256)if(pixels[i]+pixels[i+1]+pixels[i+2]>32)lit++;return {litPixels:lit,width:canvas.width,height:canvas.height}}

canvas.addEventListener('pointerdown',event=>{if(game?.running){canvas.setPointerCapture?.(event.pointerId);game.pointerDown(event)}});canvas.addEventListener('pointermove',event=>{if(game?.running)game.pointerMove(event)});
window.addEventListener('keydown',event=>{if(game?.running&&['ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();game.keyDown(event.code)}});
ui.startButton.addEventListener('click',start);ui.replay.addEventListener('click',start);
document.querySelectorAll('#rating button').forEach(button=>button.addEventListener('click',()=>{if(!state.runs.guard)return;state.ratings.guard=Number(button.dataset.rating);saveState()}));
document.querySelectorAll('#tags button').forEach(button=>button.addEventListener('click',()=>{if(!state.runs.guard)return;const set=new Set(state.tags.guard||[]);set.has(button.dataset.tag)?set.delete(button.dataset.tag):set.add(button.dataset.tag);state.tags.guard=[...set];saveState()}));
document.querySelector('#winnerOptions [data-winner="guard"]').addEventListener('click',()=>{state.winner='guard';saveState();A.track('calibration_owner_selection',{prototype:prototype.id,ratings:state.ratings,tags:state.tags,version:7})});
game=new HaloGuard3D();game.animate(performance.now());renderer.render(scene,camera);syncHud();renderReview();
window.PlayJoltTasteLab={getState:()=>structuredClone(state),getRuntime:()=>game?{running:game.running,phase:game.phase,angle:game.angle,items:game.items.length,score:game.score,lives:game.lives,barrier:game.barrier}:null,getVisualProbe:visualProbe,prototypeIds:[prototype.id],version:7,renderer:'three-webgl'};
A.track('calibration_lab_open',{state:state.winner?'selected_for_polish':'polish_pending',version:7,renderer:'three-webgl'});
