(function(){'use strict';
const q=new URLSearchParams(location.search),quiet=q.get('capture')==='1'||['localhost','127.0.0.1'].includes(location.hostname);
let saved={},sessionId='';
if(!quiet){try{saved=JSON.parse(sessionStorage.getItem('lj3_attribution')||'{}');const has=q.has('utm_source');if(has){saved={};for(const k of ['source','medium','campaign','content'])saved[k]=(q.get('utm_'+k)||'').slice(0,120);sessionStorage.setItem('lj3_attribution',JSON.stringify(saved));}sessionId=sessionStorage.getItem('lj3_session')||crypto.randomUUID();sessionStorage.setItem('lj3_session',sessionId);}catch{sessionId=crypto.randomUUID();}}
window.LJTelemetry={track(event,game,build,props={}){if(quiet)return;const payload={event,event_ts:new Date().toISOString(),session_id:sessionId,build,path:location.pathname,referrer:document.referrer,...saved,props:{game,...props}};try{const text=JSON.stringify(payload);const accepted=navigator.sendBeacon?.('/api/event',new Blob([text],{type:'application/json'}));if(!accepted)fetch('/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:text,keepalive:true}).catch(()=>{});}catch{}}};
})();
