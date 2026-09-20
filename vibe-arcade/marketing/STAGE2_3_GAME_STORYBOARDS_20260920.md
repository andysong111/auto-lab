# LoopJolt Marketing 2-3 — Three game-specific flag-first storyboards

Date: 2026-09-20  
Status: **Scripts ready; footage, rendering and publication not performed.**  
Scope: marketing 2-3, NOT the separate engineering Feel Kit stage with the same number.

## 1. Delivery and boundaries

Three 18-second English FLAG CHALLENGE scripts are specified for Deep Descent, Core Pins and Nova Merge. Each has a first-second hook, six timed shots, capture criteria, truthful outcome handling, cover text, caption and production handoff.

Companion files:
- `stage2-3.storyboards.json` — machine-readable plans, source identities, capture routes and unbound media slots.
- `validate-stage2-3-storyboards.cjs` — planning-only validation and regression self-tests; reuses `validate-flag-content.cjs` from 2-2.

No video was captured/generated, no paid generation was invoked, no ranking score was submitted, and no SNS post was created, scheduled, published or modified. Rendering and publication permissions are explicitly false in this plan. These fields and this validator are **not** an authorization system for external posting tools.

## 2. Source review and corrections

Reviewed repository snapshot: `aaf688f4b3bce503322734475a6cc8b7083c7e34` in `andysong111/auto-lab`.

| Game | Actual internal identity | Capture entry | Source evidence |
|---|---|---|---|
| Deep Descent | `gyro-drop` / `gd-descent-v2` | `/descent/?capture=1` | `descent/core.js`, `descent/app.js`, `descent/view.js` |
| Core Pins | `core-pins` / `cp-phaser-v1` | `/challengers/play?game=core-pins&capture=1` | `challengers/core.js`, `challengers/boot.js`, `core-pins/app.js`, `core-pins/view.js` |
| Nova Merge | `nova-merge` / `nm-phaser-v1` | `/challengers/play?game=nova-merge&capture=1` | `challengers/core.js`, `challengers/game.js` |

Deep Descent must not be confused with the older Gyro Drop implementation in `challengers/core.js`. Core Pins currently dispatches to its separate shared-runtime implementation; Nova Merge still uses `challengers/game.js`.

**National-score wording correction:** the repository's `loopjolt-backend/migrations/20260919_multi_game_rankings_v2.sql` describes one best game score per player and a country game board based on the top ten distinct players. Overall championship points use another aggregation. Therefore remove `ONE RUN = ONE COUNTRY SCORE` and `EVERY VERIFIED RUN COUNTS` as automatic-addition claims. This pilot says `PICK YOUR FLAG` and `PLAY RANKED`, without promising that every replay increases a country total. Live database parity was not checked here.

**Practice is not national evidence:** all three capture paths disable ranked capture. Keep `PRACTICE HIGHLIGHTS` readable throughout the gameplay body; do not attach practice HUD numbers to country flags or show a verified/saved badge.

**Capture analytics caution:** Deep Descent and current Core Pins skip their controller telemetry in capture mode. Nova Merge's legacy `track()` does not have that guard. Before production capture, isolate or filter capture telemetry so automated visits are not interpreted as customers. This stage did not alter application code.

Live website opens were unsuccessful in the browsing environment. Game rules and paths were reviewed in GitHub, not by live playback. Deployed routes, rule versions, UI readability and recorded outcomes remain mandatory checks in 2-4.

## 3. Shared creative decisions

Use five equal invitation flags: KR, US, JP, IN, BR. These are **illustrative entry choices**, not a claim that those countries already compete, nor a paid geographic targeting decision. Use real SVG/PNG flag assets; keep true colors and at least 120 px hero width. Asset retrieval/visual verification is pending.

All three videos use FLAG CHALLENGE. No country rows, score gaps, national winners, rankings, participant counts or live rivalries are asserted. A country-data snapshot was not collected in this stage. Genuine-data formats can be designed later; do not upgrade these scripts to VS merely by filling in invented values.

Shared timing:
- 0–1 s: flags and active real gameplay immediately; one game-specific hook.
- 1–12 s: actual gameplay highlights and a truthful result to the shown attempt.
- 12–15 s: clearly separate graphic identity card, `PICK YOUR FLAG` then `PLAY RANKED`.
- 15–18 s: explicit graphic end card, `LOOPJOLT / PLAY FREE / LINK IN BIO`.

The 12–18 s graphic sections are deliberately not presented as gameplay. Do not use an animated overlay to hide a frozen gameplay recording. No paid narration/music is required; use the game's actual effects and make the story understandable muted.

## 4. Deep Descent — 48 rings, one flag

**Hook:** `WHICH FLAG CLEARS 48?`  
**Cover:** `CLEAR 48?`  
**Narrative:** a guardian gate looks dangerous, the player finds the timing, and the real attempt resolves. The 48 is the full-game target, not a claim of clearing all rings in twelve seconds.

