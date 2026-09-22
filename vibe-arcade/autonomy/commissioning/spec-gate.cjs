'use strict';
const fs=require('node:fs'),path=require('node:path');
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function validateProposal(proposal,{policy=readJSON(path.join(__dirname,'policy.json')),catalog=readJSON(path.join(__dirname,'catalog.json'))}={}){
  const errors=[],warnings=[];
  const req=['game_id','title','slug','genre','mechanic_family','controls','mobile_controls','qa'];
  for(const k of req)if(proposal[k]===undefined||proposal[k]===null||proposal[k]==='')errors.push({code:'missing_field',field:k});
  if(!ID.test(proposal.game_id||''))errors.push({code:'invalid_game_id'});
  if(!SLUG.test(proposal.slug||''))errors.push({code:'invalid_slug'});
  if(!Array.isArray(proposal.controls)||proposal.controls.length<1||proposal.controls.length>policy.controls.max_desktop_instructions)errors.push({code:'desktop_control_complexity'});
  if(!Array.isArray(proposal.mobile_controls)||proposal.mobile_controls.length<1||proposal.mobile_controls.length>policy.controls.max_mobile_instructions)errors.push({code:'mobile_control_complexity'});
  const terminal=proposal.qa?.terminal_ms;
  if(!Number.isInteger(terminal)||terminal<policy.session.terminal_ms_min||terminal>policy.session.terminal_ms_max)errors.push({code:'terminal_window',min:policy.session.terminal_ms_min,max:policy.session.terminal_ms_max});
  if(!proposal.qa?.keyboard?.key||!/^state\.[a-zA-Z0-9_.]+$/.test(proposal.qa?.keyboard?.observation||''))errors.push({code:'keyboard_probe'});
  if(!/^state\.[a-zA-Z0-9_.]+$/.test(proposal.qa?.pointer?.observation||''))errors.push({code:'pointer_probe'});
  const family=norm(proposal.mechanic_family);
  const blocked=new Set(policy.blocked_mechanic_families.map(norm));
  if(blocked.has(family))errors.push({code:'mechanic_family_blocked',mechanic_family:proposal.mechanic_family});
  const titles=new Set(catalog.games.map(g=>norm(g.title))),slugs=new Set(catalog.games.map(g=>norm(g.id)));
  if(titles.has(norm(proposal.title)))errors.push({code:'title_collision',title:proposal.title});
  if(slugs.has(norm(proposal.slug)))errors.push({code:'slug_collision',slug:proposal.slug});
  if(catalog.games.length>=policy.max_public_games_before_validation)errors.push({code:'catalog_cap_reached',count:catalog.games.length});
  if(proposal.max_repair_attempts!==undefined&&proposal.max_repair_attempts>policy.technical_budget.max_repair_attempts)errors.push({code:'repair_budget_too_high'});
  const words=new Set(family.split('-').filter(Boolean));
  for(const g of catalog.games){
    const gw=new Set(norm(g.mechanic_family).split('-').filter(Boolean));
    const overlap=[...words].filter(x=>gw.has(x)).length/Math.max(1,Math.min(words.size,gw.size));
    if(overlap>=0.75)warnings.push({code:'mechanic_similarity_review',game:g.id,overlap:Number(overlap.toFixed(2))});
  }
  const factory_spec={game_id:proposal.game_id,generation:proposal.generation||1,title:proposal.title,slug:proposal.slug,genre:proposal.genre,mechanic_family:proposal.mechanic_family,
    controls:proposal.controls,mobile_controls:proposal.mobile_controls,max_repair_attempts:proposal.max_repair_attempts??policy.technical_budget.max_repair_attempts,qa:proposal.qa};
  return {passed:errors.length===0,errors,warnings,factory_spec,commissioning:{owner_review_required:true,auto_production_ship:false,max_provider_calls:policy.technical_budget.max_provider_calls,max_estimated_model_cost_usd:policy.technical_budget.max_estimated_model_cost_usd}};
}
module.exports={validateProposal,norm,readJSON};
