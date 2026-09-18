# LoopJolt ranked beta backend

## State, 2026-09-19
- Supabase project: `qmtmyqytzkdtglfcegef` (existing project reused; no new paid project).
- New private schema: `loopjolt` only. Existing commerce tables, auth.users, policies, users and auth-provider settings are not changed.
- Edge function: `loopjolt-community`.
- Google sign-in is implemented but deliberately DISABLED until a dedicated client ID and production origin have been configured and an end-to-end account test passes.
- No fake players or seed scores in production. SQL tests are rolled back.

## Google setup (one owner action)
1. In Google Cloud / Google Auth Platform, select or create the project to own LoopJolt's consent branding.
2. Configure the consent screen (LoopJolt, support contact, public homepage/privacy details). Use basic sign-in only; do not request Gmail, Drive or other business scopes.
3. Create an OAuth client of type Web application. Authorized JavaScript origin: `https://vibe-arcade-dun.vercel.app` (no path, no trailing slash).
4. The frontend uses Google's JavaScript popup callback, so no redirect URI is required for this flow.
5. Send/configure only the public Client ID ending in `.apps.googleusercontent.com`. A Client Secret is NOT used by this implementation; do not put a secret in GitHub or browser code.
6. Admin updates `loopjolt.settings.google_client_id` and `enabled=true`. Verify Google login, consent, profile save, one genuine completed run, leaderboard appearance and logout. Do not claim complete login coverage until this passes.

## Authentication and isolation
- GIS ID tokens are independently checked using Google's JWKS, RS256, expected audience, issuer and expiration. Only the verified `sub` is hashed for the app identity.
- `verify_jwt=false` is necessary because these are Google tokens rather than Supabase tokens. Every write still performs custom Google token verification.
- Browser requests never contain the Supabase service key. The edge function uses its injected server environment only to call a narrowly-scoped RPC.
- `public.loopjolt_gateway` is executable ONLY by service_role, not anon/authenticated/PUBLIC. All four private tables have RLS enabled and no client grants.
- No game user is added to a business project's auth.users. No personal email/name/photo is copied to leaderboards.
- Countries are self-selected, optional, and shown as flag + code (code remains readable on devices without flag glyphs).

## Ranked rules
- Orbit Sprint only in v1. Legacy games remain practice/local-PB until their server rule validators exist.
- 90 seconds maximum, same weekly seed. Week resets Monday 00:00 UTC.
- The shared canonical rules source is `vibe-arcade/games/orbit-sprint/core.js`.
- Server creates a per-player run ID with seed/version/country snapshot and 15-minute expiry.
- Server replays ordered inputs, rejects unfinished/invalid games, ignores claimed score/country/identity, checks elapsed time and stores each run once.
- 12 starts per player per 10 minutes; profile country changes locked for 30 days.
- World/country player boards count one best score per person; country standings sum the top 10 distinct players' best scores, with contributor counts. Small-country disadvantage is disclosed.
- This mitigates direct score forgery and duplicate submissions. It is not a guarantee against bots, replay automation, multi-accounting or all client tampering. No cash rewards.

## Deployment
Deploy the edge source and the canonical core together. In a repository-aware deployment, entrypoint is `loopjolt-backend/edge/index.ts`; include `vibe-arcade/games/orbit-sprint/core.js` as its relative dependency. The initially deployed multipart bundle names them `index.ts` and `core.js` with the import adjusted correspondingly.
Never deploy rule changes under the same score version without invalidating old runs/boards.

## Verified so far
- 11 deterministic game-rule tests pass locally.
- Desktop 1366x1000 and mobile 390x844 browser smoke pass with mocked account API; zero JavaScript runtime errors.
- SQL transactional tests: profile creation, 30-day country lock, duplicate finish idempotency, distinct-player boards, country aggregation, elapsed-time rejection, account deletion. All test data rolled back; profiles=0, scores=0.
- Live edge: public config/world/country-standings return 200; anonymous write returns 401; foreign-origin write returns 403.
- Real Google account sign-in and ranking submission still require the client-ID setup above.
