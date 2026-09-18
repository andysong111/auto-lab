/* Google login is optional. Tokens remain in this tab session, never in URLs or analytics. */
(function(){
'use strict';
const ENDPOINT='https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-community';
const KEY='loopjolt_google_session_v1';let token='',profile=null,configValue=null;
try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved&&saved.expires>Date.now())token=saved.token;}catch{}
const countries='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const flag=c=>c&&/^[A-Z]{2}$/.test(c)?String.fromCodePoint(...[...c].map(v=>127397+v.charCodeAt(0))):'🌐';
function logout(){token='';profile=null;try{sessionStorage.removeItem(KEY);}catch{}window.google?.accounts?.id?.disableAutoSelect();}
async function api(action,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{
 let url=ENDPOINT+'?action='+encodeURIComponent(action),options={signal:controller.signal,cache:'no-store'};
 if(body!==undefined){options.method='POST';options.headers={'Content-Type':'application/json',Authorization:'Bearer '+token};options.body=JSON.stringify(body);}
 const response=await fetch(url,options),data=await response.json();
 if(!response.ok){if(response.status===401)logout();throw new Error(data.error||'network_error');}return data;
}finally{clearTimeout(timer);}}
async function config(){if(!configValue)configValue=await api('config');return configValue;}
async function me(){if(!token)return null;try{profile=(await api('profile',{})).profile;return profile;}catch(e){if(e.message==='invalid_or_expired_login')logout();throw e;}}
async function accept(credential){token=credential;try{
 const payload=JSON.parse(atob(credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
 const p=await me();try{sessionStorage.setItem(KEY,JSON.stringify({token,expires:payload.exp*1000}));}catch{}return p;
}catch(e){logout();throw e;}}
async function googleButton(element,onSuccess,onError){const cfg=await config();if(!cfg.loginReady)throw new Error('login_not_configured');
 if(!window.google?.accounts?.id)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('google_unavailable'));document.head.appendChild(script);});
 google.accounts.id.initialize({client_id:cfg.clientId,auto_select:false,callback:async r=>{try{await accept(r.credential);onSuccess();}catch(e){onError(e);}}});
 google.accounts.id.renderButton(element,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',width:260});
}
window.LoopCommunity={api,config,me,logout,googleButton,flag,countries,get authenticated(){return !!token;},get profile(){return profile;},endpoint:ENDPOINT};
})();
