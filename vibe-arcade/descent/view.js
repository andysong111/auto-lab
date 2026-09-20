/* Deep Descent presentation. Rules own every collision and score. */
(function(root){'use strict';
const R=DescentRules,A=DescentArt;
const W=600,H=840,CX=300,CY=303,RX=213,RY=76,SPACE=97;
const rad=n=>n*Math.PI/1800;
function point(angle,radius,y,scale=1){return {x:CX+Math.cos(rad(angle))*radius*scale,y:y+Math.sin(rad(angle))*RY*(radius/RX)*scale};}
function shade(color,f){const r=Math.min(255,((color>>16)&255)*f),g=Math.min(255,((color>>8)&255)*f),b=Math.min(255,(color&255)*f);return (r<<16)|(g<<8)|b;}
function make(options){
 let instance=null;
 class Scene extends Phaser.Scene{
  constructor(){super('descent');this.depthValue=0;this.region=0;this.pieces=[];this.floaters=[];this.lastState=null;this.lastDrag=null;this.turnQueue=0;this.lastGuardian=-1;this.introDismissed=false;}
  create(){
   instance=this;A.make(this);
   this.bg=this.add.image(300,420,'dd-bg-0').setDisplaySize(W,H);
   this.nextBg=this.add.image(300,420,'dd-bg-1').setDisplaySize(W,H).setAlpha(0);
   this.clouds=[this.add.image(90,185,'dd-cloud').setScale(1.8,.9).setAlpha(.4),this.add.image(500,580,'dd-cloud').setScale(1.5,1).setAlpha(.4)];
   this.rear=this.add.graphics();this.pole=this.add.tileSprite(CX,470,76,820,'dd-pole').setTileScale(.53,1);
   this.front=this.add.graphics();this.guardian=this.add.image(CX,CY-85,'dd-guardian-0').setScale(.54).setVisible(false);this.sealMarks=this.add.graphics();this.halo=this.add.image(CX,CY+RY-23,'dd-glow').setTint(0x75ffee).setScale(.9).setAlpha(.5);
   this.hero=this.add.image(CX,CY+RY-24,'dd-orb').setScale(.47);this.fx=this.add.graphics();
   this.regionText=this.add.text(28,24,'01 / SKY SANCTUARY',{fontFamily:'system-ui',fontSize:'11px',fontStyle:'bold',color:'#eeffed'});
   this.sectorText=this.add.text(572,24,'SECTOR 01 / 12',{fontFamily:'system-ui',fontSize:'11px',color:'#eeffed'}).setOrigin(1,0);
   this.notice=this.add.text(CX,102,'FIND THE OPENING',{fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#fff9df',align:'center'}).setOrigin(.5);
   this.helper=this.add.text(CX,130,'Drag the tower · your drone stays at the front',{fontFamily:'system-ui',fontSize:'12px',color:'#d4e8dd'}).setOrigin(.5);
   this.context=this.add.text(CX,724,'',{fontFamily:'system-ui',fontSize:'13px',color:'#ffffff',backgroundColor:'#163735b0',padding:{x:14,y:8}}).setOrigin(.5);
   this.input.on('pointerdown',p=>{if(!options.isPlaying())return;this.lastDrag=p.x;options.action(['steer',0]);});
   this.input.on('pointermove',p=>{if(this.lastDrag===null||!p.isDown||!options.isPlaying())return;const dx=p.x-this.lastDrag;this.lastDrag=p.x;options.turn(dx*6);});
   const release=()=>{this.lastDrag=null;};this.input.on('pointerup',release);this.input.on('pointerupoutside',release);this.input.on('gameout',release);
   this.game.canvas.tabIndex=0;this.game.canvas.setAttribute('aria-label','Rotate with left and right arrows or drag. Press Space for a charged burst.');
   this.game.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();options.contextLost?.();});
   options.ready?.();
  }
  polygon(g,pts,color,alpha=1){g.fillStyle(color,alpha);g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillPath();}
  ring(s,index,front){
   const r=R.ringAt(s,index);if(!r)return;
   const rel=index-this.depthValue,y=CY+rel*SPACE,scale=Math.max(.64,1-rel*.035);
   if(y<-180||y>930)return;
   const theme=A.THEMES[r.region],g=front?this.front:this.rear,outer=RX,inner=61;
   const bounds=[...Array.from({length:37},(_,i)=>i*100),R.mod(r.center-r.width/2),R.mod(r.center+r.width/2),R.mod(r.redCenter-r.hazardWidth/2),R.mod(r.redCenter+r.hazardWidth/2)].sort((a,b)=>a-b);
   for(let i=1;i<bounds.length;i++){
    const a=bounds[i-1],b=bounds[i],mid=(a+b)/2;if(b-a<.05||((Math.sin(rad(mid))>=0)!==front))continue;
    const inGap=R.distance(mid,r.center)<r.width/2;
    if(inGap){
     if(!r.open){const p1=point(a,inner,y,scale),p2=point(b,inner,y,scale),p3=point(b,outer,y,scale),p4=point(a,outer,y,scale);this.polygon(g,[p1,p2,p3,p4],0xff596a,.75);g.lineStyle(1,0xffe1bc,.7);g.lineBetween(p1.x,p1.y,p3.x,p3.y);}
     continue;
    }
    const danger=R.distance(mid,r.redCenter)<r.hazardWidth/2;
    const top=danger?0xe85864:r.kind==='brittle'?0x8fa696:theme.top;
    const thickness=r.kind==='guardian'?26:17;
    const p1=point(a,inner,y,scale),p2=point(b,inner,y,scale),p3=point(b,outer,y,scale),p4=point(a,outer,y,scale);
    const f=.86+.17*Math.cos(rad(mid-700));
    this.polygon(g,[p4,p3,{x:p3.x,y:p3.y+thickness},{x:p4.x,y:p4.y+thickness}],danger?0x812c40:shade(theme.side,f));
    this.polygon(g,[p1,p2,p3,p4],shade(top,f));
    g.lineStyle(1.2,danger?0xffb38a:theme.rim,.75);g.lineBetween(p4.x,p4.y,p3.x,p3.y);
    g.lineStyle(.7,theme.ink,.38);g.lineBetween(p1.x,p1.y,p4.x,p4.y);
    if(!danger&&b-a>60){const q1=point(mid,130,y,scale),q2=point(mid+20,150,y,scale);g.lineStyle(2,theme.ink,.3);g.lineBetween(q1.x,q1.y,q2.x,q2.y);}
    if(danger&&b-a>45){const p=point(mid,174,y,scale);this.polygon(g,[{x:p.x-5,y:p.y},{x:p.x+5,y:p.y},{x:p.x,y:p.y-13}],0xffdbb3);}
    if(r.kind==='brittle'&&!danger){const p=point(mid,120,y,scale),q=point(mid+8,185,y,scale);g.lineStyle(1,0x344c4b,.65);g.lineBetween(p.x,p.y,q.x,q.y);}
   }
   // Exact gap boundaries, not approximate wedges; these match canonical contact tests.
   for(const angle of [r.center-r.width/2,r.center+r.width/2]){
    if((Math.sin(rad(angle))>=0)!==front)continue;const p=point(angle,75,y,scale),q=point(angle,RX,y,scale);
    g.lineStyle(4,r.open?theme.accent:0xff566d,.8);g.lineBetween(p.x,p.y,q.x,q.y);
   }
   if(front&&r.gift){const p=point(r.center,177,y,scale);g.fillStyle(r.gift==='focus'?0xa9b8ff:0xffdc8f,.95);g.fillCircle(p.x,p.y-10,5);}
  }
  pop(text,color='#ffefd4'){
   this.notice.setText(text).setColor(color).setAlpha(1);this.helper.setAlpha(0);
   this.tweens.killTweensOf(this.notice);this.tweens.add({targets:this.notice,alpha:0,delay:850,duration:280});
  }
  particles(kind,value){
   const reduced=options.reduced(),n=reduced?3:kind==='shatter'?28:kind==='damage'?14:9;
   for(let i=0;i<n&&this.pieces.length<90;i++){
    const p=this.add.image(CX,CY+RY-20,kind==='shatter'||kind==='crumble'?'dd-debris':'dd-particle');
    const tint=kind==='damage'?0xff7d86:kind==='shatter'?0xffcf83:A.THEMES[this.region].accent;
    p.setTint(tint).setScale((kind==='shatter'?.28:.22)+Math.random()*.18);
    this.pieces.push({p,x:CX,y:CY+RY-20,vx:(Math.random()-.5)*8,vy:-2-Math.random()*5,age:0,ttl:45+Math.random()*15,spin:(Math.random()-.5)*.15});
   }
   if(value&&this.floaters.length<5){const t=this.add.text(CX+63,CY+RY-74,'+'+value,{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#fff5d1'});this.floaters.push({t,age:0});}
  }
  handleEvents(events){
   for(const e of events){
    if(['drop','perfect','shatter','crumble'].includes(e.kind)){
     this.particles(e.kind,e.value);this.hero.setScale(.4,.55);this.tweens.add({targets:this.hero,scaleX:.47,scaleY:.47,duration:160});
     if(e.guardian)this.pop('GUARDIAN CLEARED');else if(e.kind==='perfect')this.pop('PERFECT DROP');else if(e.kind==='shatter')this.pop('BREAK THROUGH!');
    }
    if(e.kind==='seal'){this.pop('SEAL BROKEN · '+e.remaining+' LEFT','#e4d2ff');this.particles('shatter',e.value);this.guardian.setScale(.62);this.tweens.add({targets:this.guardian,scaleX:.54,scaleY:.54,duration:190});}
    if(e.kind==='burst'){this.pop('3-FLOOR BURST','#ffe493');this.particles('shatter');}
    if(e.kind==='damage'){this.pop(e.cause==='gate'?'WAIT FOR BLUE':'AVOID THE RED','#ffc4af');this.particles('damage');if(!options.reduced())this.cameras.main.shake(110,.004);}
    if(e.kind==='focus')this.pop('FOCUS · SLOWER RINGS','#d4c1ff');
    if(e.kind==='region')this.pop(R.REGIONS[e.region].toUpperCase());
    if(e.kind==='complete')this.pop('ENGINE REACHED','#fff2a5');
   }
  }
  reset(){this.depthValue=0;this.lastGuardian=-1;this.introDismissed=false;this.tweens.killTweensOf(this.notice);this.notice.setText('FIND THE OPENING').setAlpha(1);this.helper.setAlpha(1);for(const p of this.pieces)p.p.destroy();this.pieces=[];for(const t of this.floaters)t.t.destroy();this.floaters=[];}
  update(time,dt){
   const s=options.state();if(!s)return;
   if(s.tick>240&&!this.introDismissed){this.introDismissed=true;this.helper.setAlpha(0);if(!this.tweens.isTweening(this.notice))this.notice.setAlpha(0);}

   const region=Math.min(2,Math.floor(s.floor/16));
   if(region!==this.region){
    this.tweens.killTweensOf(this.nextBg);this.bg.setTexture('dd-bg-'+this.region);this.region=region;
    if(options.reduced()){this.bg.setTexture('dd-bg-'+region);this.nextBg.setAlpha(0);}
    else{this.nextBg.setTexture('dd-bg-'+region).setAlpha(0);this.tweens.add({targets:this.nextBg,alpha:1,duration:400,onComplete:()=>{this.bg.setTexture('dd-bg-'+region);this.nextBg.setAlpha(0);}});}
    this.pole.setTint(region===0?0xffffff:region===1?0xb1a1d6:0xe9ae7a);
   }
   this.depthValue+=(Math.min(s.floor,47)-this.depthValue)*Math.min(1,dt/130);
   const motion=options.reduced()?0:time;
   this.clouds.forEach((c,i)=>{c.x=(i?460:75)+Math.sin(motion/11000+i)*45;c.y=(i?650:210)-this.depthValue*(i?1.2:.6)%80;c.setTint(region===0?0xddeee1:region===1?0xa38ec7:0xdd9575);});
   this.pole.tilePositionY=this.depthValue*SPACE;
   this.rear.clear();this.front.clear();
   const first=Math.max(0,Math.floor(this.depthValue)-1),last=Math.min(47,first+7);
   for(let i=last;i>=first;i--)this.ring(s,i,false);
   for(let i=last;i>=first;i--)this.ring(s,i,true);
   const phase=R.clamp((s.tick-s.lastImpact)/s.cycle,0,1),lift=s.alive?Math.sin(phase*Math.PI)*(s.burst?20:60):0;
   const y=CY+RY-24-lift+(s.floor-this.depthValue)*28;
   this.hero.y=y;this.hero.rotation=options.reduced()?0:Math.sin(time/600)*.055;
   this.halo.setPosition(CX,y).setTint(s.burst?0xffa942:0x74efcd).setAlpha(s.burst?.9:.35).setScale(s.burst?1.3:.9);
   this.front.fillStyle(0x081c25,.23);this.front.fillEllipse(CX,CY+RY,42-lift*.15,10);
   this.front.lineStyle(1.5,s.burst?0xffd38a:0xc9fff0,.75);this.front.strokeEllipse(CX,CY+RY,32,12);
   this.regionText.setText('0'+(region+1)+' / '+R.REGIONS[region].toUpperCase());
   this.sectorText.setText('SECTOR '+String(Math.min(12,Math.floor(s.floor/4)+1)).padStart(2,'0')+' / 12');
   const ring=R.ringAt(s);let hint='';
   const guardian=ring?.kind==='guardian'&&s.alive;
   this.guardian.setVisible(guardian);this.sealMarks.clear();
   if(guardian){
    this.guardian.setTexture('dd-guardian-'+ring.region).setAlpha(ring.open?1:.8);
    if(this.lastGuardian!==s.floor&&options.isPlaying()){this.lastGuardian=s.floor;this.pop(ring.guardianName.toUpperCase(),'#ffe3ac');}
    for(let n=0;n<ring.seals;n++){const x=CX+(n-(ring.seals-1)/2)*23;this.sealMarks.lineStyle(2,0xffebbb,.9);this.sealMarks.strokeCircle(x,CY-9,6);if(n>=ring.sealsHit){this.sealMarks.fillStyle(ring.open?A.THEMES[ring.region].accent:0xff7385,1);this.sealMarks.fillCircle(x,CY-9,4);}}
   }

   if(options.isPlaying()&&ring){if(ring.kind==='guardian')hint=(ring.open?'OPEN · ALIGN THE GAP':'CLOSED · WAIT ON STONE')+' · '+(ring.seals-ring.sealsHit)+' SEAL'+(ring.seals-ring.sealsHit===1?'':'S');else if(ring.kind==='laser')hint=ring.open?'GATE OPEN · FIND THE GAP':'RED GATE · WAIT FOR BLUE';else if(ring.kind==='drift')hint='MOVING RING · LEAD THE GAP';else if(ring.kind==='brittle')hint='CRACKED STONE · TWO BOUNCES BREAK IT';else if(s.energy===100)hint='BURST READY · PRESS SPACE OR THE BUTTON';}
   this.context.setText(hint).setVisible(!!hint);
   const k=Math.min(dt/16.667,3);for(const q of this.pieces){q.age+=k;q.vy+=.1*k;q.x+=q.vx*k;q.y+=q.vy*k;q.p.setPosition(q.x,q.y).setAlpha(Math.max(0,1-q.age/q.ttl));q.p.rotation+=q.spin*k;}
   this.pieces=this.pieces.filter(q=>{if(q.age>=q.ttl){q.p.destroy();return false;}return true;});
   for(const q of this.floaters){q.age+=dt;q.t.y-=dt*.035;q.t.alpha=Math.max(0,1-q.age/650);}this.floaters=this.floaters.filter(q=>{if(q.age>=650){q.t.destroy();return false;}return true;});
  }
 }
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'gameCanvas',width:W,height:H,backgroundColor:'#1a4147',scene:Scene,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2},fps:{target:60,forceSetTimeOut:false}});
 return {events:e=>instance?.handleEvents(e),reset:()=>instance?.reset(),focus:()=>game.canvas?.focus({preventScroll:true}),destroy:()=>game.destroy(true),getScene:()=>instance};
}
root.DescentView={make,point,geometry:{CX,CY,RX,RY,SPACE}};
})(globalThis);
