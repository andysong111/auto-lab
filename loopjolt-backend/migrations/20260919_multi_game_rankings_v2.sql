-- Applied as Supabase migration loopjolt_multi_game_rankings_v2 on 2026-09-19.
-- Adds a registry for server-validated ranked games and multi-game championship boards.
create table if not exists loopjolt.ranked_games (
  game text not null,
  version text not null,
  title text not null,
  active boolean not null default true,
  display_order integer not null default 100,
  primary key(game,version)
);
alter table loopjolt.ranked_games enable row level security;
revoke all on loopjolt.ranked_games from public, anon, authenticated;
insert into loopjolt.ranked_games(game,version,title,active,display_order)
values('orbit-sprint','orbit-v1','Orbit Sprint',true,1)
on conflict(game,version) do update set title=excluded.title,active=excluded.active,display_order=excluded.display_order;

alter table loopjolt.runs drop constraint if exists runs_game_check;
alter table loopjolt.runs drop constraint if exists runs_version_check;
alter table loopjolt.runs drop constraint if exists runs_ranked_game_fkey;
alter table loopjolt.runs add constraint runs_ranked_game_fkey foreign key(game,version) references loopjolt.ranked_games(game,version);
alter table loopjolt.scores drop constraint if exists scores_ranked_game_fkey;
alter table loopjolt.scores add constraint scores_ranked_game_fkey foreign key(game,version) references loopjolt.ranked_games(game,version);

-- public.loopjolt_gateway was replaced in the applied migration.
-- Its board action now supports p_payload.game = a ranked game slug or 'all'.
-- Game boards: one best raw score per player; country board = top 10 distinct players raw scores.
-- Overall player board: per-game placement points (1st 1000, 2nd 990 ... 100th 10), summed across ranked games.
-- Overall country board: top 10 distinct players' overall championship points.
-- The full function definition is maintained in the live migration history and Edge/API contract tests.