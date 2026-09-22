'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawn,spawnSync}=require('node:child_process');
const {safePath,atomicJSON,readJSON,hashTree,hash,listFiles,inspectGame}=require('../orchestrator/files.cjs');
const {ProviderPause}=require('../providers/errors.cjs');
function environment() {return {PATH:process.env.PATH||'/usr/bin:/bin',HOME:os.tmpdir()};}
function dockerArgs({name,image,candidate,input,artifacts,limits,probe=false}) {
  if(!/^sha256:[a-f0-9]{64}$/.test(image))throw new ProviderPause('isolation_image_not_pinned');
  for(const p of [candidate,input,artifacts])if(!path.isAbsolute(p)||/[\n,]/.test(p))throw new ProviderPause('invalid_isolation_path');
  const uid=process.getuid?.()||65534,gid=process.getgid?.()||65534;
  return ['run','--rm','--init','--name',name,'--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',
    '--user',`${uid}:${gid}`,'--cpus',String(limits.cpus),'--memory',limits.memory_mb+'m','--memory-swap',limits.memory_mb+'m','--pids-limit',String(limits.pids),
    '--ulimit','nofile=1024:1024','--ulimit','core=0','--tmpfs','/tmp:rw,nosuid,nodev,size=192m','--shm-size','128m',
    '--mount',`type=bind,source=${candidate},target=/candidate,readonly`,
    '--mount',`type=bind,source=${input},target=/input,readonly`,
    '--mount',`type=bind,source=${artifacts},target=/artifacts`,image,...(probe?['probe']:[])];
}
class DockerQA {
  constructor({image=process.env.FACTORY_QA_IMAGE,limits,signal,exec=spawn,execSync=spawnSync}={}) {this.image=image;this.limits=limits;this.signal=signal;this.exec=exec;this.execSync=execSync;}
  assertAvailable() {
    if(process.platform!=='linux'||!/^sha256:[a-f0-9]{64}$/.test(this.image||''))throw new ProviderPause('isolation_unavailable','Build and pin the reviewed Docker QA image first','PAUSED_ISOLATION');
    const p=this.execSync('docker',['image','inspect','--format','{{.Id}}',this.image],{env:environment(),encoding:'utf8',timeout:10000,maxBuffer:16384});
    if(p.status!==0||p.stdout.trim()!==this.image)throw new ProviderPause('isolation_unavailable','Docker daemon/image unavailable; no host QA fallback','PAUSED_ISOLATION');
  }
  async run(config) {
    if(config.probe||config.suite||!config.manifest.product_contract)return this.runIsolated(config);
    const technical=await this.runIsolated({...config,outDir:path.join(config.outDir,'technical'),suite:'technical'});
    // Fatal source/policy failures never execute another candidate check.
    const fatal=technical.hard_failures.some(f=>config.policy.fatal_codes.includes(f.code));
    const product=fatal?null:await this.runIsolated({...config,outDir:path.join(config.outDir,'product'),suite:'product'});
    const combined={...technical,passed:technical.passed&&product?.passed===true,technical_qa:technical,product_qa:product,
      contract_hash:hash(config.manifest.product_contract),hard_failures:[...technical.hard_failures,...(product?.hard_failures||[])],
      screenshots:[...technical.screenshots.map(p=>'technical/'+p),...(product?.screenshots||[]).map(p=>'product/'+p)],
      console_errors:[...technical.console_errors,...(product?.console_errors||[])],page_errors:[...technical.page_errors,...(product?.page_errors||[])],
      side_effects:[...technical.side_effects,...(product?.side_effects||[])],duration_ms:technical.duration_ms+(product?.duration_ms||0)};
    for(const f of combined.hard_failures)if(f.evidence)f.evidence=f.evidence.map(p=>'product/'+p);
    atomicJSON(path.join(config.outDir,'qa.json'),combined);
    atomicJSON(path.join(config.outDir,'artifact-index.json'),{source_hash:technical.source_hash,artifacts:[...technical.screenshots.map(p=>({path:'technical/'+p,kind:'screenshot'})),...(product?.artifacts||[]).map(a=>({...a,path:'product/'+a.path}))]});
    return combined;
  }
  async runIsolated({manifest,gameRoot,outDir,policy,probe=false,suite='technical'}) {
    if(!['technical','product'].includes(suite))throw Error('invalid QA suite');
    this.assertAvailable();if(this.signal?.aborted)throw this.signal.reason;
    inspectGame(gameRoot);const source=hashTree(gameRoot),started=Date.now();
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-isolation-'));fs.chmodSync(temp,0o755);
    const candidate=path.join(temp,'candidate'),input=path.join(temp,'input'),artifacts=path.join(temp,'artifacts');
    for(const d of [candidate,input,artifacts])fs.mkdirSync(d,{mode:0o755});fs.chmodSync(artifacts,0o777);
    const name='playjolt-qa-'+crypto.randomUUID();
    try {
      // Mount a data-only copy, never the repository, home, API key, or Docker socket.
      for(const f of listFiles(gameRoot)){const to=safePath(candidate,f);fs.mkdirSync(path.dirname(to),{recursive:true,mode:0o755});fs.copyFileSync(safePath(gameRoot,f),to);fs.chmodSync(to,0o444);}

      atomicJSON(path.join(input,'qa.json'),{manifest,gameRoot:'/candidate',outDir:'/artifacts',policy,suite,deadline_ms:Math.min(this.limits.timeout_ms,suite==='product'?(policy.product?.run_timeout_ms||150000):policy.limits.run_timeout_ms)});fs.chmodSync(path.join(input,'qa.json'),0o444);
      const args=dockerArgs({name,image:this.image,candidate,input,artifacts,limits:this.limits,probe});
      const outcome=await new Promise((resolve,reject)=>{
        const p=this.exec('docker',args,{env:environment(),detached:true,stdio:['ignore','ignore','pipe']});let stderr='',expired=false,aborted=false,finished=false;
        p.stderr.on('data',x=>{stderr=(stderr+x).slice(-2000);});
        const remove=()=>{this.execSync('docker',['rm','-f',name],{env:environment(),stdio:'ignore',timeout:10000});try{process.kill(-p.pid,'SIGKILL');}catch{}};
        const stop=()=>{aborted=true;remove();};this.signal?.addEventListener('abort',stop,{once:true});
        const timer=setTimeout(()=>{expired=true;remove();},this.limits.timeout_ms+3000);
        const done=code=>{if(finished)return;finished=true;clearTimeout(timer);this.signal?.removeEventListener('abort',stop);if(aborted)reject(this.signal.reason);else resolve({code,expired,stderr});};
        p.once('error',()=>done(125));p.once('close',done);
      });
      if([125,126,127].includes(outcome.code))throw new ProviderPause('isolation_runtime_failed','Container failed to start; no host fallback','PAUSED_ISOLATION');
      const file=path.join(artifacts,probe?'probe.json':'qa.json');let result;
      if(fs.existsSync(file)&&fs.lstatSync(file).isFile()&&!fs.lstatSync(file).isSymbolicLink()&&fs.statSync(file).size<4*1024*1024)result=readJSON(file);
      if(probe){if(outcome.code!==0||!result)throw Error('isolation_probe_failed');return result;}
      if(outcome.expired||outcome.code===124||!result||(outcome.code!==0&&result.passed))result={schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:source,policy_hash:hash(policy),passed:false,
        hard_failures:[{code:outcome.expired||outcome.code===124?'timeout':'qa_crash',message:'Isolated QA did not produce a completed report'}],soft_failures:[],console_errors:[],page_errors:[],browser_cases:[],screenshots:[],side_effects:[],duration_ms:Date.now()-started};
      if(result.hard_failures?.some(f=>f.code==='qa_infrastructure'))throw new ProviderPause('qa_infrastructure','Isolated browser infrastructure failed','PAUSED_ISOLATION');
      if(result.game_id!==manifest.game_id||result.version!==manifest.version||result.source_hash!==source||result.policy_hash!==hash(policy)||hashTree(gameRoot)!==source)throw new ProviderPause('source_tampered');
      result.isolation={engine:'docker',image:this.image,network:'none',readonly:true,cpu:this.limits.cpus,memory_mb:this.limits.memory_mb,pids:this.limits.pids};
      fs.mkdirSync(outDir,{recursive:true});atomicJSON(path.join(outDir,'qa.json'),result);
      let exported=0,count=0;
      for(const f of fs.readdirSync(artifacts).filter(x=>/^(?:viewport-[0-9]+(?:-[a-z0-9-]+)?\.png|product-[0-9]+-[a-z0-9-]+\.(?:png|webm)|artifact-index\.json)$/.test(x))) {
        const from=path.join(artifacts,f),s=fs.lstatSync(from);if(s.isFile()&&!s.isSymbolicLink()&&s.size<16*1024*1024&&exported+s.size<128*1024*1024&&count<256){fs.copyFileSync(from,path.join(outDir,f));exported+=s.size;count++;}
      }
      return result;
    } finally {this.execSync('docker',['rm','-f',name],{env:environment(),stdio:'ignore',timeout:10000});fs.rmSync(temp,{recursive:true,force:true});}
  }
}
module.exports={DockerQA,dockerArgs,environment};
