-- Integration only. Every synthetic profile/run/score and activation is rolled back.
-- SQL acceptance checks do NOT replace a real Google OIDC browser E2E.
do $qa$
declare subject text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
 who uuid;item record;answer jsonb;runid uuid;payload jsonb;rejected boolean;n integer:=0;
begin
 begin
  if has_function_privilege('anon','public.loopjolt_gateway(text,text,jsonb)','execute')
     or has_function_privilege('authenticated','public.loopjolt_gateway(text,text,jsonb)','execute') then
   raise exception 'Client must not have RPC write privilege';
  end if;
  perform public.loopjolt_gateway('save_profile',subject,jsonb_build_object('handle','QA_'||substr(subject,1,12),'country','KR','consent',true,'age16',true));
  select id into who from loopjolt.profiles where subject_hash=subject;
  for item in select game,version from loopjolt.ranked_games order by game,version loop
   if item.game='gyro-drop' then
    update loopjolt.ranked_games set active=false where game='gyro-drop';
    update loopjolt.ranked_games set active=true where game=item.game and version=item.version;
   end if;
   answer:=public.loopjolt_gateway('start',subject,jsonb_build_object('game',item.game,'version',item.version));
   if answer->>'version' is distinct from item.version then raise exception 'start version mismatch';end if;
   runid:=(answer->>'runId')::uuid;
   payload:=jsonb_build_object('runId',runid,'score',123,'ticks',600,'orbs',1,'maxCombo',1);
   -- Same account cannot create a completion with too little wall time.
   rejected:=false;
   begin perform public.loopjolt_gateway('finish',subject,payload);
   exception when others then if sqlerrm='impossible_elapsed_time' then rejected:=true;else raise;end if;end;
   if not rejected then raise exception 'minimum duration bypass for %',item.version;end if;
   -- Must reject stretched runs for every game, not just the new flagship.
   update loopjolt.runs set created_at=clock_timestamp()-interval '35 seconds' where id=runid;
   rejected:=false;
   begin perform public.loopjolt_gateway('finish',subject,payload);
   exception when others then if sqlerrm='excessive_elapsed_time' then rejected:=true;else raise;end if;end;
   if not rejected then raise exception 'maximum duration bypass for %',item.version;end if;
   update loopjolt.runs set created_at=clock_timestamp()-interval '12 seconds' where id=runid;
   answer:=public.loopjolt_gateway('finish',subject,payload);
   if not (answer->>'saved')::boolean then raise exception 'valid completion rejected';end if;
   -- A slow retry of a consumed run is idempotent, not a second score.
   update loopjolt.runs set created_at=clock_timestamp()-interval '10 minutes' where id=runid;
   answer:=public.loopjolt_gateway('finish',subject,payload);
   if not coalesce((answer->>'duplicate')::boolean,false) then raise exception 'duplicate save failed';end if;
   if (select count(*) from loopjolt.scores where run_id=runid)<>1 then raise exception 'duplicate row';end if;
   n:=n+1;
  end loop;
  if n<>8 then raise exception 'expected all 8 game/version pairs, got %',n;end if;
  -- A body claiming the wrong version must not start a current-v2 run.
  update loopjolt.ranked_games set active=false where game='gyro-drop';
  update loopjolt.ranked_games set active=true where game='gyro-drop' and version='gd-descent-v2';
  rejected:=false;
  begin perform public.loopjolt_gateway('start',subject,'{"game":"gyro-drop","version":"gd-phaser-v1"}');
  exception when others then if sqlerrm='version_mismatch' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'old version incorrectly started new run';end if;
  answer:=public.loopjolt_gateway('board',null,'{"game":"gyro-drop","scope":"world","period":"week"}');
  if answer->>'version'<>'gd-descent-v2' then raise exception 'board version mismatch';end if;
  if jsonb_array_length(answer->'rows')<>1 then raise exception 'expected synthetic new-version player';end if;
  answer:=public.loopjolt_gateway('board',null,'{"game":"gyro-drop","scope":"nations","period":"week"}');
  if answer#>>'{rows,0,country_code}'<>'KR' then raise exception 'country board mismatch';end if;
  raise exception using errcode='ZL001',message='PASS_ROLLBACK';
 exception when sqlstate 'ZL001' then null;
 end;
end;$qa$;
select jsonb_build_object('verification','PASS: eight version pairs, elapsed bounds, duplicate retries, version gate, country/player boards, private RPC; all QA writes rolled back',
 'profiles',(select count(*) from loopjolt.profiles),'scores',(select count(*) from loopjolt.scores),
 'gyroVersions',(select jsonb_agg(jsonb_build_object('version',version,'active',active)) from loopjolt.ranked_games where game='gyro-drop')) as result;
