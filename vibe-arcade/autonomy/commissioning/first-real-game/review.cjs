'use strict';
const path=require('node:path');
const {FileStore}=require('../../orchestrator/store.cjs');
const {DockerQA}=require('../../isolation/docker-qa.cjs');
const {defaults}=require('../../providers/config.cjs');
const root=process.env.FACTORY_WORKER_ROOT,m=new FileStore(root).get('GAME-20260922-110');
new DockerQA({limits:defaults.isolation}).run({manifest:m,gameRoot:path.join(root,m.source_path),outDir:path.join(root,'quality-review'),policy:require('../../policies/quality-gate.json'),review:true}).then(r=>{console.log(JSON.stringify({passed:r.passed,hard_failures:r.hard_failures,playthroughs:r.browser_cases.map(c=>({viewport:c.viewport,...c.playthrough}))},null,2));if(!r.passed)process.exitCode=1;}).catch(e=>{console.error(e.message);process.exitCode=1;});
