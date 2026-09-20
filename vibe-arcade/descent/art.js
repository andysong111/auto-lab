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
  for(let layer=0;layer<3;layer++){
   const y=340+layer*140;c.fillStyle=['#17383b44','#102d3555','#081e2870'][layer];
   for(let j=0;j<14;j++){const x=j*60-80,ht=40+r()*190;c.beginPath();c.moveTo(x,y+ht);c.lineTo(x+25,y-ht);c.lineTo(x+50,y+ht);c.fill();}
  }
  for(let j=0;j<90;j++){c.fillStyle=i===0?'#edfff733':'#ffe6ce44';c.beginPath();c.arc(r()*600,r()*850,r()*1.3+.4,0,Math.PI*2);c.fill();}
  for(let j=0;j<18;j++){const x=j%2?530+r()*80:-30+r()*70,y=270+j*45;c.fillStyle=i===0?'#0e433e66':i===1?'#5a408d66':'#56283477';c.beginPath();c.moveTo(x,y-75);c.lineTo(x+45,y);c.lineTo(x+28,y+80);c.lineTo(x-18,y+55);c.closePath();c.fill();c.strokeStyle=theme.glow+'35';c.beginPath();c.moveTo(x,y-75);c.lineTo(x+12,y+60);c.stroke();}
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
