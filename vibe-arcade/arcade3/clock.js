/* Ranked timing integrity: rendering stalls cannot buy extra reaction time. */
(function(root){'use strict';
function create(){return {discardedMs:0,valid:true};}
function observe(state,elapsedMs){if(!state.valid)return false;if(!Number.isFinite(elapsedMs)||elapsedMs<0){state.valid=false;return false;}state.discardedMs+=Math.max(0,elapsedMs-100);if(elapsedMs>250||state.discardedMs>150)state.valid=false;return state.valid;}
const api={create,observe};root.RankedClock=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
