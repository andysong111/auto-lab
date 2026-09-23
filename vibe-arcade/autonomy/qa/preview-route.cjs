'use strict';
// Read-only deployment observation, independent of candidate name/mechanic.
// Browser supplies DOM attributes and their actually resolved URLs. No game code
// is evaluated here and no source is changed to accommodate the hosting layer.
function assess(manifest,observation){
 const origin=new URL(observation.entry_url).origin;
 if(!origin.endsWith('.vercel.app')||!origin.startsWith('https://'))throw Error('preview_origin_required');
 const prefix=`/autonomy/games/${manifest.game_id}/${manifest.version}/`;
 if(![prefix,prefix.slice(0,-1),prefix+'index.html',prefix+'index'].includes(new URL(observation.entry_url).pathname))throw Error('preview_identity_mismatch');
 if(!Array.isArray(observation.assets)||observation.assets.length<4)throw Error('incomplete_preview_observation');
 const failures=[];let checked=0;
 for(const a of observation.assets){
  if(!['script[src]','link[rel="stylesheet"]'].includes(a.selector)||typeof a.attribute!=='string'||/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(a.attribute))continue;
  checked++;
  const expected=new URL(a.attribute,origin+prefix).href;
  if(a.resolved_url!==expected)failures.push({selector:a.selector,attribute:a.attribute,expected,actual:a.resolved_url});
 }
 if(checked<4)throw Error('incomplete_relative_asset_observation');
 return {passed:failures.length===0,check:'preview_asset_resolution',entry_url:observation.entry_url,checked,failures};
}
module.exports={assess};
