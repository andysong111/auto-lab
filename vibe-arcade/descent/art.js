/* Original code-painted textures. Generated once, reused as Phaser sprites.
 * No external image CDN, copied game art, paid assets or generation credits. */
(function(root){'use strict';
const THEMES=[
 {sky:['#13393f','#407a79','#c4b895'],top:0xb5d9c5,side:0x477968,rim:0xe8d8a5,ink:0x275c58,accent:0x70f4d8,glow:'#92fff0'},
 {sky:['#111429','#38375a','#827395'],top:0xbaa5dc,side:0x5a4676,rim:0xd6daf9,ink:0x453662,accent:0xb294ff,glow:'#caadff'},
 {sky:['#211226','#582733','#b16b51'],top:0xe3b67f,side:0x895640,rim:0xffd895,ink:0x733c35,accent:0xffb664,glow:'#ffbb77'}
];
function texture(scene,key,w,h,paint){const t=scene.textures.createCanvas(key,w,h);paint(t.context,w,h);t.refresh();return t;}
function seeded(seed){let n=seed;return()=>((n=Math.imul(1664525,n)+1013904223>>>0)/4294967296);}
function make(scene){
 if(scene.textures.exists('dd-orb'))return;
 THEMES.forEach((theme,i)=>texture(scene,'dd-bg-'+i,600,900,(c,w,h)=>{
  const r=seeded(40+i),bg=c.createLinearGradient(0,0,0,h);theme.sky.forEach((v,j)=>bg.addColorStop(j/2,v));c.fillStyle=bg;c.fillRect(0,0,w,h);
  const sun=c.createRadialGradient(475,165,4,475,165,220);sun.addColorStop(0,i===0?'#f4efd9aa':i===1?'#d9bbff77':'#ffbb8c77');sun.addColorStop(1,'#ffffff00');c.fillStyle=sun;c.fillRect(0,0,w,500);
  c.fillStyle=i===0?'#f1eac888':'#e2c9e955';c.beginPath();c.arc(475,165,40,0,Math.PI*2);c.fill();
  // Three different environments, not the same skyline with a color filter.
  const poly=(points,fill)=>{c.fillStyle=fill;c.beginPath();points.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();};
  if(i===0){
   for(let layer=0;layer<3;layer++)for(let j=0;j<8;j++){
    const x=j*100-70+(layer%2)*35,y=330+layer*200+r()*65,ww=45+r()*70;
    poly([[x,y],[x+ww,y-8],[x+ww*.7,y+48],[x+ww*.4,y+65]],['#61878355','#28565466','#173f4777'][layer]);
    c.fillStyle=['#aacbb155','#6e9c9066','#527b7777'][layer];c.fillRect(x,y-5,ww,9);
    c.fillStyle='#cdd6b445';c.fillRect(x+ww*.3,y-80,9,76);c.fillRect(x+ww*.7,y-60,8,58);
    c.strokeStyle='#adc6a750';c.lineWidth=2;c.beginPath();c.moveTo(x+ww*.2,y+3);c.quadraticCurveTo(x+ww*.05,y+95,x+ww*.35,y+112);c.stroke();
   }
  }else if(i===1){
   for(let layer=0;layer<3;layer++)for(let j=0;j<8;j++){
    const x=j%2?(475+r()*135):(-60+r()*110),y=120+j*93+layer*35,ht=90+r()*130,ww=25+r()*40;
    poly([[x,y-ht],[x+ww,y-ht*.3],[x+ww*.8,y+ht*.7],[x-ww*.7,y+ht*.4]],['#8575b733','#69609b77','#383157cc'][layer]);
    poly([[x,y-ht],[x+ww*.12,y+ht*.5],[x-ww*.7,y+ht*.4]],'#c7c7ff22');
    c.strokeStyle='#b5c5ff66';c.lineWidth=1;c.beginPath();c.moveTo(x,y-ht);c.lineTo(x+ww*.12,y+ht*.5);c.stroke();
   }
  }else{
   for(let j=0;j<8;j++){
    const x=j%2?520:55,y=130+j*105;
    c.fillStyle='#261d26aa';c.fillRect(x-17,y-90,34,195);c.fillStyle='#bd7a4733';c.fillRect(x-11,y-88,7,188);
    c.strokeStyle='#d7966b55';c.lineWidth=4;c.beginPath();c.arc(x,y,38+j%3*10,0,Math.PI*2);c.stroke();
    for(let k=0;k<12;k++){const a=k*Math.PI/6;c.save();c.translate(x+Math.cos(a)*44,y+Math.sin(a)*44);c.rotate(a);c.fillStyle='#9f674466';c.fillRect(-7,-4,15,8);c.restore();}
    c.strokeStyle='#ffc17c44';c.lineWidth=2;c.beginPath();c.moveTo(x+38,y);c.lineTo(x+(j%2?-95:95),y);c.stroke();
   }
   const fire=c.createLinearGradient(0,560,0,900);fire.addColorStop(0,'#ff831900');fire.addColorStop(1,'#ff9b3344');c.fillStyle=fire;c.fillRect(0,560,600,340);
  }
  for(let j=0;j<90;j++){c.fillStyle=i===0?'#edfff733':'#ffe6ce44';c.beginPath();c.arc(r()*600,r()*850,r()*1.3+.4,0,Math.PI*2);c.fill();}
  for(let j=0;j<18;j++){const x=j%2?530+r()*80:-30+r()*70,y=270+j*45;c.fillStyle=i===0?'#0e433e66':i===1?'#5a408d66':'#56283477';c.beginPath();c.moveTo(x,y-75);c.lineTo(x+45,y);c.lineTo(x+28,y+80);c.lineTo(x-18,y+55);c.closePath();c.fill();c.strokeStyle=theme.glow+'35';c.beginPath();c.moveTo(x,y-75);c.lineTo(x+12,y+60);c.stroke();}
 }));

 // Original guardian medallions with region-specific silhouettes. These are textures,
 // not separate collision bodies; their seals/opening state comes from the rules.
 THEMES.forEach((theme,i)=>texture(scene,'dd-guardian-'+i,256,256,c=>{
  const metal=c.createRadialGradient(90,75,8,128,128,112);metal.addColorStop(0,['#e8d9a6','#e1d6fa','#ffc982'][i]);metal.addColorStop(.6,['#928854','#9077b7','#aa6b42'][i]);metal.addColorStop(1,'#27383b');
  c.lineWidth=8;c.strokeStyle=['#d1bb86','#b69fe5','#c1834f'][i];
  if(i===0){for(const dir of [-1,1]){c.beginPath();c.moveTo(128+dir*48,120);c.lineTo(128+dir*120,68);c.lineTo(128+dir*92,157);c.closePath();c.fillStyle=metal;c.fill();c.stroke();}}
  if(i===1){for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(128+Math.cos(a)*109,128+Math.sin(a)*109);c.lineTo(128+Math.cos(a+.17)*72,128+Math.sin(a+.17)*72);c.lineTo(128+Math.cos(a-.17)*72,128+Math.sin(a-.17)*72);c.closePath();c.fillStyle=metal;c.fill();}}
  if(i===2){for(let k=0;k<12;k++){c.save();c.translate(128,128);c.rotate(k*Math.PI/6);c.fillStyle=metal;c.fillRect(84,-12,32,24);c.restore();}}
  c.fillStyle=metal;c.beginPath();c.arc(128,128,82,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#16252c';c.beginPath();c.roundRect(65,99,126,60,24);c.fill();
  c.shadowColor=theme.glow;c.shadowBlur=14;c.fillStyle=theme.glow;
  if(i===2){c.beginPath();c.arc(128,128,18,0,Math.PI*2);c.fill();}else{c.beginPath();c.roundRect(91,117,14,23,6);c.roundRect(151,117,14,23,6);c.fill();}c.shadowBlur=0;
  c.strokeStyle='#fff8dc88';c.lineWidth=3;c.beginPath();c.arc(128,125,70,3.5,4.8);c.stroke();
 }));
 texture(scene,'dd-cloud',512,180,(c,w,h)=>{c.translate(256,90);c.scale(1,.3);const g=c.createRadialGradient(0,0,3,0,0,235);g.addColorStop(0,'#dfede078');g.addColorStop(.6,'#d0e7df36');g.addColorStop(1,'#c7eae000');c.fillStyle=g;c.fillRect(-256,-300,512,600);});
 texture(scene,'dd-glow',128,128,c=>{const g=c.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'#ffffff88');g.addColorStop(.3,'#ffffff30');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,128,128);});
 texture(scene,'dd-particle',24,24,c=>{c.fillStyle='#fff9dc';c.beginPath();c.moveTo(12,0);c.lineTo(16,8);c.lineTo(24,12);c.lineTo(16,16);c.lineTo(12,24);c.lineTo(8,16);c.lineTo(0,12);c.lineTo(8,8);c.closePath();c.fill();});
 texture(scene,'dd-debris',40,32,c=>{const g=c.createLinearGradient(0,0,0,32);g.addColorStop(0,'#f3efcf');g.addColorStop(1,'#657f72');c.fillStyle=g;c.beginPath();c.moveTo(4,6);c.lineTo(27,1);c.lineTo(39,19);c.lineTo(21,30);c.lineTo(2,22);c.closePath();c.fill();c.strokeStyle='#fffce6';c.beginPath();c.moveTo(4,6);c.lineTo(27,1);c.lineTo(39,19);c.stroke();});
 texture(scene,'dd-orb',160,160,c=>{
  c.shadowColor='#031719';c.shadowBlur=13;c.shadowOffsetY=7;
  const shell=c.createRadialGradient(53,42,5,80,80,62);shell.addColorStop(0,'#fff9d3');shell.addColorStop(.42,'#f8ca70');shell.addColorStop(.8,'#c97c37');shell.addColorStop(1,'#71462d');c.fillStyle=shell;c.beginPath();c.arc(80,78,60,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.strokeStyle='#5b3e3188';c.lineWidth=3;c.beginPath();c.arc(80,78,48,.05,3.02);c.stroke();c.beginPath();c.ellipse(80,82,57,17,.1,0,Math.PI*2);c.stroke();
  c.fillStyle='#f7eee0';c.beginPath();c.ellipse(80,76,50,31,0,0,Math.PI*2);c.fill();
  const v=c.createLinearGradient(0,55,0,105);v.addColorStop(0,'#254a4a');v.addColorStop(1,'#061c20');c.fillStyle=v;c.beginPath();c.roundRect(37,56,86,43,20);c.fill();
  c.fillStyle='#70ffe3';c.shadowColor='#6dfbd9';c.shadowBlur=8;c.beginPath();c.roundRect(54,68,10,18,5);c.roundRect(96,68,10,18,5);c.fill();c.shadowBlur=0;
  c.strokeStyle='#d3ffff88';c.lineWidth=3;c.beginPath();c.moveTo(50,61);c.lineTo(82,61);c.stroke();
  c.fillStyle='#fffdf3a0';c.beginPath();c.ellipse(54,36,15,6,-.5,0,Math.PI*2);c.fill();
  c.fillStyle='#724727';c.beginPath();c.arc(80,123,5,0,Math.PI*2);c.fill();c.fillStyle='#ffe6a0';c.beginPath();c.arc(80,122,2,0,Math.PI*2);c.fill();
 });
 texture(scene,'dd-pole',150,900,c=>{
  const g=c.createLinearGradient(0,0,150,0);g.addColorStop(0,'#253d3d');g.addColorStop(.23,'#58786b');g.addColorStop(.5,'#c1bc95');g.addColorStop(.7,'#799789');g.addColorStop(1,'#25433f');c.fillStyle=g;c.fillRect(0,0,150,900);
  const r=seeded(22);for(let i=0;i<400;i++){c.fillStyle=r()>.5?'#ebf3c411':'#203e4122';c.fillRect(r()*150,r()*900,1+r()*3,3+r()*15);}
  for(let y=10;y<900;y+=84){c.strokeStyle='#132c3155';c.lineWidth=4;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(75,y+19,150,y);c.stroke();c.strokeStyle='#e1eac066';c.lineWidth=1;c.beginPath();c.moveTo(0,y-3);c.quadraticCurveTo(75,y+16,150,y-3);c.stroke();}
 });
}
root.DescentArt={make,THEMES};
})(globalThis);
