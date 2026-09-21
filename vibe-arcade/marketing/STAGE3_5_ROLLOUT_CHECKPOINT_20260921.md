# LoopJolt marketing stage 3-5 rollout checkpoint — 2026-09-21

Status: **IN PROGRESS — first Instagram native gate passed from owner desktop recording; Deep Descent Threads published; Deep Descent YouTube scheduled; no other pilot fan-out yet.**

This checkpoint is later than, and must be read together with, `STAGE3_4_OWNER_RECORDING_CHECK_20260921.md`. It does not publish or expose the owner's recording, screenshots, private insight counts, browser tabs, credentials, or opaque click identifiers.

## Superseded blocker
The earlier native Instagram login-wall blocker is resolved for the first controlled release by the owner's logged-in desktop Chrome recording. That evidence verifies the intended Reel `Ddh9RSXDUJH` on `@playloopjolt`, a complete playback cycle with moving gameplay and intended end cards, captured original audio alignment, a working profile website link, and guest Deep Descent play. The gameplay ROI contained no unplanned freeze >=0.60 seconds. Evidence limits remain: desktop recording only; it does not prove every device/mobile app path or Instagram's original transcoded bytes.

The actual Instagram profile link uses `utm_source=ig`, `utm_medium=social`, `utm_content=link_in_bio` and works. Reporting may group `ig` with `instagram` while preserving the raw source. Shared profile-link traffic is channel-level evidence, not precise per-Reel conversion attribution.

## SEO/search foundation
PR #27 (`marketing/recording-search-foundation`, head `75ff96cb7e3dee19eaec9bd1d49a817414683244`) had eight successful pull-request workflows and was reconciled before merge. It was squash-merged to main as `1299620c4aa4fcd834a548013cc07aac7067bfaf`.

The matching Vercel production deployment reached READY. The main `LoopJolt search foundation` workflow run `35560381265` completed successfully. Read-only production retrieval then verified:
- descriptive home title/description/OG/canonical;
- public home card name `Deep Descent` while the internal `gyro-drop` identity remains;
- descriptive Deep Descent title/description/OG/canonical;
- sitemap with exactly eight URLs: home, four main games and three legacy games.

This proves deployment only. It does **not** prove Google indexation, impressions, ranking movement, or SEO traffic improvement. The connected GSC Wizard account still does not provide a LoopJolt property, so no GSC result is claimed.

## Stage-3 candidate ledger
| Candidate | Network | Metricool ID | UUID / provider ID | State | Public URL / schedule | Evidence |
|---|---|---:|---|---|---|---|
| dd_fc01_instagram | Instagram | 379085442 | `9065192409182392302` | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | Hosted input byte-verified to approved master; owner desktop native playback/profile/free-play gate PASSED within stated limits. |
| dd_fc01_threads | Threads | 379121314 | UUID `-3779698812320330656`; provider `17861602320694518` | PUBLISHED | https://www.threads.com/@playloopjolt/post/DdiQe6DiRwj | Reuses exact verified Deep Descent Metricool media. Scheduler publication confirmed. Native Threads playback remains UNVERIFIED because the public post could not be inspected with the current connected path. |
| dd_fc01_youtube | YouTube | 379131140 | UUID `-7037097001080305677` | SCHEDULED / PENDING | 2026-09-21 15:00 Asia/Seoul | Reuses exact verified Deep Descent Metricool media. Direct per-post UTM game URL used so no unverified YouTube profile-link field is required. Publication/platform playback not yet claimed. |
| dd_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Wait for the current next-platform check; TikTok profile-link field/native playback not invented. |
| cp_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| cp_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_instagram | Instagram | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_threads | Threads | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_youtube | YouTube | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |
| nm_fc01_tiktok | TikTok | — | — | NOT SCHEDULED | — | Await conservative Deep Descent cross-platform checks. |

## Scheduler integrity
A fresh Metricool reconciliation was performed before the YouTube write. No existing `dd_fc01_youtube` candidate was found. The 15 older paused drafts remain `draft=true` / `autoPublish=false`; none were re-enabled, edited, deleted, or counted as this pilot.

## Current analytics boundary
At the post-publication observation in this checkpoint, the Metricool Instagram Reel query and the new Threads post query both returned no rows. Treat those metrics as **not yet available/null**, not zero. Do not compare private native snapshots and delayed connector snapshots as if captured at the same time.

## Stage completion / handoff
Stage 3 is **not complete**. Two of twelve intended pilot candidates are published, one is scheduled/pending, and the remaining candidates have not been rolled out or platform-checked. Continue conservatively from stable IDs/UUIDs and do not create duplicates.

The original numbered LoopJolt MARKETING stage-4 completion contract remains unresolved. SEO work above was explicitly authorized bounded work and must not be relabeled as the missing original numbered stage 4. Do not substitute engineering/Game Kit or monetization phases.
