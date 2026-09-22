'use strict';
// Trusted browser instrumentation. The contract supplies selectors and paths only.
function canvasAudit(){
 const records=new Map(),proto=CanvasRenderingContext2D.prototype;
 for(const method of ['clearRect','fillRect']){const original=proto[method];proto[method]=function(x,y,w,h){if(x<=0&&y<=0&&w>=this.canvas.width&&h>=this.canvas.height)records.set(this.canvas,[]);return original.apply(this,arguments);};}
 for(const method of ['fillText','strokeText']){const original=proto[method];proto[method]=function(text,x,y,maxWidth){
  const m=this.measureText(String(text)),t=this.getTransform(),b=this.canvas.getBoundingClientRect(),sx=b.width/this.canvas.width,sy=b.height/this.canvas.height;
  const font=Number(/([\d.]+)px/.exec(this.font)?.[1]||0),width=Math.min(m.width,maxWidth??Infinity);
  let left=x;if(this.textAlign==='center')left-=width/2;else if(['right','end'].includes(this.textAlign))left-=width;
  let top=y-(m.actualBoundingBoxAscent||font*.8);if(this.textBaseline==='top')top=y;else if(this.textBaseline==='middle')top=y-font/2;
  const points=[[left,top],[left+width,top+font]].map(([a,c])=>({x:b.x+(t.a*a+t.c*c+t.e)*sx,y:b.y+(t.b*a+t.d*c+t.f)*sy}));
  const row={text:String(text).slice(0,200),x:Math.min(points[0].x,points[1].x),y:Math.min(points[0].y,points[1].y),width:Math.abs(points[1].x-points[0].x),height:Math.abs(points[1].y-points[0].y),font_px:font*Math.hypot(t.c,t.d)*sy};
  const rows=records.get(this.canvas)||[];if(rows.length<256&&!rows.some(r=>r.text===row.text&&Math.abs(r.x-row.x)<.5&&Math.abs(r.y-row.y)<.5))rows.push(row);records.set(this.canvas,rows);
  return original.apply(this,arguments);
 };}
 Object.defineProperty(globalThis,'__ProductCanvasAudit',{value:selector=>JSON.parse(JSON.stringify(records.get(document.querySelector(selector))||[]))});
}
async function geometry(page,contract){
 return page.evaluate(c=>{
  const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return !e.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;};
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  const critical=c.mobile.critical_selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(visible).map(e=>({selector,text:e.textContent.trim(),font_px:parseFloat(getComputedStyle(e).fontSize),...box(e)})));
  const controls=c.mobile.control_selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(visible).map(e=>({selector,...box(e)})));
  const canvas=document.querySelector(c.mobile.canvas_selector),cb=canvas&&box(canvas);
  return {overflow:document.documentElement.scrollWidth-innerWidth,critical,controls,canvas:cb,canvas_text:__ProductCanvasAudit(c.mobile.canvas_selector),viewport:{width:innerWidth,height:innerHeight}};
 },contract);
}
function overlap(a,b){return Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;}
function collisions(rows){const out=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)if(overlap(rows[i],rows[j]))out.push([rows[i],rows[j]]);return out;}
module.exports={canvasAudit,geometry,collisions};
