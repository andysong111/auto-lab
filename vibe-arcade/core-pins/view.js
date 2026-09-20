/* Core Pins scene: original geometry; input and feedback adapters are local. */
(function(root){'use strict';
function create(options){let scene=null;class PinsScene extends Phaser.Scene{
 constructor(){super('pins');}
 create(){scene=this;this.cameras.main.setBackgroundColor('#08100f');this.g=this.add.graphics();this.fx=this.add.graphics();this.label=this.add.text(360,70,'CORE PINS',{fontFamily:'system-ui',fontSize:'18px',fontStyle:'bold',color:'#d5ff68'}).setOrigin(.5);this.sub=this.add.text(360,97,'LOOPJOLT CHALLENGER',{fontFamily:'system-ui',fontSize:'10px',color:'#8c9a95',letterSpacing:2}).setOrigin(.5);
  this.feedback=CorePinsFeel.createFX(this,options.reduced);this.input.on('pointerdown',()=>{if(options.playing())options.throw();});
  this.game.canvas.tabIndex=0;this.game.canvas.setAttribute('aria-label','Tap to throw. Space throws a pin; P pauses.');
  this.game.canvas.addEventListener('webglcontextlost',lost);options.ready();
 }
 draw(state){const g=this.g;g.clear();g.fillStyle(state.boss?0x160b17:0x07100f,1);g.fillRect(0,0,720,900);for(let i=0;i<30;i++){g.fillStyle(state.boss?0xff477e:0x66edd5,.05+(i%5)*.02);g.fillCircle((i*211)%720,160+(i*97)%600,1+(i%3));}const cx=360,cy=390,rot=state.rotation/1800*Math.PI;g.fillStyle(0x66edd5,.08);g.fillCircle(cx,cy,150);g.lineStyle(4,state.boss?0xff657e:0x66edd5,.8);g.strokeCircle(cx,cy,120);g.lineStyle(1,0xd5ff68,.25);g.strokeCircle(cx,cy,92);for(const h of state.hazards){const a=h/1800*Math.PI+rot,x=cx+Math.cos(a)*118,y=cy+Math.sin(a)*118;g.fillStyle(0xff657e,1);g.fillCircle(x,y,10);}for(const p of state.pins){const a=p/1800*Math.PI+rot,x1=cx+Math.cos(a)*115,y1=cy+Math.sin(a)*115,x2=cx+Math.cos(a)*185,y2=cy+Math.sin(a)*185;g.lineStyle(5,0xf5f1e8,1);g.lineBetween(x1,y1,x2,y2);g.fillStyle(0xd5ff68,1);g.fillCircle(x2,y2,5);}g.fillStyle(state.boss?0xff657e:0xd5ff68,1);g.fillCircle(cx,cy,48);g.fillStyle(0x0b1111,1);g.fillCircle(cx,cy,20);g.fillStyle(0xf4f1e8,1);g.fillTriangle(347,760,373,760,360,710);g.lineStyle(2,0xd5ff68,.5);g.lineBetween(360,700,360,520);this.sub.setText((state.boss?'BOSS ':'STAGE ')+state.stage+' · '+state.stageHits+'/'+state.target+' PINS');}
 update(time,dt){this.draw(options.state());this.feedback?.update(dt);}
}
function lost(e){e.preventDefault();options.contextLost();}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'phaser-game',width:720,height:900,transparent:false,backgroundColor:'#08100f',scene:PinsScene,audio:{noAudio:true},render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
return Object.freeze({events:events=>events.forEach(e=>scene?.feedback?.event(e)),reset:()=>scene?.feedback?.reset(),focus:()=>game.canvas?.focus({preventScroll:true}),snapshot:()=>scene?.feedback?.snapshot(),destroy:()=>{game.canvas?.removeEventListener('webglcontextlost',lost);scene?.feedback?.destroy();game.destroy(true);}});
}
root.CorePinsView=Object.freeze({create});
})(globalThis);
