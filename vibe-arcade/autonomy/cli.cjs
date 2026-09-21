#!/usr/bin/env node
'use strict';
const path=require('node:path'),fs=require('node:fs');
const {FileStore}=require('./orchestrator/store.cjs'),{Factory}=require('./orchestrator/engine.cjs');
const {WorkspaceBuilder,WorkspaceRepair}=require('./adapters/workspace.cjs');
const {CommandAdapter}=require('./adapters/command.cjs');
const {GitHubVercelAdapter}=require('./adapters/github-vercel.cjs');
const {readJSON}=require('./orchestrator/files.cjs');
async function main(argv=process.argv.slice(2)) {
  const [command,id]=argv,opts={};
  for(let i=1;i<argv.length;i++)if(argv[i].startsWith('--')) {const key=argv[i].slice(2);opts[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}
  const root=path.resolve(opts.root||path.join(__dirname,'..')),store=new FileStore(root);
  if(command==='status') {console.log(JSON.stringify(store.get(id),null,2));return;}
  const config=opts.config?readJSON(path.resolve(opts.config)):{};
  const commandAdapter=config.command?new CommandAdapter(config.command):null;
  const source=opts.workspace||config.workspace;
  const builder=commandAdapter||(source?new WorkspaceBuilder(path.resolve(source)):null);
  const repairer=commandAdapter||new WorkspaceRepair(config.repair_workspaces||[]);
  const factory=new Factory({store,builder,repairer,release:opts.rc?new GitHubVercelAdapter({baseRef:config.base_ref||'main'}):null});
  let result;
  if(command==='create') {if(!opts.spec)throw Error('--spec required');result=await factory.create(readJSON(path.resolve(opts.spec)));}
  else if(['run','qa','repair'].includes(command)) {
    if(command==='repair'&&!['QA_FAILED','QUALITY_FAILED','BUILD_FAILED','REPAIR_PENDING','REPAIRING'].includes(store.get(id).state))throw Error('repair_requires_failed_job');
    result=await factory.run(id,{stopAfterQA:command==='qa',rc:!!opts.rc});
  } else throw Error('Usage: node autonomy/cli.cjs create --spec file | run|qa|repair|status GAME-YYYYMMDD-NNN [--workspace dir] [--config file] [--rc] [--root appRoot]');
  console.log(JSON.stringify(result,null,2));
  if(result.state==='REJECTED')process.exitCode=2;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
