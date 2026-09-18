# LoopJolt deployment

## Production

- Project: `vibe-arcade`
- Root directory: `vibe-arcade`
- Production URL: https://vibe-arcade-dun.vercel.app
- Environment variables: none required for MVP
- Vercel Authentication: off for production

## Verified on 2026-09-17

- `/` -> 200
- `/games/dont-press/` -> 200
- `/games/perfect-timing/` -> 200
- `/games/reaction-rush/` -> 200
- `/api/event` receives first-party analytics events and returns 204
- Verified event classes: `page_view`, `game_open`, `game_start`, `game_finish`, `replay`, `next_game`

## Current rule

Do not add creator accounts, payments, revenue share, or a large game catalog until real traffic and engagement satisfy `GOALS.md` validation gates.