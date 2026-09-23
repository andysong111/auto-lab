'use strict';
// Trusted confidential GET transport. Ephemeral private key stays outside the
// uploaded state directory. The ciphertext is not a credential usable by readers.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {FileStore}=require('../../orchestrator/store.cjs'),{Factory}=require('../../orchestrator/engine.cjs');
const {GitHubVercelAdapter,previewURL}=require('../../adapters/github-vercel.cjs');
const {buildPacket}=require('../release-packet.cjs');
const {atomicJSON,readJSON,hashTree}=require('../../orchestrator/files.cjs');
const [command,dirArg]=process.argv.slice(2),dir=path.resolve(dirArg),repo='andysong111/auto-lab',id=require('./proposal.json').game_id;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 fs.mkdirSync(dir,{recursive:true});
 if(command==='key'){
  const pair=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  fs.writeFileSync(path.join(dir,'private.pem'),pair.privateKey,{mode:0o600});
  atomicJSON(path.join(dir,'public.json'),{game_id:id,run_id:process.env.GITHUB_RUN_ID,public_key:pair.publicKey,public_key_sha256:digest(pair.publicKey)});return;
 }
 if(command!=='verify')throw Error('unknown transport command');
 const pub=readJSON(path.join(dir,'public.json')),started=Date.now();let sealed;
 while(Date.now()-started<15*60000){
  const r=await fetch(`https://api.github.com/repos/${repo}/contents/vibe-arcade/autonomy/commissioning/fourth-real-game/rc-sealed-payload.json?ref=commissioning%2Ffourth-real-game-20260923`,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(10000)});
  if(r.ok){const b=await r.json(),v=JSON.parse(Buffer.from(b.content,'base64').toString());if(v.run_id===pub.run_id&&v.public_key_sha256===pub.public_key_sha256){sealed=v;break;}}
  else if(r.status!==404)throw Error('sealed_transport_read_'+r.status);
  await delay(10000);
 }
 if(!sealed)throw Error('sealed_transport_timeout');
 const key=crypto.privateDecrypt({key:fs.readFileSync(path.join(dir,'private.pem')),oaepHash:'sha256'},Buffer.from(sealed.wrapped_key,'base64'));
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(sealed.iv,'base64'));decipher.setAuthTag(Buffer.from(sealed.tag,'base64'));
 const payload=JSON.parse(Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext,'base64')),decipher.final()]).toString());
 const origin=previewURL(payload.preview_origin),grant=new URL(payload.share_url);
 if(grant.origin!==origin||!grant.searchParams.has('_vercel_share')||payload.game_id!==id||!/^[a-f0-9]{40}$/.test(payload.rc_commit)||!Number.isSafeInteger(payload.artifact_id)||!/^[a-f0-9]{64}$/.test(payload.artifact_sha256))throw Error('sealed_scope_mismatch');
 console.log('::add-mask::'+grant.searchParams.get('_vercel_share'));
 const zip=execFileSync('gh',['api','--method','GET',`repos/${repo}/actions/artifacts/${payload.artifact_id}/zip`],{maxBuffer:64*1024*1024});
 if(digest(zip)!==payload.artifact_sha256)throw Error('source_archive_mismatch');
 const archive=path.join(dir,'source.zip'),root=path.join(dir,'state');fs.writeFileSync(archive,zip);
 execFileSync('python',['-c','import zipfile,pathlib,sys; r=pathlib.Path(sys.argv[2]); z=zipfile.ZipFile(sys.argv[1]); assert all((r/n).resolve().is_relative_to(r.resolve()) for n in z.namelist()); z.extractall(r)',archive,root]);
 const store=new FileStore(root),m=store.get(id);
 if(m.state!=='RC_READY'||m.technical_qa_status!=='PASS'||m.product_qa_status!=='PASS'||m.quality_status!=='PASS'||hashTree(path.join(root,m.source_path))!==m.source_hash||m.source_hash!==payload.source_hash)throw Error('three_gates_and_exact_source_required');
 const jar=new Map();
 async function withCookies(url,options={}){
  const u=new URL(url);if(u.origin!==origin&&u.origin!=='https://vercel.com')throw Error('auth_redirect_outside_vercel');
  const cookies=jar.get(u.hostname)||new Map();
  const r=await fetch(url,{...options,method:'GET',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{...options.headers,Accept:'*/*',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')}});
  for(const s of r.headers.getSetCookie()){const pair=s.split(';')[0],at=pair.indexOf('=');cookies.set(pair.slice(0,at),pair.slice(at+1));}
  jar.set(u.hostname,cookies);return r;
 }
 let authUrl=grant.href,authenticated=false;
 for(let i=0;i<6;i++){
  const r=await withCookies(authUrl);if(r.status===200&&new URL(authUrl).origin===origin){authenticated=true;break;}
  if(![301,302,303,307,308].includes(r.status))throw Error('preview_auth_http_'+r.status);
  const next=new URL(r.headers.get('location'),authUrl);if(next.origin==='https://vercel.com'&&next.pathname.startsWith('/login'))throw Error('preview_share_requires_login');authUrl=next.href;
 }
 if(!authenticated)throw Error('preview_share_not_authenticated');
 const release=new GitHubVercelAdapter({fetchImpl:(url,options)=>new URL(url).origin==='https://api.github.com'?fetch(url,options):withCookies(url,options)});
 const factory=new Factory({store,release});let final;
 for(let i=0;i<60;i++){
  const head=await release.api('git/ref/heads/factory/'+id);if(head.object.sha!==payload.rc_commit)throw Error('exact_rc_commit_changed');
  final=await factory.run(id,{rc:true});
  if(final.state==='READY_TO_SHIP'||final.state==='PREVIEW_SMOKE')break;
  if(final.state!=='PREVIEW_DEPLOYING')throw Error('unexpected_release_state');await delay(10000);
 }
 atomicJSON(path.join(root,'protected-transport.json'),{game_id:id,run_id:process.env.GITHUB_RUN_ID,public_key_sha256:pub.public_key_sha256,ciphertext_sha256:digest(sealed.ciphertext),preview_origin:origin,rc_commit:payload.rc_commit,source_archive_id:payload.artifact_id,source_archive_sha256:payload.artifact_sha256,methods:'GET only; host-scoped temporary authentication cookies; unchanged smokePreview byte comparison',provider_calls:0,production_authorized:false});
 atomicJSON(path.join(root,'release-review-packet.json'),buildPacket(final,{base_ref:'e3203597e414ee258b7816f189eed3f4cff1392b'}));
 execFileSync(process.execPath,[path.join(__dirname,'../../control-plane/cli.cjs'),'dashboard','--root',root,'--policy',path.join(root,'control-policy.json'),'--provider-ready','true'],{stdio:'inherit'});
 console.log(JSON.stringify({state:final.state,version:final.version,source_hash:final.source_hash,preview_url:final.preview_url}));
 if(final.state!=='READY_TO_SHIP')process.exitCode=2;
 fs.rmSync(path.join(dir,'private.pem'),{force:true});
}
main().catch(e=>{console.error(String(e.message).replace(/_vercel_share=[^&\s]+/g,'_vercel_share=REDACTED'));process.exitCode=1;});
