// verify_jwt=false: writes require Google OIDC or a DB-validated opaque Play ID session.
// Public credential actions are rate-limited; plaintext secrets never reach SQL or logs.
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';
import '../../vibe-arcade/games/orbit-sprint/core.js';
import '../../vibe-arcade/arcade3/core.js';
import '../../vibe-arcade/challengers/core.js';
import '../../vibe-arcade/descent/core.js';
import '../verify-run.js';
import '../auth/play-id.js';
const orbit=(globalThis as any).OrbitRules,arcade=(globalThis as any).ArcadeRules,challengers=(globalThis as any).ChallengerRules,descent=(globalThis as any).DescentRules,verifyRun=(globalThis as any).LoopJoltVerify;
const JWKS=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const ORIGIN='https://vibe-arcade-dun.vercel.app';
const CODES=new Set('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));
async function rpc(action:string,subject:string|null=null,payload:unknown={}){
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),base=Deno.env.get('SUPABASE_URL');if(!key||!base)throw Error('backend_unavailable');
 const response=await fetch(base+'/rest/v1/rpc/loopjolt_gateway',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_subject:subject,p_payload:payload}),signal:AbortSignal.timeout(8000)});
 const data=await response.json();if(!response.ok)throw Error(data.message||'database_error');return data;
}
async function authRpc(action:string,payload:unknown={}){
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),base=Deno.env.get('SUPABASE_URL');if(!key||!base)throw Error('backend_unavailable');
 const response=await fetch(base+'/rest/v1/rpc/loopjolt_play_auth',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_payload:payload}),signal:AbortSignal.timeout(8000)});
 const data=await response.json();if(!response.ok)throw Error(data.message||'database_error');return data;
}
const playId=(globalThis as any).LoopPlayId.create({rpc:authRpc,secret:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),countries:CODES});
let cached:any=null,cacheAt=0;
async function config(){if(!cached||Date.now()-cacheAt>30000){const base=await rpc('config');let enabled=false;try{enabled=(await authRpc('config')).enabled===true;}catch{}cached={...base,googleReady:base.loginReady,playIdReady:enabled,loginReady:base.loginReady||enabled};cacheAt=Date.now();}return cached;}
async function readLimited(req:Request){const reader=req.body?.getReader();if(!reader)return {};let size=0;const chunks:Uint8Array[]=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw Error('payload_too_large');}chunks.push(value);}const joined=new Uint8Array(size);let at=0;for(const chunk of chunks){joined.set(chunk,at);at+=chunk.byteLength;}const text=new TextDecoder().decode(joined);return text?JSON.parse(text):{};}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin'),url=new URL(req.url),action=url.searchParams.get('action')||'config';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','X-Content-Type-Options':'nosniff'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&origin!==ORIGIN)return reply({error:'origin_not_allowed'},403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  if(req.method==='GET'){
   if(action==='config')return reply(await config());
   if(action==='board')return reply(await rpc('board',null,{game:url.searchParams.get('game')||'orbit-sprint',scope:url.searchParams.get('scope')||'world',period:url.searchParams.get('period')||'week',country:url.searchParams.get('country')||''}));
   return reply({error:'not_found'},404);
  }
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);if(origin!==ORIGIN)return reply({error:'origin_required'},403);
  const body=await readLimited(req);if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'invalid_payload'},400);
  // Network limits use only the gateway-observed address, never a supplied JSON field.
  // Reverse proxies can pool addresses: identifier limits remain independent of this hint.
  const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',').at(-1)?.trim()||'unknown';
  if(action==='auth_enter')return reply(await playId.enter(body,ip));
  if(action==='auth_recover')return reply(await playId.recover(body,ip));
  const bearer=req.headers.get('Authorization')||'';
  if(action==='auth_logout')return reply(await playId.logout(bearer.startsWith('Bearer ')?bearer.slice(7):''));
  if(!bearer.startsWith('Bearer ')||bearer.length>8500)return reply({error:'authentication_required'},401);
  const cfg=await config();if(!cfg.loginReady)return reply({error:'login_not_configured'},503);
  const quick=bearer.startsWith('Bearer ljp_');let subject:string;
  if(quick){subject=await playId.resolve(bearer.slice(7));}
  else{
   if(!cfg.googleReady)return reply({error:'login_not_configured'},503);
   let claims:any;try{({payload:claims}=await jwtVerify(bearer.slice(7),JWKS,{issuer:['https://accounts.google.com','accounts.google.com'],audience:cfg.clientId,algorithms:['RS256'],clockTolerance:5}));}catch{return reply({error:'invalid_or_expired_login'},401);}
   if(typeof claims.sub!=='string'||!claims.sub||!Number.isFinite(claims.exp))return reply({error:'invalid_login'},401);
   subject=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('loopjolt:google:'+claims.sub)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  if(quick&&action==='save_profile'){
   const p=await rpc('profile',subject);
   if(!p||body.handle!==p.handle)return reply({error:'play_id_immutable'},400);
   if(!CODES.has(body.country))return reply({error:'invalid_country'},400);
  }
  if(action==='profile')return reply({profile:await rpc('profile',subject)});
  if(action==='save_profile'){const country=String(body.country||'').toUpperCase();if(country&&!CODES.has(country))return reply({error:'invalid_country'},400);return reply({profile:await rpc('save_profile',subject,{handle:body.handle,country,consent:body.consent===true,age16:body.age16===true})});}
  if(action==='delete_profile')return reply(await rpc('delete_profile',subject,{confirmation:body.confirmation}));
  if(action==='start')return reply(await rpc('start',subject,{game:String(body.game||'orbit-sprint'),version:typeof body.version==='string'?body.version:undefined}));
  if(action==='finish'){
   if(typeof body.runId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.runId))return reply({error:'invalid_run'},400);
   const run=await rpc('run',subject,{runId:body.runId});if(Date.parse(run.expires_at)<Date.now())return reply({error:'run_expired'},410);
   let verified;try{verified=verifyRun(run,body,orbit,arcade,challengers,descent);}catch(e){return reply({error:e instanceof Error&&e.message==='version_mismatch'?'version_mismatch':'invalid_game_replay'},400);}
   // Only these server-computed fields reach SQL; claimed score, country and game are ignored.
   return reply(await rpc('finish',subject,{runId:body.runId,score:verified.score,ticks:verified.ticks,orbs:verified.orbs,maxCombo:verified.maxCombo}));
  }
  return reply({error:'not_found'},404);
 }catch(e){const raw=e instanceof Error?e.message:'';const known=['invalid_play_id','invalid_password','weak_password','play_id_unavailable','invalid_credentials','invalid_or_expired_login','payload_too_large','version_mismatch','excessive_elapsed_time','invalid_board','invalid_game','game_validator_unavailable','authentication_required','account_blocked','invalid_handle','consent_required','invalid_country','country_locked_30_days','profile_required','confirmation_required','login_not_configured','rate_limited','run_not_found','run_expired','impossible_elapsed_time'];const message=known.find(v=>raw.includes(v))||(raw.includes('loopjolt_handle_unique')?'handle_taken':'request_failed');console.error('[LOOPJOLT_API]',action,message);return reply({error:message},message==='payload_too_large'?413:message==='rate_limited'?429:message==='handle_taken'?409:['invalid_credentials','invalid_or_expired_login','authentication_required'].includes(message)?401:message==='play_id_unavailable'?503:400);}
});
