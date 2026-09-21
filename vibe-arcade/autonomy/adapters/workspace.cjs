'use strict';
const path=require('node:path');
const {copyGame}=require('../orchestrator/files.cjs');
class BuilderAdapter { async build(_context) { throw Error('BuilderAdapter.build must be implemented'); } }
class RepairAdapter { async repair(_context) { throw Error('RepairAdapter.repair must be implemented'); } }
// Reviewed workspaces are imported as data. No package scripts or arbitrary game JS are executed.
class WorkspaceBuilder extends BuilderAdapter {
  constructor(source) { super(); this.source=path.resolve(source); }
  async build({workspace}) { copyGame(this.source,workspace); return {cause:'Imported reviewed game workspace',tests:[]}; }
}
class WorkspaceRepair extends RepairAdapter {
  constructor(revisions=[]) { super(); this.revisions=revisions.map(p=>path.resolve(p)); }
  available(request) { return !!this.revisions[request.attempt-1]; }
  async repair({workspace,request}) {
    const source=this.revisions[request.attempt-1];
    if(!source) throw Error('repair_workspace_unavailable');
    copyGame(source,workspace); return {cause:'Applied workspace revision for '+request.qa_failures.map(f=>f.code).join(', '),tests:[]};
  }
}
// Future providers implement the same context -> workspace contract. The orchestrator never calls a model API.
module.exports={BuilderAdapter,RepairAdapter,WorkspaceBuilder,WorkspaceRepair};
