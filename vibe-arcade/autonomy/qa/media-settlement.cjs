'use strict';
// Native media-query change events are not guaranteed to settle by advancing Playwright's mocked clock alone.
// Use a short wall-clock wait plus simulated-clock advancement, and remain fail-closed if presentation never converges.
async function settle({read,advance=async()=>{},delay=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,timeoutMs=800,matches}) {
  if(typeof read!=='function'||typeof matches!=='function')throw Error('invalid_media_settlement_probe');
  const began=now();let last=await read(),polls=0;
  while(!matches(last)&&now()-began<timeoutMs&&polls<40){
    await delay(20);await advance(20);last=await read();polls++;
  }
  if(!matches(last))throw Error('media preference/presentation did not settle within bounded native delivery wait: '+JSON.stringify(last));
  return {settled:last,polls,wall_ms:Math.max(0,now()-began)};
}
module.exports={settle};
