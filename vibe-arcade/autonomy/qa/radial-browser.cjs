'use strict';

const radial=require('./radial-model.cjs');

function browserSession(value){
  const page=value.p||value.page,ctx=value.ctx,advance=value.advance||((ms)=>page.clock.runFor(ms));
  if(!page||!ctx)throw Error('radial_browser_session');
  return {page,ctx,advance};
}

function createDriver(contract,model,expect){
  if(contract.interaction?.mode!==radial.MODE||model.interaction_mode!==radial.MODE)throw Error('radial_browser_contract');
  const interaction=contract.interaction;
  async function drive(value,{outcome='success',inputMode='touch',untilTick=null,onProgress=null}={}){
    const {page,ctx,advance}=browserSession(value);let held=null,cdp=null,touching=false,lastProgress=null,iterations=0;
    const canvas=await page.locator(contract.mobile.canvas_selector).boundingBox();expect(!!canvas,'visible radial playfield',canvas);
    if(inputMode==='touch')cdp=await ctx.newCDPSession(page);
    async function release(){
      if(held){await page.keyboard.up(held);held=null;}
      if(cdp){if(touching)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();cdp=null;touching=false;}
    }
    try{
      while(iterations++<Math.ceil(interaction.max_ticks*1000/60/interaction.input_interval_ms)+20){
        const snapshot=await page.evaluate(()=>GameDiagnostics.snapshot());
        if(snapshot.phase==='finished'||snapshot.phase==='error'||(untilTick!==null&&snapshot.tick>=untilTick)){await release();return snapshot;}
        const target=radial.chooseTarget(snapshot,outcome,contract);
        if(inputMode==='touch'){
          if(target!==null){const point=radial.pointFor(target,interaction.pointer_radius),touch={x:canvas.x+canvas.width*point.x,y:canvas.y+canvas.height*point.y};
            await cdp.send('Input.dispatchTouchEvent',{type:touching?'touchMove':'touchStart',touchPoints:[touch]});touching=true;}
        }else{
          const current=snapshot.state?.targetAngle;let desired=null;
          if(target!==null&&Number.isFinite(current)){const delta=radial.signedAngle(target,current);if(Math.abs(delta)>.1)desired=delta>0?'ArrowLeft':'ArrowRight';}
          if(held!==desired){if(held)await page.keyboard.up(held);held=desired;if(held)await page.keyboard.down(held);}
        }
        await advance(interaction.input_interval_ms);
        const after=await page.evaluate(()=>GameDiagnostics.snapshot()),progress=radial.at(after,contract.progress.state_path);
        if(progress!==lastProgress){lastProgress=progress;if(onProgress)await onProgress(after);}
      }
      throw Error('radial_browser_nonterminal');
    }finally{await release();}
  }
  async function reach(value,node,inputMode='touch'){
    const anchor=model.anchors?.[node];expect(!!anchor,'reviewed radial anchor',node);return drive(value,{outcome:'success',inputMode,untilTick:anchor.tick});
  }
  function expected(seed,inputMode,outcome){return model.seeds[String(seed)]?.[inputMode==='touch'?'pointer':'keyboard']?.[outcome];}
  function terminal(value){return radial.terminalSnapshot({outcome:radial.at(value,contract.completion.state_path),reason:value.state?.reason,tick:value.tick,phase:value.state?.phase,score:value.score,progress:value.progress,best_combo:value.state?.bestCombo,lives:value.state?.lives,barrier:value.state?.barrier});}
  return {drive,reach,expected,terminal};
}

module.exports={createDriver};
