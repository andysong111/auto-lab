# LoopJolt marketing stage 4 — first live baseline

Date: 2026-09-21.

This is an observational baseline, not a conversion verdict or winning-content claim.

## Google Search Console

Property: `https://vibe-arcade-dun.vercel.app/`

- Ownership verified by HTML file and connected to GSC Wizard.
- Sitemap `/sitemap.xml` submitted and successfully downloaded by Google.
- Sitemap status: success, warnings 0, errors 0.
- Submitted web URLs: 8.
- Indexed from sitemap at this checkpoint: 0.
- Main tracked URLs still report `URL is unknown to Google`; this is an initial discovery state, not a robots or fetch error.
- Search clicks/impressions are 0 at this checkpoint. The property is newly registered, so this is not evidence of no search demand.

Tracked primary URLs:
- /
- /descent
- /games/core-pins
- /games/nova-merge
- /games/orbit-sprint
- /games/dont-press
- /games/perfect-timing
- /games/reaction-rush

## Site acquisition measurement

Private report: `public.loopjolt_acquisition_report(7)`.

First observed event: 2026-09-21T06:02:15.792228Z.
Snapshot at 2026-09-21T08:25:41.840147Z:
- status: OBSERVATIONAL
- total events: 6
- direct/unattributed observed tab sessions: 2
- youtube / flag_challenge_pilot_20260920 / dd_fc01 content-tagged observed tab sessions: 2
- gyro-drop observed game sessions: 2
- game_start attempts observed: 0
- replay sessions observed: 0
- ranked-interest sessions observed: 0

These are random tab sessions with a 30-minute inactivity reset and daily keyed hash rotation, not unique people. The current rows may include crawlers, previews, owners or other non-customer traffic not automatically excluded. A tagged YouTube URL proves a tagged request, not that a human watched a particular video. Do not call the current 6 events organic customers.

No historical data was backfilled. Absence of game_start events must not be converted into a site conversion rate until the collector has enough real, healthy traffic and matching denominators.

## Existing service integrity

At this snapshot:
- collection enabled
- existing profiles: 1
- existing scores: 2
- no account or ranked-score test writes were made for this baseline.

## Stage-4 decision state

4-1 acquisition collection: LIVE, first events observed, measurement health still accumulating.
4-2 SEO/search foundation: LIVE; sitemap discovered successfully, indexing not started yet.
4-3 first one-factor hook experiment: NOT YET DECLARED LIVE.
4-7 KEEP/MODIFY/KILL: DATA_GAP / INSUFFICIENT_DATA for any real content winner.

Next safe actions:
1. Continue collecting timestamped baseline without interpreting small counts as people.
2. Watch sitemap/indexing transition and first settled Search Console impressions.
3. Reconcile the already-approved stage-3 publication ledger before starting a new hook experiment so old and experimental posts do not contaminate the comparison.
4. Start only one declared hook factor when matched observation windows and content-level tagging are available.
