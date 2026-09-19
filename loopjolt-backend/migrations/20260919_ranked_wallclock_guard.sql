-- Follow-up to PR #10 P1 review: canonical time cannot be stretched indefinitely.
-- SQL guard applies to all ranked games. Ten seconds tolerance covers normal start/submit transport.
-- Existing accepted scores are not changed; duplicate completion stays idempotent.
do $patch$
declare src text;
begin
 src:=pg_get_functiondef('public.loopjolt_gateway(text,text,jsonb)'::regprocedure);
 if strpos(src,'excessive_elapsed_time')>0 then raise exception 'wallclock_guard_already_applied';end if;
 if strpos(src,'expected text;seed bigint;')=0 or strpos(src,E'begin\n if p_action<>''start''')=0 then raise exception 'unexpected_gateway_source';end if;
 src:=replace(src,'expected text;seed bigint;','expected text;seed bigint;j jsonb;');
 src:=replace(src,E'begin\n if p_action<>''start''',E'begin\n if p_action=''finish'' then\n  j:=public.loopjolt_gateway_v2(''run'',p_subject,p_payload);\n  if not coalesce((j->>''consumed'')::boolean,false) and extract(epoch from clock_timestamp()-(j->>''created_at'')::timestamptz) > ((p_payload->>''ticks'')::integer/60.0)+10 then raise exception ''excessive_elapsed_time'';end if;\n end if;\n if p_action<>''start''');
 execute src;
end;$patch$;
revoke all on function public.loopjolt_gateway(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.loopjolt_gateway(text,text,jsonb) to service_role;
