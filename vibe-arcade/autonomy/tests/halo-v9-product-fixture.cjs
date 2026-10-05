'use strict';

const fs=require('node:fs'),path=require('node:path');
const {GoldenProductBuilder}=require('../adapters/golden-product.cjs');
const {create}=require('../orchestrator/manifest.cjs');
const {atomicJSON}=require('../orchestrator/files.cjs');
const runner=require('../foundry/radial-runner.cjs');

function blueprint(){return {schema:'playjolt-foundry-blueprint/1',game_id:'GAME-20261006-339',title:'Halo Guard',slug:'halo-guard',runner:'foundry/radial-runner.cjs',family_id:'radial-guarding',design_id:'radial-guarding-original-02',lane:'original',golden_baseline_id:'halo-guard-v9',seeds:[...runner.SEEDS],learning_focus:[],foundry:{schema:'playjolt-foundry-lineage/1',lane:'original',family_id:'radial-guarding',design_id:'radial-guarding-original-02',runner:'foundry/radial-runner.cjs',learning_focus:[],golden_baseline_id:'halo-guard-v9'},copy_policy:{forbidden:['names','branding','art','rules']},novelty_contract:'Productize the exact owner-approved PlayJolt Halo Guard V9 mechanic and Three.js presentation as an immutable product shell.',theme:{singular:'Wisp',plural:'Wisps',arena:'Sky Citadel',progress:'RESCUED',success:'SKY CITADEL SECURED',failure:'CORE OVERRUN'},variation:{id:'exact-v9-product-shell-01',axis:'product-shell',changed_components:['halo-guard-v9-product-v1']}};}

async function materialize(root){
  await new GoldenProductBuilder('halo-guard-v9-product-v1').build({workspace:root});
  const runtime=[
    [path.resolve(__dirname,'../../feel/audio.js'),'feelaudio.js'],
    [path.resolve(__dirname,'../../lab/taste-calibration/halo-guard-core.js'),'halo-guard-core.js'],
    [path.resolve(__dirname,'../gamekit/radialkit.js'),'radialkit.js'],
    [path.resolve(__dirname,'../gamekit/gamekit.js'),'gamekit.js']
  ];
  for(const [source,name] of runtime)fs.copyFileSync(source,path.join(root,name));
  const bp=blueprint(),model=runner.buildModel(bp),proposal=runner.proposalFor(bp,model);
  const manifest=create(proposal);
  atomicJSON(path.join(root,'manifest.json'),manifest);
  return {bp,manifest,model,proposal,contract:proposal.product_contract};
}

module.exports={blueprint,materialize};
