'use strict';
const fs=require('node:fs'),path=require('node:path'),Ajv=require('ajv');
const {safePath,requiredFiles,listFiles}=require('../orchestrator/files.cjs');
const {modelError}=require('./errors.cjs');
const responseSchema={type:'object',additionalProperties:false,required:['status','files','summary','tests'],properties:{
  status:{type:'string',enum:['complete','unable']},summary:{type:'string',maxLength:2000},tests:{type:'array',maxItems:16,items:{type:'string',maxLength:400}},
  files:{type:'array',maxItems:32,items:{type:'object',additionalProperties:false,required:['path','content'],properties:{path:{type:'string',maxLength:160},content:{type:'string'}}}}
}};
const validate=new Ajv({allErrors:true}).compile(responseSchema);
function allowedFile(name) {
  return requiredFiles.includes(name)||/^view\/[a-zA-Z0-9_-]+\.js$/.test(name)||/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(svg|json)$/.test(name);
}
function inScope(name,scope) { return scope.some(p=>p.endsWith('/**')?name.startsWith(p.slice(0,-2)):name===p); }
function validateOutput(raw,request,limits) {
  let serialized;try{serialized=typeof raw==='string'?raw:JSON.stringify(raw);}catch{throw modelError('model_output_invalid_schema');}
  if(typeof serialized!=='string')throw modelError('model_output_invalid_schema');
  const bytes=Buffer.byteLength(serialized);if(bytes>limits.max_response_bytes)throw modelError('model_output_too_large');
  let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw modelError('model_output_invalid_json');}
  if(!validate(value))throw modelError('model_output_invalid_schema');
  if(value.status!=='complete')throw modelError('model_unable');
  if(!value.files.length||value.files.length>limits.max_files)throw modelError('model_file_count');
  const seen=new Set();
  for(const f of value.files) {
    if(!allowedFile(f.path)||!inScope(f.path,request.allowed_paths)||seen.has(f.path)||f.path.includes('..')||f.path.includes('\\'))throw modelError('path_isolation: output outside allowed candidate scope');
    seen.add(f.path);if(Buffer.byteLength(f.content)>limits.max_file_bytes||f.content.includes('\0'))throw modelError('model_file_too_large');
    // Defense in depth, not a substitute for the network-disabled execution container.
    if(f.path!=='README.md'&&(/(?:https?:|wss?:|file:|ftp:)\/\//i.test(f.content)||/(?:src|href)\s*=\s*["']\/\//i.test(f.content)||/\b(?:import\s*\(|require\s*\(|eval\s*\(|new\s+Function\s*\()/m.test(f.content)))throw modelError('external_runtime_dependency');
    if(f.path==='app.js') {
      const bypass=/\b(?:requestAnimationFrame|addEventListener)\b|new\s+Phaser\.Game\b/.exec(f.content);
      if(bypass)throw modelError('presentation_runtime_bypass: app.js must use GameKit + PhaserKit lifecycle');
    }
    if(f.path==='view/art.js') {
      const bypass=/\brequestAnimationFrame\b|\.tweens\.add\s*\(|\.cameras\.main\.shake\s*\(|\.input\.(?:keyboard|on|addPointer)|\.add\.text\s*\(/.exec(f.content);
      if(bypass)throw modelError('presentation_runtime_bypass: use PhaserKit motion/input helpers and keep contract text in DOM');
    }
    if(f.path==='core.js') {
      const match=/\b(?:document|window|localStorage|fetch|Phaser)\b/.exec(f.content);
      if(match) {
        const e=modelError('core_dom_dependency'),line=f.content.slice(0,match.index).split('\n').length;
        e.message=`core_dom_dependency: core.js line ${line} uses ${match[0]}. Export with globalThis.GameCore = {create,step,observe,terminal}; core must contain no document/window/localStorage/fetch/Phaser identifiers.`;
        e.detail={file:'core.js',line,identifier:match[0],allowed_export:'globalThis.YourCore = {create,step,observe,terminal}'};
        throw e;
      }
    }
  }
  if(request.mode==='build'||request.empty_workspace)for(const name of requiredFiles)if(!seen.has(name))throw modelError('model_missing_file:'+name);
  return value;
}
function quarantineOutput(raw,limits) {
  let serialized;try{serialized=typeof raw==='string'?raw:JSON.stringify(raw);}catch{return null;}
  if(typeof serialized!=='string'||Buffer.byteLength(serialized)>limits.max_response_bytes)return null;
  let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{return null;}
  if(!value||typeof value!=='object'||!Array.isArray(value.files))return null;
  const files=[];
  for(const f of value.files) {
    if(!f||typeof f.path!=='string'||typeof f.content!=='string')continue;
    if(!allowedFile(f.path)||f.path.includes('..')||f.path.includes('\\')||Buffer.byteLength(f.content)>limits.max_file_bytes)continue;
    files.push({path:f.path,content:f.content});
  }
  return {status:typeof value.status==='string'?value.status:null,summary:typeof value.summary==='string'?value.summary.slice(0,2000):'',files};
}
function applyOutput(value,workspace,root,manifest) {
  const expected=safePath(root,`autonomy/.work/${manifest.game_id}/${manifest.version}`);
  if(path.resolve(workspace)!==expected)throw modelError('path_isolation: workspace identity');
  listFiles(workspace); // Reject any existing symlink before mutating a file.
  const destinations=value.files.map(f=>({file:safePath(workspace,f.path),content:f.content}));
  for(const d of destinations){fs.mkdirSync(path.dirname(d.file),{recursive:true});fs.writeFileSync(d.file,d.content,{mode:0o600});}
}
module.exports={responseSchema,validateOutput,quarantineOutput,applyOutput,allowedFile,inScope};
