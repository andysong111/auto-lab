# LoopJolt marketing stage 3-6 media-source gate — 2026-09-21

Status: **IN PROGRESS — do not fan out Core Pins from the legacy paused scheduler upload. Deep Descent TikTok remains the next scheduled gate at 18:30 KST.**

This checkpoint is later than `STAGE3_5_ROLLOUT_CHECKPOINT_20260921.md` and preserves its released IDs/UUIDs and owner-recording evidence. It contains no owner recording, screenshots, credentials, private insight counts, raw telemetry payloads, or opaque click identifiers.

## Fresh connected-state reconciliation — ~16:53 KST

Metricool brand `7005118` remains mapped to Instagram `playloopjolt`, Threads `playloopjolt`, TikTok `loopjolt2`, and YouTube `UCKl5Kh2Nju1C67mBBcVb7Mw` in `Asia/Seoul`.

The Deep Descent pilot records remain stable:
- Instagram: ID `379085442`, UUID `9065192409182392302`, PUBLISHED at `https://www.instagram.com/reel/Ddh9RSXDUJH/`.
- Threads: ID `379121314`, UUID `-3779698812320330656`, provider `17861602320694518`, PUBLISHED at `https://www.threads.com/@playloopjolt/post/DdiQe6DiRwj`.
- YouTube: ID `379131140`, UUID `-7037097001080305677`, provider `o38pO-F55E4`, PUBLISHED at `https://www.youtube.com/shorts/o38pO-F55E4`.
- TikTok: ID `379175340`, UUID `-577201996084197796`, still PENDING for `2026-09-21 18:30 Asia/Seoul`, `autoPublish=true`, `draft=false`, `PUBLIC_TO_EVERYONE`.

Exactly fifteen older scheduler items remain `draft=true` and `autoPublish=false`; none was updated, re-enabled, deleted, or counted as the current pilot. Facebook remains excluded.

Fresh Metricool analytics reads for Instagram Reels, Threads Posts and YouTube videos published in range still returned no rows for today. Treat post-level reach/views/watch/share/save/like/comment values as **null/delayed**, not zero.

## Production measurement/health

A fresh `public.loopjolt_acquisition_report(7)` at `2026-09-21T07:53:43.244744Z` remains `OBSERVATIONAL` with `event_count=6`, first event `2026-09-21T06:02:15.792228Z`, two direct/unattributed observed sessions and two `youtube / flag_challenge_pilot_20260920 / dd_fc01` content-tagged observed sessions. `gyro-drop` has two observed game sessions and zero started attempts at this observation. This is observational persistence evidence only, not two people, customers or conversions.

Collection remains enabled. `loopjolt-acquisition` Edge v1 remains ACTIVE with JWT verification enabled. The `loopjolt-marketing-retention` cron remains active at `17 * * * *` with `select loopjolt_marketing.cleanup();`. Vercel production runtime error aggregation for the preceding two hours returned no runtime errors.

## Core Pins legacy hosted-media validation — FAILED identity gate

Before scheduling any current Core Pins candidate, a read-only GitHub Actions check downloaded the media URL attached to the **older paused Core Pins YouTube draft**:

`https://static.metricool.com/planner/202609/7005118-file-16948261199467206743.mp4`

Expected approved `LoopJolt_CorePins_Publish_v1.mp4` SHA-256 from `stage3-1.release-manifest.json`:

`7046344d511a47dd85d221ec5bef2e064f2f24b0b47a5c8147630dbcf551b413`

Observed hosted object:
- bytes: `164579`
- SHA-256: `830c5317f5c62beb31dcf11e34f5c5cc9e4156c7fec3664a3afefdebc4945b61`

The hash comparison failed before decode/freeze checks. Therefore this URL is **not the approved current Core Pins Publish_v1 master** and must not be reused for the current pilot. The failure is useful evidence, not a reason to modify the paused draft.

The user Library currently lists `LoopJolt_CorePins_Review_v1.mp4` and `LoopJolt_NovaMerge_Review_v1.mp4`, but the available file connector did not provide an authorized raw-byte materialization path in this run. No accessible `LoopJolt_CorePins_Publish_v1.mp4` raw file was found through the current Library listing. Do not claim a recreated publish master or schedule from an unverified review file.

Diagnostic workflow run: `35575350858` on temporary branch `marketing/stage3-corepins-hosted-check-20260921`, conclusion **failure by expected hash mismatch**. Its Vercel deployment is preview-only and does not change production.

## Release decision

Do **not** schedule `cp_fc01_*` from the old Core Pins scheduler upload. Do not touch the fifteen paused drafts. Continue the already scheduled Deep Descent TikTok gate at 18:30 KST, then reconcile publication/provider state and native-copy evidence where available.

Core Pins may advance only after a supported hosted copy is proven byte-equal to the approved Publish_v1 SHA-256 and passes the existing decode/gameplay-freeze gate. Nova Merge remains unscheduled until its own approved-media source is similarly validated. Stage 3 remains **IN PROGRESS**; stage 4 hook experiments remain gated and no winner is claimed.
