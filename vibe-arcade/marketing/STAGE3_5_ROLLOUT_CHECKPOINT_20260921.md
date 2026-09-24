# LoopJolt marketing stage 3-5 rollout checkpoint — 2026-09-21

Status: **IN PROGRESS — Deep Descent Instagram/Threads/YouTube published; Deep Descent TikTok scheduled for 18:30 KST; first production acquisition events are now stored; no Core Pins/Nova Merge fan-out yet.**

This checkpoint is later than, and must be read together with, `STAGE3_4_OWNER_RECORDING_CHECK_20260921.md`. It does not publish or expose the owner's recording, screenshots, private insight counts, browser tabs, credentials, raw telemetry payloads, or opaque click identifiers.

## Superseded blocker
The earlier native Instagram login-wall blocker is resolved for the first controlled release by the owner's logged-in desktop Chrome recording. That evidence verifies the intended Reel `Ddh9RSXDUJH` on `@playloopjolt`, a complete playback cycle with moving gameplay and intended end cards, captured original audio alignment, a working profile website link, and guest Deep Descent play. The gameplay ROI contained no unplanned freeze >=0.60 seconds. Evidence limits remain: desktop recording only; it does not prove every device/mobile app path or Instagram's original transcoded bytes.

The actual Instagram profile link uses `utm_source=ig`, `utm_medium=social`, `utm_content=link_in_bio` and works. Reporting may group `ig` with `instagram` while preserving the raw source. Shared profile-link traffic is channel-level evidence, not precise per-Reel conversion attribution.

## SEO/search and stage-4 foundation
PR #27 (`marketing/recording-search-foundation`, head `75ff96cb7e3dee19eaec9bd1d49a817414683244`) was squash-merged to main as `1299620c4aa4fcd834a548013cc07aac7067bfaf`. The matching Vercel production deployment reached READY and the `LoopJolt search foundation` main workflow passed read-only production verification for descriptive home/Deep Descent metadata, the public `Deep Descent` name with internal `gyro-drop` identity retained, and an eight-URL sitemap. This proves deployment only, not Google indexation or ranking improvement.

The owner later explicitly approved the new marketing stage-4 plan. Its current repository scope is `marketing/stage4/README.md` and `experiment-plan.json`, with deployment checkpoint `STAGE4_FOUNDATION_DEPLOYED_20260921.md`. Foundation PR #30 and retention hardening #31 are merged. Stage 4 is **not complete** and no acquisition winner is claimed. The release gate in the experiment plan still requires finishing the current three-game rollout before publishing new hook experiments.

## Latest checkpoint — 16:00 KST

### Deep Descent YouTube publication
A fresh Metricool read after the 15:00 KST schedule shows candidate `dd_fc01_youtube` as **PUBLISHED** rather than pending.

- Metricool ID: `379131140`
- UUID: `-7037097001080305677`
- YouTube provider/video ID: `o38pO-F55E4`
- Public URL: `https://www.youtube.com/shorts/o38pO-F55E4`
- Title: `Which Flag Clears 48? | Deep Descent`
- Media: the same Metricool-hosted Deep Descent source previously byte-verified to approved Publish_v1 SHA-256 `e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad`
- Caption uses a direct Deep Descent URL with `utm_source=youtube`, `utm_medium=organic_video`, `utm_campaign=flag_challenge_pilot_20260920`, `utm_content=dd_fc01`; it does not depend on an unverified YouTube profile website field.

Metricool publication state and public URL prove scheduler/provider publication, not playback quality. The available public web path could not fetch the YouTube Shorts page, so the platform-transcoded motion/audio/crop/freeze gate remains **UNVERIFIED** for YouTube. Do not copy the Instagram desktop recording evidence to YouTube.

### First real production acquisition persistence
At `2026-09-21T06:56:48Z` (15:56 KST), the authorized production report changed from `NO_DATA` to **OBSERVATIONAL** with `event_count=6` and `first_event_at=2026-09-21T06:02:15.792228Z`.

Observed cohorts at that snapshot:
- `source=direct`, `scope=unattributed`: `observed_sessions=2`, starts/replays/ranked interest/completions all `0`.
- `source=youtube`, `campaign=flag_challenge_pilot_20260920`, `content=dd_fc01`, `scope=content_tagged`: `observed_sessions=2`, starts/replays/ranked interest/completions all `0`.
- Game observation: `gyro-drop`, `observed_game_sessions=2`, `started_attempts=0`.

This resolves the earlier **production POST -> collector -> Edge -> private database persistence** uncertainty: real production events are now stored. It does **not** prove two customers, two unique people, two conversions, or that the sessions are independent of owner/unmarked QA. The random tab sessions and content tag are observational only. No fake event was injected to close this gate.

