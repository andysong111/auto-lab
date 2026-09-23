'use strict';
// Read source bytes and provider responses as data. Never import generated JS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readJSON,atomicJSON,hashTree,requiredFiles}=require('../../orchestrator/files.cjs');
const root=path.resolve(process.argv[2]),id=require('./proposal.json').game_id;
const ledger=readJSON(path.join(root,'autonomy/.provider/ledger.json'));
const manifest=readJSON(path.join(root,`autonomy/jobs/${id}/manifest.json`));
const operations=Object.values(ledger.operations).filter(o=>o.game_id===id).sort((a,b)=>a.started_at-b.started_at);
const expected=new Map();for(const op of operations)if(op.state==='COMPLETE')for(const f of op.result.files)expected.set(f.path,{content:f.content,operation_id:op.operation_id,response_id:op.response_id});
const game=path.join(root,manifest.source_path),files=[];
for(const [name,p] of expected){
 const actual=fs.readFileSync(path.join(game,name)),same=actual.equals(Buffer.from(p.content));
 if(!same)throw Error('candidate_modified_outside_provider:'+name);
 files.push({file:name,sha256:crypto.createHash('sha256').update(actual).digest('hex'),operation_id:p.operation_id,response_id:p.response_id,byte_identical_to_provider:true});
}
for(const f of requiredFiles)if(!expected.has(f))throw Error('provider_provenance_missing:'+f);
if(hashTree(game)!==manifest.source_hash)throw Error('source_hash_mismatch');
const kit=fs.readFileSync(path.join(game,'gamekit.js'));
if(!kit.equals(fs.readFileSync(path.join(__dirname,'../../gamekit/gamekit.js'))))throw Error('factory_kit_mismatch');
const evidence={schema:'playjolt-ai-source-provenance/1',game_id:id,version:manifest.version,source_hash:manifest.source_hash,passed:true,files,factory_supplied:['gamekit.js','manifest.json'],candidate_manual_edits:0,note:'Every generated source file equals the latest successful provider response for that path. Factory supplies kit and version descriptor.'};
atomicJSON(path.join(root,'source-provenance.json'),evidence);console.log(JSON.stringify(evidence,null,2));
