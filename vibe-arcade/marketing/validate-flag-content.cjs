'use strict';

const VALID_FORMATS=new Set(['FLAG_CHALLENGE','FLAG_VS_FLAG','WORLD_BOARD']);
const CODE=/^[A-Z]{2}$/;
function fail(message){const e=new Error(message);e.code='invalid_flag_content';throw e;}
function num(v,name){if(!Number.isFinite(v)||v<0)fail(name+' must be a non-negative finite number');}
function text(v,name){if(typeof v!=='string'||!v.trim())fail(name+' is required');return v.trim();}
function country(row,{score=false,rank=false}={}){
  if(!row||typeof row!=='object')fail('country row is required');
  if(!CODE.test(row.code||''))fail('country code must be ISO-style uppercase alpha-2');
  text(row.name,'country name');
  if(score)num(row.score,'country score');
  if(rank){if(!Number.isInteger(row.rank)||row.rank<1)fail('rank must be a positive integer');}
  return row;
}
function validate(payload){
  if(!payload||typeof payload!=='object')fail('payload is required');
  const format=text(payload.format,'format');
  if(!VALID_FORMATS.has(format))fail('unsupported format');
  text(payload.game,'game');
  text(payload.hook,'hook');
  if(!Array.isArray(payload.countries))fail('countries must be an array');

  if(format==='FLAG_CHALLENGE'){
    if(payload.countries.length<3||payload.countries.length>5)fail('FLAG_CHALLENGE requires 3-5 flags');
    payload.countries.forEach(r=>country(r));
    if(payload.countries.some(r=>'score' in r||'rank' in r))fail('FLAG_CHALLENGE cannot imply unsourced scores/ranks; use a factual format when data exists');
  }

  if(format==='FLAG_VS_FLAG'){
    if(payload.countries.length!==2)fail('FLAG_VS_FLAG requires exactly 2 countries');
    text(payload.period,'period');text(payload.snapshotAt,'snapshotAt');
    payload.countries.forEach(r=>country(r,{score:true}));
    if(payload.countries[0].code===payload.countries[1].code)fail('FLAG_VS_FLAG countries must differ');
    const derived=Math.abs(payload.countries[0].score-payload.countries[1].score);
    if(payload.gap!==undefined&&payload.gap!==derived)fail('gap must equal absolute score difference');
    if(payload.countries.every(r=>r.rank!==undefined)){
      payload.countries.forEach(r=>country(r,{score:true,rank:true}));
      if(payload.countries[0].rank===payload.countries[1].rank)fail('ranks must differ');
    }
  }

  if(format==='WORLD_BOARD'){
    if(payload.countries.length<3||payload.countries.length>5)fail('WORLD_BOARD requires 3-5 countries');
    text(payload.period,'period');text(payload.snapshotAt,'snapshotAt');
    payload.countries.forEach(r=>country(r,{score:true,rank:true}));
    const ranks=payload.countries.map(r=>r.rank);
    if(new Set(ranks).size!==ranks.length)fail('WORLD_BOARD ranks must be unique');
    for(let i=1;i<ranks.length;i++)if(ranks[i]<=ranks[i-1])fail('WORLD_BOARD rows must be ordered by ascending rank');
  }

  const codes=payload.countries.map(r=>r.code);
  if(new Set(codes).size!==codes.length)fail('country codes must be unique');
  return Object.freeze({...payload,countries:payload.countries.map(r=>Object.freeze({...r}))});
}

if(require.main===module){
  const fs=require('node:fs');
  const file=process.argv[2];
  if(!file)fail('usage: node validate-flag-content.cjs payload.json');
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  validate(data);
  process.stdout.write('OK\n');
}
module.exports={validate};
