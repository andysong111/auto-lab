-- RETENTION_PREREQUISITE_BEGIN
-- Deployment fails before any schema change when managed retention is unavailable.
do $$begin
 if not exists(select 1 from pg_extension where extname='pg_cron') then
  raise exception 'retention_scheduler_required: install and configure pg_cron before this migration';
 end if;
end;$$;
-- RETENTION_PREREQUISITE_END
-- Additive marketing telemetry only. No foreign keys, triggers or writes to game accounts/scores.
create schema if not exists loopjolt_marketing;
revoke all on schema loopjolt_marketing from public,anon,authenticated;
create table loopjolt_marketing.settings(singleton boolean primary key default true check(singleton), enabled boolean not null default false);
insert into loopjolt_marketing.settings(singleton,enabled) values(true,false);
create table loopjolt_marketing.events(
 event_id uuid primary key,
 received_at timestamptz not null default clock_timestamp(),
 session_key text not null check(session_key ~ '^[a-f0-9]{64}$'),
 attempt_id uuid,
 event text not null check(event in ('page_view','game_open','game_start','game_finish','replay','share','next_game','score_verified','ranked_downgrade','ranked_entry')),
 game text check(game in ('gyro-drop','core-pins','nova-merge','orbit-sprint','reaction-rush','perfect-timing','dont-press','color-trap','memory-grid','odd-one-out')),
 source text not null check(source ~ '^[a-z0-9_-]{1,48}$'),
 source_raw text not null check(source_raw ~ '^[a-z0-9_-]{0,48}$'),
 medium text not null check(medium ~ '^[a-z0-9_-]{0,40}$'),
 campaign text not null check(campaign ~ '^[a-z0-9_-]{0,80}$'),
 content text not null check(content ~ '^[a-z0-9_-]{0,80}$'),
 scope text not null check(scope in ('channel_only','content_tagged','unattributed')),
 ranked boolean,
 build text not null check(build ~ '^[a-z0-9_-]{0,48}$')
);
create index acquisition_received_idx on loopjolt_marketing.events(received_at);
create index acquisition_session_idx on loopjolt_marketing.events(session_key,attempt_id,event);
create unique index acquisition_attempt_once on loopjolt_marketing.events(session_key,attempt_id,event)
 where attempt_id is not null and event in ('game_start','game_finish','replay','score_verified','ranked_downgrade');