| Time | On-screen English | Actual picture / editing instruction |
|---|---|---|
| 0–1 s | WHICH FLAG CLEARS 48? | Five flags above an already-moving guardian danger moment. No introductory logo card. |
| 1–4 s | FIND THE GAP | Real tower alignment and a clean drop. Show the action/contact relationship. |
| 4–8 s | WAIT. THEN DROP. | Show the actual guardian opening and the player's alignment attempt. |
| 8–12 s | YOUR FLAG. YOUR TURN. | Show the recorded seal break, guardian clear or damage; do not fabricate success. |
| 12–15 s | PICK YOUR FLAG → PLAY RANKED | Explicit graphic identity card; no verified-score animation. |
| 15–18 s | LOOPJOLT / PLAY FREE / LINK IN BIO | Branded end card and the existing profile-link route. |

Capture through ordinary drag/left-right controls. Space or the burst button is used only with full energy. Reach the guardian naturally and retain the complete practice recording. Guardian indexes are 15, 31 and 47 in the zero-based rule state; later guardians have multiple seals. A charged burst breaks **one seal**, not an entire multi-seal encounter.

Do not label a seal break as a boss defeat. Do not label a partial run as a 48-ring clear. A genuine failure remains usable; the script's final line does not assert victory.

Caption:
> Which flag are you playing for? Take on 48 rings in Deep Descent. This clip shows practice highlights. Pick your flag and try ranked on LoopJolt. Play free via the link in bio.

Tags: `#LoopJolt #DeepDescent #BrowserGames`

## 5. Core Pins — the narrow safe angle

**Hook:** `WHICH FLAG NAILS IT?`  
**Cover:** `NAIL IT?`  
**Narrative:** show the hazard crossing the firing line, then let the real decisive throw answer the challenge.

| Time | On-screen English | Actual picture / editing instruction |
|---|---|---|
| 0–1 s | WHICH FLAG NAILS IT? | Flags and a crowded rotating core. Preserve the bottom launcher. |
| 1–4 s | WAIT FOR THE GAP | A real pin or red hazard passes the launch axis. |
| 4–8 s | TAP. STICK. REPEAT. | Clean throws into actual openings. Do not splice a collision into a fake perfect streak. |
| 8–12 s | YOUR FLAG. YOUR TURN. | The real stage-ending throw or collision resolves the tension. |
| 12–15 s | PICK YOUR FLAG → PLAY RANKED | Explicit identity card. |
| 15–18 s | LOOPJOLT / PLAY FREE / LINK IN BIO | Explicit branded end card. |

Use tap/Space input. The canonical throw is at screen-space angle 900, from below. Existing pins and red hazards cause collisions. The stage target is `min(15, 6 + stage * 2)`; every fourth stage is a boss stage.

A boss is optional and must be actually reached. `ONE PIN LEFT` is permitted only if source evidence shows `target - stageHits === 1`; it is not hard-coded into the pilot. Similarly, do not invent a one-shield situation. Preserve the core, hazards and launcher in the critical safe area.

Caption:
> Which flag can nail the next shot? Time your pins and avoid the collisions in Core Pins. Practice highlights shown. Pick your flag and try ranked on LoopJolt. Play free via the link in bio.

Tags: `#LoopJolt #CorePins #BrowserGames`

## 6. Nova Merge — a real space-saving chain

**Hook:** `WHICH FLAG SAVES THIS?`  
**Cover:** `SAVE THIS?`  
**Narrative:** a cramped board, a readable incoming orb, a real matching move, then visible space gained.

| Time | On-screen English | Actual picture / editing instruction |
|---|---|---|
| 0–1 s | WHICH FLAG SAVES THIS? | Flags over a cramped real board, with an actual drop/action already underway. |
| 1–4 s | PICK THE COLUMN | Show the incoming orb and a non-full matching column. |
| 4–8 s | MATCH. MERGE. CHAIN. | A real vertical merge followed by matching-neighbour resonance. |
| 8–12 s | YOUR FLAG. YOUR TURN. | Show newly freed space and the next real drop. |
| 12–15 s | PICK YOUR FLAG → PLAY RANKED | Explicit identity card. |
| 15–18 s | LOOPJOLT / PLAY FREE / LINK IN BIO | Explicit branded end card. |

Use keys 1–7 for precise column input or normal taps. Keep the next orb and all seven columns visible. The board has eight-row capacity per column; equal vertical tops merge and matching neighbour tops can produce resonance.

Important: **dropping into a full column ends the run before a merge can rescue that drop.** Never storyboard an impossible full-column rescue or replace this column-based game with generic falling-ball physics footage.

Capture preference: at least two columns at seven or more rows, with a valid non-full merge opportunity. The source must visibly show the vertical merge, neighbour resonance and space gained. If that source event is not captured, recapture or revise the script truthfully; never manufacture the chain. This scene has not yet been recorded.

