'use strict';
// Concatenate existing independent IIFEs; no bundler/package upgrade or network request.
const fs=require('node:fs'),path=require('node:path');
const FILES=Object.freeze(['runtime/core.js','runtime/community-adapter.js','shell/core.js','feel/phaser-fx.js','feel/audio.js','core-pins/shell.js','core-pins/feel.js','core-pins/view.js','core-pins/app.js']);
function build(root=path.resolve(__dirname,'..')){const text=FILES.map(file=>'/* '+file+' */\n'+fs.readFileSync(path.join(root,file),'utf8')).join('\n;\n');fs.mkdirSync(path.join(root,'core-pins'),{recursive:true});fs.writeFileSync(path.join(root,'core-pins/bundle.js'),text);return text;}
module.exports={FILES,build};if(require.main===module)build();
