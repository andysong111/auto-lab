(function(){
'use strict';
const R=OrbitRules,C=LoopCommunity,$=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d');
let state=R.create(123456),started=false,paused=false,last=0,acc=0,pending=null,inputs=[],challenge=null,seed=123456,finishing=false,fx=[],toastUntil=0,soundOn=false,audio=null,loadPending=false,clock=RankedClock.create();
const UX=new GameSessionUI({game:'orbit-sprint',version:R.VERSION,onPlay:mode=>launch(mode)});
let best=0;try{best=Number(localStorage.getItem('orbit_best_v1')||0)||0;soundOn=localStorage.getItem('orbit_sound')==='on';}catch{}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const A=window.VibeAnalytics||{track:()=>{}};
function track(event,props={}){try{A.track(event,{game:'orbit-sprint',version:R.VERSION,...props});}catch{}}
function pb(){ $('#best').textContent=best.toLocaleString();$('#badge').textContent=best>=14000?'Master pilot · cosmetic badge':best>=7000?'Deep-space pilot · cosmetic badge':best>=2500?'Orb collector · cosmetic badge':best>0?'First flight · cosmetic badge':'Earn your first flight badge.';}
function sound(kind){if(!soundOn)return;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='triangle';o.frequency.setValueAtTime(kind==='orb'?850:kind==='crash'?115:kind==='dash'?260:440,t);o.frequency.exponentialRampToValueAtTime(kind==='crash'?50:kind==='dash'?1200:600,t+.14);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.17);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.18);}catch{}}
function soundLabel(){$('#sound').textContent=soundOn?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(soundOn));}
$('#sound').onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('orbit_sound',soundOn?'on':'off');}catch{}soundLabel();sound('orb');};soundLabel();pb();
function hint(text){$('#callout').textContent=text;toastUntil=performance.now()+750;}
function input(a){if(started&&!paused&&state.alive)pending=a;}
for(const a of ['left','right','jump','dash'])$('#'+a).addEventListener('pointerdown',e=>{e.preventDefault();input(a);});
window.addEventListener('keydown',e=>{if(!UX.inputAllowed(e.target)||!started)return;const a={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyX:'dash',ShiftLeft:'dash'}[e.code];if(a){e.preventDefault();if(!e.repeat)input(a);}if(e.code==='KeyP'&&!e.repeat)togglePause();});
let touchStart=null;canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<15)input('jump');else input(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'jump':'dash');});
for(const a of ['left','right','jump','dash'])$('#'+a).addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(!e.repeat)input(a);}});
function hud(){$('#score').textContent=state.score.toLocaleString();$('#time').textContent=Math.max(0,(R.MAX_TICKS-state.tick)/60).toFixed(1);$('#combo').textContent=state.combo;$('#energy').textContent=state.energy+'/5';$('#dash').classList.toggle('charged',state.energy>=5);}
function togglePause(){if(!started||!state.alive)return;paused=!paused;last=performance.now();acc=0;pending=null;
 if(paused&&challenge){challenge=null;UX.downgrade('Paused run.');}
 $('#pause').textContent=paused?'Resume':'Pause';$('#overlay').hidden=!paused;$('#resume').hidden=!paused;$('#start').hidden=paused;$('#resultLinks').hidden=true;
 if(paused){$('#overlayEyebrow').textContent='PAUSED';$('#overlayTitle').textContent='Take a breath.';$('#overlayText').textContent='This run is now practice. Your device record still counts.';$('#rankMessage').textContent='Resume when ready.';}
 UX.paused(paused);$('#runStatus').textContent=paused?'Paused · practice only':'Swipe or use arrows / Space / X.';
}
$('#pause').onclick=togglePause;$('#resume').onclick=()=>{togglePause();canvas.focus({preventScroll:true});};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&state.alive&&!paused)togglePause();});
document.addEventListener('game:help',()=>{if(started&&!paused)togglePause();});
async function launch(mode=UX.mode()){
 if(loadPending||started)return;loadPending=true;const prepared=await UX.prepare(mode);if(!prepared.ok){loadPending=false;return;}
 challenge=prepared.run;state=R.create(challenge?challenge.seed:seed);inputs=[];pending=null;acc=0;last=performance.now();clock=RankedClock.create();started=true;paused=false;finishing=false;fx=[];
 $('#overlay').hidden=true;$('#resume').hidden=true;$('#start').hidden=false;$('#pause').textContent='Pause';$('#pause').disabled=false;loadPending=false;UX.started(challenge);
 $('#runStatus').textContent=challenge?'Ranked run · verified after play.':'Practice run · device record only.';track('game_start',{ranked:!!challenge});hud();canvas.focus({preventScroll:true});sound('start');
}
$('#start').onclick=()=>launch(UX.mode());
async function finish(){if(finishing)return;finishing=true;started=false;loadPending=true;
 best=Math.max(best,state.score);try{localStorage.setItem('orbit_best_v1',String(best));}catch{}pb();hud();
 $('#overlayEyebrow').textContent=challenge?'RANKED RESULT':'PRACTICE RESULT';$('#overlayTitle').textContent=state.score.toLocaleString()+' points';$('#overlayText').textContent=state.orbs+' orbs · '+state.maxCombo+' best streak · '+(state.tick/60).toFixed(1)+'s';
 $('#overlay').hidden=false;$('#resume').hidden=true;$('#start').hidden=false;$('#pause').disabled=true;track('game_finish',{score:state.score,seconds:state.tick/60,ranked:!!challenge});
 const finishedRun=challenge;challenge=null;
 try{await UX.finished({run:finishedRun,actions:inputs,ticks:state.tick,score:state.score});}
 finally{loadPending=false;UX.buttons();$('#start').focus({preventScroll:true});}
}
function quad(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function laneX(lane,p){return 360+(lane-1)*(35+210*p);}
function project(lane,p){return{x:laneX(lane,p),y:200+570*p*p,scale:.25+p*.95};}
function render(now){const t=state.tick/60,idle=started?state.tick:(reduce?0:now/20),wave=Math.min(5,Math.floor(t/15));const accent=['#64edd4','#6ccaff','#bb97ff','#ff95be','#ffcf7f','#64edd4'][wave];
 const bg=ctx.createLinearGradient(0,0,0,900);bg.addColorStop(0,'#070b20');bg.addColorStop(.55,'#162243');bg.addColorStop(1,'#081020');ctx.fillStyle=bg;ctx.fillRect(0,0,720,900);
 for(let i=0;i<62;i++){let x=(i*131.73)%720,y=(i*73.19+(reduce?0:idle*.045))%340;ctx.globalAlpha=.2+(i%5)/10;ctx.fillStyle='#d9f8ff';ctx.fillRect(x,y,i%7===0?2:1,2);}ctx.globalAlpha=1;
 ctx.strokeStyle=accent+'30';ctx.lineWidth=2;ctx.beginPath();ctx.arc(540,145,80,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(540,145,120,24,-.3,0,Math.PI*2);ctx.stroke();
 quad([[284,198],[436,198],[720,900],[0,900]],'#0a142b','#365175');
 for(let l=0;l<4;l++){ctx.beginPath();ctx.moveTo(284+l*50.7,198);ctx.lineTo(l*240,900);ctx.strokeStyle=l===0||l===3?accent+'b0':'#4c658b66';ctx.lineWidth=l===0||l===3?3:1;ctx.stroke();}
 for(let i=0;i<14;i++){let p=((i/14+(idle%90)/90/14)%1);let y=198+702*p*p;let half=76+284*p;ctx.beginPath();ctx.moveTo(360-half,y);ctx.lineTo(360+half,y);ctx.strokeStyle=accent+'22';ctx.lineWidth=1;ctx.stroke();}
 state.rows.slice(state.row,state.row+6).reverse().forEach(row=>{let ahead=row.at-state.tick;if(ahead>180||ahead<0)return;let p=1-ahead/180;const q=project(row.lane,p),c=project(row.coin,p),w=62*q.scale,h=(row.kind==='pillar'?118:42)*q.scale;
 ctx.save();ctx.shadowBlur=reduce?0:15*q.scale;ctx.shadowColor='#fb548a';quad([[q.x-w/2,q.y-h],[q.x+w/2,q.y-h],[q.x+w/2,q.y],[q.x-w/2,q.y]],row.kind==='pillar'?'#471b40':'#57213f','#ff7fae');quad([[q.x-w/2,q.y-h],[q.x-w/2+12*q.scale,q.y-h-10*q.scale],[q.x+w/2+12*q.scale,q.y-h-10*q.scale],[q.x+w/2,q.y-h]],'#8e3966');ctx.restore();
 const ry=c.y-33*c.scale,orb=11*c.scale;ctx.save();ctx.translate(c.x,ry);ctx.rotate(reduce?0:idle*.025);ctx.shadowColor=accent;ctx.shadowBlur=15*c.scale;quad([[0,-orb],[orb,0],[0,orb],[-orb,0]],accent,'#edfffa');ctx.restore();});
 const jumping=state.tick<state.jumpUntil,jumpProgress=jumping?(42-(state.jumpUntil-state.tick))/42:0,jumpY=jumping?Math.sin(jumpProgress*Math.PI)*85:0,dashing=state.tick<state.dashUntil;
 let px=laneX(state.lane,1),py=772-jumpY;
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(px,810,34,10,0,0,Math.PI*2);ctx.fill();
 if(dashing){for(let i=1;i<7;i++){ctx.globalAlpha=(7-i)/18;quad([[px-18,py+18+i*12],[px+18,py+18+i*12],[px+6,py+58+i*12],[px-6,py+58+i*12]],accent);}ctx.globalAlpha=1;}
 ctx.save();ctx.shadowBlur=reduce?0:dashing?35:15;ctx.shadowColor=accent;quad([[px,py-37],[px+32,py+27],[px,py+13],[px-32,py+27]],'#bfd8ee',accent);quad([[px,py-22],[px+9,py+9],[px-9,py+9]],accent);quad([[px-8,py+22],[px+8,py+22],[px,py+43+(reduce?0:Math.sin(idle*.5)*6)]],dashing?'#fcce74':accent);ctx.restore();
 fx=fx.filter(p=>now-p.time<450);fx.forEach(p=>{const age=(now-p.time)/450;ctx.globalAlpha=1-age;ctx.fillStyle=p.color;ctx.fillRect(p.x+p.vx*age,p.y+p.vy*age,4,4);});ctx.globalAlpha=1;
 if(paused){ctx.fillStyle='#060b1baa';ctx.fillRect(0,0,720,900);ctx.textAlign='center';ctx.fillStyle='#eaf6ff';ctx.font='bold 42px system-ui';ctx.fillText('PAUSED',360,420);ctx.font='20px system-ui';ctx.fillText('Press Resume or P',360,460);}
 if(now>toastUntil)$('#callout').textContent='';
}
function frame(now){if(started&&!paused&&state.alive){const elapsedMs=Math.max(0,now-last);if(challenge&&!RankedClock.observe(clock,elapsedMs)){challenge=null;UX.downgrade('Frame timing became unstable.');$('#runStatus').textContent='Frame timing unstable · practice only.';}acc+=Math.min(.1,elapsedMs/1000);let n=0;while(acc>=1/60&&state.alive&&n++<6){if(pending){inputs.push([state.tick,pending]);}R.step(state,pending);pending=null;acc-=1/60;if(state.lastEvent){const e=state.lastEvent;if(e==='orb'){sound(e);if(state.combo%5===0)hint(state.combo+' ORB STREAK');if(!reduce)for(let i=0;i<10;i++)fx.push({x:laneX(state.lane,1),y:725,vx:Math.cos(i)*65,vy:Math.sin(i)*65,time:now,color:'#64edd4'});}if(e==='dash'){sound(e);hint('DASH ACTIVE');}if(e==='crash'||e==='win'){sound(e==='win'?'orb':'crash');}}}hud();if(!state.alive)finish();}last=now;render(now);requestAnimationFrame(frame);}
(async()=>{const cfg=await UX.boot();seed=cfg?.seed||seed;if(!started&&!loadPending)state=R.create(seed);})();
window.LoopJoltSnapshot=()=>JSON.parse(JSON.stringify({state,active:started,paused,ranked:!!challenge,inputCount:inputs.length}));
track('game_open');requestAnimationFrame(frame);
})();
