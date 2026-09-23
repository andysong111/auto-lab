(async()=>{'use strict';
 const {variant}=await(await fetch('fixture.json')).json(),metadata=await(await fetch('manifest.json')).json();
 const defects=variant==='MULTI_COMMERCIAL_BAD'?['BAD_INVISIBLE_TOPOLOGY','BAD_TELEPORT','BAD_FLAT_PROGRESSION','BAD_RESULT','BAD_HIERARCHY','BAD_AUDIO','BAD_MOBILE_DENSITY']:[variant];
 if(defects.includes('BAD_MOBILE_DENSITY')){const e=document.querySelector('.density');e.hidden=false;e.textContent='Decoration crowds essential information. '.repeat(28);}
 let audio=null,muted=false;const sources=new Set();
 function tone(kind){if(!audio||muted||audio.state!=='running')return;const n=defects.includes('BAD_AUDIO')?10:1;for(let i=0;i<n;i++){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value={primary:330,progress:550,success:740,failure:180}[kind]||330;g.gain.value=.06;o.connect(g).connect(audio.destination);sources.add(o);o.onended=()=>{sources.delete(o);o.disconnect();g.disconnect();};o.start();if(!defects.includes('BAD_AUDIO'))o.stop(audio.currentTime+.18);}}
 function cleanup(){for(const o of sources){try{o.stop();}catch{}}sources.clear();if(audio&&audio.state!=='closed')audio.suspend();}
 document.querySelector('[data-game-start]').addEventListener('click',()=>{audio??=new AudioContext();audio.resume();});
 document.querySelector('[data-game-pause]').addEventListener('click',()=>{if(!defects.includes('BAD_AUDIO'))cleanup();});
 document.querySelector('[data-game-resume]').addEventListener('click',()=>audio?.resume());
 document.querySelector('[data-game-restart]').addEventListener('click',()=>audio?.resume());
 document.querySelector('[data-mute]').addEventListener('click',e=>{muted=!muted;e.currentTarget.textContent=muted?'Sound off':'Sound on';e.currentTarget.setAttribute('aria-pressed',String(muted));if(muted&&!defects.includes('BAD_AUDIO'))cleanup();else audio?.resume();});
 addEventListener('pagehide',()=>{if(!defects.includes('BAD_AUDIO')){cleanup();audio?.close();}});
 const media=matchMedia('(prefers-reduced-motion: reduce)'),presentation={reduced_motion:media.matches,feedback_active:false,static_feedback:false};media.addEventListener('change',()=>{presentation.reduced_motion=media.matches;});
 PlayJoltGameKit.create({core:ProductFixtureCore,canvas:document.querySelector('canvas'),metadata,presentation:()=>presentation,draw:CommercialFixtureArt(presentation,defects,tone)});
})();
