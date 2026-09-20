/* Stage 2-1 adapter. LoopCommunity remains the ONLY credential/session owner. */
(function(root){
'use strict';
function create(community,fetcher=root.fetch?.bind(root)){
 if(!community||typeof community.api!=='function')throw Error('community_required');
 return Object.freeze({
  config:()=>community.config(),
  authenticated:()=>community.authenticated,
  getPlayer:()=>community.profile,
  loadPlayer:()=>community.me(),
  logout:()=>community.logout(),
  googleButton:(...args)=>community.googleButton(...args),
  renderFlagLabel:(...args)=>community.renderFlagLabel(...args),
  countryName:code=>community.countryName(code),
  start:payload=>community.api('start',payload),
  finish:payload=>community.api('finish',payload),
  async readBoard(query){
   const url=new URL(community.endpoint);url.search=new URLSearchParams({action:'board',...query});
   const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('board_unavailable');
   return response.json();
  }
 });
}
const api=Object.freeze({create});root.LoopJoltCommunityAdapter=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
