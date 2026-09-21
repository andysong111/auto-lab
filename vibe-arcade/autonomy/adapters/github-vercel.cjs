'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ID,listFiles,hashTree,atomicJSON,readJSON}=require('../orchestrator/files.cjs');
const REPO='andysong111/auto-lab';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function assertBranch(id,branch) { if(!ID.test(id)||branch!==`factory/${id}`)throw Error('branch_isolation');return branch; }
function assertFiles(id,version,files) {
  const prefix=`vibe-arcade/autonomy/games/${id}/${version}/`;
  if(!files.length||files.some(f=>!f.startsWith(prefix)||f.includes('..')||f.includes('\\')))throw Error('path_isolation');
}
function previewURL(raw) {
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.endsWith('.vercel.app')||u.hostname==='vibe-arcade-dun.vercel.app'||u.search||u.hash) throw Error('not_a_preview_url');
  return u.origin;
}
async function smokePreview({manifest,gameRoot,fetchImpl=fetch}) {
  const started=Date.now(),checks=[],failures=[];
  try {
    const origin=previewURL(manifest.preview_url),prefix=`/autonomy/games/${manifest.game_id}/${manifest.version}`;
    for(const name of listFiles(gameRoot).filter(f=>!/\.md$/.test(f))) {
      let url=origin+prefix+'/'+name;
      let r;
      for(let redirects=0;redirects<4;redirects++) {
        r=await fetchImpl(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Cache-Control':'no-cache'}});
        if(![301,302,307,308].includes(r.status))break;
        const next=new URL(r.headers.get('location'),url);
        if(next.origin!==origin||!next.pathname.startsWith(prefix))throw Error('preview_redirect_outside_candidate');
        url=next.href;
      }
      if(r.status!==200)throw Error(`preview_http_${r.status}: ${name}`);
      if(Number(r.headers.get('content-length')||0)>20*1024*1024)throw Error('preview_response_too_large');
      const body=Buffer.from(await r.arrayBuffer()),local=fs.readFileSync(path.join(gameRoot,name));
      if(digest(body)!==digest(local))throw Error('preview_source_mismatch: '+name);
      checks.push({file:name,status:r.status,sha256:digest(body)});
    }
    if(hashTree(gameRoot)!==manifest.source_hash)throw Error('source_tampered');
  } catch(e) {failures.push({code:'preview_smoke',message:e.message});}
  return {passed:failures.length===0,checks,hard_failures:failures,method:'GET only; byte identity of all candidate runtime assets',duration_ms:Date.now()-started};
}
class GitHubVercelAdapter {
  constructor({token=process.env.GITHUB_TOKEN,baseRef='main',fetchImpl=fetch,requiredChecks=['Factory contracts','Factory browser','Factory regression']}={}) {
    this.token=token;this.base=baseRef;this.fetch=fetchImpl;this.requiredChecks=requiredChecks;
  }
  async api(route,method='GET',body) {
    if(!this.token)throw Error('github_token_required');
    const r=await this.fetch(`https://api.github.com/repos/${REPO}/${route}`,{method,redirect:'error',signal:AbortSignal.timeout(20000),
      headers:{Authorization:'Bearer '+this.token,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});
    if(!r.ok) {const e=Error(`github_${r.status}: ${method} ${route}`);e.status=r.status;throw e;}
    return r.status===204?{}:r.json();
  }
  async prepare({manifest:m,gameRoot,store}) {
    if(m.quality_status!=='PASS'||m.qa_status!=='PASS'||hashTree(gameRoot)!==m.source_hash)throw Error('rc_gate_required');
    const branch=assertBranch(m.game_id,`factory/${m.game_id}`),file=store.artifact(m.game_id,`${m.version}/rc.json`);
    let journal=fs.existsSync(file)?readJSON(file):{branch,source_hash:m.source_hash};
    if(journal.source_hash!==m.source_hash)throw Error('rc_source_changed');
    const write=()=>atomicJSON(file,journal);
    let ref;
    try {ref=await this.api('git/ref/heads/'+branch);}catch(e) {
      if(e.status!==404)throw e;
      const base=await this.api('commits/'+encodeURIComponent(this.base));
      ref=await this.api('git/refs','POST',{ref:'refs/heads/'+branch,sha:base.sha});
    }
    // Recover crash after ref update by comparing the source tree with the desired files.
    const head=await this.api('git/commits/'+ref.object.sha), tree=await this.api('git/trees/'+head.tree.sha+'?recursive=1');
    if(tree.truncated)throw Error('github_tree_truncated');
    const names=listFiles(gameRoot),prefix=`vibe-arcade/autonomy/games/${m.game_id}/${m.version}/`;
    assertFiles(m.game_id,m.version,names.map(f=>prefix+f));
    const blobSha=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
    const unchanged=names.every(f=>tree.tree.find(t=>t.path===prefix+f)?.sha===blobSha(fs.readFileSync(path.join(gameRoot,f))));
    if(!unchanged) {
      if(journal.rc_commit)throw Error('rc_branch_diverged');
      const entries=[];
      for(const f of names) {
        const b=await this.api('git/blobs','POST',{content:fs.readFileSync(path.join(gameRoot,f)).toString('base64'),encoding:'base64'});
        entries.push({path:prefix+f,mode:'100644',type:'blob',sha:b.sha});
      }
      const newTree=await this.api('git/trees','POST',{base_tree:head.tree.sha,tree:entries});
      const commit=await this.api('git/commits','POST',{message:`factory: ${m.game_id} ${m.version} release candidate`,tree:newTree.sha,parents:[ref.object.sha]});
      // Compare current head again; do not overwrite concurrent work or force a push.
      const current=await this.api('git/ref/heads/'+branch);if(current.object.sha!==ref.object.sha)throw Error('rc_branch_race');
      await this.api('git/refs/heads/'+branch,'PATCH',{sha:commit.sha,force:false});
      journal.rc_commit=commit.sha;write();
    } else {journal.rc_commit=ref.object.sha;write();}
    const pulls=await this.api('pulls?state=open&head='+encodeURIComponent('andysong111:'+branch)+'&base='+encodeURIComponent(this.base));
    let pr=pulls[0];
    if(!pr)pr=await this.api('pulls','POST',{title:`Factory RC: ${m.title} (${m.game_id} ${m.version})`,head:branch,base:this.base,draft:true,
      body:`Mechanical QA passed for source ${m.source_hash}.\n\nUnlisted Phase 1 candidate; no production merge, accounts, rankings, telemetry, or homepage registration. Heuristic quality remains unverified.\n\nArtifacts: autonomy/artifacts/${m.game_id}/${m.version}/. AUTO_PRODUCTION_SHIP=false.`});
    Object.assign(journal,{pr_number:pr.number,pr_url:pr.html_url});write();
    const checks=await this.api('commits/'+journal.rc_commit+'/check-runs?per_page=100');
    const ciReady=this.requiredChecks.every(name=>checks.check_runs.some(c=>c.name===name&&c.conclusion==='success')) && checks.check_runs.every(c=>['success','neutral','skipped'].includes(c.conclusion));
    if(!ciReady)return {branch,rc_commit:journal.rc_commit,pr_number:pr.number,pr_url:pr.html_url};
    const deployments=await this.api('deployments?sha='+journal.rc_commit+'&per_page=100');
    for(const d of deployments) {
      if(d.sha!==journal.rc_commit||d.production_environment===true||!/preview/i.test(d.environment||''))continue;
      const statuses=await this.api(`deployments/${d.id}/statuses?per_page=1`),s=statuses[0];
      if(s?.state!=='success'||!s.environment_url)continue;
      const preview=previewURL(s.environment_url);
      Object.assign(journal,{preview_url:preview,deployment_id:String(d.id)});write();
      return {branch,rc_commit:journal.rc_commit,pr_number:pr.number,pr_url:pr.html_url,preview_url:preview,deployment_id:String(d.id)};
    }
    return {branch,rc_commit:journal.rc_commit,pr_number:pr.number,pr_url:pr.html_url};
  }
  smoke({manifest,gameRoot}) {return smokePreview({manifest,gameRoot,fetchImpl:this.fetch});}
  productionShip() {throw Error('AUTO_PRODUCTION_SHIP=false: production shipping is not implemented in Phase 1');}
}
module.exports={GitHubVercelAdapter,smokePreview,assertBranch,assertFiles,previewURL};
