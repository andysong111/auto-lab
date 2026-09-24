#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const manifest=require('./phaser-runtime.json');
function get(url,redirects=0){
  if(redirects>5)throw Error('too_many_redirects');
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'PlayJolt-Factory/1'}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();return resolve(get(new URL(res.headers.location,url).toString(),redirects+1));}
      if(res.statusCode!==200){res.resume();return reject(Error('download_http_'+res.statusCode));}
      const chunks=[];let bytes=0;
      res.on('data',c=>{bytes+=c.length;if(bytes>manifest.expected_max_bytes)res.destroy(Error('runtime_too_large'));else chunks.push(c);});
      res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
    }).on('error',reject);
  });
}
async function main(){
  const out=process.argv[2]||path.join(process.env.RUNNER_TEMP||process.cwd(),manifest.runtime_filename);
  const body=await get(manifest.source_url);
  if(body.length<manifest.expected_min_bytes||body.length>manifest.expected_max_bytes)throw Error('runtime_size_out_of_bounds:'+body.length);
  const sha=crypto.createHash('sha256').update(body).digest('hex');
  if(manifest.sha256&&sha!==manifest.sha256)throw Error('runtime_hash_mismatch:'+sha);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,body,{mode:0o444});
  const result={version:manifest.phaser_version,bytes:body.length,sha256:sha,out,verified:!!manifest.sha256};
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
