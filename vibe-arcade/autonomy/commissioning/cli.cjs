#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validateProposal}=require('./spec-gate.cjs'),{buildPacket}=require('./release-packet.cjs');
function read(file){return JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));}
function main(argv=process.argv.slice(2)){
  const [cmd,file,...rest]=argv;if(!cmd||!file)throw Error('Usage: commissioning/cli.cjs check-spec FILE | release-packet MANIFEST [--out FILE] [--decision PENDING|APPROVE|REJECT]');
  const opts={};for(let i=0;i<rest.length;i+=2){if(!rest[i].startsWith('--')||!rest[i+1])throw Error('invalid_option');opts[rest[i].slice(2)]=rest[i+1];}
  let result;
  if(cmd==='check-spec')result=validateProposal(read(file));
  else if(cmd==='release-packet')result=buildPacket(read(file),{decision:opts.decision||'PENDING',reviewed_by:opts['reviewed-by']||null,base_ref:opts['base-ref']||'main'});
  else throw Error('unknown_command');
  const text=JSON.stringify(result,null,2)+'\n';if(opts.out)fs.writeFileSync(path.resolve(opts.out),text);process.stdout.write(text);if(result.passed===false)process.exitCode=2;
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}module.exports={main};
