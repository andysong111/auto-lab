(async function(){'use strict';
const variant=(await (await fetch('fixture.json')).json()).variant;
const manifest=await (await fetch('manifest.json')).json();
const defects=variant==='MULTI_BAD'?['BAD_SCORE','BAD_RESULT','BAD_MOTION','BAD_GOAL','BAD_FEEDBACK']:[variant];
if(defects.includes('BAD_SCORE'))ProductFixtureCore.farming=true;
if(variant==='BAD_DEADTIME')ProductFixtureCore.terminal=s=>s.outcome==='failure'||s.outcome==='success'&&s.tick>=300;
if(defects.includes('BAD_RESULT'))document.body.classList.add('bad-result');
if(defects.includes('BAD_GOAL'))document.querySelector('[data-objective]').hidden=true;
const media=matchMedia('(prefers-reduced-motion: reduce)');
const presentation={reduced_motion:media.matches,feedback_active:false,static_feedback:false};
let timer;
const change=()=>{if(defects.includes('BAD_MOTION')||variant==='PERMANENT_MEDIA_BAD')return;
 if(variant==='DELAYED_MEDIA_GOOD'){clearTimeout(timer);timer=setTimeout(()=>{presentation.reduced_motion=media.matches;},75);}
 else presentation.reduced_motion=media.matches;};
media.addEventListener('change',change);
addEventListener('pagehide',()=>{clearTimeout(timer);media.removeEventListener('change',change);},{once:true});
PlayJoltGameKit.create({core:ProductFixtureCore,canvas:document.querySelector('canvas'),metadata:{game_id:manifest.game_id,version:manifest.version},presentation:()=>presentation,draw:ProductFixtureArt(presentation,defects)});
})();
