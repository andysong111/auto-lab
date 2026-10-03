'use strict';
const runner=require('./family-runner.cjs');
function validateBlueprint(blueprint){
  runner.validateBlueprint(blueprint);
  if(blueprint.runner!=='foundry/tilt-runner.cjs'||blueprint.family_id!=='gravity-tilting')throw Error('tilt_runner_family_mismatch');
  return blueprint;
}
function buildModel(blueprint){validateBlueprint(blueprint);return runner.buildModel(blueprint);}
async function main(dir,command){
  const blueprint=require('../orchestrator/files.cjs').readJSON(require('node:path').join(require('node:path').resolve(dir),'blueprint.json'));
  validateBlueprint(blueprint);return runner.main(dir,command);
}
module.exports={validateBlueprint,buildModel,main};
