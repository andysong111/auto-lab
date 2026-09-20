/* Deep Descent: canonical integer-tick rules shared by browser and server.
 * Screen-space contact is ALWAYS the front of the ring (900 / 3600 of a turn).
 * Phaser, animation, particles, audio and wall-clock never decide a score. */
(function(root){
'use strict';
const VERSION='gd-descent-v2', GAME='gyro-drop', FPS=60, MAX_TICKS=5400;
const FLOORS=48, CONTACT=900, MAX_INPUTS=2500;
const REGIONS=Object.freeze(['Sky Sanctuary','Crystal Vault','Ember Engine']);
const mod=(n,m=3600)=>(n%m+m)%m;
const distance=(a,b)=>Math.abs(mod(a-b+1800)-1800);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function random(s){s.rng=(s.rng+0x6D2B79F5)>>>0;let t=s.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function emit(s,kind,extra={}){s.events.push({kind,floor:s.floor,tick:s.tick,...extra});}
function create(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('invalid_seed');
 const s={game:GAME,version:VERSION,seed,rng:seed>>>0,tick:0,motion:0,rotation:0,steer:0,
  floor:0,health:3,energy:0,burst:0,focusUntil:0,combo:0,maxCombo:0,score:0,
  perfects:0,hits:0,misses:0,guardians:0,alive:true,won:false,reason:'',
  nextImpact:108,lastImpact:0,cycle:108,bounces:0,rings:[],events:[]};
 for(let i=0;i<FLOORS;i++){
  const region=Math.floor(i/16),guardian=i%16===15;
  const kind=guardian?'guardian':i<4?'stone':i%7===3?'brittle':i>=18&&i%4===2?'laser':i%3===2?'drift':'stone';
  const gap=i===0?CONTACT+650:Math.floor(random(s)*3600);
  const speed=kind==='drift'||guardian?(random(s)<.5?-1:1)*(2+region*2):0;
  s.rings.push({index:i,region,stage:Math.floor(i/4)+1,kind,gap,
   width:i<4?820:guardian?660:Math.max(480,740-region*75-(i%4)*25),
   hazard:mod(gap+1550+Math.floor(random(s)*350)),hazardWidth:400+region*160,
   speed,phase:Math.floor(random(s)*300),gift:i%8===7?'focus':i%8===3?'energy':null});
 }
 return s;
}
function ringAt(s,index=s.floor){
 const r=s.rings[index];if(!r)return null;
 const turn=mod(s.rotation+Math.trunc(s.motion*r.speed/2));
 const pulse=mod(s.motion+r.phase,360);
 const gate=r.kind==='guardian'||r.kind==='laser';
 return {...r,turn,center:mod(r.gap+turn),redCenter:mod(r.hazard+turn),
  open:!gate||pulse>=105&&pulse<290,warning:gate&&(pulse>=65&&pulse<105||pulse>=255&&pulse<290)};
}
function contact(s,index=s.floor){
 const r=ringAt(s,index);if(!r)return {kind:'complete'};
 const inGap=distance(CONTACT,r.center)<=r.width/2;
 return {kind:inGap?(r.open?'gap':'gate'):distance(CONTACT,r.redCenter)<=r.hazardWidth/2?'danger':'solid',
  perfect:inGap&&r.open&&distance(CONTACT,r.center)<r.width*.17,ring:r};
}
function finish(s,reason,won=false){
 s.alive=false;s.won=won;s.reason=reason;s.steer=0;
 if(won)s.score+=1500+s.health*200+Math.floor((MAX_TICKS-s.tick)/12);
 emit(s,won?'complete':'end',{reason});
}
function clear(s,hit,mode){
 const i=s.floor,r=hit.ring;let value;
 if(mode==='burst'){s.burst--;s.combo=0;value=150;}
 else if(mode==='brittle'){s.combo=0;value=90;}
 else{s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);if(hit.perfect)s.perfects++;
  value=130+r.stage*5+Math.min(s.combo,8)*25+(hit.perfect?70:0);
  s.energy=Math.min(100,s.energy+23+(hit.perfect?14:0));}
 if(r.kind==='guardian'){s.guardians++;value+=450;}
 s.hits++;s.score+=value;s.floor++;s.bounces=0;
 if(r.gift==='energy')s.energy=Math.min(100,s.energy+20);
 if(r.gift==='focus'){s.focusUntil=s.tick+300;emit(s,'focus');}
 if(s.floor%16===0&&s.floor<FLOORS){s.health=Math.min(3,s.health+1);emit(s,'region',{region:Math.floor(s.floor/16)});}
 emit(s,mode==='burst'?'shatter':mode==='brittle'?'crumble':hit.perfect?'perfect':'drop',{from:i,value,guardian:r.kind==='guardian',gift:r.gift});
 if(s.floor>=FLOORS){finish(s,'engine_reached',true);return;}
 s.cycle=mode==='burst'?25:43;s.lastImpact=s.tick;s.nextImpact=s.tick+s.cycle;
}
function step(s,a=null){
 if(!s.alive)return s;s.events=[];
 if(a){
  if(a[0]==='steer')s.steer=a[1];
  if(a[0]==='turn')s.rotation=mod(s.rotation+a[1]);
  if(a[0]==='burst'&&s.energy>=100&&s.burst===0){s.energy=0;s.burst=3;s.combo=0;emit(s,'burst');}
 }
 s.rotation=mod(s.rotation+s.steer*40);
 s.motion+=s.tick<s.focusUntil?1:2;
 if(s.tick>=s.nextImpact){
  const hit=contact(s),r=hit.ring;
  if(!r){finish(s,'engine_reached',true);}
  else if(s.burst>0||hit.kind==='gap')clear(s,hit,s.burst>0?'burst':'clean');
  else if(r.kind==='brittle'&&hit.kind==='solid'&&s.bounces>=1)clear(s,hit,'brittle');
  else{
   s.combo=0;s.bounces++;s.lastImpact=s.tick;s.cycle=65;s.nextImpact=s.tick+65;
   if(hit.kind==='danger'||hit.kind==='gate'){
    s.health--;s.misses++;s.energy=Math.max(0,s.energy-15);emit(s,'damage',{cause:hit.kind});
    if(s.health<=0){s.health=0;finish(s,hit.kind==='gate'?'closed_gate':'red_plate');}
   }else emit(s,'bounce',{brittle:r.kind==='brittle'});
  }
 }
 s.tick++;
 if(s.alive&&s.tick>=MAX_TICKS)finish(s,'time_up');
 s.score=Math.max(0,Math.round(s.score));return s;
}
function validAction(e,ticks,last){
 if(!Array.isArray(e)||!Number.isInteger(e[0])||e[0]<=last||e[0]<0||e[0]>=ticks)return false;
 return e.length===2&&e[1]==='burst'||e.length===3&&(e[1]==='steer'&&[-1,0,1].includes(e[2])||e[1]==='turn'&&Number.isInteger(e[2])&&e[2]!==0&&Math.abs(e[2])<=150);
}
function replay(seed,actions,ticks){
 if(!Number.isInteger(ticks)||ticks<1||ticks>MAX_TICKS)throw Error('invalid_duration');
 if(!Array.isArray(actions)||actions.length>MAX_INPUTS)throw Error('invalid_inputs');
 let last=-1;for(const a of actions){if(!validAction(a,ticks,last))throw Error('invalid_input_order');last=a[0];}
 const s=create(seed);let i=0;
 while(s.alive&&s.tick<ticks){const a=actions[i];step(s,a&&a[0]===s.tick?actions[i++].slice(1):null);}
 if(s.alive||s.tick!==ticks||i!==actions.length||s.score>50000)throw Error('incomplete_or_extra_inputs');
 return {score:s.score,ticks:s.tick,orbs:s.hits,maxCombo:s.maxCombo,won:s.won,version:VERSION};
}
const api={GAME,VERSION,FPS,MAX_TICKS,FLOORS,CONTACT,MAX_INPUTS,REGIONS,create,step,ringAt,contact,replay,distance,mod,clamp};
root.DescentRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
