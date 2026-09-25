'use strict';
const {hash}=require('../orchestrator/files.cjs');
const product=require('../qa/product-contract.cjs');

const id=v=>v.join(':');
const region=(x,y,width,height)=>({selector:'[data-game-canvas]',x,y,width,height});
const anchor=(node,r)=>({node,region:r});
const commonMobile=(regions)=>({
  critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],
  control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],
  canvas_selector:'[data-game-canvas]',canvas_control_regions:regions,min_font_px:14,min_hit_target_px:44
});
function graphFrom(initial,transition){
  const nodes={},queue=[initial];
  for(let i=0;i<queue.length;i++){
    const values=queue[i],key=id(values);if(nodes[key])continue;
    const raw=transition(values);
    nodes[key]={values,stage:values[0],...(values.at(-1)==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};
    for(const edge of raw)if(!nodes[id(edge.values)])queue.push(edge.values);
  }
  return {initial:id(initial),nodes};
}
function binaryBeacon(def){
  const seeds=def.seeds,pack=seed=>(seed>>>0)%2,active=stage=>stage+1;
  const bit=(mask,index)=>(mask>>index)&1;
  const setBit=(mask,index,value)=>value?(mask|(1<<index)):(mask&~(1<<index));
  const target=(p,stage)=>{let mask=0;for(let i=0;i<active(stage);i++)if((p+i+stage)%2)mask|=1<<i;return mask;};
  const initialMask=(p,stage)=>target(p,stage)^((1<<active(stage))-1);
  const transition=p=>v=>{
    const [stage,cursor,mask,outcome]=v;if(outcome!=='playing')return [];
    const n=active(stage),edges=[
      {action:'left',values:[stage,(cursor+n-1)%n,mask,outcome]},
      {action:'right',values:[stage,(cursor+1)%n,mask,outcome]},
      {action:'up',values:[stage,cursor,setBit(mask,cursor,1),outcome]},
      {action:'down',values:[stage,cursor,setBit(mask,cursor,0),outcome]}
    ];
    if(mask===target(p,stage))edges.push(stage<3?{action:'lock',values:[stage+1,0,initialMask(p,stage+1),'playing']}:{action:'lock',values:[4,0,0,'success']});
    return edges;
  };
  const model={schema_version:1,projection:['state.stage','state.cursor','state.mask','state.outcome'],seeds:{}};
  for(const seed of seeds){const p=pack(seed);model.seeds[String(seed)]=graphFrom([1,0,initialMask(p,1),'playing'],transition(p));}
  product.validateModel(model);
  const oracleId=def.slug+'-oracle-v1',commercialId=def.slug+'-commercial-v1',p0=pack(seeds[0]);
  const s1=initialMask(p0,1),s2=initialMask(p0,2),s3=initialMask(p0,3),t1=target(p0,1);
  const changeAction=bit(s1,0)===0?'up':'down',returnAction=changeAction==='up'?'down':'up';
  const changed=setBit(s1,0,changeAction==='up'?1:0);
  const actions={
    left:{key:'ArrowLeft',touch:{x:.10,y:.68},hold_ms:35,settle_ms:35},
    right:{key:'ArrowRight',touch:{x:.30,y:.68},hold_ms:35,settle_ms:35},
    up:{key:'ArrowUp',touch:{x:.50,y:.68},hold_ms:35,settle_ms:35},
    down:{key:'ArrowDown',touch:{x:.70,y:.68},hold_ms:35,settle_ms:35},
    lock:{key:'Space',touch:{x:.90,y:.68},hold_ms:35,settle_ms:35}
  };
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:def.objective},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'TIERS {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','right'],[changeAction,returnAction]],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:def.success_text,failure_text:def.failure_text,max_terminal_latency_ms:100,failure_wait_ms:48000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:oracleId,oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:commonMobile([{x:0,y:.54,width:.2,height:.34},{x:.2,y:.54,width:.2,height:.34},{x:.4,y:.54,width:.2,height:.34},{x:.6,y:.54,width:.2,height:.34},{x:.8,y:.54,width:.2,height:.34}]),
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:changeAction,state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions
  };
  const commercialContract={
    schema_version:1,review_id:commercialId,seed:seeds[0],
    visual_legibility:{pairs:[{id:'active-future-pylon',kind:'action_availability',a:anchor(id([1,0,s1,'playing']),region(.04,.29,.19,.31)),b:anchor(id([1,0,s1,'playing']),region(.77,.29,.19,.31)),action_a:changeAction,action_b:'lock',marker:'An active pylon is solid and luminous with a target ghost and selector-capable base ring; a future pylon is an empty recessed plinth with a broken outline.'}]},
    state_distinction:{pairs:[{id:'pylon-low-high',kind:'state',a:anchor(id([1,0,s1,'playing']),region(.04,.23,.22,.39)),b:anchor(id([1,0,changed,'playing']),region(.04,.23,.22,.39)),state_path:'state.mask',marker:'Changing the selected pylon visibly moves its cap between strongly separated LOW and HIGH geometry and changes the vertical energy column, not only text or color.'}]},
    action_feedback:{probes:[
      {id:'tune-pylon',node:id([1,0,s1,'playing']),action:changeAction,kind:'movement',region:region(.02,.20,.25,.45)},
      {id:'move-selector',node:id([1,0,s1,'playing']),action:'right',kind:'movement',region:region(.02,.42,.50,.22)},
      {id:'forge-tier',node:id([1,0,t1,'playing']),action:'lock',kind:'unlock',region:region(0,.03,1,.43)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor(id([1,0,s1,'playing']),region(0,.03,1,.48)),anchor(id([2,0,s2,'playing']),region(0,.03,1,.48)),anchor(id([3,0,s3,'playing']),region(0,.03,1,.48))],marker:'The scene expands from two to three to four active pylons; each completed tier leaves a persistent energy ring and enlarges the central crown structure.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:def.success_text,failure_title:def.failure_text},
    audio:{mode:'reviewed_silence',exception:'This reviewed family intentionally stays silent so large spatial motion, touch equivalence, reduced-motion behavior and repair quality are evaluated without adding an audio failure surface.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'active',foreground:region(.05,.29,.18,.29),background:region(.05,.60,.18,.05)},{role:'goal',foreground:region(.40,.08,.20,.13),background:region(.40,.23,.20,.05)}]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and complete all three tiers with fewer cursor moves and height corrections.'},
    performance:{sample_ms:1200}
  };
  const ruleData={seed_mapping:'target parity = seed % 2',stage_widths:[2,3,4],heights:[0,1],transform_rule:'LEFT and RIGHT wrap the selected active pylon. UP sets only the selected pylon HIGH and DOWN sets only it LOW. Changed UP/DOWN actions have the opposite return; LEFT/RIGHT are cursor inverses. LOCK changes state only when all active pylons match the seeded target.',target_rule:'Each stage starts at the exact active-bit complement of its target, forcing one real correction per active pylon. Correct LOCK advances the stage; stage3 LOCK succeeds.'};
  const proposal={
    game_id:def.game_id,generation:1,title:def.title,slug:def.slug,genre:'phaser binary pylon tuning puzzle',mechanic_family:def.mechanic_family,
    controls:['Arrow keys select and tune the active pylon.','Space commits the tier when every pylon matches.'],
    mobile_controls:['Tap LEFT/RIGHT and UP/DOWN to tune the selected pylon.','Tap COMMIT when all active pylons match their ghosts.'],
    max_repair_attempts:5,qa:{seed:seeds[0],keyboard:{key:changeAction==='up'?'ArrowUp':'ArrowDown',observation:'state.mask'},pointer:{observation:'state.mask'},terminal_ms:52000},
    implementation_contract:{
      goal:'Show the exact objective "'+def.objective+'" before Start and keep it visible. Each stage shows 2, then 3, then 4 active pylons with large non-text ghost target heights. Select a pylon, tune LOW/HIGH to the target and commit only when all active pylons match.',
      progression:'Canonical state starts stage=1, cursor=0, outcome="playing", completed=0, with mask equal to the active-bit complement of the seeded target. LEFT/RIGHT wrap selection, UP sets HIGH, DOWN sets LOW. Correct COMMIT loads the next complement target and advances stage; stage3 succeeds immediately. meaningful_actions increments only for reviewed projection-changing edges.',
      presentation:'Use Phaser 4 through factory-owned PlayJoltPhaserKit only. Build an original '+def.visual_theme+' with four large pylon plinths, two strongly separated LOW/HIGH heights, a bright selector ring, translucent target ghosts and persistent completion rings. Height changes must move large geometry vertically and selector changes must visibly move a halo.',
      originality:'This candidate uses seeded LOW/HIGH pylon tuning with a movable selector and explicit per-stage target complement. It is not pulse weaving, optical routing, cargo assignment, row/column cycling, merge, reaction, survival, auto-running or single-button timing.',
      difficulty:'Implement this reviewed rule data exactly: '+JSON.stringify(ruleData)+' Stage widths are 2,3,4 and every active pylon starts wrong, so later stages require strictly more consequential corrections. quality.stage=state.stage; quality.complexity=active pylon count; quality.objective_progress=completed; quality.reversible_state_key is stage:cursor:mask:outcome.',
      mobile_readability:'At 390x844 keep objective, TIERS progress, current score, device best, target ghosts, active pylons, command zones, result, Replay and replay reason in the first viewport. Critical DOM labels are at least14px and lifecycle controls at least44px.',
      result:'Success text is exactly '+def.success_text+' and failure text exactly '+def.failure_text+'. Success creates a large non-text central transformation and persistent completion rings; failure visibly retracts and fractures the structure. Keep CURRENT SCORE, DEVICE BEST and primary Replay visible on mobile.',
      reduced_motion:'Honor initial and live prefers-reduced-motion. GamePresentation.reduced_motion must track actual visible behavior. Normal mode uses pylon/selector tweens; reduced mode changes geometry instantly but adds a strong static outline or cap flare for at least300ms and removes camera travel.',
      scoring:'Start score0. Award points only on successful stage COMMIT, with bonuses reduced by unnecessary actions. Individual height changes, cursor moves, waiting and blocked COMMIT never award score by themselves. observe returns finite tick, score, progress, interactions and bounded entities.',
      completion_timing:'Use a 48-second stall deadline from GameKit ticks. Success or failure sets terminal immediately with no artificial post-success delay.',
      action_feedback:'Every valid height correction immediately marks the selected pylon, shows a large visible intermediate transition around70ms and150ms and settles by450ms. Cursor moves visibly move the selector. Correct COMMIT leaves a persistent completion ring. Reduced mode uses instant geometry plus a strong static flare.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
  return {model,productContract,commercialContract,proposal,oracle_id:oracleId,commercial_id:commercialId};
}
function decodeOrder(s){return String(s).split('').map(Number);}
function encodeOrder(a){return a.join('');}
function rotate(a,n){const k=((n%a.length)+a.length)%a.length;return a.slice(k).concat(a.slice(0,k));}
function swapAt(order,index){const a=decodeOrder(order),t=a[index];a[index]=a[index+1];a[index+1]=t;return encodeOrder(a);}
function orderFamily(def){
  const seeds=def.seeds,pack=(seed,n)=>(seed>>>0)%n,target=(p,n)=>encodeOrder(rotate([...Array(n).keys()],p)),initial=(p,n)=>encodeOrder(decodeOrder(target(p,n)).reverse());
  const transition=p=>v=>{
    const [stage,cursor,order,outcome]=v;if(outcome!=='playing')return [];
    const n=stage+1,slots=Math.max(1,n-1),edges=[
      {action:'left',values:[stage,(cursor+slots-1)%slots,order,outcome]},
      {action:'right',values:[stage,(cursor+1)%slots,order,outcome]},
      {action:'swap',values:[stage,cursor,swapAt(order,cursor),outcome]}
    ];
    if(order===target(p,n))edges.push(stage<3?{action:'lock',values:[stage+1,0,initial(p,stage+2),'playing']}:{action:'lock',values:[4,0,'','success']});
    return edges;
  };
  const model={schema_version:1,projection:['state.stage','state.cursor','state.order','state.outcome'],seeds:{}};
  for(const seed of seeds){const p=pack(seed,4);model.seeds[String(seed)]=graphFrom([1,0,initial(p,2),'playing'],transition(p));}
  product.validateModel(model);
  const oracleId=def.slug+'-oracle-v1',commercialId=def.slug+'-commercial-v1',p0=pack(seeds[0],4);
  const s1=initial(p0,2),s2=initial(p0,3),s3=initial(p0,4),t1=target(p0,2),swapped=swapAt(s1,0);
  const actions={
    left:{key:'ArrowLeft',touch:{x:.12,y:.70},hold_ms:35,settle_ms:35},
    right:{key:'ArrowRight',touch:{x:.37,y:.70},hold_ms:35,settle_ms:35},
    swap:{key:'Space',touch:{x:.62,y:.70},hold_ms:35,settle_ms:35},
    lock:{key:'ArrowUp',touch:{x:.87,y:.70},hold_ms:35,settle_ms:35}
  };
  const productContract={
    schema_version:1,
    objective:{visible_selector:'[data-objective]',expected_text:def.objective},
    progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'ROWS {value} / 3',milestones:[1,2,3]},
    score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['left','right'],['swap','swap']],no_progress_probes:[['lock']]},
    best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
    completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:def.success_text,failure_text:def.failure_text,max_terminal_latency_ms:100,failure_wait_ms:50000,failure_actions:[]},
    replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
    difficulty:{deterministic_seeds:seeds,oracle_id:oracleId,oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
    mobile:commonMobile([{x:0,y:.55,width:.25,height:.34},{x:.25,y:.55,width:.25,height:.34},{x:.50,y:.55,width:.25,height:.34},{x:.75,y:.55,width:.25,height:.34}]),
    reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
    feedback:{action:'swap',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},
    actions
  };
  const commercialContract={
    schema_version:1,review_id:commercialId,seed:seeds[0],
    visual_legibility:{pairs:[{id:'selected-swap-boundary',kind:'action_availability',a:anchor(id([1,0,s1,'playing']),region(.08,.34,.38,.25)),b:anchor(id([1,0,s1,'playing']),region(.58,.34,.30,.25)),action_a:'swap',action_b:'lock',marker:'The selected adjacent pair has a bright spanning bracket and two solid token plates; inactive/future positions are visibly recessed and unbracketed.'}]},
    state_distinction:{pairs:[{id:'order-before-after-swap',kind:'state',a:anchor(id([1,0,s1,'playing']),region(.07,.27,.48,.35)),b:anchor(id([1,0,swapped,'playing']),region(.07,.27,.48,.35)),state_path:'state.order',marker:'SWAP physically exchanges two large token plates and their distinct non-text glyphs; the order change remains obvious with all DOM text masked.'}]},
    action_feedback:{probes:[
      {id:'swap-motion',node:id([1,0,s1,'playing']),action:'swap',kind:'movement',region:region(.05,.24,.52,.40)},
      {id:'selector-motion',node:id([2,0,s2,'playing']),action:'right',kind:'movement',region:region(.05,.45,.62,.20)},
      {id:'seal-row',node:id([1,0,t1,'playing']),action:'lock',kind:'unlock',region:region(0,.03,1,.43)}
    ]},
    motion:{intermediate_ms:[70,150],settle_ms:450},
    progression_spectacle:{checkpoints:[anchor(id([1,0,s1,'playing']),region(0,.03,1,.48)),anchor(id([2,0,s2,'playing']),region(0,.03,1,.48)),anchor(id([3,0,s3,'playing']),region(0,.03,1,.48))],marker:'The board grows from two to three to four large token plates; each completed row leaves a persistent seal band and adds denser frame geometry.'},
    result_presentation:{region:region(0,.80,1,.20),success_title:def.success_text,failure_title:def.failure_text},
    audio:{mode:'reviewed_silence',exception:'This reviewed family intentionally stays silent so spatial swap readability, touch equivalence, reduced motion and integrated repair quality are isolated.'},
    mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'active',foreground:region(.08,.31,.42,.28),background:region(.08,.60,.42,.05)},{role:'goal',foreground:region(.34,.08,.32,.13),background:region(.34,.23,.32,.05)}]},
    replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and seal all three rows with fewer cursor moves and swaps.'},
    performance:{sample_ms:1200}
  };
  const proposal={
    game_id:def.game_id,generation:1,title:def.title,slug:def.slug,genre:'phaser adjacent-order puzzle',mechanic_family:def.mechanic_family,
    controls:['Left/Right selects an adjacent pair; Space swaps it.','Up commits the row when the order matches.'],
    mobile_controls:['Tap LEFT/RIGHT then SWAP to reorder the large tokens.','Tap COMMIT when the whole row matches the target.'],
    max_repair_attempts:5,qa:{seed:seeds[0],keyboard:{key:'Space',observation:'state.order'},pointer:{observation:'state.order'},terminal_ms:54000},
    implementation_contract:{
      goal:'Show the exact objective "'+def.objective+'" before Start and keep it visible. Stages contain 2, then 3, then 4 large glyph tokens. The player moves an adjacent-pair selector and swaps neighbors until the visible order matches the target strip, then commits the row.',
      progression:'Canonical state starts stage=1,cursor=0,outcome="playing",completed=0 with each stage order equal to the reverse of its seeded target. LEFT/RIGHT wrap across adjacent-pair positions, SWAP exchanges exactly the selected neighbors and is self-inverse, blocked COMMIT changes nothing, correct COMMIT advances the stage and stage3 succeeds immediately.',
      presentation:'Use Phaser 4 through factory-owned PlayJoltPhaserKit only. Build an original '+def.visual_theme+' with large token plates, distinct geometric glyphs, a spanning selected-pair bracket, a target strip above and persistent sealed-row bands. SWAP must physically cross the two plates along visible arcs; selector changes must visibly move the bracket.',
      originality:'This candidate uses adjacent-token order reconstruction with a movable pair selector and seeded target permutations. It is not binary pylon tuning, pulse weaving, optical routing, cargo assignment, row/column cycling, merge, reaction, survival, auto-running or single-button timing.',
      difficulty:'Stage widths are 2,3,4 tokens. Reverse-order starts require increasingly more adjacent swaps and selector choices. quality.stage=state.stage; quality.complexity=active token count; quality.objective_progress=completed; quality.meaningful_actions increments only for reviewed projection-changing edges; quality.reversible_state_key is stage:cursor:order:outcome.',
      mobile_readability:'At 390x844 keep objective, ROWS progress, score, best, target strip, large tokens, four command zones, result, Replay and replay reason in the first viewport. Required DOM text is at least14px and lifecycle controls at least44px.',
      result:'Success text is exactly '+def.success_text+' and failure text exactly '+def.failure_text+'. Success joins all glyphs into a large non-text completed emblem with persistent seal bands; failure visibly breaks the frame. Keep score, best and Replay visible on mobile.',
      reduced_motion:'Honor initial and live prefers-reduced-motion. Normal mode animates token crossing and selector glide; reduced mode swaps instantly but shows a strong static bracket/glyph flare for at least300ms and reports presentation.reduced_motion accurately.',
      scoring:'Award score only on successful row COMMIT, reduced by unnecessary cursor moves/swaps. Reversible swaps, navigation, waiting and blocked COMMIT never directly farm score.',
      completion_timing:'Use a 50-second GameKit-tick stall deadline. Success/failure becomes terminal immediately with no artificial post-success waiting.',
      action_feedback:'Every SWAP visibly changes the selected local region with before/intermediate/settled frames around70ms/150ms/450ms. Selector movement is also visible. Correct COMMIT leaves a persistent sealed-row band; reduced mode uses instant geometry plus a static flare.'
    },
    product_contract:productContract,commercial_contract:commercialContract
  };
  return {model,productContract,commercialContract,proposal,oracle_id:oracleId,commercial_id:commercialId};
}
function build(def){
  if(def.family==='binary-pylon')return binaryBeacon(def);
  if(def.family==='adjacent-order')return orderFamily(def);
  throw Error('unknown trusted candidate family');
}
module.exports={build,binaryBeacon,orderFamily};
