'use strict';
const runner=require('./family-runner.cjs');
function validateBlueprint(blueprint){
  const value=runner.validateBlueprint(blueprint);
  if(blueprint.runner!=='foundry/reflex-runner.cjs'||blueprint.family_id!=='threat-parry')throw Error('reflex_runner_family_mismatch');
  return value;
}
function buildModel(blueprint){validateBlueprint(blueprint);return runner.buildModel(blueprint);}
async function main(dir,command){
  const fs=require('node:fs'),path=require('node:path'),blueprint=JSON.parse(fs.readFileSync(path.join(path.resolve(dir),'blueprint.json'),'utf8'));
  validateBlueprint(blueprint);return runner.main(dir,command);
}
module.exports={validateBlueprint,buildModel,main};
