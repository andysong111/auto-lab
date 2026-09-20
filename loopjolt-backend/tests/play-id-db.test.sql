-- Disposable PostgreSQL test only; CI host/database must match before this file runs.
\set ON_ERROR_STOP on
begin;
update loopjolt.settings set enabled=true,play_id_enabled=true,google_client_id='' where singleton;
do $$declare
 l text:='qa_'||substr(md5(random()::text),1,10);s text:=md5(random()::text)||md5(random()::text);
 h text:=repeat('a',64);salt text:=repeat('b',32);r text:=repeat('c',64);
 t text:=md5(random()::text)||md5(random()::text);t2 text:=md5(random()::text)||md5(random()::text);
 ak text:=md5(random()::text)||md5(random()::text);ik text:=md5(random()::text)||md5(random()::text);
 j jsonb;payload jsonb;i integer;pid uuid;gp uuid;gs text:=md5(random()::text)||md5(random()::text);
begin
 assert not has_function_privilege('anon','public.loopjolt_play_auth(text,jsonb)','EXECUTE'),'anon RPC grant';
 assert not has_function_privilege('authenticated','public.loopjolt_play_auth(text,jsonb)','EXECUTE'),'authenticated RPC grant';
 assert has_function_privilege('service_role','public.loopjolt_play_auth(text,jsonb)','EXECUTE'),'server grant';
 assert (select bool_and(rowsecurity) from pg_tables where schemaname='loopjolt' and tablename in('play_credentials','play_sessions','play_rate')),'RLS';
 for i in 1..11 loop j:=public.loopjolt_play_auth('rate',jsonb_build_object('accountKey',ak,'ipKey',ik));assert (j->>'allowed')::boolean=(i<=10),'rate limit';end loop;
 payload:=jsonb_build_object('login',l,'salt',salt,'hash',h,'subject',s,'sessionHash',t,'recoveryHash',r,'country','KR','consent',true,'age16',true,'ipKey',ik);
 j:=public.loopjolt_play_auth('enter',payload);assert j->'profile'->>'country'='KR','create';
 select id into pid from loopjolt.profiles where subject_hash=s;assert pid is not null,'profile';
 j:=public.loopjolt_play_auth('session',jsonb_build_object('sessionHash',t));assert j->>'subject'=s,'session';
 j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('expectedHash',h,'country','US','sessionHash',t2));assert j->'profile'->>'country'='KR','country changed on login';
 j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('expectedHash',repeat('d',64),'hash',repeat('d',64)));assert j->>'error'='invalid_credentials','wrong password';
 begin perform public.loopjolt_gateway('save_profile',s,jsonb_build_object('handle',l,'country','US','consent',true,'age16',true));raise exception 'lock missing';exception when others then if SQLERRM not like '%country_locked_30_days%' then raise;end if;end;
 j:=public.loopjolt_gateway('start',s,jsonb_build_object('game','orbit-sprint'));assert j->>'runId' is not null,'Google-independent start';
 for i in 1..7 loop j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('expectedHash',h,'sessionHash',md5(random()::text)||md5(random()::text)));end loop;
 assert (select count(*)=5 from loopjolt.play_sessions where profile_id=pid),'session cap';
 update loopjolt.play_sessions set expires_at=now()-interval '1 second' where profile_id=pid;
 j:=public.loopjolt_play_auth('session',jsonb_build_object('sessionHash',t));assert j->>'subject' is null,'expired session';
 j:=public.loopjolt_play_auth('recover',jsonb_build_object('login',l,'salt',salt,'hash',repeat('d',64),'recoveryHash',r,'nextRecoveryHash',repeat('e',64),'sessionHash',t2));assert j->'profile'->>'handle'=l,'recovery';
 assert (select count(*)=1 from loopjolt.play_sessions where profile_id=pid),'session revocation';
 j:=public.loopjolt_play_auth('recover',jsonb_build_object('login',l,'salt',salt,'hash',h,'recoveryHash',r,'nextRecoveryHash',repeat('f',64),'sessionHash',t));assert j->>'error'='invalid_credentials','one-time code';
 update loopjolt.profiles set blocked=true where id=pid;
 j:=public.loopjolt_play_auth('session',jsonb_build_object('sessionHash',t2));assert j->>'subject' is null,'blocked session';
 j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('expectedHash',repeat('d',64),'hash',repeat('d',64)));assert j->>'error'='invalid_credentials','blocked login';
 update loopjolt.profiles set blocked=false where id=pid;
 j:=public.loopjolt_play_auth('logout',jsonb_build_object('sessionHash',t2));assert not exists(select 1 from loopjolt.play_sessions where token_hash=t2),'logout revocation';
 perform public.loopjolt_gateway('save_profile',gs,jsonb_build_object('handle','legacy_google','country','US','consent',true,'age16',true));
 select id into gp from loopjolt.profiles where subject_hash=gs;
 j:=public.loopjolt_play_auth('lookup',jsonb_build_object('login','legacy_google'));assert (j->>'collision')::boolean,'Google ID reserved';
 j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('login','legacy_google','subject',md5(random()::text)||md5(random()::text)));assert j->>'error'='invalid_credentials','Google takeover';
 assert exists(select 1 from loopjolt.profiles where id=gp and subject_hash=gs),'Google profile preserved';
 perform public.loopjolt_gateway('delete_profile',s,jsonb_build_object('confirmation','DELETE MY LOOPJOLT ACCOUNT'));
 assert not exists(select 1 from loopjolt.play_credentials where login=l),'credential deletion cascade';
 assert not exists(select 1 from loopjolt.play_sessions where profile_id=pid),'session deletion cascade';
end;$$;
select 'PASS: Play ID SQL lifecycle, grants, RLS, rate limits, country lock, session cap/expiry/revocation, Google collision and deletion cascade in disposable PostgreSQL.' as result;
rollback;
