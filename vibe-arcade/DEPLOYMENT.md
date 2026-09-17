# Vibe Arcade — one-time Vercel connection

The code is already on `main`. This is the only manual infrastructure step currently blocking public testing.

## Vercel import
1. Vercel → Add New → Project.
2. Import GitHub repository `andysong111/auto-lab`.
3. Project Name: `vibe-arcade` (or the closest available name).
4. Root Directory: `vibe-arcade`.
5. Framework Preset: `Other` / auto-detected static project.
6. Do not add environment variables.
7. Deploy.

## Expected routes
- `/`
- `/games/dont-press/`
- `/games/perfect-timing/`
- `/games/reaction-rush/`
- `/api/event` (POST only)

## Post-deploy verification
- Open all four public pages on desktop and mobile.
- Start and finish each game once.
- Search Vercel runtime logs for `[VIBE_EVENT]`.
- Confirm `page_view`, `game_open`, `game_start`, and `game_finish` events arrive.
- Replace provisional sitemap hostname if Vercel assigns a different production hostname.

## No additional setup yet
Do not connect Supabase, payments, creator accounts, ad networks, or a paid domain before the first traffic/engagement test justifies them.
