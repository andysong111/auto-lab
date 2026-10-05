'use strict';

const fs=require('node:fs'),path=require('node:path');
const {BuilderAdapter}=require('./workspace.cjs');
const {copyGame,safePath}=require('../orchestrator/files.cjs');

const APP=path.resolve(__dirname,'../..');
const PRODUCTS=Object.freeze({
  'halo-guard-v9-product-v1':{
    source:path.join(APP,'autonomy/foundry/golden/halo-guard-v9/product'),
    assets:[
      [path.join(APP,'lab/taste-calibration/vendor/three.core.min.js'),'three.core.min.js'],
      [path.join(APP,'lab/taste-calibration/vendor/three.module.min.js'),'three.module.min.js'],
      [path.join(APP,'lab/taste-calibration/assets/halo-sky-citadel-bg-v2.png'),'halo-sky-citadel-bg-v2.png']
    ]
  }
});

class GoldenProductBuilder extends BuilderAdapter {
  constructor(id){super();this.id=id;this.product=PRODUCTS[id];if(!this.product)throw Error('unknown_golden_product');}
  async build({workspace}){
    copyGame(this.product.source,workspace);
    for(const [source,name] of this.product.assets){
      if(!fs.existsSync(source))throw Error('golden_product_asset_missing:'+name);
      fs.copyFileSync(source,safePath(workspace,name));
    }
    return {cause:'Materialized owner-approved '+this.id+' without a provider call',tests:['Factory-owned exact source and assets']};
  }
}

module.exports={GoldenProductBuilder,PRODUCTS};
