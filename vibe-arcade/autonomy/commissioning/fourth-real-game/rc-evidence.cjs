'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const request=require('./rc-evidence-request.json'),out=path.resolve(process.argv[2]),responses={};
function get(route){const value=JSON.parse(execFileSync('gh',['api','--method','GET','repos/andysong111/auto-lab/'+route],{encoding:'utf8',maxBuffer:4*1024*1024}));responses[route]=value;return value;}
const deployments=get('deployments?sha='+request.rc_commit+'&per_page=100');
for(const d of deployments){if(d.sha!==request.rc_commit)throw Error('deployment_commit_mismatch');get('deployments/'+d.id+'/statuses?per_page=1');}
fs.writeFileSync(path.join(out,'github-deployment-responses.json'),JSON.stringify({request,run_id:process.env.GITHUB_RUN_ID,read_at:new Date().toISOString(),responses},null,2)+'\n');
console.log(JSON.stringify({commit:request.rc_commit,deployments:deployments.map(d=>({id:d.id,environment:d.environment,production_environment:d.production_environment})),writes:0,provider_calls:0}));
