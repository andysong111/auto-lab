/* Password and opaque-session authentication. No gameplay or identity linking by public handle.
 * Uses native WebCrypto PBKDF2 (600k SHA-256), random salts, and service-role-only RPCs.
 * RPC payloads never contain a plaintext password, session token or recovery code. */
(function(root){'use strict';
const ITERATIONS=600000,encoder=new TextEncoder(),HEX=/^[a-f0-9]{64}$/;
const RESERVED=new Set(['admin','administrator','moderator','loopjolt','support','official']);
const COMMON=new Set(['passwordpassword','password123456789','123456789012345','1234567890123456','qwertyuiopasdfgh','qwertyuiop123456','iloveyouiloveyou','letmeinletmein123','changemechangeme','password12345678']);
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const random=(n=32)=>hex(crypto.getRandomValues(new Uint8Array(n)));
async function digest(s){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));}
function id(value){if(typeof value!=='string')throw Error('invalid_play_id');const s=value.trim().toLowerCase();if(!/^[a-z0-9_]{4,16}$/.test(s)||RESERVED.has(s))throw Error('invalid_play_id');return s;}
function password(value,login,checkCommon=true){
 if(typeof value!=='string'||value.length>512)throw Error('invalid_password');
 const s=value.normalize('NFC'),n=Array.from(s).length;
 if(n<15||n>128||/\p{Cc}/u.test(s))throw Error('invalid_password');
 if(checkCommon){const low=s.toLowerCase();if(COMMON.has(low)||/^(.)\1+$/su.test(s)||[login,'loopjolt','password'].some(x=>low===x.repeat(Math.ceil(low.length/x.length)).slice(0,low.length)))throw Error('weak_password');}
 return s;
}
async function derive(pass,salt){
 if(!/^[a-f0-9]{32}$/.test(salt))throw Error('invalid_salt');
 const key=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:Uint8Array.from(salt.match(/../g),x=>parseInt(x,16)),iterations:ITERATIONS},key,256));
}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||!HEX.test(a)||!HEX.test(b))return false;let difference=0;for(let i=0;i<64;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;}
async function keyed(secret,message){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(message)));}
function create({rpc,secret,countries}){
 if(typeof rpc!=='function'||!secret||!(countries instanceof Set))throw Error('auth_unavailable');
 async function enabled(){if(!(await rpc('config')).enabled)throw Error('play_id_unavailable');}
 async function gate(login,ip){const accountKey=await keyed(secret,'playid:account:'+login),ipKey=await keyed(secret,'playid:network:'+String(ip||'unknown').slice(0,128));const r=await rpc('rate',{accountKey,ipKey});if(!r.allowed)throw Error('rate_limited');return ipKey;}
 async function enter(body,ip){
  await enabled();const login=id(body.id),pass=password(body.password,login,false),ipKey=await gate(login,ip);
  const row=await rpc('lookup',{login}),salt=row?.salt||random(16),hash=await derive(pass,salt);
  if(row?.collision||row?.blocked||(row?.hash&&!equal(hash,row.hash)))throw Error('invalid_credentials');
  const creating=!row?.hash;
  if(creating){password(body.password,login);if(!countries.has(body.country))throw Error('invalid_country');if(body.consent!==true||body.age16!==true)throw Error('consent_required');}
  const token='ljp_'+random(),recoveryCode=creating?'ljr_'+random(24):null;
  const r=await rpc('enter',{login,salt,hash,expectedHash:row?.hash||null,subject:creating?random():row.subject,sessionHash:await digest(token),recoveryHash:recoveryCode?await digest(recoveryCode):null,country:body.country,consent:body.consent===true,age16:body.age16===true,ipKey});
  if(r.error)throw Error(r.error);
  return {profile:r.profile,created:creating,token,expiresAt:r.expiresAt,...(recoveryCode?{recoveryCode}:{})};
 }
 async function recover(body,ip){
  await enabled();const login=id(body.id),pass=password(body.password,login);await gate(login,ip);
  const code=typeof body.recoveryCode==='string'?body.recoveryCode.trim().toLowerCase():'';
  if(!/^ljr_[a-f0-9]{48}$/.test(code))throw Error('invalid_credentials');
  const salt=random(16),hash=await derive(pass,salt),token='ljp_'+random(),recoveryCode='ljr_'+random(24);
  const r=await rpc('recover',{login,salt,hash,recoveryHash:await digest(code),nextRecoveryHash:await digest(recoveryCode),sessionHash:await digest(token)});
  if(r.error)throw Error('invalid_credentials');
  return {profile:r.profile,created:false,recovered:true,token,expiresAt:r.expiresAt,recoveryCode};
 }
 async function resolve(token){if(!/^ljp_[a-f0-9]{64}$/.test(token||''))throw Error('invalid_or_expired_login');const r=await rpc('session',{sessionHash:await digest(token)});if(!r.subject)throw Error('invalid_or_expired_login');return r.subject;}
 async function logout(token){if(/^ljp_[a-f0-9]{64}$/.test(token||''))await rpc('logout',{sessionHash:await digest(token)});return {loggedOut:true};}
 return Object.freeze({enter,recover,resolve,logout});
}
const api={ITERATIONS,random,digest,id,password,derive,equal,create};root.LoopPlayId=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
