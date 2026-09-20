/* Core Pins presentation adapter. Optional controls, never rules or transport. */
(function(root){'use strict';
function create(onAction){
 const host=document.body,$=s=>host.querySelector(s),doc=host.ownerDocument;
 host.classList.add('pins-active');$('.game-actions').classList.add('pins-entry');
 const make=(tag,attrs,text)=>{const n=doc.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
 const paused=make('div',{id:'pinsPaused',class:'pins-paused',hidden:''}),panel=make('div',{class:'result-card'});
 panel.append(make('h2',{},'Paused'),make('p',{id:'pinsPauseNote'},'Paused runs stay in practice.'),make('button',{id:'pinsResume',type:'button',class:'game-btn primary'},'Resume'));paused.append(panel);$('#phaser-game').append(paused);
 const toolbar=make('div',{class:'pins-toolbar'});for(const [id,label] of [['pinsPause','Pause'],['pinsSound','Sound on'],['pinsMotion','Less motion']])toolbar.append(make('button',{id,type:'button',class:'game-btn'},label));$('.play-frame').append(toolbar);
 const retry=make('button',{id:'pinsRetry',type:'button',class:'game-btn pins-retry',hidden:''},'Retry save');$('.result-actions').before(retry);
 const identity=make('div',{id:'pinsResultIdentity',class:'pins-identity'});$('#resultTag').before(identity);
 $('#rankings').href=$('#resultRankings').href='/community/?game=core-pins&scope=world';$('#identity').href='/community/?panel=profile&returnTo=%2Fchallengers%2Fplay%3Fgame%3Dcore-pins';
 const shell=LoopJoltGameShell.create({host,slots:{entry:'.game-actions',paused:'#pinsPaused',result:'#resultDialog',practice:'#primary',ranked:'#ranked',replay:'#again',dismiss:'#closeResult',identity:'#identity',resultIdentity:'#pinsResultIdentity',pause:'#pinsPause',resume:'#pinsResume',pauseNote:'#pinsPauseNote',sound:'#pinsSound',motion:'#pinsMotion',save:'#saveState',retry:'#pinsRetry',resultScore:'#resultScore'},fields:{title:'#title',tag:'#tagline',instructions:'#instructions',healthLabel:'#healthLabel',score:'#score',time:'#time',combo:'#combo',health:'#health',best:'#best',status:'#status',meta:'#resultMeta',standing:'#rankState'},labels:{practice:'PLAY PRACTICE',ranked:'PLAY RANKED',signIn:'SIGN IN TO RANK',pause:'Pause',resume:'Resume'},classes:{save:'save-state',failed:'bad'},onAction});
 shell.text({title:'Core Pins',tag:'One tap. One clean angle.',healthLabel:'SHIELDS',instructions:'Tap or press Space to fire a pin into the rotating core. Never hit a pin or red seal already on the core. Clear each ring and survive the boss stages.'});document.title='Core Pins — LoopJolt';
 return Object.freeze({controls:m=>shell.controls(m),status:s=>shell.text({status:s}),identity:(p,render)=>shell.identity(p,render,{result:'YOUR RUN'}),
  hud:(s,best)=>shell.text({score:s.score.toLocaleString(),time:Math.max(0,(3600-s.tick)/60).toFixed(1),combo:s.combo,health:s.health,best:best.toLocaleString()}),
  show:(...a)=>shell.show(...a),save:m=>shell.save(m),standing:s=>shell.text({standing:s}),
  result:(s,ranked)=>shell.result({parts:[{text:s.score.toLocaleString()+' pts'}],values:{meta:'Stage '+s.stage+' · '+s.hits+' clean pins',standing:''},replayLabel:ranked?'PLAY RANKED AGAIN':'PLAY AGAIN',save:{state:ranked?'saving':'practice',message:ranked?'Verifying this run…':'Practice best saved on this device.'}}),
  get resultOpen(){return shell.resultOpen;},get screen(){return shell.screen;},destroy:()=>{shell.destroy();paused.remove();toolbar.remove();retry.remove();identity.remove();host.classList.remove('pins-active');}});
}
root.CorePinsShell=Object.freeze({create});
})(globalThis);
