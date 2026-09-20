(function(){
'use strict';
const $=s=>document.querySelector(s),frame=$('#frame'),flagsEl=$('#flags'),versus=$('#versus'),board=$('#board'),warning=$('#previewWarning'),gameplay=$('#gameplay'),placeholder=$('.gameplay-placeholder');
const P=new URLSearchParams(location.search);
const validCode=c=>/^[A-Z]{2}$/.test(c||'');
const code=v=>String(v||'').toUpperCase().slice(0,2);
const flagSrc=c=>'/assets/flags/7.5.0/'+code(c).toLowerCase()+'.svg';
function flagCard(c){c=code(c);const d=document.createElement('div');d.className='flag-card';const i=document.createElement('img');i.src=flagSrc(c);i.alt='Flag '+c;const t=document.createElement('span');t.className='code';t.textContent=c;d.append(i,t);return d}
function safeText(id,v){const e=$(id);if(e&&v!==null&&v!==undefined)e.textContent=v}
function finiteScore(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}
function score(v,verified){const n=finiteScore(v);return verified&&n!==null?Math.round(n).toLocaleString('en-US'):'—'}
function parseRows(raw){return String(raw||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,5).map(x=>{const [rawCode,rawScore]=x.split(':');return{code:code(rawCode),score:finiteScore(rawScore)}}).filter(x=>validCode(x.code))}
function installBg(v){
 if(!v)return 'placeholder';
 try{
  const u=new URL(v,location.href);if(!['http:','https:'].includes(u.protocol))return 'placeholder';
  const type=(P.get('bgType')||'').toLowerCase(),isVideo=type==='video'||/\.(mp4|webm|mov)(?:$|[?#])/i.test(u.pathname+u.search+u.hash);
  const media=document.createElement(isVideo?'video':'img');media.className='gameplay-media';media.src=u.href;
  const ready=()=>{placeholder.hidden=true};const failed=()=>{media.remove();placeholder.hidden=false};
  if(isVideo){media.muted=true;media.autoplay=true;media.loop=true;media.playsInline=true;media.preload='auto';media.addEventListener('loadeddata',ready,{once:true});media.addEventListener('error',failed,{once:true})}
  else{media.alt='Gameplay background';media.addEventListener('load',ready,{once:true});media.addEventListener('error',failed,{once:true})}
  gameplay.prepend(media);return isVideo?'video':'image';
 }catch{return 'placeholder'}
}
const format=['challenge','versus','board'].includes(P.get('format'))?P.get('format'):'challenge';
const requestedVerified=P.get('verified')==='1',cover=P.get('cover')==='1';
const flagList=(P.get('flags')||'KR,US,JP').split(',').map(code).filter(validCode).slice(0,5);
const versusPair=(P.get('flags')||'KR,JP').split(',').map(code).filter(validCode).slice(0,2);
const versusScores=[finiteScore(P.get('leftScore')),finiteScore(P.get('rightScore'))];
const boardRows=parseRows(P.get('boardRows'));
const period=String(P.get('period')||'').trim();
const snapshotComplete=format==='versus'
  ?versusPair.length===2&&versusScores.every(x=>x!==null)&&!!period
  :format==='board'
    ?boardRows.length>=3&&boardRows.every(x=>x.score!==null)&&!!period
    :true;
const verified=requestedVerified&&snapshotComplete;
frame.className='frame format-'+format+(cover?' cover':'');
safeText('#hook',P.get('hook')||(format==='challenge'?'WHICH FLAG CLEARS THIS?':format==='versus'?'WHO TAKES THE LEAD?':'TOP FLAGS THIS WEEK'));
safeText('#progress',P.has('progress')?P.get('progress'):(format==='challenge'?'48 RINGS':''));
safeText('#period',period);
safeText('#cta',P.get('cta')||(format==='challenge'?'PICK YOUR FLAG · PLAY RANKED':'SET YOUR BEST · BACK YOUR FLAG'));
const bgKind=installBg(P.get('bg'));
if(format==='challenge')flagList.forEach(c=>flagsEl.append(flagCard(c)));
if(format==='versus'){
  versus.hidden=false;
  const pair=versusPair.slice();while(pair.length<2)pair.push(pair.length?'JP':'KR');
  pair.forEach((c,idx)=>{const side=document.createElement('div');side.className='versus-side';const i=document.createElement('img');i.src=flagSrc(c);i.alt='Flag '+c;const n=document.createElement('div');n.className='country';n.textContent=c;const s=document.createElement('div');s.className='score';s.textContent=score(versusScores[idx],verified);side.append(i,n,s);if(idx===0)versus.append(side);else{const v=document.createElement('div');v.className='versus-vs';v.textContent='VS';versus.append(v,side)}})
  if(!verified)warning.hidden=false;safeText('#series','FLAG VS FLAG');
}
if(format==='board'){
  board.hidden=false;safeText('#series','WORLD BOARD');
  const rows=boardRows.length?boardRows:[{code:'KR',score:null},{code:'JP',score:null},{code:'US',score:null}];
  rows.forEach((row,idx)=>{const r=document.createElement('div');r.className='board-row';const rank=document.createElement('div');rank.className='rank';rank.textContent=String(idx+1);const i=document.createElement('img');i.src=flagSrc(row.code);i.alt='Flag '+row.code;const n=document.createElement('div');n.className='country';n.textContent=row.code;const s=document.createElement('div');s.className='score';s.textContent=score(row.score,verified);r.append(rank,i,n,s);board.append(r)})
  if(!verified)warning.hidden=false;
}
window.LoopJoltFlagTemplate=Object.freeze({format,requestedVerified,verified,cover,flags:flagList,bgKind,diagnostics:()=>({format,requestedVerified,verified,snapshotComplete,cover,bgKind,placeholderHidden:placeholder.hidden,flagCount:[...document.querySelectorAll('img')].filter(x=>getComputedStyle(x).display!=='none'&&x.getClientRects().length).length,overflow:frame.scrollWidth>1080||frame.scrollHeight>1920,warning:!warning.hidden})});
})();