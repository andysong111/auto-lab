(function(){
'use strict';
const $=s=>document.querySelector(s),frame=$('#frame'),flagsEl=$('#flags'),versus=$('#versus'),board=$('#board'),warning=$('#previewWarning');
const P=new URLSearchParams(location.search);
const validCode=c=>/^[A-Z]{2}$/.test(c||'');
const code=v=>String(v||'').toUpperCase().slice(0,2);
const flagSrc=c=>'/assets/flags/7.5.0/'+code(c).toLowerCase()+'.svg';
function flagCard(c){c=code(c);const d=document.createElement('div');d.className='flag-card';const i=document.createElement('img');i.src=flagSrc(c);i.alt='Flag '+c;const t=document.createElement('span');t.className='code';t.textContent=c;d.append(i,t);return d}
function safeText(id,v){const e=$(id);if(e&&v)e.textContent=v}
function score(v,verified){if(!verified)return '—';const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—'}
function bg(v){if(!v)return;try{const u=new URL(v,location.href);$('#gameplay').style.backgroundImage='linear-gradient(180deg,rgba(5,8,9,.25),rgba(5,8,9,.08)),url("'+u.href.replace(/"/g,'')+'")'}catch{}}
const format=['challenge','versus','board'].includes(P.get('format'))?P.get('format'):'challenge';
const verified=P.get('verified')==='1';
frame.className='frame format-'+format;
safeText('#hook',P.get('hook')||(format==='challenge'?'WHICH FLAG CLEARS THIS?':format==='versus'?'WHO TAKES THE LEAD?':'WORLD BOARD'));
safeText('#progress',P.get('progress')||(format==='challenge'?'48 RINGS':'THIS WEEK'));
safeText('#period',P.get('period')||'');
safeText('#cta',P.get('cta')||(format==='challenge'?'PICK YOUR FLAG · PLAY RANKED':'SET YOUR BEST · BACK YOUR FLAG'));
bg(P.get('bg'));
const flagList=(P.get('flags')||'KR,US,JP').split(',').map(code).filter(validCode).slice(0,5);
flagList.forEach(c=>flagsEl.append(flagCard(c)));
if(format==='versus'){
  versus.hidden=false;
  const pair=(P.get('flags')||'KR,JP').split(',').map(code).filter(validCode).slice(0,2);
  while(pair.length<2)pair.push(pair.length?'JP':'KR');
  const vals=[P.get('leftScore'),P.get('rightScore')];
  pair.forEach((c,idx)=>{const side=document.createElement('div');side.className='versus-side';const i=document.createElement('img');i.src=flagSrc(c);i.alt='Flag '+c;const n=document.createElement('div');n.className='country';n.textContent=c;const s=document.createElement('div');s.className='score';s.textContent=score(vals[idx],verified);side.append(i,n,s);if(idx===0)versus.append(side);else{const v=document.createElement('div');v.className='versus-vs';v.textContent='VS';versus.append(v,side)}})
  if(!verified)warning.hidden=false;
  safeText('#series','FLAG VS FLAG');
}
if(format==='board'){
  board.hidden=false;safeText('#series','WORLD BOARD');
  const rows=(P.get('boardRows')||'KR:8420,JP:8310,US:7900').split(',').slice(0,5);
  rows.forEach((raw,idx)=>{let [c,v]=raw.split(':');c=code(c);if(!validCode(c))return;const r=document.createElement('div');r.className='board-row';const rank=document.createElement('div');rank.className='rank';rank.textContent=String(idx+1);const i=document.createElement('img');i.src=flagSrc(c);i.alt='Flag '+c;const n=document.createElement('div');n.className='country';n.textContent=c;const s=document.createElement('div');s.className='score';s.textContent=score(v,verified);r.append(rank,i,n,s);board.append(r)})
  if(!verified)warning.hidden=false;
}
window.LoopJoltFlagTemplate=Object.freeze({format,verified,flags:flagList,diagnostics:()=>({format,verified,flagCount:document.querySelectorAll('img').length,overflow:frame.scrollWidth>1080||frame.scrollHeight>1920,warning:!warning.hidden})});
})();