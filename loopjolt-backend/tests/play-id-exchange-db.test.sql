-- Disposable PostgreSQL only; never run this test against production.
\set ON_ERROR_STOP on
begin;
update loopjolt.settings set enabled=true,play_id_enabled=true where singleton;
do $$declare
 l text:='qa_'||substr(md5(random()::text),1,10);sub text:=md5(random()::text)||md5(random()::text);
 th text:=repeat('1',64);sh text:=repeat('2',64);outsh text:=repeat('3',64);j jsonb;payload jsonb;pid uuid;
begin
 assert not has_function_privilege('anon','public.loopjolt_play_exchange(text,jsonb)','EXECUTE'),'public exchange RPC';
 assert not has_function_privilege('authenticated','public.loopjolt_play_exchange(text,jsonb)','EXECUTE'),'user exchange RPC';
 assert (select rowsecurity from pg_tables where schemaname='loopjolt' and tablename='play_exchanges'),'exchange RLS';
 payload:=jsonb_build_object('login',l,'salt',repeat('b',32),'hash',repeat('c',64),'subject',sub,'sessionHash',sh,'recoveryHash',repeat('d',64),'country','KR','consent',true,'age16',true,'ipKey',repeat('e',64));
 j:=public.loopjolt_play_auth('enter',payload);assert j->'profile'->>'handle'=l,'create';
 select id into pid from loopjolt.profiles where subject_hash=sub;
 j:=public.loopjolt_play_exchange('exchange_stage',jsonb_build_object('sessionHash',sh,'ticketHash',th));assert (j->>'staged')::boolean,'stage';
 j:=public.loopjolt_play_auth('session',jsonb_build_object('sessionHash',sh));assert j->>'subject' is null,'prepared token disabled';
 j:=public.loopjolt_play_exchange('exchange_redeem',jsonb_build_object('sessionHash',outsh,'ticketHash',th));assert j->'profile'->>'handle'=l,'redeem';
 j:=public.loopjolt_play_auth('session',jsonb_build_object('sessionHash',outsh));assert j->>'subject'=sub,'cookie session';
 j:=public.loopjolt_play_exchange('exchange_redeem',jsonb_build_object('sessionHash',sh,'ticketHash',th));assert j->>'error'='invalid_or_expired_login','ticket cannot replay';
 j:=public.loopjolt_play_exchange('exchange_stage',jsonb_build_object('sessionHash',outsh,'ticketHash',th));
 update loopjolt.play_exchanges set expires_at=now()-interval '1 second' where ticket_hash=th;
 j:=public.loopjolt_play_exchange('exchange_redeem',jsonb_build_object('sessionHash',sh,'ticketHash',th));assert j->>'error'='invalid_or_expired_login','ticket expiration';
 j:=public.loopjolt_play_auth('enter',payload||jsonb_build_object('expectedHash',repeat('c',64)));
 j:=public.loopjolt_play_exchange('exchange_stage',jsonb_build_object('sessionHash',sh,'ticketHash',th));
 j:=public.loopjolt_play_auth('recover',jsonb_build_object('login',l,'salt',repeat('b',32),'hash',repeat('f',64),'recoveryHash',repeat('d',64),'nextRecoveryHash',repeat('a',64),'sessionHash',outsh));
 assert not exists(select 1 from loopjolt.play_exchanges where profile_id=pid),'reset invalidates pending exchange';
 j:=public.loopjolt_play_exchange('exchange_redeem',jsonb_build_object('sessionHash',sh,'ticketHash',th));assert j->>'error'='invalid_or_expired_login','old ticket blocked after reset';
 perform public.loopjolt_gateway('delete_profile',sub,jsonb_build_object('confirmation','DELETE MY LOOPJOLT ACCOUNT'));
 assert not exists(select 1 from loopjolt.play_exchanges where profile_id=pid),'delete cascade';
end;$$;
select 'PASS: hashed one-use exchanges, two-minute expiry, reset invalidation, profile cascade and private RPC grants.' as result;
rollback;
