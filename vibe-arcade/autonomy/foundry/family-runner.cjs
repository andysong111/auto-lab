'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {hash,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {validateProposal}=require('../commissioning/spec-gate.cjs');
const product=require('../qa/product-contract.cjs'),commercial=require('../qa/commercial/contract.cjs');
const {Factory}=require('../orchestrator/engine.cjs'),{FileStore}=require('../orchestrator/store.cjs');
const {AutonomousWorker}=require('../worker/runtime.cjs'),{DockerQA}=require('../isolation/docker-qa.cjs'),{OpenAIProvider}=require('../providers/openai.cjs');
const {continuePreview,writeReleasePacket}=require('../commissioning/rc-continuation.cjs');
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/,SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEARNING_FOCUS=new Set(['difficulty-progression','progress-readability','result-presentation','action-feedback','reduced-motion','mobile-hierarchy','state-distinction']);
const FAMILY_IDS=new Set(['kinetic-balance','pressure-allocation','signal-composition','trajectory-interception','echo-routing','cadence-buffering']);
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
function adapter(bp,seed){
  const adapters={'kinetic-balance':balanceAdapter,'pressure-allocation':allocationAdapter,'signal-composition':signalAdapter,'trajectory-interception':interceptionAdapter,'echo-routing':routingAdapter,'cadence-buffering':cadenceAdapter};
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
  return {lengthen_lead:{key:'ArrowUp',touch:{x:.18,y:.68},hold_ms:35,settle_ms:35},rotate_buffer:{key:'ArrowRight',touch:{x:.42,y:.68},hold_ms:35,settle_ms:35},reverse_buffer:{key:'ArrowLeft',touch:{x:.66,y:.68},hold_ms:35,settle_ms:35},release_bar:{key:'Space',touch:{x:.88,y:.68},hold_ms:35,settle_ms:35}};
}
function contracts(input,model){
  const bp=validateBlueprint(input),seed=bp.seeds[0],a=adapter(bp,seed),g=model.seeds[String(seed)],success=route(model,seed),nodes=success.nodes;
  const first=g.nodes[g.initial].edges.find(x=>x.action===a.firstAction)||g.nodes[g.initial].edges[0],afterFirst=first.to;
  const checkpoints=[1,2,3].map(stage=>nodes.find(id=>g.nodes[id]?.stage===stage)).map(x=>anchor(x,region(0,.05,1,.55)));
  const beforeCommit=nodes.find(id=>g.nodes[id]?.edges.some(x=>x.action===a.commitAction))||g.initial;
  const objectives={
    'kinetic-balance':'Balance three changing counterweight holds.',
    'pressure-allocation':'Feed three demand rounds without copying a grid or match mechanic.',
    'signal-composition':'Compose and lock three changing two-channel signal phrases.',
    'trajectory-interception':'Align gate and timing to intercept three deterministic arc waves.',
    'echo-routing':'Configure and mirror three switches to route three deterministic echoes.',
    'cadence-buffering':'Shape and release three ordered cadence buffers.'
  };
  const objective=objectives[bp.family_id];
  const productContract={schema_version:1,objective:{visible_selector:'[data-objective]',expected_text:objective},progress:{selector:'[data-product-progress]',state_path:a.objectiveProgress,format:bp.theme.progress+' {value} / 3',milestones:[1,2,3]},score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[a.reversibleProbe],no_progress_probes:[[a.commitAction]]},best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:bp.theme.success,failure_text:bp.theme.failure,max_terminal_latency_ms:100,failure_wait_ms:45000,failure_actions:[]},replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},difficulty:{deterministic_seeds:bp.seeds,oracle_id:bp.slug+'-oracle-v1',oracle_sha256:hash(model),projection:model.projection,stage_path:'quality.stage',complexity_path:a.complexity,meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:[{x:0,y:.50,width:.25,height:.40},{x:.25,y:.50,width:.25,height:.40},{x:.50,y:.50,width:.25,height:.40},{x:.75,y:.50,width:.25,height:.40}],min_font_px:14,min_hit_target_px:44},reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},feedback:{action:a.firstAction,state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:420},actions:actionMap(bp)};
  const commercialContract={schema_version:1,review_id:bp.slug+'-commercial-v1',seed,visual_legibility:{pairs:[{id:'primary-choice',kind:'action_availability',a:anchor(g.initial,region(.08,.24,.28,.28)),b:anchor(g.initial,region(.64,.24,.28,.28)),action_a:a.firstAction,action_b:a.commitAction,marker:'The immediately useful choice is visibly active while the commit control is visibly conditional.'}]},state_distinction:{pairs:[{id:'first-decision-state',kind:'state',a:anchor(g.initial,region(.06,.16,.88,.48)),b:anchor(afterFirst,region(.06,.16,.88,.48)),state_path:a.statePath,marker:'The first decision changes large playfield geometry, not only text, score or color.'}]},action_feedback:{probes:[{id:'first-decision',node:g.initial,action:first.action,kind:'movement',region:region(.05,.14,.90,.55)},{id:'commit-round',node:beforeCommit,action:a.commitAction,kind:'unlock',region:region(0,.03,1,.58)}]},motion:{intermediate_ms:[70,150],settle_ms:450},progression_spectacle:{checkpoints,marker:'Each completed round changes the whole playfield structure and leaves a persistent visible completion mark.'},result_presentation:{region:region(0,.80,1,.20),success_title:bp.theme.success,failure_title:bp.theme.failure},audio:{mode:'reviewed_silence',exception:'This first Foundry proof uses reviewed silence so the new mechanic, motion and reduced-motion evidence remain the only evaluated feedback surface.'},mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'active',foreground:region(.08,.24,.28,.28),background:region(.08,.58,.28,.05)},{role:'goal',foreground:region(.38,.08,.24,.12),background:region(.38,.22,.24,.05)}]},replay_motivation:{selector:'[data-replay-reason]',reason:'Replay the same seed and finish all three rounds with fewer unnecessary decisions.'},performance:{sample_ms:1200}};
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
  }
  return perSeed;
}
function proposalFor(input,model){
  const bp=validateBlueprint(input),pair=contracts(bp,model),market=bp.lane==='market-benchmark';
  const familyConfig={
    'kinetic-balance':{genre:'kinetic decision puzzle',key:'ArrowRight',rules:'A counterweight shifts one visible balance unit left or right within -2..2. HOLD is legal only at the reviewed seed-and-stage target; a successful hold changes leverage, resets balance to zero and advances the canopy.'},
    'pressure-allocation':{genre:'resource pressure strategy puzzle',key:'ArrowUp',rules:'NORTH and SOUTH each add one unit up to 3, EQUALIZE subtracts one unit from both when both are positive, and SEAL advances only when both visible reviewed demands are met; a successful seal resets both capacities to zero.'},
    'signal-composition':{genre:'signal composition puzzle',key:'ArrowLeft',rules:'PULSE A and PULSE B cycle their visible channels through 0..2, INVERT swaps every nonzero channel between 1 and 2, and LOCK PHRASE advances only when both reviewed target channels match; a successful lock resets both channels to zero.'},
    'trajectory-interception':{genre:'trajectory planning puzzle',key:'ArrowRight',rules:'SHIFT LEFT and SHIFT RIGHT cycle the visible gate through three positions, DELAY toggles early or late timing, and INTERCEPT advances only when gate and timing both match the reviewed wave target; a successful intercept resets gate and timing.'},
    'echo-routing':{genre:'network routing puzzle',key:'ArrowRight',rules:'NEXT SWITCH cycles the active node, TOGGLE SWITCH flips that node, MIRROR ROUTE swaps the outer switch states, and ROUTE ECHO advances only when the visible three-bit switch mask matches the reviewed target; a successful route resets the network.'},
    'cadence-buffering':{genre:'temporal sequencing puzzle',key:'ArrowUp',rules:'LENGTHEN LEAD cycles the first beat through 0..2, ROTATE BUFFER moves all three beats left, REVERSE BUFFER mirrors their order, and RELEASE BAR advances only when the ordered beat buffer matches the reviewed target; a successful release clears the buffer.'}
  }[bp.family_id];
  const rules=reviewedRuleData(bp,model),familyText=familyConfig.rules;
  const lineage=market?'Market benchmark lineage: '+bp.benchmark.publisher+' '+bp.benchmark.surface+' at '+bp.benchmark.url+'. Transfer only these abstract principles: '+bp.benchmark.transferable_principles.join('; ')+'. Forbidden copying: '+bp.copy_policy.forbidden.join('; ')+'.':'Original exploration lane with no external game used as a mechanic, art or layout template.';
  const focus=new Set(bp.learning_focus),lesson=(id,text)=>focus.has(id)?' Prior Factory outcomes require this correction: '+text:'';
  return {game_id:bp.game_id,generation:1,title:bp.title,slug:bp.slug,genre:familyConfig.genre,mechanic_family:bp.family_id+'-'+bp.design_id,controls:['Arrow keys make the visible spatial decisions.','Space commits a solved round.'],mobile_controls:['Tap the large playfield decisions.','Tap the commit control only when the visible condition is met.'],max_repair_attempts:5,qa:{seed:bp.seeds[0],keyboard:{key:familyConfig.key,observation:adapter(bp,bp.seeds[0]).statePath},pointer:{observation:adapter(bp,bp.seeds[0]).statePath},terminal_ms:50000},implementation_contract:{goal:'Show the exact objective "'+pair.objective+'" before Start and keep it visible. Complete three meaningful rounds through the original '+bp.family_id+' mechanic.',progression:familyText+' Implement this complete reviewed rule table exactly: '+JSON.stringify(rules)+'. A legal commit increments completed once, resets the next round state and the third legal commit immediately succeeds.'+lesson('progress-readability','make every completed round change both the numeric progress and persistent playfield structure.'),presentation:'Use Phaser 4 Game Objects, Graphics, Tweens, Particles and Camera effects through PlayJoltPhaserKit. Give each decision a large spatial consequence, retain completed-round marks and make the final playfield visibly complete. Phaser remains presentation-only.'+lesson('state-distinction','make successive decision states distinguishable by geometry, not labels or color alone.'),originality:lineage+' The mechanic, code, names, art, layout, scoring, levels and presentation must be original to PlayJolt. This is not permission to recreate an observed title under another skin.',difficulty:'Implement the reviewed finite-state rules and rule table exactly and expose '+model.projection.join(', ')+'. The success routes are validation examples, not hidden autoplay. quality.stage is the round/stage, quality.complexity strictly increases each round, quality.objective_progress is completed, quality.meaningful_actions counts only projection-changing legal actions, and quality.reversible_state_key joins the reviewed projection.'+lesson('difficulty-progression','make later rounds observably harder while preserving the exact reachable Oracle path for every seed.'),mobile_readability:'At 390x844 keep objective, progress, current score, device best, the full decision field, result, Replay and replay reason in the first viewport. Use large geometry, at least14px critical labels and at least44px lifecycle controls.'+lesson('mobile-hierarchy','make the active choice and current goal dominate the mobile viewport without hiding lifecycle controls.'),result:'Success text is exactly '+bp.theme.success+' and failure text exactly '+bp.theme.failure+'. Success transforms the full '+bp.theme.arena+' into a stable complete composition; failure visibly loses structure. CURRENT SCORE, DEVICE BEST and Replay remain visible on mobile.'+lesson('result-presentation','make terminal success and failure unmistakable through whole-playfield composition, not a text overlay alone.'),reduced_motion:'Honor initial and live prefers-reduced-motion changes. Normal mode uses bounded movement and settlement; reduced mode changes geometry instantly and preserves a strong static state-change cue for at least300ms. GamePresentation.reduced_motion reports the actual behavior.'+lesson('reduced-motion','prove the live preference change and retain a strong non-animated spatial cue.'),scoring:'Award score only when a legal commit completes a round, with larger later-round rewards and a small efficiency bonus. Individual reversible choices, waiting and blocked commits award zero. Expose finite tick, score, progress, interactions and bounded entities.',completion_timing:'Tick advances only through GameKit. At 2700 ticks set failure unless success occurs on that exact step. Success and failure become terminal immediately with no artificial waiting.',action_feedback:'Every legal choice has a distinct before, intermediate and settled spatial state by450ms. A legal commit changes the whole composition and leaves a persistent round marker. Reduced motion uses an immediate geometry change plus a static cue.'+lesson('action-feedback','make the first legal action and each commit visibly distinct at intermediate and settled checkpoints.')},product_contract:pair.productContract,commercial_contract:pair.commercialContract};
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
  await new Factory({store:new FileStore(root)}).create(gate.factory_spec);console.log(JSON.stringify({preflight:'PASS',game_id:bp.game_id,title:bp.title,foundry:bp.foundry,runtime:'Phaser 4.2.1 + GameKit v2',oracle_hash:hash(model),product_hash:hash(p.product_contract),commercial_hash:hash(p.commercial_contract),warnings:gate.warnings},null,2));
}
function reviews(dir){const bp=load(dir),root=path.resolve(process.env.FACTORY_WORKER_ROOT||'');if(!fs.existsSync(path.join(root,'proposal.json')))throw Error('recovered_worker_root_required');const model=buildModel(bp),p=proposalFor(bp,model),stored=readJSON(path.join(root,'proposal.json'));if(stored.game_id!==bp.game_id||hash(readJSON(path.join(root,'oracle.json')))!==hash(model)||hash(stored.product_contract)!==hash(p.product_contract)||hash(stored.commercial_contract)!==hash(p.commercial_contract))throw Error('recovery_contract_mismatch');installReviewData(bp,model,p.product_contract,p.commercial_contract);console.log(JSON.stringify({reviews:'PASS',game_id:bp.game_id,family:bp.family_id,lane:bp.lane,runtime:'Phaser 4.2.1',permissions:'0644'},null,2));}
async function run(dir){const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,settings=readJSON(path.join(root,'worker-config.json'));const result=await new AutonomousWorker({root,settings,policyFile:path.join(root,'control-policy.json'),provider:new OpenAIProvider(),qa:new DockerQA({limits:settings.isolation})}).runOnce();atomicJSON(path.join(root,'worker-result.json'),result);console.log(JSON.stringify(result,null,2));if(!['RC_READY','REJECTED'].includes(result.status))process.exitCode=2;}
async function preview(dir){const bp=load(dir),result=await continuePreview(process.env.FACTORY_WORKER_ROOT,bp.game_id);console.log(JSON.stringify({schema:'playjolt-preview-continuation/1',game_id:bp.game_id,state:result.state,preview_url:result.preview_url||null,rc_commit:result.rc_commit||null,base_commit:result.base_commit||null,production_authorized:false},null,2));}
function releasePacket(dir){const bp=load(dir);console.log(JSON.stringify(writeReleasePacket(process.env.FACTORY_WORKER_ROOT,bp.game_id),null,2));}
function summarize(dir){const bp=load(dir),root=process.env.FACTORY_WORKER_ROOT,ledgerFile=path.join(root,'autonomy/.provider/ledger.json'),ledger=fs.existsSync(ledgerFile)?readJSON(ledgerFile):{operations:{}};const ops=Object.values(ledger.operations).filter(x=>x.game_id===bp.game_id).sort((a,b)=>a.started_at-b.started_at).map(o=>({operation_id:o.operation_id,version:o.version,state:o.state,response_id:o.response_id,input_tokens:o.accounted?.input_tokens??null,output_tokens:o.accounted?.output_tokens??null,estimated_cost:(o.accounted||o.reserved)?.estimated_cost??null,error_code:o.error_code||null}));const file=path.join(root,'autonomy/jobs',bp.game_id,'manifest.json'),total=ops.reduce((n,o)=>n+(o.estimated_cost||0),0);if(!fs.existsSync(file)){console.log(JSON.stringify({schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,foundry:bp.foundry,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:null,production_authorized:false},null,2));return;}const m=readJSON(file),summary={schema:'playjolt-auto-template/1',game_id:bp.game_id,title:bp.title,signature:bp.design_id,foundry:bp.foundry,runtime:'phaser-4.2.1',runner_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,operations:ops,total_calls:ops.length,total_estimated_cost:Number(total.toFixed(8)),factory:{state:m.state,version:m.version,repair_attempt:m.repair_attempt,technical_qa_status:m.technical_qa_status,product_qa_status:m.product_qa_status,commercial_qa_status:m.commercial_qa_status,quality_status:m.quality_status,source_hash:m.source_hash,preview_url:m.preview_url||null,rc_commit:m.rc_commit||null,base_commit:m.base_commit||null,failure_reasons:m.failure_reasons},production_authorized:false};atomicJSON(path.join(root,'commissioning-summary.json'),summary);console.log(JSON.stringify(summary,null,2));}
async function main(dir,cmd=process.argv[2]){if(cmd==='prepare')return prepare(dir);if(cmd==='reviews')return reviews(dir);if(cmd==='run')return run(dir);if(cmd==='preview')return preview(dir);if(cmd==='release-packet')return releasePacket(dir);if(cmd==='summarize')return summarize(dir);throw Error('usage prepare|reviews|run|preview|release-packet|summarize');}
module.exports={validateBlueprint,buildModel,contracts,proposalFor,installReviewData,main};
