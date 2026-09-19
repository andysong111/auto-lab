/* Pure replay adapter: caller must obtain run from the authenticated server-owned record. */
(function(root){'use strict';
function verifyRun(run,body,orbit,arcade,challengers){
 if(!run||!body||typeof body!=='object')throw Error('invalid_run');
 if(run.game==='orbit-sprint'){if(run.version!==orbit.VERSION)throw Error('version_mismatch');return orbit.replay(Number(run.seed),body.actions,body.ticks);}
 const old=arcade.CONFIG[run.game];if(old){if(run.version!==old.version)throw Error('version_mismatch');return arcade.replay(run.game,Number(run.seed),body.actions,body.ticks);}
 const next=challengers?.CONFIG?.[run.game];if(next){if(run.version!==next.version)throw Error('version_mismatch');return challengers.replay(run.game,Number(run.seed),body.actions,body.ticks);}
 throw Error('version_mismatch');
}
root.LoopJoltVerify=verifyRun;if(typeof module!=='undefined'&&module.exports)module.exports=verifyRun;
})(globalThis);
