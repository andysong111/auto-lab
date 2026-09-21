// Separate observational collector. Never imports ranking/account mutation code.
import '../../vibe-arcade/measurement/contract.js';
const C=(globalThis as any).LoopAcquisition;
const HEADERS={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
async function body(req:Request){const reader=req.body?.getReader();if(!reader)return null;let n=0,chunks:Uint8Array[]=[];while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>4096){await reader.cancel();throw Error('too_large');}chunks.push(r.value);}const out=new Uint8Array(n);let i=0;for(const c of chunks){out.set(c,i);i+=c.length;}return JSON.parse(new TextDecoder().decode(out));}
async function sessionKey(secret:string,id:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const day=new Date().toISOString().slice(0,10);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('loopjolt:acquisition:'+day+':'+id)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
Deno.serve(async req=>{
 const reply=(code:number)=>new Response(code===204?null:JSON.stringify({ok:false}),{status:code,headers:HEADERS});
 if(req.method!=='POST')return reply(405);
 if(req.headers.get('Origin')!==C.ORIGIN)return reply(403);
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))return reply(415);
 try{
  const clean=C.clean(await body(req));if(!clean)return reply(204);
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),base=Deno.env.get('SUPABASE_URL');
  if(!secret||!base)return reply(503);
  const {session_id,...event}=clean;
  const payload={...event,session_key:await sessionKey(secret,session_id)};
  const result=await fetch(base+'/rest/v1/rpc/loopjolt_acquisition_ingest',{method:'POST',headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({p_event:payload}),signal:AbortSignal.timeout(4000)});
  if(!result.ok){console.warn('[LJ_METRIC_DB_UNAVAILABLE]');return reply(503);}
  const data=await result.json();return reply(data.status==='rate_limited'?429:data.status==='disabled'?503:204);
 }catch(e){return reply(e instanceof Error&&e.message==='too_large'?413:400);}
});
