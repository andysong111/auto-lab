'use strict';
// Run after discovery builds. Presentation wiring only; no network or rules generation.
const fs=require('node:fs'),path=require('node:path');
function build(root=path.resolve(__dirname,'..')){
 const files=[['descent/index.html','/descent/shell.js'],['challengers/play.html','/challengers/boot.js'],['games/core-pins/index.html','/challengers/boot.js'],['games/nova-merge/index.html','/challengers/boot.js'],['games/orbit-sprint/index.html','/experience/session-ui.js']];
 for(const [file,before] of files){let s=fs.readFileSync(path.join(root,file),'utf8');
  if(!s.includes('href="/experience/replay-kit.css"'))s=s.replace('</head>','<link rel="stylesheet" href="/experience/replay-kit.css"></head>');
  if(!s.includes('src="/experience/replay-kit.js"')){const needle='<script src="'+before+'"></script>';if(!s.includes(needle))throw Error('retention_entry_missing:'+file);s=s.replace(needle,'<script src="/experience/replay-kit.js"></script>'+needle);}
  if(!s.includes('src="/experience/entry-hints.js"'))s=s.replace('</body>','<script src="/experience/entry-hints.js"></script></body>');
  fs.writeFileSync(path.join(root,file),s);
 }
 const home=path.join(root,'index.html');let s=fs.readFileSync(home,'utf8');if(!s.includes('src="/experience/entry-hints.js"'))s=s.replace('</body>','<script src="/experience/entry-hints.js"></script></body>');fs.writeFileSync(home,s);
}
if(require.main===module)build();module.exports={build};
