/* Pure replay adapter: caller must obtain run from the authenticated server-owned record. */
(function(root){'use strict';
function verifyRun(run,body,orbit,arcade){
 if(!run||!body||typeof body!=='object')throw Error('invalid_run');
 if(run.game==='orbit-sprint'){
  if(run.version!==orbit.VERSION)throw Error('version_mismatch');
  return orbit.replay(Number(run.seed),body.actions,body.ticks);
 }
 const cfg=arcade.CONFIG[run.game];
 if(!cfg||run.version!==cfg.version)throw Error('version_mismatch');
 return arcade.replay(run.game,Number(run.seed),body.actions,body.ticks);
}
root.LoopJoltVerify=verifyRun;if(typeof module!=='undefined'&&module.exports)module.exports=verifyRun;
})(globalThis);
