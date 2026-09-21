/* Same-origin, bounded event collection. No password/handle/referrer/body logging. */
'use strict';
const C=require('../measurement/contract.js');
const ENDPOINT='https://qmtmyqytzkdtglfcegef.supabase.co/functions/v1/loopjolt-acquisition';
function makeHandler(fetcher=fetch,logger=console){return async function(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({ok:false});
 if(req.headers?.origin!==C.ORIGIN||req.headers?.['sec-fetch-site']==='cross-site')return res.status(403).json({ok:false});
 if(!String(req.headers?.['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({ok:false});
 let body=req.body;try{if(typeof body==='string')body=JSON.parse(body);if(Buffer.byteLength(JSON.stringify(body)||'')>4096)return res.status(413).json({ok:false});}catch{return res.status(400).json({ok:false});}
 let data;try{data=C.clean(body);}catch(e){
  if(e.message==='legacy_event'){logger.log('[LJ_METRIC_LEGACY]',body.event);return res.status(204).end();}
  return res.status(400).json({ok:false});
 }
 if(!data)return res.status(204).end();
 try{const r=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Origin:C.ORIGIN},body:JSON.stringify(data),signal:AbortSignal.timeout(5000)});
  if(r.status===429)return res.status(429).json({ok:false});
  if(!r.ok){logger.warn('[LJ_METRIC_SINK_UNAVAILABLE]');return res.status(503).json({ok:false});}
  return res.status(204).end();
 }catch{logger.warn('[LJ_METRIC_SINK_UNAVAILABLE]');return res.status(503).json({ok:false});}
};}
module.exports=makeHandler();module.exports.makeHandler=makeHandler;
