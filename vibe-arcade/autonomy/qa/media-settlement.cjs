'use strict';
// Browser media events are native; advancing mocked timers alone is not their delivery barrier.
async function settle({read,advance,delay=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,timeoutMs=800,matches}){
 const began=now(),initial=await read();let last=initial,polls=0;
 while(!matches(last)&&now()-began<timeoutMs&&polls<40){await delay(20);await advance(20);last=await read();polls++;}
 if(!matches(last))throw Error('media preference/presentation did not settle within bounded native delivery wait: '+JSON.stringify(last));
 return {initial,settled:last,polls,wall_ms:now()-began};
}
async function setReducedMotionAndWait(page,reduced){
 await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.clock.runFor(100);
 return settle({read:()=>page.evaluate(()=>({dom:document.documentElement.dataset.reducedMotion,presentation:globalThis.RibbonPresentation?.snapshot(),native:matchMedia('(prefers-reduced-motion: reduce)').matches})),advance:ms=>page.clock.runFor(ms),matches:s=>s.native===reduced&&s.dom===String(reduced)&&s.presentation?.reducedMotion===reduced&&(!reduced||s.presentation.particles===0)});
}
module.exports={settle,setReducedMotionAndWait};
