/* Astra Sentinel: deterministic, DOM-free, original arena rules. Local expedition only. */
(function(root){'use strict';
const VERSION='astra-v1',W=720,H=820,MAX_TICKS=43200;
const REGIONS=Object.freeze(['VERDANT RELIQUARY','PRISM FOUNDRY','SOLAR CITADEL']);
const FORMS=Object.freeze(['SCOUT','PLATED SCOUT','LANCE KNIGHT','AEGIS KNIGHT','PRISM WARDEN','WINGED WARDEN','SERAPH FRAME','SOLAR SERAPH','ASCENDANT','ASTRA SENTINEL']);
const UPGRADES=Object.freeze([
 {id:'power',name:'STARFIRE CORE',tag:'DAMAGE',text:'Add 25% of base bolt damage. Stacks additively.',max:3},
 {id:'twin',name:'TWIN LANCES',tag:'MULTISHOT',text:'Fire an additional parallel bolt. Up to 3 bolts.',max:2},
 {id:'rapid',name:'QUICKENING',tag:'FIRE RATE',text:'Reduce the time between volleys by 18%.',max:3},
 {id:'orbit',name:'HALO BLADES',tag:'ORBITAL',text:'Add an orbiting blade that cuts nearby enemies.',max:3},
 {id:'arc',name:'ARC RELAY',tag:'CHAIN',text:'Periodically arc lightning between 3 nearby enemies.',max:2},
 {id:'armor',name:'AEGIS PLATING',tag:'DEFENSE',text:'+24 maximum hull. Take 12% less damage.',max:3},
 {id:'flux',name:'PHASE DRIVE',tag:'DASH',text:'Reduce dash cooldown by 25%; move 8% faster.',max:2},
 {id:'pierce',name:'PRISM ROUNDS',tag:'PIERCING',text:'Bolts pierce one more target and travel farther.',max:2},
 {id:'repair',name:'LIVING METAL',tag:'REPAIR',text:'Restore all hull and add 12 maximum hull.',max:3}
].map(Object.freeze));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),len=(x,y)=>Math.hypot(x,y),dist=(a,b)=>len(a.x-b.x,a.y-b.y);
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
function event(s,kind,data={}){if(s.events.length<96)s.events.push({kind,...data});}
function tuning(stage){return {quota:stage%3===0?9+stage:12+stage*6,interval:Math.max(27,75-stage*5),hp:1+(stage-1)*.30,speed:1+(stage-1)*.085,damage:10+stage*1.8,bossHp:stage===3?720:stage===6?1850:3800};}
function stats(s){const u=s.upgrades,t=s.tier;return {damage:(12+t*2.3)*(1+.25*u.power),rate:Math.max(10,Math.round((29-t*.8)*Math.pow(.82,u.rapid))),speed:3.3*(1+.08*u.flux),bolts:1+u.twin,pierce:u.pierce,dashCd:Math.round(205*Math.pow(.75,u.flux)),drones:Math.floor(t/3),armor:Math.pow(.88,u.armor)};}
function create(seed=1){if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('invalid_seed');return {version:VERSION,seed,rng:seed>>>0,tick:0,stage:1,stageTick:0,cleared:0,tier:0,phase:'ready',score:0,kills:0,dashes:0,damageTaken:0,player:{x:360,y:540,hp:100,maxHp:100,inv:0,dash:0,dashCd:0,dx:0,dy:-1,shot:0,droneShot:60,arc:100},upgrades:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),offers:[],enemies:[],bullets:[],hostile:[],zones:[],pickups:[],events:[],spawned:0,spawnClock:110,bossSpawned:false,bossDead:false,nextId:1,reason:null};}
function begin(s){if(s.phase!=='ready')return false;s.phase='playing';event(s,'stage',{stage:s.stage});return true;}
function options(s){const pool=UPGRADES.filter(u=>s.upgrades[u.id]<u.max).map(u=>u.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
function choose(s,id){if(s.phase!=='upgrade'||!s.offers.includes(id))return false;const u=UPGRADES.find(x=>x.id===id);if(!u||s.upgrades[id]>=u.max)return false;s.events=[];s.upgrades[id]++;if(id==='armor'){s.player.maxHp+=24;s.player.hp=Math.min(s.player.maxHp,s.player.hp+24);}if(id==='repair'){s.player.maxHp+=12;s.player.hp=s.player.maxHp;}s.stage++;s.stageTick=0;s.spawned=0;s.spawnClock=110;s.bossSpawned=false;s.bossDead=false;s.enemies=[];s.bullets=[];s.hostile=[];s.zones=[];s.pickups=[];s.offers=[];s.player.x=360;s.player.y=560;s.player.inv=100;s.player.dashCd=0;s.phase='playing';event(s,'evolve',{tier:s.tier,id});event(s,'stage',{stage:s.stage});return true;}
function spawn(s,type,boss=false){if(s.enemies.length>=48)return;const p=s.player,t=tuning(s.stage);let x=0,y=0;for(let n=0;n<12;n++){const side=Math.floor(random(s)*4);x=side<2?(side?656:64):90+random(s)*540;y=side<2?135+random(s)*550:(side===2?130:690);if(len(x-p.x,y-p.y)>220)break;}if(boss){x=360;y=195;}
const hp=boss?t.bossHp:Math.round(({strider:20,wisp:28,lancer:32,tank:68}[type])*t.hp);
s.enemies.push({id:s.nextId++,type:boss?'boss':type,x,y,r:boss?45:type==='tank'?24:17,hp,maxHp:hp,age:0,warning:boss?120:45,cool:boss?170:100+Math.floor(random(s)*75),attack:0,aim:0,flash:0,boss:boss?Math.floor(s.stage/3):0,phase:1});event(s,'spawn',{x,y,boss});}
function enemyType(s){const r=random(s);if(s.stage>=5&&r<.18)return'tank';if(s.stage>=4&&r<.4)return'lancer';if(s.stage>=2&&r<.65)return'wisp';return'strider';}
function damage(s,e,amount){if(e.hp<=0||e.warning>0)return;e.hp-=amount;e.flash=6;event(s,'hit',{x:e.x,y:e.y,amount:Math.ceil(amount)});if(e.hp<=0){s.kills++;s.score+=e.type==='boss'?1200*s.stage:Math.round(e.maxHp*3);event(s,'kill',{x:e.x,y:e.y,type:e.type,boss:e.boss});if(e.type==='boss')s.bossDead=true;if(s.pickups.length<32&&random(s)<.16)s.pickups.push({x:e.x,y:e.y,life:800});}}
function hurt(s,amount,x,y){const p=s.player;if(p.inv>0||p.dash>0||s.phase!=='playing')return;const taken=Math.round(amount*stats(s).armor);p.hp=Math.max(0,p.hp-taken);p.inv=48;s.damageTaken+=taken;event(s,'hurt',{x:p.x,y:p.y,amount:taken});if(p.hp===0){s.phase='dead';s.reason='hull_depleted';event(s,'defeat');}}
function shoot(s,x,y,a,damageValue,extra={}){if(s.bullets.length>=140)return;s.bullets.push({id:s.nextId++,x,y,px:x,py:y,vx:Math.cos(a)*9.5,vy:Math.sin(a)*9.5,life:75+stats(s).pierce*12,damage:damageValue,pierce:stats(s).pierce,hit:[],...extra});}
function hostile(s,x,y,a,speed=2.8,r=6){if(s.hostile.length<180)s.hostile.push({x,y,px:x,py:y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:260,r});}
function zone(s,x,y,r,delay=60){if(s.zones.length<20)s.zones.push({x:clamp(x,68,652),y:clamp(y,134,694),r,age:0,delay,life:delay+22});}
function segmentDistance(x,y,a,b){const vx=b.x-a.x,vy=b.y-a.y,t=clamp(((x-a.x)*vx+(y-a.y)*vy)/(vx*vx+vy*vy||1),0,1);return len(x-a.x-vx*t,y-a.y-vy*t);}
function step(s,input={}){
 s.events=[];if(s.phase!=='playing')return s;
 const mx=Number.isFinite(input.x)?clamp(input.x,-1,1):0,my=Number.isFinite(input.y)?clamp(input.y,-1,1):0;
 s.tick++;s.stageTick++;const p=s.player,st=stats(s),t=tuning(s.stage),norm=Math.max(1,len(mx,my));if(p.inv>0)p.inv--;if(p.dashCd>0)p.dashCd--;
 if(len(mx,my)>.08){p.dx=mx/norm;p.dy=my/norm;}
 if(input.dash===true&&p.dashCd===0){p.dash=16;p.inv=Math.max(p.inv,20);p.dashCd=st.dashCd;s.dashes++;event(s,'dash',{x:p.x,y:p.y,dx:p.dx,dy:p.dy});}
 if(p.dash>0){p.x+=p.dx*9;p.y+=p.dy*9;p.dash--;}else{p.x+=mx/norm*st.speed;p.y+=my/norm*st.speed;}
 p.x=clamp(p.x,57,663);p.y=clamp(p.y,125,709);
 if(s.spawned<t.quota&&--s.spawnClock<=0){for(let i=0;i<1+Math.floor((s.stage-1)/3)&&s.spawned<t.quota;i++){spawn(s,enemyType(s));s.spawned++;}s.spawnClock=t.interval;}
 if(s.stage%3===0&&!s.bossSpawned&&s.stageTick>=120){spawn(s,'boss',true);s.bossSpawned=true;event(s,'boss',{boss:s.stage/3});}
 if(s.stage>=4&&s.stageTick>180&&s.stageTick%Math.max(100,230-s.stage*12)===0){zone(s,p.x+p.dx*35,p.y+p.dy*35,40+s.stage*3,62);if(s.stage>=7)zone(s,110+random(s)*500,185+random(s)*420,66,90);}
 const targets=s.enemies.filter(e=>e.hp>0&&e.warning===0).sort((a,b)=>dist(a,p)-dist(b,p));
 if(--p.shot<=0&&targets.length){const e=targets[0],a=Math.atan2(e.y-p.y,e.x-p.x);p.aim=a;p.shot=st.rate;for(let i=0;i<st.bolts;i++){const off=(i-(st.bolts-1)/2)*12;shoot(s,p.x-Math.sin(a)*off,p.y+Math.cos(a)*off,a,st.damage);}event(s,'shot',{x:p.x,y:p.y});}
 if(st.drones&&--p.droneShot<=0&&targets.length){p.droneShot=46;for(let i=0;i<st.drones;i++){const a=s.tick*.025+i*Math.PI*2/st.drones,x=p.x+Math.cos(a)*43,y=p.y+Math.sin(a)*30,e=targets[i%targets.length];shoot(s,x,y,Math.atan2(e.y-y,e.x-x),st.damage*.65,{drone:true});}}
 if(s.upgrades.arc&&--p.arc<=0&&targets.length){p.arc=Math.max(55,140-s.upgrades.arc*25);let from=p;for(const e of targets.slice(0,2+s.upgrades.arc)){if(dist(e,from)>285)break;damage(s,e,st.damage*1.7);event(s,'arc',{x:from.x,y:from.y,x2:e.x,y2:e.y});from=e;}}
 for(const e of s.enemies){if(e.hp<=0)continue;e.age++;e.flash=Math.max(0,e.flash-1);if(e.warning>0){e.warning--;continue;}const d=dist(e,p),a=Math.atan2(p.y-e.y,p.x-e.x),move=(speed,angle=a)=>{e.x+=Math.cos(angle)*speed;e.y+=Math.sin(angle)*speed;};
 if(e.type==='strider')move(.95*t.speed);
 if(e.type==='tank')move(.61*t.speed);
 if(e.type==='wisp'){if(d>265)move(.58*t.speed);else if(d<155)move(-.4);if(--e.cool===35)e.aim=a;if(e.cool<=0){const spread=s.stage>=5?.18:0;hostile(s,e.x,e.y,e.aim,2.3+s.stage*.14);if(spread){hostile(s,e.x,e.y,e.aim+spread,2.3);hostile(s,e.x,e.y,e.aim-spread,2.3);}e.cool=185-s.stage*5;}}
 if(e.type==='lancer'){e.cool--;if(e.cool===40)e.aim=a;if(e.cool>40)move(.4);else if(e.cool<=0){move(4.5,e.aim);if(e.cool<=-25)e.cool=165;}}
 if(e.type==='boss'){e.phase=e.hp<e.maxHp*.5?2:1;move((d>205?.32:-.14)*t.speed);e.cool--;if(e.cool===50){e.aim=a;if(e.boss>=2){zone(s,p.x,p.y,43+e.boss*6,65);if(e.boss===3){zone(s,p.x+85,p.y,43,80);zone(s,p.x-85,p.y,43,80);}}event(s,'telegraph',{x:e.x,y:e.y,boss:e.boss});}if(e.cool<=0){const n=8+e.boss*2+(e.phase===2?4:0),offset=e.attack*.29;for(let i=0;i<n;i++)hostile(s,e.x,e.y,offset+i*Math.PI*2/n,2.05+e.boss*.28,7);if(e.boss>=2)for(let i=-1;i<=1;i++)hostile(s,e.x,e.y,e.aim+i*.14,3.8,6);e.attack++;e.cool=(e.boss===1?145:115)-(e.phase===2?30:0);event(s,'bossShot',{x:e.x,y:e.y});}}
 e.x=clamp(e.x,45,675);e.y=clamp(e.y,113,720);
 if(dist(e,p)<e.r+13)hurt(s,t.damage+(e.boss?7:0),e.x,e.y);
 if(s.upgrades.orbit&&s.tick%9===0){for(let i=0;i<s.upgrades.orbit;i++){const a=s.tick*.065+i*2*Math.PI/s.upgrades.orbit,b={x:p.x+Math.cos(a)*64,y:p.y+Math.sin(a)*64};if(dist(e,b)<e.r+14)damage(s,e,st.damage*.75);}}
 }
 // Small physical separation keeps silhouettes readable without changing hit origins.
 for(let i=0;i<s.enemies.length;i++)for(let j=i+1;j<s.enemies.length;j++){const a=s.enemies[i],b=s.enemies[j],d=dist(a,b),over=(a.r+b.r)*.75-d;if(d>.1&&over>0){const dx=(a.x-b.x)/d*over*.13,dy=(a.y-b.y)/d*over*.13;a.x+=dx;a.y+=dy;b.x-=dx;b.y-=dy;}}
 for(const b of s.bullets){b.px=b.x;b.py=b.y;b.x+=b.vx;b.y+=b.vy;b.life--;for(const e of s.enemies){if(e.hp>0&&e.warning===0&&!b.hit.includes(e.id)&&segmentDistance(e.x,e.y,{x:b.px,y:b.py},b)<e.r+4){damage(s,e,b.damage);b.hit.push(e.id);if(b.pierce--<=0){b.life=0;break;}}}}
 s.bullets=s.bullets.filter(b=>b.life>0&&b.x>-30&&b.x<750&&b.y>60&&b.y<790);
 for(const b of s.hostile){b.px=b.x;b.py=b.y;b.x+=b.vx;b.y+=b.vy;b.life--;if(segmentDistance(p.x,p.y,{x:b.px,y:b.py},b)<b.r+12){if(p.dash>0)event(s,'graze',{x:b.x,y:b.y});else hurt(s,t.damage*.85,b.x,b.y);b.life=0;}}
 s.hostile=s.hostile.filter(b=>b.life>0&&b.x>20&&b.x<700&&b.y>85&&b.y<750);
 for(const z of s.zones){z.age++;if(z.age===z.delay){event(s,'blast',{x:z.x,y:z.y,r:z.r});if(dist(p,z)<z.r+10)hurt(s,t.damage*1.2,z.x,z.y);}z.life--;}
 s.zones=s.zones.filter(z=>z.life>0);
 for(const h of s.pickups){h.life--;if(dist(h,p)<90){h.x+=(p.x-h.x)*.08;h.y+=(p.y-h.y)*.08;}if(s.phase==='playing'&&dist(h,p)<24){p.hp=Math.min(p.maxHp,p.hp+10);h.life=0;event(s,'heal',{x:p.x,y:p.y});}}
 s.pickups=s.pickups.filter(h=>h.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);
 if(s.phase==='playing'&&s.spawned===t.quota&&s.enemies.length===0&&(s.stage%3!==0||s.bossDead)){
 s.cleared=s.stage;s.tier=s.stage;p.maxHp+=6;p.hp=Math.min(p.maxHp,p.hp+24);s.score+=s.stage*450;s.hostile=[];s.zones=[];s.bullets=[];
 if(s.stage===9){s.phase='victory';s.reason='citadel_reclaimed';event(s,'victory');}else{s.phase='upgrade';s.offers=options(s);event(s,'clear',{stage:s.stage,tier:s.tier});}}
 if(s.tick>=MAX_TICKS&&s.phase==='playing'){s.phase='dead';s.reason='reactor_timeout';event(s,'defeat');}return s;
}
root.AstraRules=Object.freeze({VERSION,W,H,MAX_TICKS,REGIONS,FORMS,UPGRADES,tuning,stats,create,begin,step,choose,segmentDistance});if(typeof module!=='undefined')module.exports=root.AstraRules;
})(globalThis);
