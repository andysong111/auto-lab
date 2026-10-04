'use strict';

const MODE='continuous-radial-v1';
const TERMINAL_KEYS=['outcome','reason','tick','phase','score','progress','best_combo','lives','barrier'];

function at(value,key){return String(key||'').split('.').filter(Boolean).reduce((row,part)=>row?.[part],value);}
function terminalSnapshot(value){return Object.fromEntries(TERMINAL_KEYS.map(key=>[key,value[key]]));}
function finite(value){return typeof value==='number'&&Number.isFinite(value);}
function fail(message){throw Error('radial_model: '+message);}

function validate(model){
  if(!model||model.schema_version!==1||model.interaction_mode!==MODE)fail('identity');
  if(!Array.isArray(model.projection)||model.projection.length<2||model.projection.length>12||new Set(model.projection).size!==model.projection.length)fail('projection');
  const anchors=model.anchors||{},names=['initial','early','mid','late'];
  if(JSON.stringify(Object.keys(anchors))!==JSON.stringify(names))fail('anchors');
  let last=-1;
  for(const name of names){const row=anchors[name];if(!row||!Number.isInteger(row.tick)||row.tick<0||row.tick<=last&&name!=='initial'||!Number.isInteger(row.stage)||row.stage<1||row.stage>3)fail('anchor_'+name);last=row.tick;}
  const seeds=Object.entries(model.seeds||{});if(seeds.length<6||seeds.length>12)fail('seeds');
  for(const [seed,row] of seeds){
    if(!/^\d+$/.test(seed)||!row)fail('seed_'+seed);
    for(const control of ['pointer','keyboard'])for(const outcome of ['success','failure']){
      const terminal=row[control]?.[outcome];
      if(!terminal||terminal.outcome!==outcome||!TERMINAL_KEYS.every(key=>Object.hasOwn(terminal,key)))fail(seed+'_'+control+'_'+outcome);
      if(!Number.isInteger(terminal.tick)||terminal.tick<1||terminal.tick>6000||!finite(terminal.score)||!finite(terminal.progress)||!finite(terminal.lives)||!finite(terminal.barrier))fail(seed+'_'+control+'_'+outcome+'_numbers');
    }
    if(row.pointer.success.progress<6||row.keyboard.success.progress<6)fail(seed+'_meaningful_success');
  }
  if(model.production_authorized!==false)fail('production');
  return model;
}

function chooseTarget(state,mode,contract){
  const interaction=contract.interaction,items=at(state,interaction.target_collection_path);
  if(!Array.isArray(items))fail('target_collection');
  const radius=item=>at(item,interaction.target_radius_path),bad=item=>at(item,interaction.hazard_path)===true;
  const angle=item=>at(item,interaction.target_angle_path);
  const desired=items.filter(item=>finite(radius(item))&&finite(angle(item))&&radius(item)<interaction.acquire_radius&&!item.done&&(mode==='failure'?bad(item):!bad(item))).sort((a,b)=>radius(a)-radius(b))[0];
  if(desired)return angle(desired);
  if(mode==='success'){
    const danger=items.filter(item=>finite(radius(item))&&finite(angle(item))&&bad(item)&&radius(item)<interaction.avoid_radius&&!item.done).sort((a,b)=>radius(a)-radius(b))[0];
    if(danger)return angle(danger)+Math.PI;
  }
  return null;
}

function signedAngle(target,current){return Math.atan2(Math.sin(target-current),Math.cos(target-current));}
function pointFor(angle,radius=.42){return {x:.5+Math.cos(angle)*radius,y:.5-Math.sin(angle)*radius};}

module.exports={MODE,TERMINAL_KEYS,at,terminalSnapshot,validate,chooseTarget,signedAngle,pointFor};
