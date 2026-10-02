'use strict';
const runner=require('./family-runner.cjs');
function validateBlueprint(blueprint){
  runner.validateBlueprint(blueprint);
  if(blueprint.runner!=='foundry/arcade-runner.cjs'||blueprint.family_id!=='comet-catching')throw Error('arcade_runner_family_mismatch');
  return blueprint;
}
function buildModel(blueprint){validateBlueprint(blueprint);return runner.buildModel(blueprint);}
async function main(dir,command){
  const blueprint=require('../orchestrator/files.cjs').readJSON(require('node:path').join(require('node:path').resolve(dir),'blueprint.json'));
  validateBlueprint(blueprint);
  return runner.main(dir,command);
}
module.exports={validateBlueprint,buildModel,main};
