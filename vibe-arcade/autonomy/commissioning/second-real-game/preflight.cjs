'use strict';
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const approval=require('./run-request.json');
const api=route=>JSON.parse(execFileSync('gh',['api',`repos/${process.env.GITHUB_REPOSITORY}/${route}`],{encoding:'utf8',maxBuffer:1048576}));
const ids=fs.readFileSync(process.env.RUNNER_TEMP+'/prior-commissioning-runs','utf8').trim().split(/\s+/);
for(const id of ids){
  if(id===process.env.GITHUB_RUN_ID)continue;
  if(!approval.verified_zero_job_runs?.includes(Number(id)))throw Error('prior_commissioning_exists_restore_ledger_do_not_resubmit');
  const run=api(`actions/runs/${id}`),jobs=api(`actions/runs/${id}/jobs`);
  if(run.status!=='completed'||run.conclusion!=='failure'||jobs.total_count!==0||jobs.jobs.length!==0)throw Error('prior_run_may_have_submitted_do_not_resubmit');
}
console.log('No earlier runner job or provider submission exists for this game.');
