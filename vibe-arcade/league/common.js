/* Shared presentation only. No token, score, game-rule or country writes. */
(function(){'use strict';
const C=window.LoopCommunity,GAMES=Object.freeze([
 {game:'orbit-sprint',title:'Orbit Sprint',label:'Orbit Sprint',version:'orbit-v1',url:'/games/orbit-sprint/'},
 {game:'reaction-rush',title:'Reaction Rush · Neon Siege',label:'Neon Siege',version:'rr-neon-v1',url:'/arcade3/play?game=reaction-rush'},
 {game:'perfect-timing',title:'Perfect Timing · Skyforge',label:'Skyforge',version:'pt-sky-v1',url:'/arcade3/play?game=perfect-timing'},
 {game:'dont-press',title:"Don't Press · Reactor Shift",label:'Reactor Shift',version:'dp-core-v1',url:'/arcade3/play?game=dont-press'}]);
const $=q=>document.querySelector(q),number=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-US'):'—';
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;}
function label(target,country,text){if(C?.renderFlagLabel)C.renderFlagLabel(target,country,text);else target.textContent=(country?country+' ':'')+text;}
function safeReturn(raw){try{const u=new URL(raw,location.origin);if(u.origin!==location.origin)return null;if(['/arcade3/play','/arcade3/play.html'].includes(u.pathname)&&GAMES.some(g=>g.game===u.searchParams.get('game')))return u.pathname+'?game='+encodeURIComponent(u.searchParams.get('game'));return u.pathname==='/games/orbit-sprint/'||u.pathname==='/games/orbit-sprint'?u.pathname:null;}catch{return null;}}
async function readBoard(filters={},signal){if(!C?.endpoint)throw Error('service_unavailable');const u=new URL(C.endpoint);u.search=new URLSearchParams({action:'board',game:'all',scope:'nations',period:'week',...filters});const response=await fetch(u,{cache:'no-store',signal:signal||AbortSignal.timeout(10000)});if(!response.ok)throw Error('board_unavailable');const data=await response.json();if(!Array.isArray(data.rows))throw Error('invalid_board');return data;}
function countdown(){const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));const end=new Date(start.getTime()+7*86400000);let minutes=Math.max(0,Math.floor((end-now)/60000)),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60);minutes%=60;document.querySelectorAll('[data-countdown]').forEach(n=>n.textContent=days+'d '+String(hours).padStart(2,'0')+'h '+String(minutes).padStart(2,'0')+'m');const fmt={month:'short',day:'numeric',timeZone:'UTC'};document.querySelectorAll('[data-week-label]').forEach(n=>n.textContent=start.toLocaleDateString('en-US',fmt)+' — '+new Date(end-1).toLocaleDateString('en-US',fmt)+' UTC');}
function viewForUrl(raw){const u=new URL(raw,location.origin);if(u.pathname.startsWith('/community'))return u.searchParams.get('panel')==='profile'?'profile':u.searchParams.get('scope')==='country'?'country':'rankings';return u.hash==='#games'?'games':'home';}
function navigation(){const view=viewForUrl(location.href),current=view==='home'||view==='games'?'play':view==='profile'?'profile':'rankings';document.querySelectorAll('[data-simple-nav]').forEach(a=>{if(a.dataset.simpleNav===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
function identity(){const p=C?.profile,target=$('#leagueIdentity');if(target){if(p)label(target,p.country,p.handle);else target.textContent='Sign in';}navigation();document.dispatchEvent(new CustomEvent('league:identity'));}
const ready=(async()=>{let config=null;try{config=await C?.config();}catch{}if(C?.authenticated)try{await C.me();}catch{}identity();return config;})();
function track(e,props){window.LJTelemetry?.track(e,'league','league-simple-v1',props||{});}
window.WorldLeague={C,GAMES,node,number,label,readBoard,safeReturn,ready,identity,track,viewForUrl,navigation};
countdown();setInterval(countdown,60000);navigation();window.addEventListener('hashchange',navigation);window.addEventListener('popstate',navigation);document.addEventListener('change',navigation);track('page_view');
})();
