'use strict';
const fs=require('node:fs'),net=require('node:net'),assert=require('node:assert/strict');
(async()=>{
  const report={secret_absent:!Object.keys(process.env).some(k=>/SUPABASE|OPENAI_API_KEY|GITHUB_TOKEN|FACTORY_TEST_SECRET/.test(k)),root_read_only:false,candidate_read_only:false,outbound_blocked:false,socket_absent:!fs.existsSync('/var/run/docker.sock'),non_root:process.getuid()!==0};
  try{fs.writeFileSync('/opt/factory/forbidden','x');}catch{report.root_read_only=true;}
  try{fs.writeFileSync('/candidate/forbidden','x');}catch{report.candidate_read_only=true;}
  report.outbound_blocked=await new Promise(resolve=>{const s=net.connect({host:'1.1.1.1',port:443});const timer=setTimeout(()=>{s.destroy();resolve(true);},1000);s.on('connect',()=>{clearTimeout(timer);s.destroy();resolve(false);});s.on('error',()=>{clearTimeout(timer);resolve(true);});});
  for(const [key,ok] of Object.entries(report))assert.equal(ok,true,key);
  fs.writeFileSync('/artifacts/probe.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
