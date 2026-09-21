# LoopJolt marketing stage 3 execution ledger — 2026-09-21

Status: **IN PROGRESS — first Instagram release published; hosted-source file gate PASSED; native platform playback still UNVERIFIED; owner evidence required; no fan-out yet.**

## Latest checkpoint — 11:55 KST native inspection

See `STAGE3_3_HOSTED_MEDIA_CHECK_20260921.md` for evidence and resumption criteria. A new read-only GitHub Actions route retrieved the Metricool-hosted MP4, proved full byte equality with the approved Publish_v1, passed full decoding and the unchanged >=0.60-second gameplay ROI freeze guard, and supplied five visually reviewed checkpoints. Source file QA is no longer blocked by download access.

Independent native Instagram inspection reached the exact public Reel with the correct visible owner and caption, but showed a Sign up / Log in modal, no playable video element, and a login redirect on the profile page. Native video playback/audio/crop and the actual profile website field remain UNVERIFIED. This access restriction is not evidence that the Reel is broken. The new local-browser 1x readiness timeout is also not counted as a successful playback.

Evidence: run `35555707959`, artifact `10619889671`, diagnostic branch `marketing/stage3-hosted-media`, commit `9dc500cfae47e49e79df6352de1fba6143d1adf1`. Diagnostic scripts remain separate from production application code. The existing hourly continuation task was paused to stop identical access-failure polling; no equivalent posting authorization was revoked.

Next necessary input is one screen recording from the owner's already logged-in Instagram app showing this exact Reel from start to end with sound, followed by the profile website link and its destination. Do not request credentials. Record screen-recording limits honestly; resume the approved rollout only when the applicable native checks are evidenced. No additional public post or schedule was created in this session.

The earlier observations below are preserved as history and are superseded by this section only for hosted-input accessibility/file QA.

## Guardrails
- Marketing workflow only. Do not confuse with similarly numbered engineering/Game Kit stages.
- No new paid spend, budget changes, account ownership/security changes, game-account creation, score submission, ranking-data mutation, or fabricated national rivalry/record claims.
- The 15 older paused drafts remain unchanged.
- A PUBLISHED status/public URL is not proof that the platform-transcoded video plays correctly.
- Fan-out remains blocked until actual hosted/platform playback, motion, audio and crop can be inspected sufficiently to preserve the >=0.60s unplanned gameplay-freeze rejection gate.

## Connected brand identity
Metricool brand id: `7005118`
Timezone: `Asia/Seoul`
Connected networks confirmed from Metricool brand settings:
- Instagram: `playloopjolt`
- Threads: `playloopjolt`
- TikTok: `loopjolt2`
- YouTube: `UCKl5Kh2Nju1C67mBBcVb7Mw`

## First controlled release evidence
Candidate: `dd_fc01_instagram`
Game: Deep Descent
Approved master: `LoopJolt_DeepDescent_Publish_v1.mp4`
Approved master SHA-256: `e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad`
Metricool UUID: `9065192409182392302`
Metricool creation/current id observed: `379085442`
Scheduled publication: `2026-09-21 10:15 Asia/Seoul`
Metricool-hosted input: `https://static.metricool.com/planner/202609/7005118-file-14822683884890234499.mp4`
Cover: frame at 1000 ms

Observed after scheduled time:
- Provider: Instagram
- Provider status: **PUBLISHED**
- Detailed status: `Published`
- Public URL: `https://www.instagram.com/reel/Ddh9RSXDUJH/`
- Caption returned by Metricool matches the approved `dd_fc01_instagram` copy.
- Connected Instagram account for this brand is `playloopjolt`, so the scheduler/account mapping is consistent with the intended destination.