Collection remains enabled. `loopjolt-marketing-retention` remains active at `17 * * * *` with command `select loopjolt_marketing.cleanup();`. `loopjolt-acquisition` Edge v1 remains ACTIVE with JWT verification enabled. Vercel production runtime error aggregation for the preceding two hours returned no runtime errors.

### Connector analytics remain delayed
Fresh Instagram Reels, Threads Posts and YouTube published-video analytics queries for 2026-09-21 still returned no rows at this checkpoint. Treat reach/views/watch/share/save/like/comment values as **not yet available/null**, not zero. Do not compare delayed Metricool connector rows with older private native observations as if they share one observation time.

## Stage-3 candidate ledger
| Candidate | Network | Metricool ID | UUID / provider ID | State | Public URL / schedule | Evidence |
|---|---|---:|---|---|---|---|
| dd_fc01_instagram | Instagram | 379085442 | `9065192409182392302` | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | Hosted input byte-verified to approved master; owner desktop native playback/profile/free-play gate PASSED within stated limits. |
| dd_fc01_threads | Threads | 379121314 | UUID `-3779698812320330656`; provider `17861602320694518` | PUBLISHED | https://www.threads.com/@playloopjolt/post/DdiQe6DiRwj | Reuses exact verified Deep Descent Metricool media. Scheduler publication confirmed. Native Threads playback remains UNVERIFIED because the public post is not inspectable through the current connected path. |
| dd_fc01_youtube | YouTube | 379131140 | UUID `-7037097001080305677`; provider `o38pO-F55E4` | PUBLISHED | https://www.youtube.com/shorts/o38pO-F55E4 | Reuses exact verified Deep Descent hosted media. Direct per-post UTM destination. Scheduler/provider publication confirmed; native YouTube playback remains UNVERIFIED. |
| dd_fc01_tiktok | TikTok | 379175340 | UUID `-577201996084197796` | SCHEDULED / PENDING | 2026-09-21 18:30 Asia/Seoul | Same previously byte-verified Deep Descent hosted source. Direct TikTok-tagged game URL removes dependence on an unverified TikTok profile website field. `autoPublish=true`, `draft=false`, privacy `PUBLIC_TO_EVERYONE`. Publication/playback not yet claimed. |
| cp_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| cp_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| cp_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| cp_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| nm_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| nm_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| nm_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |
| nm_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await Deep Descent TikTok gate and current approved-media host validation. |

## Scheduler integrity — fresh 16:00 KST reconciliation
Metricool brand `7005118` / `Asia/Seoul` still maps to Instagram `playloopjolt`, Threads `playloopjolt`, TikTok `loopjolt2`, and YouTube `UCKl5Kh2Nju1C67mBBcVb7Mw`.

The Instagram, Threads and YouTube Deep Descent candidates retain the stable UUIDs above. A single new Deep Descent TikTok candidate was created only after the YouTube publication check; a re-read returned the same new ID/UUID and PENDING state. No duplicate pilot item was created.

Exactly fifteen older paused scheduler items across 2026-09-21 through 2026-09-24 remain `draft=true` and `autoPublish=false`. They were not re-enabled, edited, deleted, or counted as this pilot. Their old media is not silently reused as the current Core Pins/Nova Merge pilot media without hash validation.

For the Deep Descent TikTok item, the current Metricool schedule points to the same supported hosted URL already used by the verified Instagram source and the published Threads/YouTube candidates. The previous GitHub Actions hosted-source check proved that URL byte-equal to the approved Deep Descent publish master. A generic container/web fetch path could not refetch the binary in this run, so no new byte-equality claim is added.

## Next safe action
Do not duplicate or alter the pending Deep Descent TikTok item before its scheduled 18:30 KST publication. The next check should reconcile the stable UUID/provider ID and PUBLISHED/error state, record any public URL, inspect the TikTok platform copy only through actually available evidence, and keep playback UNVERIFIED if scheduler state is the only evidence.

Before starting Core Pins or Nova Merge, locate or create a current supported hosted copy from the approved publish master and verify its hash/media gate. The fifteen old paused-draft uploads are not automatically valid pilot media merely because their game names overlap.

## Stage completion
Stage 3 is **not complete**. Three of twelve intended pilot candidates are published, one is scheduled/pending, and eight have not yet been rolled out or platform-checked. Continue conservatively from stable IDs/UUIDs and do not create duplicates.

Stage 4 has an explicit owner-approved scope and a deployed measurement/SEO foundation. Production acquisition persistence is now observed, but the new hook experiment posts remain gated on completion of the current three-game stage-3 rollout and the experiment plan's minimum evidence rules. No winner is claimed.
