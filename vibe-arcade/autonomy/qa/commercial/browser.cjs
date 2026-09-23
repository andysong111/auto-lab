'use strict';
// Instrument platform resources, never game state or controls.
function audioAudit(){
 const contexts=[],events=[],voices=new Set();let gesture=false,peakVoices=0;
 const record=e=>{events.push({...e,time:performance.now()});if(events.length>512)events.shift();};
 for(const type of ['pointerdown','keydown','touchstart','click'])addEventListener(type,e=>{if(e.isTrusted)gesture=true;},true);
 const Native=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(Native){
  class AuditedContext extends Native{
   constructor(...args){super(...args);contexts.push(this);record({kind:'context',after_gesture:gesture});
    const tap=super.createAnalyser();tap.fftSize=256;const buf=new Float32Array(256),ctx=this,originalConnect=AudioNode.prototype.connect;
    // Tap the actual destination input without replacing the destination or gains.
    const connect=AudioNode.prototype.connect;
    if(!globalThis.__CommercialAudioConnect){Object.defineProperty(globalThis,'__CommercialAudioConnect',{value:true});AudioNode.prototype.connect=function(dest,...a){const result=connect.call(this,dest,...a);const t=contexts.find(c=>c.destination===dest)?.__commercialTap;if(t&&this!==t)originalConnect.call(this,t);return result;};}
    Object.defineProperty(this,'__commercialTap',{value:tap});
    const timer=setInterval(()=>{if(ctx.state==='closed'){clearInterval(timer);return;}tap.getFloatTimeDomainData(buf);record({kind:'energy',rms:Math.sqrt(buf.reduce((s,v)=>s+v*v,0)/buf.length)});},20);
   }
   resume(){record({kind:'resume',after_gesture:gesture});return super.resume();}
  }
  globalThis.AudioContext=AuditedContext;if(globalThis.webkitAudioContext)globalThis.webkitAudioContext=AuditedContext;
  for(const proto of [OscillatorNode.prototype,AudioBufferSourceNode.prototype,globalThis.ConstantSourceNode?.prototype].filter(Boolean)){
   const start=proto.start,stop=proto.stop;
   proto.start=function(...a){voices.add(this);peakVoices=Math.max(peakVoices,voices.size);record({kind:'start',after_gesture:gesture});this.addEventListener('ended',()=>{voices.delete(this);record({kind:'ended'});},{once:true});return start.apply(this,a);};
   proto.stop=function(...a){record({kind:'stop'});return stop.apply(this,a);};
  }
 }
 const snapshot=()=>({supported:!!Native,contexts:contexts.length,live_contexts:contexts.filter(c=>c.state!=='closed').length,running_contexts:contexts.filter(c=>c.state==='running').length,active_voices:voices.size,peak_voices:peakVoices,events:events.slice()});
 Object.defineProperty(globalThis,'__CommercialAudioAudit',{value:snapshot});
 addEventListener('pagehide',()=>queueMicrotask(()=>{globalThis.__commercialAudioFinal?.(snapshot()).catch(()=>{});}));
}
function frameAudit(){
 const raf=requestAnimationFrame;let last=null,maxGap=0,count=0;const gaps=[];
 requestAnimationFrame=function(callback){return raf.call(this,t=>{if(last!==null&&t>last){const g=t-last;maxGap=Math.max(maxGap,g);if(gaps.length<512)gaps.push(g);count++;}last=t;callback(t);});};
 Object.defineProperty(globalThis,'__CommercialFrames',{value:()=>({count,max_gap_ms:maxGap,gaps})});
}
async function boxes(page,regions,canvas){
 return page.evaluate(({regions,canvas})=>{
  const result=regions.map(r=>{const e=document.querySelector(r.selector);if(!e)throw Error('missing visual selector '+r.selector);const b=e.getBoundingClientRect(),s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.1||b.width<1)throw Error('invisible visual selector');return {x:b.x+r.x*b.width,y:b.y+r.y*b.height,width:r.width*b.width,height:r.height*b.height};});
  const masks=[...(__ProductCanvasAudit(canvas)||[])],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n,chars=0;
  while((n=walk.nextNode())){if(!n.textContent.trim()||['SCRIPT','STYLE'].includes(n.parentElement?.tagName))continue;const s=getComputedStyle(n.parentElement);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.1)continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width&&r.height&&r.y<innerHeight){masks.push({x:r.x,y:r.y,width:r.width,height:r.height});chars+=n.textContent.trim().length;}}
  return {regions:result,masks,text_chars:chars+(__ProductCanvasAudit(canvas)||[]).reduce((n,r)=>n+r.text.length,0),text_area:masks.reduce((s,r)=>s+Math.max(0,Math.min(innerWidth,r.x+r.width)-Math.max(0,r.x))*Math.max(0,Math.min(innerHeight,r.y+r.height)-Math.max(0,r.y)),0)/(innerWidth*innerHeight),nodes:document.querySelectorAll('*').length};
 },{regions,canvas});
}
module.exports={audioAudit,frameAudit,boxes};
