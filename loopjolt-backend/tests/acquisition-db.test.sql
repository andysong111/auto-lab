-- Disposable CI database only. All test fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
update loopjolt_marketing.settings set enabled=true where singleton;
do $$declare p jsonb; r jsonb; k text:=repeat('a',64);attempt text:='00000000-0000-4000-8000-000000000099';
begin
 assert not has_function_privilege('anon','public.loopjolt_acquisition_ingest(jsonb)','EXECUTE');
 assert not has_function_privilege('authenticated','public.loopjolt_acquisition_report(integer)','EXECUTE');
 assert not has_schema_privilege('anon','loopjolt_marketing','USAGE');
 assert (select bool_and(rowsecurity) from pg_tables where schemaname='loopjolt_marketing');
 p:=jsonb_build_object('schema','loopjolt-acquisition/4.1','event_id','00000000-0000-4000-8000-000000000001','session_key',k,'attempt_id',attempt,'event','game_start','source','instagram','source_raw','ig','medium','profile','campaign','alwayson','content','dd_fc01','scope','channel_only','props',jsonb_build_object('game','gyro-drop','ranked',false),'build','test');
 r:=public.loopjolt_acquisition_ingest(p);assert r->>'status'='stored';
 r:=public.loopjolt_acquisition_ingest(p);assert r->>'status'='duplicate';
 r:=public.loopjolt_acquisition_ingest(p||jsonb_build_object('event_id','00000000-0000-4000-8000-000000000002'));assert r->>'status'='duplicate';
 r:=public.loopjolt_acquisition_ingest(p||jsonb_build_object('event_id','00000000-0000-4000-8000-000000000003','event','game_finish'));assert r->>'status'='stored';
 r:=public.loopjolt_acquisition_ingest(p||jsonb_build_object('event_id','00000000-0000-4000-8000-000000000004','event','game_finish','attempt_id','00000000-0000-4000-8000-000000000088'));assert r->>'status'='stored';
 r:=public.loopjolt_acquisition_report(7);
 assert (r->'channels'->0->>'started_attempts')::int=1;
 assert (r->'channels'->0->>'matched_completed_attempts')::int=1;
 assert (r->'channels'->0->>'unmatched_finishes')::int=1;
 assert r->'channels'->0->>'content'='';
 update loopjolt_marketing.limits set hits=600 where key='session:'||k;
 r:=public.loopjolt_acquisition_ingest(p);assert r->>'status'='rate_limited';
 update loopjolt_marketing.events set received_at=now()-interval '31 days';
 assert public.loopjolt_acquisition_report(7)->>'status'='NO_DATA';
 perform loopjolt_marketing.cleanup();assert not exists(select 1 from loopjolt_marketing.events);
 update loopjolt_marketing.settings set enabled=false;
 assert public.loopjolt_acquisition_ingest(p)->>'status'='disabled';
end;$$;
rollback;
select 'PASS: private access, dedup, matched attempts, bio attribution, rate limits, retention, kill switch' as result;
