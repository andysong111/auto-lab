/* Factory-owned adapter for the owner-approved continuous Halo Guard mechanic. */
(function(root){'use strict';
const VERSION='radialkit-1',TAU=Math.PI*2;
const halo=root.HaloGuardCore||(typeof require==='function'?require('../../lab/taste-calibration/halo-guard-core.js'):null);
if(!halo)throw Error('halo_guard_core_missing');
const normalize=angle=>((angle%TAU)+TAU)%TAU;
const pointerAngle=point=>Math.atan2(.5-point.y,point.x-.5);

function create({id='halo-guard-v1',duration=40,fast_phases=false}={}){
  if(id!=='halo-guard-v1')throw Error('unknown_radial_core');
  return Object.freeze({
    create(seed){const state=halo.create(seed,{duration,fast_phases});state.meaningfulActions=0;state.lastInputAngle=state.targetAngle;return state;},
    begin(state){return halo.begin(state);},
    step(state,input={}){
      let target=null;
      if(input.pointer&&Number.isFinite(input.pointer.x)&&Number.isFinite(input.pointer.y))target=pointerAngle(input.pointer);
      else if(input.actions?.guard_left===true)target=state.targetAngle+.36;
      else if(input.actions?.guard_right===true)target=state.targetAngle-.36;
      else if(Number(input.x)<0)target=state.targetAngle+.045;
      else if(Number(input.x)>0)target=state.targetAngle-.045;
      if(target!==null){
        target=normalize(target);
        if(halo.angleDistance(target,state.lastInputAngle)>.01){state.meaningfulActions++;state.lastInputAngle=target;}
        halo.setTarget(state,target);
      }
      halo.step(state,1/60);
      return state;
    },
    observe(state){
      const observed=halo.observe(state),target=Math.round(normalize(state.targetAngle)*1000)/1000;
      // The reversible key represents accepted player intent, not per-frame easing.
      // Using the current shield angle continuously retriggered feedback and made a
      // real transition look permanently active to Product QA.
      return {...observed,quality:{stage:observed.phase,complexity:observed.phase+1,objective_progress:observed.progress,meaningful_actions:state.meaningfulActions,reversible_state_key:[observed.phase,observed.progress,observed.lives,observed.barrier,target].join(':')}};
    },
    terminal:halo.terminal
  });
}
const api=Object.freeze({VERSION,create,pointerAngle});root.PlayJoltRadialKit=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
