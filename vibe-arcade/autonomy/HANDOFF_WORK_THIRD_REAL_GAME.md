# Third autonomous candidate — Ribbon Shift — REJECTED

**Terminal result B: `GAME-20260922-131`, v6, repair 5/5, REJECTED. No revival, reset, clone, fourth candidate, RC or production release.** The completed paid run was recovered and verified, not repeated. Total model spend remains **USD 0.644552 estimated** for six real OpenAI Responses calls; billed cost is unknown.

The last paid version passed common Docker Chromium QA at all three viewports and normal-input completion on six seeds. It was rejected for one dynamic reduced-motion assertion. A subsequent **read-only, zero-model-call audit found a QA event-delivery race and passed on unchanged v6**. That diagnostic result does not overwrite the original failure or authorize release. Visual/static review also found unmet presentation and scoring requirements. This run is not a proven failure of the entire mechanic family.

## Identity and authoritative records

| Item | Value |
| --- | --- |
| Candidate | Ribbon Shift / `GAME-20260922-131` / `toroidal-strip-permutation` |
| Latest main used and rechecked | `7e8e260ab1895eeec845ab216408820f5f444afe` |
| Paid execution commit | `00e165c6533aec058194ccfd10ad0d40f69112d0` |
| Paid execution | [Actions 35732729905](https://github.com/andysong111/auto-lab/actions/runs/35732729905) |
| System/evidence branch | `commissioning/third-real-game-20260922` |
| Draft evidence PR | [#51](https://github.com/andysong111/auto-lab/pull/51), not an RC PR |
| Final source SHA-256 | `ea85f704319bc9e6896d2304c9192d5b1b12a418654a47f8f765991e94c03736` |
| Factory state | `REJECTED`; QA `FAIL`; quality `REJECT`; repair 5/5 |
| RC branch / PR / exact candidate Preview / byte smoke | None; READY_TO_SHIP not reached |
| Release packet | [Rejected packet](evidence/third-real-game/release-review-packet.json), `passed:false` |
| Rollback base | `7e8e260ab1895eeec845ab216408820f5f444afe` |

[Evidence index](evidence/third-real-game/README.md), [manifest](evidence/third-real-game/manifest.json), [ledger](evidence/third-real-game/provider-ledger.json), [cost summary](evidence/third-real-game/commissioning-summary.json), requests and every source version are committed for GitHub-only handoff. Source copies have `.txt` suffixes: evidence data, not runnable candidate routes. No API key or temporary access URL is included.

## Previous decisions and latest-main reuse

Read the first-game, Prism polish and second-game handoffs from their existing commissioning worktrees/branches; those documents are not all present on main. The polish rejection supersedes Prism's earlier technical v4 READY_TO_SHIP. Prism `GAME-20260922-110` remains rejected and `spatial-optical-routing` blocked. Cloud Cargo `GAME-20260922-121` remains rejected after provider-contract failures, not a gameplay verdict against `dual-resource-cargo-assignment`. Neither candidate was revived or copied.

Reviewed and reused `autonomy/`, `commissioning/`, `providers/`, `worker/`, `qa/` and `gamekit/`. Main's explicit `globalThis` export, precise validation errors, bounded rejected-output quarantine, repair source context and unsafe-path exclusion are present. Existing Factory states, Worker, Responses provider, adapters, GameKit, Docker isolation and repair counters remain authoritative.

## Three ideas and automatic selection

| Idea | Mechanic family | Decision |
| --- | --- | --- |
| **Ribbon Shift** | `toroidal-strip-permutation` | Selected: cycle rows right or columns down to restore three 3×3 mosaics. Small exact search, visible tiles, simple touch/keyboard. |
| Orbit Etcher | `continuous-contour-tracing` | Rejected for this slot: touch precision, collision geometry and equivalent keyboard tracing add risk. |
| Echo Loom | `ordered-spatial-memory-recall` | Rejected for this slot: recall is less immediately legible in Shorts; sequence length alone risks shallow progression. |

[Full ideas](commissioning/third-real-game/ideas.json). Different mechanics, not visual skins. No banned combat, tower, radial timing, merge, runner, single-button reaction/timing, optics, cargo/airship/allocation design was selected.

## Spec and implementation contract

[Proposal](commissioning/third-real-game/proposal.json), [recorded Spec Gate PASS](commissioning/third-real-game/spec-gate.json), [immutable Factory spec](evidence/third-real-game/immutable-spec.json). `node autonomy/commissioning/cli.cjs check-spec autonomy/commissioning/third-real-game/proposal.json` passed before the paid run and was rechecked during handoff.

| Required area | Concrete design |
| --- | --- |
| Goal | RESTORE 3 MOSAICS on entry, target reference, large START PRACTICE, short row/column instructions. |
| Progression | Three seeded 3×3 permutations; one-step row-right/column-down cycles; visible 0/3→3/3 separate from elapsed progress. Incomplete timeout45s; complete terminal no earlier than15s. |
| Presentation | Original ink/coral/mint/gold textile tiles; intended sliding/wrapping strips, bounded feedback; CURRENT SCORE and DEVICE BEST / LOCAL PRACTICE. Audio omitted. |
| Originality | No prior candidate code/art/mechanic copied, no external assets/accounts/network services. |
| Difficulty | Exact shortest forward plans of2,3,4 shifts, both axes and seeded diversity; no time/HP inflation. |
| Mobile readability | 390px first, canvas≥300CSSpx, large digits and44px+ touch controls, text≥12px, no overlap. |
| Result | MOSAICS RESTORED versus TIME UP; restored count, moves, score/best, replay; local best retained on ordinary practice reload. |
| Reduced motion | Initial preference and live changes, static feedback under reduce, zero particles/voices, bounded presentation observation and cleanup. |

PC: Left/Right selects a handle, Space shifts. Touch: row/right arrow or bottom column arrow. Runtime explicitly exports `globalThis.RibbonShiftCore` and uses supplied GameKit. These are original requirements; evidence and unmet requirements are distinguished below.

## Real build/repair history and cost

Provider **OpenAI Responses**, model **gpt-5.6-terra**, existing secret **OPENAI_API_KEY**. One worker, one build, five repairs, six operation IDs. No additional generations during recovery/audits.

| Operation ID | Version | Input tokens | Output tokens | Estimated USD | Cumulative USD | Candidate result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| GAME-20260922-131/build/v1 | v1 | 3,060 | 6,237 | 0.124506 | 0.124506 | Boot/diagnostics timeout |
| GAME-20260922-131/repair/1 | v2 | 9,558 | 7,218 | 0.168156 | 0.292662 | Boot timeout remains |
| GAME-20260922-131/repair/2 | v3 | 10,388 | 990 | 0.059372 | 0.352034 | Common PASS; objective, label overlap and motion failures |
| GAME-20260922-131/repair/3 | v4 | 16,716 | 5,021 | 0.157242 | 0.509276 | Motion failures: seeds89,2026,4294967295 |
| GAME-20260922-131/repair/4 | v5 | 10,243 | 1,323 | 0.064786 | 0.574062 | Motion failure: seed1 |
| GAME-20260922-131/repair/5 | v6 | 10,040 | 1,685 | 0.070490 | 0.644552 | Motion failure: seed89; REJECTED |

**60,005 input /22,474 output tokens.** All outputs passed provider validation and have ledger state COMPLETE; that means accepted source, not QA PASS. Response IDs, immutable request hashes, usage and reservations are preserved. Local operation idempotency was retained; a client request ID is not a provider billing guarantee.

The stricter USD2 configured estimate ceiling remained below the owner's USD3 cap. Calls≤6, repairs≤5, concurrency1, elapsed budget60min and request timeout300s remained enforced. Estimates use the run's conservative configured USD4/18 per million input/output tokens, without cache discounts; not invoices or total CI/hosting cost. No new paid call or price assumption was needed for handoff.

All failures remain in [per-version QA](evidence/third-real-game/factory/) and [repair history](evidence/third-real-game/factory/repair-history.json). v1/v2 lacked `data-game-progress`; v2's screenshot shows `missing_game_ui:progress`. The caught boot error was not surfaced as console/pageerror, so QA originally reported only timeouts. Repair2 added the hook to the objective element, which GameKit then overwrote with elapsed numbers. Repair3 separated the elements and removed overlapping restoration text. Repairs4/5 changed generated `app.js` only. History also lists Factory-supplied version metadata, not model-authored manifest edits.

## Provider feedback verification

[Read-only audit](evidence/third-real-game/provider-feedback-audit.json): **zero actual provider validation failures**. Thus the real quarantine path was not exercised; do not claim otherwise. Cloud Cargo's export error did not recur.

Current provider/worker tests cover quarantine without applying rejected files, exact file/line/identifier and error detail, allowed rejected-source delivery into an empty-workspace repair, unsafe/protected-path exclusion, and successful repair. A trusted `beforeProvider` hook pauses before reservation after two consecutive matching MODEL_FAILED validation fingerprints. Tests prove no third call/reservation and require a substantive review tied to that pair before continuation. No limits are reset.

The six [compiled requests](evidence/third-real-game/provider-requests/) show source plus QA failures supplied to every repair. Repair2 returned HTML only; repairs4/5 returned app only. [Provenance](evidence/third-real-game/source-provenance.json) verifies every generated final file equals its latest real provider response byte-for-byte. Candidate manual edits: **0**.

## Common QA and six-seed difficulty

[Original v6 common QA](evidence/third-real-game/factory/v6/common/qa.json): PASS at **390×844,768×1024,1280×800**. HTML/assets, start, real clock, keyboard/touch, progress, interaction, pause/resume, hidden/pagehide, overflow, terminal/restart and resource/freeze constraints pass. Console/page errors and attempted production/network writes:0. Product playthroughs verify meaningful score changes. Docker stays non-root, read-only, network-disabled with1CPU,1GiB memory and process/time bounds; no host candidate execution fallback.

[Original product QA](evidence/third-real-game/factory/v6/product/qa.json) and [difficulty details](evidence/third-real-game/difficulty.json) retain boards, independent solutions and real action counts:

| Seed | Viewport | Input | Minimum/actual shifts by stage | Goal | Terminal |
| --- | --- | --- | --- | --- | --- |
| 1 | 390×844 | Touch | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |
| 7 | 768×1024 | Keyboard | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |
| 23 | 390×844 | Touch | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |
| 89 | 1280×800 | Keyboard | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |
| 2026 | 390×844 | Touch | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |
| 4294967295 | 1280×800 | Keyboard | 2/2,3/3,4/4 | 3/3 | 690points,tick900 |

All six full sequences differ. Every sampled stage has a shortest solution using both axes. Independent reverse BFS reads boards; the pilot dispatches ordinary keys/touch, never injects state/score/wins. No sampled impossible board. Static generation selects bounded reverse-reachable states, supporting solvability by construction, not exhaustive execution of all32-bit seeds. Increasing shortest plan length is proven; human decision quality and retention are unmeasured. Both axes already occur in stage1, so later stages add planning length rather than a new constraint type.

## Product review, mobile and reduced motion

| Required check | Verified evidence and limit |
| --- | --- |
| A. Goal | RESTORE 3 MOSAICS and short instruction visible. Mini target is decorative colors rather than a faithful numbered target; visible PC hint absent. |
| B. Progress | Actual0/3→1/3→2/3→3/3 verified. Separate elapsed field is an unlabeled number; completion shows33, potentially confusing. |
| C. Device Best | Visible and separate;690 retained on replay/reload. Capture writes0. Separate isolated practice test makes one allowed local-storage write, no network/production write. |
| D/E. Seeds/depth | Six completions, exact2→3→4 shortest plans, not time/HP increases. Deep replay value unproven. |
| F. 390px | Legible large digits/arrows, no sampled canvas label overlap or horizontal overflow. Entry fits844px; result capture about1034px tall puts replay below the initial viewport. |
| G/H. Results/replay | Distinct success/failure, actual counts/moves/score/best, functional replay; same seed intentionally repeats. |
| I. Reduced motion | Original gate FAIL. Unchanged-source diagnostic passes initial reduce and live changes both ways, zero particles under reduce and zero audio voices. |

Original QA treated `emulateMedia` plus virtual-clock advancement as a native MediaQueryList event-delivery barrier. The [final read-only Docker audit](https://github.com/andysong111/auto-lab/actions/runs/35734988459), commit `6fe8a9d0b6ca342f682b2a5de04a810273a01cb0`, records:

- [36 transition audit](evidence/third-real-game/motion-audit-final/qa.json): PASS,0 settled failures, maximum observed wall duration28ms.
- [Full six-seed product audit](evidence/third-real-game/product-audit-final/qa.json): PASS. Seed2026 initially had native preference=true but DOM/presentation=false after virtual advancement; one bounded wait synchronized them in25ms. This directly supports the QA synchronization defect.
- `qa/media-settlement.cjs` waits at most800ms/40polls for native preference, DOM and presentation to agree. Permanently stale presentation still fails; tests cover both delayed success and permanent failure. No assertion or original failure was removed.
- [Audit summary](evidence/third-real-game/motion-audit-final/summary.json): model calls0, original source/manifest/ledger/QA unchanged. Verified artifact10696859496 ZIP SHA256: `1a8bb86366adc6d296e912a80698d4b236ab4bd7a924abc72b99ad6bbe2b560e`.

This is a post-terminal system diagnosis, **not a replacement Quality Gate or readiness result**. The repeated-validation hold covers provider validation, not browser assertions, so it did not stop these repairs. Future commissioning should triage repeated browser failures for harness defects before spending the last calls.

## Screenshots/video and remaining weaknesses

Original generic entry/playing/midgame/terminal images for all3viewports remain under [v6/common](evidence/third-real-game/factory/v6/common/). Terminal filenames retain `viewport-390.png`,`viewport-768.png`,`viewport-1280.png`; all earlier versions remain.

- [Mobile entry](evidence/third-real-game/factory/v6/product/viewport-390-entry.png)
- [Playing](evidence/third-real-game/factory/v6/product/viewport-390-playing.png) and [midgame](evidence/third-real-game/factory/v6/product/viewport-390-midgame.png)
- [Complete](evidence/third-real-game/factory/v6/product/viewport-390-success.png) and [failure](evidence/third-real-game/factory/v6/product/viewport-390-failure.png)
- [Desktop midgame](evidence/third-real-game/factory/v6/product/viewport-1280-midgame.png)
- [Gameplay WebM](evidence/third-real-game/factory/v6/product/viewport-390-playthrough.webm):20.6s accelerated normal-input QA recording, not real-time human play.

Visual inspection of mobile entry/playing/success/failure and a video frame confirms legibility and the result-scroll limit. Static review identifies unmet requirements:

1. **No whole-strip slide/wrap animation.** Renderer places the changed board directly at fixed cells; particles/outlines remain. Passing motion flags does not establish the intended kinetic presentation.
2. **Unnecessary moves earn points.** Each shift adds10, restoration adds200. Three repeated shifts can restore the previous unsolved arrangement while adding30. This undermines score as a skill measure; static rule finding, not a claimed exploit playtest.
3. **Artificial early-win wait.** Fast solutions wait until tick900 for results; custom status is overwritten by GameKit's generic text. Minimum duration has become potential dead time.
4. **Target/replay limits.** Mini colors do not faithfully represent the numbered target, no visible PC instruction, only three shallow boards and same-seed replay. No fun, retention or Shorts-performance evidence.
5. **Back-navigation uncertainty.** App removes its media listener on any pagehide; GameKit distinguishes persisted pagehide. Dynamic motion after bfcache restoration is untested and may lose synchronization.

No exhausted candidate source was manually patched. Public-quality PASS is **not claimed** despite the diagnostic suite PASS. Baseline Astra/Descent images are explicitly existing-game evidence, not candidate screenshots or a parity claim.

## Verification, RC boundary and rollback

Handoff verification: **43 Factory/control/commissioning tests and55 Provider/Worker tests pass**, logs archived. [System-head CI](evidence/third-real-game/github-verification.json) records successful Factory/browser/regression, Worker/isolation and existing-game workflows at `6fe8a9d...`. The separate [production-regression artifact](evidence/third-real-game/production-regression.json) names its preparation baseline `dc9a6a...`; it is not mislabeled as a final-head candidate release test. Existing account/ranking dependencies are mocked.

No `factory/GAME-20260922-131` branch, RC PR, exact candidate Preview, byte smoke or successful release packet exists. Any Vercel bot Preview on PR51 is infrastructure/evidence preview, **not a playable Ribbon Shift RC**. The packet generator correctly rejects this manifest.

Production unauthorized; main not merged; homepage/sitemap/ranking/Supabase/auth/country/SNS/ads untouched. Repository intake and production shipping remain disabled. Rollback: preserve rejected evidence and close the unmerged commissioning PR if unwanted. No production app/database rollback required. Restore base `7e8e260ab1895eeec845ab216408820f5f444afe`.

## Next supervising team

Read this file and the committed evidence directly; no chat-copy transfer needed. Keep all rejected IDs terminal and retain the ledger. Review bounded native-event waiting and the missing-boot-error diagnostic gap as Factory improvements. For a separately authorized future original candidate, require actual animation, score incentives, immediate completion feedback and visible result layout in addition to mechanical gates. This handoff authorizes no fourth candidate, revival, extra paid call, merge or production release.
