'use strict';
// Existing suites keep their own in-memory account/ranking mocks. This fallback
// blocks every unmatched request outside loopback; no real account or score can be sent.
const {chromium}=require('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async function(options) {
  const browser=await launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async function(options) {
    const ctx=await newContext({...options,serviceWorkers:'block'});
    await ctx.route('**/*',route=>{
      const r=route.request(),u=new URL(r.url());
      if(['127.0.0.1','localhost','[::1]'].includes(u.hostname)&&['GET','HEAD'].includes(r.method()))return route.continue();
      return route.abort('blockedbyclient');
    });
    await ctx.routeWebSocket('**/*',socket=>socket.close());
    return ctx;
  };
  return browser;
};
