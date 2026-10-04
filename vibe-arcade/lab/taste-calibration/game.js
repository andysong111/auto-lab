(function(){
  'use strict';
  const canvas=document.querySelector('#gameCanvas'),ctx=canvas.getContext('2d');
  const ui={score:document.querySelector('#score'),time:document.querySelector('#time'),combo:document.querySelector('#combo'),start:document.querySelector('#startLayer'),result:document.querySelector('#resultLayer'),startButton:document.querySelector('#startButton'),replay:document.querySelector('#replayButton'),title:document.querySelector('#gameTitle'),label:document.querySelector('#modeLabel'),objective:document.querySelector('#gameObjective'),controlIcon:document.querySelector('#controlIcon'),controlText:document.querySelector('#controlText'),resultTitle:document.querySelector('#resultTitle'),resultScore:document.querySelector('#resultScore'),tested:document.querySelector('#testedCount'),decision:document.querySelector('#ownerDecision'),decisionStatus:document.querySelector('#decisionStatus')};
  const A=window.VibeAnalytics||{track:()=>{}},qa=new URLSearchParams(location.search).get('qa')==='1';
  const STORE='playjolt_taste_calibration_v1';
  const meta={
    launch:{id:'kinetic-launch-a',title:'Arc Relay',label:'KINETIC LAUNCH',objective:'당기고 놓아 움직이는 관문을 연속으로 통과시키세요.',control:'화면을 당긴 뒤 놓기',icon:'↕',accent:'#24d7e5'},
    chain:{id:'chain-reaction-b',title:'Bloom Circuit',label:'CHAIN REACTION',objective:'한 번의 점화 위치로 가장 큰 연쇄 반응을 만드세요.',control:'원하는 위치를 한 번 터치',icon:'◎',accent:'#ffd166'},
    guard:{id:'radial-guard-c',title:'Halo Guard',label:'RADIAL DEFENSE',objective:'고리를 돌려 흰 신호를 받고 붉은 파편을 피하세요.',control:'화면을 좌우로 밀어 회전',icon:'↔',accent:'#5ce0a1'}
  };
  const state=loadState();let current='launch',game=null,raf=0,last=0,audioCtx=null;
  function loadState(){
    try{const saved=JSON.parse(localStorage.getItem(STORE))||{};return {runs:saved.runs||{},ratings:saved.ratings||{},tags:saved.tags||{},winner:saved.winner||null}}
    catch{return{runs:{},ratings:{},tags:{},winner:null}}
  }
  function saveState(){localStorage.setItem(STORE,JSON.stringify(state));renderReview()}
  function tone(freq,duration=.07,type='sine',gain=.025){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+duration+.02);
  }
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
  function rand(a,b){return a+Math.random()*(b-a)}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
  function line(x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function text(value,x,y,size,color='#fff',align='left',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(value,x,y)}
  function background(accent){ctx.fillStyle='#081019';ctx.fillRect(0,0,960,600);ctx.strokeStyle='#182536';ctx.lineWidth=1;for(let x=0;x<=960;x+=60)line(x,0,x,600,'#182536');for(let y=0;y<=600;y+=60)line(0,y,960,y,'#182536');ctx.fillStyle=accent+'12';ctx.fillRect(0,0,960,8)}
  function burst(x,y,color,count=14){if(!game)return;for(let i=0;i<count;i++)game.particles.push({x,y,vx:rand(-180,180),vy:rand(-180,180),life:rand(.3,.65),color})}
  function particles(dt){if(!game)return;for(const p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.96;p.vy*=.96;circle(p.x,p.y,Math.max(1,p.life*7),p.color)}game.particles=game.particles.filter(p=>p.life>0)}
  class BaseGame{
    constructor(duration=60){this.duration=qa?3:duration;this.left=this.duration;this.score=0;this.combo=0;this.running=false;this.particles=[]}
    start(){this.running=true;this.left=this.duration;this.score=0;this.combo=0;this.particles=[];this.setup();syncHud()}
    tick(dt){if(!this.running)return;this.left-=dt;if(this.left<=0){this.left=0;finish()}syncHud()}
    pointerDown(){}pointerMove(){}pointerUp(){}keyDown(){}keyUp(){}
  }
  class LaunchGame extends BaseGame{
    setup(){this.ball={x:480,y:520,vx:0,vy:0,r:16,flying:false};this.drag=null;this.target={x:480,y:96,w:150,h:38,t:0};this.shots=0;this.hits=0}
    pointerDown(p){if(this.ball.flying)return;this.drag=p;tone(300,.05,'triangle')}
    pointerMove(p){if(this.drag&&!this.ball.flying)this.drag=p}
    pointerUp(p){if(this.ball.flying)return;const dx=clamp((480-p.x)*2.8,-650,650),charge=clamp(540+(520-p.y)*1.1,480,900);this.ball.vx=dx;this.ball.vy=-charge;this.ball.flying=true;this.drag=null;this.shots++;tone(520,.06,'triangle')}
    keyDown(code){if(code==='Space'&&!this.ball.flying&&!this.drag)this.drag={x:this.target.x,y:520};if(code==='ArrowLeft'&&this.drag)this.drag.x-=28;if(code==='ArrowRight'&&this.drag)this.drag.x+=28}
    keyUp(code){if(code==='Space'&&this.drag)this.pointerUp(this.drag)}
    tick(dt){super.tick(dt);if(!this.running)return;this.target.t+=dt;this.target.x=480+Math.sin(this.target.t*(1.6+this.hits*.04))*270;const b=this.ball;if(b.flying){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=620*dt;if(b.x<b.r||b.x>960-b.r){b.vx*=-.8;b.x=clamp(b.x,b.r,960-b.r)}const hitY=b.y-b.r<this.target.y+this.target.h/2&&b.y+b.r>this.target.y-this.target.h/2;const hitX=Math.abs(b.x-this.target.x)<this.target.w/2;if(hitY&&hitX&&b.vy<0){const accuracy=1-Math.abs(b.x-this.target.x)/(this.target.w/2);const pts=Math.round(100+accuracy*150)+this.combo*15;this.score+=pts;this.combo++;this.hits++;burst(b.x,b.y,'#24d7e5',22);tone(760+this.combo*24,.08,'sine');this.resetBall()}else if(b.y>640||b.y<-90){this.combo=0;this.resetBall()}}}
    resetBall(){this.ball={x:480,y:520,vx:0,vy:0,r:16,flying:false}}
    draw(){background('#24d7e5');text('ARC RELAY',40,48,17,'#8ca0b7');text('연속 통과 '+this.hits,920,48,17,'#fff','right');const t=this.target;ctx.fillStyle='#1a2734';ctx.fillRect(t.x-t.w/2,t.y-t.h/2,t.w,t.h);ctx.strokeStyle='#24d7e5';ctx.lineWidth=6;ctx.strokeRect(t.x-t.w/2,t.y-t.h/2,t.w,t.h);circle(t.x,t.y,8,'#ffd166');const b=this.ball;line(480,548,b.x,b.y,'#31445a',3);circle(b.x,b.y,b.r+8,'#24d7e522');circle(b.x,b.y,b.r,'#ffffff');if(this.drag&&!b.flying){line(480,520,this.drag.x,this.drag.y,'#ffd166',4);text('RELEASE',480,580,15,'#ffd166','center')}particles(.016)}
  }
  class ChainGame extends BaseGame{
    setup(){this.round=1;this.roundLeft=qa?1:10;this.motes=[];this.blasts=[];this.placed=false;this.spawnRound()}
    spawnRound(){this.motes=Array.from({length:13+this.round*2},()=>({x:rand(70,890),y:rand(90,530),vx:rand(-55,55),vy:rand(-55,55),r:8,hit:false,color:Math.random()>.25?'#ffd166':'#ff5e6c'}));this.blasts=[];this.placed=false}
    pointerDown(p){if(this.placed)return;this.placed=true;this.blasts.push({x:p.x,y:p.y,r:4,max:78,life:1.1,scored:false});tone(420,.05,'triangle')}
    tick(dt){super.tick(dt);if(!this.running)return;this.roundLeft-=dt;for(const m of this.motes){m.x+=m.vx*dt;m.y+=m.vy*dt;if(m.x<m.r||m.x>960-m.r)m.vx*=-1;if(m.y<75||m.y>565)m.vy*=-1;m.x=clamp(m.x,m.r,960-m.r);m.y=clamp(m.y,75,565)}for(const b of this.blasts){b.life-=dt;b.r=Math.min(b.max,b.r+120*dt)}for(const b of [...this.blasts])for(const m of this.motes)if(!m.hit&&dist(b,m)<b.r+m.r){m.hit=true;this.combo++;this.score+=40+this.combo*8;this.blasts.push({x:m.x,y:m.y,r:4,max:46,life:.72,scored:true});burst(m.x,m.y,m.color,8);tone(520+Math.min(360,this.combo*18),.04,'sine',.018)}this.motes=this.motes.filter(m=>!m.hit);this.blasts=this.blasts.filter(b=>b.life>0);if(this.roundLeft<=0||(!this.motes.length&&this.placed)){if(this.round>=6){finish();return}this.round++;this.roundLeft=qa?1:10;this.combo=0;this.spawnRound()}}
    draw(){background('#ffd166');text('BLOOM CIRCUIT',40,48,17,'#8ca0b7');text('라운드 '+this.round+' / 6',920,48,17,'#fff','right');for(const m of this.motes){circle(m.x,m.y,m.r+5,m.color+'22');circle(m.x,m.y,m.r,m.color)}for(const b of this.blasts){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.strokeStyle=b.scored?'#ffd166':'#ffffff';ctx.lineWidth=5;ctx.stroke()}if(!this.placed){circle(480,310,76,'#ffffff08');text('한 번 점화',480,316,20,'#dfe6ef','center')}particles(.016)}
  }
  class GuardGame extends BaseGame{
    setup(){this.angle=-Math.PI/2;this.targetAngle=this.angle;this.ring=180;this.items=[];this.spawn=0;this.caught=0;this.lives=3}
    pointerMove(p){this.targetAngle=Math.atan2(p.y-310,p.x-480)}
    pointerDown(p){this.pointerMove(p);tone(340,.04,'triangle')}
    keyDown(code){if(code==='ArrowLeft')this.targetAngle-=.32;if(code==='ArrowRight')this.targetAngle+=.32}
    tick(dt){super.tick(dt);if(!this.running)return;let d=((this.targetAngle-this.angle+Math.PI*3)%(Math.PI*2))-Math.PI;this.angle+=d*Math.min(1,dt*11);this.spawn-=dt;if(this.spawn<=0){const bad=Math.random()<.28+Math.min(.18,this.caught*.008);this.items.push({angle:rand(-Math.PI,Math.PI),r:440,speed:rand(95,135)+this.caught*1.2,bad,size:bad?13:10});this.spawn=Math.max(.22,.58-this.caught*.008)}for(const item of this.items){item.r-=item.speed*dt;if(item.r<this.ring+24&&item.r>this.ring-24&&!item.done){const ad=Math.abs(((item.angle-this.angle+Math.PI*3)%(Math.PI*2))-Math.PI);if(ad<.23){item.done=true;if(item.bad){this.lives--;this.combo=0;burst(480+Math.cos(item.angle)*this.ring,310+Math.sin(item.angle)*this.ring,'#ff5e6c',24);tone(130,.13,'sawtooth');if(this.lives<=0){finish();return}}else{this.caught++;this.combo++;this.score+=60+this.combo*10;burst(480+Math.cos(item.angle)*this.ring,310+Math.sin(item.angle)*this.ring,'#5ce0a1',16);tone(680+this.combo*12,.05,'sine')}}}if(item.r<110&&!item.done){item.done=true;if(!item.bad){this.combo=0;this.lives--;tone(160,.1,'square');if(this.lives<=0){finish();return}}}}this.items=this.items.filter(x=>!x.done&&x.r>80)}
    draw(){background('#5ce0a1');text('HALO GUARD',40,48,17,'#8ca0b7');text('보호막 '+this.lives+' / 3',920,48,17,this.lives===1?'#ff5e6c':'#fff','right');circle(480,310,92,'#111c28');circle(480,310,12,'#24d7e5');ctx.beginPath();ctx.arc(480,310,this.ring,0,Math.PI*2);ctx.strokeStyle='#26394c';ctx.lineWidth=4;ctx.stroke();const px=480+Math.cos(this.angle)*this.ring,py=310+Math.sin(this.angle)*this.ring;ctx.save();ctx.translate(px,py);ctx.rotate(this.angle+Math.PI/2);ctx.fillStyle='#ffffff';ctx.fillRect(-42,-10,84,20);ctx.fillStyle='#5ce0a1';ctx.fillRect(-20,-15,40,30);ctx.restore();for(const item of this.items){const x=480+Math.cos(item.angle)*item.r,y=310+Math.sin(item.angle)*item.r;if(item.bad){ctx.save();ctx.translate(x,y);ctx.rotate(item.angle);ctx.fillStyle='#ff5e6c';ctx.fillRect(-item.size,-item.size,item.size*2,item.size*2);ctx.restore()}else{circle(x,y,item.size+5,'#5ce0a122');circle(x,y,item.size,'#ffffff')}}particles(.016)}
  }
  function makeGame(){return current==='launch'?new LaunchGame():current==='chain'?new ChainGame():new GuardGame()}
  function syncHud(){if(!game)return;ui.score.textContent=Math.round(game.score);ui.time.textContent=Math.ceil(game.left);ui.combo.textContent=game.combo}
  function start(){cancelAnimationFrame(raf);game=makeGame();game.start();ui.start.hidden=true;ui.result.hidden=true;last=performance.now();A.track('calibration_game_start',{prototype:meta[current].id});raf=requestAnimationFrame(loop)}
  function loop(now){const dt=Math.min(.034,(now-last)/1000||0);last=now;if(game?.running){game.tick(dt);game.draw();raf=requestAnimationFrame(loop)}}
  function finish(){if(!game?.running)return;game.running=false;cancelAnimationFrame(raf);const score=Math.round(game.score);state.runs[current]=(state.runs[current]||0)+1;saveState();ui.resultTitle.textContent=meta[current].title+' 완료';ui.resultScore.textContent=score.toLocaleString()+'점';ui.result.hidden=false;tone(score>500?880:520,.16,'triangle',.04);A.track('calibration_game_finish',{prototype:meta[current].id,score})}
  function selectGame(id){current=id;cancelAnimationFrame(raf);game=makeGame();game.setup();document.querySelectorAll('.prototype-tab').forEach(b=>b.classList.toggle('is-active',b.dataset.game===id));ui.title.textContent=meta[id].title;ui.label.textContent=meta[id].label;ui.objective.textContent=meta[id].objective;ui.controlIcon.textContent=meta[id].icon;ui.controlText.textContent=meta[id].control;ui.start.hidden=false;ui.result.hidden=true;syncHud();game.draw();renderReview()}
  function renderReview(){const tested=Object.keys(state.runs).filter(k=>state.runs[k]>0);ui.tested.textContent=tested.length;ui.decision.hidden=!(tested.length===3&&Object.keys(state.ratings).length===3);document.querySelectorAll('#rating button').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.rating)===state.ratings[current]));document.querySelectorAll('#tags button').forEach(b=>b.classList.toggle('is-selected',(state.tags[current]||[]).includes(b.dataset.tag)));document.querySelectorAll('#winnerOptions button').forEach(b=>b.classList.toggle('is-selected',b.dataset.winner===state.winner));ui.decisionStatus.textContent=state.winner?meta[state.winner].title+' 선택이 이 브라우저에 저장되었습니다.':''}
  canvas.addEventListener('pointerdown',e=>{if(game?.running){canvas.setPointerCapture?.(e.pointerId);game.pointerDown(point(e))}});canvas.addEventListener('pointermove',e=>{if(game?.running)game.pointerMove(point(e))});canvas.addEventListener('pointerup',e=>{if(game?.running)game.pointerUp(point(e))});
  window.addEventListener('keydown',e=>{if(game?.running&&['Space','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();game.keyDown(e.code)}});window.addEventListener('keyup',e=>{if(game?.running)game.keyUp(e.code)});
  ui.startButton.addEventListener('click',start);ui.replay.addEventListener('click',start);document.querySelectorAll('.prototype-tab').forEach(b=>b.addEventListener('click',()=>selectGame(b.dataset.game)));
  document.querySelectorAll('#rating button').forEach(b=>b.addEventListener('click',()=>{if(!state.runs[current])return;state.ratings[current]=Number(b.dataset.rating);saveState()}));document.querySelectorAll('#tags button').forEach(b=>b.addEventListener('click',()=>{if(!state.runs[current])return;const set=new Set(state.tags[current]||[]);set.has(b.dataset.tag)?set.delete(b.dataset.tag):set.add(b.dataset.tag);state.tags[current]=[...set];saveState()}));document.querySelectorAll('#winnerOptions button').forEach(b=>b.addEventListener('click',()=>{state.winner=b.dataset.winner;saveState();A.track('calibration_owner_selection',{prototype:meta[state.winner].id,ratings:state.ratings,tags:state.tags})}));
  window.PlayJoltTasteLab={getState:()=>structuredClone(state),prototypeIds:Object.values(meta).map(x=>x.id)};
  selectGame(current);A.track('calibration_lab_open',{state:state.winner?'selected':'pending'});
})();
