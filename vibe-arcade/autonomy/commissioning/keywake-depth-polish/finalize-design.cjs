'use strict';
// Trusted specification and data-only finite oracle. No candidate imports/QA.
const fs=require('node:fs'),path=require('node:path');
const {hash,atomicJSON}=require('../../orchestrator/files.cjs');
const {review,shortest,stageMetrics}=require('../../qa/product-contract.cjs');
const catalog=require('./layouts.json'),seeds=[1,7,23,89,2026,4294967295];
const projection=['state.stage','state.cell','state.key_mask','state.outcome'];
const moves={left:[-1,0],up:[0,-1],right:[1,0],down:[0,1]};
function pick(seed){const h=Math.imul((seed>>>0)^(seed>>>16),catalog.selection.multiplier)>>>0;return ((h^(h>>>13))>>>0)%6;}
function graph(seed){
 const rooms=catalog.packs[pick(seed)].rooms,nodes={},id=v=>v.join(':'),queue=[[1,5,0,'playing']];
 for(let k=0;k<queue.length;k++){
  const values=queue[k],key=id(values);if(nodes[key])continue;
  const [stage,cell,mask,outcome]=values,n=nodes[key]={values,stage,success:outcome==='success',edges:[]};if(n.success)continue;
  const room=rooms[stage-1];
  for(const [action,[dx,dy]] of Object.entries(moves)){
   const x=cell%4+dx,y=Math.floor(cell/4)+dy,to=y*4+x;if(x<0||x>3||y<0||y>3)continue;
   const edge=room.edges.find(e=>e[0]===Math.min(cell,to)&&e[1]===Math.max(cell,to));
   if(!edge||(mask&edge[2])!==edge[2]||to===room.exit&&mask!==(1<<room.keys.length)-1)continue;
   const ki=room.keys.indexOf(to),nm=ki<0?mask:mask|(1<<ki);
   const next=to===room.exit?[stage+1,5,0,stage===3?'success':'playing']:[stage,to,nm,'playing'];
   n.edges.push({action,to:id(next)});if(!nodes[id(next)])queue.push(next);
  }
 }
 return {initial:'1:5:0:playing',nodes};
}
const model={schema_version:1,projection,seeds:Object.fromEntries(seeds.map(s=>[s,graph(s)]))};
const prior=require('../fourth-real-game/proposal.json'),contract=structuredClone(prior.product_contract);
contract.objective.expected_text='Collect keys. Unlock gates. Reach all 3 exits.';
contract.difficulty={...contract.difficulty,oracle_id:'keywake-depth-v1',oracle_sha256:hash(model),projection,max_actions:64};
const compact=catalog.packs.map(p=>p.rooms.map((r,i)=>({edges:r.edges,keys:r.keys,exit:r.exit,par:p.metrics[i].shortest})));
const implementation={
 goal:'OWNER HOLD supersedes v3: too simple/easy. Same Keywake GAME-20260923-141, now a route-planning game. Exact initial objective: "Collect keys. Unlock gates. Reach all 3 exits." Directions move one cell. See the entire room, plan colored-key order, open shortcuts, and beat your route score. Keep the goal/room progress visible before Start and throughout play.',
 progression:'Replace 3x3 rooms with 4x4 stationary grid rooms, cell=y*4+x (0..15), start cell 5 in EVERY room, keys indexed A=bit1,B=bit2,C=bit4. Room data lists undirected passable EDGES [minCell,maxCell,requiredKeyMask]; ALL unlisted edges are solid walls. Required mask 0 is open; otherwise crossing allowed iff (key_mask & requiredMask) === requiredMask. Board cells incident to edges are floor, others walls. Move orthogonally only; disallow boundary crossing/wrap. Picking an uncollected key permanently sets its bit. Exit is impassable until ALL room keys collected. Legal step INTO exit clears room immediately, adds room score, increments stage/objective_progress, resets cell=5,key_mask=0,room_moves=0. Final canonical state stage=4,cell=5,key_mask=0,outcome="success",objective_progress=3. Blocked actions change neither objective nor meaningful_actions. FULL AUTHORITATIVE LAYOUT CATALOG (pack indices 0..5; each holds room1..3; par is independent shortest route): '+JSON.stringify(compact),
 difficulty:'Deterministic selection for ALL uint32 seeds: h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0; pack=((h^(h>>>13))>>>0)%6. No transforms, random globals, runtime search, special QA branches or seed lookup exceptions. Six genuinely different packs define walls, key cells, gate requirements, exits and optimal inputs. QA seeds 1,7,23,89,2026,4294967295 cover all 6 packs. Room1 has one key and real shortcut decisions; room2 A/B key-order costs differ >=4 moves; room3 A/B order plus C gated behind A+B. Keep observe().quality: stage=state.stage; complexity=actual currently legal destination count under these exact rules (entry widths2/3/4, success0); meaningful_actions increments ONCE for each legal move including exit and never resets between rooms; reversible_state_key=stage+":"+cell+":"+key_mask+":"+outcome. Never report plan length or arbitrary difficulty as complexity. The independently measured route decision states and key-order costs are distinct from immediate width. Keep the projection stage/cell/key_mask/outcome exact.',
 presentation:'Make this visibly more polished: a compact deep graphite vault, layered beveled floor tiles, distinct solid wall edges, luminous cyan explorer, high-contrast brass/magenta/ice keys A/B/C and corresponding colored locked gate bars with readable requirements A/B/AB. Gates must visibly disappear/change to open tracks when unlocked. Exit has locked/open states; collected key inventory stays clear. Indicate ROOM n, MOVES n, PAR n and route efficiency. Keep four arrow pads LEFT, UP, RIGHT, DOWN in bottom20% of canvas at x centers.125,.375,.625,.875, y.9; preserve tap-column mapping across the entire canvas. No additional action buttons or complex input. Each pointer action increments pointer_actions; directional presses use edge latching, cleared on neutral input/touch. Space no-op. Use existing GameKit exactly; core export globalThis.KeywakeCore; no DOM/browser identifiers in core. Keep v3 exact-directory base resolution BEFORE asset loading and manifest fetching.',
 originality:'This is an owner-authorized depth revision of the existing same-ID Keywake, not another candidate or a reset. Retain the successful v3 lifecycle, input, GameKit integration, mobile spacing, native media handling, asset base resolution and no-side-effects behavior while replacing the room rules/art and efficiency presentation. Never touch Factory/GameKit/manifest/QA.',
 scoring:'Score starts0 and is awarded ONLY on room completion: max(20,200-15*max(0,room_moves-par)). Count every legal move including exit and detours in room_moves; clear it only for next room. Track total_moves and total par across completed rooms. A perfect completed game scores600; extra moves strictly reduce room score until floor20. Keys, gates, bumps, waiting and reversible walks award ZERO. Show Perfect route for zero extra moves, Efficient route for1-2 extra, otherwise Detour +N; show these legibly at room clear/final result. Same-seed GameKit Replay lets players improve order/path efficiency; do not change seed on automatic restart because that breaks the finite oracle/replay contract. No extra storage. Best only from GameKit snapshot.best. observe.progress may be elapsed seconds rounded to1 decimal to avoid the long decimals in v3.',
 mobile_readability:prior.implementation_contract.mobile_readability.replace('340–370','340–370')+' Four-by-four cells, wall/gate edges and key labels must remain legible. Every canvas text font is at least14 CSS pixels, including PAR/key/gate labels. Do not draw several labels on the same tile or clipped at canvas boundaries. Limit long event text to separate short badges below the board, not over tile glyphs.',
 result:prior.implementation_contract.result+' Add total moves vs total par and exact route-rating words without moving Replay below the first mobile viewport. Rooms cleared remains the principal progress; efficiency is the replay incentive.',
 reduced_motion:prior.implementation_contract.reduced_motion,
 completion_timing:'Keep the same40-second limit (2400 core ticks), not a shorter timer or faster movement. Human planning makes the new routes harder. Success ends on the exit step immediately, no delay/animation barrier, <=100ms. Failure at2400 ticks uses TIME UP. Main objective progress is ROOMS0/3 to3/3; elapsed time is a separately labeled counter. Never add forced waiting.',
 action_feedback:prior.implementation_contract.action_feedback+' Distinguish pickup (key inventory flash), unlock (colored gate opens), room clear (brief ROOM CLEAR badge), path selection (explorer trail), hatch open (high contrast halo), final clear (result). Canonical state updates immediately; never block later inputs for effects. Reduced motion uses stable rings/badges/open gate shapes. Sound optional but unnecessary. Preserve v3 correct GameKit draw signature forwarding; the kit calls draw(ctx,snapshot,{width,height}).'
};
const proposal={...prior,implementation_contract:implementation,product_contract:contract};
atomicJSON(path.join(__dirname,'proposal.json'),proposal);atomicJSON(path.join(__dirname,'product-contract.json'),contract);
atomicJSON(path.join(__dirname,'../../qa/reviewed/keywake-depth-v1.json'),model);
const registryFile=path.join(__dirname,'../../qa/reviewed/registry.json'),registry=JSON.parse(fs.readFileSync(registryFile));
registry.entries=registry.entries.filter(e=>e.id!=='keywake-depth-v1');registry.entries.push({id:'keywake-depth-v1',file:'keywake-depth-v1.json',sha256:hash(model),contract_sha256:hash(contract),scope:'candidate',game_id:prior.game_id,reviewed_by:'Trusted same-ID owner-depth design review 2026-09-23',rationale:'Six distinct 4x4 edge layouts; bounded key/gate masks; independent BFS minimums, key-order regret and consequential route choices. All reachable states solvable; entry normal-input return paths preserved. Offline data model only.'});atomicJSON(registryFile,registry);
review(contract);
const gate=require('../spec-gate.cjs').validateProposal(proposal);if(!gate.passed)throw Error(JSON.stringify(gate.errors));
const rows=seeds.map(seed=>{const g=model.seeds[seed],plan=shortest(g,g.initial,n=>n.success),stages=new Map();for(const s of plan)if(!stages.has(g.nodes[s.from].stage))stages.set(g.nodes[s.from].stage,stageMetrics(g,s.from));return {seed,pack:pick(seed),nodes:Object.keys(g.nodes).length,normal_inputs:plan.length,branch_inputs:18,stages:[...stages.values()].map((s,i)=>({...s,...catalog.packs[pick(seed)].metrics[i]}))};});
atomicJSON(path.join(__dirname,'oracle-review.json'),{trusted_infrastructure:true,candidate_code_authored:false,oracle_sha256:hash(model),contract_sha256:hash(contract),gate_version:'product-quality-1 unchanged',interpretation:'complexity is immediate legal width2/3/4; consequential_decisions counts route states with non-backtracking viable choices of unequal remaining cost.',seeds:rows});
atomicJSON(path.join(__dirname,'spec-gate.json'),gate);
console.log(JSON.stringify({preflight:'PASS',implementation_bytes:Buffer.byteLength(JSON.stringify(implementation)),rows:rows.map(r=>({seed:r.seed,pack:r.pack,nodes:r.nodes,shortest:r.stages.map(s=>s.shortest),decisions:r.stages.map(s=>s.consequential_decisions),key_order:r.stages.map(s=>s.orders)}))},null,2));
module.exports={graph,pick};
