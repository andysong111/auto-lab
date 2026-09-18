# LoopJolt

Guest-first browser arcade. The 2026-09-19 optional account/ranking scope is documented in `UPGRADE_2026_09_19.md`; backend setup and remaining Google activation step are in `../loopjolt-backend/README.md`.

## Public games
- Orbit Sprint — deeper 90-second space runner, server-validated competition prepared.
- Don't Press
- Perfect Timing
- Reaction Rush

## Accounts and rankings
`/community/`: optional Google sign-in, player ID and self-selected country, world/country boards. Login remains disabled until an owner-configured Google Client ID is in place. Guest play always works.

## Local run
From `vibe-arcade/`: `python -m http.server 3000`.
The static games work locally. `/api/event` is a Vercel endpoint. The production community edge allows only the production browser origin; use mocked API responses for local browser tests.

## Tests
`node --test vibe-arcade/tests/orbit-core.test.cjs`
Browser smoke: install pinned Playwright and run `node vibe-arcade/tests/browser-smoke.cjs`.

## Deployment
Vercel root stays `vibe-arcade`; no new Vercel environment variables required. Existing profile redirect links and scheduled media are untouched.

## Telemetry
Existing `[VIBE_EVENT]` events remain. Orbit Sprint sends `game_start` on every attempt and `game_finish` on each terminal result, with `props.version=orbit-v1`. Do not mix these denominators with legacy games that used a separate replay event instead of another game_start.

Read `GOALS.md`, `MASTER_PLAN.md`, and the newer scope update before adding features.
