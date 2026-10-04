/* Factory-owned Halo Guard play authority. Presentation may observe, never redefine it. */
(function(root){'use strict';
const VERSION='halo-guard-core-v1',TAU=Math.PI*2;
const DEFAULTS=Object.freeze({duration:40,fast_phases:false});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const angleDistance=(a,b)=>Math.abs(((a-b+Math.PI*3)%TAU)-Math.PI);

function random(state){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296;}
function emit(state,kind,data={}){if(state.events.length<96)state.events.push({kind,...data});}
function create(seed=1,options={}){
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('invalid_seed');
  const config={...DEFAULTS,...options};
  if(!Number.isFinite(config.duration)||config.duration<=0||config.duration>90)throw Error('invalid_duration');
  return {version:VERSION,seed,rng:seed>>>0,config,phase:1,status:'ready',outcome:null,reason:null,running:false,left:config.duration,elapsed:0,tick:0,score:0,combo:0,bestCombo:0,caught:0,lives:4,barrier:2,angle:Math.PI/2,targetAngle:Math.PI/2,spawn:.35,spawnCount:0,energy:0,overdrive:0,guardianKick:0,nextId:1,items:[],events:[]};
}
function begin(state){if(state.status!=='ready')return false;state.status='playing';state.running=true;emit(state,'start');return true;}
function setTarget(state,angle){if(state.status!=='playing'||!Number.isFinite(angle))return false;state.targetAngle=((angle%TAU)+TAU)%TAU;return true;}
function nudge(state,direction){if(!['left','right'].includes(direction)||state.status!=='playing')return false;state.targetAngle+=direction==='left'?.36:-.36;return true;}
function terminal(state,outcome,reason){if(state.outcome)return;state.running=false;state.status='terminal';state.outcome=outcome;state.reason=reason;emit(state,'terminal',{outcome,reason});}
function spawnItem(state){
  state.spawnCount++;
  const bad=state.spawnCount===3||random(state)<.09+state.phase*.035;
  const item={id:state.nextId++,angle:-Math.PI+random(state)*TAU,currentAngle:0,r:7.6,speed:.84+state.phase*.16+random(state)*.14,bad,pulse:random(state)*6.2,wobble:.018+random(state)*.025,done:false};
  item.currentAngle=item.angle;state.items.push(item);emit(state,'spawn',{id:item.id,bad:item.bad});
}
function catchItem(state,item){
  item.done=true;state.guardianKick=.32;
  if(item.bad){
    const absorbed=state.barrier>0;if(absorbed)state.barrier--;else state.lives--;
    state.combo=0;state.energy=Math.max(0,state.energy-25);emit(state,'catch_bad',{id:item.id,absorbed,lives:state.lives,barrier:state.barrier,angle:item.currentAngle});
    if(state.lives<=0)terminal(state,'failure','defense_collapsed');
    return;
  }
  state.caught++;state.combo++;state.bestCombo=Math.max(state.bestCombo,state.combo);state.energy=Math.min(100,state.energy+12+Math.min(8,state.combo));
  if(state.energy>=100&&state.overdrive<=0){state.overdrive=5.5;state.energy=0;emit(state,'overdrive');}
  const points=(70+state.combo*12)*(state.overdrive>0?2:1);state.score+=points;
  emit(state,'catch_good',{id:item.id,points,combo:state.combo,angle:item.currentAngle,overdrive:state.overdrive>0});
}
function step(state,seconds){
  state.events=[];if(state.status!=='playing')return state;
  const dt=clamp(Number(seconds)||0,0,.05);state.tick++;state.left=Math.max(0,state.left-dt);state.elapsed+=dt;state.guardianKick=Math.max(0,state.guardianKick-dt*2.4);state.overdrive=Math.max(0,state.overdrive-dt);
  if(state.left<=0){terminal(state,'success','defense_complete');return state;}
  const nextPhase=state.config.fast_phases?Math.min(3,1+Math.floor(state.elapsed/1.1)):Math.min(3,1+Math.floor(state.caught/10));
  if(nextPhase!==state.phase){state.phase=nextPhase;emit(state,'phase',{phase:state.phase});}
  const delta=((state.targetAngle-state.angle+Math.PI*3)%TAU)-Math.PI;state.angle+=delta*Math.min(1,dt*(10+state.phase));
  state.spawn-=dt;if(state.spawn<=0){spawnItem(state);state.spawn=Math.max(.34,.92-state.phase*.12-(state.overdrive>0?.05:0));}
  for(const item of state.items){
    item.pulse+=dt*(item.bad?9:6);item.currentAngle=item.angle+Math.sin(item.pulse*.7)*item.wobble;item.r-=item.speed*(item.bad&&item.r<5.7?1.16:1)*dt;
    if(item.r<4.45&&item.r>3.45&&!item.done&&angleDistance(item.currentAngle,state.angle)<(state.overdrive>0?.6:.42))catchItem(state,item);
    if(item.r<1.75&&!item.done){item.done=true;if(!item.bad){state.combo=0;state.energy=Math.max(0,state.energy-10);}emit(state,'miss',{id:item.id,bad:item.bad});}
    if(state.outcome)break;
  }
  state.items=state.items.filter(item=>!item.done);return state;
}
function observe(state){return {version:state.version,status:state.status,outcome:state.outcome,reason:state.reason,tick:state.tick,phase:state.phase,left:state.left,score:state.score,progress:state.caught,combo:state.combo,best_combo:state.bestCombo,lives:state.lives,barrier:state.barrier,angle:state.angle,entities:state.items.length,interactions:state.caught+(2-state.barrier)+(4-state.lives)};}
function isTerminal(state){return state.status==='terminal'&&['success','failure'].includes(state.outcome);}
const api=Object.freeze({VERSION,DEFAULTS,create,begin,setTarget,nudge,step,observe,terminal:isTerminal,angleDistance});
root.HaloGuardCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
