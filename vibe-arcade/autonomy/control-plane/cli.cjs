#!/usr/bin/env node
'use strict';
const path=require('node:path'),fs=require('node:fs');
const {loadPolicy,listJobs,decision,snapshot}=require('./control.cjs'),{write}=require('./render.cjs');
function args(argv){const [command,id]=argv,out={command,id};for(let i=command==='decision'?2:1;i<argv.length;i++)if(argv[i].startsWith('--')){const k=argv[i].slice(2);out[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function main(argv=process.argv.slice(2)){
 const a=args(argv),root=path.resolve(a.root||path.join(__dirname,'../..')),policy=loadPolicy(a.policy?path.resolve(a.policy):undefined);
 if(a.command==='decision'){const m=listJobs(root).find(x=>x.game_id===a.id);if(!m)throw Error('job_not_found');console.log(JSON.stringify(decision(m,policy),null,2));return;}
 const s=snapshot({root,policy,provider_ready:a['provider-ready']==='true'});
 if(a.command==='snapshot'){console.log(JSON.stringify(s,null,2));return;}
 if(a.command==='dashboard'){const out=path.resolve(a.out||path.join(root,'autonomy/artifacts/control-plane'));write(s,out);console.log(JSON.stringify({out,snapshot:path.join(out,'snapshot.json'),dashboard:path.join(out,'dashboard.html')},null,2));return;}
 throw Error('Usage: node autonomy/control-plane/cli.cjs snapshot|dashboard [--root appRoot] [--provider-ready true] | decision GAME-ID');
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}module.exports={main};
