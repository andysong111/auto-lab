-- Additive, isolated Play ID authentication; does not touch Supabase Auth or existing profiles.
alter table loopjolt.settings add column if not exists play_id_enabled boolean not null default false;
create table loopjolt.play_credentials (
 login text primary key check(login ~ '^[a-z0-9_]{4,16}$'),
 profile_id uuid not null unique references loopjolt.profiles(id) on delete cascade,
 salt text not null check(salt ~ '^[a-f0-9]{32}$'),
 password_hash text not null check(password_hash ~ '^[a-f0-9]{64}$'),
 algorithm text not null default 'pbkdf2-sha256-600000' check(algorithm='pbkdf2-sha256-600000'),
 recovery_hash text not null check(recovery_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table loopjolt.play_sessions (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 profile_id uuid not null references loopjolt.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '7 days'
);
create index play_sessions_profile_idx on loopjolt.play_sessions(profile_id);
create index play_sessions_expiry_idx on loopjolt.play_sessions(expires_at);
create table loopjolt.play_rate (
 bucket text not null, window_at timestamptz not null, attempts integer not null default 1,
 primary key(bucket,window_at)
);
alter table loopjolt.play_credentials enable row level security;
alter table loopjolt.play_sessions enable row level security;
alter table loopjolt.play_rate enable row level security;
revoke all on loopjolt.play_credentials,loopjolt.play_sessions,loopjolt.play_rate from public,anon,authenticated;

create function public.loopjolt_play_auth(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 c loopjolt.play_credentials%rowtype; p loopjolt.profiles%rowtype;
 l text:=p_payload->>'login'; sh text:=p_payload->>'sessionHash';
 j jsonb; n integer; m integer; w timestamptz; exp timestamptz; k text;
begin
 if p_action='config' then
  return jsonb_build_object('enabled',coalesce((select enabled and play_id_enabled from loopjolt.settings where singleton),false));
 end if;
 if p_action='logout' then
  delete from loopjolt.play_sessions where token_hash=sh;return jsonb_build_object('loggedOut',true);
 end if;
 if not exists(select 1 from loopjolt.settings where singleton and enabled and play_id_enabled) then raise exception 'play_id_unavailable';end if;
 if p_action='session' then
  select u.* into p from loopjolt.play_sessions s join loopjolt.profiles u on u.id=s.profile_id
  where s.token_hash=sh and s.expires_at>now() and not u.blocked;
  return jsonb_build_object('subject',p.subject_hash);
 end if;
 if p_action='rate' then
  if coalesce(p_payload->>'accountKey','') !~ '^[a-f0-9]{64}$' or coalesce(p_payload->>'ipKey','') !~ '^[a-f0-9]{64}$' then raise exception 'invalid_rate_key';end if;
  w:=date_bin(interval '15 minutes',now(),timestamptz '2020-01-01');
  -- Return denial, do not raise: counters must commit even for denied requests.
  insert into loopjolt.play_rate(bucket,window_at) values('a:'||(p_payload->>'accountKey'),w)
  on conflict(bucket,window_at) do update set attempts=loopjolt.play_rate.attempts+1 returning attempts into n;
  insert into loopjolt.play_rate(bucket,window_at) values('i:'||(p_payload->>'ipKey'),w)
  on conflict(bucket,window_at) do update set attempts=loopjolt.play_rate.attempts+1 returning attempts into m;
  delete from loopjolt.play_rate where window_at<now()-interval '1 day';
  return jsonb_build_object('allowed',n<=10 and m<=60);
 end if;
 if l is null or l !~ '^[a-z0-9_]{4,16}$' or l in ('admin','administrator','moderator','loopjolt','support','official') then raise exception 'invalid_play_id';end if;
 if p_action='lookup' then
  select * into c from loopjolt.play_credentials where login=l;
  if c.login is null then return jsonb_build_object('collision',exists(select 1 from loopjolt.profiles where lower(handle)=l));end if;
  select * into p from loopjolt.profiles where id=c.profile_id;
  return jsonb_build_object('hash',c.password_hash,'salt',c.salt,'subject',p.subject_hash,'blocked',p.blocked);
 end if;
 if p_action not in ('enter','recover') then raise exception 'invalid_action';end if;
 if coalesce(p_payload->>'salt','') !~ '^[a-f0-9]{32}$' or coalesce(p_payload->>'hash','') !~ '^[a-f0-9]{64}$'
   or coalesce(sh,'') !~ '^[a-f0-9]{64}$' then raise exception 'invalid_auth_payload';end if;
 perform pg_advisory_xact_lock(hashtextextended('loopjolt-play:'||l,0));
 select * into c from loopjolt.play_credentials where login=l for update;
 if p_action='recover' then
  if c.login is null or c.recovery_hash is distinct from p_payload->>'recoveryHash' or coalesce(p_payload->>'nextRecoveryHash','') !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error','invalid_credentials');end if;
  select * into p from loopjolt.profiles where id=c.profile_id for update;
  if p.blocked then return jsonb_build_object('error','invalid_credentials');end if;
  update loopjolt.play_credentials set salt=p_payload->>'salt',password_hash=p_payload->>'hash',recovery_hash=p_payload->>'nextRecoveryHash',updated_at=now() where login=l;
  delete from loopjolt.play_sessions where profile_id=p.id;
 elsif c.login is not null then
  if c.password_hash is distinct from p_payload->>'expectedHash' or c.password_hash is distinct from p_payload->>'hash' then return jsonb_build_object('error','invalid_credentials');end if;
  select * into p from loopjolt.profiles where id=c.profile_id for update;
  if p.blocked then return jsonb_build_object('error','invalid_credentials');end if;
  -- Existing login never changes country or public ID.
 else
  if p_payload->>'expectedHash' is not null or exists(select 1 from loopjolt.profiles where lower(handle)=l) then return jsonb_build_object('error','invalid_credentials');end if;
  if coalesce(p_payload->>'subject','') !~ '^[a-f0-9]{64}$' or coalesce(p_payload->>'recoveryHash','') !~ '^[a-f0-9]{64}$'
    or coalesce(p_payload->>'country','') !~ '^[A-Z]{2}$' then raise exception 'invalid_auth_payload';end if;
  if not coalesce((p_payload->>'consent')::boolean,false) or not coalesce((p_payload->>'age16')::boolean,false) then raise exception 'consent_required';end if;
  if coalesce(p_payload->>'ipKey','') !~ '^[a-f0-9]{64}$' then raise exception 'invalid_rate_key';end if;
  perform pg_advisory_xact_lock(hashtextextended('loopjolt-play-create',0));
  w:=date_trunc('hour',now());k:='c:'||(p_payload->>'ipKey');
  insert into loopjolt.play_rate(bucket,window_at) values(k,w) on conflict(bucket,window_at) do update set attempts=loopjolt.play_rate.attempts+1 returning attempts into n;
  if n>5 or (select count(*) from loopjolt.play_credentials where created_at>now()-interval '1 hour')>=100 then return jsonb_build_object('error','rate_limited');end if;
  begin
   j:=public.loopjolt_gateway('save_profile',p_payload->>'subject',jsonb_build_object('handle',l,'country',p_payload->>'country','consent',true,'age16',true));
   select * into p from loopjolt.profiles where subject_hash=p_payload->>'subject';
   insert into loopjolt.play_credentials(login,profile_id,salt,password_hash,recovery_hash) values(l,p.id,p_payload->>'salt',p_payload->>'hash',p_payload->>'recoveryHash');
  exception when unique_violation then return jsonb_build_object('error','invalid_credentials');end;
 end if;
 delete from loopjolt.play_sessions where expires_at<=now();
 delete from loopjolt.play_sessions where token_hash in (select token_hash from loopjolt.play_sessions where profile_id=p.id order by created_at desc,token_hash offset 4);
 insert into loopjolt.play_sessions(token_hash,profile_id) values(sh,p.id) returning expires_at into exp;
 return jsonb_build_object('profile',jsonb_build_object('handle',p.handle,'country',p.country_code,'countryChangedAt',p.country_changed_at),'expiresAt',exp);
end;$$;
revoke all on function public.loopjolt_play_auth(text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_play_auth(text,jsonb) to service_role;
-- Keep every existing replay guard; only remove the Google-client-id dependency of start.
do $$declare f regprocedure;src text;begin
 foreach f in array array['public.loopjolt_gateway(text,text,jsonb)'::regprocedure,'public.loopjolt_gateway_v2(text,text,jsonb)'::regprocedure,'public.loopjolt_gateway_v3(text,text,jsonb)'::regprocedure] loop
  src:=pg_get_functiondef(f);
  if position($needle$and google_client_id<>''$needle$ in src)=0 then raise exception 'unexpected_gateway_definition';end if;
  src:=replace(src,$needle$and google_client_id<>''$needle$,'');execute src;
 end loop;
end;$$;
