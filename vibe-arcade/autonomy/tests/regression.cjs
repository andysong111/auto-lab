'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const {hashTree,hash,atomicJSON}=require('../orchestrator/files.cjs');
const app=path.resolve(__dirname,'../..'),repo=path.dirname(app);
const out=process.env.FACTORY_EVIDENCE_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'factory-regression-'));
fs.mkdirSync(out,{recursive:true});
const env={...process.env,NODE_PATH:path.join(app,'autonomy/node_modules')};
const report={baseline_commit:spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim(),checks:[],passed:false,network:'unmatched external traffic blocked; existing accounts/rankings mocked locally'};
function run(name,args,cwd=repo,extra={}) {
  console.log('RUN',name);const started=Date.now();
  const p=spawnSync(process.execPath,args,{cwd,env:{...env,...extra},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  fs.writeFileSync(path.join(out,name+'.log'),(p.stdout||'')+(p.stderr||''));
  report.checks.push({name,exit_code:p.status,duration_ms:Date.now()-started,passed:p.status===0});
  atomicJSON(path.join(out,'regression.json'),report);
  if(p.status!==0)throw Error(name+' failed: '+(p.stderr||p.stdout||p.error).toString().slice(-3000));
  console.log('PASS',name);
}
function fingerprint() {
  const dirs=['games/astra-sentinel','release/astra-sentinel','descent','core-pins','challengers','games/orbit-sprint','runtime','shell','feel','community','measurement','marketing'];
  const value=Object.fromEntries(dirs.map(d=>[d,hashTree(path.join(app,d))]));value.backend=hashTree(path.join(repo,'loopjolt-backend'));
  for(const f of ['index.html','sitemap.xml','robots.txt','google6335338393f57b11.html','vercel.json','package.json','package-lock.json'])value[f]=hash(fs.readFileSync(path.join(app,f)).toString('base64'));
  return value;
}
try {
  run('build',['scripts/build-assets.cjs'],app);
  const before=fingerprint();
  run('canonical-contracts',['--test',...[
    'astra-core.test.cjs','astra-package.test.cjs','astra-release.test.cjs','descent-core.test.cjs',
    'proof24-core.test.cjs','challengers-core.test.cjs','orbit-core.test.cjs','runtime-core.test.cjs',
    'feel-core.test.cjs','arcade3-core.test.cjs','arcade3-clock.test.cjs','acquisition.test.cjs','acquisition-build.test.cjs','search-foundation.test.cjs'
  ].map(f=>'vibe-arcade/tests/'+f),'loopjolt-backend/tests/descent-verify.test.cjs','loopjolt-backend/tests/challengers-verify.test.cjs']);
  const preload=path.join(app,'autonomy/qa/regression-preload.cjs');
  for(const [name,file] of [['astra-v3','astra-simple-controls-browser.cjs'],['astra-campaign','astra-browser.cjs'],['deep-descent','descent-browser.cjs'],['core-pins-and-nova','proof24-browser.cjs'],['legacy-challengers','challengers-browser.cjs'],['orbit-and-auth-shell','browser-smoke.cjs']]) {
    const dest=path.join(out,name);fs.mkdirSync(dest,{recursive:true});
    run(name,['-r',preload,'vibe-arcade/tests/'+file],repo,{QA_OUT:dest,PROOF24_OUT:dest});
  }
  const after=fingerprint();
  if(JSON.stringify(before)!==JSON.stringify(after))throw Error('production_source_mutated_during_factory_regression');
  report.protected_source_hashes=after;report.passed=true;
} catch(e) {report.error=e.message;process.exitCode=1;console.error(e.message);}
finally {atomicJSON(path.join(out,'regression.json'),report);console.log(JSON.stringify({passed:report.passed,checks:report.checks,out},null,2));}
