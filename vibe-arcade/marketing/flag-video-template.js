#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');

const W=1080,H=1920;
const SAFE={top:120,right:96,bottom:250,left:96};
const PALETTE={bg:'#0d1516',panel:'#142224',line:'#29403c',text:'#f6f7f2',muted:'#9fb1ac',accent:'#d8ff5f',gold:'#f0cc7a',danger:'#ff6f7a'};
const FONT="'Montserrat','Arial Black',system-ui,sans-serif";
const COUNTRY=/^[A-Z]{2}$/;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function num(v){if(v===null||v===undefined||v==='')return'';const n=Number(v);if(!Number.isFinite(n))throw Error('invalid_number');return Math.trunc(n).toLocaleString('en-US');}
function country(c){const x=String(c||'').toUpperCase();if(!COUNTRY.test(x))throw Error('invalid_country');return x;}
function flagHref(base,c){return esc((base||'/assets/flags/7.5.0').replace(/\/$/,'')+'/'+country(c).toLowerCase()+'.svg');}
function text(x,y,s,size,anchor='start',fill=PALETTE.text,weight=800,extra=''){
 return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;
}
function rect(x,y,w,h,r=28,fill=PALETTE.panel,stroke='none',sw=0,opacity=1){
 return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}
function flag(x,y,w,h,base,c){
 return `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${flagHref(base,c)}" preserveAspectRatio="xMidYMid meet"/>`;
}
function shell(title,subtitle,body,footer='PLAY FOR YOUR FLAG'){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <rect width="${W}" height="${H}" fill="${PALETTE.bg}"/>
 <rect x="0" y="0" width="${W}" height="18" fill="${PALETTE.accent}"/>
 ${text(SAFE.left,88,'LOOPJOLT',30,'start',PALETTE.gold,900)}
 ${text(W-SAFE.right,88,'WORLD LEAGUE',24,'end',PALETTE.muted,800)}
 ${text(W/2,180,title,64,'middle',PALETTE.text,900)}
 ${subtitle?text(W/2,232,subtitle,25,'middle',PALETTE.muted,700):''}
 ${body}
 ${rect(SAFE.left,H-205,W-SAFE.left-SAFE.right,105,28,'#101d1e',PALETTE.line,2)}
 ${text(W/2,H-142,footer,34,'middle',PALETTE.accent,900,'letter-spacing="1.2"')}
 </svg>`;
}
function flagCard(x,y,w,h,base,item,{rank=false,score=true}={}){
 const c=country(item.country);
 const name=String(item.label||c).slice(0,22);
 const scoreText=score?num(item.score):'';
 return `${rect(x,y,w,h,26,'#142224',PALETTE.line,2)}
 ${rank?text(x+34,y+68,'#'+String(item.rank||'?'),32,'start',PALETTE.gold,900):''}
 ${flag(x+34,y+(rank?92:40),154,104,base,c)}
 ${text(x+214,y+(rank?127:78),name,32,'start',PALETTE.text,900)}
 ${scoreText?text(x+w-34,y+(rank?128:80),scoreText,34,'end',PALETTE.accent,900):''}`;
}
function challenge(d){
 const flags=(d.flags||[]).slice(0,5);
 if(flags.length<2)throw Error('challenge_requires_2_flags');
 const title=d.title||'WHICH FLAG CLEARS THIS?';
 const rows=flags.map((c,i)=>{
  const cc=typeof c==='string'?c:c.country,label=typeof c==='string'?country(c):String(c.label||country(c.country));
  const y=350+i*160;
  return `${rect(120,y,840,130,28,i===0?'#18292b':'#142224',PALETTE.line,2)}
  ${flag(160,y+20,132,90,d.flagBase,cc)}
  ${text(330,y+78,label,36,'start',PALETTE.text,900)}
  ${text(900,y+78,'ENTER',26,'end',PALETTE.muted,800)}`;
 }).join('');
 const body=`${text(W/2,298,d.kicker||'PICK A FLAG. TAKE THE CHALLENGE.',28,'middle',PALETTE.gold,900)}
 ${rows}
 ${rect(120,1235,840,280,34,'#101d1e',PALETTE.line,2)}
 ${text(W/2,1322,d.progress||'48 RINGS',58,'middle',PALETTE.text,900)}
 ${text(W/2,1392,d.subline||'ONE VERIFIED RUN → COUNTRY BOARD',25,'middle',PALETTE.muted,800)}
 ${text(W/2,1460,d.cta||'REPRESENT YOUR FLAG',36,'middle',PALETTE.accent,900)}`;
 return shell(title,d.subtitle||'NO INVENTED WINNER · REAL RANKED SCORES ONLY',body,d.footer||'PLAY FREE · NO DOWNLOAD');
}
function versus(d){
 const a=d.left,b=d.right;if(!a||!b)throw Error('vs_requires_two_sides');
 country(a.country);country(b.country);
 if(a.score===undefined||b.score===undefined)throw Error('vs_requires_real_scores');
 const body=`${rect(90,330,430,620,34,'#142224',PALETTE.line,2)}
 ${rect(560,330,430,620,34,'#142224',PALETTE.line,2)}
 ${flag(155,410,300,205,d.flagBase,a.country)}
 ${flag(625,410,300,205,d.flagBase,b.country)}
 ${text(305,690,a.label||country(a.country),38,'middle',PALETTE.text,900)}
 ${text(775,690,b.label||country(b.country),38,'middle',PALETTE.text,900)}
 ${text(305,790,num(a.score),56,'middle',PALETTE.accent,900)}
 ${text(775,790,num(b.score),56,'middle',PALETTE.accent,900)}
 ${text(W/2,660,'VS',44,'middle',PALETTE.gold,900)}
 ${text(W/2,1040,d.gapLabel||('ONLY '+num(Math.abs(Number(a.score)-Number(b.score)))+' APART'),42,'middle',PALETTE.gold,900)}
 ${rect(120,1150,840,260,34,'#101d1e',PALETTE.line,2)}
 ${text(W/2,1240,d.message||'EVERY VERIFIED RUN COUNTS',32,'middle',PALETTE.text,900)}
 ${text(W/2,1320,d.cta||'CHANGE THE BOARD',52,'middle',PALETTE.accent,900)}`;
 return shell(d.title||'FLAG VS FLAG',d.period||'THIS WEEK',body,d.footer||'PLAY FOR YOUR FLAG');
}
function world(d){
 const rows=(d.rows||[]).slice(0,5);if(rows.length<3)throw Error('world_requires_3_rows');
 rows.forEach((r,i)=>{country(r.country);if(r.score===undefined)throw Error('world_requires_scores');if(!r.rank)r.rank=i+1;});
 const cards=rows.map((r,i)=>flagCard(120,330+i*185,840,155,d.flagBase,r,{rank:true,score:true})).join('');
 const body=`${cards}
 ${rect(120,1320,840,210,34,'#101d1e',PALETTE.line,2)}
 ${text(W/2,1405,d.message||'EVERY VERIFIED RUN CAN MOVE THE BOARD',28,'middle',PALETTE.text,900)}
 ${text(W/2,1475,d.cta||'CLIMB FOR YOUR FLAG',44,'middle',PALETTE.accent,900)}`;
 return shell(d.title||'TOP FLAGS THIS WEEK',d.period||'WORLD BOARD',body,d.footer||'PLAY FOR YOUR FLAG');
}
function render(data){
 const mode=String(data.mode||'challenge').toLowerCase();
 if(mode==='challenge')return challenge(data);
 if(mode==='vs')return versus(data);
 if(mode==='world')return world(data);
 throw Error('invalid_mode');
}
function thumbnail(data){
 const mode=String(data.mode||'challenge').toLowerCase();
 const base=data.flagBase;
 let content='';
 if(mode==='challenge'){
  const f=(data.flags||[]).slice(0,4);if(f.length<2)throw Error('challenge_requires_2_flags');
  content=f.map((v,i)=>{const c=typeof v==='string'?v:v.country;const x=120+i*215;return flag(x,770,180,122,base,c)}).join('');
  content+=text(W/2,570,data.thumbTitle||'WHICH FLAG?',92,'middle',PALETTE.text,900);
  content+=text(W/2,680,data.thumbSub||'CLEAR 48?',58,'middle',PALETTE.accent,900);
 } else if(mode==='vs'){
  const a=data.left,b=data.right;if(!a||!b)throw Error('vs_requires_two_sides');
  content=flag(130,700,300,205,base,a.country)+flag(650,700,300,205,base,b.country);
  content+=text(W/2,580,data.thumbTitle||'FLAG VS FLAG',78,'middle',PALETTE.text,900);
  content+=text(W/2,825,'VS',54,'middle',PALETTE.gold,900);
  if(a.score!==undefined&&b.score!==undefined)content+=text(W/2,1010,num(a.score)+' — '+num(b.score),54,'middle',PALETTE.accent,900);
 } else if(mode==='world'){
  const rows=(data.rows||[]).slice(0,3);if(rows.length<3)throw Error('world_requires_3_rows');
  content+=text(W/2,550,data.thumbTitle||'WORLD BOARD',88,'middle',PALETTE.text,900);
  rows.forEach((r,i)=>{content+=text(150,750+i*180,'#'+(r.rank||i+1),54,'start',PALETTE.gold,900)+flag(270,680+i*180,190,128,base,r.country)+text(500,760+i*180,r.label||country(r.country),40,'start',PALETTE.text,900);});
 } else throw Error('invalid_mode');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${PALETTE.bg}"/><rect width="${W}" height="18" fill="${PALETTE.accent}"/>${text(80,100,'LOOPJOLT',34,'start',PALETTE.gold,900)}${content}${text(W/2,1660,'PLAY FOR YOUR FLAG',40,'middle',PALETTE.accent,900)}</svg>`;
}

if(require.main===module){
 const input=process.argv[2];if(!input){console.error('usage: node flag-video-template.js input.json [output-dir]');process.exit(2);}
 const data=JSON.parse(fs.readFileSync(input,'utf8')),out=process.argv[3]||path.join(process.cwd(),'out');
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'overlay.svg'),render(data));
 fs.writeFileSync(path.join(out,'thumbnail.svg'),thumbnail(data));
 console.log(JSON.stringify({mode:data.mode||'challenge',overlay:path.join(out,'overlay.svg'),thumbnail:path.join(out,'thumbnail.svg'),size:[W,H],safe:SAFE}));
}
module.exports={render,thumbnail,SAFE,W,H,PALETTE};
