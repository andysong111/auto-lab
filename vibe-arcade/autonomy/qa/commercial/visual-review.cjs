'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {hash}=require('../../orchestrator/files.cjs');
const CATEGORIES=['visual_legibility','feedback','progression','hierarchy','result','commercial_incompleteness'];
const PHASES=['entry','early','mid','late','success','failure','gameplay'];
// A provider receives immutable evidence DATA only. No browser, source tools,
// candidate mutation, factory transition or production authority is exposed.
class VisualReviewAdapter{async review(_packet){throw Error('visual_review_provider_not_configured');}}
function packet(report,contract){return {schema_version:1,source_hash:report.source_hash,contract_hash:hash(contract),artifacts:report.artifacts,checks:report.checks,rubric:CATEGORIES};}
function validateResponse(response,input){
 if(!response||response.schema_version!==1||response.evidence_hash!==hash(input)||!Array.isArray(response.issues)||response.issues.length>64||!['COMPLETE','UNVERIFIED'].includes(response.status))throw Error('invalid_visual_review_response');
 for(const i of response.issues)if(!CATEGORIES.includes(i.category)||!['critical','major','minor'].includes(i.severity)||typeof i.message!=='string'||i.message.length<10||!Array.isArray(i.evidence)||!i.evidence.length||i.evidence.some(p=>!input.artifacts.some(a=>a.path===p)))throw Error('unbound_visual_review_issue');
 return response;
}
function evidenceComplete(report,outDir){
 const phases=new Set();for(const a of report.artifacts||[]){if(!/^[a-z0-9-]+\.(png|webm)$/.test(a.path))return false;const f=path.join(outDir,a.path);if(!fs.existsSync(f)||fs.lstatSync(f).isSymbolicLink()||crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==a.sha256)return false;phases.add(a.phase);}
 return PHASES.every(p=>phases.has(p));
}
class MachineCorroboration extends VisualReviewAdapter{
 async review(input){return {schema_version:1,status:'COMPLETE',evidence_hash:hash(input),provider:'trusted-machine-corroboration',aesthetics:'UNVERIFIED',issues:input.checks.filter(c=>c.status==='FAIL'&&CATEGORIES.includes(c.category)).map(c=>({category:c.category,severity:'critical',message:String(c.message||c.check),evidence:c.evidence||[]})).filter(i=>i.evidence.length)};}
}
module.exports={VisualReviewAdapter,MachineCorroboration,packet,validateResponse,evidenceComplete,CATEGORIES,PHASES};
