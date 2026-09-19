-- Arcade 3: additive activation registry, preserved accounts/Orbit records.
-- Apply only against verified LoopJolt v2 schema. No business tables/auth users are changed.
insert into loopjolt.ranked_games(game,version,title,active,display_order) values
 ('reaction-rush','rr-neon-v1','Reaction Rush · Neon Siege',false,2),
 ('perfect-timing','pt-sky-v1','Perfect Timing · Skyforge',false,3),
 ('dont-press','dp-core-v1','Don''t Press · Reactor Shift',false,4)
on conflict (game,version) do nothing;
create unique index if not exists loopjolt_one_active_version on loopjolt.ranked_games(game) where active;

-- Composite country standings must never split one player across countries in different games.
-- Game-specific history retains run-time flag; composite standings use one current profile flag.
do $patch$
declare src text; head text; tail text; boundary integer;
begin
 if to_regprocedure('public.loopjolt_gateway_v2(text,text,jsonb)') is not null then raise exception 'arcade3_migration_already_applied';end if;
 src:=pg_get_functiondef('public.loopjolt_gateway(text,text,jsonb)'::regprocedure);
 boundary:=strpos(src,'select version into v from loopjolt.ranked_games');
 if boundary=0 or strpos(src,'s.profile_id,s.game,s.score,s.country_code,s.verified_at')=0 or strpos(src,'s.profile_id,u.handle,s.game,s.country_code,s.score,s.verified_at')=0 then raise exception 'unexpected_gateway_v2_source';end if;
 head:=substr(src,1,boundary-1);tail:=substr(src,boundary);
 head:=replace(head,'s.profile_id,s.game,s.score,s.country_code,s.verified_at','s.profile_id,s.game,s.score,u.country_code,s.verified_at');
 head:=replace(head,'s.profile_id,u.handle,s.game,s.country_code,s.score,s.verified_at','s.profile_id,u.handle,s.game,u.country_code,s.score,s.verified_at');
 src:=replace(head||tail,'s.played_at>=cutoff and not u.blocked','s.played_at>=cutoff and s.score>0 and not u.blocked');
 execute src;
end;$patch$;
alter function public.loopjolt_gateway(text,text,jsonb) rename to loopjolt_gateway_v2;
revoke all on function public.loopjolt_gateway_v2(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_gateway_v2(text,text,jsonb) to service_role;

create function public.loopjolt_gateway(p_action text,p_subject text default null,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare p loopjolt.profiles%rowtype;r loopjolt.runs%rowtype;g text;v text;expected text;seed bigint;
begin
 if p_action<>'start' or coalesce(p_payload->>'game','orbit-sprint')='orbit-sprint' then
  return public.loopjolt_gateway_v2(p_action,p_subject,p_payload);
 end if;
 if p_subject is null or p_subject !~ '^[0-9a-f]{64}$' then raise exception 'authentication_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('loopjolt:'||p_subject,0));
 select * into p from loopjolt.profiles where subject_hash=p_subject;
 if p.id is null then raise exception 'profile_required';end if;
 if p.blocked then raise exception 'account_blocked';end if;
 if not exists(select 1 from loopjolt.settings where singleton and enabled and google_client_id<>'')then raise exception 'login_not_configured';end if;
 g:=p_payload->>'game';expected:=case g when 'reaction-rush' then 'rr-neon-v1' when 'perfect-timing' then 'pt-sky-v1' when 'dont-press' then 'dp-core-v1' end;
 if expected is null then raise exception 'invalid_game';end if;
 select version into v from loopjolt.ranked_games where game=g and active;
 if v is distinct from expected then raise exception 'game_validator_unavailable';end if;
 if(select count(*) from loopjolt.runs where profile_id=p.id and created_at>now()-interval '10 minutes')>=12 then raise exception 'rate_limited';end if;
 delete from loopjolt.runs where profile_id=p.id and expires_at<now()-interval '1 day';
 seed:=((date_trunc('week',now() at time zone 'UTC')::date-date '2020-01-01')+123456)::bigint;
 insert into loopjolt.runs(profile_id,game,version,seed,country_code) values(p.id,g,v,seed,p.country_code) returning * into r;
 return jsonb_build_object('runId',r.id,'game',r.game,'seed',r.seed,'version',r.version,'startedAt',r.created_at,'expiresAt',r.expires_at);
end;$fn$;
revoke all on function public.loopjolt_gateway(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_gateway(text,text,jsonb) to service_role;
comment on function public.loopjolt_gateway(text,text,jsonb) is 'Arcade 3 gateway. Writes are behind custom Google JWT validation and canonical per-game server replay. Private app schema only.';