### Historical playback / transcoding verification boundary
- Direct public Instagram page retrieval was not available from the initial web inspection path.
- Direct download of the Metricool-hosted MP4 was not available from the initial container/network path.
- Metricool Reels analytics had not populated the new reel yet at the first post-publication check; reel-level query returned no rows and daily reel counts/views were still `0` at that moment, consistent with analytics ingestion lag and not evidence of failure.
- Actual hosted/platform playback, gameplay motion, audio, crop and freeze integrity were **UNVERIFIED** in that initial checkpoint. Hosted-source file QA is now separately passed as described above.
- No additional networks/games were scheduled or published from that checkpoint.

## 11:27 KST recheck — historical
- Metricool still returned candidate `dd_fc01_instagram` with the same UUID `9065192409182392302`, provider status **PUBLISHED**, detailed status `Published`, and the same public URL `https://www.instagram.com/reel/Ddh9RSXDUJH/`.
- No duplicate replacement post was created.
- Instagram Reels analytics query for `2026-09-21 00:00–11:27 KST` still returned **zero rows** for reel-level fields including reel ID, URL, reach, views, average watch time, total watch time and retention. Treat this as analytics ingestion not yet available, not as playback success or failure.
- A fresh attempt to retrieve the public Instagram Reel through the available web path failed, and a fresh attempt to download the Metricool-hosted MP4 through the available container/network path also failed. These were inspection-capability limitations; neither result was evidence that the published Reel itself was broken.
- At that time no new evidence could verify gameplay motion, audio, crop, or the >=0.60s freeze guard on the actual hosted/platform copy, so the playback gate remained **UNVERIFIED** and fan-out remained blocked.

## Prepared stage-3 candidate ledger
| Candidate | Game | Network | State | Public URL | Native playback gate |
|---|---|---|---|---|---|
| dd_fc01_instagram | Deep Descent | Instagram | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | UNVERIFIED; native login wall |
| dd_fc01_youtube | Deep Descent | YouTube | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| dd_fc01_tiktok | Deep Descent | TikTok | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| dd_fc01_threads | Deep Descent | Threads | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| cp_fc01_instagram | Core Pins | Instagram | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| cp_fc01_youtube | Core Pins | YouTube | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| cp_fc01_tiktok | Core Pins | TikTok | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| cp_fc01_threads | Core Pins | Threads | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| nm_fc01_instagram | Nova Merge | Instagram | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| nm_fc01_youtube | Nova Merge | YouTube | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| nm_fc01_tiktok | Nova Merge | TikTok | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |
| nm_fc01_threads | Nova Merge | Threads | NOT SCHEDULED | — | BLOCKED BY FIRST-RELEASE PLAYBACK GATE |

## Profile-link verification
The Instagram/YouTube/TikTok copy that says to use the profile/channel link still requires native profile website-field verification before it can be considered fully validated. Current connected-account identity is confirmed, but a connected account is not proof that the profile website field is configured correctly. The latest native Instagram profile attempt redirected to `/accounts/login/`; no link absence is inferred.

## Stage-3 completion state
Stage 3 is **not complete**. The first release successfully reached Instagram and the hosted input file matches the approved master. Native platform playback remains unresolved and the other 11 prepared candidates have not been released.

## Stage-4 handoff state
Stage 4 is **not started**. Repository searches for an original LoopJolt MARKETING `Stage 4` / `4구간` specification returned no matching scope, and the available marketing README/checkpoints do not define an exact post-stage-3 stage-4 completion contract. Prior context did not recover that exact contract.

A later connected Notion project-page read located `vibe-arcade/MASTER_PLAN.md` (Sep 19), which supports distribution -> measurement -> KEEP/MODIFY/KILL. Its older account/catalog descriptions have been superseded in part by later approved work. Its monetization Stage 4 is a distant platform-economics phase, NOT this marketing stage 4. Do not substitute an engineering/Game Kit phase or invent a new approved numbered stage.

Next safe action: obtain the minimal native playback/profile evidence described at the top, then resume approved stage-3 execution without duplicate posts. Do not restart unchanged blind hourly access retries. Completion and stage-4 advancement must reflect work actually done.
