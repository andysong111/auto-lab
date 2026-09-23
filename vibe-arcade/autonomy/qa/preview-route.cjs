'use strict';
// Read-only deployment observation, independent of candidate name/mechanic.
// Browser supplies DOM attributes and their actually resolved URLs. No game code
// is evaluated here and no source is changed to accommodate the hosting layer.
function assess(manifest,observation){
 const origin=new URL(observation.entry_url).origin;
 if(!origin.endsWith('.vercel.app')||!origin.startsWith('https://'))throw Error('preview_origin_required');
 const prefix=`/autonomy/games/${manifest.game_id}/${manifest.version}/`;
 if(!new URL(observation.entry_url).pathname.startsWith(prefix.slice(0,-1)))throw Error('preview_identity_mismatch');
 if(!Array.isArray(observation.assets)||observation.assets.length<4)throw Error('incomplete_preview_observation');
 const failures=[];
 for(const a of observation.assets){
  if(!['script[src]','link[rel="stylesheet"]'].includes(a.selector)||!/^\.\//.test(a.attribute))continue;
  const expected=new URL(a.attribute,origin+prefix).href;
  if(a.resolved_url!==expected)failures.push({selector:a.selector,attribute:a.attribute,expected,actual:a.resolved_url});
 }
 return {passed:failures.length===0,check:'preview_asset_resolution',entry_url:observation.entry_url,failures};
}
module.exports={assess};
