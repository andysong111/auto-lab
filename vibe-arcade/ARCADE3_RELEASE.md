# Arcade 3 — 2026-09-19 release scope

## User request
Upgrade Reaction Rush, Perfect Timing, and redesign Don't Press; server-validated individual/country rankings; automatic cross-game Championship inclusion; stronger original graphics/characters/mechanics and usable honest short-form footage.

## Original ranked editions
- `reaction-rush` / `rr-neon-v1`: Neon Siege — four sectors, moving scouts, armored drones, red mines, cooling batteries, heat management, charged pulse and a timed Aegis boss shield. Co-pilot PIX. 60 seconds.
- `perfect-timing` / `pt-sky-v1`: Skyforge — 24-floor precision tower, overhang loss, perfect streaks, width repair, three shields and accelerating movement. Builder AXIS. 60 seconds maximum.
- `dont-press` / `dp-core-v1`: Reactor Shift — charge/single-tap/double-tap/wait cycles, shrinking safe windows, integrity and clean-cycle multipliers. Mechanical character CORE. 60 seconds.

New routes: `/arcade3/` and `/arcade3/play?game=<slug>`. The old `/games/<slug>/` pages remain unchanged, because already scheduled videos demonstrate those original editions. Do not relabel the old videos as footage of Arcade 3.

## Benchmark research
Viewed official/publisher sources on 2026-09-19:
- Halfbrick, Fruit Ninja: https://www.halfbrick.com/games/fruit-ninja-classic and https://halfbrick.helpshift.com/hc/en/38-super-fruit-ninja/faq/1047-what-are-the-game-modes/ — borrow target-versus-hazard discrimination, short rounds and power-up choices. No sliced-fruit art or characters copied.
- Ketchapp, Stack: https://www.ketchappgames.com/game-stack — borrow visible precision/stacking tension and rapid retries; new tower rules, art and character are original.
- Ninjadoodle publisher page, One Button Bob: https://www.kongregate.com/en/games/ninjadoodle/one-button-bob — borrow one-button input with changing contextual rules, not level layouts/art/source.
These establish mechanics to study, not proof that LoopJolt will gain traffic, retain players or earn revenue. Do not claim global popularity numbers that were not measured.

## Integrity
- One canonical deterministic 60 Hz rules file is used in the browser and replay adapter on the server.
- Authentication, run owner, game, version, seed and country come from verified Google JWT / server records, never client claims.
- Inputs are ordered, bounded, type-checked and replayed to a terminal state. Server ignores claimed points/country/game.
- The existing elapsed-time guard, idempotent run storage and 12 starts / 10-minute per-player limit remain.
- New request body is capped while streaming at 64 KiB.
- A replay validator does not prove a human played. Automation, optimal scripts and multi-accounts remain risks. No cash prizes or paid advantages.
- Positive scores only on boards. Local bests are not imported into official ranking.
- Existing Orbit Sprint version and user scores are untouched.

## Composite countries
All-game standings must assign each person to exactly one country: their current self-selected profile flag. Game-specific records retain the flag saved at run start. The previous split-country grouping is corrected. Repeated runs do not add Championship points. One active version per game is enforced.

## Rollout gates
1. Canonical rules unit tests and UI checks.
2. SQL migration creates the three games inactive.
3. Deploy server with all four validators.
4. Pass CI and publish frontend.
5. Activate the three versions, check live config/boards/guest routes and unauthorized-write rejection.
6. Real Google authenticated completion of each new game remains distinct from mocked tests. Never claim actual-user completion merely because the mock passed.

## Costs and autonomy
No new paid account/project, ad campaign or AI generation is created. Existing infrastructure usage is not guaranteed free. No background operator is created; deployed code and already scheduled Metricool posts can run independently.
