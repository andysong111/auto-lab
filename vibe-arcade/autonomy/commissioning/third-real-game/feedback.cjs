'use strict';
const fs=require('node:fs'),path=require('node:path');
const {readJSON,atomicJSON,hash}=require('../../orchestrator/files.cjs');
const {ProviderPause}=require('../../providers/errors.cjs');
const ID='GAME-20260922-131';
function repeatedPair(ledger){
 const ops=Object.values(ledger.operations).filter(x=>x.game_id===ID).sort((a,b)=>a.started_at-b.started_at).slice(-2);
 if(ops.length!==2||ops.some(x=>x.state!=='MODEL_FAILED'))return null;
 const signature=x=>JSON.stringify([x.error_code,x.error_context?.file||null,x.error_context?.identifier||null]);
 if(signature(ops[0])!==signature(ops[1]))return null;
 return {fingerprint:hash(ops.map(x=>({operation_id:x.operation_id,request_hash:x.request_hash,error_code:x.error_code,rejected_hash:hash(x.rejected_output||null)}))),operations:ops.map(x=>x.operation_id),error_code:ops[1].error_code};
}
function checkFeedback(root){
 const file=path.join(root,'autonomy/.provider/ledger.json');if(!fs.existsSync(file))return;const pair=repeatedPair(readJSON(file));if(!pair)return;
 const reviewFile=path.join(root,'feedback-review.json'),review=fs.existsSync(reviewFile)?readJSON(reviewFile):null;
 if(review?.fingerprint===pair.fingerprint&&review.system_reviewed===true&&typeof review.findings==='string'&&review.findings.length>=80)return;
 atomicJSON(path.join(root,'feedback-hold.json'),{...pair,status:'PAUSED_PROVIDER',reason:'Two consecutive identical validation failures. Inspect exact errors, quarantine and next-request context before another generation. Preserve this ledger and attempts.'});
 throw new ProviderPause('repeated_validation_requires_system_review','Inspect quarantined source and compiled repair context before further calls');
}
function auditedProvider(provider,root){return {identity:provider.identity,assertAvailable:()=>provider.assertAvailable(),cancel:id=>provider.cancel(id),generate:async args=>{
 const req=args.request;if(req.game_id!==ID)throw new ProviderPause('unexpected_commissioning_game');
 // Private data evidence of exactly what the existing compiler sends. No API keys/headers.
 atomicJSON(path.join(root,'autonomy/.provider/requests',req.operation_id.replaceAll('/','__')+'.json'),req);
 return provider.generate(args);
}};}
module.exports={repeatedPair,checkFeedback,auditedProvider};
