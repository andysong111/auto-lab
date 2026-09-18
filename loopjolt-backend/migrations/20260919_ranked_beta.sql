-- Applied 2026-09-19: loopjolt_isolated_competition_v1.
-- New private app schema only; no writes to commerce tables or auth.users.
create schema if not exists loopjolt;
revoke all on schema loopjolt from public, anon, authenticated;
create table loopjolt.settings (singleton boolean primary key default true check(singleton), google_client_id text not null default '', enabled boolean not null default false);
insert into loopjolt.settings(singleton) values(true);
create table loopjolt.profiles (id uuid primary key default gen_random_uuid(), subject_hash text unique not null check(subject_hash ~ '^[0-9a-f]{64}$'), handle text not null check(handle ~ '^[A-Za-z0-9_]{3,20}$'), country_code text check(country_code ~ '^[A-Z]{2}$'), country_changed_at timestamptz, consent_version text not null default '2026-09-19', created_at timestamptz not null default now(), blocked boolean not null default false);
create unique index loopjolt_handle_unique on loopjolt.profiles(lower(handle));
create table loopjolt.runs (id uuid primary key default gen_random_uuid(), profile_id uuid not null references loopjolt.profiles(id) on delete cascade, game text not null check(game='orbit-sprint'), version text not null check(version='orbit-v1'), seed bigint not null, country_code text, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '15 minutes', consumed boolean not null default false);
create index loopjolt_runs_player_time on loopjolt.runs(profile_id,created_at desc);
create table loopjolt.scores (run_id uuid primary key, profile_id uuid not null references loopjolt.profiles(id) on delete cascade, game text not null, version text not null, country_code text, score integer not null check(score between 0 and 50000), ticks integer not null check(ticks between 1 and 5400), orbs integer not null check(orbs between 0 and 150), max_combo integer not null check(max_combo between 0 and 150), played_at timestamptz not null, verified_at timestamptz not null default now());
create index loopjolt_score_board on loopjolt.scores(game,version,played_at desc,score desc);
alter table loopjolt.settings enable row level security;
alter table loopjolt.profiles enable row level security;
alter table loopjolt.runs enable row level security;
alter table loopjolt.scores enable row level security;
revoke all on all tables in schema loopjolt from public, anon, authenticated;
create or replace function public.loopjolt_gateway(p_action text, p_subject text default null, p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare p loopjolt.profiles%rowtype; r loopjolt.runs%rowtype; answer jsonb; h text; c text; cutoff timestamptz; sc text; weekseed bigint;
begin
 weekseed:=((date_trunc('week',now() at time zone 'UTC')::date-date '2020-01-01')+123456)::bigint;
 if p_action='config' then select jsonb_build_object('clientId',google_client_id,'loginReady',enabled and google_client_id<>'','version','orbit-v1','seed',weekseed) into answer from loopjolt.settings where singleton;return answer;end if;
 if p_action='board' then
  if coalesce(p_payload->>'period','week') not in ('week','all') or coalesce(p_payload->>'scope','world') not in ('world','country','nations') then raise exception 'invalid_board';end if;
  cutoff:=case when p_payload->>'period'='all' then '-infinity'::timestamptz else date_trunc('week',now() at time zone 'UTC') at time zone 'UTC' end;sc:=coalesce(p_payload->>'scope','world');
  if sc='nations' then
   with best as (select distinct on(s.profile_id) s.profile_id,s.score,s.country_code from loopjolt.scores s join loopjolt.profiles u on u.id=s.profile_id where s.game='orbit-sprint' and s.version='orbit-v1' and s.played_at>=cutoff and not u.blocked order by s.profile_id,s.score desc,s.verified_at asc), pos as(select *,row_number() over(partition by country_code order by score desc,profile_id) n from best where country_code is not null), totals as(select country_code, sum(score) filter(where n<=10) points,count(*) players,least(count(*),10) contributors from pos group by country_code), ranked as(select rank() over(order by points desc) rank,* from totals)
   select coalesce(jsonb_agg(to_jsonb(z)),'[]'::jsonb) into answer from(select * from ranked order by points desc,country_code limit 100)z;
  else
   with best as(select distinct on(s.profile_id) s.profile_id,u.handle,s.country_code,s.score,s.verified_at from loopjolt.scores s join loopjolt.profiles u on u.id=s.profile_id where s.game='orbit-sprint' and s.version='orbit-v1' and s.played_at>=cutoff and not u.blocked order by s.profile_id,s.score desc,s.verified_at asc), filtered as(select * from best where sc='world' or country_code=p_payload->>'country'), ranked as(select rank() over(order by score desc) rank,handle,country_code,score,verified_at from filtered)
   select coalesce(jsonb_agg(to_jsonb(z)),'[]'::jsonb) into answer from(select * from ranked order by score desc,verified_at,handle limit 100)z;
  end if;
  return jsonb_build_object('rows',answer,'game','orbit-sprint','version','orbit-v1','countryRule','sum of the top 10 distinct players best scores','period',coalesce(p_payload->>'period','week'));
 end if;
 if p_subject is null or p_subject !~ '^[0-9a-f]{64}$' then raise exception 'authentication_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('loopjolt:'||p_subject,0));
 select * into p from loopjolt.profiles where subject_hash=p_subject;
 if p.blocked then raise exception 'account_blocked';end if;
 if p_action='profile' then return case when p.id is null then 'null'::jsonb else jsonb_build_object('handle',p.handle,'country',p.country_code,'countryChangedAt',p.country_changed_at)end;end if;
 if p_action='save_profile' then
  h:=trim(p_payload->>'handle');c:=nullif(upper(p_payload->>'country'),'');
  if h is null or h !~ '^[A-Za-z0-9_]{3,20}$' or lower(h) in ('admin','administrator','moderator','loopjolt','support','official') then raise exception 'invalid_handle';end if;
  if coalesce((p_payload->>'consent')::boolean,false)=false or coalesce((p_payload->>'age16')::boolean,false)=false then raise exception 'consent_required';end if;
  if c is not null and c !~ '^[A-Z]{2}$' then raise exception 'invalid_country';end if;
  if p.id is not null and p.country_code is distinct from c and p.country_changed_at>now()-interval '30 days' then raise exception 'country_locked_30_days';end if;
  if p.id is null then insert into loopjolt.profiles(subject_hash,handle,country_code,country_changed_at)values(p_subject,h,c,case when c is null then null else now()end) returning * into p;
  else update loopjolt.profiles set handle=h,country_changed_at=case when country_code is distinct from c then now()else country_changed_at end,country_code=c where id=p.id returning * into p;end if;
  return jsonb_build_object('handle',p.handle,'country',p.country_code,'countryChangedAt',p.country_changed_at);
 end if;
 if p.id is null then raise exception 'profile_required';end if;
 if p_action='delete_profile' then
  if p_payload->>'confirmation' is distinct from 'DELETE MY LOOPJOLT ACCOUNT' then raise exception 'confirmation_required';end if;
  delete from loopjolt.profiles where id=p.id;return jsonb_build_object('deleted',true);
 end if;
 if p_action='start' then
  if not exists(select 1 from loopjolt.settings where singleton and enabled and google_client_id<>'')then raise exception 'login_not_configured';end if;
  if (select count(*) from loopjolt.runs where profile_id=p.id and created_at>now()-interval '10 minutes')>=12 then raise exception 'rate_limited';end if;
  delete from loopjolt.runs where profile_id=p.id and expires_at<now()-interval '1 day';
  insert into loopjolt.runs(profile_id,game,version,seed,country_code) values(p.id,'orbit-sprint','orbit-v1',weekseed,p.country_code) returning * into r;
  return jsonb_build_object('runId',r.id,'seed',r.seed,'version',r.version,'startedAt',r.created_at,'expiresAt',r.expires_at);
 end if;
 if p_action in ('run','finish')then
  select * into r from loopjolt.runs where id=(p_payload->>'runId')::uuid and profile_id=p.id for update;
  if r.id is null then raise exception 'run_not_found';end if;
  if p_action='run' then return to_jsonb(r)-'profile_id';end if;
  if r.consumed then select jsonb_build_object('saved',true,'score',score,'duplicate',true) into answer from loopjolt.scores where run_id=r.id;return answer;end if;
  if r.expires_at<clock_timestamp()then raise exception 'run_expired';end if;
  if extract(epoch from clock_timestamp()-r.created_at)<((p_payload->>'ticks')::integer/60.0)-2 then raise exception 'impossible_elapsed_time';end if;
  insert into loopjolt.scores(run_id,profile_id,game,version,country_code,score,ticks,orbs,max_combo,played_at)values(r.id,p.id,r.game,r.version,r.country_code,(p_payload->>'score')::integer,(p_payload->>'ticks')::integer,(p_payload->>'orbs')::integer,(p_payload->>'maxCombo')::integer,r.created_at);
  update loopjolt.runs set consumed=true where id=r.id;
  return jsonb_build_object('saved',true,'score',(p_payload->>'score')::integer);
 end if;
 raise exception 'invalid_action';
end;$fn$;
revoke all on function public.loopjolt_gateway(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.loopjolt_gateway(text,text,jsonb) to service_role;
comment on function public.loopjolt_gateway(text,text,jsonb) is 'LoopJolt isolated backend. Only service_role; Edge verifies Google credentials and replays game inputs. No grants or writes to existing commerce/auth data.';
