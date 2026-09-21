/* Reuse the original full-campaign test, against generated preview sources only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
require('../scripts/build-astra-polish.cjs').build();
const routes=process.argv.includes('--routes');
const file=path.join(__dirname,routes?'astra-routes.cjs':'astra-browser.cjs');
let source=fs.readFileSync(file,'utf8');
if(routes)source=source.replaceAll('/games/astra-sentinel','/labs/astra-sentinel');
else source=source.replace("'../games/astra-sentinel'","'../labs/astra-sentinel'")
 .replace("['core.js','art.js','app.js']","['motion.js','polish.js','preview.js','core.js','art.js','app.js']")
 .replace("await p.addStyleTag({content:fs.readFileSync(path.join(root,'style.css'),'utf8')});","await p.addStyleTag({content:fs.readFileSync(path.join(root,'style.css'),'utf8')+fs.readFileSync(path.join(root,'preview.css'),'utf8')});")
 .replaceAll("'loopjolt_astra_v1'","'loopjolt_astra_polish_preview1_responsive'")
 .replace("version:'astra-v1'","version:'astra-polish-preview1'");
const mod=new Module(file,module);mod.filename=file;mod.paths=module.paths;mod._compile(source,file);
