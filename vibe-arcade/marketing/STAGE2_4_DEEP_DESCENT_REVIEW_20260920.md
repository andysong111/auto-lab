# Marketing 2-4 — Deep Descent first review

Date: 2026-09-20
Status: **Deep Descent review v1 produced. Core Pins and Nova Merge review videos remain pending. No social publishing or scheduling.**

## Deliverables

Delivered as files in the working chat, not uploaded into the public website or this repository:
- `LoopJolt_DeepDescent_Review_v1.mp4`: 1080x1920, 30 fps, 540 frames, exactly 18.0 seconds, H.264/AAC, 8,172,084 bytes.
- SHA-256: `0ba456b426eb2ddcc52de8c3535b604e6ca6665c022de9490257f10f7fe5d482`.
- `LoopJolt_DeepDescent_Cover_v1.jpg`: separate cover composed from a real captured frame; centered crop reviewed.
- Capture evidence, original-source recording, rendering/QA scripts and detailed local reports retained in the review package.

The video is a review deliverable, not evidence of audience engagement, customer conversion or an actual national result. No new paid image/video generation was invoked.

## Actual source capture

A real unmodified `gd-descent-v2` practice run was played through normal browser keyboard controls, guided automatically from the public read-only diagnostics. The run was not a human skill record. No game-state setter, fake score, accelerated clock, simulated completion, mocked player or ranked submission was used.

The existing `descent-workspace` build artifact was retrieved from GitHub Actions run `35508740207`, artifact `10603874170`. The core, controller, presentation, art and runtime blobs were checked against the preceding reviewed main snapshot:

| File | Git blob SHA |
|---|---|
| descent/core.js | 9105ceafbd16856f1aace9823a4c49b981148f88 |
| descent/app.js | 7c9efab2d33c24b9af3a39a3b5acfcfe41ee954f |
| descent/view.js | b1096dfcdbd902b7144736a0e0b4717353128094 |
| descent/art.js | 9528c1b0fc75ff6abcc33a64687474492f50f954 |
| runtime/core.js | 9fcf2cb39ef4777baefb996905bf0fb5badb0479 |

Browser URL navigation was restricted in this environment. Therefore the exact local JS/CSS sources were loaded into an offline browser document at `about:blank?capture=1`; application rules were not replaced. This is **local build verification, not a deployed-site playback test**.

The fresh context had no login. Ranked entry was disabled by capture mode. The attempted remote configuration GET was blocked, and no score POST was allowed or issued. Browser page errors: zero.

The complete captured source is approximately 49.675 seconds. The real practice simulation ended at tick 2940, cleared 48 rings and six guardian seals, and reported `engine_reached`. Those private practice results are not shown as country records in the advertisement.

The original canvas is 600x840 and is scaled proportionally for the 1080x1920 composition; this is not a claim of native 1080-pixel gameplay rendering. Original game audio was captured through an output tap, with no purchased music or generated voiceover.

## Edit used

The gameplay body uses one continuous chronological source window, **27.85–39.85 seconds**, at normal speed. It shows the Prism Sentinel encounter, real seal breaking, real guardian clearance and continued descent. There are no fabricated successes or replayed shots represented as new actions.

| Output | Editorial overlay |
|---|---|
| 0–1 s | WHICH FLAG CLEARS 48? |
| 1–4 s | FIND THE GAP |
| 4–8 s | WAIT. THEN DROP. |
| 8–12 s | YOUR FLAG. YOUR TURN. |
| 12–13.5 s | PICK YOUR FLAG |
| 13.5–15 s | PLAY RANKED |
| 15–18 s | YOUR FLAG. YOUR TURN. / PLAY FREE / LINK IN BIO |

Exact encoded transitions can differ by one frame because of frame/sample alignment. The 12–18 second sections are explicitly graphic cards, not frozen footage passed off as active gameplay.

KR, US, JP, IN and BR flags are equal invitation choices, not evidence that those countries currently participate or compete. Real pinned flag-icons 7.5.0 assets were used without recoloring. The practice disclosure remains visible during gameplay. No country score, rank, gap or winner is added.

## Production adjustments

- The 4:3 hero flags are 120x90 pixels, correcting the earlier 80-pixel row-height assumption without distorting the assets.
- Inter Display ExtraBold / Inter Medium were used as available local font substitutes. No font files are included in the deliverables. The 72-pixel hook fits within the 960-pixel competition plate.
- The CTA plate ends at y=1650. The native-aspect footage placement preserves the earlier approximately 66.46% theoretical unobscured gameplay coverage.
- The separate cover uses an actual source frame at approximately 30.0 seconds, repositions the footage without changing aspect ratio, and places the flag row and `CLEAR 48?` inside the centered x=108..972, y=420..1500 crop. The crop was inspected.

## Actual media checks

| Check | Result |
|---|---|
| Complete source decode/conversion | No decode errors |
| Complete final-file decode | Exit 0; no errors |
| Dimensions / frames / duration | 1080x1920 / 540 / 18.0 s |
| Whole-output freeze scan | Static intervals detected only in the declared graphic-card section |
| Gameplay ROI 900x1240 at (90,300), -50 dB / 0.60 s | No freeze events in 0–12 s |
| Tighter action ROI 790x920 at (145,420), -45 dB / 0.60 s | No freeze events in 0–12 s |
| Automatic real-time playback | Reached ended at 18.0 s, playbackRate=1; wall time 18.162 s |
| Browser playback quality | 540 decoded frames; zero dropped frames; no waiting or stalled events |
| Largest video-frame callback gap | Approximately 100.1 ms |
| Audio | Original game audio; measured peak -10.4 dB, no clipping indicated |
| Visual checks | 0/25/50/75/100% checkpoints, half-second contact sheets and centered cover crop inspected |

The automatic playback test is **not** a claim that a human watched and approved the whole file. Subjective creative approval and actual social-app preview are still pending. The static graphic cards are intentional; do not disable the gameplay freeze guard because these cards are present.

## Handoff and decision

The next user-facing judgment is whether the flag-first challenge reads immediately and whether this tone/pacing should be reused for Core Pins and Nova Merge. No new budget or technical capture decision is needed now.

Keep review, publishing permission and proven national competition data separate. Before any public post: confirm the actual profile-link destination, review the platform crop/preview, and pass the applicable media gate. Do not infer publishing permission merely from these successful file checks.

Next bounded work: revise this first review if required, then produce the Core Pins and Nova Merge review copies using their verified mechanics. Do not claim all of marketing 2-4 is complete yet.
