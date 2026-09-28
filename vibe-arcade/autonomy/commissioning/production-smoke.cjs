#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {smokeProduction}=require('../adapters/github-vercel.cjs');
async function main(argv=process.argv.slice(2)){
  const [packetFile,gameRoot,outFile]=argv;
  if(!packetFile||!gameRoot||!outFile)throw Error('usage production-smoke PACKET GAME_ROOT OUT');
  const packet=JSON.parse(fs.readFileSync(path.resolve(packetFile),'utf8'));
  const result=await smokeProduction({packet,gameRoot:path.resolve(gameRoot)});
  fs.writeFileSync(path.resolve(outFile),JSON.stringify({...result,production:true,automatic:false},null,2)+'\n');
  if(!result.passed)process.exitCode=3;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=2;});
module.exports={main};
