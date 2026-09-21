# LoopJolt marketing 3-3 — hosted media verified, native review blocked

Date: 2026-09-21. Latest native observation: 11:55:39 KST.
Status: **Stage 3 IN PROGRESS / native evidence required. One of twelve candidates published; eleven not scheduled. Stage 4 NOT STARTED.**

This checkpoint supersedes the hosted-input access limitation in `STAGE3_EXECUTION_LEDGER_20260921.md`; it does not supersede the native playback gate or falsely close stage 3.

## Current release and unchanged scope

Fresh Metricool reads confirmed brand 7005118 maps to Instagram `playloopjolt`, Threads `playloopjolt`, TikTok `loopjolt2` and YouTube `UCKl5Kh2Nju1C67mBBcVb7Mw`.

The first release remains:
- Candidate: `dd_fc01_instagram`
- UUID: `9065192409182392302`; current ID: `379085442`
- Provider status: **PUBLISHED**, detailed status `Published`
- Public URL: https://www.instagram.com/reel/Ddh9RSXDUJH/
- Scheduled publication: 2026-09-21 10:15 Asia/Seoul
- Hosted input: https://static.metricool.com/planner/202609/7005118-file-14822683884890234499.mp4
- Cover: video frame at 1000 ms, NOT the custom JPEG
- Caption: approved stage-3 Instagram copy, unchanged

There are no additional newly scheduled candidates in the inspected Sep 21–25 range. The fifteen older drafts remain `draft=true`, `autoPublish=false`; no social records were written by this inspection.

## A blocked inspection was replaced with a new evidence route

Repeated hourly checks could not retrieve native Instagram media or the hosted input in their environment. The existing continuation task was paused during this session to avoid blind repeated checks and concurrent writes. It remains paused pending meaningful new native evidence; this is not a cancellation of the owner's authorization.

A bounded, read-only GitHub Actions collector was created on branch `marketing/stage3-hosted-media`, separate from production application code. It uses the existing pinned Playwright 1.55.0 inspection stack and FFmpeg, with no credentials, sign-in, proxies, stealth browser settings, engagement actions, score submissions, or paid services.

Evidence runs:
- First source inspection: `35555517512`, artifact `10619864348`, source commit `1a94fefbef857eb3889edd9d9698ce680eabd0af`.
- Independent native-page inspection: `35555707959`, artifact `10619889671`, source commit `9dc500cfae47e49e79df6352de1fba6143d1adf1`.
- The second artifact ZIP SHA-256 is `e75f53a9cc0c96ff7fe1fc624a283e03a7ff0a51511530fd5654d41dad219272`.

Both evidence archives were downloaded and inspected in the working environment. The diagnostic workflow's incomplete-gate result is intentionally failure; do not confuse that with a failed Instagram publication or corrupted video. The generic repository CI passed. The diagnostic scripts are retained on their branch; they were not merged into production in this session.

## Hosted input — file gate PASSED

The actual Metricool-hosted MP4 was successfully downloaded from GitHub Actions. It was compared with the approved local Publish_v1 master:

| Check | Observed result |
|---|---|
| Bytes | 10,880,135 |
| SHA-256 | `e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad` |
| Full byte comparison with approved master | Identical |
| Video | 1080 x 1920; 30 fps; 540 frames; 18.0 seconds |
| Full decode | No errors; confirmed again locally |
| Audio | AAC stereo 48 kHz present; measured peak -10.4 dB |
| Gameplay ROI freeze scan | No unplanned >=0.60-second hold in 0–12 seconds |
| Whole-frame static periods | Only the previously declared 12–18-second graphic cards |
| Visual checkpoints | 0 / 4.5 / 9 / 13.5 / 17.9-second frames opened and inspected |

This closes the formerly missing **hosted-source byte/file inspection**, without changing the master or relaxing the freeze threshold. The frames show the expected flags, gameplay and CTA with no blank checkpoint.

A new local-browser 1x playback attempt timed out waiting for the video element's ready state. That readiness timeout is reported rather than counted as a fresh successful playback. The earlier approved-master playback test is historical evidence on the identical bytes, not a new test on the Instagram transcoded copy.

## Native Instagram — publication identity confirmed, playback UNVERIFIED

The second collector checks Instagram independently so a local-player timeout cannot skip native evidence collection.

At 2026-09-21T02:55:39.684Z:
- Exact Reel URL returned HTTP 200 and stayed on `/reel/Ddh9RSXDUJH/`.
- Visible text contained account `playloopjolt` and the approved opening caption `Which flag clears 48`.
- The screenshot showed Instagram's **Sign up / Log in modal** over the post.
- No video element was available (`videoElements=0`).
- The account profile navigated to `/accounts/login/`; the actual profile website field was not retrievable.
- No native transcoded MP4 or successful native video playback was obtained.

The screenshots and report were opened/inspected. A short browser recording of the access attempt is retained, but it is NOT a successful playback recording. We did not remove/bypass the login requirement. This is a verified **inspection-access blocker**, not evidence that the public Reel itself is broken or that the profile link is absent.

Instagram Reels analytics for today through 11:45 KST returned an empty row set. Do not report zero views, infer no demand, or treat analytics ingestion as proof of video integrity.

## State by candidate

| Candidate group | Count | Publication | Native playback |
|---|---:|---|---|
| Deep Descent Instagram | 1 | PUBLISHED, exact URL above | UNVERIFIED; login wall |
| Deep Descent other three channels | 3 | NOT SCHEDULED | Blocked by first-release gate |
| Core Pins four channels | 4 | NOT SCHEDULED | Blocked by first-release gate |
| Nova Merge four channels | 4 | NOT SCHEDULED | Blocked by first-release gate |

Routine posting authorization already exists. No fresh strategic/publication approval is needed merely to continue the same approved rollout. What is missing is native playback and profile-link evidence.

## Smallest owner input / resumption rule

Ask for **one screen recording from the owner's already logged-in Instagram app**: show this exact published Reel playing from the beginning to the end with sound, then show the account profile's website link and open it to the intended game site. Avoid recording passwords, login codes, messages or unrelated private information.

Inspect that evidence for the correct post, gameplay motion, audio, end card and actual link destination. A screen recording is observational device evidence; it is not a byte-identical platform source or proof about every device. Record that distinction. If the evidence passes the applicable first-release checks, resume the prepared, authorized eleven candidates in controlled stages, validating their hosted inputs and relevant platform copies rather than marking scheduled items complete.

Do not restart repeated identical network failures, duplicate the existing Reel, modify the old drafts, or bypass the native evidence gate. Additional account integration is an alternative only when properly connected and needed; never ask the owner to paste credentials into chat or the repository.

## Stage 4 scope recovery

The connected Notion project page `3de1b448-28b1-8196-ba8e-e809e867fa2e` led to `vibe-arcade/MASTER_PLAN.md` (last updated Sep 19; blob `33f0099e2c24cc2466a4152ebed5d19f57193c46`). It establishes distribution, external-session/game-start/replay measurement, and KEEP/MODIFY/KILL decisions. Some older catalog/account rules are superseded by later approved work.

It does **not** recover an exact original post-stage-3 MARKETING stage-4 specification. Its monetization 'Stage 4 — platform economics' is a distant traffic-dependent phase and must not be substituted. Read-only measurement is supported by the business master plan, but no stage-4 completion or implementation is claimed here.

## No unintended changes

No new SNS publication or schedule, old-draft modification, game account, score, ranking data, Option A policy, account ownership/security setting, ad budget, or purchased service was changed. The only durable repository changes in production are this diagnostic checkpoint and the ledger update; diagnostic code is on its separate branch.
