#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Factory}=require('../orchestrator/engine.cjs');
const {FileStore}=require('../orchestrator/store.cjs');
const {atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const {GitHubVercelAdapter}=require('../adapters/github-vercel.cjs');
const {buildPacket}=require('./release-packet.cjs');
const ID=/^GAME-[0-9]{8}-[0-9]{3,6}$/;
function context(root,id){
  const resolved=path.resolve(root||'');
  if(!root||!ID.test(id||'')||!fs.existsSync(resolved))throw Error('invalid_rc_continuation_context');
  const store=new FileStore(resolved),manifest=store.get(id);
  if(manifest.game_id!==id)throw Error('rc_identity_mismatch');
  return {root:resolved,store,manifest};
}
async function continuePreview(root,id){
  const c=context(root,id);
  if(!['RC_READY','PREVIEW_DEPLOYING','PREVIEW_SMOKE','READY_TO_SHIP'].includes(c.manifest.state))throw Error('preview_requires_rc_ready');
  const factory=new Factory({store:c.store,release:new GitHubVercelAdapter({baseRef:'main'})});
  return factory.run(id,{rc:true});
}
function writeReleasePacket(root,id){
  const c=context(root,id),manifest=c.store.get(id);
  if(manifest.state!=='READY_TO_SHIP')throw Error('release_packet_requires_ready_to_ship');
  const smokeFile=c.store.artifact(id,`${manifest.version}/preview-smoke.json`);
  if(!fs.existsSync(smokeFile))throw Error('preview_smoke_missing');
  const packet=buildPacket(manifest,{base_ref:'main',preview_smoke:readJSON(smokeFile)});
  if(!packet.passed)throw Error('release_packet_failed '+packet.errors.join(','));
  atomicJSON(path.join(c.root,'release-packet.json'),packet);return packet;
}
async function main(argv=process.argv.slice(2)){
  const [cmd,root,id]=argv;if(!cmd||!root||!id)throw Error('usage preview|release-packet ROOT GAME_ID');
  const result=cmd==='preview'?await continuePreview(root,id):cmd==='release-packet'?writeReleasePacket(root,id):null;
  if(!result)throw Error('unknown_command');
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(require.main===module)main().catch(e=>{console.error(e.stack||e);process.exitCode=2;});
module.exports={context,continuePreview,writeReleasePacket,main};
