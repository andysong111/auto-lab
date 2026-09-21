/* Astra Sentinel production builder.
 * Builds the approved wider/harder P2 combat, then publishes the simplified-control release.
 * Public controls are movement only; weapons auto-fire and the simulation has no dash action. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function build(root=path.resolve(__dirname,'..')){
  const preview=require('./build-astra-polish.cjs').build(root,{revision:'p2'}).dest;
  const dest=path.join(root,'release/astra-sentinel');fs.mkdirSync(dest,{recursive:true});
  const get=f=>fs.readFileSync(path.join(preview,f),'utf8'),put=(f,s)=>fs.writeFileSync(path.join(dest,f),s);
  const copy=f=>fs.copyFileSync(path.join(preview,f),path.join(dest,f));
  function once(s,a,b){if(s.split(a).length!==2)throw Error('release_base_drift:'+a.slice(0,80));return s.replace(a,b);}

  let core=get('core.js');
  core=once(core,"const VERSION='astra-polish-preview2'","const VERSION='astra-v3'");
  core=once(core,"{id:'flux',name:'PHASE DRIVE',tag:'DASH',text:'Reduce dash cooldown by 25%; move 8% faster.',max:2}",
    "{id:'flux',name:'VECTOR DRIVE',tag:'MOBILITY',text:'Move 8% faster. Stacks up to two times.',max:2}");
  core=once(core,
    "if(input.dash===true&&p.dashCd===0){p.dash=16;p.inv=Math.max(p.inv,20);p.dashCd=st.dashCd;s.dashes++;event(s,'dash',{x:p.x,y:p.y,dx:p.dx,dy:p.dy});}",
    "");
  core=once(core,
    "if(p.dash>0){Motion.reset(p);p.x+=p.dx*12.6;p.y+=p.dy*12.6;p.dash--;}else{Motion.advance(p,mx/norm,my/norm,st.speed);}",
    "Motion.advance(p,mx/norm,my/norm,st.speed);");
  core=once(core,
    "if(segmentDistance(p.x,p.y,{x:b.px,y:b.py},b)<b.r+12){if(p.dash>0)event(s,'graze',{x:b.x,y:b.y});else hurt(s,t.damage*.85,b.x,b.y);b.life=0;}",
    "if(segmentDistance(p.x,p.y,{x:b.px,y:b.py},b)<b.r+12){hurt(s,t.damage*.85,b.x,b.y);b.life=0;}");
  put('core.js',core);

  let app=get('app.js');
  app=once(app,"KEY='loopjolt_astra_polish_preview2_'+AstraMotion.mode","KEY='loopjolt_astra_v3'");
  const seed=/const rawSeed=new URLSearchParams\(location\.search\)\.get\('seed'\);const chosenSeed=[\s\S]*?;state=R\.create\(chosenSeed\);/;
  if(!seed.test(app))throw Error('release_seed_base_drift');
  app=app.replace(seed,"state=R.create(capture?74021:crypto.getRandomValues(new Uint32Array(1))[0]);");
  app=once(app,'let keys=new Set(),joy=null,pointer=null,dashRequested=false,frameId=0','let keys=new Set(),joy=null,pointer=null,frameId=0');
  app=once(app,'return{x,y,dash:dashRequested};','return{x,y};');
  app=once(app,'function resetInput(){keys.clear();joy=null;pointer=null;dashRequested=false;AstraMotion.reset(state.player);}','function resetInput(){keys.clear();joy=null;pointer=null;AstraMotion.reset(state.player);}');
  app=once(app,"$('dash').onclick=()=>{if(!paused&&state.phase==='playing'){dashRequested=true;canvas.focus({preventScroll:true});}};","");
  app=once(app,"if(e.code==='Space'&&!e.repeat&&!/BUTTON|A/.test(e.target.tagName)){e.preventDefault();dashRequested=true;}","");
  app=once(app,'const input=movement();R.step(state,input);dashRequested=false;view.effects(state.events);','const input=movement();R.step(state,input);view.effects(state.events);');
  app=once(app,"state.walls.length?'SWEEP INCOMING · Move into the cyan corridor or phase through.':state.stage===1?","state.walls.length?'SWEEP INCOMING · Move into the cyan corridor.':state.stage===1?");
  app=once(app,"else if(e.kind==='dash'){this.tone(110,.18,.019,'triangle',800);this.tone(700,.13,.008,'sine',1300);}","");
  app=once(app,";$('pause').disabled=true;$('dash').disabled=true;$('resultDialog').showModal();",";$('pause').disabled=true;$('resultDialog').showModal();");
  const dashHud="$('dash').disabled=state.phase!=='playing'||paused||p.dashCd>0;$('dashNote').textContent=p.dashCd>0?(p.dashCd/60).toFixed(1)+'s RECHARGING':'SPACE · READY';$('dashBar').style.width=(1-p.dashCd/st.dashCd)*100+'%';";
  app=once(app,dashHud,"");
  const disabled="$('share').disabled=true;$('share').textContent='REVIEW BUILD · NOT PUBLISHED';";
  const sharing=`$('share').onclick=async()=>{const url='https://vibe-arcade-dun.vercel.app/games/astra-sentinel';try{await navigator.clipboard.writeText('I reclaimed '+state.cleared+'/9 gates in Astra Sentinel. Can you reach the final form? '+url);$('share').textContent='Copied ✓';}catch{$('share').textContent='Copy this page address to share';}};`;
  app=once(app,disabled,sharing);
  put('app.js',app);

  let html=get('index.html');
  html=html.replace(/<meta name="robots"[^>]*>/,'').replace(/<meta property="og:[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'');
  html=html.replace(/<section class="review-bar"[\s\S]*?<\/section>/,'');
  html=html.replace('<h1>Astra Sentinel<span class="review-chip">P2</span></h1>','<h1>Astra Sentinel</h1>');
  html=html.replace('[REVIEW P2] Astra Sentinel — Wider Arena & Escalating Combat','Astra Sentinel — Nine-Gate Arena Roguelite | LoopJolt');
  const meta='<link rel="canonical" href="https://vibe-arcade-dun.vercel.app/games/astra-sentinel"><meta property="og:title" content="Astra Sentinel — Move. Dodge. Evolve."><meta property="og:description" content="Move, survive and evolve through nine escalating gates. Auto-fire keeps the controls simple: just move."><meta property="og:type" content="website"><meta property="og:url" content="https://vibe-arcade-dun.vercel.app/games/astra-sentinel">';
  html=html.replace('</head>',meta+'<link rel="stylesheet" href="/release/astra-sentinel/polish.css"></head>');
  html=html.replaceAll('/labs/astra-sentinel/','/release/astra-sentinel/');
  html=html.replace('<script src="/release/astra-sentinel/preview.js"></script>','');
  html=html.replace('<link rel="stylesheet" href="/release/astra-sentinel/preview.css">','');
  html=html.replace('AN ORIGINAL EXPEDITION','VETERAN EXPEDITION');
  html=html.replace('05 / ARENA ROGUELITE','05 / ARENA ROGUELITE · V3');
  html=html.replace('Space dashes. Weapons fire automatically.','Weapons fire automatically.');
  const dashButton=/<button id="dash"[\s\S]*?<\/button>/;
  if(!dashButton.test(html))throw Error('release_dash_button_missing');
  html=html.replace(dashButton,'');
  html=html.replace('Use WASD / arrow keys, or drag anywhere in the arena with one finger. Your lance automatically aims at the nearest defender. Space or PHASE DASH gives a short invulnerable burst in your last movement direction. P or Escape pauses.',
    'Use WASD / arrow keys, or drag anywhere in the arena with one finger. Your lance automatically aims and fires at the nearest defender. That is the whole combat control scheme. P or Escape pauses.');
  html=html.replace('Phase through bullets, not into the next attack.','Keep moving, read the warnings and use the cyan safe lane.');
  put('index.html',html);
  fs.writeFileSync(path.join(root,'games/astra-sentinel.html'),html);

  for(const f of ['arena.js','arena-view.js','motion.js','polish.js','art.js','style.css'])copy(f);
  const previewCss=get('preview.css'),start=previewCss.indexOf('.evolution-preview');
  if(start<0)throw Error('release_css_base_drift');
  put('polish.css',previewCss.slice(start));
  return {dest,version:'astra-v3',canonical:'/games/astra-sentinel',canonicalHtml:path.join(root,'games/astra-sentinel.html'),controls:'move-only',production:true};
}
if(require.main===module)console.log(JSON.stringify(build()));module.exports={build};
