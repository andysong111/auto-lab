'use strict';
// Generic read-only archived grid-edge diagnostic. Data is independently reviewed;
// this is never a Factory QA substitute or a mechanism to execute a rejected game.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const raster=require('./raster.cjs'),{LIMITS}=require('./contract.cjs');
function audit(data,root){
 if(data.mode!=='archived_pixels_only'||!data.reviewed_by||!Array.isArray(data.topology?.edges))throw Error('reviewed archived data required');
 const pair=data.pair;
 for(const a of [pair.a,pair.b]){
  const edge=data.topology.edges.find(e=>(e[0]===a.edge[0]&&e[1]===a.edge[1])||(e[1]===a.edge[0]&&e[0]===a.edge[1]));
  if(a.legal!==Boolean(edge&&edge[2]===0))throw Error('archived topology projection mismatch');
 }
 if(pair.a.legal===pair.b.legal)throw Error('state pair must distinguish action availability');
 const sample=a=>{if(!/^[a-z0-9-]+\.png$/.test(a.file))throw Error('archive path');const b=fs.readFileSync(path.join(root,a.file));if(crypto.createHash('sha256').update(b).digest('hex')!==a.sha256)throw Error('archive evidence changed');return raster.sample(raster.decode(b),a.region);};
 const actual=raster.compare(sample(pair.a),sample(pair.b)),passed=raster.distinct(actual,LIMITS);
 return {schema_version:1,mode:data.mode,game_id:data.game_id,version:data.version,source_hash:data.source_hash,passed,check:'visual_legibility',code:passed?null:'product_route_topology_not_visible',state_pair:pair,actual,thresholds:{delta:LIMITS.delta,changed:LIMITS.changed},evidence:[pair.a.file,pair.b.file],production_authorized:false,candidate_executed:false,provider_calls:0,terminal_disposition_changed:false};
}
module.exports={audit};
