# LoopJolt marketing stage 3-5 rollout checkpoint — 2026-09-21

Status: **IN PROGRESS — first Instagram native gate passed from owner desktop recording; Deep Descent Threads published; Deep Descent YouTube scheduled for 15:00 KST; no other pilot fan-out yet.**

This checkpoint is later than, and must be read together with, `STAGE3_4_OWNER_RECORDING_CHECK_20260921.md`. It does not publish or expose the owner's recording, screenshots, private insight counts, browser tabs, credentials, raw telemetry payloads, or opaque click identifiers.

## Superseded blocker
The earlier native Instagram login-wall blocker is resolved for the first controlled release by the owner's logged-in desktop Chrome recording. That evidence verifies the intended Reel `Ddh9RSXDUJH` on `@playloopjolt`, a complete playback cycle with moving gameplay and intended end cards, captured original audio alignment, a working profile website link, and guest Deep Descent play. The gameplay ROI contained no unplanned freeze >=0.60 seconds. Evidence limits remain: desktop recording only; it does not prove every device/mobile app path or Instagram's original transcoded bytes.

The actual Instagram profile link uses `utm_source=ig`, `utm_medium=social`, `utm_content=link_in_bio` and works. Reporting may group `ig` with `instagram` while preserving the raw source. Shared profile-link traffic is channel-level evidence, not precise per-Reel conversion attribution.

## SEO/search and stage-4 foundation
PR #27 (`marketing/recording-search-foundation`, head `75ff96cb7e3dee19eaec9bd1d49a817414683244`) was squash-merged to main as `1299620c4aa4fcd834a548013cc07aac7067bfaf`. The matching Vercel production deployment reached READY and the `LoopJolt search foundation` main workflow passed read-only production verification for descriptive home/Deep Descent metadata, the public `Deep Descent` name with internal `gyro-drop` identity retained, and an eight-URL sitemap. This proves deployment only, not Google indexation or ranking improvement.

The owner later explicitly approved the new marketing stage-4 plan. Its current repository scope is `marketing/stage4/README.md` and `experiment-plan.json`, with deployment checkpoint `STAGE4_FOUNDATION_DEPLOYED_20260921.md`. Foundation PR #30 and retention hardening #31 are merged. Stage 4 is **not complete** and no acquisition winner is claimed. The release gate in the experiment plan still requires finishing the current three-game rollout before publishing new hook experiments.

## Stage-3 candidate ledger
| Candidate | Network | Metricool ID | UUID / provider ID | State | Public URL / schedule | Evidence |
|---|---|---:|---|---|---|---|
| dd_fc01_instagram | Instagram | 379085442 | `9065192409182392302` | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | Hosted input byte-verified to approved master; owner desktop native playback/profile/free-play gate PASSED within stated limits. |
| dd_fc01_threads | Threads | 379121314 | UUID `-3779698812320330656`; provider `17861602320694518` | PUBLISHED | https://www.threads.com/@playloopjolt/post/DdiQe6DiRwj | Reuses exact verified Deep Descent Metricool media. Scheduler publication confirmed. Native Threads playback remains UNVERIFIED because the public post is not inspectable through the current connected path. |
| dd_fc01_youtube | YouTube | 379131140 | UUID `-7037097001080305677` | SCHEDULED / PENDING | 2026-09-21 15:00 Asia/Seoul | Fresh Metricool read at 14:50 KST still shows PENDING. Reuses exact verified Deep Descent hosted media and uses a direct per-post UTM game URL, so no unverified YouTube profile website field is required. Publication/platform playback not yet claimed. |
| dd_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Wait for the current YouTube publication/platform check; TikTok profile-link field/native playback not invented. |
| cp_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |

## Scheduler integrity — fresh 14:50 KST reconciliation
Metricool brand `7005118` / `Asia/Seoul` still maps to Instagram `playloopjolt`, Threads `playloopjolt`, TikTok `loopjolt2`, and YouTube `UCKl5Kh2Nju1C67mBBcVb7Mw`.

The first Instagram, Threads and pending YouTube candidates retain the stable UUIDs above and all reuse the verified Deep Descent hosted source URL. No duplicate `dd_fc01_youtube` or additional stage-3 pilot candidate was created in this check.

Exactly fifteen older paused scheduler items in the 2026-09-21 through 2026-09-24 window remain `draft=true` and `autoPublish=false`. They were not re-enabled, edited, deleted, or counted as this pilot. Older already-published September 20 content is separate historical content and is not silently relabeled as a stage-3 candidate.

## Measurement / production health — fresh 14:50 KST reconciliation
Authorized production SQL at `2026-09-21T05:50:55Z` returned `status=NO_DATA`, `event_count=0`. Collection is enabled and `loopjolt-marketing-retention` remains active at `17 * * * *` with command `select loopjolt_marketing.cleanup();`. This is a **DATA_GAP / no stored events yet**, not evidence of zero customers.

Vercel production runtime errors for the preceding three hours returned none. Runtime request counts include `/api/event`, but the POST events visible in the bounded log review belong to the pre-stage-4 legacy collector deployment; the post-stage-4 production checks were read-only GET rejection checks. Therefore a real post-deployment production POST -> Edge -> private database persistence event is still unverified. Do not backfill or inject a fake visitor event to close this gate.

## Current analytics boundary
At the 14:50 KST observation, both the Metricool Instagram Reels query (date/id/url/reach/save/share/views/watch/retention fields) and Threads Posts query (date/id/url/views/likes/replies/reposts/quotes/shares) returned no rows for 2026-09-21. Treat these values as **not yet available/null**, not zero. Do not compare the owner's private native snapshot, Metricool provider state and delayed connector analytics as if captured at the same time.

## Next safe action
Do not duplicate or alter the pending YouTube item before its scheduled 15:00 KST publication. The next check should reconcile its stable UUID/provider ID and PUBLISHED/error state, record the public URL if supplied, inspect the platform copy only through actually available evidence, and keep playback UNVERIFIED if only scheduler state is available. Only after that next-platform gate should another Deep Descent network be considered.

## Stage completion
Stage 3 is **not complete**. Two of twelve intended pilot candidates are published, one is scheduled/pending, and the remaining candidates have not been rolled out or platform-checked. Continue conservatively from stable IDs/UUIDs and do not create duplicates.

Stage 4 has a now-explicit owner-approved scope and a deployed foundation, but its new hook experiment posts remain gated on completion of the current three-game stage-3 rollout and measurement readiness. No winner is claimed.
