#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {previewURL}=require('../adapters/github-vercel.cjs');
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/,ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/;
function fileDigest(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function expectedConfirmation(action,candidate){return `${action==='release'?'RELEASE':'ROLLBACK'} ${candidate.game_id} ${candidate.rc_commit}`;}
function authorize(packet,{packet_sha256,actual_sha256,actor,repository,action,confirmation}){
  const errors=[],candidate=packet?.candidate||{},rollback=packet?.rollback||{};
  if(packet?.schema!=='playjolt-release-review/2'||packet?.passed!==true)errors.push('packet_not_passed');
  if(packet?.production?.authorized!==false||packet?.production?.automatic!==false)errors.push('packet_production_boundary_invalid');
  if(packet?.owner_review?.decision!=='PENDING')errors.push('packet_owner_state_invalid');
  if(!['release','rollback'].includes(action))errors.push('invalid_action');
  if(!DIGEST.test(packet_sha256||'')||packet_sha256!==actual_sha256)errors.push('packet_digest_mismatch');
  const owner=String(repository||'').split('/')[0];
  if(repository!=='andysong111/auto-lab'||actor!==owner)errors.push('repository_owner_required');
  if(!ID.test(candidate.game_id||'')||candidate.branch!==`factory/${candidate.game_id}`)errors.push('candidate_identity_invalid');
  if(!/^v[1-9][0-9]*$/.test(candidate.version||'')||candidate.source_path!==`autonomy/games/${candidate.game_id}/${candidate.version}`)errors.push('candidate_source_invalid');
  if(!SHA.test(candidate.rc_commit||'')||!SHA.test(rollback.base_commit||'')||rollback.source_commit!==candidate.rc_commit||rollback.restore_commit!==rollback.base_commit)errors.push('rollback_contract_invalid');
  try{if(previewURL(candidate.preview_url)!==candidate.preview_url)errors.push('preview_url_invalid');}catch{errors.push('preview_url_invalid');}
  if(packet?.evidence?.preview_smoke?.passed!==true||!DIGEST.test(packet?.evidence?.preview_smoke?.sha256||''))errors.push('preview_evidence_invalid');
  for(const key of ['technical_qa_status','product_qa_status','commercial_qa_status','qa_status','quality_status'])if(packet?.evidence?.[key]!=='PASS')errors.push(`${key}_not_passed`);
  if(packet?.evidence?.release_status!=='READY')errors.push('release_not_ready');
  if(confirmation!==expectedConfirmation(action,candidate))errors.push('confirmation_mismatch');
  if(errors.length)throw Error('production_gate_failed: '+errors.join(','));
  return {schema:'playjolt-production-authorization/1',authorized:true,action,actor,repository,packet_sha256,candidate:{game_id:candidate.game_id,version:candidate.version,branch:candidate.branch,source_path:candidate.source_path,rc_commit:candidate.rc_commit},base_commit:rollback.base_commit,production_automatic:false};
}
function validateChangedPaths(packet,rows){
  const prefix=`vibe-arcade/${packet.candidate.source_path}/`,errors=[];
  if(!rows.length)errors.push('rc_diff_empty');
  for(const row of rows){
    const [status,file,...extra]=row.split('\t');
    if(extra.length||!['A','M'].includes(status)||!file?.startsWith(prefix)||file.includes('..')||file.includes('\\'))errors.push('rc_diff_outside_candidate');
  }
  if(errors.length)throw Error('production_git_gate_failed: '+[...new Set(errors)].join(','));
  return {files:rows.length,prefix};
}
function verifyGit(packet,{cwd=process.cwd()}={}){
  const git=(args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim(),candidate=packet.candidate,base=packet.rollback.base_commit,rc=candidate.rc_commit;
  const remote=git(['rev-parse',`refs/remotes/origin/${candidate.branch}`]);
  if(remote!==rc)throw Error('production_git_gate_failed: rc_branch_mismatch');
  const parents=git(['show','-s','--format=%P',rc]).split(/\s+/).filter(Boolean);
  if(parents.length!==1||parents[0]!==base)throw Error('production_git_gate_failed: rc_parent_mismatch');
  const rows=git(['diff','--name-status','--no-renames',base,rc]).split(/\r?\n/).filter(Boolean);
  return {schema:'playjolt-production-git-gate/1',passed:true,base_commit:base,rc_commit:rc,...validateChangedPaths(packet,rows)};
}
function parse(argv){const [cmd,file,...rest]=argv,opts={};for(let i=0;i<rest.length;i+=2){if(!rest[i]?.startsWith('--')||rest[i+1]===undefined)throw Error('invalid_option');opts[rest[i].slice(2)]=rest[i+1];}return {cmd,file,opts};}
function main(argv=process.argv.slice(2)){
  const {cmd,file,opts}=parse(argv);if(!cmd||!file)throw Error('usage authorize|verify-git PACKET [options]');
  const resolved=path.resolve(file),packet=JSON.parse(fs.readFileSync(resolved,'utf8'));let result;
  if(cmd==='authorize')result=authorize(packet,{packet_sha256:opts.sha,actual_sha256:fileDigest(resolved),actor:opts.actor,repository:opts.repository,action:opts.action,confirmation:opts.confirmation});
  else if(cmd==='verify-git')result=verifyGit(packet,{cwd:path.resolve(opts.cwd||process.cwd())});
  else throw Error('unknown_command');
  process.stdout.write(JSON.stringify(result)+'\n');
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=2;}
module.exports={fileDigest,expectedConfirmation,authorize,validateChangedPaths,verifyGit,main};
