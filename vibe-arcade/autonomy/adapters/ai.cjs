'use strict';
const {BuilderAdapter,RepairAdapter}=require('./workspace.cjs');
const {compile}=require('../providers/prompts.cjs');
const {applyOutput}=require('../providers/output.cjs');
const {ProviderPause}=require('../providers/errors.cjs');
async function implement(adapter,context) {
  const {manager,root}=adapter;
  const rejected=context.request?manager.rejectedContext(context.manifest.game_id,context.request.attempt):null;
  let request;
  try { request=compile({...context,root,rejected,budget:{per_game:manager.config.per_game,request:manager.config.request}}); }
  catch(e) {
    if(e.factory_pause||e.model_failure)throw e;
    throw new ProviderPause('provider_context_compilation_failed',String(e?.message||e),'PAUSED_ERROR');
  }
  const result=await manager.execute(request);
  await manager.guard();if(manager.signal?.aborted)throw manager.signal.reason;
  applyOutput(result,context.workspace,root,context.manifest);
  return {cause:result.summary,tests:result.tests.map(x=>'provider-suggested (not executed): '+x),provider_metadata:result.provider_metadata};
}
class AIBuilderAdapter extends BuilderAdapter {constructor({manager,root}){super();this.manager=manager;this.root=root;}build(context){return implement(this,context);}}
class AIRepairAdapter extends RepairAdapter {constructor({manager,root}){super();this.manager=manager;this.root=root;}available(){return true;}repair(context){return implement(this,context);}}
module.exports={AIBuilderAdapter,AIRepairAdapter};