create table loopjolt_marketing.limits(key text primary key, hits integer not null, expires_at timestamptz not null);
alter table loopjolt_marketing.settings enable row level security;
alter table loopjolt_marketing.events enable row level security;
alter table loopjolt_marketing.limits enable row level security;
revoke all on all tables in schema loopjolt_marketing from public,anon,authenticated;
create function public.loopjolt_acquisition_ingest(p_event jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e text:=p_event->>'event'; sk text:=p_event->>'session_key'; t timestamptz:=clock_timestamp();k text;h integer;cap integer; ins integer;
begin
 if not exists(select 1 from loopjolt_marketing.settings where singleton and enabled) then return '{"status":"disabled"}'::jsonb;end if;
 if jsonb_typeof(p_event)<>'object' or octet_length(p_event::text)>4096 or p_event->>'schema' is distinct from 'loopjolt-acquisition/4.1'
 or coalesce(sk,'') !~ '^[a-f0-9]{64}$'
 or coalesce(p_event->>'event_id','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
 or e is null or e not in ('page_view','game_open','game_start','game_finish','replay','share','next_game','score_verified','ranked_downgrade','ranked_entry') then raise exception 'invalid_telemetry';end if;
 foreach k in array array['day:'||to_char(t at time zone 'UTC','YYYYMMDD'),'minute:'||to_char(t at time zone 'UTC','YYYYMMDDHH24MI'),'session:'||sk] loop
  cap:=case when k like 'day:%' then 20000 when k like 'minute:%' then 1200 else 600 end;
  insert into loopjolt_marketing.limits(key,hits,expires_at) values(k,1,t+interval '2 days')
  on conflict(key) do update set hits=least(loopjolt_marketing.limits.hits+1,20001) returning hits into h;
  if h>cap then return '{"status":"rate_limited"}'::jsonb;end if;
 end loop;
 insert into loopjolt_marketing.events(event_id,session_key,attempt_id,event,game,source,source_raw,medium,campaign,content,scope,ranked,build)
 values((p_event->>'event_id')::uuid,sk,nullif(p_event->>'attempt_id','')::uuid,e,p_event->'props'->>'game',
 p_event->>'source',coalesce(p_event->>'source_raw',''),coalesce(p_event->>'medium',''),coalesce(p_event->>'campaign',''),coalesce(p_event->>'content',''),p_event->>'scope',
 (p_event->'props'->>'ranked')::boolean,coalesce(p_event->>'build','')) on conflict do nothing;
 get diagnostics ins=row_count;
 return jsonb_build_object('status',case when ins=1 then 'stored' else 'duplicate' end);
end;$$;
revoke all on function public.loopjolt_acquisition_ingest(jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_acquisition_ingest(jsonb) to service_role;
create function public.loopjolt_acquisition_report(p_days integer default 7) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare out jsonb;
begin
 if p_days is null or p_days<1 or p_days>30 then raise exception 'invalid_period';end if;
 with e as (select * from loopjolt_marketing.events where received_at>=now()-make_interval(days=>p_days)),
 groups as (
 select source,campaign,case when scope='content_tagged' then content else '' end as content,scope,
 count(distinct session_key) as observed_sessions,
 count(distinct session_key) filter(where event='game_start') as starting_sessions,
 count(distinct session_key) filter(where event='replay') as replaying_sessions,
 count(distinct session_key) filter(where event='ranked_entry') as ranked_interest_sessions,
 count(distinct session_key) filter(where event='game_start' and ranked) as ranked_starting_sessions,
 count(*) filter(where event='game_start') as started_attempts,
 count(*) filter(where event='game_finish' and exists(select 1 from e s where s.event='game_start' and s.session_key=e.session_key and s.attempt_id=e.attempt_id)) as matched_completed_attempts,
 count(*) filter(where event='game_finish' and not exists(select 1 from e s where s.event='game_start' and s.session_key=e.session_key and s.attempt_id=e.attempt_id)) as unmatched_finishes,
 count(*) filter(where event='score_verified') as client_score_success_reports,
 array_agg(distinct source_raw) as source_aliases
 from e group by source,campaign,case when scope='content_tagged' then content else '' end,scope
 ), games as (
 select game,count(distinct session_key) as observed_game_sessions,
 count(distinct session_key) filter(where event='game_start') as starting_sessions,
 count(distinct session_key) filter(where event='replay') as replaying_sessions,
 count(*) filter(where event='game_start') as started_attempts
 from e where game is not null group by game
 )
 select jsonb_build_object('schema','loopjolt-acquisition-report/4.1','days',p_days,'observed_at',now(),
 'event_count',(select count(*) from e),'first_event_at',(select min(received_at) from e),
 'channels',coalesce((select jsonb_agg(to_jsonb(g)) from groups g),'[]'::jsonb),
 'games',coalesce((select jsonb_agg(to_jsonb(g)) from games g),'[]'::jsonb),
 'status',case when exists(select 1 from e) then 'OBSERVATIONAL' else 'NO_DATA' end,
 'limits','Sessions are random tab sessions with 30-minute inactivity reset and UTC-day hash rotation; not people or cross-day return users. Client score reports are not authoritative ranked totals. Common bio traffic is channel-only. Events may be blocked, forged or rate-limited.') into out;
 return out;
end;$$;
revoke all on function public.loopjolt_acquisition_report(integer) from public,anon,authenticated;
grant execute on function public.loopjolt_acquisition_report(integer) to service_role;
create function loopjolt_marketing.cleanup() returns void language sql security definer set search_path='' as $$
 delete from loopjolt_marketing.events where received_at<now()-interval '30 days';
 delete from loopjolt_marketing.limits where expires_at<now();
$$;
revoke all on function loopjolt_marketing.cleanup() from public,anon,authenticated;
-- RETENTION_PROVISION_BEGIN
do $$begin
 perform cron.schedule('loopjolt-marketing-retention','17 * * * *','select loopjolt_marketing.cleanup();');
 if not exists(select 1 from cron.job where jobname='loopjolt-marketing-retention' and active and schedule='17 * * * *' and command='select loopjolt_marketing.cleanup();') then
  raise exception 'retention_scheduler_required: cleanup job is not active';
 end if;
end;$$;
-- RETENTION_PROVISION_END
