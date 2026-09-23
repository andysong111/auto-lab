'use strict';
const {hash}=require('../../orchestrator/files.cjs');
const {review,legacyFixture}=require('./contract.cjs');
const {REQUIRED,VERSION}=require('../commercial-worker.cjs');
function failures(manifest,qa,policy){
 const out=[],c=manifest.commercial_contract,q=qa?.commercial_qa;
 const fail=(code,message,check)=>out.push({code:'commercial_'+code,message,...(check?{check}:{})});
 if(!c){if(!legacyFixture(policy))fail('contract_missing','A reviewed commercial contract and Docker evidence are required before RC');return out;}
 try{const approval=review(c,manifest.product_contract,{allowFixture:policy.product?.allow_fixture_oracles===true}).approval;if(q&&hash(approval)!==hash(q.oracle_approval))fail('review_changed','Commercial review changed after capture');}catch(e){fail('review_invalid',e.message);}
 if(!q||q.source_hash!==manifest.source_hash||q.policy_hash!==hash(policy)||q.contract_hash!==hash(c)||q.product_contract_hash!==hash(manifest.product_contract)||q.game_id!==manifest.game_id||q.version!==manifest.version||q.runner_version!==VERSION||q.isolation?.engine!=='docker'||q.isolation?.network!=='none'||q.isolation?.readonly!==true)fail('stale_evidence','Commercial evidence must match source, both contracts, identity, policy, runner and Docker isolation');
 for(const name of REQUIRED)if(!q?.checks?.some(x=>x.check===name&&x.status==='PASS'))fail('missing_check','Missing or failed commercial requirement: '+name,name);
 const perViewport=REQUIRED.filter(x=>!['audio','capture_no_writes','visual_evidence','visual_review'].includes(x));
 for(const [width,height] of policy.required_viewports)for(const name of perViewport)if(!q?.checks?.some(x=>x.check===name&&x.status==='PASS'&&x.viewport?.width===width&&x.viewport?.height===height))fail('viewport_coverage',`${width}x${height}: ${name}`,name);
 if(!q?.passed||q.checks?.some(x=>x.status!=='PASS'))fail('failed','Commercial hard checks did not all pass');
 if(!q?.evidence_complete||q.visual_review?.status!=='COMPLETE'||q.visual_review?.issues?.some(i=>i.severity==='critical'))fail('visual_evidence_incomplete','Complete captures and no critical corroborating issues are required');
 for(const f of q?.hard_failures||[])if(!out.some(x=>hash(x)===hash(f)))out.push(f);
 return out;
}
module.exports={failures};
