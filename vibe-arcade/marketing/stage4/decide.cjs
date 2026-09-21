/* Conservative observational decisions. Missing evidence is not a zero or a loss. */
'use strict';
const policy=require('./experiment-plan.json').dataPolicy;
function wilson(success,total){if(!Number.isInteger(success)||!Number.isInteger(total)||total<=0||success<0||success>total)throw Error('invalid_binomial');const z=1.96,p=success/total,d=1+z*z/total,m=(p+z*z/(2*total))/d,h=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return {rate:p,low:m-h,high:m+h};}
function decide(input){
 const result=(state,reason,more={})=>({state,reason,causalClaim:false,...more});
 if(!input||input.internalOrBotTrafficExcluded!==true||input.telemetryHealthy!==true)return result('DATA_GAP','Measurement health and internal-test exclusion are required.');
 if(!input.control||!input.variant)return result('DATA_GAP','Both variants are required.');
 if(input.factor!=='hook'&&input.factor!=='cta_timing'&&input.factor!=='duration')return result('INVALID_EXPERIMENT','Unknown factor.');
 if(input.factorsChanged!==1||!input.sameChannel||!input.matchedObservationWindows)return result('INVALID_EXPERIMENT','Change one factor and compare aligned channel/time windows.');
 const pair=[input.control,input.variant],fields=['ageHours','posts','views','sessions','startingSessions','replayingSessions'];
 for(const a of pair){
  if(fields.some(k=>typeof a[k]!=='number'||!Number.isFinite(a[k])||a[k]<0))return result('DATA_GAP','Missing/invalid counts are not zero.');
  if(['posts','views','sessions','startingSessions','replayingSessions'].some(k=>!Number.isInteger(a[k]))||a.startingSessions>a.sessions||a.replayingSessions>a.startingSessions)return result('DATA_GAP','Incompatible denominators.');
  if(a.scope!=='content_tagged')return result('DATA_GAP','Common profile traffic cannot identify a winning video. Use channel observations separately.');
  if(a.ageHours<policy.minimumAgeHours)return result('WAIT','Minimum observation window has not elapsed.');
  if(a.posts<policy.minimumIndependentPostsPerVariant||a.views<policy.minimumViewsPerVariant||a.sessions<policy.minimumTaggedSessionsPerVariant||a.startingSessions<policy.minimumStartedSessionsPerVariant)return result('INSUFFICIENT_DATA','Not enough independent posts, views, tagged sessions or starts.');
 }
 const c=wilson(input.control.startingSessions,input.control.sessions),v=wilson(input.variant.startingSessions,input.variant.sessions);
 const replayControl=input.control.replayingSessions/input.control.startingSessions,replayVariant=input.variant.replayingSessions/input.variant.startingSessions;
 const evidence={startRateControl:c,startRateVariant:v,replayRateControl:replayControl,replayRateVariant:replayVariant};
 if(v.low>c.high&&v.rate-c.rate>=policy.minimumAbsoluteStartRateLift&&replayVariant>=replayControl-0.05)return result('KEEP','Promising observational candidate; repeat before expanding production.',evidence);
 if(c.low>v.high&&c.rate-v.rate>=policy.minimumAbsoluteStartRateLift)return result(input.completedLosses>=policy.killAfterCompletedLosses?'KILL':'MODIFY','Lower observed play-start yield; kill requires repeated completed losses.',evidence);
 return result('INCONCLUSIVE','Intervals overlap, gain is small, or replay guard failed; do not force a winner.',evidence);
}
if(require.main===module){try{const fs=require('node:fs');if(!process.argv[2])throw Error('Provide a validated observation JSON file.');console.log(JSON.stringify(decide(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={decide,wilson};
