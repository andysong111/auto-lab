'use strict';
// Small, deterministic build-time SEO pass. No requests, user data or game-rule changes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ORIGIN='https://vibe-arcade-dun.vercel.app';
const PAGES={
 'index.html':{url:ORIGIN+'/',title:'LoopJolt | Free Browser Games - Play for Your Flag',description:'Play free browser games with no download. Try Deep Descent, Core Pins, Nova Merge and Orbit Sprint without an account. Choose your flag for ranked play (16+).'},
 'descent/index.html':{url:ORIGIN+'/descent',title:'Deep Descent - Free Browser Game | LoopJolt',description:'Play Deep Descent free in your browser. Guide a drone through 48 rings and guardian gates. No download or account needed to try; ranked play is 16+.'}
};
const URLS=['/','/descent','/challengers/play?game=core-pins','/challengers/play?game=nova-merge','/games/orbit-sprint','/games/dont-press','/games/perfect-timing','/games/reaction-rush'];
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function transform(html,file){
 const p=PAGES[file];assert(p,'unsupported_page');assert.equal((html.match(/<head>/g)||[]).length,1,'one head required');assert.equal((html.match(/<\/head>/g)||[]).length,1);assert.equal((html.match(/<title>/g)||[]).length,1);
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(p.title)+'</title>');
 const tags=[['name','description',p.description],['property','og:title',p.title],['property','og:description',p.description],['property','og:type','website'],['property','og:url',p.url],['property','og:site_name','LoopJolt']];
 for(const [kind,key,value] of tags){const re=new RegExp('<meta\\b[^>]*\\b'+kind+'=["\\\']'+key+'["\\\'][^>]*>','gi');html=html.replace(re,'');html=html.replace('</head>','<meta '+kind+'="'+key+'" content="'+esc(value)+'"></head>');}
 html=html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');html=html.replace('</head>','<link rel="canonical" href="'+p.url+'"></head>');
 if(file==='index.html'){
  // This changes the public-facing name only; the internal game key stays gyro-drop.
  assert(html.includes('<h2>Gyro Drop</h2>')||html.includes('<h2>Deep Descent</h2>'),'home_name_drift');
  html=html.replace('<h2>Gyro Drop</h2><p>Deep Descent · 3 worlds.</p>','<h2>Deep Descent</h2><p>Gyro Drop series · 3 worlds.</p>');
  html=html.replace('aria-label="Play Gyro Drop Deep Descent"','aria-label="Play Deep Descent, a free browser game"');
  html=html.replace('aria-label="Gyro Drop game preview"','aria-label="Deep Descent game preview"');
  html=html.replace('<p>Pick a game. Set a score. Climb together.</p>','<p>Free browser games. No download. Try without an account.</p>');
  html=html.replace(/<script\b[^>]*id="loopjolt-site-schema"[^>]*>[\s\S]*?<\/script>/g,'');
  const schema={'@context':'https://schema.org','@type':'WebSite',name:'LoopJolt',alternateName:'Loop Jolt',url:p.url};
  html=html.replace('</head>','<script type="application/ld+json" id="loopjolt-site-schema">'+JSON.stringify(schema)+'</script></head>');
 }
 return html;
}
function sitemap(){return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+URLS.map(u=>'  <url><loc>'+esc(ORIGIN+u)+'</loc></url>').join('\n')+'\n</urlset>\n';}
function build(root=path.resolve(__dirname,'..')){
 // Compute/validate every input before writing anything.
 const out=Object.keys(PAGES).map(f=>[path.join(root,f),transform(fs.readFileSync(path.join(root,f),'utf8'),f)]);
 out.push([path.join(root,'sitemap.xml'),sitemap()]);for(const [file,content] of out)fs.writeFileSync(file,content);
 console.log('Built descriptive home/Deep Descent metadata and 8 clean sitemap URLs. No ranking or indexation guarantee.');
}
if(require.main===module)build();module.exports={ORIGIN,PAGES,URLS,transform,sitemap,build};
