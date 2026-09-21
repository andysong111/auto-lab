/* The wall/gap warning reads exactly the same immutable wall model as collision. */
(function(root){'use strict';
function draw(c,s){for(const w of s.walls){const B=AstraArena.BOUNDS,vertical=w.axis==='x',warn=w.age<=w.delay,near=vertical?B.left:B.top,far=vertical?B.right:B.bottom;
 c.save();
 // Clear corridor persists while the sweep is on screen; effects Low does not hide it.
 c.fillStyle='#7affdc12';if(vertical)c.fillRect(near,w.gap-w.gapWidth/2,far-near,w.gapWidth);else c.fillRect(w.gap-w.gapWidth/2,near,w.gapWidth,far-near);
 c.strokeStyle='#8bf5d7';c.lineWidth=1.8;c.setLineDash([9,7]);for(const side of [-1,1]){const g=w.gap+side*w.gapWidth/2;c.beginPath();if(vertical){c.moveTo(near,g);c.lineTo(far,g);}else{c.moveTo(g,near);c.lineTo(g,far);}c.stroke();}c.setLineDash([]);
 const pos=warn?(w.sign>0?near:far):w.line,lo=vertical?B.top:B.left,hi=vertical?B.bottom:B.right;
 c.lineWidth=warn?3:10;c.strokeStyle=warn?'#ffac8880':'#ff789e';for(const [a,b] of [[lo,w.gap-w.gapWidth/2],[w.gap+w.gapWidth/2,hi]]){c.beginPath();if(vertical){c.moveTo(pos,a);c.lineTo(pos,b);}else{c.moveTo(a,pos);c.lineTo(b,pos);}c.stroke();}
 if(!warn){c.strokeStyle='#ffdfbd';c.lineWidth=2;for(const pt of AstraArena.wallPoints(w)){c.beginPath();c.arc(pt.x,pt.y,7,0,Math.PI*2);c.stroke();}}
 c.fillStyle='#acffe6';c.font='600 15px system-ui';c.textAlign='center';const x=vertical?(near+far)/2:w.gap,y=vertical?w.gap:(near+far)/2;c.fillText(warn?'SAFE LANE · '+((w.delay-w.age)/60).toFixed(1)+'s':'SAFE LANE',x,y);
 if(warn){const q=1-w.age/w.delay;c.strokeStyle='#ffd79b';c.lineWidth=3;c.beginPath();c.arc(x,y+18,9,-Math.PI/2,-Math.PI/2+Math.PI*2*q);c.stroke();}c.restore();}}
root.AstraArenaView=Object.freeze({draw});
})(globalThis);
