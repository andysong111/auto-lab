'use strict';
// CI-only schema fixture. Production SQL has no environment bypass for retention.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.PGHOST,'localhost');assert.equal(process.env.PGDATABASE,'acquisition_test');
const migration=path.resolve(__dirname,'../migrations/20260921_acquisition.sql');
const run=args=>spawnSync('psql',['-v','ON_ERROR_STOP=1',...args],{encoding:'utf8',timeout:30000});
const probe=run(['-Atc',"select exists(select 1 from pg_extension where extname='pg_cron');"]);assert.equal(probe.status,0);assert.equal(probe.stdout.trim(),'f','This fixture expects the plain PostgreSQL CI image.');
const rejected=run(['--single-transaction','-f',migration]);assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/retention_scheduler_required/);
const empty=run(['-Atc',"select to_regnamespace('loopjolt_marketing') is null;"]);assert.equal(empty.status,0);assert.equal(empty.stdout.trim(),'t','Failed precondition must leave no schema.');
console.log('PASS: production migration rejects missing scheduler before schema creation.');
// The rest of the SQL lifecycle tests do not need an operating clock scheduler.
// Omit only its two explicitly delimited blocks in a temporary disposable fixture;
// never alter the production migration, pg_extension catalogue or production settings.
let sql=fs.readFileSync(migration,'utf8');for(const name of ['PREREQUISITE','PROVISION']){const re=new RegExp('-- RETENTION_'+name+'_BEGIN[\\s\\S]*?-- RETENTION_'+name+'_END\\n?','g');assert.equal([...sql.matchAll(re)].length,1);sql=sql.replace(re,'');}
assert(sql.includes('create function loopjolt_marketing.cleanup()'));assert(!sql.includes('cron.schedule'));
const file=path.join(process.env.RUNNER_TEMP||'/tmp','acquisition-disposable-schema.sql');fs.writeFileSync(file,sql);
const created=run(['--single-transaction','-f',file]);assert.equal(created.status,0,created.stderr);console.log('PASS: disposable schema prepared; production cron provisioning is separately verified on deployment.');
