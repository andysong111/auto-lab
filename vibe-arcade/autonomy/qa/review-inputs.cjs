'use strict';
// Trusted opt-in diagnostic pilot: snapshots are read only; all actions are real input events.
const assert=require('node:assert/strict');
function routePlan(state){
 let best=null;
 function visit(x,row,steps,cost){
  if(x===4){if(row===state.target&&(!best||cost<best.cost))best={steps,cost};return;}
  for(const outlet of [-1,0,1]){
   const next=row+outlet;if(next<0||next>2)continue;
   const turns=(outlet-state.board[row*4+x].outlet+3)%3;
   visit(x+1,next,[...steps,{x,y:row,turns}],cost+turns);
  }
 }
 visit(0,1,[],0);assert(best,'no solution from visible canonical board');return best.steps;
}
async function reviewPrism({page,context,mobile,capture}){
 const snap=()=>page.evaluate(()=>GameDiagnostics.snapshot());
 const key=async k=>{await page.keyboard.down(k);await page.clock.runFor(40);await page.keyboard.up(k);await page.clock.runFor(40);};
 const cdp=mobile?await context.newCDPSession(page):null;const checkpoints=[];let actions=0;
 try{
  for(let round=0;round<5;round++){
   const before=await snap();if(before.phase==='finished'||before.state.circuits>=3)break;
   const board=before.state.boardNumber;
   for(const step of routePlan(before.state)){
    for(let n=0;n<step.turns;n++){
     const current=await snap();if(current.state.boardNumber!==board)break;
     if(mobile){
      const b=await page.locator('[data-game-canvas]').boundingBox();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*(0.08+(step.x+0.5)*0.84/4),y:b.y+b.height*(0.23+(step.y+0.5)*0.52/3)}]});
      await page.clock.runFor(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(60);
     }else{
      const cursor=current.state.cursor;
      for(let i=0;i<Math.abs(step.x-cursor.x);i++)await key(step.x>cursor.x?'ArrowRight':'ArrowLeft');
      for(let i=0;i<Math.abs(step.y-cursor.y);i++)await key(step.y>cursor.y?'ArrowDown':'ArrowUp');
      await key('Space');
     }
     actions++;
    }
    if((await snap()).state.boardNumber!==board)break;
   }
   await page.clock.runFor(800);const after=await snap();
   assert(after.state.circuits>before.state.circuits,'normal inputs did not charge a circuit');
   assert(after.score>before.score,'charging did not increase score');
   checkpoints.push({tick:after.tick,circuits:after.state.circuits,score:after.score,rotations:after.state.rotations});
   if(checkpoints.length===1)await capture('charged');
  }
  assert((await snap()).state.circuits>=3,'success objective unreachable with normal controls');
  for(let i=0;i<100&&(await snap()).phase!=='finished';i++)await page.clock.runFor(500);
  const result=await snap();assert.equal(result.phase,'finished');assert(result.state.circuits>=3&&result.score>0);assert.equal(result.tick,2700);
  await capture('success');
  return {passed:true,input_method:mobile?'CDP touch down/up':'keyboard arrows/Space',state_injection:false,actions,checkpoints,terminal:{tick:result.tick,score:result.score,circuits:result.state.circuits,best:result.best},interpretation:'Automated reachability evidence, not human difficulty or fun validation.'};
 }finally{if(cdp)await cdp.detach();}
}
module.exports={reviewPrism,routePlan};
