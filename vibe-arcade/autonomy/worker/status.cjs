'use strict';
const fs=require('node:fs');
const {safePath,readJSON}=require('../orchestrator/files.cjs');
const STATES=new Set(['IDLE','RUNNING','RC_READY','READY_TO_SHIP','REJECTED','WAITING_RC','PAUSED_PROVIDER','PAUSED_ISOLATION','PAUSED_BUDGET','PAUSED_CONCURRENCY','PAUSED_KILL_SWITCH','PAUSED_INTAKE','PAUSED_RC','PAUSED_SHUTDOWN','PAUSED_POLICY','PAUSED_CONFIG','PAUSED_ERROR']);
function readStatus(root,game=null) {
  const file=safePath(root,game?`autonomy/artifacts/worker/jobs/${game.game_id}.json`:'autonomy/artifacts/worker/status.json');
  if(!fs.existsSync(file))return null;
  try {if(fs.statSync(file).size>32768)return null;const s=readJSON(file);
    if(s.schema!=='playjolt-worker/1'||!STATES.has(s.status)||s.auto_production_ship!==false)return null;
    if(game&&(s.game_id!==game.game_id||s.version!==game.version||s.factory_state!==game.state))return null;
    return s;
  }catch{return null;}
}
module.exports={readStatus,STATES};
