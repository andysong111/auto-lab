/* Approved Astra Sentinel P2 production builder.
 * Builds from the already-tested P2 lab candidate, then removes preview-only UI/state.
 * Source v1 files remain as rollback material; Vercel rewrites the canonical route here. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function build(root=path.resolve(__dirname,'..')){
  const preview=require('./build-astra-polish.cjs').build(root,{revision:'p2'}).dest;
  const dest=path.join(root,'release/astra-sentinel');fs.mkdirSync(dest,{recursive:true});
  const get=f=>fs.readFileSync(path.join(preview,f),'utf8'),put=(f,s)=>fs.writeFileSync(path.join(dest,f),s);
  const copy=f=>fs.copyFileSync(path.join(preview,f),path.join(dest,f));
  function once(s,a,b){if(s.split(a).length!==2)throw Error('release_base_drift:'+a.slice(0,80));return s.replace(a,b);}

  let core=get('core.js');
  core=once(core,"const VERSION='astra-polish-preview2'","const VERSION='astra-v2'");
  put('core.js',core);

  let app=get('app.js');
  app=once(app,"KEY='loopjolt_astra_polish_preview2_'+AstraMotion.mode","KEY='loopjolt_astra_v2'");
  const seed=/const rawSeed=new URLSearchParams\(location\.search\)\.get\('seed'\);const chosenSeed=[\s\S]*?;state=R\.create\(chosenSeed\);/;
  if(!seed.test(app))throw Error('release_seed_base_drift');
  app=app.replace(seed,"state=R.create(capture?74021:crypto.getRandomValues(new Uint32Array(1))[0]);");

  // Reliable dash input: pointer-down fires immediately and a three-tick buffer prevents
  // a click between fixed simulation steps from being lost. The tested P2 core already
  // scales dash distance by 1.4 so screen-space reach matches the original arena.
  app=once(app,'let keys=new Set(),joy=null,pointer=null,dashRequested=false,frameId=0','let keys=new Set(),joy=null,pointer=null,dashBuffer=0,frameId=0');
  app=once(app,'return{x,y,dash:dashRequested};','return{x,y,dash:dashBuffer>0};');
  app=once(app,'function resetInput(){keys.clear();joy=null;pointer=null;dashRequested=false;AstraMotion.reset(state.player);}','function resetInput(){keys.clear();joy=null;pointer=null;dashBuffer=0;AstraMotion.reset(state.player);}');
  app=once(app,"$('dash').onclick=()=>{if(!paused&&state.phase==='playing'){dashRequested=true;canvas.focus({preventScroll:true});}};",
    "function requestDash(){if(paused||state.phase!=='playing'||state.player.dashCd>0)return false;dashBuffer=Math.max(dashBuffer,3);canvas.focus({preventScroll:true});return true;}\n$('dash').addEventListener('pointerdown',e=>{e.preventDefault();requestDash();});\n$('dash').onclick=e=>e.preventDefault();");
  app=once(app,"if(e.code==='Space'&&!e.repeat&&!/BUTTON|A/.test(e.target.tagName)){e.preventDefault();dashRequested=true;}",
    "if(e.code==='Space'&&!e.repeat&&!/BUTTON|A/.test(e.target.tagName)){e.preventDefault();requestDash();}");
  app=once(app,'const input=movement();R.step(state,input);dashRequested=false;view.effects(state.events);',
    'const input=movement(),beforeDash=state.dashes;R.step(state,input);if(state.dashes>beforeDash)dashBuffer=0;else if(dashBuffer>0)dashBuffer--;view.effects(state.events);');
  app=once(app,"'SPACE · READY'","'SPACE / TAP · READY'");

  const disabled="$('share').disabled=true;$('share').textContent='REVIEW BUILD · NOT PUBLISHED';";
  const sharing=`$('share').onclick=async()=>{const url='https://vibe-arcade-dun.vercel.app/games/astra-sentinel';try{await navigator.clipboard.writeText('I reclaimed '+state.cleared+'/9 gates in Astra Sentinel. Can you reach the final form? '+url);$('share').textContent='Copied ✓';}catch{$('share').textContent='Copy this page address to share';}};`;
  app=once(app,disabled,sharing);
  put('app.js',app);

  let html=get('index.html');
  html=html.replace(/<meta name="robots"[^>]*>/,'').replace(/<meta property="og:[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'');
  html=html.replace(/<section class="review-bar"[\s\S]*?<\/section>/,'');
  html=html.replace('<h1>Astra Sentinel<span class="review-chip">P2</span></h1>','<h1>Astra Sentinel</h1>');
  html=html.replace('[REVIEW P2] Astra Sentinel — Wider Arena & Escalating Combat','Astra Sentinel — Nine-Gate Arena Roguelite | LoopJolt');
  const meta='<link rel="canonical" href="https://vibe-arcade-dun.vercel.app/games/astra-sentinel"><meta property="og:title" content="Astra Sentinel — Move. Dodge. Evolve."><meta property="og:description" content="A wider arena, nine escalating gates and three guardians. Evolve your Sentinel and survive the citadel."><meta property="og:type" content="website"><meta property="og:url" content="https://vibe-arcade-dun.vercel.app/games/astra-sentinel">';
  html=html.replace('</head>',meta+'<link rel="stylesheet" href="/release/astra-sentinel/polish.css"></head>');
  html=html.replaceAll('/labs/astra-sentinel/','/release/astra-sentinel/');
  html=html.replace('<script src="/release/astra-sentinel/preview.js"></script>','');
  html=html.replace('<link rel="stylesheet" href="/release/astra-sentinel/preview.css">','');
  html=html.replace('AN ORIGINAL EXPEDITION','VETERAN EXPEDITION');
  html=html.replace('05 / ARENA ROGUELITE','05 / ARENA ROGUELITE · V2');
  put('index.html',html);
  // Vercel cleanUrls prefers a sibling .html file for the canonical clean path.
  // Keep the v1 directory source untouched; the build-only shim serves the exact P2 release HTML.
  fs.writeFileSync(path.join(root,'games/astra-sentinel.html'),html);

  for(const f of ['arena.js','arena-view.js','motion.js','polish.js','art.js','style.css'])copy(f);
  const previewCss=get('preview.css'),start=previewCss.indexOf('.evolution-preview');
  if(start<0)throw Error('release_css_base_drift');
  put('polish.css',previewCss.slice(start));
  return {dest,version:'astra-v2',canonical:'/games/astra-sentinel',canonicalHtml:path.join(root,'games/astra-sentinel.html'),dashBuffered:true,production:true};
}
if(require.main===module)console.log(JSON.stringify(build()));module.exports={build};
