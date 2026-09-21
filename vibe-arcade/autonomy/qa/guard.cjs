'use strict';
// Fresh unauthenticated browser contexts. No production reads or writes, including GET beacons.
async function installGuard(context, origin, record, allowedPrefix = '/') {
  await context.route('**/*', async route => {
    const req = route.request(), u = new URL(req.url());
    const mutation = !['GET','HEAD'].includes(req.method());
    const allowed = u.origin === origin && u.pathname.startsWith(allowedPrefix) && !/\/(?:api|functions|auth|rest|graphql)(?:\/|$)/i.test(u.pathname);
    if (mutation || !allowed) {
      record.push({kind:'network', method:req.method(), path:u.origin + u.pathname, blocked:true});
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  await context.routeWebSocket('**/*', ws => { record.push({kind:'websocket',blocked:true}); ws.close(); });
  await context.exposeBinding('__factorySideEffect', (_source,event) => record.push({...event,blocked:true}));
  await context.addInitScript(() => {
    const audit = event => { window.__factorySideEffect(event).catch(()=>{}); };
    Object.defineProperty(navigator,'sendBeacon',{value:() => { audit({kind:'beacon'}); return false; }});
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    Storage.prototype.setItem = function(k,v) { audit({kind:'storage',key:String(k)}); return set.call(this,k,v); };
    Storage.prototype.removeItem = function(k) { audit({kind:'storage_remove',key:String(k)}); return remove.call(this,k); };
    Storage.prototype.clear = function() { audit({kind:'storage_clear'}); return clear.call(this); };
    if (window.indexedDB) Object.defineProperty(window,'indexedDB',{value:{open:() => { audit({kind:'indexeddb'}); throw Error('QA blocks database access'); }}});
    if (window.RTCPeerConnection) Object.defineProperty(window,'RTCPeerConnection',{value:function(){audit({kind:'webrtc'});throw Error('QA blocks peer connections');}});
  });
}
module.exports = {installGuard};
