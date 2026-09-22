'use strict';
// Operational holds do not turn infrastructure failures into game repair attempts.
class ProviderPause extends Error {
  constructor(code, message=code, status='PAUSED_PROVIDER') { super(message); this.code=code; this.worker_status=status; this.factory_pause=true; }
}
function modelError(code='model_failure') { const e=new Error(code); e.code=code; e.model_failure=true; return e; }
module.exports={ProviderPause,modelError};
