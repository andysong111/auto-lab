'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {FileStore}=require('../orchestrator/store.cjs'),{Factory}=require('../orchestrator/engine.cjs');
const {WorkspaceBuilder,WorkspaceRepair}=require('../adapters/workspace.cjs');
const {copyGame,hash,hashTree,atomicJSON}=require('../orchestrator/files.cjs');
const policy=require('../policies/quality-gate.json');
const source=path.resolve(__dirname,'../fixtures/dummy');
function setup(t,options={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'playjolt-factory-'));
  t.after(()=>{if(process.env.KEEP_FACTORY_TESTS!=='1')fs.rmSync(root,{recursive:true,force:true});});
  const store=new FileStore(root), spec={...require('../examples/dummy-spec.json'),...(options.spec||{})};
  const factory=new Factory({store,builder:new WorkspaceBuilder(options.source||source),repairer:new WorkspaceRepair(options.repairs||[]),...options});
  return {root,store,spec,factory};
}
function fixture(root,kind) {
  const dest=path.join(root,'fixtures',kind);copyGame(source,dest);
  const file=path.join(dest,'core.js');let code=fs.readFileSync(file,'utf8');
  if(kind==='broken')code=code.replace('const BROKEN = false','const BROKEN = true');
  if(kind==='runaway')code=code.replace('entities:1','entities:100000');
  if(kind==='infinite')code=code.replace('s.tick++;','while(true) {} s.tick++;');
  if(kind==='no-touch')code=code.replace('if (input.action)', 'if (input.action && !input.pointer)');
  if(kind==='no-keyboard')code=code.replace('input.x * 0.015','0');
  if(kind==='write')fs.appendFileSync(path.join(dest,'app.js'),"\nfetch('https://production.invalid/score',{method:'POST',body:'QA'}).catch(()=>{});\n");
  if(kind==='missing')fs.appendFileSync(path.join(dest,'index.html'),'<script src="./missing.js"></script>');
  fs.writeFileSync(file,code);return dest;
}
function mockQA({manifest,gameRoot,policy:p=policy}) {
  return Promise.resolve({schema_version:1,game_id:manifest.game_id,version:manifest.version,source_hash:hashTree(gameRoot),policy_hash:hash(p),passed:true,hard_failures:[],soft_failures:[],console_errors:[],page_errors:[],side_effects:[],screenshots:[],duration_ms:0,
    browser_cases:p.required_viewports.map(([width,height])=>({viewport:{width,height},checks:p.required_checks,passed:true}))});
}
module.exports={setup,fixture,mockQA,source,policy,atomicJSON};
