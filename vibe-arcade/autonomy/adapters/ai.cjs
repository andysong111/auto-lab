'use strict';
const {BuilderAdapter,RepairAdapter}=require('./workspace.cjs');
const {compile}=require('../providers/prompts.cjs');
const {applyOutput}=require('../providers/output.cjs');
async function implement(adapter,context) {
  const {manager,root}=adapter;
  const request=compile({...context,root,budget:{per_game:manager.config.per_game,request:manager.config.request}});
  const result=await manager.execute(request);
  await manager.guard();if(manager.signal?.aborted)throw manager.signal.reason;
  applyOutput(result,context.workspace,root,context.manifest);
  return {cause:result.summary,tests:result.tests.map(x=>'provider-suggested (not executed): '+x),provider_metadata:result.provider_metadata};
}
class AIBuilderAdapter extends BuilderAdapter {constructor({manager,root}){super();this.manager=manager;this.root=root;}build(context){return implement(this,context);}}
class AIRepairAdapter extends RepairAdapter {constructor({manager,root}){super();this.manager=manager;this.root=root;}available(){return true;}repair(context){return implement(this,context);}}
module.exports={AIBuilderAdapter,AIRepairAdapter};
