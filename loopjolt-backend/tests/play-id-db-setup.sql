-- ONLY for an empty disposable CI database. Never execute against Supabase production.
create role anon;create role authenticated;create role service_role;
\i loopjolt-backend/migrations/20260919_ranked_beta.sql
-- Profile/save/delete contract is the original production migration. Clones supply
-- wrapper signatures; this fixture does not assert live multi-game gateway parity.
do $$declare src text;begin
 src:=pg_get_functiondef('public.loopjolt_gateway(text,text,jsonb)'::regprocedure);
 execute replace(src,'FUNCTION public.loopjolt_gateway(','FUNCTION public.loopjolt_gateway_v2(');
 execute replace(src,'FUNCTION public.loopjolt_gateway(','FUNCTION public.loopjolt_gateway_v3(');
end;$$;
\i loopjolt-backend/migrations/20260920_play_id.sql
