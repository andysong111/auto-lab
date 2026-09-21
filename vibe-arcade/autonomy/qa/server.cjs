'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const {safePath} = require('../orchestrator/files.cjs');
const mime = {'.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ogg':'audio/ogg','.wav':'audio/wav'};
async function serve(gameRoot) {
  const server = http.createServer((req,res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      const rel = decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'') || 'index.html';
      const file = safePath(gameRoot,rel);
      if (!mime[path.extname(file)] || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('missing'); }
      res.setHeader('Content-Type',mime[path.extname(file)]); res.setHeader('Cache-Control','no-store');
      res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Robots-Tag','noindex, nofollow');
      // Network effects are audited and blocked by the browser runner. Only game files are served here.
      fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(403); res.end('forbidden'); }
  });
  await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
  return {origin:`http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => { server.close(r); server.closeAllConnections(); })};
}
module.exports = {serve};
