/* Candidate build only: never modifies games/astra-sentinel or the homepage. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function build(root=path.resolve(__dirname,'..')){
 const source=path.join(root,'games/astra-sentinel'),extra=path.join(root,'preview/astra-polish'),dest=path.join(root,'labs/astra-sentinel');
 fs.mkdirSync(dest,{recursive:true});
 const read=f=>fs.readFileSync(path.join(source,f),'utf8'),put=(f,s)=>fs.writeFileSync(path.join(dest,f),s);
 function change(s,old,next){const at=s.indexOf(old);if(at<0||s.indexOf(old,at+old.length)>=0)throw Error('candidate_base_changed:'+old.slice(0,75));return s.slice(0,at)+next+s.slice(at+old.length);}
 let core=read('core.js');
 core=change(core,"const VERSION='astra-v1'","const Motion=root.AstraMotion||(typeof require==='function'?require('./motion.js'):null);\nconst VERSION='astra-polish-preview1'");
 core=change(core,'player:{x:360,y:540,','player:{vx:0,vy:0,x:360,y:540,');
 core=change(core,'s.player.x=360;s.player.y=560;','s.player.x=360;s.player.y=560;Motion.reset(s.player);');
 core=change(core,'if(p.dash>0){p.x+=p.dx*9;p.y+=p.dy*9;p.dash--;}else{p.x+=mx/norm*st.speed;p.y+=my/norm*st.speed;}',
  'if(p.dash>0){Motion.reset(p);p.x+=p.dx*9;p.y+=p.dy*9;p.dash--;}else{Motion.advance(p,mx/norm,my/norm,st.speed);}');
 core=change(core,"event(s,'hit',{x:e.x,y:e.y,amount:Math.ceil(amount)})","event(s,'hit',{id:e.id,x:e.x,y:e.y,dx:(e.x-s.player.x)/(dist(e,s.player)||1),dy:(e.y-s.player.y)/(dist(e,s.player)||1),amount:Math.ceil(amount)})");
 put('core.js',core);
 let art=read('art.js');
 const start=art.indexOf('function hero('),end=art.indexOf('function enemy(',start);if(start<0||end<0)throw Error('hero_section_missing');
 art=art.slice(0,start)+"function hero(c,x,y,tier,time,aim,scale,moving,pose){return AstraPolish.hero(c,x,y,tier,time,aim,scale,moving,pose);}\n"+art.slice(end);
 art=change(art,'return v;}','return AstraPolish.decorate(v,region);}')
 art=change(art,"function make(canvas){const c=canvas.getContext('2d',{alpha:false}),maps=THEMES.map((_,i)=>background(i));", "function make(canvas){const dpr=AstraPolish.quality==='low'?1:Math.min(1.5,Math.max(1,window.devicePixelRatio||1));canvas.width=720*dpr;canvas.height=820*dpr;const c=canvas.getContext('2d',{alpha:false});c.scale(dpr,dpr);const maps=THEMES.map((_,i)=>background(i)),polish=AstraPolish.create();");
 art=change(art,'function effects(events){','function effects(events){polish.effects(events);');
 art=change(art,'frames++;const region','frames++;polish.advance(s,dt,opts.reduced,opts.paused);const region');
 art=change(art,'for(const z of s.zones){const q=', 'polish.before(c,s);for(const z of s.zones){const q=');
 art=change(art,'for(const h of s.pickups){glow', 'polish.telegraphs(c,s);for(const h of s.pickups){glow');
 art=change(art,'hero(c,p.x,p.y,s.tier,at,p.aim||-Math.PI/2,1,opts.moving);','hero(c,p.x,p.y,s.tier,at,p.aim??-Math.PI/2,1,opts.moving,polish.pose());');
 art=change(art,'else enemy(c,it.e,at,t);','else {c.save();polish.enemyPose(c,it.e);enemy(c,it.e,at,t);c.restore();}');
 art=change(art,"c.restore();}\nfunction portrait", "polish.finish(c,s);c.restore();}\nfunction portrait");
 art=change(art,'rings=[];shake=0;},resources:', 'rings=[];shake=0;polish.reset();},resources:');
 art=change(art,'rays:rays.length,rings:rings.length,frames})','rays:rays.length,rings:rings.length,frames,...polish.resources()})');
 put('art.js',art);
 let app=read('app.js');
 app=change(app,"KEY='loopjolt_astra_v1'","KEY='loopjolt_astra_polish_preview1_'+AstraMotion.mode");
 app=change(app,'state=R.create(capture?74021:crypto.getRandomValues(new Uint32Array(1))[0]);','state=R.create(74021);');
 app=change(app,'function resetInput(){keys.clear();joy=null;pointer=null;dashRequested=false;}','function resetInput(){keys.clear();joy=null;pointer=null;dashRequested=false;AstraMotion.reset(state.player);}')
 app=change(app,"function setSound(){", "function setSound(){document.body.classList.toggle('reduced-fx',reduced);");
 app=change(app,'frameId=0,lastHud=-1,lastPortrait=-1,tipUntil=0;','frameId=0,lastHud=-1,lastPortrait=-1,tipUntil=0,visualTime=0;');
 app=change(app,'last=now;if(state.phase',"last=now;if(!paused&&!document.hidden)visualTime+=dt;if(state.phase");
 app=change(app,'view.draw(state,now/1000,{reduced,','view.draw(state,visualTime,{paused:paused||document.hidden,reduced,');
 // Sound layers are synthesized, still capped by the original ten-voice pool.
 app=change(app,"this.tone(520,.065,.013,'triangle',210)","this.tone(620,.07,.011,'triangle',240);this.tone(105,.055,.009,'sine',55)");
 app=change(app,"else if(e.kind==='dash')this.tone(140,.19,.025,'sawtooth',850);","else if(e.kind==='dash'){this.tone(110,.18,.019,'triangle',800);this.tone(700,.13,.008,'sine',1300);}");
 // Do not present a preview as a shareable public game release.
 const shareStart=app.indexOf("$('share').onclick=async()=>"),shareEnd=app.indexOf('\nfunction sync(',shareStart);if(shareStart<0||shareEnd<0)throw Error('share_section_missing');
 app=app.slice(0,shareStart)+"$('share').disabled=true;$('share').textContent='REVIEW BUILD · NOT PUBLISHED';\n"+app.slice(shareEnd);
 app=change(app,"KEY='loopjolt_astra_polish_preview1_'+AstraMotion.mode;","KEY='loopjolt_astra_polish_preview1_'+AstraMotion.mode;");
 put('app.js',app);
 let html=read('index.html').replaceAll('/games/astra-sentinel/','/labs/astra-sentinel/');
 html=html.replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta property="og:[^>]*>/g,'');
 html=change(html,'<title>Astra Sentinel — Evolve Through Nine Gates | LoopJolt</title>','<title>[REVIEW] Astra Sentinel — Motion & Graphics</title><meta name="robots" content="noindex,nofollow,noarchive">');
 html=change(html,'</header>',`</header><section class="review-bar" aria-label="Owner preview controls"><strong>PLAYTEST P1 · NOT LIVE</strong><label>Movement <select id="feelSelect"><option value="responsive">Responsive</option><option value="direct">Direct (original feel)</option></select></label><label>Effects <select id="fxSelect"><option value="high">High</option><option value="low">Low</option></select></label><a href="https://vibe-arcade-dun.vercel.app/games/astra-sentinel" target="_blank" rel="noopener">Open live original ↗</a><small>Same expedition seed for comparison. Movement changes restart the run. Preview records are separate.</small></section>`);
 html=change(html,'<h1>Astra Sentinel</h1>','<h1>Astra Sentinel<span class="review-chip">P1</span></h1>');
 html=change(html,'</head>','<link rel="stylesheet" href="/labs/astra-sentinel/preview.css"></head>');
 html=change(html,'<script src="/labs/astra-sentinel/core.js">','<script src="/labs/astra-sentinel/motion.js"></script><script src="/labs/astra-sentinel/polish.js"></script><script src="/labs/astra-sentinel/preview.js"></script><script src="/labs/astra-sentinel/core.js">');
 put('index.html',html);put('style.css',read('style.css'));
 for(const file of ['motion.js','polish.js','preview.js','preview.css'])fs.copyFileSync(path.join(extra,file),path.join(dest,file));
 return {dest,version:'astra-polish-preview1',productionUnchanged:true};
}
if(require.main===module)console.log(JSON.stringify(build()));module.exports={build};
