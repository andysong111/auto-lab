'use strict';

function normalize(value){
  const n=Number(value);
  if(!Number.isInteger(n)||n<0)throw Error('invalid_success_count');
  return n;
}
function dailyCap(successfulFullyAutonomous){
  const n=normalize(successfulFullyAutonomous);
  if(n>=3)return 6;
  if(n>=1)return 3;
  return 1;
}
function stage(successfulFullyAutonomous){
  const n=normalize(successfulFullyAutonomous);
  return n>=3?'stable-6':n>=1?'proven-3':'pilot-1';
}
if(require.main===module){
  const [cmd,value]=process.argv.slice(2);
  try{
    if(cmd!=='cap'&&cmd!=='status')throw Error('usage: ramp-policy.cjs cap|status SUCCESS_COUNT');
    const successes=normalize(value),cap=dailyCap(successes);
    if(cmd==='cap')process.stdout.write(String(cap)+'\n');
    else process.stdout.write(JSON.stringify({successful_fully_autonomous:successes,stage:stage(successes),daily_cap:cap})+'\n');
  }catch(e){console.error(e.message);process.exit(2);}
}
module.exports={dailyCap,stage};
