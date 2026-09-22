'use strict';
// Trusted browser text measurement, reused from prior commissioning; no candidate source execution on host.
function overlaps(labels){const bad=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(a.text===b.text)continue;const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>1&&h>1&&w*h/Math.min((a.right-a.left)*(a.bottom-a.top),(b.right-b.left)*(b.bottom-b.top))>.25)bad.push({a:a.text,b:b.text});}return bad;}
async function presentationProbe(ctx){await ctx.addInitScript(()=>{
 const c=CanvasRenderingContext2D.prototype,fill=c.fillText,clear=c.clearRect,rect=c.fillRect;let labels=[];
 Object.defineProperty(window,'__factoryText',{value:()=>labels.slice(-100)});
 function reset(x,y,w,h){if(x<=0&&y<=0&&w>=this.canvas.width*.95&&h>=this.canvas.height*.95)labels=[];}
 c.clearRect=function(...a){reset.apply(this,a);return clear.apply(this,a);};c.fillRect=function(...a){reset.apply(this,a);return rect.apply(this,a);};
 c.fillText=function(text,x,y,maxWidth){const m=this.measureText(String(text)),t=this.getTransform(),scale=this.canvas.getBoundingClientRect().width/this.canvas.width;
  let width=Math.min(m.width,maxWidth||Infinity),left=x;if(this.textAlign==='center')left-=width/2;else if(this.textAlign==='right'||this.textAlign==='end')left-=width;
  const fontSize=Number(this.font.match(/([0-9.]+)px/)?.[1]||0),ascent=m.actualBoundingBoxAscent||fontSize*.8,descent=m.actualBoundingBoxDescent||2;
  const point=(px,py)=>({x:(t.a*px+t.c*py+t.e)*scale,y:(t.b*px+t.d*py+t.f)*scale}),a=point(left,y-ascent),b=point(left+width,y+descent);
  if(String(text).trim()&&this.globalAlpha>.3)labels.push({text:String(text),left:a.x,right:b.x,top:a.y,bottom:b.y,font_px:fontSize*Math.abs(t.a)*scale});
  return fill.apply(this,arguments);};
});}

module.exports={overlaps,presentationProbe};
