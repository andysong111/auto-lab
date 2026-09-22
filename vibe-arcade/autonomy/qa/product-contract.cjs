'use strict';
const Ajv=require('ajv'), fs=require('node:fs'), path=require('node:path');
const {hash}=require('../orchestrator/files.cjs');
const schema=require('../schema/product-quality-contract.schema.json');
const check=new Ajv({allErrors:true,strict:false}).compile(schema);
const forbidden=new Set(['__proto__','prototype','constructor']);
function at(value,key){for(const part of key.split('.')){if(forbidden.has(part))throw Error('unsafe diagnostic path');value=value?.[part];}return value;}
function validate(contract){
  if(!check(contract))throw Error('product_contract: '+JSON.stringify(check.errors));
  for(const p of [contract.difficulty.stage_path,contract.difficulty.complexity_path,...contract.difficulty.projection])
    if(/(?:^|\.)(?:score|best|tick|time|elapsed|hp|health|timer|duration)(?:_|\.|$)/i.test(p))throw Error('product_contract: time, HP and score are not decision depth');
  const serialized=JSON.stringify(contract);
  if(/__proto__|constructor|prototype/.test(serialized))throw Error('product_contract: unsafe path');
  if(contract.score.selector===contract.best.selector)throw Error('product_contract: score and best must be separate');
  return contract;
}
// A trusted, reviewed DATA adapter. There is no candidate module loading, eval,
// browser access or state mutation. Approval lives in the pinned Factory image.
function review(contract,{allowFixture=false}={}){
  validate(contract);
  const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'reviewed/registry.json'),'utf8'));
  const entry=registry.entries.find(x=>x.id===contract.difficulty.oracle_id);
  if(!entry||entry.sha256!==contract.difficulty.oracle_sha256)throw Error('product_difficulty_unreviewed: exact oracle approval missing');
  if(entry.scope==='fixture'&&!allowFixture)throw Error('product_difficulty_unreviewed: test oracle is not a candidate approval');
  if(!/^[a-z0-9-]+\.json$/.test(entry.file))throw Error('unsafe oracle file');
  const model=JSON.parse(fs.readFileSync(path.join(__dirname,'reviewed',entry.file),'utf8'));
  if(hash(model)!==entry.sha256)throw Error('product_difficulty_unreviewed: oracle digest mismatch');
  if(JSON.stringify(model.projection)!==JSON.stringify(contract.difficulty.projection))throw Error('oracle projection mismatch');
  validateModel(model);
  for(const seed of contract.difficulty.deterministic_seeds)if(!model.seeds[String(seed)])throw Error('oracle seed missing: '+seed);
  return {model,approval:entry};
}
function validateModel(m){
  if(m.schema_version!==1||!Array.isArray(m.projection)||m.projection.length<2||m.projection.length>12||!m.seeds||Object.keys(m.seeds).length>24)throw Error('invalid bounded oracle');
  for(const g of Object.values(m.seeds)){
    const ids=Object.keys(g.nodes||{});if(ids.length<3||ids.length>128||!g.nodes[g.initial])throw Error('invalid oracle nodes');
    for(const [id,n] of Object.entries(g.nodes)){
      if(!Array.isArray(n.values)||n.values.length!==m.projection.length||!Number.isInteger(n.stage)||n.stage<0||!Array.isArray(n.edges)||n.edges.length>8)throw Error('invalid oracle node '+id);
      for(const e of n.edges)if(!g.nodes[e.to]||typeof e.action!=='string')throw Error('invalid oracle edge');
    }
    if(new Set(Object.values(g.nodes).map(n=>JSON.stringify(n.values))).size!==ids.length)throw Error('ambiguous oracle projection');
    if(!shortest(g,g.initial,n=>n.success))throw Error('oracle has no success path');
  }
}
function shortest(g,start,goal){
  const queue=[{id:start,steps:[]}],seen=new Set([start]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];if(goal(g.nodes[p.id]))return p.steps;
    for(const e of g.nodes[p.id].edges)if(!seen.has(e.to)){seen.add(e.to);queue.push({id:e.to,steps:[...p.steps,{from:p.id,...e}]});}
  }
  return null;
}
function identify(model,g,snapshot){const values=model.projection.map(p=>at(snapshot,p));return Object.keys(g.nodes).find(id=>JSON.stringify(g.nodes[id].values)===JSON.stringify(values));}
function stageMetrics(g,start){
  const node=g.nodes[start],plan=shortest(g,start,n=>n.stage>node.stage||n.success);
  const width=new Set(node.edges.filter(e=>e.to!==start).map(e=>e.to)).size;
  return {stage:node.stage,complexity:width,required_actions:plan?.length??null,plan};
}
module.exports={validate,review,at,shortest,identify,stageMetrics,validateModel};
