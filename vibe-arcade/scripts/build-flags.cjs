'use strict';
// Build-time asset copy only. Visitors load SVGs from LoopJolt, never an external flag CDN.
// npm ci verifies the pinned package's integrity. No dependency lifecycle scripts run.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),version='7.5.0';
const pkg=path.join(root,'node_modules','flag-icons');
assert.equal(JSON.parse(fs.readFileSync(path.join(pkg,'package.json'),'utf8')).version,version);
const client=fs.readFileSync(path.join(root,'community','client.js'),'utf8');
const match=client.match(/const countries='([^']+)'\.split\(' '\)/);
assert(match,'Country allowlist must exist in the community client');
const codes=match[1].split(' ');assert.equal(new Set(codes).size,249,'Expected all 249 supported ISO country/region codes');
const out=path.join(root,'assets','flags',version);fs.mkdirSync(out,{recursive:true});
let bytes=0;
for(const code of codes){
 assert(/^[A-Z]{2}$/.test(code));const filename=code.toLowerCase()+'.svg';
 const svg=fs.readFileSync(path.join(pkg,'flags','4x3',filename),'utf8');
 assert(svg.includes('<svg')&&svg.includes('viewBox='),filename+' must be a real SVG image');
 assert(!/<\s*(?:script|foreignObject|iframe|image)\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?!#)/i.test(svg),filename+' must not contain active or external content');
 fs.writeFileSync(path.join(out,filename),svg);bytes+=Buffer.byteLength(svg);
}
fs.copyFileSync(path.join(pkg,'LICENSE'),path.join(out,'LICENSE.txt'));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({source:'lipis/flag-icons',version,license:'MIT',countries:codes,count:codes.length,bytes},null,2)+'\n');
console.log('Built '+codes.length+' self-hosted SVG flags ('+bytes+' bytes total), including KR.');
