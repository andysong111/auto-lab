/* Guest play is open. Play ID sessions use HttpOnly cookies; Google tokens remain tab-scoped. */
(function(){
'use strict';
const ENDPOINT='https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community';
const KEY='loopjolt_google_session_v1',QUICK='loopjolt_play_hint_v1';let token='',profile=null,configValue=null,quick=false,signingOut=Promise.resolve();
try{const hint=JSON.parse(localStorage.getItem(QUICK)||'null');quick=!!hint&&hint.expires>Date.now();}catch{}
try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved&&saved.expires>Date.now())token=saved.token;}catch{}
const countries='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
// Kept for legacy plain-text callers. Visual labels use renderFlagLabel / flagImage below.
const flag=c=>c&&/^[A-Z]{2}$/.test(c)?String.fromCodePoint(...[...c].map(v=>127397+v.charCodeAt(0))):'🌐';
const countrySet=new Set(countries),FLAG_BASE='/assets/flags/7.5.0/';
let regionNames;try{regionNames=new Intl.DisplayNames(['en'],{type:'region'});}catch{}
function countryCode(value){const c=typeof value==='string'?value.toUpperCase():'';return countrySet.has(c)?c:'';}
function countryName(value){const c=countryCode(value);return c?(regionNames?.of(c)||c):'No country selected';}
function placeholder(code,label){const span=document.createElement('span');span.className='lj-flag-placeholder';span.textContent=code||'—';span.setAttribute('role','img');span.setAttribute('aria-label',label);span.title=label;return span;}
function flagImage(value){
 const code=countryCode(value);if(!code)return placeholder('','No country selected');
 const img=document.createElement('img');img.className='lj-flag';img.dataset.country=code;img.width=24;img.height=18;img.decoding='async';img.alt='Flag of '+countryName(code);img.title=countryName(code)+' ('+code+')';
 img.addEventListener('error',()=>{img.replaceWith(placeholder(code,countryName(code)+' ('+code+'): flag image unavailable'));},{once:true});
 img.src=FLAG_BASE+code.toLowerCase()+'.svg';return img;
}
function renderFlagLabel(target,value,label){
 if(!target)return;const wrap=document.createElement('span');wrap.className='lj-flag-label';
 const text=document.createElement('span');text.className='lj-flag-name';text.textContent=String(label??countryName(value));
 wrap.append(flagImage(value),text);target.replaceChildren(wrap);return wrap;
}
function selectionPreview(select){
 if(!select)return;const id=select.id+'FlagPreview';let preview=document.getElementById(id);
 if(!preview){preview=document.createElement('div');preview.id=id;preview.className='lj-country-preview';preview.setAttribute('aria-live','polite');select.insertAdjacentElement('afterend',preview);}
 preview.hidden=select.hidden;renderFlagLabel(preview,select.value,countryName(select.value));return preview;
}
// Existing game controllers set the header's text after account loading. Upgrade just those
// two known labels on change without touching any gameplay, timing, auth or score code.
function watchGameIdentity(target){
 if(!target||target.dataset.imageFlagWatch)return;target.dataset.imageFlagWatch='1';
 const upgrade=()=>{
  if(target.childNodes.length!==1||target.firstChild?.nodeType!==Node.TEXT_NODE)return;
  const text=target.textContent||'',m=text.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s+(.+)$/u);
  if(m){const code=[...m[1]].map(ch=>String.fromCharCode(ch.codePointAt(0)-127397)).join('');if(countryCode(code))renderFlagLabel(target,code,m[2]);}
  else if(text.startsWith('🌐 '))renderFlagLabel(target,'',text.slice(3));
 };
 new MutationObserver(upgrade).observe(target,{childList:true,characterData:true,subtree:true});upgrade();
}
function installFlagUI(){
 if(!document.querySelector('link[data-loopjolt-flags]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/community/flags.css';link.dataset.loopjoltFlags='1';document.head.append(link);}
 document.querySelectorAll('#identity, #playerLink').forEach(watchGameIdentity);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installFlagUI,{once:true});else installFlagUI();
function logout(){const wasQuick=quick;token='';profile=null;quick=false;try{sessionStorage.removeItem(KEY);localStorage.removeItem(QUICK);}catch{}window.google?.accounts?.id?.disableAutoSelect();
 if(wasQuick)signingOut=fetch('/api/play-id?action=auth_logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)}).catch(()=>{});return signingOut;
}
async function quickAuth(body,recover=false){
 await signingOut;const response=await fetch('/api/play-id?action='+(recover?'auth_recover':'auth_enter'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)}),data=await response.json();
 if(!response.ok)throw Error(data.error||'request_failed');if(!data.profile||!data.expiresAt)throw Error('invalid_auth_response');
 token='';quick=true;profile=data.profile;try{sessionStorage.removeItem(KEY);localStorage.setItem(QUICK,JSON.stringify({expires:Date.parse(data.expiresAt)}));}catch{}
 return data;
}
async function api(action,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{
 let url=ENDPOINT+'?action='+encodeURIComponent(action),options={signal:controller.signal,cache:'no-store'};
 if(body!==undefined){if(quick)url='/api/play-id?action='+encodeURIComponent(action);options.method='POST';options.credentials='same-origin';options.headers={'Content-Type':'application/json',...(!quick?{Authorization:'Bearer '+token}:{})};options.body=JSON.stringify(body);}
 const response=await fetch(url,options),data=await response.json();
 if(!response.ok){if(response.status===401)logout();throw new Error(data.error||'network_error');}return data;
}finally{clearTimeout(timer);}}
async function config(){if(!configValue)configValue=await api('config');return configValue;}
async function me(){if(!token&&!quick)return null;try{profile=(await api('profile',{})).profile;return profile;}catch(e){if(e.message==='invalid_or_expired_login')logout();throw e;}}
async function accept(credential){if(quick)await logout();await signingOut;token=credential;try{
 const payload=JSON.parse(atob(credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
 const p=await me();try{sessionStorage.setItem(KEY,JSON.stringify({token,expires:payload.exp*1000}));}catch{}return p;
}catch(e){logout();throw e;}}
async function googleButton(element,onSuccess,onError){const cfg=await config();if(!(cfg.googleReady??cfg.loginReady))throw new Error('login_not_configured');
 if(!window.google?.accounts?.id)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('google_unavailable'));document.head.appendChild(script);});
 google.accounts.id.initialize({client_id:cfg.clientId,auto_select:false,callback:async r=>{try{await accept(r.credential);onSuccess();}catch(e){onError(e);}}});
 google.accounts.id.renderButton(element,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',width:260});
}
window.LoopCommunity={api,config,me,logout,quickAuth,googleButton,flag,countries,flagImage,renderFlagLabel,selectionPreview,countryName,get authenticated(){return !!token||quick;},get playId(){return quick;},get profile(){return profile;},endpoint:ENDPOINT};
})();
