/* Shared, side-effect-free acquisition contract. No account identifiers or raw referrer URLs. */
(function(root){'use strict';
const SCHEMA='loopjolt-acquisition/4.1',ORIGIN='https://vibe-arcade-dun.vercel.app';
const EVENTS=new Set(['page_view','game_open','game_start','game_finish','replay','share','next_game','score_verified','ranked_downgrade','ranked_entry']);
const GAMES=new Set(['gyro-drop','core-pins','nova-merge','orbit-sprint','reaction-rush','perfect-timing','dont-press','color-trap','memory-grid','odd-one-out']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const token=(v,n=80)=>typeof v==='string'&&new RegExp('^[a-zA-Z0-9_-]{0,'+n+'}$').test(v)?v.toLowerCase():'';
function source(v){const raw=token(v,48);return ({ig:'instagram',yt:'youtube',tt:'tiktok',th:'threads',fb:'facebook'})[raw]||raw||'direct';}
function gameFor(raw){try{const u=new URL(raw,ORIGIN),p=u.pathname.replace(/\/$/,'').replace(/\/index\.html$/,'');if(p==='/descent')return 'gyro-drop';const named=p.match(/^\/games\/([a-z-]+)$/)?.[1];if(GAMES.has(named))return named;if(/^\/(challengers|arcade3)\/play(?:\.html)?$/.test(p)){const g=u.searchParams.get('game');return GAMES.has(g)?g:null;}return null;}catch{return null;}}
function attribution(search,referrer=''){
 const q=new URLSearchParams(search),explicit=['source','medium','campaign','content'].some(k=>q.has('utm_'+k));
 let sourceRaw=token(q.get('utm_source'),48),medium=token(q.get('utm_medium'),40),campaign=token(q.get('utm_campaign')),content=token(q.get('utm_content'));
 let resolved=source(sourceRaw),basis=explicit?'utm':'direct';
 if(!explicit&&referrer){try{const host=new URL(referrer).hostname.toLowerCase();if(host!==new URL(ORIGIN).hostname){basis='referrer';resolved=/(^|\.)google\.[a-z.]+$/.test(host)?'google':/(^|\.)(bing\.com)$/.test(host)?'bing':/(^|\.)(instagram\.com)$/.test(host)?'instagram':/(^|\.)(youtube\.com|youtu\.be)$/.test(host)?'youtube':/(^|\.)(tiktok\.com)$/.test(host)?'tiktok':/(^|\.)(threads\.com|threads\.net)$/.test(host)?'threads':'referral';}}catch{}}
 if(explicit&&!sourceRaw){resolved='unknown';basis='partial_utm';}
 const profile=['profile','bio','link_in_bio'].includes(medium)||['link_in_bio','bio'].includes(content)||campaign==='alwayson';
 const scope=profile?'channel_only':explicit&&campaign&&content?'content_tagged':resolved==='direct'?'unattributed':'channel_only';
 return {source:resolved,source_raw:sourceRaw,medium,campaign,content,scope,basis};
}
function clean(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!EVENTS.has(body.event))throw Error('invalid_event');
 if(body.schema!==SCHEMA)throw Error('legacy_event');
 if(!UUID.test(body.event_id||'')||!UUID.test(body.session_id||''))throw Error('invalid_id');
 if(body.excluded===true)return null;
 const p=body.props&&typeof body.props==='object'&&!Array.isArray(body.props)?body.props:{};
 const game=GAMES.has(p.game)?p.game:gameFor(body.path);
 let path=typeof body.path==='string'?body.path.split(/[?#]/)[0].slice(0,120):'/';
 if(!/^\/[a-zA-Z0-9_/.\-]*$/.test(path))path='/';
 const a=attribution(new URLSearchParams({utm_source:token(Object.prototype.hasOwnProperty.call(body,'source_raw')?body.source_raw:body.source,48),utm_medium:token(body.medium,40),utm_campaign:token(body.campaign),utm_content:token(body.content)}).toString());
 if(!a.source_raw&&['google','bing','referral','direct','instagram','youtube','tiktok','threads','facebook'].includes(body.source)){a.source=body.source;a.basis=body.source==='direct'?'direct':'referrer';a.scope=body.source==='direct'?'unattributed':'channel_only';}
 return {schema:SCHEMA,event:body.event,event_id:body.event_id.toLowerCase(),session_id:body.session_id.toLowerCase(),attempt_id:UUID.test(body.attempt_id||'')?body.attempt_id.toLowerCase():null,path,build:token(body.build,48),...a,props:{game,ranked:typeof p.ranked==='boolean'?p.ranked:null,to:GAMES.has(p.to)?p.to:null}};
}
const api=Object.freeze({SCHEMA,ORIGIN,EVENTS,GAMES,UUID,token,source,gameFor,attribution,clean});
root.LoopAcquisition=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
