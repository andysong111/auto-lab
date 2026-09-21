'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {atomicJSON}=require('../orchestrator/files.cjs');
// Fail closed: no fallback to an unrestricted shell when Linux namespaces are unavailable.
// Commands are operator configuration, never fields in an untrusted game spec/repair response.
class CommandAdapter {
  constructor({command,timeout_ms=120000}) {
    if(!Array.isArray(command)||!command.length||!path.isAbsolute(command[0])||command.some(a=>typeof a!=='string')) throw Error('invalid_adapter_command');
    this.command=command;this.timeout=Math.min(300000,Math.max(100,timeout_ms));
  }
  build(c) { return this.execute(c,'build'); }
  repair(c) { return this.execute(c,'repair'); }
  async execute({workspace,manifest,spec,request,operationId},mode) {
    if(process.platform!=='linux'||!fs.existsSync('/usr/bin/bwrap')) throw Error('command_isolation_unavailable');
    atomicJSON(path.join(workspace,'factory-request.json'),{mode,manifest,spec,request,operation_id:operationId});
    const args=['--unshare-all','--die-with-parent','--new-session','--clearenv'];
    for(const dir of ['/usr','/lib','/lib64','/bin']) if(fs.existsSync(dir)) args.push('--ro-bind',dir,dir);
    const exeDir=path.dirname(this.command[0]);
    if(!['/usr','/lib','/lib64','/bin'].some(d=>exeDir===d||exeDir.startsWith(d+'/'))) args.push('--ro-bind',exeDir,exeDir);
    args.push('--proc','/proc','--dev','/dev','--tmpfs','/tmp','--bind',workspace,'/workspace','--chdir','/workspace',
      '--setenv','PATH','/usr/bin:/bin','--setenv','FACTORY_REQUEST','/workspace/factory-request.json','--',...this.command);
    await new Promise((resolve,reject)=>{
      const p=spawn('/usr/bin/bwrap',args,{env:{PATH:'/usr/bin:/bin'},detached:true,stdio:['ignore','ignore','pipe']});
      let message='',expired=false; p.stderr.on('data',d=>{message=(message+d).slice(-1000);});
      const kill=()=>{try{process.kill(-p.pid,'SIGKILL');}catch{}};
      const timer=setTimeout(()=>{expired=true;kill();},this.timeout);
      p.once('error',e=>{clearTimeout(timer);kill();reject(e);});
      p.once('close',code=>{clearTimeout(timer);kill();code===0?resolve():reject(Error(expired?'adapter_timeout':'adapter_failed: '+message));});
    });
    fs.rmSync(path.join(workspace,'factory-request.json'),{force:true});
    return {cause:mode+' command completed in isolated workspace',tests:[]};
  }
}
module.exports={CommandAdapter};
