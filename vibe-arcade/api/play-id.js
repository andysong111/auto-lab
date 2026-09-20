/* Same-origin HttpOnly cookie bridge. Never logs request bodies or exposes session secrets. */
'use strict';
const ORIGIN='https://vibe-arcade-dun.vercel.app';
const ENDPOINT='https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community';
const COOKIE='__Host-loopjolt_play';
const ALLOWED=new Set(['auth_exchange','auth_logout','profile','save_profile','delete_profile','start','finish']);
const SESSION=/^ljp_[a-f0-9]{64}$/;
function cookieToken(header=''){const match=String(header).split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));const value=match?match.slice(COOKIE.length+1):'';return SESSION.test(value)?value:'';}
function cookie(value,seconds){return COOKIE+'='+value+'; Path=/; Max-Age='+seconds+'; HttpOnly; Secure; SameSite=Lax';}
function makeHandler(fetcher=fetch){return async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(req.headers.origin!==ORIGIN||req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'origin_required'});
 const action=typeof req.query?.action==='string'?req.query.action:'';
 if(!ALLOWED.has(action))return res.status(404).json({error:'not_found'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 let body=req.body;
 try{if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({error:'invalid_payload'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({error:'invalid_payload'});
 if(Buffer.byteLength(JSON.stringify(body))>65536)return res.status(413).json({error:'payload_too_large'});
 const token=cookieToken(req.headers.cookie),isLogin=action==='auth_exchange';
 if(isLogin&&(!/^ljx_[a-f0-9]{64}$/.test(body.ticket||'')||Object.keys(body).some(k=>k!=='ticket')))return res.status(400).json({error:'invalid_payload'});
 // Clearing the browser cookie is unconditional, even when upstream revocation is unavailable.
 if(action==='auth_logout'||action==='delete_profile'){
  if(action==='auth_logout')res.setHeader('Set-Cookie',cookie('',0));
 }
 if(!isLogin&&!token){if(action==='auth_logout')return res.status(200).json({loggedOut:true});return res.status(401).json({error:'invalid_or_expired_login'});}
 try{
  const response=await fetcher(ENDPOINT+'?action='+encodeURIComponent(action),{method:'POST',headers:{'Content-Type':'application/json',Origin:ORIGIN,...(token&&!isLogin?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(isLogin&&response.ok){
   const seconds=Math.min(604800,Math.floor((Date.parse(data.expiresAt)-Date.now())/1000));
   if(!SESSION.test(data.token||'')||!Number.isFinite(seconds)||seconds<=0||!data.profile)return res.status(502).json({error:'invalid_auth_response'});
   res.setHeader('Set-Cookie',cookie(data.token,seconds));
  }
  if((action==='delete_profile'&&response.ok)||response.status===401&&!isLogin)res.setHeader('Set-Cookie',cookie('',0));
  if(response.status===429)res.setHeader('Retry-After','900');
  // Allowlisted response shaping protects against accidental future upstream hash/token leaks.
  if(isLogin&&response.ok)return res.status(200).json({profile:data.profile,created:data.created===true,recovered:data.recovered===true,expiresAt:data.expiresAt,...(data.recoveryCode?{recoveryCode:data.recoveryCode}:{})});
  if(!response.ok)return res.status(response.status).json({error:typeof data.error==='string'?data.error:'request_failed'});
  return res.status(200).json(data);
 }catch{return res.status(503).json({error:'backend_unavailable'});}
};}
module.exports=makeHandler();module.exports.makeHandler=makeHandler;module.exports.cookieToken=cookieToken;
