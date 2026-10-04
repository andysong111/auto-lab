(function(){
  'use strict';
  const canvas=document.querySelector('#gameCanvas'),ctx=canvas.getContext('2d');
  const ui={score:document.querySelector('#score'),time:document.querySelector('#time'),combo:document.querySelector('#combo'),start:document.querySelector('#startLayer'),result:document.querySelector('#resultLayer'),startButton:document.querySelector('#startButton'),replay:document.querySelector('#replayButton'),resultTitle:document.querySelector('#resultTitle'),resultScore:document.querySelector('#resultScore'),decision:document.querySelector('#ownerDecision'),decisionStatus:document.querySelector('#decisionStatus')};
  const A=window.VibeAnalytics||{track:()=>{}},qa=new URLSearchParams(location.search).get('qa')==='1';
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORE='playjolt_taste_calibration_halo_v3',prototype={id:'radial-guard-c',title:'Halo Guard'};
  const guardian=new Image();guardian.src='./assets/halo-guardian-v1.png';guardian.onload=()=>game?.draw();
  const state=loadState();let game=null,raf=0,last=0,audioCtx=null;

  function loadState(){
    try{const saved=JSON.parse(localStorage.getItem(STORE))||{};return {runs:saved.runs||{},ratings:saved.ratings||{},tags:saved.tags||{},winner:saved.winner==='guard'?'guard':null}}
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
  function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
  function line(x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function text(value,x,y,size,color='#fff',align='left',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(value,x,y)}
  function angleDistance(a,b){return Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI)}

  class HaloGuard{
    constructor(){this.duration=qa?3.4:40;this.running=false;this.particles=[];this.popups=[];this.items=[]}
    setup(){
      this.left=this.duration;this.score=0;this.combo=0;this.bestCombo=0;this.caught=0;this.lives=4;this.barrier=2;this.angle=-Math.PI/2;this.targetAngle=this.angle;this.ring=196;this.spawn=.35;this.phase=1;this.energy=0;this.overdrive=0;this.flash=0;this.shake=0;this.elapsed=0;this.reactor=0;this.announce=1.2;this.items=[];this.particles=[];this.popups=[];
    }
    start(){this.running=true;this.setup();syncHud()}
    pointerMove(p){this.targetAngle=Math.atan2(p.y-310,p.x-480)}
    pointerDown(p){this.pointerMove(p);tone(340,.045,'triangle')}
    keyDown(code){if(code==='ArrowLeft')this.targetAngle-=.36;if(code==='ArrowRight')this.targetAngle+=.36}
    addBurst(x,y,color,count=16){for(let i=0;i<count;i++)this.particles.push({x,y,vx:rand(-210,210),vy:rand(-210,210),life:rand(.28,.72),color})}
    addPopup(label,x,y,color){this.popups.push({label,x,y,life:.8,color})}
    spawnItem(){
      const dangerChance=.09+this.phase*.035,bad=Math.random()<dangerChance;
      const angle=rand(-Math.PI,Math.PI),speed=78+this.phase*15+rand(-6,14);
      this.items.push({angle,r:470,speed,bad,size:bad?14:11,tail:[],pulse:rand(0,Math.PI*2),done:false});
    }
    catchItem(item){
      item.done=true;const x=480+Math.cos(item.angle)*this.ring,y=310+Math.sin(item.angle)*this.ring;
      if(item.bad){
        const absorbed=this.barrier>0;if(absorbed){this.barrier--;this.addPopup('수호막 흡수',x,y-12,'#ffd166');tone(260,.1,'triangle',.03)}else{this.lives--;this.addPopup('충돌',x,y-12,'#ff8c96');tone(120,.16,'sawtooth',.04)}this.combo=0;this.energy=Math.max(0,this.energy-25);this.flash=.22;this.shake=reducedMotion?0:9;this.addBurst(x,y,absorbed?'#ffd166':'#ff5e6c',24);if(this.lives<=0)finish('방어선 붕괴');
        return;
      }
      this.caught++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.energy=Math.min(100,this.energy+12+Math.min(8,this.combo));
      if(this.energy>=100&&this.overdrive<=0){this.overdrive=5.5;this.energy=0;this.announce=1.25;this.flash=.12;tone(980,.18,'triangle',.05)}
      const multiplier=this.overdrive>0?2:1,points=(70+this.combo*12)*multiplier;this.score+=points;this.shake=reducedMotion?0:Math.min(6,2+this.combo*.2);this.addBurst(x,y,this.overdrive>0?'#ffd166':'#5ce0a1',18+Math.min(18,this.combo));this.addPopup(`+${points}`,x,y-12,this.overdrive>0?'#ffd166':'#baffdd');tone(640+Math.min(420,this.combo*20),.055,'sine',.03);
    }
    tick(dt){
      if(!this.running)return;this.left=Math.max(0,this.left-dt);this.elapsed+=dt;this.reactor+=dt*(1.1+this.phase*.22);this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-dt*32);this.announce=Math.max(0,this.announce-dt);this.overdrive=Math.max(0,this.overdrive-dt);
      if(this.left<=0){finish('방어 완료');return}
      const nextPhase=qa?Math.min(3,1+Math.floor(this.elapsed/1.1)):Math.min(3,1+Math.floor(this.caught/10));
      if(nextPhase!==this.phase){this.phase=nextPhase;this.announce=1.25;this.flash=.1;tone(520+this.phase*140,.14,'triangle',.04)}
      let d=((this.targetAngle-this.angle+Math.PI*3)%(Math.PI*2))-Math.PI;this.angle+=d*Math.min(1,dt*(10+this.phase));
      this.spawn-=dt;if(this.spawn<=0){this.spawnItem();this.spawn=Math.max(.34,.92-this.phase*.12-(this.overdrive>0?.05:0))}
      for(const item of this.items){
        item.tail.unshift({r:item.r,life:1});item.tail=item.tail.slice(0,reducedMotion?2:7);item.tail.forEach(t=>t.life-=dt*4);item.r-=item.speed*dt;item.pulse+=dt*7;
        if(item.r<this.ring+31&&item.r>this.ring-31&&!item.done){const width=this.overdrive>0?.6:.42;if(angleDistance(item.angle,this.angle)<width)this.catchItem(item)}
        if(item.r<104&&!item.done){item.done=true;if(!item.bad){if(this.barrier>0){this.barrier--;this.addPopup('한 번 더!',480,238,'#ffd166');tone(280,.09,'triangle',.025)}else{this.lives--;this.addPopup('신호 유실',480,238,'#ff8c96');tone(155,.12,'square',.035)}this.combo=0;this.energy=Math.max(0,this.energy-14);this.flash=.12;this.shake=reducedMotion?0:6;if(this.lives<=0){finish('코어 붕괴');return}}}
      }
      this.items=this.items.filter(item=>!item.done&&item.r>80);
      for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.95;p.vy*=.95}this.particles=this.particles.filter(p=>p.life>0);
      for(const p of this.popups){p.y-=30*dt;p.life-=dt}this.popups=this.popups.filter(p=>p.life>0);
      syncHud();
    }
    drawBackground(){
      ctx.fillStyle='#071019';ctx.fillRect(0,0,960,600);
      for(let x=0;x<=960;x+=60)line(x,0,x,600,'#142737');for(let y=0;y<=600;y+=60)line(0,y,960,y,'#142737');
      for(let r=110;r<=270;r+=40){ctx.beginPath();ctx.arc(480,310,r,this.reactor*.12,this.reactor*.12+Math.PI*1.45);ctx.strokeStyle=r===this.ring?'#31596a':'#173142';ctx.lineWidth=r===this.ring?3:1;ctx.stroke()}
      for(let i=0;i<12;i++){const a=this.reactor*.18+i*Math.PI/6;line(480+Math.cos(a)*105,310+Math.sin(a)*105,480+Math.cos(a)*135,310+Math.sin(a)*135,'#1c4552',2)}
      ctx.fillStyle='#5ce0a1';ctx.fillRect(0,0,960,7);
    }
    drawReactor(){
      circle(480,310,104,'#0d1d29');circle(480,310,82,this.overdrive>0?'#423814':'#102b34');
      for(let i=0;i<6;i++){const a=this.reactor+i*Math.PI/3,x=480+Math.cos(a)*72,y=310+Math.sin(a)*72;circle(x,y,6,this.overdrive>0?'#ffd166':'#24d7e5')}
      if(guardian.complete&&guardian.naturalWidth){const bob=reducedMotion?0:Math.sin(this.reactor*2.2)*4;ctx.save();ctx.translate(480,310+bob);if(this.flash>0)ctx.globalAlpha=.72;ctx.drawImage(guardian,-76,-76,152,152);ctx.restore()}else{circle(480,310,34,'#24d7e5');circle(480,310,14,'#071019')}
    }
    drawItem(item){
      for(let i=item.tail.length-1;i>=0;i--){const t=item.tail[i],x=480+Math.cos(item.angle)*t.r,y=310+Math.sin(item.angle)*t.r;circle(x,y,Math.max(2,item.size*(i+1)/item.tail.length*.55),item.bad?'#7a2630':'#27765d')}
      const x=480+Math.cos(item.angle)*item.r,y=310+Math.sin(item.angle)*item.r;
      if(item.bad){ctx.save();ctx.translate(x,y);ctx.rotate(item.angle+item.pulse*.08);ctx.fillStyle='#ff5e6c';ctx.fillRect(-item.size,-item.size,item.size*2,item.size*2);ctx.strokeStyle='#ffbdc3';ctx.lineWidth=2;ctx.strokeRect(-item.size-4,-item.size-4,(item.size+4)*2,(item.size+4)*2);ctx.restore()}
      else{circle(x,y,item.size+7,'#226b55');circle(x,y,item.size+2,'#ffffff');circle(x,y,4,this.overdrive>0?'#ffd166':'#5ce0a1')}
    }
    drawShield(){
      const width=this.overdrive>0?.62:.44;
      ctx.beginPath();ctx.arc(480,310,this.ring,this.angle-width,this.angle+width);ctx.strokeStyle=this.overdrive>0?'#ffd166':'#ffffff';ctx.lineWidth=this.overdrive>0?24:18;ctx.lineCap='round';ctx.stroke();
      ctx.beginPath();ctx.arc(480,310,this.ring,this.angle-width*.72,this.angle+width*.72);ctx.strokeStyle=this.overdrive>0?'#ffffff':'#5ce0a1';ctx.lineWidth=7;ctx.stroke();ctx.lineCap='butt';
    }
    draw(){
      const sx=this.shake?rand(-this.shake,this.shake):0,sy=this.shake?rand(-this.shake,this.shake):0;ctx.save();ctx.translate(sx,sy);this.drawBackground();this.drawReactor();for(const item of this.items)this.drawItem(item);this.drawShield();
      for(const p of this.particles)circle(p.x,p.y,Math.max(1,p.life*8),p.color);for(const p of this.popups)text(p.label,p.x,p.y,18,p.color,'center',900);
      text('HALO GUARD / V3',40,45,17,'#93a9b9');text(`PHASE ${this.phase}`,480,45,17,this.overdrive>0?'#ffd166':'#5ce0a1','center',900);text(`코어 ${this.lives} / 4 · 수호막 ${this.barrier}`,920,45,17,this.lives===1?'#ff7783':'#fff','right');
      text('OVERDRIVE',40,566,12,'#8fa4b6');ctx.fillStyle='#172b38';ctx.fillRect(142,555,230,14);ctx.fillStyle=this.overdrive>0?'#ffd166':'#5ce0a1';ctx.fillRect(142,555,230*(this.overdrive>0?this.overdrive/5.5:this.energy/100),14);ctx.strokeStyle='#365264';ctx.strokeRect(142,555,230,14);
      if(this.announce>0){ctx.fillStyle='#071019dd';ctx.fillRect(330,262,300,96);text(this.overdrive>0?'OVERDRIVE':`PHASE ${this.phase}`,480,303,28,this.overdrive>0?'#ffd166':'#ffffff','center',900);text(this.overdrive>0?'보호막 확장 · 점수 2배':'신호 속도 상승',480,333,14,'#9fb3c3','center',700)}
      if(this.flash>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.28,this.flash)})`;ctx.fillRect(0,0,960,600)}ctx.restore();
    }
  }

  function syncHud(){if(!game)return;ui.score.textContent=Math.round(game.score);ui.time.textContent=Math.ceil(game.left);ui.combo.textContent=game.combo}
  function start(){cancelAnimationFrame(raf);game=new HaloGuard();game.start();ui.start.hidden=true;ui.result.hidden=true;last=performance.now();A.track('calibration_game_start',{prototype:prototype.id,version:3});raf=requestAnimationFrame(loop)}
  function loop(now){const dt=Math.min(.034,(now-last)/1000||0);last=now;if(game?.running){game.tick(dt);game.draw();raf=requestAnimationFrame(loop)}}
  function finish(reason='기록 완료'){if(!game?.running)return;game.running=false;cancelAnimationFrame(raf);const score=Math.round(game.score);state.runs.guard=(state.runs.guard||0)+1;saveState();ui.resultTitle.textContent=reason;ui.resultScore.textContent=score.toLocaleString()+'점 · 최고 콤보 '+game.bestCombo;ui.result.hidden=false;tone(score>500?880:520,.16,'triangle',.04);A.track('calibration_game_finish',{prototype:prototype.id,score,best_combo:game.bestCombo,version:3})}
  function renderReview(){
    const completed=(state.runs.guard||0)>0,rated=Number.isInteger(state.ratings.guard);ui.decision.hidden=!(completed&&rated);
    document.querySelectorAll('#rating button').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.rating)===state.ratings.guard));
    document.querySelectorAll('#tags button').forEach(b=>b.classList.toggle('is-selected',(state.tags.guard||[]).includes(b.dataset.tag)));
    document.querySelectorAll('#winnerOptions button').forEach(b=>b.classList.toggle('is-selected',state.winner==='guard'));
    ui.decisionStatus.textContent=state.winner==='guard'?'Halo Guard 보강판이 이 브라우저의 기준으로 저장되었습니다. 공장 재시작은 별도 승인 전까지 보류됩니다.':'';
  }
  canvas.addEventListener('pointerdown',e=>{if(game?.running){canvas.setPointerCapture?.(e.pointerId);game.pointerDown(point(e))}});canvas.addEventListener('pointermove',e=>{if(game?.running)game.pointerMove(point(e))});
  window.addEventListener('keydown',e=>{if(game?.running&&['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();game.keyDown(e.code)}});
  ui.startButton.addEventListener('click',start);ui.replay.addEventListener('click',start);
  document.querySelectorAll('#rating button').forEach(b=>b.addEventListener('click',()=>{if(!state.runs.guard)return;state.ratings.guard=Number(b.dataset.rating);saveState()}));
  document.querySelectorAll('#tags button').forEach(b=>b.addEventListener('click',()=>{if(!state.runs.guard)return;const set=new Set(state.tags.guard||[]);set.has(b.dataset.tag)?set.delete(b.dataset.tag):set.add(b.dataset.tag);state.tags.guard=[...set];saveState()}));
  document.querySelector('#winnerOptions [data-winner="guard"]').addEventListener('click',()=>{state.winner='guard';saveState();A.track('calibration_owner_selection',{prototype:prototype.id,ratings:state.ratings,tags:state.tags,version:3})});
  window.PlayJoltTasteLab={getState:()=>structuredClone(state),getRuntime:()=>game?{running:game.running,phase:game.phase,angle:game.angle,items:game.items.length,score:game.score,lives:game.lives,barrier:game.barrier}:null,prototypeIds:[prototype.id],version:3};
  game=new HaloGuard();game.setup();syncHud();game.draw();renderReview();A.track('calibration_lab_open',{state:state.winner?'selected_for_polish':'polish_pending',version:3});
})();
