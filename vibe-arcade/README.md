# Vibe Arcade MVP

A zero-login, mobile-first browser arcade for validating whether small AI-built games can earn organic/low-cost play traffic.

## Current scope
- Landing page with 3 games
- Instant browser play
- First-party event tracking to `/api/event`
- UTM/referrer/session metadata
- No database: events are emitted to Vercel runtime logs for the validation phase
- SEO basics, sitemap, robots

## Games
- Don't Press
- Perfect Timing
- Reaction Rush

## Local run
From `vibe-arcade/`:

```bash
python -m http.server 3000
```

The static games run locally. `/api/event` is a Vercel serverless endpoint and will not be available under the Python server; analytics fails silently by design.

## Vercel
Set the project Root Directory to `vibe-arcade`. No environment variables are required for the MVP.

## Measurement
Events are JSON logged with prefix `[VIBE_EVENT]`. Core events:
- page_view
- game_open
- game_start
- game_finish
- replay
- share
- next_game

Use runtime logs to count events and calculate early funnel metrics.

Read `GOALS.md` before adding scope.
