'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {hash,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {validateProposal}=require('../commissioning/spec-gate.cjs');
const product=require('../qa/product-contract.cjs'),commercial=require('../qa/commercial/contract.cjs');
const {Factory}=require('../orchestrator/engine.cjs'),{FileStore}=require('../orchestrator/store.cjs');
const {AutonomousWorker}=require('../worker/runtime.cjs'),{DockerQA}=require('../isolation/docker-qa.cjs'),{OpenAIProvider}=require('../providers/openai.cjs');
const {continuePreview,writeReleasePacket}=require('../commissioning/rc-continuation.cjs');
const reflexKit=require('../gamekit/reflexkit.js');
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/,SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEARNING_FOCUS=new Set(['input-parity','lifecycle-integrity','difficulty-progression','progress-readability','result-presentation','action-feedback','reduced-motion','mobile-hierarchy','state-distinction']);
const FAMILY_IDS=new Set(['kinetic-balance','pressure-allocation','signal-composition','trajectory-interception','echo-routing','cadence-buffering','flux-harvesting','aperture-shaping','phase-coupling','gradient-compression','comet-catching','threat-parry','rift-threading','constellation-weaving','orbit-docking','thermal-venting']);
const THREAT_PARRY_CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'threat-parry-v1'});\n";
const RIFT_THREAD_CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'rift-thread-v1'});\n";
const CONSTELLATION_WEAVE_CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'constellation-weave-v1'});\n";
const ORBIT_DOCK_CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'orbit-dock-v1'});\n";
const THERMAL_VENT_CORE_SOURCE="globalThis.GameCore = globalThis.PlayJoltReflexKit.create({id:'thermal-vent-v1'});\n";
function fail(code){const e=new Error(code);e.code='foundry_blueprint_invalid';throw e;}
function key(values){return values.join(':');}
function region(x,y,width,height){return {selector:'[data-game-canvas]',x,y,width,height};}
function anchor(node,r){return {node,region:r};}
function cleanText(value,min=2,max=48){if(typeof value!=='string'||value.length<min||value.length>max||!/^[A-Za-z][A-Za-z0-9 -]*$/.test(value))fail('theme_text');return value;}
function validateBlueprint(bp){
  if(!bp||bp.schema!=='playjolt-foundry-blueprint/1'||!ID.test(bp.game_id||'')||!SLUG.test(bp.slug||''))fail('identity');
  cleanText(bp.title,3,64);
  if(!FAMILY_IDS.has(bp.family_id)||!SLUG.test(bp.design_id||''))fail('family');
  if(!['original','market-benchmark'].includes(bp.lane)||!Array.isArray(bp.seeds)||bp.seeds.length!==6||new Set(bp.seeds).size!==6||bp.seeds.some(seed=>!Number.isInteger(seed)||seed<1||seed>999999))fail('lineage');
  if(!bp.foundry||bp.foundry.schema!=='playjolt-foundry-lineage/1'||bp.foundry.design_id!==bp.design_id||bp.foundry.family_id!==bp.family_id||bp.foundry.lane!==bp.lane)fail('foundry_lineage');
  if(!Array.isArray(bp.learning_focus)||bp.learning_focus.length>4||new Set(bp.learning_focus).size!==bp.learning_focus.length||bp.learning_focus.some(x=>!LEARNING_FOCUS.has(x))||JSON.stringify(bp.foundry.learning_focus)!==JSON.stringify(bp.learning_focus))fail('learning_focus');
  if(typeof bp.novelty_contract!=='string'||bp.novelty_contract.length<40||bp.novelty_contract.length>500)fail('novelty_contract');
  if(bp.lane==='market-benchmark'&&(!SLUG.test(bp.benchmark?.id||'')||typeof bp.benchmark?.url!=='string'||!bp.benchmark.url.startsWith('https://play.google.com/')||!Array.isArray(bp.benchmark.transferable_principles)||bp.benchmark.transferable_principles.length<2||!Array.isArray(bp.copy_policy?.forbidden)||bp.copy_policy.forbidden.length<4))fail('benchmark');
  if(bp.lane==='original'&&bp.benchmark)fail('original_benchmark');
  const t=bp.theme||{};for(const k of ['singular','plural','arena','progress','success','failure'])cleanText(t[k],k==='singular'?2:3,k==='progress'?16:48);
  return bp;
}
function balanceAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(stage=>((seed+stage)%3)-1||1)];
  const initial=[1,0,targets[1],0,'playing'];
  function edges(v){
    const [stage,balance,target,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[];
    if(balance>-2)out.push({action:'weight_left',values:[stage,balance-1,target,completed,outcome]});
    if(balance<2)out.push({action:'weight_right',values:[stage,balance+1,target,completed,outcome]});
    if(balance===target){
      if(stage===3)out.push({action:'hold',values:[4,balance,target,3,'success']});
      else out.push({action:'hold',values:[stage+1,0,targets[stage+1],completed+1,'playing']});
    }
    return out;
  }
  return {projection:['state.stage','state.balance','state.target','state.completed','state.outcome'],initial,edges,
    firstAction:'weight_right',commitAction:'hold',reversibleProbe:['weight_right','weight_left'],statePath:'state.balance',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function allocationAdapter(bp,seed){
  const demands=[null,...[1,2,3].map(round=>({north:1+((seed+round)%2),south:1+((seed+round+1)%2)}))];
  const initial=[1,0,0,demands[1].north,demands[1].south,0,'playing'];
  function edges(v){
    const [round,north,south,needNorth,needSouth,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[];
    if(north<3)out.push({action:'feed_north',values:[round,north+1,south,needNorth,needSouth,completed,outcome]});
    if(south<3)out.push({action:'feed_south',values:[round,north,south+1,needNorth,needSouth,completed,outcome]});
    if(north>0&&south>0)out.push({action:'equalize',values:[round,north-1,south-1,needNorth,needSouth,completed,outcome]});
    if(north===needNorth&&south===needSouth){
      if(round===3)out.push({action:'seal',values:[4,north,south,needNorth,needSouth,3,'success']});
      else {const next=demands[round+1];out.push({action:'seal',values:[round+1,0,0,next.north,next.south,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.round','state.north','state.south','state.needNorth','state.needSouth','state.completed','state.outcome'],initial,edges,
    firstAction:'feed_north',commitAction:'seal',reversibleProbe:['feed_north','feed_south','equalize'],statePath:'state.north',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function signalAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(phrase=>({a:1+((seed+phrase)%2),b:(seed+phrase*2)%3}))];
  const initial=[1,0,0,targets[1].a,targets[1].b,0,'playing'];
  function edges(v){
    const [phrase,a,b,targetA,targetB,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[
      {action:'pulse_a',values:[phrase,(a+1)%3,b,targetA,targetB,completed,outcome]},
      {action:'pulse_b',values:[phrase,a,(b+1)%3,targetA,targetB,completed,outcome]}
    ];
    const invertedA=(3-a)%3,invertedB=(3-b)%3;
    if(invertedA!==a||invertedB!==b)out.push({action:'invert',values:[phrase,invertedA,invertedB,targetA,targetB,completed,outcome]});
    if(a===targetA&&b===targetB){
      if(phrase===3)out.push({action:'lock_phrase',values:[4,a,b,targetA,targetB,3,'success']});
      else {const next=targets[phrase+1];out.push({action:'lock_phrase',values:[phrase+1,0,0,next.a,next.b,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.phrase','state.channelA','state.channelB','state.targetA','state.targetB','state.completed','state.outcome'],initial,edges,
    firstAction:'pulse_a',commitAction:'lock_phrase',reversibleProbe:['pulse_a','pulse_a','pulse_a'],statePath:'state.channelA',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function interceptionAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(wave=>({gate:1+((seed+wave)%2),timing:(Math.floor(seed/3)+wave)%2}))];
  const initial=[1,0,0,targets[1].gate,targets[1].timing,0,'playing'];
  function edges(v){
    const [wave,gate,timing,targetGate,targetTiming,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[
      {action:'shift_left',values:[wave,(gate+2)%3,timing,targetGate,targetTiming,completed,outcome]},
      {action:'shift_right',values:[wave,(gate+1)%3,timing,targetGate,targetTiming,completed,outcome]},
      {action:'delay',values:[wave,gate,1-timing,targetGate,targetTiming,completed,outcome]}
    ];
    if(gate===targetGate&&timing===targetTiming){
      if(wave===3)out.push({action:'intercept',values:[4,gate,timing,targetGate,targetTiming,3,'success']});
      else {const next=targets[wave+1];out.push({action:'intercept',values:[wave+1,0,0,next.gate,next.timing,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.wave','state.gate','state.timing','state.targetGate','state.targetTiming','state.completed','state.outcome'],initial,edges,
    firstAction:'shift_right',commitAction:'intercept',reversibleProbe:['shift_right','shift_left'],statePath:'state.gate',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function routingAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(stage=>1+((seed+stage*3)%7))];
  const initial=[1,0,0,targets[1],0,'playing'];
  function edges(v){
    const [stage,cursor,mask,targetMask,completed,outcome]=v;if(outcome!=='playing')return [];
    const mirrored=((mask&1)<<2)|(mask&2)|((mask&4)>>2);
    const out=[
      {action:'next_switch',values:[stage,(cursor+1)%3,mask,targetMask,completed,outcome]},
      {action:'toggle_switch',values:[stage,cursor,mask^(1<<cursor),targetMask,completed,outcome]},
      {action:'mirror_route',values:[stage,cursor,mirrored,targetMask,completed,outcome]}
    ];
    if(mask===targetMask){
      if(stage===3)out.push({action:'route_echo',values:[4,cursor,mask,targetMask,3,'success']});
      else out.push({action:'route_echo',values:[stage+1,0,0,targets[stage+1],completed+1,'playing']});
    }
    return out;
  }
  return {projection:['state.stage','state.cursor','state.switchMask','state.targetMask','state.completed','state.outcome'],initial,edges,
    firstAction:'next_switch',commitAction:'route_echo',reversibleProbe:['next_switch','next_switch','next_switch'],statePath:'state.cursor',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function cadenceAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(bar=>({a:1+((seed+bar)%2),b:1+((seed+bar*2+1)%2),c:1+((seed+bar*3+2)%2)}))];
  const initial=[1,0,0,0,targets[1].a,targets[1].b,targets[1].c,0,'playing'];
  function edges(v){
    const [bar,a,b,c,targetA,targetB,targetC,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[
      {action:'lengthen_lead',values:[bar,(a+1)%3,b,c,targetA,targetB,targetC,completed,outcome]},
      {action:'rotate_buffer',values:[bar,b,c,a,targetA,targetB,targetC,completed,outcome]},
      {action:'reverse_buffer',values:[bar,c,b,a,targetA,targetB,targetC,completed,outcome]}
    ];
    if(a===targetA&&b===targetB&&c===targetC){
      if(bar===3)out.push({action:'release_bar',values:[4,a,b,c,targetA,targetB,targetC,3,'success']});
      else {const next=targets[bar+1];out.push({action:'release_bar',values:[bar+1,0,0,0,next.a,next.b,next.c,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.bar','state.lead','state.middle','state.tail','state.targetLead','state.targetMiddle','state.targetTail','state.completed','state.outcome'],initial,edges,
    firstAction:'lengthen_lead',commitAction:'release_bar',reversibleProbe:['lengthen_lead','lengthen_lead','lengthen_lead'],statePath:'state.lead',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function fluxAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(stage=>({charge:1+((seed+stage)%3),polarity:(Math.floor(seed/5)+stage)%2}))];
  const initial=[1,0,0,targets[1].charge,targets[1].polarity,0,'playing'];
  function edges(v){
    const [stage,charge,polarity,targetCharge,targetPolarity,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[
      {action:'gather_flux',values:[stage,(charge+1)%4,polarity,targetCharge,targetPolarity,completed,outcome]},
      {action:'release_flux',values:[stage,(charge+3)%4,polarity,targetCharge,targetPolarity,completed,outcome]},
      {action:'flip_field',values:[stage,charge,1-polarity,targetCharge,targetPolarity,completed,outcome]}
    ];
    if(charge===targetCharge&&polarity===targetPolarity){
      if(stage===3)out.push({action:'harvest_flux',values:[4,charge,polarity,targetCharge,targetPolarity,3,'success']});
      else {const next=targets[stage+1];out.push({action:'harvest_flux',values:[stage+1,0,0,next.charge,next.polarity,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.stage','state.charge','state.polarity','state.targetCharge','state.targetPolarity','state.completed','state.outcome'],initial,edges,
    firstAction:'gather_flux',commitAction:'harvest_flux',reversibleProbe:['gather_flux','gather_flux','gather_flux','gather_flux'],statePath:'state.charge',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function apertureAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(stage=>({width:1+((seed+stage)%2),focus:(Math.floor(seed/7)+stage)%3}))];
  const initial=[1,0,0,targets[1].width,targets[1].focus,0,'playing'];
  function edges(v){
    const [stage,width,focus,targetWidth,targetFocus,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[
      {action:'widen_aperture',values:[stage,(width+1)%3,focus,targetWidth,targetFocus,completed,outcome]},
      {action:'shift_focus',values:[stage,width,(focus+1)%3,targetWidth,targetFocus,completed,outcome]},
      {action:'invert_lens',values:[stage,2-width,2-focus,targetWidth,targetFocus,completed,outcome]}
    ];
    if(width===targetWidth&&focus===targetFocus){
      if(stage===3)out.push({action:'focus_beam',values:[4,width,focus,targetWidth,targetFocus,3,'success']});
      else {const next=targets[stage+1];out.push({action:'focus_beam',values:[stage+1,0,0,next.width,next.focus,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.stage','state.width','state.focus','state.targetWidth','state.targetFocus','state.completed','state.outcome'],initial,edges,
    firstAction:'widen_aperture',commitAction:'focus_beam',reversibleProbe:['widen_aperture','widen_aperture','widen_aperture'],statePath:'state.width',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function phaseAdapter(bp,seed){
  const startOuter=seed%3,targets=[null,...[1,2,3].map(stage=>({steps:stage*2,inner:(stage*2)%4,outer:(startOuter+stage*2)%3}))];
  const initial=[1,0,0,startOuter,targets[1].steps,targets[1].inner,targets[1].outer,0,'playing'];
  function edges(v){
    const [stage,steps,inner,outer,targetSteps,targetInner,targetOuter,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[],nextSteps=(steps+1)%(targetSteps+1);
    out.push({action:'advance_pair',values:[stage,nextSteps,nextSteps%4,(startOuter+nextSteps)%3,targetSteps,targetInner,targetOuter,completed,outcome]});
    if(stage>=2)out.push({action:'retard_outer',values:[stage,steps,inner,(outer+2)%3,targetSteps,targetInner,targetOuter,completed,outcome]});
    if(stage>=3)out.push({action:'exchange_phase',values:[stage,steps,inner,(outer+1)%3,targetSteps,targetInner,targetOuter,completed,outcome]});
    if(steps===targetSteps&&inner===targetInner&&outer===targetOuter){
      if(stage===3)out.push({action:'couple_orbits',values:[4,steps,inner,outer,targetSteps,targetInner,targetOuter,3,'success']});
      else {const next=targets[stage+1];out.push({action:'couple_orbits',values:[stage+1,0,0,startOuter,next.steps,next.inner,next.outer,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.stage','state.steps','state.innerPhase','state.outerPhase','state.targetSteps','state.targetInner','state.targetOuter','state.completed','state.outcome'],initial,edges,
    firstAction:'advance_pair',commitAction:'couple_orbits',reversibleProbe:['advance_pair','advance_pair','advance_pair'],statePath:'state.innerPhase',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function gradientAdapter(bp,seed){
  const rotate=values=>[values[1],values[2],values[0]],base=[[1,2,3],[2,3,1],[3,1,2]][seed%3];
  const targets=[null,...[1,2,3].map(stage=>{let values=base;for(let index=0;index<stage*2;index++)values=rotate(values);return {moves:stage*2,values};})];
  const initial=[1,0,...base,targets[1].moves,...targets[1].values,0,'playing'];
  function edges(v){
    const [stage,moves,left,middle,right,targetMoves,targetLeft,targetMiddle,targetRight,completed,outcome]=v;if(outcome!=='playing')return [];
    const out=[],nextMoves=(moves+1)%(targetMoves+1);let nextValues=base;for(let index=0;index<nextMoves;index++)nextValues=rotate(nextValues);
    out.push({action:'press_inward',values:[stage,nextMoves,...nextValues,targetMoves,targetLeft,targetMiddle,targetRight,completed,outcome]});
    if(stage>=2)out.push({action:'carry_right',values:[stage,moves,right,left,middle,targetMoves,targetLeft,targetMiddle,targetRight,completed,outcome]});
    if(stage>=3)out.push({action:'release_left',values:[stage,moves,right,middle,left,targetMoves,targetLeft,targetMiddle,targetRight,completed,outcome]});
    if(moves===targetMoves&&left===targetLeft&&middle===targetMiddle&&right===targetRight){
      if(stage===3)out.push({action:'seal_gradient',values:[4,moves,left,middle,right,targetMoves,targetLeft,targetMiddle,targetRight,3,'success']});
      else {const next=targets[stage+1];out.push({action:'seal_gradient',values:[stage+1,0,...base,next.moves,...next.values,completed+1,'playing']});}
    }
    return out;
  }
  return {projection:['state.stage','state.moves','state.left','state.middle','state.right','state.targetMoves','state.targetLeft','state.targetMiddle','state.targetRight','state.completed','state.outcome'],initial,edges,
    firstAction:'press_inward',commitAction:'seal_gradient',reversibleProbe:['press_inward','press_inward','press_inward'],statePath:'state.left',objectiveProgress:'state.completed',complexity:'quality.complexity'};
}
function cometAdapter(bp,seed){
  const targets=[null,...[1,2,3].map(stage=>1+((seed+stage)%(stage+1)))];
  const initial=[1,0,targets[1],0,'playing'];
  function edges(v){
    const [stage,lane,target,completed,outcome]=v;if(outcome!=='playing')return [];
    const lanes=stage+2,out=[];
    const move=(action,distance)=>{
      const next=(lane+distance+lanes)%lanes;
      if(next!==target)return out.push({action,values:[stage,next,target,completed,outcome]});
      if(stage===3)return out.push({action,values:[4,next,target,3,'success']});
      return out.push({action,values:[stage+1,0,targets[stage+1],completed+1,'playing']});
    };
    move('drift_left',-1);move('drift_right',1);
    if(stage>=2)move('burst_shift',2);
    if(stage>=3)move('phase_cut',3);
    return out;
  }
  return {projection:['state.stage','state.lane','state.targetLane','state.completed','state.outcome'],initial,edges,
    firstAction:'drift_right',commitAction:null,reversibleProbe:[],statePath:'state.lane',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true};
}
function threatParryAdapter(bp,seed){
  const plans=reflexKit.plan(seed),codes={parry_left:1,parry_right:2,parry_up:3,parry_down:4};
  const initial=[1,0,codes[plans[1].sequence[0]],0,0,'playing'];
  function edges(v){
    const [stage,index,cue,miss,completed,outcome]=v;if(outcome!=='playing')return [];
    const stagePlan=plans[stage];
    if(miss)return stagePlan.available.map(action=>({action,values:[stage,index,cue,0,completed,outcome]}));
    return stagePlan.available.map(action=>{
      if(codes[action]!==cue)return {action,values:[stage,index,cue,codes[action],completed,outcome]};
      const nextIndex=index+1;
      if(nextIndex>=stagePlan.sequence.length){
        if(stage===3)return {action,values:[4,nextIndex,cue,0,3,'success']};
        return {action,values:[stage+1,0,codes[plans[stage+1].sequence[0]],0,completed+1,'playing']};
      }
      return {action,values:[stage,nextIndex,codes[stagePlan.sequence[nextIndex]],0,completed,outcome]};
    });
  }
  return {projection:['state.stage','state.threatIndex','state.cue','state.miss','state.completed','state.outcome'],initial,edges,
    firstAction:'parry_right',commitAction:null,reversibleProbe:[],statePath:'state.threatIndex',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true,factoryCore:true};
}
function riftThreadAdapter(bp,seed){
  const plans=reflexKit.riftPlan(seed),first=plans[1];
  const initial=[1,0,Math.floor(first.lanes/2),first.openings[0],0,0,'playing'];
  function edges(v){
    const [stage,gateIndex,lane,opening,cleared,completed,outcome]=v;if(outcome!=='playing')return [];
    const stagePlan=plans[stage],out=[];
    if(lane>0)out.push({action:'shift_left',values:[stage,gateIndex,lane-1,opening,cleared,completed,outcome]});
    if(lane<stagePlan.lanes-1)out.push({action:'shift_right',values:[stage,gateIndex,lane+1,opening,cleared,completed,outcome]});
    if(stage>=2&&lane>0)out.push({action:'dash_left',values:[stage,gateIndex,Math.max(0,lane-2),opening,cleared,completed,outcome]});
    if(stage>=3&&lane<stagePlan.lanes-1)out.push({action:'dash_right',values:[stage,gateIndex,Math.min(stagePlan.lanes-1,lane+2),opening,cleared,completed,outcome]});
    if(lane===opening){
      const nextGate=gateIndex+1,nextCleared=cleared+1;
      if(nextGate>=stagePlan.openings.length){
        if(stage===3)out.push({action:'surge',values:[4,nextGate,lane,opening,nextCleared,3,'success']});
        else {const next=plans[stage+1];out.push({action:'surge',values:[stage+1,0,Math.floor(next.lanes/2),next.openings[0],nextCleared,completed+1,'playing']});}
      }else out.push({action:'surge',values:[stage,nextGate,lane,stagePlan.openings[nextGate],nextCleared,completed,outcome]});
    }
    return out;
  }
  return {projection:['state.stage','state.gateIndex','state.lane','state.opening','state.cleared','state.completed','state.outcome'],initial,edges,
    firstAction:'shift_right',commitAction:'surge',reversibleProbe:[],statePath:'state.lane',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true,factoryCore:true};
}
function constellationWeaveAdapter(bp,seed){
  const plans=reflexKit.weavePlan(seed),actions=reflexKit.weaveActions,first=plans[1];
  const initial=[1,0,first.start_mask,0,0,0,'playing'];
  function edges(v){
    const [stage,moves,litMask,usedMask,woven,completed,outcome]=v;if(outcome!=='playing')return [];
    const stagePlan=plans[stage],out=[];
    for(let socket=0;socket<stagePlan.sockets;socket++){
      const nextMoves=moves+1,nextLit=litMask^stagePlan.operations[socket],nextUsed=usedMask^(1<<socket),nextWoven=woven+((usedMask&(1<<socket))?0:1);
      if(nextMoves<stagePlan.move_limit)out.push({action:actions[socket],values:[stage,nextMoves,nextLit,nextUsed,nextWoven,completed,outcome]});
      else if(nextLit===0&&nextUsed===(1<<stagePlan.sockets)-1){
        if(stage===3)out.push({action:actions[socket],values:[4,nextMoves,nextLit,nextUsed,nextWoven,3,'success']});
        else {const next=plans[stage+1];out.push({action:actions[socket],values:[stage+1,0,next.start_mask,0,nextWoven,completed+1,'playing']});}
      }else out.push({action:actions[socket],values:[stage,nextMoves,nextLit,nextUsed,nextWoven,completed,'failure']});
    }
    return out;
  }
  return {projection:['state.stage','state.moves','state.litMask','state.usedMask','state.woven','state.completed','state.outcome'],initial,edges,
    firstAction:'weave_left',commitAction:null,reversibleProbe:[],statePath:'state.litMask',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true,factoryCore:true,weave:true};
}
function orbitDockAdapter(bp,seed){
  const plans=reflexKit.dockPlan(seed),first=plans[1];
  const initial=[1,0,0,first.targets[0],0,0,0,'playing'];
  function edges(v){
    const [stage,gateIndex,position,target,warning,docked,completed,outcome]=v;if(outcome!=='playing')return [];
    const stagePlan=plans[stage],out=[],move=(action,delta)=>out.push({action,values:[stage,gateIndex,(position+delta+stagePlan.slots)%stagePlan.slots,target,0,docked,completed,outcome]});
    move('orbit_left',-1);move('orbit_right',1);
    if(stage>=2)move('charge_pulse',2);
    if(stage>=3)move('slingshot',3);
    if(position!==target)out.push({action:'dock',values:[stage,gateIndex,position,target,warning?1:1,docked,completed,warning?'failure':outcome]});
    else {
      const nextGate=gateIndex+1,nextDocked=docked+1;
      if(nextGate>=stagePlan.gate_count){
        if(stage===3)out.push({action:'dock',values:[4,nextGate,position,target,0,nextDocked,3,'success']});
        else {const next=plans[stage+1];out.push({action:'dock',values:[stage+1,0,0,next.targets[0],0,nextDocked,completed+1,'playing']});}
      }else out.push({action:'dock',values:[stage,nextGate,position,stagePlan.targets[nextGate],0,nextDocked,completed,outcome]});
    }
    return out;
  }
  return {projection:['state.stage','state.gateIndex','state.position','state.target','state.warning','state.docked','state.completed','state.outcome'],initial,edges,
    firstAction:'orbit_right',commitAction:'dock',reversibleProbe:[],failureActions:['dock','dock'],failureWaitMs:1000,statePath:'state.position',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true,factoryCore:true,docking:true};
}
function thermalVentAdapter(bp,seed){
  const plans=reflexKit.ventPlan(seed),first=plans[1];
  const initial=[1,0,1,1,first.hazards[0],0,'ready',0,'playing'];
  function edges(v){
    const [stage,beat,leftHeat,rightHeat,hazard,warning,lastVent,completed,outcome]=v;if(outcome!=='playing')return [];
    const plan=plans[stage],out=[];
    for(const action of plan.available){
      const direct=action==='vent_left'||action==='vent_right',correct=action===(hazard===0?'vent_left':'vent_right');
      const stageMarker=stage===1?'ready':'chamber_stable';
      if(warning){
        if(direct&&!correct)out.push({action,values:[stage,beat,leftHeat,rightHeat,hazard,2,'chamber_overload',completed,'failure']});
        else out.push({action,values:[stage,beat,1,1,hazard,0,stageMarker,completed,outcome]});
        continue;
      }
      if(direct&&!correct){
        const left=hazard===0?4:2,right=hazard===1?4:2;
        out.push({action,values:[stage,beat,left,right,hazard,1,'thermal_warning',completed,outcome]});continue;
      }
      if(!direct){out.push({action,values:[stage,beat,1,1,hazard,0,lastVent===action?stageMarker:action,completed,outcome]});continue;}
      const left=1,right=1,nextBeat=beat+1,nextWarning=0;
      if(nextBeat>=plan.hazards.length){
        if(stage===3)out.push({action,values:[4,nextBeat,left,right,hazard,nextWarning,'thermal_complete',3,'success']});
        else{const next=plans[stage+1];out.push({action,values:[stage+1,0,1,1,next.hazards[0],0,'chamber_stable',completed+1,'playing']});}
      }else out.push({action,values:[stage,nextBeat,left,right,plan.hazards[nextBeat],nextWarning,action,completed,outcome]});
    }
    return out;
  }
  return {projection:['state.stage','state.beat','state.leftHeat','state.rightHeat','state.hazard','state.warning','state.lastVent','state.completed','state.outcome'],initial,edges,
    firstAction:'vent_left',commitAction:null,reversibleProbe:[],failureActions:[],failureWaitMs:7000,statePath:'state.beat',objectiveProgress:'state.completed',complexity:'quality.complexity',direct:true,factoryCore:true,venting:true};
}
function adapter(bp,seed){
  const adapters={'kinetic-balance':balanceAdapter,'pressure-allocation':allocationAdapter,'signal-composition':signalAdapter,'trajectory-interception':interceptionAdapter,'echo-routing':routingAdapter,'cadence-buffering':cadenceAdapter,'flux-harvesting':fluxAdapter,'aperture-shaping':apertureAdapter,'phase-coupling':phaseAdapter,'gradient-compression':gradientAdapter,'comet-catching':cometAdapter,'threat-parry':threatParryAdapter,'rift-threading':riftThreadAdapter,'constellation-weaving':constellationWeaveAdapter,'orbit-docking':orbitDockAdapter,'thermal-venting':thermalVentAdapter};
  return adapters[bp.family_id](bp,seed);
}
function graph(bp,seed){
  const a=adapter(bp,seed),nodes={},queue=[a.initial];
  for(let i=0;i<queue.length;i++){
    const values=queue[i],id=key(values);if(nodes[id])continue;
    const raw=a.edges(values);nodes[id]={values,stage:values[0],...(values.at(-1)==='success'?{success:true}:{}),edges:raw.map(x=>({action:x.action,to:key(x.values)}))};
    for(const edge of raw)if(!nodes[key(edge.values)])queue.push(edge.values);
    if(queue.length>200)fail('state_space_bound');
  }
  return {initial:key(a.initial),nodes};
}
function buildModel(input){const bp=validateBlueprint(input),model={schema_version:1,projection:adapter(bp,bp.seeds[0]).projection,seeds:{}};for(const seed of bp.seeds)model.seeds[String(seed)]=graph(bp,seed);product.validateModel(model);return model;}
function route(model,seed){
  const graph=model.seeds[String(seed)],queue=[[graph.initial,[]]],seen=new Set();
  while(queue.length){const [id,steps]=queue.shift(),node=graph.nodes[id];if(node.success)return {steps,nodes:[graph.initial,...steps.map(x=>x.to)]};if(seen.has(id))continue;seen.add(id);for(const edge of node.edges)queue.push([edge.to,[...steps,edge]]);}
  fail('success_path');
}
function actionMap(bp){
  if(bp.family_id==='kinetic-balance')return {
    weight_left:{key:'ArrowLeft',touch:{x:.28,y:.68},hold_ms:35,settle_ms:35},weight_right:{key:'ArrowRight',touch:{x:.72,y:.55},hold_ms:35,settle_ms:35},hold:{key:'Space',touch:{x:.86,y:.74},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='pressure-allocation')return {feed_north:{key:'ArrowUp',touch:{x:.72,y:.55},hold_ms:35,settle_ms:35},feed_south:{key:'ArrowDown',touch:{x:.28,y:.68},hold_ms:35,settle_ms:35},equalize:{key:'ArrowLeft',touch:{x:.50,y:.76},hold_ms:35,settle_ms:35},seal:{key:'Space',touch:{x:.86,y:.74},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='signal-composition')return {pulse_a:{key:'ArrowLeft',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},pulse_b:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},invert:{key:'ArrowDown',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},lock_phrase:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='trajectory-interception')return {shift_left:{key:'ArrowLeft',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},shift_right:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},delay:{key:'ArrowDown',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},intercept:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='echo-routing')return {next_switch:{key:'ArrowRight',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},toggle_switch:{key:'ArrowUp',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},mirror_route:{key:'ArrowLeft',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},route_echo:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='cadence-buffering')return {lengthen_lead:{key:'ArrowUp',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},rotate_buffer:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},reverse_buffer:{key:'ArrowLeft',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},release_bar:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='flux-harvesting')return {gather_flux:{key:'ArrowUp',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},release_flux:{key:'ArrowDown',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},flip_field:{key:'ArrowRight',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},harvest_flux:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='aperture-shaping')return {widen_aperture:{key:'ArrowUp',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},shift_focus:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},invert_lens:{key:'ArrowLeft',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},focus_beam:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='phase-coupling')return {advance_pair:{key:'ArrowUp',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},retard_outer:{key:'ArrowDown',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},exchange_phase:{key:'ArrowRight',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},couple_orbits:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='comet-catching')return {drift_left:{key:'ArrowLeft',touch:{x:.125,y:.70},hold_ms:35,settle_ms:35},drift_right:{key:'ArrowRight',touch:{x:.375,y:.70},hold_ms:35,settle_ms:35},burst_shift:{key:'ArrowUp',touch:{x:.625,y:.70},hold_ms:35,settle_ms:35},phase_cut:{key:'ArrowDown',touch:{x:.875,y:.70},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='threat-parry')return {parry_left:{key:'ArrowLeft',touch:{x:.125,y:.70},hold_ms:35,settle_ms:35},parry_right:{key:'ArrowRight',touch:{x:.375,y:.70},hold_ms:35,settle_ms:35},parry_up:{key:'ArrowUp',touch:{x:.625,y:.70},hold_ms:35,settle_ms:35},parry_down:{key:'ArrowDown',touch:{x:.875,y:.70},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='rift-threading')return {shift_left:{key:'ArrowLeft',touch:{x:.10,y:.70},hold_ms:35,settle_ms:35},shift_right:{key:'ArrowRight',touch:{x:.30,y:.70},hold_ms:35,settle_ms:35},dash_left:{key:'ArrowDown',touch:{x:.50,y:.70},hold_ms:35,settle_ms:35},dash_right:{key:'ArrowUp',touch:{x:.70,y:.70},hold_ms:35,settle_ms:35},surge:{key:'Space',touch:{x:.90,y:.70},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='constellation-weaving')return {weave_left:{key:'ArrowLeft',touch:{x:.125,y:.70},hold_ms:35,settle_ms:35},weave_right:{key:'ArrowRight',touch:{x:.375,y:.70},hold_ms:35,settle_ms:35},weave_up:{key:'ArrowUp',touch:{x:.625,y:.70},hold_ms:35,settle_ms:35},weave_down:{key:'ArrowDown',touch:{x:.875,y:.70},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='orbit-docking')return {orbit_left:{key:'ArrowLeft',touch:{x:.10,y:.70},hold_ms:35,settle_ms:35},orbit_right:{key:'ArrowRight',touch:{x:.30,y:.70},hold_ms:35,settle_ms:35},charge_pulse:{key:'ArrowUp',touch:{x:.50,y:.70},hold_ms:35,settle_ms:35},slingshot:{key:'ArrowDown',touch:{x:.70,y:.70},hold_ms:35,settle_ms:35},dock:{key:'Space',touch:{x:.90,y:.70},hold_ms:35,settle_ms:35}};
  if(bp.family_id==='thermal-venting')return {vent_left:{key:'ArrowLeft',touch:{x:.125,y:.70},hold_ms:35,settle_ms:35},vent_right:{key:'ArrowRight',touch:{x:.375,y:.70},hold_ms:35,settle_ms:35},crossfeed:{key:'ArrowUp',touch:{x:.625,y:.70},hold_ms:35,settle_ms:35},coolant_burst:{key:'ArrowDown',touch:{x:.875,y:.70},hold_ms:35,settle_ms:35}};
  return {press_inward:{key:'ArrowLeft',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},carry_right:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},release_left:{key:'ArrowDown',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},seal_gradient:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
}
function contracts(input,model){
  const bp=validateBlueprint(input),seed=bp.seeds[0],a=adapter(bp,seed),g=model.seeds[String(seed)],success=route(model,seed),nodes=success.nodes;
  const first=g.nodes[g.initial].edges.find(x=>x.action===a.firstAction)||g.nodes[g.initial].edges[0],afterFirst=first.to;
  const checkpoints=[1,2,3].map(stage=>nodes.find(id=>g.nodes[id]?.stage===stage)).map(x=>anchor(x,region(0,.05,1,.55)));
  const progressIndex=success.steps.findIndex((step,index)=>g.nodes[step.to]?.stage>g.nodes[success.nodes[index]]?.stage||g.nodes[step.to]?.success),resolvedIndex=progressIndex<0?success.steps.length-1:progressIndex,beforeCommit=success.nodes[resolvedIndex],progressAction=success.steps[resolvedIndex].action;
  const objectives={
    'kinetic-balance':'Balance three changing counterweight holds.',
    'pressure-allocation':'Feed three demand rounds without copying a grid or match mechanic.',
    'signal-composition':'Compose and lock three changing two-channel signal phrases.',
    'trajectory-interception':'Align gate and timing to intercept three deterministic arc waves.',
    'echo-routing':'Configure and mirror three switches to route three deterministic echoes.',
    'cadence-buffering':'Shape and release three ordered cadence buffers.',
    'flux-harvesting':'Match charge and polarity to harvest three deterministic flux fields.',
    'aperture-shaping':'Match aperture width and focus to resolve three deterministic light fields.',
    'phase-coupling':'Couple two unequal orbital phases across three deterministic resonance fields.',
    'gradient-compression':'Move a conserved signal mass across three cells to seal three deterministic gradients.',
    'comet-catching':'Move through widening sky lanes and catch three descending comets before they cross the horizon.',
    'threat-parry':'Read and parry twelve closing signals before they breach the four-sided defense ring.',
    'rift-threading':'Steer through nine shifting rift gates and surge only through each visible opening before impact.',
    'constellation-weaving':'Weave each lit pulse through two, three and four visible sockets without crossing a socket twice.',
    'orbit-docking':'Orbit through nine beacon gates, align with each visible dock and survive the warned recovery before a second bad docking attempt.',
    'thermal-venting':'Stabilize three rising thermal chambers by venting the visibly threatened side before each deterministic pressure beat.'
  };
  const objective=objectives[bp.family_id];
  const controls=['rift-threading','orbit-docking'].includes(bp.family_id)?Array.from({length:5},(_,i)=>({x:i*.20,y:.50,width:.20,height:.40})):Array.from({length:4},(_,i)=>({x:i*.25,y:.50,width:.25,height:.40}));
  const productContract={schema_version:1,objective:{visible_selector:'[data-objective]',expected_text:objective},progress:{selector:'[data-product-progress]',state_path:a.objectiveProgress,format:bp.theme.progress+' {value} / 3',milestones:[1,2,3]},score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:a.direct?[]:[a.reversibleProbe],no_progress_probes:a.direct?[]:[[a.commitAction]]},best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:bp.theme.success,failure_text:bp.theme.failure,max_terminal_latency_ms:100,failure_wait_ms:a.failureWaitMs??(a.weave?1000:45000),failure_actions:a.failureActions??(a.weave?['weave_left','weave_left']:[])},replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},difficulty:{deterministic_seeds:bp.seeds,oracle_id:bp.slug+'-oracle-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:a.complexity,meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:controls,min_font_px:14,min_hit_target_px:44},reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},feedback:{action:a.firstAction,state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},actions:actionMap(bp)};
  const directSecondary=bp.family_id==='threat-parry'?'parry_up':bp.family_id==='rift-threading'?'surge':bp.family_id==='constellation-weaving'?'weave_down':bp.family_id==='orbit-docking'?'slingshot':bp.family_id==='thermal-venting'?'coolant_burst':'burst_shift';
  const choiceMarker=bp.family_id==='threat-parry'?'The incoming direction and matching parry gate dominate the playfield; locked later-wave directions remain visibly secondary.':bp.family_id==='rift-threading'?'The player lane, next rift opening and SURGE action dominate the playfield while later gates remain visibly ahead.':bp.family_id==='constellation-weaving'?'The active lit thread and two unlocked sockets dominate the playfield while the third and fourth sockets remain visibly locked until later constellations.':bp.family_id==='orbit-docking'?'The courier, current beacon dock and orbit direction dominate the playfield while later pulse and slingshot moves remain visibly locked.':bp.family_id==='thermal-venting'?'The threatened chamber and two direct vents dominate the playfield while crossfeed and coolant remain visibly locked until later stages.':a.direct?'The unlocked DRIFT control is a bright full-size lane arrow while the future BURST control is a dark broken boost gate until wave two.':'The immediately useful choice is visibly active while the commit control is visibly conditional.';
  const replayReason=bp.family_id==='rift-threading'?'Replay the same rift route and clear all nine gates with fewer steering moves and later surges.':bp.family_id==='constellation-weaving'?'Replay the same lattice and follow each glowing chain in order for a higher device best.':bp.family_id==='orbit-docking'?'Replay the same beacon route, use fewer orbit moves and dock all nine gates without a second alignment warning.':bp.family_id==='thermal-venting'?'Replay the same pressure sequence, avoid every warning and stabilize all twelve beats with a higher device best.':'Replay the same seed and finish all three rounds with fewer misses and faster parries.';
  const visualPair=bp.family_id==='rift-threading'?{id:'primary-choice',kind:'state',a:anchor(g.initial,region(.08,.24,.28,.28)),b:anchor(afterFirst,region(.64,.24,.28,.28)),state_path:a.statePath,marker:choiceMarker}:{id:'primary-choice',kind:'action_availability',a:anchor(g.initial,region(.08,.24,.28,.28)),b:anchor(g.initial,region(.64,.24,.28,.28)),action_a:a.firstAction,action_b:a.direct?directSecondary:a.commitAction,marker:choiceMarker};
  const commercialContract={schema_version:1,review_id:bp.slug+'-commercial-v1',seed,visual_legibility:{pairs:[visualPair]},state_distinction:{pairs:[{id:'first-decision-state',kind:'state',a:anchor(g.initial,region(.06,.16,.88,.48)),b:anchor(afterFirst,region(.06,.16,.88,.48)),state_path:a.statePath,marker:'The first decision changes large playfield geometry, not only text, score or color.'}]},action_feedback:{probes:[{id:'first-decision',node:g.initial,action:first.action,kind:'movement',region:region(.05,.14,.90,.55)},{id:'commit-round',node:beforeCommit,action:progressAction,kind:'unlock',region:region(0,.03,1,.58)}]},motion:{intermediate_ms:[70,150],settle_ms:450},progression_spectacle:{checkpoints,marker:'Each completed round changes the whole playfield structure and leaves a persistent visible completion mark.'},result_presentation:{region:region(0,.80,1,.20),success_title:bp.theme.success,failure_title:bp.theme.failure},audio:{mode:'required',mute_selector:'[data-mute]',primary_probe:'first-decision',progress_probe:'commit-round'},mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'active',foreground:region(.08,.24,.28,.28),background:region(.08,.58,.28,.05)},{role:'goal',foreground:region(.38,.08,.24,.12),background:region(.38,.22,.24,.05)}]},replay_motivation:{selector:'[data-replay-reason]',reason:replayReason},performance:{sample_ms:1200}};
  return {productContract,commercialContract,objective,successRoute:success};
}
function reviewedRuleData(bp,model){
  const perSeed={};
  for(const seed of bp.seeds){
    perSeed[String(seed)]={success_actions:route(model,seed).steps.map(x=>x.action)};
    if(bp.family_id==='kinetic-balance')perSeed[String(seed)].stage_targets=Object.fromEntries([1,2,3].map(stage=>[String(stage),((seed+stage)%3)-1||1]));
    if(bp.family_id==='pressure-allocation')perSeed[String(seed)].round_demands=Object.fromEntries([1,2,3].map(round=>[String(round),{north:1+((seed+round)%2),south:1+((seed+round+1)%2)}]));
    if(bp.family_id==='signal-composition')perSeed[String(seed)].phrase_targets=Object.fromEntries([1,2,3].map(phrase=>[String(phrase),{channelA:1+((seed+phrase)%2),channelB:(seed+phrase*2)%3}]));
    if(bp.family_id==='trajectory-interception')perSeed[String(seed)].wave_targets=Object.fromEntries([1,2,3].map(wave=>[String(wave),{gate:1+((seed+wave)%2),timing:(Math.floor(seed/3)+wave)%2}]));
    if(bp.family_id==='echo-routing')perSeed[String(seed)].route_targets=Object.fromEntries([1,2,3].map(stage=>[String(stage),{switchMask:1+((seed+stage*3)%7)}]));
    if(bp.family_id==='cadence-buffering')perSeed[String(seed)].bar_targets=Object.fromEntries([1,2,3].map(bar=>[String(bar),{lead:1+((seed+bar)%2),middle:1+((seed+bar*2+1)%2),tail:1+((seed+bar*3+2)%2)}]));
    if(bp.family_id==='flux-harvesting')perSeed[String(seed)].field_targets=Object.fromEntries([1,2,3].map(stage=>[String(stage),{charge:1+((seed+stage)%3),polarity:(Math.floor(seed/5)+stage)%2}]));
    if(bp.family_id==='aperture-shaping')perSeed[String(seed)].light_targets=Object.fromEntries([1,2,3].map(stage=>[String(stage),{width:1+((seed+stage)%2),focus:(Math.floor(seed/7)+stage)%3}]));
    if(bp.family_id==='comet-catching')perSeed[String(seed)].comet_lanes=Object.fromEntries([1,2,3].map(stage=>[String(stage),{lanes:stage+2,target:1+((seed+stage)%(stage+1))}]));
    if(bp.family_id==='threat-parry')perSeed[String(seed)].threat_plan=Object.fromEntries([1,2,3].map(stage=>[String(stage),reflexKit.plan(seed)[stage].sequence]));
    if(bp.family_id==='rift-threading')perSeed[String(seed)].rift_plan=Object.fromEntries([1,2,3].map(stage=>[String(stage),reflexKit.riftPlan(seed)[stage].openings]));
    if(bp.family_id==='constellation-weaving')perSeed[String(seed)].weave_plan=Object.fromEntries([1,2,3].map(stage=>{const plan=reflexKit.weavePlan(seed)[stage];return [String(stage),{sockets:plan.sockets,order:plan.order,operations:plan.operations,start_mask:plan.start_mask,move_limit:plan.move_limit}];}));
    if(bp.family_id==='orbit-docking')perSeed[String(seed)].dock_plan=Object.fromEntries([1,2,3].map(stage=>{const plan=reflexKit.dockPlan(seed)[stage];return [String(stage),{slots:plan.slots,gate_count:plan.gate_count,targets:plan.targets,available:plan.available}];}));
    if(bp.family_id==='thermal-venting')perSeed[String(seed)].vent_plan=Object.fromEntries([1,2,3].map(stage=>{const plan=reflexKit.ventPlan(seed)[stage];return [String(stage),{hazards:plan.hazards,available:plan.available,deadline_ticks:plan.deadline_ticks}];}));
  }
  return perSeed;
}
function protectedCoreId(family){return {'threat-parry':'threat-parry-v1','rift-threading':'rift-thread-v1','constellation-weaving':'constellation-weave-v1','orbit-docking':'orbit-dock-v1','thermal-venting':'thermal-vent-v1'}[family]||null;}
function verifyProtectedCore(bp,model,seeds){
  const id=protectedCoreId(bp.family_id);if(!id)return null;
  for(const seed of bp.seeds){
    const invariant=seeds[String(seed)],core=reflexKit.create({id}),state=core.create(seed),project=()=>model.projection.map(pathName=>product.at({state},pathName));
    if(JSON.stringify(project())!==JSON.stringify(invariant.initial_state))fail('protected_core_initial');
    for(let index=0;index<invariant.success_actions.length;index++){
      core.step(state,{actions:{[invariant.success_actions[index]]:true}});
      if(JSON.stringify(project())!==JSON.stringify(invariant.success_states[index+1]))fail('protected_core_oracle');
      const observed=core.observe(state);
      if(!['tick','score','progress','interactions','entities'].every(key=>Number.isFinite(observed[key]))||observed.entities<0||observed.entities>64)fail('protected_core_diagnostics');
    }
    if(!core.terminal(state)||state.outcome!=='success')fail('protected_core_terminal');
    const replay=core.create(seed);if(JSON.stringify(model.projection.map(pathName=>product.at({state:replay},pathName)))!==JSON.stringify(invariant.initial_state))fail('protected_core_replay');
  }
  return {runtime:reflexKit.version,seeds:bp.seeds.length,oracle_sha256:hash(model),diagnostics:'finite_numeric',replay:'exact_initial_state'};
}
function buildInvariants(bp,model,productContract,commercialContract){
  const seeds={};
  for(const seed of bp.seeds){
    const success=route(model,seed),graph=model.seeds[String(seed)];
    const stageNodes=[];
    for(const node of success.nodes){const stage=graph.nodes[node].stage;if(!stageNodes.some(row=>row.stage===stage)&&!graph.nodes[node].success)stageNodes.push({node,stage});}
    const quality_checkpoints=stageNodes.map(({node})=>{
      const metrics=product.stageMetrics(graph,node);
      return {state:graph.nodes[node].values,stage:metrics.stage,complexity:metrics.complexity,required_actions:metrics.required_actions};
    });
    const terminalStep=success.steps.at(-1),preterminalNode=success.nodes.at(-2);
    seeds[String(seed)]={
      initial_state:graph.nodes[graph.initial].values,
      success_actions:success.steps.map(step=>step.action),
      success_states:success.nodes.map(node=>graph.nodes[node].values),
      quality_checkpoints,
      preterminal_state:graph.nodes[preterminalNode].values,
      terminal_action:terminalStep.action,
      terminal_state:graph.nodes[success.nodes.at(-1)].values
    };
  }
  const protectedProof=verifyProtectedCore(bp,model,seeds);
  return {
    schema_version:1,
    source:'reviewed-foundry-oracle',
    oracle_id:productContract.difficulty.oracle_id,
    oracle_sha256:productContract.difficulty.oracle_sha256,
    projection:model.projection,
    actions:productContract.actions,
    lifecycle:{
      objective_selector:productContract.objective.visible_selector,
      progress_selector:productContract.progress.selector,
      progress_state_path:productContract.progress.state_path,
      score_selector:productContract.score.selector,
      best_selector:productContract.best.selector,
      outcome_state_path:productContract.completion.state_path,
      success_value:productContract.completion.success_value,
      failure_value:productContract.completion.failure_value,
      result_selector:productContract.completion.result_selector,
      replay_selector:productContract.replay.selector
    },
    diagnostics:{
      stage_path:productContract.difficulty.stage_path,
      complexity_path:productContract.difficulty.complexity_path,
      objective_progress_path:productContract.difficulty.objective_progress_path,
      meaningful_actions_path:productContract.difficulty.meaningful_actions_path,
      reversible_state_path:productContract.difficulty.reversible_state_path,
      feedback_active_path:productContract.feedback.active_probe_path,
      static_feedback_path:productContract.feedback.static_probe_path,
      reduced_motion_path:productContract.reduced_motion.presentation_probe_path
    },
    construction:{
      input_owner:'PlayJoltGameKit',
      input_source:'input.actions',
      action_expressions:Object.keys(productContract.actions).map(name=>'input.actions.'+name),
      complexity_source:'quality_checkpoints.complexity',
      terminal_owner:'GameCore',
      terminal_rule:'terminal(state) is true exactly when outcome_state_path equals success_value or failure_value; the terminal action changes outcome in the same step.',
      replay_owner:'PlayJoltGameKit',
      replay_rule:'Do not implement a second restart handler. GameKit invokes core.create(seed) and restores the seed initial_state.',
      ...(protectedProof?{prepaid_core_proof:protectedProof}:{}),
    },
    commercial_probes:commercialContract.action_feedback.probes.map(probe=>({id:probe.id,node:probe.node,action:probe.action,kind:probe.kind})),
    seeds,
    ...(bp.family_id==='threat-parry'?{factory_core:{runtime:'reflexkit-4',required_script:'./reflexkit.js',core_source:THREAT_PARRY_CORE_SOURCE,time_authority:'state.deadline and state.danger are advanced by the same factory core that decides parry, score, progress, success and failure.',stage_action_counts:[2,4,6]}}:{}),
    ...(bp.family_id==='rift-threading'?{factory_core:{runtime:'reflexkit-4',required_script:'./reflexkit.js',core_source:RIFT_THREAD_CORE_SOURCE,time_authority:'state.deadline and state.danger are advanced by the same factory core that decides lane movement, surge collision, score, progress, success and failure.',stage_action_counts:[2,3,4]}}:{}),
    ...(bp.family_id==='constellation-weaving'?{factory_core:{runtime:'reflexkit-4',required_script:'./reflexkit.js',core_source:CONSTELLATION_WEAVE_CORE_SOURCE,time_authority:'state.litMask, state.usedMask and state.moves are advanced by the same factory core that decides thread legality, score, progress, success and overload failure.',stage_action_counts:[2,3,4]}}:{}),
    ...(bp.family_id==='orbit-docking'?{factory_core:{runtime:'reflexkit-4',required_script:'./reflexkit.js',core_source:ORBIT_DOCK_CORE_SOURCE,time_authority:'state.position, state.target, state.warning, state.deadline and state.danger are advanced by the same factory core that decides orbit movement, warned recovery, timeout, score, progress, success and second-bad-dock failure.',stage_action_counts:[3,4,5]}}:{}),
    ...(bp.family_id==='thermal-venting'?{factory_core:{runtime:'reflexkit-4',required_script:'./reflexkit.js',core_source:THERMAL_VENT_CORE_SOURCE,time_authority:'state.deadline, state.danger, both chamber temperatures and each hazard beat are advanced by the same factory core that decides vent effects, score, warning, progress, success and overload failure.',stage_action_counts:[2,3,4],diagnostic_entities:'finite numeric count'}}:{})
  };
}
function proposalFor(input,model){
  const bp=validateBlueprint(input),pair=contracts(bp,model),market=bp.lane==='market-benchmark',a=adapter(bp,bp.seeds[0]),direct=a.direct===true,reflex=a.factoryCore===true,rift=bp.family_id==='rift-threading',weave=bp.family_id==='constellation-weaving',docking=bp.family_id==='orbit-docking',venting=bp.family_id==='thermal-venting';
  const familyConfig={
    'kinetic-balance':{genre:'kinetic decision puzzle',key:'ArrowRight',rules:'A counterweight shifts one visible balance unit left or right within -2..2. HOLD is legal only at the reviewed seed-and-stage target; a successful hold changes leverage, resets balance to zero and advances the canopy.'},
    'pressure-allocation':{genre:'resource pressure strategy puzzle',key:'ArrowUp',rules:'NORTH and SOUTH each add one unit up to 3, EQUALIZE subtracts one unit from both when both are positive, and SEAL advances only when both visible reviewed demands are met; a successful seal resets both capacities to zero.'},
    'signal-composition':{genre:'signal composition puzzle',key:'ArrowLeft',rules:'PULSE A and PULSE B cycle their visible channels through 0..2, INVERT swaps every nonzero channel between 1 and 2, and LOCK PHRASE advances only when both reviewed target channels match; a successful lock resets both channels to zero.'},
    'trajectory-interception':{genre:'trajectory planning puzzle',key:'ArrowRight',rules:'SHIFT LEFT and SHIFT RIGHT cycle the visible gate through three positions, DELAY toggles early or late timing, and INTERCEPT advances only when gate and timing both match the reviewed wave target; a successful intercept resets gate and timing.'},
    'echo-routing':{genre:'network routing puzzle',key:'ArrowRight',rules:'NEXT SWITCH cycles the active node, TOGGLE SWITCH flips that node, MIRROR ROUTE swaps the outer switch states, and ROUTE ECHO advances only when the visible three-bit switch mask matches the reviewed target; a successful route resets the network.'},
    'cadence-buffering':{genre:'temporal sequencing puzzle',key:'ArrowUp',rules:'LENGTHEN LEAD cycles the first beat through 0..2, ROTATE BUFFER moves all three beats left, REVERSE BUFFER mirrors their order, and RELEASE BAR advances only when the ordered beat buffer matches the reviewed target; a successful release clears the buffer.'},
    'flux-harvesting':{genre:'field calibration puzzle',key:'ArrowUp',rules:'GATHER FLUX and RELEASE FLUX cycle charge forward or backward through 0..3, FLIP FIELD changes polarity, and HARVEST FLUX advances only when both visible reviewed targets match; a successful harvest resets charge and polarity.'},
    'aperture-shaping':{genre:'optical shaping puzzle',key:'ArrowUp',rules:'WIDEN APERTURE cycles width through 0..2, SHIFT FOCUS cycles focal position through 0..2, INVERT LENS mirrors both values, and FOCUS BEAM advances only when width and focus match the reviewed light target; a successful focus resets the lens.'},
    'phase-coupling':{genre:'coupled-system resonance puzzle',key:'ArrowUp',rules:'ADVANCE PAIR changes both unequal orbital cycles, RETARD OUTER changes only the three-step outer cycle, EXCHANGE PHASE moves both cycles by different amounts, and COUPLE ORBITS advances only when both reviewed phases match; a successful coupling resets both cycles.'},
    'gradient-compression':{genre:'conserved-flow spatial puzzle',key:'ArrowLeft',rules:'PRESS INWARD moves one signal unit from left to middle, CARRY RIGHT moves one from middle to right, RELEASE LEFT returns one from right to left, and SEAL GRADIENT advances only when the visible conserved three-cell distribution matches; a successful seal restores the next two-unit field.'},
    'comet-catching':{genre:'direct-control comet catching action',key:'ArrowRight',rules:'DRIFT LEFT and DRIFT RIGHT move the catcher directly through 3, then 4, then 5 visible sky lanes. BURST SHIFT unlocks in wave two and PHASE CUT in wave three. Entering the descending comet lane catches it immediately, scores the wave and launches the next faster wave without a separate confirm button.'},
    'threat-parry':{genre:'four-direction reflex defense action',key:'ArrowRight',rules:'PARRY LEFT and PARRY RIGHT defend wave one, PARRY UP joins wave two, and PARRY DOWN joins wave three. Match the visibly incoming direction before the factory-owned danger ring closes. The three waves require exactly 2, 4 and 6 successful direct parries; a wrong direction creates one visible recovery beat and shortens the deadline.'},
    'rift-threading':{genre:'timed lane-threading action',key:'ArrowRight',rules:'SHIFT LEFT and SHIFT RIGHT steer a skimmer across 3, then 4, then 5 lanes. SURGE crosses only the visible opening; surging into a wall or waiting for impact fails immediately. The three stages contain 2, 3 and 4 gates with shrinking factory-owned deadlines.'},
    'constellation-weaving':{genre:'direct spatial chain puzzle',key:'ArrowLeft',rules:'WEAVE LEFT and WEAVE RIGHT form the first two-socket constellation; WEAVE UP unlocks in stage two and WEAVE DOWN in stage three. Each press flips the selected socket and the next visible socket in the seed-owned thread. Use every unlocked socket exactly once before the move budget closes; crossing a thread or choosing a locked socket causes an immediate overload.'},
    'orbit-docking':{genre:'orbital courier alignment action',key:'ArrowRight',rules:'ORBIT LEFT and ORBIT RIGHT move one dock around the live ring. CHARGE PULSE unlocks in stage two and jumps two docks; SLINGSHOT unlocks in stage three and jumps three. DOCK scores only at the visible beacon. One bad dock creates a recoverable warning; repeating DOCK without moving causes a real collision failure.'},
    'thermal-venting':{genre:'real-time thermal stabilization action',key:'ArrowLeft',rules:'VENT LEFT and VENT RIGHT accept the next visible pressure beat only when they match the threatened chamber. A wrong vent raises that chamber to a recoverable warning; repeating the wrong vent overloads it. CROSSFEED unlocks in stage two and COOLANT BURST in stage three; each toggles a visible preparation mode and can clear a warning without advancing the beat. An expired protected deadline also fails.'}
  }[bp.family_id];
  const rules=reviewedRuleData(bp,model),familyText=familyConfig.rules;
  const lineage=market?'Market benchmark lineage: '+bp.benchmark.publisher+' '+bp.benchmark.surface+' at '+bp.benchmark.url+'. Transfer only these abstract principles: '+bp.benchmark.transferable_principles.join('; ')+'. Forbidden copying: '+bp.copy_policy.forbidden.join('; ')+'.':'Original exploration lane with no external game used as a mechanic, art or layout template.';
  const focus=new Set(bp.learning_focus),lesson=(id,text)=>focus.has(id)?' Prior Factory outcomes require this correction: '+text:'';
  const build_invariants=buildInvariants(bp,model,pair.productContract,pair.commercialContract);
  if(venting)return {
    game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,
    controls:['Left and Right vent the matching chamber before the next pressure beat.','Crossfeed and coolant unlock as the chamber sequence grows.'],
    mobile_controls:['Tap the threatened chamber vent before its deadline.','Use crossfeed or coolant to recover a visible high-heat warning.'],
    max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:a.statePath},pointer:{observation:a.statePath},terminal_ms:50000},
    implementation_contract:{
      first_ten_seconds:'Start immediately reveals two large thermal chambers, the next pressure side and a shrinking protected beat timer. The first LEFT input visibly vents the left chamber, accepts the first deterministic pressure beat and changes score and heat within one second.',
      tension_curve:'Stage one contains three pressure beats with two direct vents, stage two contains four faster beats and unlocks CROSSFEED, and stage three contains five faster beats and unlocks COOLANT BURST. Four heat is a visible recoverable warning; repeating the wrong vent or waiting past the protected deadline fails.',
      mastery_hook:'Players improve by reading the next pressure side, venting before injection, using the unlocked preparation modes to clear warnings and completing all twelve beats without an overload.',
      replay_hook:'Replay preserves the exact seed-owned pressure sequence so fewer warnings, lower peak heat and a higher device-local best are honest mastery goals.',
      sensory_payoff:'Every vent visibly contracts one chamber before the pressure wave lands, then the receiving chamber expands with protected intermediate motion. Stable stages lock a persistent cooling fin; warnings flare across the threatened chamber and terminal outcomes transform the full plant.',
      goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Stabilize all twelve deterministic pressure beats across three original thermal stages.'+lesson('lifecycle-integrity','prove the twelfth accepted beat succeeds in the same step and the protected timeout reaches failure through ordinary waiting.'),
      progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. The protected Factory core owns temperatures, hazards, deadlines, score, warnings, stage transitions and outcomes. Candidate code may only present its snapshots.'+lesson('progress-readability','show every accepted beat and completed stage through numeric progress plus persistent playfield structure.'),
      presentation:'Use Phaser 4 Game Objects for two large contrasting chambers, a central pressure conduit, an obvious next-side hazard marker, a shrinking deadline ring and three persistent cooling fins. The protected PhaserKit overlay owns bounded feedback, stage rail and terminal result emphasis; candidate art stays presentation-only and cannot cover lifecycle controls.',
      originality:lineage+' Transfer only immediate direct manipulation, gradual complexity, deterministic solvability and recoverable planning. Do not copy tubes, sorted colors, container layouts, level content, names, branding, art, audio, code, scoring or any distinctive ruleset.',
      difficulty:'Implement the reviewed finite-state rules and expose '+model.projection.join(', ')+'. The six seed routes are validation examples, not autoplay. quality.stage is the chamber stage, quality.complexity is exactly 2, 3 and 4 legal action choices, quality.objective_progress is completed and every reviewed seed has a bounded success route.'+lesson('difficulty-progression','preserve all six action-by-action Oracle routes and the recoverable four-heat warning.'),
      mobile_readability:'At 390x844 keep objective, progress, current score, device best, both chambers, hazard marker, result, Replay and replay reason in the first viewport. Four control regions remain at least44px; the threatened chamber and heat level dominate explanatory text.'+lesson('mobile-hierarchy','use high-contrast geometry and size, not labels alone, for active chamber, warning and next pressure.'),
      result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. Success freezes both chambers cool with three visible fins; failure visibly overloads the affected side. The protected result band, CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.',
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode shows protected before/intermediate/settled chamber motion at70ms and150ms; reduced mode changes geometry immediately and preserves a strong static state cue for at least450ms.',
      scoring:'The protected core awards finite stage-scaled score once per accepted pressure beat. Preparation, waiting and unavailable future actions award zero. Diagnostics expose finite numeric tick, score, progress, interactions and bounded entity count.',
      completion_timing:'The Factory core owns all twelve beats and 360, 300 and 240 tick deadlines. The twelfth accepted beat succeeds immediately. Four heat warns and remains recoverable; a second wrong vent during that warning or an expired deadline fails. Do not add another timer, heat, warning or terminal authority.',
      action_feedback:'Every canonical vent changes chamber geometry immediately, differs at70ms and150ms and settles by450ms. Pressure injection visibly follows the vent, stage completion leaves a persistent fin and warnings produce an unmistakable static flare in reduced motion.'
    },build_invariants,product_contract:pair.productContract,commercial_contract:pair.commercialContract
  };
  if(docking)return {
    game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,
    controls:['Arrow keys orbit the courier; Space docks at the visible beacon.','Pulse and slingshot moves unlock as the rings widen.'],
    mobile_controls:['Tap one of the large orbit moves, then tap DOCK at the bright beacon.','A red warning is recoverable: move before trying DOCK again.'],
    max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:a.statePath},pointer:{observation:a.statePath},terminal_ms:50000},
    implementation_contract:{
      first_ten_seconds:'Start immediately reveals the courier, a four-dock ring and the first bright beacon. The first RIGHT input moves the courier one full dock, scores a real movement reward and triggers the protected feedback ring without a separate confirmation step.',
      tension_curve:'Ring one has four docks and two beacon deliveries, ring two has five docks and three deliveries plus CHARGE PULSE, and ring three has six docks and four deliveries plus SLINGSHOT. Every stage increases both route length and consequential move width.',
      mastery_hook:'Players improve by reading the shortest circular route, using one-, two- and three-dock moves efficiently and recovering from the visible first alignment warning instead of repeating a bad dock.',
      replay_hook:'Replay preserves the exact seed-owned nine-beacon route so fewer orbit moves, no second bad dock and the device-local best provide honest mastery goals.',
      sensory_payoff:'Every orbit move produces immediate protected intermediate motion and a settled pulse. A correct dock locks a persistent beacon and advances the route; a warning flashes the target and a second uncorrected bad dock fractures the ring. GameKit owns gesture-gated audio and the protected result band.',
      goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Dock all nine beacons through three widening original orbit rings.'+lesson('lifecycle-integrity','prove the ninth correct dock succeeds in the same step, two bad docks fail and movement between warnings recovers.'),
      progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. The protected Factory core owns position, targets, warning recovery, score, stage transitions and outcomes. Candidate code may only present its snapshots.'+lesson('progress-readability','show every canonical movement reward and completed ring without inventing candidate-owned progress.'),
      presentation:'Use Phaser 4 Game Objects for one large centered orbital ring, a clearly shaped courier, a bright beacon target and persistent completed-dock marks. The protected PhaserKit overlay owns immediate/intermediate feedback, progress rail and terminal result emphasis; candidate art must remain presentation-only and must not cover it.'+lesson('state-distinction','make position, target, warning and newly unlocked movement geometry independently visible.'),
      originality:lineage+' This is an original circular courier-and-beacon system. Do not copy a board, character, track, map, control layout, artwork, audio, code, scoring model or distinctive ruleset from another game.',
      difficulty:'Implement the reviewed finite-state rules and expose '+model.projection.join(', ')+'. The six seed routes are validation examples, not autoplay. quality.stage is the ring, quality.complexity is exactly 3, 4 and 5 legal action choices, quality.objective_progress is completed, and every stage-entry choice has a bounded return or success path.'+lesson('difficulty-progression','preserve all six reviewed routes and the recoverable first-choice topology.'),
      mobile_readability:'At 390x844 keep objective, progress, current score, device best, full ring, result, Replay and replay reason in the first viewport. Five control regions remain at least44px with stable positions; active ring geometry dominates explanatory text.'+lesson('mobile-hierarchy','keep the courier and current beacon larger and higher contrast than labels and future unlocks.'),
      result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. PhaserKit renders the terminal result across the lower playfield while candidate art changes the full ring to secured or fractured. CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.'+lesson('result-presentation','make both outcomes unmistakable through canvas geometry and the protected result band.'),
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode shows protected bounded intermediate orbit feedback at70ms and150ms; reduced mode changes position immediately and preserves a strong static ring cue for at least450ms. GamePresentation.reduced_motion reports the real mode.',
      scoring:'The protected core awards finite score for each effective orbit move and a larger delivery reward only for a correct dock. Bad docks, waiting and locked future actions award zero. Present finite tick, score, progress, interactions and bounded dock entities from the snapshot.',
      completion_timing:'The Factory core owns all nine beacon transitions and the visible 2700-tick relay deadline. A correct ninth dock succeeds immediately. The first misaligned dock sets warning=1 and remains recoverable; repeating DOCK before any movement fails immediately; exhausting the relay deadline also fails. Do not add another warning, timer, collision or terminal authority.',
      action_feedback:'Every canonical state change triggers PhaserKit protected feedback immediately, visibly changes at70ms and150ms and settles by450ms. Correct docks add a persistent beacon mark; warnings pulse red around the target; terminal states use the protected result band. Reduced motion keeps a static geometry cue.'
    },build_invariants,product_contract:pair.productContract,commercial_contract:pair.commercialContract
  };
  if(weave)return {
    game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,
    controls:['Arrow keys weave the matching visible socket.','Use each unlocked socket once to carry the lit thread through the lattice.'],
    mobile_controls:['Tap one of the large unlocked sockets around the lattice.','Follow the lit chain and never cross an already used socket.'],
    max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:a.statePath},pointer:{observation:a.statePath},terminal_ms:50000},
    implementation_contract:{
      first_ten_seconds:'Start immediately reveals one lit thread, two large unlocked sockets and the exact visible connection between them. The first LEFT weave moves the light through the connection, leaves a persistent strand and changes the next spatial decision within one second.',
      tension_curve:'Constellation one has two sockets and two moves, constellation two has three sockets and three moves, and constellation three has four sockets and four moves. Every stage adds one visible socket and one required unique weave; repeating a socket exhausts the exact move budget and overloads the lattice.',
      mastery_hook:'Every unlocked socket can begin a valid route, but following the currently lit socket preserves the chain bonus. Players improve by reading the visible operation links, using each socket once and carrying the pulse without a crossed thread.',
      replay_hook:'Replay repeats the same seed-owned lattice so the player can follow all nine strands in the brighter chain order and beat the device-local best without hidden variation.',
      sensory_payoff:'A legal weave sends a bright pulse across the exact affected connection, locks a persistent strand and blooms the completed constellation. A crossed or locked socket fractures the full lattice. Use factory FeelFX and GameKit audio with a visible mute control.',
      goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Complete all three constellations and nine unique socket weaves.'+lesson('lifecycle-integrity','prove that the ninth unique weave succeeds immediately and that two repeated LEFT inputs fail the first constellation without another lifecycle.'),
      progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. The protected Factory core owns masks, move budgets, score, stage transitions and terminal outcomes. Candidate code may only present its snapshot.'+lesson('progress-readability','make each completed constellation update numeric progress and leave a persistent geometric mark.'),
      presentation:'Use Phaser 4 Game Objects for a central radial lattice with two, then three, then four large sockets. Draw the exact seed-owned operation links, lit nodes, used strands and three persistent constellation marks. The active pulse and remaining sockets must be readable from geometry without relying on labels or color alone. Call scene.playjoltFeel feedback only after canonical state changes and keep Phaser presentation-only.'+lesson('state-distinction','make every weave alter the lattice geometry, connection occupancy and pulse position.'),
      originality:lineage+' Transfer only immediate manipulation clarity, visible remaining capacity and short-session replay motivation. Do not use an 8x8 board, draggable blocks, row or column clearing, observed shapes, screenshots, store text or any benchmark layout. The mechanic, code, names, art, audio, scoring and presentation remain original to PlayJolt.',
      difficulty:'Implement the reviewed finite-state rules and expose '+model.projection.join(', ')+'. The six seed routes are validation examples, not autoplay. quality.stage is the constellation, quality.complexity is exactly 2, 3 and 4 unlocked sockets, quality.objective_progress is completed, quality.meaningful_actions counts canonical weave attempts, and quality.reversible_state_key joins the reviewed projection.'+lesson('difficulty-progression','preserve every reviewed route and make the extra socket and move visibly increase decision depth.'),
      mobile_readability:'At 390x844 keep objective, progress, current score, device best, full lattice, result, Replay and replay reason in the first viewport. The four socket regions remain at least44px and keep stable positions as later sockets unlock.'+lesson('mobile-hierarchy','make the lit thread and unlocked sockets dominate the mobile viewport without hiding lifecycle controls.')+lesson('input-parity','use only the exact named input.actions bindings so keyboard and touch change the same litMask.'),
      result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. Success completes the full '+bp.theme.arena+' with three stable constellations and nine strands; failure visibly fractures the crossed lattice. CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.'+lesson('result-presentation','make success and overload unmistakable through the entire playfield, not a text overlay alone.'),
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode sends a bounded pulse along one connection with visible intermediate states; reduced mode changes the connection instantly and preserves a strong static strand cue for at least300ms. GamePresentation.reduced_motion reports the real mode.'+lesson('reduced-motion','retain strong geometry and static feedback when movement is disabled.'),
      scoring:'The trusted core awards score only on the first use of a socket. Following the currently lit socket earns the larger chain reward; repeating, locked input and idle frames award zero. Present finite tick, score, progress, interactions and bounded socket entities from the snapshot.',
      completion_timing:'The Factory core owns the exact 2, 3 and 4 move budgets. The ninth unique weave succeeds in the same step. A locked socket fails immediately, while a crossed thread fails when its stage budget closes. Do not add another move counter, timer or terminal authority.'+lesson('lifecycle-integrity','let GameKit alone own result and replay transitions.'),
      action_feedback:'Every weave moves the pulse through its exact connection with visible intermediate states by70ms and150ms, settles a persistent strand by450ms and immediately reveals the next lit geometry. Stage completion blooms the whole constellation; overload breaks the crossed path. Reduced motion uses immediate geometry plus a static cue.'+lesson('action-feedback','make the first weave and each stage completion visually distinct at intermediate and settled checkpoints.')
    },build_invariants,product_contract:pair.productContract,commercial_contract:pair.commercialContract
  };
  if(rift)return {
    game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,
    controls:['Left and Right steer; Down and Up unlock two-lane dashes.','Space surges through the visible gate opening.'],
    mobile_controls:['Tap shift or unlocked dash controls to steer the skimmer.','Tap SURGE only when aligned with the opening.'],
    max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:a.statePath},pointer:{observation:a.statePath},terminal_ms:50000},
    implementation_contract:{
      first_ten_seconds:'Start immediately reveals a closing rift gate, its bright opening and the skimmer lane; the first steer moves the skimmer across a full lane and SURGE tears through the opening with a visible tunnel jump.',
      tension_curve:'Stage one threads two gates across three lanes at six seconds each, stage two threads three gates across four lanes at four-and-a-half seconds, and stage three threads four gates across five lanes at three-and-a-half seconds. The visible tunnel depth and warning field must read state.danger from the trusted core.',
      mastery_hook:'Players improve by reading the next opening early, steering with fewer lane changes and delaying SURGE for a larger remaining-deadline score without colliding.',
      replay_hook:'Replay repeats the same seed so the player can beat the device-local best through cleaner steering and later surges rather than luck or hidden variation.',
      sensory_payoff:'Use factory FeelFX burst, pulse, floatText or bounded shake for steering, gate clears and collisions; GameKit supplies distinct action, progress, success and failure SFX with a visible mute control.',
      goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Complete all nine gates through the original rift-threading mechanic.'+lesson('lifecycle-integrity','implement every reviewed seed success route before visual polish and prove the ninth legal surge reaches success immediately.'),
      progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. The protected ReflexKit core owns lane movement, gate collision, countdown, score and terminal transitions; present its snapshot without recreating or overriding those decisions.'+lesson('progress-readability','make every completed stage change both the numeric progress and persistent tunnel structure.'),
      presentation:'Use Phaser 4 Game Objects for a deep five-lane tunnel, a skimmer that crosses the full lane width, closing rift walls whose opening is state.opening, depth driven by state.danger and nine persistent gate marks. Directly call scene.playjoltFeel.burst(...), pulse(...), floatText(...) or shake(...) after canonical state changes; optional chaining is allowed. Keep Phaser presentation-only.'+lesson('state-distinction','make successive gate states distinguishable by geometry, not labels or color alone.'),
      originality:lineage+' The mechanic, code, names, art, layout, scoring, levels and presentation must be original to PlayJolt. This is not permission to recreate an observed title under another skin.',
      difficulty:'Implement the reviewed finite-state rules and rule table exactly and expose '+model.projection.join(', ')+'. The success routes are validation examples, not hidden autoplay. quality.stage is the stage, quality.complexity strictly increases each stage, quality.objective_progress is completed, quality.meaningful_actions counts only projection-changing legal actions, and quality.reversible_state_key joins the reviewed projection.'+lesson('difficulty-progression','make later stages observably harder while preserving the exact reachable Oracle path for every seed.'),
      mobile_readability:'At 390x844 keep objective, progress, current score, device best, the full tunnel, result, Replay and replay reason in the first viewport. Use large geometry, at least14px critical labels and at least44px lifecycle controls.'+lesson('mobile-hierarchy','make the current opening and skimmer lane dominate the mobile viewport without hiding lifecycle controls.'),
      result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. Success stabilizes the full '+bp.theme.arena+' into a bright open tunnel; failure visibly collapses the struck gate. CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.'+lesson('result-presentation','make terminal success and failure unmistakable through whole-playfield composition, not a text overlay alone.')+lesson('lifecycle-integrity','keep the result and primary Replay control visible for both success and failure without a second lifecycle.'),
      reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode uses bounded movement and settlement; reduced mode changes geometry instantly and preserves a strong static state-change cue for at least300ms. GamePresentation.reduced_motion reports the actual behavior.'+lesson('reduced-motion','prove the live preference change and retain a strong non-animated spatial cue.'),
      scoring:'The trusted core awards score only when SURGE crosses the correct opening, scales reward by stage and remaining deadline, and awards zero for steering, waiting and collisions. Present finite tick, score, progress, interactions and bounded entities from its snapshot.',
      completion_timing:'ReflexKit advances tick, deadline and danger through GameKit steps. Waiting for impact or surging into a wall fails immediately; the ninth correct surge succeeds in the same step. Do not add a second timer, collision or terminal authority.'+lesson('lifecycle-integrity','make core.terminal agree with state.outcome on the same step and let GameKit own result and restart transitions.'),
      action_feedback:'Every steering input moves the skimmer across a full lane with visible intermediate positions by70ms and150ms. A correct SURGE pulls the tunnel through the opening, bursts the gate edge, leaves a persistent mark and immediately reveals the next gate; a wrong SURGE visibly collides. Reduced motion uses an immediate geometry change plus a static cue.'+lesson('action-feedback','make the first legal action and each surge visibly distinct at intermediate and settled checkpoints.')
    },build_invariants,product_contract:pair.productContract,commercial_contract:pair.commercialContract
  };
  return {game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,controls:reflex?['Arrow keys parry the matching incoming direction.','Up and Down gates unlock in later waves.']:direct?['Arrow keys steer and intercept through the visible sky lanes.','Later waves unlock Up and Down movement bursts.']:['Arrow keys make the visible spatial decisions.','Space commits a solved round.'],mobile_controls:reflex?['Tap the large matching edge gate before the danger ring closes.','New edge gates unlock in waves two and three.']:direct?['Tap the large lane controls to steer and intercept.','Later waves unlock two faster movement controls.']:['Tap the large playfield decisions.','Tap the commit control only when the visible condition is met.'],max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:a.statePath},pointer:{observation:a.statePath},terminal_ms:50000},implementation_contract:{first_ten_seconds:reflex?'Start immediately sends a bright directional signal toward the matching edge gate; pressing Right parries the reviewed opening threat, bursts it at the shield and launches the next threat within one second.':direct?'Start immediately launches a visibly descending comet above three full-height lanes; the first steer moves the catcher and trail within one second, and moving into the comet lane catches it inside ten seconds.':'Start reveals the complete playfield immediately; the first legal decision visibly moves the central composition and plays a short tactile cue within one second.',tension_curve:reflex?'Wave one presents two horizontal parries with a seven-second deadline each, wave two requires four three-direction parries at five-and-a-half seconds, and wave three requires six four-direction parries at four-and-a-half seconds. The visible danger ring must read state.danger from the trusted core.':direct?'Wave one teaches left and right interception, wave two widens the sky and unlocks BURST SHIFT, and wave three adds a fifth lane plus PHASE CUT while increasing visible descent pressure.':'Round one teaches one useful choice, round two combines choices under visible pressure, and round three demands the full reviewed route before a whole-playfield payoff.',mastery_hook:reflex?'Players improve by reading direction sooner, avoiding one-beat wrong-direction recovery and preserving the deadline bonus across twelve parries.':direct?'Players improve by reading the comet lane earlier, choosing the shortest movement skill and catching three waves with fewer steering inputs.':'Players improve by reading the visible target faster and completing the same deterministic seed with fewer unnecessary reversible decisions.',replay_hook:'Replay repeats the same seed so the player can beat the device-local best through cleaner decisions rather than luck or hidden variation.',sensory_payoff:'Use factory FeelFX burst, pulse, float text or bounded shake for legal decisions and commits; GameKit supplies distinct action, progress, success and failure SFX with a visible mute control.',goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Complete three meaningful rounds through the original '+bp.family_id+' mechanic.'+lesson('lifecycle-integrity','implement every reviewed seed success route before visual polish and prove the third legal commit reaches success immediately.'),progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. '+(reflex?'The protected ReflexKit core owns all parry, timer, score and terminal transitions; present its snapshot without recreating or overriding those decisions.':direct?'Every movement enters its destination lane immediately; entering the target lane increments completed once, launches the next wave and the third catch succeeds in the same step.':'A legal commit increments completed once, resets the next round state and the third legal commit immediately succeeds.')+lesson('progress-readability','make every completed round change both the numeric progress and persistent playfield structure.'),presentation:(reflex?'Use Phaser 4 Game Objects for a central shield, large four-sided gates, an incoming signal whose position is derived from state.danger, a visibly shrinking danger ring and twelve persistent parry marks. ':direct?'Use Phaser 4 Game Objects for a tall moving sky, a clearly descending comet with trail, a catcher that visibly crosses lanes, horizon pressure and persistent catch constellations. ':'Use Phaser 4 Game Objects and the factory-owned scene.playjoltFeel feedback primitives. Give each decision a large spatial consequence, retain completed-round marks and make the final playfield visibly complete. ' )+'Use factory-owned scene.playjoltFeel feedback primitives and keep Phaser presentation-only.'+lesson('state-distinction','make successive decision states distinguishable by geometry, not labels or color alone.'),originality:lineage+' The mechanic, code, names, art, layout, scoring, levels and presentation must be original to PlayJolt. This is not permission to recreate an observed title under another skin.',difficulty:'Implement the reviewed finite-state rules and rule table exactly and expose '+model.projection.join(', ')+'. The success routes are validation examples, not hidden autoplay. quality.stage is the round/stage, quality.complexity strictly increases each round, quality.objective_progress is completed, quality.meaningful_actions counts only projection-changing legal actions, and quality.reversible_state_key joins the reviewed projection.'+lesson('difficulty-progression','make later rounds observably harder while preserving the exact reachable Oracle path for every seed.'),mobile_readability:'At 390x844 keep objective, progress, current score, device best, the full decision field, result, Replay and replay reason in the first viewport. Use large geometry, at least14px critical labels and at least44px lifecycle controls.'+lesson('mobile-hierarchy','make the active choice and current goal dominate the mobile viewport without hiding lifecycle controls.')+lesson('input-parity','use only the exact named input.actions bindings so every reviewed keyboard action and touch region changes the same canonical projection.'),result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. Success transforms the full '+bp.theme.arena+' into a stable complete composition; failure visibly loses structure. CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.'+lesson('result-presentation','make terminal success and failure unmistakable through whole-playfield composition, not a text overlay alone.')+lesson('lifecycle-integrity','keep the result and primary Replay control visible for both success and failure without a second lifecycle.'),reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode uses bounded movement and settlement; reduced mode changes geometry instantly and preserves a strong static state-change cue for at least300ms. GamePresentation.reduced_motion reports the actual behavior.'+lesson('reduced-motion','prove the live preference change and retain a strong non-animated spatial cue.'),scoring:reflex?'The trusted core awards score only for a correct direct parry, scales reward by wave and remaining deadline, and awards zero for wrong inputs, recovery and waiting. Present finite tick, score, progress, interactions and bounded entities from its snapshot.':direct?'Award score only when movement directly catches a comet, with larger later-wave rewards and a small efficiency bonus. Other steering and waiting award zero. Expose finite tick, score, progress, interactions and bounded entities.':'Award score only when a legal commit completes a round, with larger later-round rewards and a small efficiency bonus. Individual reversible choices, waiting and blocked commits award zero. Expose finite tick, score, progress, interactions and bounded entities.',completion_timing:reflex?'ReflexKit advances tick, deadline and danger through GameKit steps. Waiting past the current deadline fails immediately; the twelfth correct parry succeeds in the same step. Do not add a second timer, collision or terminal authority.':'Tick advances only through GameKit. At 2700 ticks set failure unless success occurs on that exact step. Success and failure become terminal immediately with no artificial waiting.'+lesson('lifecycle-integrity','make core.terminal agree with state.outcome on the same step and let GameKit own result and restart transitions.'),action_feedback:(reflex?'Every correct parry drives the incoming signal into the matching shield gate, bursts at impact, leaves a persistent mark and immediately reveals the next direction. A wrong parry must visibly crack the chosen gate for one recovery beat while state.miss is nonzero. ':direct?'Every steering input moves the catcher and trail across the full lane width with visible intermediate positions by70ms and150ms and settlement by450ms. Entering the target lane must collide comet and catcher geometry, burst the comet, leave a constellation mark and launch the next descending wave. ':'Every legal choice has a distinct before, intermediate and settled spatial state by450ms. A legal commit changes the whole composition and leaves a persistent round marker. ')+'Reduced motion uses an immediate geometry change plus a static cue.'+lesson('action-feedback','make the first legal action and each commit visibly distinct at intermediate and settled checkpoints.')},build_invariants,product_contract:pair.productContract,commercial_contract:pair.commercialContract};
}
function appendRegistry(file,entry){const data=readJSON(file);data.entries=data.entries.filter(x=>x.id!==entry.id);data.entries.push(entry);atomicJSON(file,data);fs.chmodSync(file,0o644);}
function installReviewData(bp,model,pc,cc){
  const oracleId=bp.slug+'-oracle-v1',oracleFile=path.join(ROOT,'qa/reviewed/'+oracleId+'.json');atomicJSON(oracleFile,model);fs.chmodSync(oracleFile,0o644);
  appendRegistry(path.join(ROOT,'qa/reviewed/registry.json'),{id:oracleId,file:oracleId+'.json',sha256:hash(model),scope:'candidate',game_id:bp.game_id,contract_sha256:hash(pc),reviewed_by:'PlayJolt Foundry family reviewer',rationale:'Reviewed finite-state '+bp.family_id+' model with bounded nodes, deterministic multi-seed success paths, exact action edges and no production authority.'});
  appendRegistry(path.join(ROOT,'qa/commercial/reviewed/registry.json'),{id:bp.slug+'-commercial-v1',scope:'candidate',contract_sha256:hash(cc),product_contract_sha256:hash(pc),reviewed_by:'PlayJolt Foundry family reviewer',rationale:'Reviewed family-specific visual states, action feedback, progression, result, mobile hierarchy and performance evidence.'});
  product.review(pc);commercial.review(cc,pc);
}
function load(dir){return validateBlueprint(readJSON(path.join(path.resolve(dir),'blueprint.json')));}
async function prepare(dir){
  const bp=load(dir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!root||!process.env.RUNNER_TEMP||!root.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep))throw Error('dedicated_runner_root_required');
  fs.rmSync(root,{recursive:true,force:true});fs.mkdirSync(root,{recursive:true});const model=buildModel(bp),p=proposalFor(bp,model);installReviewData(bp,model,p.product_contract,p.commercial_contract);
  const gate=validateProposal(p,{policy:readJSON(path.join(ROOT,'commissioning/policy.json')),catalog:readJSON(path.join(ROOT,'commissioning/catalog.json'))});if(!gate.passed)throw Error('spec_gate_failed '+JSON.stringify(gate.errors));
  const settings={commissioning:true,release_candidates:false,base_ref:'main',pricing:{input_per_million:4,output_per_million:18,as_of:'2026-09-26'},per_game:{max_provider_calls:6,max_input_tokens:500000,max_output_tokens:120000,max_estimated_cost:2,max_wall_clock_minutes:60},global:{daily_provider_call_limit:6,daily_cost_limit:2,max_concurrent_builds:1},request:{max_input_tokens:100000,max_output_tokens:20000,timeout_ms:300000,max_response_bytes:1048576,max_file_bytes:131072,max_files:24},isolation:{cpus:1,memory_mb:1024,pids:128,timeout_ms:300000},polling:{interval_ms:2000,max_backoff_ms:30000,max_polls:20,max_jobs:1}};
  const cp=JSON.parse(JSON.stringify(readJSON(path.join(ROOT,'control-plane/policy.json'))));Object.assign(cp,{mode:'autonomous-foundry-v2',intake_enabled:true,auto_rc_enabled:false,max_active_jobs:1,max_daily_new_jobs:1});Object.assign(cp.kill_switches,{release_candidates:true,production_shipping:true,marketing_promotion:true});
  const auth={schema:'playjolt-foundry-authorization/1',game_id:bp.game_id,model:'gpt-5.6-terra',user_authorized:true,authorization_basis:'Owner authorized the learning Foundry with one market-benchmark lane per two candidates. Public market evidence may transfer abstract product principles only; copying is forbidden. Build1 + repair5, provider calls <=6, estimated cost <=USD2, Production unauthorized.',max_generations:6,max_repairs:5,estimated_usd_ceiling:2,production_authorized:false,base_commit:process.env.GITHUB_SHA||'main'};
  for(const [name,data] of Object.entries({'proposal.json':p,'spec-gate.json':gate,'worker-config.json':settings,'control-policy.json':cp,'authorization.json':auth,'oracle.json':model}))atomicJSON(path.join(root,name),data);
  await new Factory({store:new FileStore(root)}).create(gate.factory_spec);console.log(JSON.stringify({preflight:'PASS',game_id:bp.game_id,title:bp.title,foundry:bp.foundry,runtime:'Phaser 4.2.1 + GameKit v3 + Feel Kit',oracle_hash:hash(model),product_hash:hash(p.product_contract),commercial_hash:hash(p.commercial_contract),warnings:gate.warnings},null,2));
}
function reviews(dir){const bp=load(dir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');const model=buildModel(bp),p=proposalFor(bp,model),stored=readJSON(path.join(root,'proposal.json'));if(stored.game_id!==bp.game_id||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(p.product_contract)||hash(stored.commercial_contract)!==hash(p.commercial_contract))throw Error('recovery_contract_mismatch');installReviewData(bp,model,p.product_contract,p.commercial_contract);console.log(JSON.stringify({reviews:'PASS',game_id:bp.game_id,family:bp.family_id,lane:bp.lane,runtime:'Phaser 4.2.1',permissions:'0644'},null,2));}
async function run(dir){const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json'));const result=await new AutonomousWorker({root,settings,policyFile:path.join(root,'control-policy.json'),provider:new OpenAIProvider(),qa:new DockerQA({limits:settings.isolation})}).runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;}
async function preview(dir){const bp=load(dir),result=await continuePreview(process.env.FACTORY_WORKER_ROOT,bp.game_id);console.log(JSON.stringify({schema:'playjolt-preview-continuation/1',game_id:bp.game_id,state:result.state,preview_url:result.preview_url||null,rc_commit:result.rc_commit||null,base_commit:result.base_commit||null,production_authorized:false},null,2));}
function releasePacket(dir){const bp=load(dir);console.log(JSON.stringify(writeReleasePacket(process.env.FACTORY_WORKER_ROOT,bp.game_id),null,2));}
function summarize(dir){const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};const ops=Object.values(ledger.operations).filter(x=>x.game_id===bp.game_id).sort((a,b)=>a.started_at-b.started_at).map(o=>({operation_id:o.operation_id,version:o.version,state:o.state,response_id:o.response_id,input_tokens:o.accounted?.input_tokens??null,output_tokens:o.accounted?.output_tokens??null,estimated_cost:(o.accounted||o.reserved)?.estimated_cost??null,error_code:o.error_code||null}));const file=path.join(root,'autonomy/jobs',bp.game_id,'manifest.json'),total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);if(!fs.existsSync(file)){console.log(JSON.stringify({schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,foundry:bp.foundry,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:null,production_authorized:false},null,2));return;}const m=readJSON(file),summary={schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,signature:bp.design_id,foundry:bp.foundry,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,preview_url:m.preview_url||null,rc_commit:m.rc_commit||null,base_commit:m.base_commit||null,failure_reasons:m.failure_reasons},production_authorized:false};atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));}
async function main(dir,cmd=process.argv[2]){if(cmd==='prepare')return prepare(dir);if(cmd==='reviews')return reviews(dir);if(cmd==='run')return run(dir);if(cmd==='preview')return preview(dir);if(cmd==='release-packet')return releasePacket(dir);if(cmd==='summarize')return summarize(dir);throw Error('usage prepare|reviews|run|preview|release-packet|summarize');}
module.exports={validateBlueprint,buildModel,buildInvariants,contracts,proposalFor,installReviewData,main};
