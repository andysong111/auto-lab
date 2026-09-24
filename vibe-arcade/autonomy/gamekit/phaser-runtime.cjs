'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const policy=require('./phaser-runtime.json');
function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function verify(file,configured=policy){
  if(!file||!fs.existsSync(file))throw Error('phaser_runtime_unavailable');
  const bytes=fs.statSync(file).size;
  if(bytes<configured.expected_min_bytes||bytes>configured.expected_max_bytes)throw Error('phaser_runtime_size');
  const sha256=digest(file);
  if(!configured.sha256||sha256!==configured.sha256)throw Error('phaser_runtime_hash');
  return {file,bytes,sha256,version:configured.phaser_version,runtime_filename:configured.runtime_filename};
}
module.exports={policy,digest,verify};
