# Second real candidate — Cloud Cargo — REJECTED

**Terminal commissioning result: `GAME-20260922-121`, v6, REJECTED, lifetime repair 5/5 exhausted.** One actual OpenAI build and five actual AI repairs were attempted. All six outputs failed the existing DOM-independent core validation before source acceptance. Candidate Docker/browser QA and public-quality review were therefore not reached. No accepted game, RC branch, RC PR, Preview or production release exists. Do not reset this job or clone it under a new ID.

The allowed failure completion path was reached. This result establishes a repeatable generation-contract failure and correct budget enforcement; it does not establish Cloud Cargo gameplay quality or success of an end-to-end launch pipeline.

## Repository and execution identity

- Starting latest main / rollback base: `b4db1b3f9858eaa7f62403ab16da8085e97267a9`.
- Work branch: `commissioning/second-real-game-20260922`.
- [Draft implementation/evidence PR #49](https://github.com/andysong111/auto-lab/pull/49), targeting main. No merge.
- Paid execution commit: `3e9d5fefabca3070f9026b9c3115c54fe9c69649`.
- [Paid Worker run 35726303477](https://github.com/andysong111/auto-lab/actions/runs/35726303477), 2026-09-22 12:18:10–12:25:21 UTC.
- Reviewed Docker image built/pinned: `sha256:1284f6c5f8e81a73fdc1d3d83c2b37449ffd790a2d9c7bba7ffb1c7149d6fd20`. No candidate passed the earlier validator, so this paid run never launched a candidate QA container.
- [Original full-state artifact 10694135327](https://github.com/andysong111/auto-lab/actions/runs/35726303477/artifacts/10694135327), expires 2026-10-22; essential state is permanently committed below.
- Existing Prism Relay `GAME-20260922-110` remains terminal REJECTED and untouched. Main's spatial-optical-routing block remains unchanged.
- Repository intake OFF; `AUTO_PRODUCTION_SHIP=false`; `production.authorized=false`.

Read [evidence index](evidence/second-real-game/README.md), [manifest](evidence/second-real-game/manifest.json), [cost summary](evidence/second-real-game/commissioning-summary.json) and [complete provider ledger](evidence/second-real-game/provider-ledger.json) directly in GitHub. No chat-copy handoff is needed.

## Three ideas and selection

| Idea | Actual mechanic family | Decision and reason |
| --- | --- | --- |
| **Cloud Cargo** | `dual-resource-cargo-assignment` | Selected: partition a finite shared cargo set among bays with exact mass and energy totals. Two touch actions; clear target; independently enumerable solutions and real additional constraints. |
| Trace Choir | `sequence-memory-reconstruction` | Not selected: rhythm-free pattern observation/reconstruction is distinct, but reveal/memory accessibility and cognitive-depth validation add commissioning risk. |
| Fold Foundry | `polyomino-coverage-planning` | Not selected: stencil coverage with tile placement/rotation is distinct, but geometry and drag precision create extra 390px usability and solvability risk. |

[Full decision artifact](commissioning/second-real-game/ideas.json). The selection compared actual inputs/state changes against eight public families and rejected Prism Relay. No combat avatar, autofire, tower rotation, radial pins, merge columns, runner, reaction cue, timing window or optical path is involved. Generic allocation puzzles are not claimed as a newly invented genre. Astra/Descent code/art were never supplied to the model.

## Immutable commissioning spec and implementation contract

[Proposal](commissioning/second-real-game/proposal.json) → actual CLI Spec Gate **PASS**, errors/warnings both empty → [exact immutable Factory spec](evidence/second-real-game/immutable-spec.json). Gate ran locally and in CI before exposing the provider secret.

- Title: **Cloud Cargo**; game ID `GAME-20260922-121`; slug `cloud-cargo`.
- Family: `dual-resource-cargo-assignment`; stationary constraint-allocation arcade puzzle.
- Objective: visible **LOAD 3 AIRSHIPS**, actual 0/3 → 3/3 dispatch progress.
- Desktop: Left/Right chooses a cargo card/bay; Space activates. Touch: tap a crate, tap a bay.
- Target session: 15–50 seconds; common terminal bound 52 seconds.
- Progression: 4/5/6 cargo cards; 2/3/3 bays. First stage matches mass; later stages match mass AND energy. Final stage must have mass-valid allocations excluded by energy, proving an additional decision constraint.
- Procedural solvability: derive targets from a generated valid allocation, shuffle, bounded construction, no QA-seed special case or three fixed templates.
- Visible CURRENT SCORE / DEVICE BEST / LOCAL PRACTICE, real GameKit best, capture no persistence.
- Portrait-first canvas, >=12px meaningful labels, explicit short goal, independent canvas-label collision audit.
- Distinct SKYPORT COMPLETE / CARGO INCOMPLETE, score/best/breakdown/replay.
- Dynamic `prefers-reduced-motion` in both directions, static feedback preserved. Audio intentionally omitted.
- Original procedural art, local runtime only, no account, network service, CDN, production data or ranking adapter.

These are **requirements**, not observed implemented features. None received browser validation for this candidate.

## Real calls, operation IDs and cost

Provider: official **OpenAI Responses**, model **gpt-5.6-terra**, existing GitHub secret `OPENAI_API_KEY`. No new secret/service/subscription was created. Existing AIBuilderAdapter, AIRepairAdapter, ProviderManager and AutonomousWorker were used.

| Operation ID | Version | Input tokens | Output tokens | Estimated USD | Cumulative USD | Result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| GAME-20260922-121/build/v1 | v1 | 3,573 | 6,608 | 0.133236 | 0.133236 | MODEL_FAILED |
| GAME-20260922-121/repair/1 | v2 | 3,880 | 5,552 | 0.115456 | 0.248692 | MODEL_FAILED |
| GAME-20260922-121/repair/2 | v3 | 3,880 | 6,153 | 0.126274 | 0.374966 | MODEL_FAILED |
| GAME-20260922-121/repair/3 | v4 | 3,880 | 5,107 | 0.107446 | 0.482412 | MODEL_FAILED |
| GAME-20260922-121/repair/4 | v5 | 3,880 | 4,916 | 0.104008 | 0.586420 | MODEL_FAILED |
| GAME-20260922-121/repair/5 | v6 | 3,880 | 4,922 | 0.104116 | 0.690536 | MODEL_FAILED |

**Total: 6 generation calls, 22,973 input tokens, 33,258 output tokens, USD 0.690536 estimated. Billed cost unknown.** All six saved response IDs and reported token totals are in the ledger; retrieval confirmed those totals. No ambiguous resubmission or duplicate operation was used.

The user authorized up to USD3 total; this run retained main's stricter USD2 commissioning limit, six lifetime calls, five repairs, max concurrency1 and 60 elapsed minutes. Per request: 18,000 output-token ceiling, 300-second timeout, 100,000 conservative input-byte token bound, 1MiB response and 128KiB/file. Pricing uses conservative USD4 input/USD18 output per million, ignoring cache discounts. [Official pricing](https://developers.openai.com/api/docs/pricing) checked 2026-09-22 lists standard short-context Terra USD2/USD12. Estimates concern model inference, not an assertion about CI/Vercel billing.

## Failure chronology and root cause

The Factory followed SPEC_READY → BUILDING → BUILD_FAILED → REPAIR_PENDING → REPAIRING repeatedly, then REJECTED at repair5. [Original repair requests/history](evidence/second-real-game/factory/) preserve each cause and outcome. Every accepted changed-files list is empty because output validation happens before applyOutput.

The exact repeated violation was a **browser-only core export**:

```js
window.CloudCargoCore = core;
```

The existing `providers/output.cjs` rejects `document`, `window`, `localStorage` or `fetch` anywhere in core.js. A core exported through `window` is not independently loadable in a non-browser environment. All six rejected outputs contain this executable export, at lines **157 / 70 / 69 / 81 / 73 / 33** respectively. This was not an audio probe artifact or an observed browser exception.

The pre-run shared contract said to expose a global object and required DOM independence, but did not explicitly teach the allowed `globalThis` export. The validator supplied only `core_dom_dependency`. The manager retained usage/response ID, but discarded rejected file content. Thus each repair received the same terse failure, an empty workspace and no prior candidate source; the model regenerated a full six-file response with the same forbidden export. The repair counter correctly prevented an infinite loop, but the feedback was insufficient to correct this straightforward integration mistake.

The model's summaries claimed a DOM-free core; these claims were not accepted as test evidence.

## Read-only response audit and provenance

After terminal rejection, [audit run 35727344272](https://github.com/andysong111/auto-lab/actions/runs/35727344272) at commit `aea6b65854396ca49737482787319a1cf4e70089` issued exactly **six GET requests for the already-recorded response IDs**, with zero new generation calls, no POST/retry, no Factory.run and no candidate execution.

- [Audit summary and exact offending lines](evidence/second-real-game/rejected-responses/summary.json).
- [All six raw structured file outputs as quarantined JSON data](evidence/second-real-game/rejected-responses/).
- [Readable v6 rejected source data, `.txt` suffix](evidence/second-real-game/quarantined-v6/). These are not runnable candidate routes.
- [Provenance verification](evidence/second-real-game/source-provenance.json): returned file hashes, response IDs, usage and original validation failure checked without executing generated code.
- Ledger SHA256 before/after: `805601c5be2a4481918e05fbaa15aebae224708c6f8a7641bde20fdfb9519f7a`.
- Manifest SHA256 before/after: `ba66ec71257bc01b2db31a9a60bd104279afa3e4906b82013e76babb69b16b98`.

**Factory source hash: null / unavailable**, because no version was accepted into a Factory source tree. The v6 rejected response text SHA256 is `fcb1a65b9422d2c30d6dec6dcc120989e19278dc0d2b9dcd9f1ef52ac18a3e56`; this identifies quarantined response data and must not be treated as a QA-approved source hash.

## Candidate QA and product-quality coverage

| Required evidence | Actual result |
| --- | --- |
| Common Docker Chromium at 390×844, 768×1024, 1280×800 | **NOT EXECUTED**: no accepted build. |
| Load/assets/console/start/keyboard/touch/progress/score/interaction | Not measured for Cloud Cargo. |
| Terminal/restart/pause/resume/hidden/pagehide/resources/freeze/overflow | Not measured for Cloud Cargo. |
| Six seeds: 1,7,23,89,2026,4294967295 | Planned oracle exists; no actual seed solution lengths or difficulty PASS. |
| First-five-second goal / actual goal progress / best | Required by spec; not visually verified. |
| 390px internal canvas text readability | Probe implemented; no candidate screenshot or result. |
| Initial and dynamic reduced-motion | Probe implemented; not executed on candidate. |
| Audio | Omitted in spec; no browser audio assessment. |
| Network / production writes | No candidate executed; no candidate writes. No live production account/score was created. |
| Entry / playing / midgame / terminal screenshots and gameplay video | **None for Cloud Cargo.** Baseline PNGs are explicitly existing games. |
| Quality Gate | PASS not reached; authoritative manifest `quality_status=REJECT`. |

[Machine-readable coverage](evidence/second-real-game/verification-coverage.json). `qa_status=PENDING` is the existing engine's representation of a rejected build, not a pending instruction to run it. The new product QA has unit coverage but remains uncommissioned on an accepted real game. Do not call green infrastructure CI a candidate QA PASS.

## Baseline comparison without a quality score

Actual latest-source existing-game regression screenshots are retained: [Astra V3 mobile](evidence/second-real-game/baseline-astra-v3-mobile.png), [Descent mobile entry](evidence/second-real-game/baseline-descent-entry-mobile.png), [Descent completion](evidence/second-real-game/baseline-descent-complete.png).

| Review dimension | Concrete baseline observation and candidate limitation |
| --- | --- |
| Goal clarity | Descent prominently says “Find the gap. Go deeper.” with a large practice button. Cloud Cargo required “LOAD 3 AIRSHIPS”; no rendered evidence exists. |
| Visual hierarchy | Astra separates gate/hull/score above its arena and avatar/equipment below. Cloud Cargo's planned cargo/bay separation was not rendered or reviewed. |
| Progress visibility | Astra shows 01/09 and ascent markers; Descent shows 0/48 rings. Cloud Cargo's 0/3 UI is unverified. |
| Interaction feedback | Baselines have bounded movement/impact/sector feedback. Cloud Cargo's intended assignment/dispatch feedback is untested. |
| Mobile clarity | Baseline screenshots show distinct control/HUD areas at390px. No Cloud Cargo legibility or text-overlap claim can be made. |
| Result presentation | Descent's result distinguishes score,48/48 rings,perfect count,best chain,local practice and replay. Cloud Cargo's result/breakdown remains a requirement. |
| Replay loop | Existing regression exercises restart and input-driven runs. No Cloud Cargo replay was executed. |

No numeric fun score or baseline-parity claim is made. No baseline source/art/mechanic was copied into generated output.

## System changes versus candidate changes

**Candidate changes:** real AI responses only. Zero Work-authored candidate edits, zero accepted source writes, no manual `window`→`globalThis` replacement, no resurrection, no extra call.

**Trusted commissioning systems:**

1. Spec/idea artifacts and a one-shot branch-scoped Worker wrapper. Factory/Worker/adapters/states/repair limits reused unchanged.
2. `qa/cloud-cargo.cjs`: independent bounded allocation enumeration plus actual keyboard/touch automation, early goal/best/motion/readability checks, capture/practice separation and evidence hooks. Original common QA remains intact; separate product deadline300s, common150s.
3. `isolation/docker-qa.cjs`: forwards a trusted opt-in product selector and exports bounded phase PNG/WebM files. Main already captured entry/playing/midgame, but the previous exporter copied only terminal `viewport-N.png`; this fixes evidence loss without changing assertions or containment.
4. Read-only response retrieval/provenance utilities; rejected output remains data.
5. **Post-rejection feedback correction:** shared core contract explicitly uses `globalThis.YourCore`; unchanged DOM guard now reports the offending identifier/line and allowed export form. Added regression coverage accepts the valid export and still rejects forbidden browser access, including comments. This is guidance/diagnostics for future authorized jobs, not proof that this rejected game now works.

The narrow correction does not add rejected-source quarantine to the general repair compiler. That larger feedback improvement remains a next-team task. No state transition, quality/fatal policy, repair limit or production flag was relaxed.

## Tests and CI

- Before paid run:43 Factory/control/commissioning contracts,50 Provider/Worker contracts PASS.
- After feedback correction: **44 contracts /50 Provider-Worker tests PASS** locally.
- Paid execution head: existing Factory contracts/browser/regression and AI Worker contracts/real Docker isolation CI all PASS; existing opt-in `live` skipped.
- [Complete production regression](evidence/second-real-game/production-regression.json): build,canonical contracts,Astra V3,Astra campaign,Deep Descent,Core Pins+Nova Merge,legacy challengers,Orbit+auth shell all PASS. Twenty protected source fingerprints match before/after. Existing account/ranking traffic is mocked, never real production writes.
- A partial artifact from the earlier preparation commit was superseded by the complete regression report for the paid execution head; no partial result is used as a final PASS.
- Final evidence-head checks are linked in [PR #49 checks](https://github.com/andysong111/auto-lab/pull/49/checks) and summarized in its body after completion.

Paid workflow success means the bounded terminal **REJECTED** outcome was recorded successfully. It does not mean candidate build/QA/quality passed.

## RC, release packet and rollback

- RC branch: **not created**. `factory/GAME-20260922-121` has no published candidate.
- Draft RC PR / rc_commit / exact Preview / byte smoke: **none**, because output validation never passed.
- PR #49 is implementation/evidence only.
- Existing [release-packet command](evidence/second-real-game/release-review-packet.json) correctly returns `passed:false` for rejected state, missing QA/quality/Preview/source/RC metadata. `production.authorized=false`.
- Rollback base: `b4db1b3f9858eaa7f62403ab16da8085e97267a9`. Closing the unmerged PR stops this change; production needs no app/DB rollback. Preserve the rejected ledger and responses rather than deleting history.

## Commands and next supervising-team work

From `vibe-arcade`:

```sh
node autonomy/commissioning/cli.cjs check-spec autonomy/commissioning/second-real-game/proposal.json
npm test --prefix autonomy
npm run test:worker --prefix autonomy
node autonomy/commissioning/second-real-game/audit-provenance.cjs /path/to/restored-response-audit
node autonomy/commissioning/cli.cjs release-packet /path/to/rejected/manifest.json \
  --out /tmp/cloud-cargo-rejected-packet.json \
  --base-ref b4db1b3f9858eaa7f62403ab16da8085e97267a9
# Expected release-packet exit2, passed:false. Do not rerun paid commissioning.
```

1. Keep Cloud Cargo and Prism Relay terminal REJECTED, preserve their budgets/IDs and production hold. No follow-up candidate was created in this Work.
2. Review the explicit globalThis contract/error message correction before commissioning another unrelated job.
3. Improve failed-build feedback: preserve bounded rejected output as quarantined data and provide the offending source/line to repair, without applying unvalidated files or weakening isolation. Repeated empty-workspace regeneration wasted all five repairs here.
4. Review/commission the new product probes on safe fixtures before depending on them for a future public-quality decision. They were not exercised on an accepted Cloud Cargo build.
5. Static inspection of the rejected v6 data also suggests an early-success freeze: `step` returns immediately when phase is finished while `terminal` additionally requires tick>=900. If success sets that phase before tick900, the clock cannot reach the threshold. This is an **unexecuted static finding**, not a reported browser failure, and further demonstrates why an export fix alone cannot establish readiness.
6. Any future production decision requires independently accepted source, all real browser/product evidence, exact Preview/source smoke and a separate owner release decision. This handoff authorizes none of those actions.
