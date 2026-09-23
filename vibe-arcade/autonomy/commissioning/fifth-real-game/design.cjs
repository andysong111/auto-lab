'use strict';
// Trusted DATA authoring only. Does not import, execute, or patch a candidate.
const fs=require('node:fs'),path=require('node:path');
const {hash}=require('../../orchestrator/files.cjs');
const {shortest,stageMetrics,validateModel}=require('../../qa/product-contract.cjs');
const seeds=[1,7,23,89,2026,4294967295],actions=['left','right','up','down'];
const packs=[
 {requirements:[[0,0],[0,0,1],[0,0,1,2]],polarity:[0,0,1,0]},
 {requirements:[[0,0],[0,4,0],[0,0,2,1]],polarity:[0,1,0,0]},
 {requirements:[[0,0],[2,0,0],[0,0,3,0]],polarity:[1,0,0,1]},
 {requirements:[[0,0],[0,0,2],[0,0,1,4]],polarity:[1,0,1,0]},
 {requirements:[[0,0],[0,1,0],[0,0,0,5]],polarity:[0,1,0,1]},
 {requirements:[[0,0],[4,0,0],[0,0,2,5]],polarity:[1,0,0,1]}
];
function packIndex(seed){const h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0;return ((h^(h>>>13))>>>0)%6;}
const initial=[1,0,-1,0,'playing'];
const id=v=>v.join(':');
function transitions(v,pack){
 const [stage,mask,focus,polarity,outcome]=v;if(outcome!=='playing')return [];
 const n=stage+1,all=(1<<n)-1,edges=[];
 for(let i=0;i<n;i++)if(!(mask&(1<<i)))edges.push({action:actions[i],values:[stage,mask,focus===i?-1:i,polarity,outcome]});
 if(mask===all)edges.push({action:'fire',values:stage===3?[4,0,-1,0,'success']:[stage+1,0,-1,0,outcome]});
 else if(focus>=0){
  const req=pack.requirements[stage-1][focus],hit=(mask&req)===req&&(stage!==3||pack.polarity[focus]===polarity);
  const next=[stage,hit?mask|(1<<focus):mask,-1,stage===3?1-polarity:0,outcome];
  if(id(next)!==id(v))edges.push({action:'fire',values:next});
 }
 return edges;
}
function graph(pack){const nodes={},queue=[initial];for(let k=0;k<queue.length;k++){const v=queue[k],key=id(v);if(nodes[key])continue;const raw=transitions(v,pack);nodes[key]={values:v,stage:v[0],...(v[4]==='success'?{success:true}:{}),edges:raw.map(e=>({action:e.action,to:id(e.values)}))};for(const e of raw)if(!nodes[id(e.values)])queue.push(e.values);}return {initial:id(initial),nodes};}
function minimumShots(g,start,goal){const dist=new Map([[start,0]]),todo=[start];while(todo.length){todo.sort((a,b)=>dist.get(a)-dist.get(b));const k=todo.shift(),n=g.nodes[k];if(goal(n))return dist.get(k);for(const e of n.edges){const d=dist.get(k)+(e.action==='fire'?1:0);if(d<(dist.get(e.to)??Infinity)){dist.set(e.to,d);if(!todo.includes(e.to))todo.push(e.to);}}}return null;}
function build(){const model={schema_version:1,projection:['state.stage','state.captured','state.focus','state.polarity','state.outcome'],seeds:{}},rows=[];
 for(const seed of seeds){const pack=packIndex(seed),g=graph(packs[pack]);model.seeds[seed]=g;const stages=[1,2,3].map(s=>{const start=id([s,0,-1,0,'playing']),m=stageMetrics(g,start);const firstShots=actions.slice(0,s+1).map((a,i)=>{const aimed=g.nodes[start].edges.find(e=>e.action===a).to;const volley=g.nodes[aimed].edges.find(e=>e.action==='fire').to;return {first_target:i,minimum_total_volleys:1+minimumShots(g,volley,n=>n.stage>s)};});return {...m,minimum_volleys:minimumShots(g,start,n=>n.stage>s),first_shot_options:firstShots};});
  for(const [k,n] of Object.entries(g.nodes))if(!shortest(g,k,x=>x.success))throw Error('softlock '+k);
  rows.push({seed,pack,nodes:Object.keys(g.nodes).length,stages});}
 validateModel(model);return {model,rows,packs};}
if(require.main===module){const {model,rows}=build();fs.writeFileSync(path.join(__dirname,'design-data.json'),JSON.stringify({seed_mapping:'h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0; pack=((h^(h>>>13))>>>0)%6',packs},null,2)+'\n');fs.writeFileSync(path.join(__dirname,'depth-review.json'),JSON.stringify({scope:'Independent finite data graph; not browser evidence',rows},null,2)+'\n');fs.writeFileSync(path.join(__dirname,'../../qa/reviewed/shard-armada-v1.json'),JSON.stringify(model)+'\n');console.log(JSON.stringify({oracle_hash:hash(model),rows:rows.map(r=>({seed:r.seed,pack:r.pack,nodes:r.nodes,actions:r.stages.map(s=>s.required_actions),choices:r.stages.map(s=>s.complexity),volleys:r.stages.map(s=>s.minimum_volleys),late_first:r.stages[2].first_shot_options}))},null,2));}
module.exports={build,packIndex,transitions,id,packs,minimumShots};
