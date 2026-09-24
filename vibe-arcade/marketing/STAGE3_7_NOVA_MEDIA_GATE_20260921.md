# LoopJolt marketing stage 3-7 — Nova Merge media-source gate

Date: 2026-09-21.

Status: **IN PROGRESS — the legacy paused Nova Merge scheduler upload is not the approved Publish_v1 and must not be reused. Deep Descent TikTok remains the next scheduled publication gate at 18:30 KST.**

This checkpoint is later than `STAGE3_6_MEDIA_SOURCE_GATE_20260921.md`. It preserves the existing Deep Descent release identities, the owner-recording evidence limits, and all fifteen older paused drafts unchanged. It contains no credentials, raw telemetry payloads, private insight counts, screenshots, owner recording, or opaque click identifiers.

## Fresh production health before media check

At `2026-09-21T08:57:22.87425Z`, `public.loopjolt_acquisition_report(7)` remains `OBSERVATIONAL` with `event_count=6`, first event `2026-09-21T06:02:15.792228Z`, two direct/unattributed observed tab sessions and two `youtube / flag_challenge_pilot_20260920 / dd_fc01` content-tagged observed tab sessions. `gyro-drop` has two observed game sessions and zero started attempts at this snapshot.

These counts prove that the production collection path is persisting events. They do not prove six people, customers, conversions, or that the observed sessions exclude every unmarked owner/bot visit. Zero starts at this very small observational snapshot is not a conversion-rate verdict.

Collection remains enabled. `loopjolt-acquisition` Edge v1 remains ACTIVE with JWT verification enabled. The `loopjolt-marketing-retention` cron remains active at `17 * * * *` with `select loopjolt_marketing.cleanup();`. Vercel production runtime-error aggregation for the preceding two hours returned no runtime errors.

## Scheduler reconciliation

A fresh Metricool read still shows the same Deep Descent pilot records:
- Instagram ID `379085442`, UUID `9065192409182392302`, PUBLISHED.
- Threads ID `379121314`, UUID `-3779698812320330656`, PUBLISHED.
- YouTube ID `379131140`, UUID `-7037097001080305677`, PUBLISHED.
- TikTok ID `379175340`, UUID `-577201996084197796`, PENDING for `2026-09-21 18:30 Asia/Seoul`.

Exactly fifteen older scheduler items remain `draft=true` and `autoPublish=false`; none was edited, re-enabled, deleted, or counted as the current pilot. Facebook remains excluded.

## Nova Merge legacy hosted-media validation — FAILED identity gate

Before scheduling any current Nova Merge candidate, a read-only GitHub Actions check downloaded the media URL attached to the **older paused Nova Merge YouTube draft**:

`https://static.metricool.com/planner/202609/7005118-file-14483459320692003408.mp4`

Expected approved `LoopJolt_NovaMerge_Publish_v1.mp4` SHA-256 from `stage3-1.release-manifest.json`:

`2ddf4b63f559fa255454b4b008d8af3af7c8afabb640d70454c8078b7e7f91de`

Observed hosted object:
- bytes: `115000`
- SHA-256: `95934f28e20eb5c9295660183c3efed12fe07e5f514217ed11ddcfd266c3034b`

The hash comparison failed before decode/freeze checks. Therefore this URL is **not the approved current Nova Merge Publish_v1 master** and must not be reused for the current pilot. The failure does not imply that the legacy draft itself is corrupt; it only proves file-identity mismatch against the approved current release master.

Diagnostic workflow run: `35580752144`, job `106272821156`, temporary branch `marketing/stage3-nova-hosted-check-20260921`, commit `35cfa14a2565e10b7c915a6629cfa0d5e8d6687d`. The diagnostic branch is not production application code and does not alter the paused scheduler item.

## Release decision

Both checked legacy scheduler media sources are now excluded from current pilot reuse:
- Core Pins old YouTube hosted upload: identity mismatch recorded in `STAGE3_6_MEDIA_SOURCE_GATE_20260921.md`.
- Nova Merge old YouTube hosted upload: identity mismatch recorded here.

Do **not** schedule `cp_fc01_*` or `nm_fc01_*` from those legacy uploads. Advance either game only after a supported hosted/source copy is proven byte-equal to the approved Publish_v1 SHA-256 and passes the existing decode/gameplay-freeze gate. Do not alter the fifteen paused drafts.

Deep Descent TikTok remains the next bounded release gate. After 18:30 KST, reconcile its stable UUID/provider state and public URL/error before any further release write. A scheduler PUBLISHED state alone will not be called native playback QA.

## Stage state

Stage 3 remains **IN PROGRESS**. Three Deep Descent candidates are published, one is scheduled/pending, and Core Pins/Nova Merge are held behind current-media identity gates.

Stage 4 remains **IN PROGRESS** at the deployed measurement/SEO foundation and baseline-collection level. The hook experiment release gate remains closed until the current three-game rollout is reconciled; no hook winner or KEEP/MODIFY/KILL conclusion is claimed.
