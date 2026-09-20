-- Follow-up to PR18 review. No scores/profiles are modified and no version is activated.
create or replace function public.loopjolt_gateway(p_action text,p_subject text default null,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare p loopjolt.profiles%rowtype;r loopjolt.runs%rowtype;g text;v text;expected text;seed bigint;j jsonb;
begin
 -- Explicit at the outer entrypoint: protect ALL games even if wrappers change later.
 if p_action='finish' then
  if p_payload->>'ticks' is null or (p_payload->>'ticks') !~ '^[0-9]{1,4}$'
     or (p_payload->>'ticks')::integer not between 1 and 5400 then
   raise exception 'invalid_duration';
  end if;
  j:=public.loopjolt_gateway_v3('run',p_subject,p_payload);
  if not coalesce((j->>'consumed')::boolean,false)
     and extract(epoch from clock_timestamp()-(j->>'created_at')::timestamptz)
       > ((p_payload->>'ticks')::integer/60.0)+10 then
   raise exception 'excessive_elapsed_time';
  end if;
 end if;
 g:=coalesce(p_payload->>'game','orbit-sprint');
 if p_action<>'start' or g not in ('gyro-drop','core-pins','nova-merge') then
  return public.loopjolt_gateway_v3(p_action,p_subject,p_payload);
 end if;
 if p_subject is null or p_subject !~ '^[0-9a-f]{64}$' then raise exception 'authentication_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('loopjolt:'||p_subject,0));
 select * into p from loopjolt.profiles where subject_hash=p_subject;
 if p.id is null then raise exception 'profile_required';end if;
 if p.blocked then raise exception 'account_blocked';end if;
 if not exists(select 1 from loopjolt.settings where singleton and enabled and google_client_id<>'') then raise exception 'login_not_configured';end if;
 select version into v from loopjolt.ranked_games where game=g and active;
 if g='gyro-drop' then
  if v is null or v not in ('gd-phaser-v1','gd-descent-v2') then raise exception 'game_validator_unavailable';end if;
  if p_payload ? 'version' and p_payload->>'version' is distinct from v then raise exception 'version_mismatch';end if;
 else
  expected:=case g when 'core-pins' then 'cp-phaser-v1' when 'nova-merge' then 'nm-phaser-v1' end;
  if v is distinct from expected then raise exception 'game_validator_unavailable';end if;
 end if;
 if(select count(*) from loopjolt.runs where profile_id=p.id and created_at>now()-interval '10 minutes')>=12 then raise exception 'rate_limited';end if;
 delete from loopjolt.runs where profile_id=p.id and expires_at<now()-interval '1 day';
 seed:=((date_trunc('week',now() at time zone 'UTC')::date-date '2020-01-01')+123456)::bigint;
 insert into loopjolt.runs(profile_id,game,version,seed,country_code) values(p.id,g,v,seed,p.country_code) returning * into r;
 return jsonb_build_object('runId',r.id,'game',r.game,'seed',r.seed,'version',r.version,'startedAt',r.created_at,'expiresAt',r.expires_at);
end;$fn$;
revoke all on function public.loopjolt_gateway(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_gateway(text,text,jsonb) to service_role;
comment on function public.loopjolt_gateway(text,text,jsonb) is 'LoopJolt challenger gateway. New scores require Google identity plus canonical server replay.';
