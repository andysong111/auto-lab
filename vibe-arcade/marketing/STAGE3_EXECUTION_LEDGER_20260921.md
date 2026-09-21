# LoopJolt marketing stage 3 execution ledger — 2026-09-21

Status: **IN PROGRESS — first Instagram release published; platform playback gate still UNVERIFIED; no fan-out yet.**

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

### Playback / transcoding verification boundary
- Direct public Instagram page retrieval is not available from the current web inspection path.
- Direct download of the Metricool-hosted MP4 is not available from the current container/network path.
- Metricool Reels analytics had not populated the new reel yet at the first post-publication check; reel-level query returned no rows and daily reel counts/views were still `0` at that moment, consistent with analytics ingestion lag and not evidence of failure.
- Therefore actual hosted/platform playback, gameplay motion, audio, crop and freeze integrity are **UNVERIFIED** in this checkpoint.
- No additional networks/games were scheduled or published from this checkpoint.

## Prepared stage-3 candidate ledger
| Candidate | Game | Network | State | Public URL | Playback gate |
|---|---|---|---|---|---|
| dd_fc01_instagram | Deep Descent | Instagram | PUBLISHED | https://www.instagram.com/reel/Ddh9RSXDUJH/ | UNVERIFIED |
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
The Instagram/YouTube/TikTok copy that says to use the profile/channel link still requires native profile website-field verification before it can be considered fully validated. Current connected-account identity is confirmed, but a connected account is not proof that the profile website field is configured correctly.

## Stage-3 completion state
Stage 3 is **not complete**. The first release successfully reached Instagram, but the required hosted/platform playback integrity check remains unresolved and the other 11 prepared candidates have not been released.

## Stage-4 handoff state
Stage 4 is **not started**. Repository searches for an original LoopJolt MARKETING `Stage 4` / `4구간` specification returned no matching scope, and the available marketing README/checkpoints define stage-3 QA/publishing rules but do not define a post-stage-3 stage-4 completion contract. Do not substitute an engineering/Game Kit phase or invent a new approved marketing stage.

Next safe action: re-check provider/public evidence and analytics ingestion, and use any newly available native/platform media evidence to verify real playback. Only after that gate genuinely passes should stage-3 fan-out resume.
