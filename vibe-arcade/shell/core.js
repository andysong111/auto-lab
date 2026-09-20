/* LoopJolt Game Shell v1 — DOM presentation only.
 * Mounts existing markup; no fetch, storage, credential, Phaser or rules dependency.
 * Game-specific copy/metrics belong to the adapter. Runtime owns save authority.
 */
(function(root){
'use strict';
const mounts=new WeakMap();
const ACTIONS=['practice','ranked','pause','resume','replay','retry','sound','motion'];
const REQUIRED=['entry','paused','result','practice','ranked','replay','dismiss'];
const scalar=v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v);
function create({host,slots,fields={},meters={},labels={},classes={},onAction=()=>{}}){
 if(!host?.querySelector||mounts.has(host))throw Error('shell_invalid_or_duplicate_mount');
 const doc=host.ownerDocument||host,resolve=(selector,name)=>{
  const el=typeof selector==='string'?host.querySelector(selector):null;
  if(!el)throw Error('shell_missing_slot:'+name);return el;
 };
 const nodes=Object.fromEntries(Object.entries(slots||{}).map(([k,s])=>[k,resolve(s,k)]));
 for(const k of REQUIRED)if(!nodes[k])throw Error('shell_missing_slot:'+k);
 if(typeof nodes.result.showModal!=='function'||typeof nodes.result.close!=='function')throw Error('shell_requires_dialog');
 const texts=Object.fromEntries(Object.entries(fields).map(([k,s])=>[k,resolve(s,k)]));
 const bars=Object.fromEntries(Object.entries(meters).map(([k,m])=>[k,{fill:resolve(m.fill,k),aria:m.aria?resolve(m.aria,k):null}]));
 const listeners=[];let destroyed=false,screen='entry';
 const defaults={practice:'Play practice',ranked:'Play ranked',signIn:'Sign in to compete',pause:'Ⅱ',resume:'▶',soundOn:'Sound on',soundOff:'Sound off'};
 const copy={...defaults,...labels},saveClass=classes.save||'save';
 const check=()=>{if(destroyed)throw Error('shell_destroyed');};
 const nodeText=(el,value)=>{if(!scalar(value))throw Error('shell_invalid_text');if(el)el.textContent=String(value);};
 const set=(role,value)=>nodeText(nodes[role],value);
 const hide=(role,value)=>{if(nodes[role])nodes[role].hidden=value;};
 const disabled=(role,value)=>{if(nodes[role])nodes[role].disabled=!!value;};
 const listen=(el,type,fn)=>{if(el){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));}};
 function text(values){check();for(const [name,value] of Object.entries(values)){if(!texts[name])throw Error('shell_unknown_field:'+name);nodeText(texts[name],value);}}
 function controls({ready,busy,eligible,capture,hasPlayer,playing,sound,reduced,entryNote}){
  check();disabled('practice',!ready||busy);set('practice',copy.practice);
  disabled('ranked',!ready||busy||!eligible||capture);set('ranked',hasPlayer?copy.ranked:copy.signIn);
  if(entryNote!==undefined)set('entryNote',entryNote);disabled('pause',!playing);
  if(nodes.sound){nodes.sound.setAttribute('aria-pressed',String(!!sound));set('sound',sound?copy.soundOn:copy.soundOff);}
  nodes.motion?.setAttribute('aria-pressed',String(!!reduced));
 }
 function meter(name,value,max){
  check();if(!bars[name]||!Number.isFinite(value)||!Number.isFinite(max)||max<=0)throw Error('shell_invalid_meter');
  const bounded=Math.max(0,Math.min(max,value));bars[name].fill.style.width=(bounded/max*100)+'%';
  bars[name].aria?.setAttribute('aria-valuenow',String(bounded));
 }
 function actionState(name,{disabled:off,active,className='ready',label}={}){
  check();if(!nodes[name])throw Error('shell_unknown_action:'+name);
  if(off!==undefined)disabled(name,off);if(active!==undefined)nodes[name].classList.toggle(className,!!active);if(label!==undefined)set(name,label);
 }
 function attribute(name,key,value){check();if(!texts[name]||!['aria-label','aria-valuenow','aria-pressed'].includes(key))throw Error('shell_invalid_attribute');if(!scalar(value))throw Error('shell_invalid_text');texts[name].setAttribute(key,String(value));}
 function identity(player,render,{header='Sign in',result='YOUR SCORE'}={}){
  check();for(const [role,fallback] of [['identity',header],['resultIdentity',result]]){
   if(!nodes[role])continue;if(player){if(typeof render!=='function')throw Error('shell_missing_identity_renderer');render(nodes[role],player.country,player.handle);}else set(role,fallback);
  }
 }
 function show(next,{note}={}){
  check();if(!['entry','playing','paused','transition'].includes(next))throw Error('shell_invalid_screen');
  screen=next; // Set BEFORE close(): its queued event must not undo replay/start.
  if(nodes.result.open)nodes.result.close();
  hide('entry',next!=='entry');hide('paused',next!=='paused');
  set('pause',next==='paused'?copy.resume:copy.pause);if(note!==undefined)set('pauseNote',note);
 }
 function dismiss(){
  if(destroyed||screen!=='result')return;
  // Preserve the final HUD/scene under the entry panel, just as before extraction.
  screen='entry';if(nodes.result.open)nodes.result.close();hide('entry',false);hide('paused',true);onAction('dismiss');
 }
 function save({state,message,retryable=false}){
  check();if(!['practice','saving','verified','failed'].includes(state))throw Error('shell_invalid_save_state');
  if(nodes.save){if(state!=='saving')nodes.save.className=saveClass+(state==='verified'?' '+(classes.verified||'ok'):state==='failed'?' '+(classes.failed||'error'):'');set('save',message);}
  hide('retry',!(state==='failed'&&retryable));
 }
 function result({parts,values={},replayLabel,save:initialSave}){
  check();if(!Array.isArray(parts)||parts.some(p=>!p||!scalar(p.text)||p.tag&&p.tag!=='span'))throw Error('shell_invalid_result_parts');
  if(nodes.resultScore)nodes.resultScore.replaceChildren(...parts.map(p=>p.tag?Object.assign(doc.createElement('span'),{textContent:String(p.text)}):doc.createTextNode(String(p.text))));
  text(values);if(replayLabel!==undefined)set('replay',replayLabel);if(nodes.save)nodes.save.className=saveClass;if(initialSave)save(initialSave);
  screen='result';if(!nodes.result.open)nodes.result.showModal();
 }
 function destroy(){if(destroyed)return;destroyed=true;screen='destroyed';listeners.splice(0).forEach(fn=>fn());if(nodes.result.open)nodes.result.close();mounts.delete(host);}
 for(const name of ACTIONS)listen(nodes[name],'click',()=>{
  if(destroyed||nodes[name].disabled||nodes[name].hidden)return;
  if(name==='replay'){
   if(screen!=='result')return;screen='transition';nodes.result.close();
  }
  onAction(name);
 });
 listen(nodes.dismiss,'click',dismiss);
 listen(nodes.result,'cancel',e=>{e.preventDefault();dismiss();});
 listen(nodes.result,'close',()=>{if(!nodes.result.open&&screen==='result')dismiss();});
 const api=Object.freeze({text,controls,meter,actionState,attribute,identity,show,result,save,dismiss,destroy,
  get resultOpen(){return !destroyed&&nodes.result.open;},get screen(){return screen;}});
 mounts.set(host,api);return api;
}
const api=Object.freeze({create});root.LoopJoltGameShell=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
