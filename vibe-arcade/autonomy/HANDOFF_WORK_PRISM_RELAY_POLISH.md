# Prism Relay bounded AI polish — REJECTED / release HOLD

**Final commissioning outcome: REJECTED at v6, lifetime repair attempt 5/5. Do not merge or publish.** The owner-authorized two remaining AI repairs improved goal clarity, visible device best and route complexity, but did not meet all four public-quality requirements. No third polish call, budget reset, manual candidate patch, second game or production action was used to force a PASS.

This document supersedes the previous v4 READY_TO_SHIP recommendation for release decisions. Historical v4 evidence remains intact. The original RC branch still contains **v4**, not v6.

## Identity and repository state

- Game: Prism Relay; `GAME-20260922-110`; mechanic family `spatial-optical-routing`.
- Starting version: v4, READY_TO_SHIP, repair attempt 3. Final version: v6, REJECTED, repair attempt 5.
- Infrastructure/evidence branch: `commissioning/prism-relay-polish-20260922`.
- [Draft PR #46](https://github.com/andysong111/auto-lab/pull/46), based on the unmerged first-commissioning branch / PR #44. No main merge.
- [Original Draft RC PR #45 — marked HOLD](https://github.com/andysong111/auto-lab/pull/45), branch `factory/GAME-20260922-110`.
- **v6 source SHA-256:** `7127269016507a824d8df8726a509f3cef3c94215e68d99a56252bcc14fd0dc8`.
- **v6 RC commit / Preview:** none; failed QA prevents RC publication. No v6 byte-identical Preview smoke or successful release packet is claimed.
- Historical v4 RC commit: `73dd47cbc50db6825c2fcc9d6a19d60136cd5818`.
- Historical protected [v4 Preview](https://vibe-arcade-ivrp070e0-a2bsangsa.vercel.app/autonomy/games/GAME-20260922-110/v4/). It is not a preview of the polish result.
- Unchanged production / rollback base: `c64d9f10d8a0f099603e5a6a9b78f1ad1d823a2d`.
- `production.authorized=false`, repository intake OFF, `AUTO_PRODUCTION_SHIP=false`; no homepage, sitemap, ranking, Supabase, auth/country, SNS or advertising changes.

## Four owner goals: result and concrete limits

| Goal | Actual improvement | Remaining limit |
| --- | --- | --- |
| First-five-second goal | Large visible DOM heading **LIGHT 3 RECEIVERS**; short control line; visible 0/3 → 1/3 → 2/3 → 3/3. Six normal-input playthroughs verified every milestone. | Three small decorative medallions do not individually fill. Mobile canvas subtitle and score/circuit text overlap despite zero page overflow. |
| BEST SCORE | Visible DEVICE BEST / LOCAL PRACTICE, separated from CURRENT SCORE. It reads the actual GameKit snapshot.best; capture best survives restart in memory. | Versioned device-local practice record, not ranked/global best. Separate model-free audit checks ordinary local persistence and reload; see audit results below. |
| Spatial depth | Visible mandatory routing gates, three different receiver targets; optimal clockwise rotations rise **2 → 4 → 6** and changed prisms **1 → 4 → 4** for all six seeds. Normal keyboard/touch inputs clear every board. | Only three target-dependent route templates; seed changes receiver order and distractors. Gates prescribe one route. More actions are proven; broad puzzle diversity, replay value and human difficulty are not. |
| Sound and completion feedback | Original WebAudio tones for rotation, charge, complete and failure; lazy single context, bounded short oscillator envelopes, sound toggle; original glow/pulse and complete/incomplete result. | No distinct beam-connect audio event. Reduced-motion is read at load but not updated when the preference changes during a session. Completion overlay remains sparse; mobile text collision and terminal generic Progress 33 (elapsed-time progress) undermine clarity. This goal is incomplete. |

No numerical fun score, retention claim, or Astra/Descent parity claim is made. The fourth goal and listed presentation weaknesses keep public release on HOLD.

## Real AI calls and costs

Used the existing official OpenAI Responses provider and **gpt-5.6-terra** with the existing secret store. Work did not author or change candidate source. [Source provenance](evidence/prism-polish/source-provenance.json) verifies every generated file byte against its latest successful provider response; GameKit and manifest are Factory-supplied.

| Operation ID | Version | Input tokens | Output tokens | Estimated USD | Lifetime cumulative USD |
| --- | --- | ---: | ---: | ---: | ---: |
| GAME-20260922-110/build/v1 | v1, prior work | 2,533 | 5,853 | 0.115486 | 0.115486 |
| GAME-20260922-110/repair/1 | v2, prior work | 8,289 | 6,823 | 0.155970 | 0.271456 |
| GAME-20260922-110/repair/2 | v3, prior work | 9,414 | 6,541 | 0.155394 | 0.426850 |
| GAME-20260922-110/repair/3 | v4, prior work | 9,319 | 6,655 | 0.15706601 | 0.58391601 |
| GAME-20260922-110/repair/4 | v5, this work | 18,117 | 7,529 | 0.207990 | 0.79190601 |
| GAME-20260922-110/repair/5 | v6, this work | 11,427 | 3,605 | 0.110598 | 0.90250401 |

**This work: 2 calls, 29,544 input / 11,134 output tokens, USD 0.318588 estimated. Lifetime: 6 calls, 59,099 input / 37,006 output tokens, USD 0.90250401 estimated.** No billing API invoice is available. Estimates use reported usage × conservative USD 4 input / USD 18 output per million, ignoring cache discounts; [official pricing](https://developers.openai.com/api/docs/pricing) rechecked 2026-09-22 lists standard short-context Terra at 2/12. These are model estimates only, not a claim that CI/Vercel usage is free.

[Complete durable ledger](evidence/prism-polish/provider-ledger.json) includes all six response IDs, request hashes, reservations and cached file outputs. All operations are COMPLETE, no ambiguous submission retried. Secret values are absent. Limits remained six lifetime calls, five repairs, USD 2, one worker; all are preserved, not reset.

## Build / repair chronology

The [actual paid workflow](https://github.com/andysong111/auto-lab/actions/runs/35719738363) ran commit `4930ea643ee661204153fde0d93be0f57801a8a1` with Docker image `sha256:48131135cb51e969c3554e0c4645e1f611dd6a165fb192903ad71991654a4a08`.

1. Restored the previous exact candidate state and four-operation provider ledger; verified provenance. Copied the previously verified final READY manifest from GitHub evidence. Original source bytes were unchanged.
2. Archived v4's earlier QA and used the existing READY_TO_SHIP → QA_RUNNING transition. Existing common QA passed; new owner-scoped checks documented absent goal/best/audio and shallow route costs. Factory generated [repair 4](evidence/prism-polish/factory/repair-4.json).
3. AI repair 4 produced v5, adding the visible objective/best, gates, staged boards, WebAudio, toggle and basic reduced-motion support. Existing common QA passed, but all six normal-input solution tests failed to charge the first receiver. The final-column builder used `stage.rows[x + 1]` when x=3, producing an undefined row / non-finite outlet. Factory generated [repair 5](evidence/prism-polish/factory/repair-5.json).
4. AI repair 5 replaced only core.js. It fixed the final-column target calculation, shuffled receiver order by seed and constructed finite solvable routes with 2/4/6 minimum costs. All six playthroughs reached 3/3, 384 points and tick 900 (15 simulated seconds); timeout failure remains reachable at 45 seconds.
5. Original final extra QA reported `polish_audio` and `polish_reduced_motion`. Existing Factory enforced the exhausted 5/5 repair limit and set REJECTED. No new RC was created. [Full repair history](evidence/prism-polish/factory/repair-history.json) and the original starting history are both retained.

The same Factory history row for repair 3 was updated when stricter v4 QA ran; [starting history](evidence/prism-polish/polish-starting-repair-history.json) preserves the earlier PASS. No historic provider operation was altered.

## QA correction and honest interpretation

A post-run source/evidence review found an error in Work's **QA instrumentation**, not the candidate: reading `oscillator.frequency.value` immediately after scheduling can still return its initial 440 Hz. The candidate schedules 330 / 523 / 784 / 165 Hz with `setValueAtTime`. The original "pitches indistinguishable" result is therefore not reliable evidence of a game audio defect.

The trusted probe was corrected to record actual scheduled AudioParam values, with a regression test proving that three scheduled pitches remain distinguishable when all immediate getters return 440. A **model-free Docker audit** runs on exactly the same v6 bytes and preserves the original QA, REJECTED state, ledger and repair counter. It also runs local-practice persistence independently even if another polish check fails. The corrected audit does not reset or resurrect the rejected job.

The reduced-motion issue is real: app.js samples matchMedia only once and has no change listener. View code suppresses particles/pulse when the initial option is true, but retains motion if the OS preference changes after load. Beam-connect sound is also absent from the event/tone map; rotate/charge/success/failure exist.

A diagnostic limitation of the first v5 pass: per-seed reachability failure stopped the later lifecycle audio/motion checks, so repair 5 received only the route failures. Future test scheduling should collect independent UI/toggle/preference failures before full playthrough, reducing wasted repair opportunities. This task did not authorize a sixth repair to compensate.

[Corrected audit run 35720946442](https://github.com/andysong111/auto-lab/actions/runs/35720946442) executed commit `500a07a20d86a13df6719dbf434db1448763b36f`, with **zero model calls**. [Audit report](evidence/prism-polish/qa-audit/qa.json) / [immutability summary](evidence/prism-polish/qa-audit/summary.json):

- Sound on/off, actual scheduled tone differentiation, one AudioContext, <=8 concurrent voices and pause-time drainage PASS. The initial audio-frequency failure is superseded by this corrected measurement.
- Ordinary local practice on seed 314159 finished with device best 383; restart and page reload both retained it. Exactly one write to the expected GameKit local key, no other effects. Capture contexts had zero writes.
- Reduced-motion **at page load PASS**: system=true, presentation.reducedMotion=true after reload.
- Reduced-motion **changed during the session FAIL**: system=true, presentation.reducedMotion=false. This is the only corrected automated polish hard failure.
- Six seeded normal-input solves still pass. Console/page errors and capture side effects remain zero.
- Source hash, full provider ledger, Factory manifest and original QA are unchanged. Factory stays REJECTED; no terminal-state escape or extra repair was added.

## Multi-seed evidence

The independent oracle enumerates every valid route through the visible four-column board and gate constraints, calculates actual forward-rotation cost, then the browser performs the solution via keyboard or CDP touch. No canonical state, score or victory injection. [Full boards, paths and measurements](evidence/prism-polish/difficulty.json).

| Seed | v4 shortest rotations, stages 1/2/3 | v6 shortest rotations | Receiver rows | Inputs |
| --- | --- | --- | --- | --- |
| 1 | 1 / 0 / 2 | 2 / 4 / 6 | 1 → 2 → 0 | Touch, 390×844 |
| 7 | 2 / 2 / 2 | 2 / 4 / 6 | 1 → 0 → 2 | Keyboard, 768×1024 |
| 23 | 1 / 1 / 1 | 2 / 4 / 6 | 1 → 0 → 2 | Touch, 390×844 |
| 89 | 1 / 0 / 1 | 2 / 4 / 6 | 0 → 2 → 1 | Keyboard, 1280×800 |
| 2026 | 1 / 0 / 1 | 2 / 4 / 6 | 0 → 2 → 1 | Touch, 390×844 |
| 4294967295 | 1 / 1 / 2 | 2 / 4 / 6 | 1 → 0 → 2 | Keyboard, 1280×800 |

Every v6 row solved three boards, displayed 0/3 → 1/3 → 2/3 → 3/3 and reached 384 points, with one/four/four changed prisms. No impossible board appeared in this sample. This is not exhaustive proof over all 2^32 seeds, nor a human speed benchmark. Seed 23 is not special-cased; source uses seeded receiver permutations and cosmetic distractors around three fixed route templates.

## Browser QA, quality and release gates

- Original common Docker Chromium checks passed on v6 at **390×844, 768×1024 and 1280×800**: HTML/assets, start, real-clock tick, keyboard/touch effects, progress/interaction, terminal/restart, pause/resume, hidden/pagehide, overflow, resource/freeze limits and capture safety.
- Console/page errors: zero. Capture network/production/persistence attempts: zero.
- Added polish QA: FAIL; merged Factory qa.json is correctly `passed:false` despite baseline PASS.
- Quality gate: not reached for final v6; exhausted QA repair budget sets `quality_status=REJECT` and `release_status=REJECTED`.
- [Release-review command](evidence/prism-polish/release-review-packet.json) correctly refuses the candidate: not ready, QA/quality not PASS, release not ready, Preview missing. `production.authorized=false`.
- **Metadata caveat:** the raw rejected manifest retains the predecessor's branch/PR/rc_commit fields through the existing repair code. Those fields point to v4; they are not proof of a v6 RC. The failed release packet and this document explicitly distinguish them.

The workflow is green because REJECTED is a valid bounded commissioning outcome. **Green CI does not mean this game passed polish or can ship.** Existing production regression and Worker isolation checks passed. Final evidence-head CI is recorded in [PR #46 checks](https://github.com/andysong111/auto-lab/pull/46/checks) and the PR description.

## Visual and gameplay evidence

These are actual Docker Chromium screenshots, not generated mockups:

- [Mobile entry / visible objective](evidence/prism-polish/factory/v6/polish/viewport-390-entry.png)
- [Mobile mid-game / 1 of 3](evidence/prism-polish/factory/v6/polish/viewport-390-midgame.png)
- [Desktop mid-game](evidence/prism-polish/factory/v6/polish/viewport-1280-midgame.png)
- [Mobile 2 of 3](evidence/prism-polish/factory/v6/polish/viewport-390-charged.png)
- [Mobile success / device best](evidence/prism-polish/factory/v6/polish/viewport-390-success.png)
- [Mobile incomplete result](evidence/prism-polish/factory/v6/polish/viewport-390-failure.png)
- [Short gameplay capture, WebM](evidence/prism-polish/factory/v6/polish/viewport-390-playthrough.webm) — accelerated diagnostic normal-input recording, not human play; it is not an audible soundtrack evaluation.

| Baseline comparison | Concrete observation |
| --- | --- |
| Goal clarity | v6's large DOM objective is substantially clearer than its v4 entry and now names the win target. Descent's entry remains stronger in Play emphasis; no parity claim. |
| Feedback | Prism adds short original synth cues and receiver glow/pulse. It lacks a distinct connect cue and the layered environment/impact feedback of Astra/Descent. |
| Progression visibility | Receiver fraction is explicit and actual route edits increase. Unlike Astra's gates/worlds and Descent's rings/sectors, Prism uses three template routes. Its extra elapsed-time "Progress 33" on success is confusing. |
| Result presentation | Clear complete/incomplete label and local best exist. Presentation is still a simple dark overlay and repeated DOM label; the stronger baseline completion composition is not matched. |
| Visual density | Board remains readable on desktop, with added amber gates. Mobile internal canvas labels overlap and some hints are small. Page overflow QA cannot detect this internal text collision. |

Astra Sentinel V3 / Deep Descent were quality references only. Their source, art and mechanics were not given to the polish provider or copied.

## System changes vs candidate changes

**Candidate:** only real AIRepairAdapter outputs. v5 updated six generated files; v6 updated core.js. No Work hand-edit. [Reviewable exact source snapshots](evidence/prism-polish/source/) have `.txt` appended so rejected HTML is data rather than an extra runnable game route. Removing that suffix reproduces the original bytes. Complete provider responses are also in the ledger.

**Trusted system:** a scoped polish contract and independent browser oracle/evidence checks; existing prompt compiler carries that QA contract; Docker runner exports extra screenshots; corrected AudioParam instrumentation. A trusted continuation utility records one explicit 45-minute follow-up clock because the original commissioning's 60-minute clock had expired. It preserves the original started_at, prior operation hashes, all lifetime budgets and only allows operation IDs repair/4 and repair/5. The ordinary worker never creates this authorization. Retry cannot extend it; unknown responses and exhausted jobs fail closed. Subsequent hardening writes the prepare completion marker last and respects stricter configured time caps.

Tests: 44 Factory/control/commissioning contracts (including five new continuation/oracle/instrumentation cases), 50 Provider/Worker contracts and existing real isolated Worker tests; a regression test specifically covers scheduled-frequency observation. No original state transition, fatal rule, repair maximum or production switch was weakened. REJECTED remains terminal.

## Commands, recovery, rollback and supervising-team actions

See [operations README](commissioning/prism-polish/README.md) and [evidence index](evidence/prism-polish/README.md). The paid workflow is one-shot and must not be rerun from old state. Full original artifact: [10691495583](https://github.com/andysong111/auto-lab/actions/runs/35719738363/artifacts/10691495583), expires 2026-10-22; permanent essential evidence and complete provider ledger are committed here.

```sh
cd vibe-arcade
npm test --prefix autonomy
npm run test:worker --prefix autonomy
# No model key is required for these tests or the read-only audit workflow.
node autonomy/commissioning/cli.cjs release-packet /path/to/rejected/manifest.json \
  --out /path/to/rejected-packet.json \
  --base-ref c64d9f10d8a0f099603e5a6a9b78f1ad1d823a2d
# Expected exit 2 / passed:false for this rejected version.
```

1. Keep PR #45 on HOLD and production unauthorized; review final evidence directly on GitHub.
2. Review the QA instrumentation fix and genuine gaps separately. Do not infer "no sound" from the superseded 440 Hz probe, or infer public readiness from passing route counts.
3. A further game modification needs an explicitly reviewed follow-up disposition of this exhausted, terminal job. Do not silently reset attempts, clone the game ID or delete operation history to obtain new calls. No such modification was performed here.
4. If a separately authorized future candidate revision exists, require full original + corrected polish QA, visual readability review, exact-commit Preview and byte smoke before any release review. This report is not production approval.
5. Preserve the source/ledger; one-shot workflows remain non-looping. Rollback is to stop/close the unmerged commissioning PRs. Production is unchanged, so no live application/DB rollback is necessary. Pinned base is the commit above.
