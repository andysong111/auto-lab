'use strict';
const fs=require('node:fs'),path=require('node:path'),Ajv=require('ajv');
const {hash}=require('../../orchestrator/files.cjs');
const product=require('../product-contract.cjs');
const check=new Ajv({allErrors:true,strict:false}).compile(require('../../schema/commercial-polish-contract.schema.json'));
const LIMITS=Object.freeze({delta:.035,changed:.08,structure:.012,contrast:1.8,max_text_area:.24,max_text_chars:650,min_gameplay_area:.22,max_frame_gap_ms:400,max_dom_growth:100,max_dom:2000,max_contexts:2,max_voices:8,max_entities:512});
function validate(c){
 if(!check(c))throw Error('commercial_contract: '+JSON.stringify(check.errors));
 if(/__proto__|constructor|prototype/.test(JSON.stringify(c)))throw Error('commercial_contract: unsafe data');
 const walk=x=>{if(!x||typeof x!=='object')return;if('width' in x&&'selector' in x&& (x.x+x.width>1.001||x.y+x.height>1.001))throw Error('commercial_region_out_of_bounds');for(const v of Object.values(x))walk(v);};walk(c);
 if(c.motion.intermediate_ms.some((n,i,a)=>i&&n<=a[i-1])||c.motion.settle_ms<=c.motion.intermediate_ms.at(-1)+50)throw Error('commercial_motion_timing');
 const ids=[...c.visual_legibility.pairs,...c.state_distinction.pairs,...c.action_feedback.probes].map(x=>x.id);if(new Set(ids).size!==ids.length)throw Error('commercial_duplicate_probe');
 if(c.audio.mode==='required'&&(!c.audio.mute_selector||!c.audio.primary_probe||!c.audio.progress_probe||c.audio.exception))throw Error('commercial_audio_contract');
 if(c.audio.mode==='reviewed_silence'&&!c.audio.exception)throw Error('commercial_silence_requires_review');
 return c;
}
function semantics(c,p,model){
 const g=model.seeds[String(c.seed)];if(!g)throw Error('commercial_seed_absent');
 const node=id=>{if(!g.nodes[id]||product.shortest(g,g.initial,n=>n===g.nodes[id])===null)throw Error('commercial_unreachable_node '+id);return g.nodes[id];};
 for(const pair of [...c.visual_legibility.pairs,...c.state_distinction.pairs]){
  const a=node(pair.a.node),b=node(pair.b.node);
  if(pair.kind==='action_availability'){
   if(pair.a.node!==pair.b.node||!p.actions[pair.action_a]||!p.actions[pair.action_b]||!a.edges.some(e=>e.action===pair.action_a)||b.edges.some(e=>e.action===pair.action_b))throw Error('commercial_pair_not_legal_vs_blocked');
  }else{const i=model.projection.indexOf(pair.state_path);if(i<0||JSON.stringify(a.values[i])===JSON.stringify(b.values[i]))throw Error('commercial_pair_states_equal');}
 }
 for(const probe of c.action_feedback.probes)if(!p.actions[probe.action]||!node(probe.node).edges.some(e=>e.action===probe.action&&e.to!==probe.node))throw Error('commercial_feedback_not_meaningful');
 const stages=c.progression_spectacle.checkpoints.map(a=>node(a.node).stage);if(stages.some((n,i)=>i&&n<=stages[i-1]))throw Error('commercial_progression_not_increasing');
 if(c.audio.mode==='required'&&[c.audio.primary_probe,c.audio.progress_probe].some(id=>!c.action_feedback.probes.some(p=>p.id===id)))throw Error('commercial_audio_probe_absent');
 return g;
}
function review(c,p,{allowFixture=false}={}){
 validate(c);const {model,approval:productApproval}=product.review(p,{allowFixture});
 const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'reviewed/registry.json'),'utf8'));
 const approval=registry.entries.find(e=>e.id===c.review_id);
 if(!approval||approval.contract_sha256!==hash(c)||approval.product_contract_sha256!==hash(p)||!approval.reviewed_by||!approval.rationale)throw Error('commercial_review_missing_or_changed');
 if(approval.scope!=='candidate'&&!(allowFixture&&approval.scope==='fixture'))throw Error('commercial_review_scope');
 const graph=semantics(c,p,model);return {model,graph,approval,productApproval};
}
function legacyFixture(policy){return policy.product?.allow_legacy_technical_fixtures===true||policy.product?.allow_fixture_oracles===true;}
module.exports={validate,semantics,review,LIMITS,legacyFixture};