Caption:
> Which flag finds the saving chain? Match orbs and make space in Nova Merge. Practice highlights shown. Pick your flag and try ranked on LoopJolt. Play free via the link in bio.

Tags: `#LoopJolt #NovaMerge #PuzzleGames`

## 7. Make the 2-2 geometry implementable

The previous `900 x 1240` gameplay safe rectangle is only **53.82%** of a `1080 x 1920` frame. Treating it as the entire footage crop would contradict the separate 65% gameplay-area requirement.

For this pilot, preserve that rectangle as the **critical-action safe area**, while placing native-aspect gameplay behind it:

| Game | Native canvas | Footage rectangle x,y,w,h | Area remaining after both opaque plates |
|---|---|---|---|
| Deep Descent | 600 x 840 | 0,140,1080,1512 | 66.46% |
| Core Pins | 720 x 900 | 0,285,1080,1350 | 65.40% |
| Nova Merge | 720 x 900 | 0,285,1080,1350 | 65.40% |

Competition plate remains x=60,y=70,w=960,h=230. Use a smaller CTA plate within the existing CTA zone: x=80,y=1540,w=920,h=110, ending at y=1650 rather than behind the bottom-250px app-control exclusion.

Flags occupy y=78–158; the single-line 72 px hook uses y=164–254; the readable 24 px practice disclosure uses y=267–297. Game action remains inside the original safe area. Supporting instructions replace the top hook rather than introducing extra opaque plates.

These are **geometric planning calculations**, not a rendered visual pass. Actual font fit, flag aspect ratios, action visibility and any additional overlays must be reviewed/recalculated in 2-4. Do not stretch the native game image or lower the type size below the approved minimum to force a fit. Existing 2-2 files are unchanged.

For the separate cover, move the flag row to y=450 and the short cover hook to y=565, inside x=108–972 / y=420–1500. Choose a real frame after capture. The top-of-video flags would otherwise disappear from the centered cover crop.

## 8. Validation performed and remaining gates

Run from `vibe-arcade`:

```sh
node marketing/validate-stage2-3-storyboards.cjs --self-test
```

Local execution under Node v22.16.0: **35 planning tests passed** (one valid three-game pack plus 34 rejected mutations). All three flag payloads also pass the existing 2-2 validator. The local copy of that validator was checked against Git blob SHA `2c3bdd2130b7232e656c7db294728517bfe6639e`.

Rejected cases include fabricated country scores, duplicate flags, late flag entry, missing practice disclosure, false media claims, incorrect Deep Descent identity, overlapping/gapped cuts, a weakened freeze rule, a hidden CTA, cropped cover flags, distorted footage, insufficient gameplay area and unsupported national-lead copy.

This validates the **plan**, not the quality of footage, production rules, actual engagement or conversion. There is no production mode in this validator. All `media` / cover-frame slots remain null and source time windows remain empty until recording.

Before a real video can be scheduled:
1. Recheck the deployed route/version, capture in a fresh logged-out practice context, isolate capture telemetry and resolve real flag assets.
2. Attach the complete raw source, hash, source time windows, actual outcome and event/input evidence where available. Use only normal controls; no state injection or ranked bot submissions.
3. Render a review copy. Decode the whole file; scan the whole output **and the gameplay ROI** for freezes. Reject unplanned static gameplay at or above 0.60 s. The declared 12–18 s graphic cards are intentional, not hidden frozen footage.
4. Inspect 0/25/50/75/100% frames, watch the entire file at 1x, check actual type/action-safe bounds and review the centered cover crop.
5. Only a separately approved production/publishing workflow may schedule the checked media. A passing storyboard test never substitutes for those checks.

## 9. Distribution and user decisions

Keep the channel profile links already defined in `PROFILE_LINKS.md`: `/ig`, `/yt`, `/tt`, `/th`, `/fb` on the existing LoopJolt production host. The default CTA stays `LINK IN BIO`; do not promise that an arbitrary caption URL is clickable.

For future direct game links, use campaign `flag_challenge_pilot_20260920`, medium `organic_social`, and content IDs `dd_fc01`, `cp_fc01`, `nm_fc01`. Existing shared bio links identify the channel, not reliably the individual video; do not report them as exact per-video conversion attribution.

**No user decision is required to finish this stage.** Existing flag-first direction, English copy, real gameplay, no invented rankings and no publishing are sufficient to choose these reversible pilot scripts.

Ask before new paid generation/spending or a strategic change in account positioning, targeting or budgets. Do not ask the user to choose technical capture details that can be verified directly. Missing factual media evidence is a production gate, not a reason to invent claims.

Next bounded task: **marketing 2-4 — record actual practice footage and create review copies of these three scripts, starting with Deep Descent.** Public posting remains a separate action after media checks. No future work is scheduled by this checkpoint.
