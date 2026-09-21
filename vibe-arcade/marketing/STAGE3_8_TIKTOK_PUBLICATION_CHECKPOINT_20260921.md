# LoopJolt marketing stage 3-8 — Deep Descent TikTok publication checkpoint

Date: 2026-09-21.

Status: **IN PROGRESS — all four Deep Descent network candidates are now PUBLISHED; TikTok scheduler/provider publication is confirmed, while TikTok native playback remains UNVERIFIED. Core Pins and Nova Merge remain held behind approved-current-media identity gates.**

This checkpoint is later than `STAGE3_7_NOVA_MEDIA_GATE_20260921.md`. It preserves the first Instagram owner-recording evidence and all fifteen older paused drafts unchanged. It contains no credentials, owner recording, screenshots, private insight counts, raw telemetry payloads or opaque click identifiers.

## Fresh production health — 18:52 KST

At `2026-09-21T09:52:02.2673Z`, `select public.loopjolt_acquisition_report(7)` remains `OBSERVATIONAL` with `event_count=6` and first event `2026-09-21T06:02:15.792228Z`.

The aggregate still shows two direct/unattributed observed tab sessions and two `youtube / flag_challenge_pilot_20260920 / dd_fc01` content-tagged observed tab sessions. `gyro-drop` still has two observed game sessions and zero started attempts at this snapshot. These are observational tab-session counts, not people, customers or conversions, and the zero starts at this very small sample are not a conversion verdict.

Collection is still enabled. `loopjolt-marketing-retention` remains active on `17 * * * *`. `loopjolt-acquisition` Edge function v1 is ACTIVE with gateway JWT verification enabled. Vercel production runtime-error aggregation for the preceding two hours returned no runtime errors.

## Deep Descent TikTok — publication gate

Fresh Metricool reconciliation after the 18:30 KST scheduled time returned the existing candidate, not a replacement or duplicate:

- Candidate: `dd_fc01_tiktok`
- Network/account: TikTok `loopjolt2`
- Metricool ID: `379175340`
- Stable UUID: `-577201996084197796`
- Provider/video ID: `7687918676808584469`
- State: **PUBLISHED**
- Detailed status: `Published`
- Public URL: `https://www.tiktok.com/@loopjolt2/video/7687918676808584469`
- Scheduled/publication slot: `2026-09-21 18:30 Asia/Seoul`
- `autoPublish=true`, `draft=false`, privacy `PUBLIC_TO_EVERYONE`
- Media: the same Deep Descent Metricool-hosted object previously byte-verified to approved Publish_v1 SHA-256 `e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad`
- Caption: direct game URL tagged `utm_source=tiktok`, `utm_medium=organic_video`, `utm_campaign=flag_challenge_pilot_20260920`, `utm_content=dd_fc01`; it does not depend on an unverified TikTok profile-link field.

The available public web inspection path could not access the TikTok video URL. Therefore PUBLISHED/provider ID/public URL prove scheduler/provider publication only. Platform-transcoded playback, gameplay motion, audio, crop and the >=0.60-second gameplay-freeze gate remain **UNVERIFIED** for TikTok. Do not transfer Instagram desktop-recording evidence to TikTok.

## Current Deep Descent ledger

| Candidate | Network | Metricool ID | Stable UUID / provider ID | State | Public URL | Native-copy evidence |
|---|---|---:|---|---|---|---|
| dd_fc01_instagram | Instagram | 379085442 | `9065192409182392302` | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | Hosted input byte-verified; owner desktop native playback/profile/free-play gate PASSED within documented limits. |
| dd_fc01_threads | Threads | 379121314 | UUID `-3779698812320330656`; provider `17861602320694518` | PUBLISHED | https://www.threads.com/@playloopjolt/post/DdiQe6DiRwj | Scheduler/provider publication confirmed; native Threads playback UNVERIFIED. |
| dd_fc01_youtube | YouTube | 379131140 | UUID `-7037097001080305677`; provider `o38pO-F55E4` | PUBLISHED | https://www.youtube.com/shorts/o38pO-F55E4 | Scheduler/provider publication confirmed; native YouTube playback UNVERIFIED. |
| dd_fc01_tiktok | TikTok | 379175340 | UUID `-577201996084197796`; provider `7687918676808584469` | PUBLISHED | https://www.tiktok.com/@loopjolt2/video/7687918676808584469 | Scheduler/provider publication confirmed; native TikTok playback UNVERIFIED. |

## Remaining media gate

The current pilot must not reuse the old paused Core Pins or Nova Merge scheduler media. Their hosted-object SHA-256 values were already proven different from the approved Publish_v1 hashes in stages 3-6 and 3-7.

A new attempt to recover the generated `LoopJolt_Stage3_Publication_Preflight_Pack.zip` from the user's Library located the exact package metadata, but raw-byte materialization was denied because that Project file has no authorized raw-byte materialization path. No binary was guessed, regenerated or relabeled as an approved Publish_v1. The Google Drive mount currently exposes the approved Deep Descent Publish_v1, but no supported Core Pins/Nova Merge Publish_v1 source was found in the available root listing.

Therefore no `cp_fc01_*` or `nm_fc01_*` candidate was scheduled in this checkpoint. The fifteen older paused drafts remain unchanged and Facebook remains excluded.

## Stage state

Stage 3 is **not complete**. Deep Descent has reached all four intended networks, but only the first Instagram candidate has the documented owner-native playback gate; the other three platform copies remain natively unverified, and the eight Core Pins/Nova Merge candidates remain unreleased behind current-media identity/access gates.

Stage 4 remains **IN PROGRESS** at the deployed measurement/SEO foundation and baseline-collection level. The one-variable hook release gate remains closed until the current three-game rollout is reconciled under the approved experiment plan. No hook winner or KEEP/MODIFY/KILL conclusion is claimed.
