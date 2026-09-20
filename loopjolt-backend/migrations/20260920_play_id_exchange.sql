-- One-use, two-minute exchange tickets keep session tokens out of browser JavaScript
-- without pooling credential rate limits behind the site's cookie bridge.
create table loopjolt.play_exchanges (
 ticket_hash text primary key check(ticket_hash ~ '^[a-f0-9]{64}$'),
 profile_id uuid not null references loopjolt.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '2 minutes',
 session_expires_at timestamptz not null
);
create index play_exchanges_profile_idx on loopjolt.play_exchanges(profile_id);
create index play_exchanges_expiry_idx on loopjolt.play_exchanges(expires_at);
alter table loopjolt.play_exchanges enable row level security;
revoke all on loopjolt.play_exchanges from public,anon,authenticated;
create function public.loopjolt_play_exchange(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t loopjolt.play_exchanges%rowtype;s loopjolt.play_sessions%rowtype;p loopjolt.profiles%rowtype;
 th text:=p_payload->>'ticketHash';sh text:=p_payload->>'sessionHash';
begin
 if not exists(select 1 from loopjolt.settings where singleton and enabled and play_id_enabled) then raise exception 'play_id_unavailable';end if;
 if coalesce(th,'') !~ '^[a-f0-9]{64}$' or coalesce(sh,'') !~ '^[a-f0-9]{64}$' then raise exception 'invalid_auth_payload';end if;
 delete from loopjolt.play_exchanges where expires_at<=now();
 if p_action='exchange_stage' then
  select * into s from loopjolt.play_sessions where token_hash=sh and expires_at>now();
  if s.profile_id is null then return jsonb_build_object('error','invalid_or_expired_login');end if;
  select * into p from loopjolt.profiles where id=s.profile_id and not blocked for update;
  if p.id is null then return jsonb_build_object('error','invalid_or_expired_login');end if;
  delete from loopjolt.play_sessions where token_hash=sh and expires_at>now() returning * into s;
  if s.profile_id is null then return jsonb_build_object('error','invalid_or_expired_login');end if;
  delete from loopjolt.play_exchanges where ticket_hash in(select ticket_hash from loopjolt.play_exchanges where profile_id=p.id order by created_at desc,ticket_hash offset 2);
  insert into loopjolt.play_exchanges(ticket_hash,profile_id,session_expires_at) values(th,p.id,s.expires_at);
  return jsonb_build_object('staged',true);
 elsif p_action='exchange_redeem' then
  select * into t from loopjolt.play_exchanges where ticket_hash=th and expires_at>now();
  if t.profile_id is null or t.session_expires_at<=now() then return jsonb_build_object('error','invalid_or_expired_login');end if;
  select * into p from loopjolt.profiles where id=t.profile_id and not blocked for update;
  if p.id is null then return jsonb_build_object('error','invalid_or_expired_login');end if;
  delete from loopjolt.play_exchanges where ticket_hash=th and expires_at>now() returning * into t;
  if t.profile_id is null then return jsonb_build_object('error','invalid_or_expired_login');end if;
  delete from loopjolt.play_sessions where expires_at<=now();
  delete from loopjolt.play_sessions where token_hash in(select token_hash from loopjolt.play_sessions where profile_id=p.id order by created_at desc,token_hash offset 4);
  insert into loopjolt.play_sessions(token_hash,profile_id,expires_at) values(sh,p.id,t.session_expires_at);
  return jsonb_build_object('profile',jsonb_build_object('handle',p.handle,'country',p.country_code,'countryChangedAt',p.country_changed_at),'expiresAt',t.session_expires_at);
 end if;
 raise exception 'invalid_action';
end;$$;
revoke all on function public.loopjolt_play_exchange(text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_play_exchange(text,jsonb) to service_role;
-- A password reset must invalidate unused login exchanges, too.
create function loopjolt.revoke_play_exchanges() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.password_hash is distinct from old.password_hash or new.recovery_hash is distinct from old.recovery_hash then
  delete from loopjolt.play_exchanges where profile_id=new.profile_id;
 end if;return new;
end;$$;
revoke all on function loopjolt.revoke_play_exchanges() from public,anon,authenticated;
create trigger play_credentials_revoke_exchanges after update on loopjolt.play_credentials for each row execute function loopjolt.revoke_play_exchanges();
