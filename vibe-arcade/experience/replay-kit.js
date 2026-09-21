/* Shared result presentation and local records. No rules, auth or score transport. */
(function(root){'use strict';
const VERSION='retention-v1';
const CATALOG=Object.freeze([
 {id:'gyro-drop',title:'Deep Descent',url:'/descent'},
 {id:'core-pins',title:'Core Pins',url:'/games/core-pins'},
 {id:'nova-merge',title:'Nova Merge',url:'/games/nova-merge'},
 {id:'orbit-sprint',title:'Orbit Sprint',url:'/games/orbit-sprint'}
].map(Object.freeze));
const valid=n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
const number=n=>valid(n)?n.toLocaleString('en-US'):'—';
function loadBest(key,store){try{const raw=(store||root.localStorage).getItem(key);if(raw===null||!/^\d+$/.test(raw))return 0;const n=Number(raw);return valid(n)?n:0;}catch{return 0;}}
function record({score,previousBest=0,key,capture=false,store}){
 if(!valid(score))throw Error('invalid_local_score');
 // Refresh a concurrent tab's best before writing. Local storage is not a server record.
 const before=Math.max(valid(previousBest)?previousBest:0,capture?0:loadBest(key,store)),best=Math.max(before,score);let stored=false;
 if(!capture)try{const s=store||root.localStorage;s.setItem(key,String(best));stored=s.getItem(key)===String(best);}catch{}
 return Object.freeze({score,previousBest:before,best,stored,capture});
}
function comparison({score,previousBest=0}){
 if(!valid(score))throw Error('invalid_local_score');const before=valid(previousBest)?previousBest:0;
 if(score>before)return {title:before?'NEW DEVICE BEST':'FIRST DEVICE BEST',detail:before?'+'+number(score-before)+' above your previous best.':'Your score to beat next time: '+number(score)+'.'};
 if(before>0)return {title:score===before?'DEVICE BEST MATCHED':'BEAT YOUR DEVICE BEST',detail:number(before-score+1)+' more '+(before-score+1===1?'point':'points')+' to beat '+number(before)+'.'};
 return {title:'READY FOR ANOTHER TRY?',detail:'Your first points are still ahead.'};
}
function practiceNote(r){return r?.capture?'Capture practice · no record written.':r?.stored?'Device best saved. Not a ranked score.':'Score kept for this visit. Device storage is unavailable.';}
function next(game){const i=CATALOG.findIndex(g=>g.id===game);return i<0?null:CATALOG[(i+1)%CATALOG.length];}
function create({game,result,score,again,save,retry,nextLink,dismiss,onRetry}){
 const row=CATALOG.find(g=>g.id===game);if(!row)return null;
 const doc=root.document,resolve=x=>typeof x==='string'?doc.querySelector(x):x;
 const box=resolve(result),scoreEl=resolve(score),play=resolve(again),status=resolve(save),close=resolve(dismiss);
 if(!box||!scoreEl||!play||!status)throw Error('replay_kit_missing_slot');
 box.classList.add('lj-result-shell');box.setAttribute('aria-label',row.title+' result');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.tabIndex=-1;
 const summary=doc.createElement('div');summary.className='lj-local-comparison';summary.hidden=true;
 const heading=doc.createElement('strong'),detail=doc.createElement('span');summary.append(heading,detail);scoreEl.after(summary);
 const generated=[];let local=null,busy=false,destroyed=false,mode='practice',saveState='practice',retryButton=resolve(retry);
 if(!retryButton&&onRetry){retryButton=doc.createElement('button');retryButton.type='button';retryButton.className='game-btn secondary';retryButton.textContent='Retry save';retryButton.dataset.retrySave='';retryButton.hidden=true;status.after(retryButton);generated.push(retryButton);}
 const target=next(game);let link=resolve(nextLink);
 if(!link){link=doc.createElement('a');link.className='game-btn lj-next-game';(play.closest('.result-actions,.result-links')||play.parentElement).append(link);generated.push(link);}
 link.href=target.url;link.textContent='NEXT GAME · '+target.title+' →';link.dataset.nextGame=target.id;
 play.dataset.primaryReplay='';play.classList.add('lj-replay-primary');
 const onNext=e=>{if(busy){e.preventDefault();e.stopImmediatePropagation();return;}try{root.LJTelemetry?.track('next_game',game,VERSION,{to:target.id});}catch{}};
 const retryClick=()=>{if(!busy&&onRetry)onRetry();};link.addEventListener('click',onNext);if(onRetry)retryButton?.addEventListener('click',retryClick);
 const preventExit=e=>{if(busy){e.preventDefault();e.stopImmediatePropagation();}};
 box.addEventListener('cancel',preventExit,true);
 const onNextFocus=()=>{if(busy)status.focus({preventScroll:true});};link.addEventListener('focus',onNextFocus);
 function labels(){play.textContent=busy?'VERIFYING…':'PLAY AGAIN';play.setAttribute('aria-label',busy?'Verifying ranked score':mode==='ranked'?'Play ranked again':'Play practice again');}
 function lock(value){busy=value;play.disabled=value;if(close)close.disabled=value;link.setAttribute('aria-disabled',String(value));if(value)link.tabIndex=-1;else link.removeAttribute('tabindex');labels();}
 function focus(){if(destroyed||box.hidden||box.tagName==='DIALOG'&&!box.open)return;(busy?status:play).focus({preventScroll:true});}
 function begin(){if(destroyed)return;local=null;summary.hidden=true;saveState='practice';lock(false);if(retryButton)retryButton.hidden=true;}
 function complete(r,{ranked=false}={}){if(destroyed)return;local=r;mode=ranked?'ranked':'practice';const c=comparison(r);heading.textContent=c.title;detail.textContent='THIS RUN '+number(r.score)+' · DEVICE BEST '+number(r.best)+'. '+c.detail;summary.hidden=false;labels();focus();}
 function saved({state,score:confirmed,retryable=false}){
  if(destroyed)return;if(!['practice','saving','verified','failed'].includes(state))throw Error('invalid_save_state');
  if(state==='verified'&&!valid(confirmed))throw Error('unverified_score');
  const wasBusy=busy;saveState=state;lock(state==='saving');status.dataset.state=state;
  status.textContent=state==='practice'?practiceNote(local):state==='saving'?'Verifying this run…':state==='verified'?'Verified · '+number(confirmed)+' points saved.':
   'Ranked save not confirmed. '+(local?.stored?'Device best retained.':'Score retained for this visit.')+(retryable?' Retry save before starting another run.':' Start a new run to try again.');
  if(retryButton)retryButton.hidden=!(state==='failed'&&retryable);
  if(state==='saving'||wasBusy)focus();
 }
 return Object.freeze({begin,complete,saved,focus,get local(){return local;},get saving(){return busy;},get saveState(){return saveState;},
 destroy(){if(destroyed)return;destroyed=true;link.removeEventListener('click',onNext);link.removeEventListener('focus',onNextFocus);box.removeEventListener('cancel',preventExit,true);if(onRetry)retryButton?.removeEventListener('click',retryClick);summary.remove();generated.forEach(n=>n.remove());}});
}
// Only a visible, intentional ?play=1 navigation starts free practice. It is consumed
// once; ordinary search/campaign links still show an explicit Play button. Never ranks.
function autoPractice({ready,start}){
 if(typeof root.document==='undefined')return ()=>{};
 let consumed=false;const doc=root.document;
 const run=()=>{if(consumed||doc.hidden||!ready())return;const u=new URL(root.location.href);
  if(u.searchParams.get('play')!=='1'||['capture','qa'].some(k=>u.searchParams.get(k)==='1'))return;
  consumed=true;u.searchParams.delete('play');try{root.history.replaceState(root.history.state,'',u.pathname+u.search+u.hash);}catch{}
  doc.removeEventListener('visibilitychange',run);start();
 };
 doc.addEventListener('visibilitychange',run);queueMicrotask(run);return run;
}
const api=Object.freeze({VERSION,CATALOG,loadBest,record,comparison,practiceNote,next,create,autoPractice});root.LoopJoltReplayKit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
