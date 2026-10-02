(async()=>{'use strict';
 const {variant}=await(await fetch('fixture.json')).json(),metadata=await(await fetch('manifest.json')).json();
 const defects=variant==='MULTI_COMMERCIAL_BAD'?['BAD_INVISIBLE_TOPOLOGY','BAD_TELEPORT','BAD_FLAT_PROGRESSION','BAD_RESULT','BAD_HIERARCHY','BAD_AUDIO','BAD_MOBILE_DENSITY']:[variant];
 if(defects.includes('BAD_MOBILE_DENSITY')){const e=document.querySelector('.density');e.hidden=false;e.textContent='Decoration crowds essential information. '.repeat(28);}
 const badAudio=defects.includes('BAD_AUDIO');let audio=null,muted=false;const sources=new Set();
 function tone(kind){if(!badAudio||!audio||muted||audio.state!=='running')return;for(let i=0;i<10;i++){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value={primary:330,progress:550,success:740,failure:180}[kind]||330;g.gain.value=.06;o.connect(g).connect(audio.destination);sources.add(o);o.onended=()=>{sources.delete(o);o.disconnect();g.disconnect();};o.start();}}
 function cleanup(){for(const o of sources){try{o.stop();}catch{}}sources.clear();if(audio&&audio.state!=='closed')audio.suspend();}
 document.querySelector('[data-game-start]').addEventListener('click',()=>{if(badAudio){audio??=new AudioContext();audio.resume();}});
 document.querySelector('[data-game-pause]').addEventListener('click',()=>{if(!badAudio)cleanup();});
 document.querySelector('[data-game-resume]').addEventListener('click',()=>{if(badAudio)audio?.resume();});
 document.querySelector('[data-game-restart]').addEventListener('click',()=>{if(badAudio)audio?.resume();});
 document.querySelector('[data-mute]').addEventListener('click',()=>{if(badAudio){muted=!muted;if(muted)cleanup();else audio?.resume();}});
 addEventListener('pagehide',()=>{if(!badAudio){cleanup();audio?.close();}});
 const media=matchMedia('(prefers-reduced-motion: reduce)'),presentation={reduced_motion:media.matches,feedback_active:false,static_feedback:false};media.addEventListener('change',()=>{presentation.reduced_motion=media.matches;});
 PlayJoltGameKit.create({core:ProductFixtureCore,canvas:document.querySelector('canvas'),metadata,presentation:()=>presentation,draw:CommercialFixtureArt(presentation,defects,tone)});
})();
