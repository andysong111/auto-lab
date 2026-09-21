/* Shared game experience. Rendering only; canonical rules and server verification stay separate. */
(function(root){
'use strict';
const GAMES=[['perfect-timing','Skyforge','/arcade3/play?game=perfect-timing'],['reaction-rush','Neon Siege','/arcade3/play?game=reaction-rush'],['dont-press','Reactor Shift','/arcade3/play?game=dont-press'],['orbit-sprint','Orbit Sprint','/games/orbit-sprint/']];
const number=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('en-US'):'—';
class SessionUI {
 constructor({game,version,capture=false,onPlay}){
  this.game=game;this.version=version;this.capture=capture;this.onPlay=onPlay;this.C=root.LoopCommunity;
  this.serial=0;this.phase='idle';this.choice=null;this.config=null;this.pending=null;this.saving=false;this.reason='';
  this.$=id=>document.getElementById(id);this.saveEl=this.$('saveState')||this.$('rankMessage');
  const row=GAMES.find(x=>x[0]===game);this.url=row[2];this.title=row[1];
  this.signin='/community/?panel=profile&returnTo='+encodeURIComponent(this.url);
  this.identity=this.$('identity')||this.$('playerLink');this.identity.href=this.signin;
  for(const id of ['viewScore','boardLink'])if(this.$(id))this.$(id).href='/community/?game='+game+'&scope=world';
  this.$('nextGame').href=GAMES[(GAMES.indexOf(row)+1)%GAMES.length][2];
  this.$('signInRun').href=this.signin;this.$('alternatePlay').onclick=()=>this.onPlay(this.mode()==='ranked'?'practice':'ranked');
  this.$('retrySave').onclick=()=>this.submit();
  this.$('howToPlay').addEventListener('toggle',()=>{if(this.$('howToPlay').open)document.dispatchEvent(new Event('game:help'));});
  this.buttons();
  this.replay=game==='orbit-sprint'?root.LoopJoltReplayKit?.create({game,result:'#overlay',score:'#overlayTitle',again:'#start',save:'#rankMessage',retry:'#retrySave',nextLink:'#nextGame'}):null;
 }
 mode(){return this.choice||(!this.capture&&this.C?.authenticated&&this.C?.profile&&this.eligible()?'ranked':'practice');}
 eligible(){return this.config?.loginReady!==false&&this.config?.rankedGames?.some(g=>g.game===this.game&&g.version===this.version);}
 identityUI(){const p=this.C?.profile;if(p&&this.C.authenticated){if(this.C.renderFlagLabel)this.C.renderFlagLabel(this.identity,p.country,p.handle);else this.identity.textContent=(p.country||'')+' '+p.handle;}else this.identity.textContent='Sign in';}
 buttons(){
  const locked=['preparing','saving'].includes(this.phase),playing=['playing','paused'].includes(this.phase),ranked=this.mode()==='ranked',again=this.phase==='result';
  this.$('resultLinks').inert=locked;this.$('start').disabled=locked;this.$('start').textContent=this.phase==='preparing'?'Preparing…':this.phase==='saving'?'Saving…':(again?'Play again · ':'Play ')+(ranked?'ranked':'practice');
  const canRank=!this.capture&&this.C?.authenticated&&this.C?.profile&&this.eligible();
  this.$('alternatePlay').hidden=!canRank||playing||locked;this.$('alternatePlay').textContent=ranked?'Practice instead':'Play ranked';
  this.$('signInRun').hidden=this.capture||canRank||playing||locked;
  this.$('signInRun').textContent=this.C?.authenticated?'Finish player setup':'Sign in to rank';
  this.$('entryMode').textContent=this.capture?'Practice · capture mode':ranked?'Ranked · official scores':'Practice · device only';
  this.$('entryMode').hidden=playing||again;
  this.identityUI();if(this.replay&&again)this.$('start').textContent='PLAY AGAIN';
 }
 async boot(){
  if(this.capture){this.saveEl.textContent='Real gameplay capture. No rankings or analytics.';this.buttons();return null;}
  try{this.config=await this.C?.config();if(this.C?.authenticated)await this.C.me();}
  catch{this.$('officialBest').textContent='Unavailable';}
  this.identityUI();
  if(this.phase==='idle'){this.buttons();this.saveEl.textContent=this.mode()==='ranked'?'One verified run. Your best score counts.':'No account needed. Practice scores stay on this device.';}
  if(this.phase==='idle')this.context(this.serial,false);
  return this.config;
 }
 async prepare(choice){
  if(['preparing','saving','playing'].includes(this.phase))return {ok:false};
  this.phase='preparing';this.choice=this.capture?'practice':choice;const id=++this.serial;
  this.pending=null;this.replay?.begin();this.$('retrySave').hidden=true;this.$('rankSummary').hidden=true;this.$('nextTarget').hidden=true;
  this.$('resultLinks').hidden=true;this.buttons();this.reason='';
  if(this.choice==='practice')return {ok:true,run:null,serial:id};
  try{
   if(!this.config)this.config=await this.C?.config();
   if(!this.eligible())throw Error('unavailable');
   if(!this.C?.authenticated)throw Error('signin');await this.C.me();if(!this.C.profile)throw Error('profile');
   const grant=await this.C.api('start',{game:this.game});
   if(!grant||grant.version!==this.version||!Number.isInteger(grant.seed)||typeof grant.runId!=='string')throw Error('bad_grant');
   if(id!==this.serial||document.hidden)throw Error('hidden');
   this.runProfile={...this.C.profile};return {ok:true,run:grant,serial:id};
  }catch(e){
   if(id!==this.serial)return {ok:false};this.phase='idle';this.buttons();
   this.saveEl.textContent='Ranked run did not start. Sign in again, retry, or choose practice.';
   if(!this.C?.authenticated||!this.C?.profile)this.choice='practice';
   this.buttons();this.$('alternatePlay').hidden=false;this.$('alternatePlay').textContent='Play practice';this.$('alternatePlay').onclick=()=>this.onPlay('practice');
   return {ok:false};
  }
 }
 started(run){this.phase='playing';this.$('alternatePlay').onclick=()=>this.onPlay(this.mode()==='ranked'?'practice':'ranked');this.$('howToPlay').open=false;document.body.classList.add('is-playing');this.$('mode').textContent=run?'RANKED':'PRACTICE';this.buttons();}
 downgrade(reason){this.choice='practice';this.reason=reason;this.$('mode').textContent='PRACTICE';}
 paused(value){this.phase=value?'paused':'playing';this.$('rankSummary').hidden=true;this.$('nextTarget').hidden=true;this.$('retrySave').hidden=true;this.buttons();}
 finished({run,actions,ticks,score,local}){
  document.body.classList.remove('is-playing');this.phase='result';this.$('resultLinks').hidden=false;
  this.$('entryMode').hidden=true;this.$('rankSummary').hidden=true;this.$('nextTarget').hidden=true;
  this.pending=run?{serial:this.serial,run,score,profile:this.runProfile,body:{runId:run.runId,actions:actions.map(a=>a.slice()),ticks}}:null;
  this.saveEl.dataset.state=run?'saving':'practice';
  this.saveEl.textContent=run?'Verifying and saving…':(this.reason?this.reason+' ':'')+'Device best saved. Not entered in rankings.';
  this.buttons();if(local){this.replay?.complete(local,{ranked:this.mode()==='ranked'});this.replay?.saved({state:run?'saving':'practice'});}return run?this.submit():Promise.resolve();
 }
 async submit(){
  const p=this.pending;if(!p||p.serial!==this.serial||this.saving)return;
  if(p.run.expiresAt&&Date.parse(p.run.expiresAt)<=Date.now()){this.saveEl.textContent='Save window expired. Device best retained.';this.$('retrySave').hidden=true;this.pending=null;this.replay?.saved({state:'failed',retryable:false});return;}
  this.saving=true;this.phase='saving';this.$('retrySave').hidden=true;this.saveEl.textContent='Verifying and saving…';this.buttons();this.replay?.saved({state:'saving'});
  try{
   const result=await this.C.api('finish',p.body);
   if(p.serial!==this.serial)return;
   if(result.saved!==true||!Number.isSafeInteger(result.score)||result.score<0)throw Error('not_confirmed');
   this.saveEl.dataset.state='verified';this.saveEl.textContent='Verified · '+number(result.score)+' points saved.';
   const title=this.$('resultTitle')||this.$('overlayTitle');title.textContent=number(result.score)+' points';
   this.pending=null;this.replay?.saved({state:'verified',score:result.score});this.context(p.serial,true,p.profile);
  }catch(e){
   if(p.serial!==this.serial)return;
   const final=/invalid|expired|impossible|mismatch|blocked|not_found|profile_required|authentication/.test(e.message);
   this.saveEl.dataset.state='unconfirmed';this.saveEl.textContent=final?'Ranked save was rejected. Device best retained.':'Save not confirmed. Device best retained. Retry before playing again.';
   this.replay?.saved({state:'failed',retryable:!final});this.$('retrySave').hidden=final;if(final)this.pending=null;if(!this.C?.authenticated)this.choice='practice';
  }finally{this.saving=false;if(p.serial===this.serial){this.phase='result';this.buttons();}}
 }
 async context(id,showResult,profile){
  const p=profile||this.C?.profile;if(this.capture)return;
  if(!p||!this.C?.authenticated){this.$('officialBest').textContent='Sign in to rank';return;}
  if(!this.C.endpoint){this.$('officialBest').textContent='Unavailable';return;}
  const read=async(scope)=>{const url=new URL(this.C.endpoint);url.search=new URLSearchParams({action:'board',game:this.game,scope,period:'week'});const r=await fetch(url,{signal:AbortSignal.timeout(7000),cache:'no-store'});if(!r.ok)throw Error('board');const d=await r.json();if(!Array.isArray(d.rows))throw Error('board');return d.rows;};
  try{
   const [players,nations]=await Promise.all([read('world'),showResult&&p.country?read('nations'):Promise.resolve([])]);
   if(id!==this.serial)return;
   const row=players.find(r=>r.handle?.toLowerCase()===p.handle.toLowerCase());
   this.$('officialBest').textContent=row?number(row.score):'Not in top 100';
   if(!showResult||this.phase==='playing'||this.phase==='paused')return;
   const country=nations.find(r=>r.country_code===p.country);
   const parts=[row?'World #'+row.rank:'Outside the displayed top 100'];
   if(country)parts.push((this.C.countryName?.(p.country)||p.country)+' #'+country.rank);
   this.$('rankSummary').textContent='This week · '+parts.join(' · ');this.$('rankSummary').hidden=false;
   const next=row?players.filter(r=>Number(r.score)>Number(row.score)).sort((a,b)=>a.score-b.score)[0]:null;
   if(next){this.$('nextTarget').textContent='Next score to beat: '+number(next.score)+' · '+number(next.score-row.score+1)+' points above your best.';this.$('nextTarget').hidden=false;}
  }catch{if(id===this.serial){this.$('officialBest').textContent='Unavailable';if(showResult){this.$('rankSummary').hidden=false;this.$('rankSummary').textContent='Score saved. Rankings are temporarily unavailable.';}}}
 }
 inputAllowed(target){return target===this.$('game')||target===document.body||target===document.documentElement;}
}
root.GameSessionUI=SessionUI;
})(globalThis);
