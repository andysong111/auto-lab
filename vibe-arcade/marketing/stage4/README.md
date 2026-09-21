# Marketing stage 4 — acquisition foundation

Owner approved the new stage-4 plan on 2026-09-21. This is marketing, not Game Kit engineering. This implementation covers 4-1, 4-2 and the configuration/evaluator foundations for 4-3/4-7; it is not a claimed winning acquisition format or full stage-4 completion.

## Implemented

- Normalize ig/instagram, yt/youtube, tt/tiktok and th/threads while preserving raw campaign strings. The existing campaign flag_challenge_pilot_20260920 remains intact; flag_challenge is a reporting family, not rewritten old URLs.
- Anonymous tab sessions, attempt IDs, successful replay starts, ranked-interest clicks, event/attempt dedup, strict payload allowlist, private aggregate report. Browser score-success reports are not authoritative server scores.
- Standalone loopjolt_marketing schema with service-role-only RPCs, RLS, 30-day retention and hourly cleanup, a kill switch, and bounded collection caps. No joins or mutations to account/ranking tables. The separate Edge collector keeps gateway JWT verification ON; the BFF supplies an intentionally public anon project key, not a service-role secret. Public anon identity is not bot/person authentication.
- Browser exclusions: capture, QA/internal-marked sessions, automated browsers, Global Privacy Control, Do Not Track and opt-out. Automatic exclusion cannot identify every unmarked owner visit or all bots. Counts are observational, not unique people.
- Server-rendered static metadata and playable Core Pins/Nova Merge entry pages. Existing query-based game links remain functional. New homepage game links lead straight to the game, not through an extra landing step.
- Eight sitemap entries; title/description/canonical/OG for home and four main games; Deep Descent primary branding with Gyro Drop alias.
- One-factor hook experiment definition and conservative evaluation. WAIT/DATA_GAP/INSUFFICIENT_DATA/INCONCLUSIVE must not be forced into KEEP/MODIFY/KILL. The operational sample/age thresholds are not a power calculation and organic posts are not randomized trials.

## Build/source distinction

Run npm run build from vibe-arcade. scripts/build-measurement.cjs generates analytics.js and arcade3/telemetry.js. scripts/build-discovery.cjs generates/updates static HTML, sitemap and small route/metadata adapters from existing shells. Edit these source generators, not generated outputs. Repeated generation must be byte-idempotent. Compare production against BUILT files, not raw pre-build repository templates.

## Measurement and operations

Read the private report using the authorized database connector:

```sql
select public.loopjolt_acquisition_report(7);
```

It returns channel/campaign cohorts and game counts with NO_DATA when empty. Channel-only profile visits never acquire fabricated content-level conversions. Sessions reset after 30-minute inactivity and daily keyed hashing prevents cross-day user measurement. The database timestamps receipt, not a claimed client event time. Data before deployment is not backfilled as real measured conversions.

For owner QA visits, enter through `/?internal=1` (tab-scoped exclusion). `/?internal=0` clears it. Global privacy preferences and the privacy-page opt-out remain available; do not disable gameplay or require login for measurement.

Rollback collection only:

```sql
update loopjolt_marketing.settings set enabled=false where singleton;
```

Use existing deploy rollback for a code regression. Never drop game/account tables. If collection health fails, report DATA_GAP; do not present absent events as zero customers. Storage caps (20,000/day, 1,200/minute and 600/session) bound this pilot but are not a guarantee against all traffic/cost abuse. There is no new paid subscription or ad-budget change.

## Gates and remaining work

Deploy additive SQL and the independent collector, enable its settings, merge reviewed code after CI, then check actual production HTML/built-source parity and public read-only rejection paths. Local browser navigation was policy-blocked, so actual browser evidence comes from isolated GitHub Actions runners. Never claim a production POST-to-storage canary when only mocked requests and read-only HTTP checks ran.

A user-supplied desktop Instagram recording previously confirmed the exact first Reel and profile-to-free-practice journey. It does not validate mobile apps or the 11 remaining prepared posts. Keep stage 3's actual rollout ledger separate; do not call it complete from this code change.

Next: reconcile and release the already approved stage-3 content with media gates; collect baseline snapshots with timestamps and internal visits excluded; connect the LoopJolt Search Console property if it is still unavailable; then run one declared hook test on matched observation windows. No new experiment auto-posts were created here. Profile display-name/bio changes and native platform performance ingestion are not implemented by this foundation. No winner is claimed.

## Official references

- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl

SEO changes are discovery/description improvements, not indexing or ranking guarantees.
