# Fourth real commissioning — Keywake

**READY_TO_SHIP — v3 — 2026-09-23T02:17:43Z.** Technical PASS + Generic Product PASS + Quality PASS + exact RC CI and byte-identical Preview smoke PASS. Repair **2/5**, real model calls **3/6**, estimated model cost **USD 0.386828**. Owner release review is PENDING; production is not authorized.

| Reference | Value |
| --- | --- |
| Candidate | Keywake / GAME-20260923-141 |
| Family | discrete-key-collection-navigation |
| Base main / rollback | `e3203597e414ee258b7816f189eed3f4cff1392b` |
| Base tree | `6dc88f8c4878e9c2c435931ed8cef7f21f3710bd` |
| RC branch / Draft PR | `factory/GAME-20260923-141` / [#56](https://github.com/andysong111/auto-lab/pull/56) |
| Exact RC commit | `90bfac0349e4219e3e28f37ac948371afff98157` |
| Evidence / infrastructure Draft PR | [#55](https://github.com/andysong111/auto-lab/pull/55), `commissioning/fourth-real-game-20260923` |
| Exact Preview | [Play v3](https://vibe-arcade-n6l8axiv8-a2bsangsa.vercel.app/autonomy/games/GAME-20260923-141/v3) |
| Vercel deployment | `dpl_EehVt9fJZSEkUacebRrVFM9uHrWi`, Preview target, exact commit above |
| Final source hash | `adca43ffe1238625b32cb30c01b0093f4d94c9a9b117916c1edd997f7d6c07de` |
| Final state | [manifest.json](evidence/fourth-real-game/manifest.json) |
| Release review | [packet](evidence/fourth-real-game/release-review-packet.json) |
| All preserved evidence | [artifact index](evidence/fourth-real-game/artifact-index.json) |

Prism Relay 110, Cloud Cargo 121 and Ribbon Shift 131 remain REJECTED at repair 5/5. No old source was reused, reset or executed for this commissioning. One new candidate only. No main merge, production deployment, homepage, sitemap, ranking, DB, auth/country, SNS or ads change. Both PRs remain drafts.

## Ideas and selected design

[Selection data](commissioning/fourth-real-game/ideas.json):

| Idea | Family | Decision |
| --- | --- | --- |
| Keywake | Discrete key collection navigation | Selected: bounded walking graph, persistent keys, visible exit, normal-input oracle conformance |
| Ember Mosaic | Linked parity toggle | Deferred: indirect toggles need more explanation and resemble a fixture |
| Gear Bloom | Coupled discrete dial alignment | Deferred: arithmetic coupling and overlapping marks obscure the opening goal |

Keywake has three **stationary** 3×3 rooms. Arrow keys or four one-finger arrow pads move a character one cell. Tiles never cycle or rearrange. Collect keys before entering the hatch; choose efficient key order for a better score. Rooms have zero, one and two keys. Human session design target: 15–40 seconds; failure at 40 seconds. Success ends immediately, with no minimum-duration wait.

The immutable [proposal](commissioning/fourth-real-game/proposal.json) retains eleven prose implementation clauses. The [product contract](commissioning/fourth-real-game/product-contract.json) declares objective, progress, score, best, completion, replay, difficulty, mobile, reduced_motion, feedback and actions. Neither contract was relaxed after generation.

Before any paid call, `node autonomy/commissioning/cli.cjs check-spec autonomy/commissioning/fourth-real-game/proposal.json` passed, as did schema and reviewed DATA oracle validation. [Spec result](commissioning/fourth-real-game/spec-gate.json), [oracle review](commissioning/fourth-real-game/oracle-review.json), [105-test preflight log](commissioning/fourth-real-game/preflight-tests.log).

## Reviewed oracle and actual difficulty

Trusted Work authored [design.cjs](commissioning/fourth-real-game/design.cjs), emitting JSON from independently specified room topology. It never imports candidate code or runs browser QA. The candidate oracle is [keywake-rooms-v1.json](qa/reviewed/keywake-rooms-v1.json), approved in the existing reviewed registry. No executable candidate QA, DOM oracle, eval, score/state mutation adapter or bespoke Playwright solver was added.

- Oracle semantic SHA256: `900064dbd2df228aab94c7c02d33c9df9575560486dbbcf0f9e8f11dc5660bbc`.
- Contract semantic SHA256: `95db87d940a0c860aca7164045fe3c3e0ba6048ab5b41a67f9bbb710ae5c6031`.
- Projection: `state.stage, state.cell, state.key_mask, state.outcome`.
- Six seeds use per-room D4 rotation/mirror transforms from seed bits.
- 47 nodes per seed, within the approved 128-node bound; 64-action maximum.
- Stage-entry legal alternatives **2 → 3 → 4**; independent shortest actions **2 → 4 → 6**. Room 3 key-order costs six versus eight moves.
- The unchanged Generic Gate derives BFS paths from DATA, drives real touch/keyboard inputs, checks actual projection and diagnostics, and probes entry alternatives with normal-input return paths. Complexity is legal alternatives, not score, time or HP.

All six samples passed touch and keyboard with equal deterministic hashes. Each run used 12 path inputs plus 18 branch/return inputs: **30 actual meaningful actions**. Deliberate detours score320; the optimal normal route scores600. Required path depth increases independently of those detours.

| Seed | Choices per stage | Required actions | Equal touch / keyboard hash prefix | Result |
| --- | --- | --- | --- | --- |
| 1 | 2 / 3 / 4 | 2 / 4 / 6 | e0eea8cc1591 | PASS |
| 7 | 2 / 3 / 4 | 2 / 4 / 6 | b838382fe761 | PASS |
| 23 | 2 / 3 / 4 | 2 / 4 / 6 | 06b3d3c1b40 | PASS |
| 89 | 2 / 3 / 4 | 2 / 4 / 6 | acbfa9305897 | PASS |
| 2026 | 2 / 3 / 4 | 2 / 4 / 6 | 655adcbd801f | PASS |
| 4294967295 | 2 / 3 / 4 | 2 / 4 / 6 | e2b8495c946a | PASS |

Full sequences, projections, action counters and hashes: [v3 product QA](evidence/fourth-real-game/factory/v3/product/qa.json). Reachable terminal and no impossible seed are established for these samples, not exhaustive conformance for every possible seed or edge.

## Real AI operations, versions and every repair cause

Provider: **OpenAI Responses / gpt-5.6-terra**, existing OPENAI_API_KEY. No mock. [Source provenance](evidence/fourth-real-game/source-provenance.json) proves every generated final file equals the latest successful provider response for that path. Candidate manual edits: **0**. GameKit and version descriptor are Factory supplied.

| Operation ID | Version | Input | Output | Estimated USD | Cumulative USD | Result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| GAME-20260923-141/build/v1 | v1 | 4,315 | 7,928 | 0.159964 | 0.159964 | Validation PASS; Technical/Product FAIL |
| GAME-20260923-141/repair/1 | v2 | 20,326 | 2,273 | 0.122218 | 0.282182 | Three gates PASS; actual Preview route later FAIL |
| GAME-20260923-141/repair/2 | v3 | 17,661 | 1,889 | 0.104646 | 0.386828 | Three gates, exact CI/Preview smoke PASS |

Total **42,302 input + 12,090 output tokens**. Conservative configured rates USD4/M input and USD18/M output; estimated cost is not billed-cost reconciliation. [Cost summary](evidence/fourth-real-game/commissioning-summary.json), [ledger](evidence/fourth-real-game/provider-ledger.json), [compiled requests](evidence/fourth-real-game/provider-requests/) preserve usage, response IDs and operation IDs.

The existing stricter USD2 ceiling stayed inside the user's USD3 ceiling. Build1, repairs≤5, calls≤6, concurrency1, 300-second request timeout and 60-minute provider budget remained enforced. Resume restored the original ledger, start times, spec, source and counters. No repair reset or ambiguous submission retry.

**v1:** Output validation passed. Incorrect GameKit draw callback argument forwarding caused start to enter an error phase; critical DOM labels were also11px instead of14px. One run collected **25 hard failures**, covering start/lifecycle, score_integrity, feedback, completion, replay, capture_no_writes, failure_result/failure_path, practice_best, difficulty and mobile_readability. Physical boot failure blocked dependent gameplay checks; objective, initial progress, score/best, readability and motion observations still ran. All29 product checks and four obtainable product artifacts were preserved. [v1 QA](evidence/fourth-real-game/factory/v1/qa.json)

**Repair1:** Model changed only app.js and style.css, fixing draw forwarding and font sizes. v2 passed Technical and all53 Product checks. [Original pre-Preview PASS](evidence/fourth-real-game/factory/v2/qa-before-preview.json)

**v2 real Preview:** Existing Vercel cleanUrls=true / trailingSlash=false canonicalized the version directory without a slash. Relative assets resolved outside v2; the real page did not boot. Root-mounted Docker QA had not exposed that hosting-path defect. Work did not modify candidate source or deployment configuration.

A generic, read-only [preview-route.cjs](qa/preview-route.cjs) compares actual observed asset URLs with the exact version prefix; it has no candidate ID/name/mechanic. Trusted [report-preview.cjs](commissioning/fourth-real-game/report-preview.cjs) preserved the PASS report, recorded all incorrect URLs and used the existing Factory transition/repair path. The failure includes exact selector, state path document.baseURI, expected/actual URLs and [preview-route.json](evidence/fourth-real-game/factory/v2/preview-route.json). No core Factory state machine, fatal policy, Technical worker or Product worker was replaced.

**Repair2:** Model changed only index.html and app.js, setting a version-independent base before asset loading and aligning manifest fetch. Core, art, GameKit and tests were not rewritten. v3 passed fresh Docker QA, actual Preview Start/Pause interaction and [five-asset resolution verification](evidence/fourth-real-game/preview-route-verified.json).

[Repair feedback audit](evidence/fourth-real-game/repair-feedback-audit.json) proves all **25 + 1** failures were forwarded unchanged in compiled requests, with selectors, paths, expected/actual and evidence references. Targeted changed files and eliminated checks corroborate use of the feedback; internal model intent is not observable.

There were **zero real output-validation failures**. Quarantine/next-repair behavior was therefore not triggered on this candidate. [Audit](evidence/fourth-real-game/provider-feedback-audit.json) explicitly records that limit; preflight provider/worker tests cover the conditional behavior. Repeated-identical-validation preflight runs before reservation/submission.

## Final QA and Control Plane

Unchanged default DockerQA, Technical worker and Generic Product worker ran **390×844, 768×1024, 1280×800**. v3 image: `sha256:7863d8469d946e5fbf1f91de298932d578e1d9deecd3c05e173bfb0b94de7bb7`. v1/v2 image: `sha256:a2eeac91a67a918d6a514b4b069c1cf3b61ae3941b7e1c2d04cd7c1f9d914285`. Isolation: network none, read-only, oneCPU, 1024MB, 128PIDs; existing non-root constraints retained.

Reports remain separate: [combined](evidence/fourth-real-game/factory/v3/qa.json), [Technical](evidence/fourth-real-game/factory/v3/technical/qa.json), [Product](evidence/fourth-real-game/factory/v3/product/qa.json), [Quality Gate](evidence/fourth-real-game/factory/v3/quality.json). Final hard failures are empty.

Control Plane [snapshot](evidence/fourth-real-game/control-plane/snapshot.json) and [dashboard](evidence/fourth-real-game/control-plane/dashboard.html) show Technical PASS, Product PASS, Quality PASS, Factory READY_TO_SHIP, repair2/5.

| Area | Evidence |
| --- | --- |
| Technical hard gates | Load/assets, console/page errors, start, keyboard/touch, progress/score/interaction, terminal/restart, pause/resume, hidden/pagehide, overflow, freeze and resource caps PASS |
| First-five-second objective | Exact meaningful goal visible in the initial viewport at all sizes |
| Goal progress | Displayed ROOMS0/3→1/3→2/3→3/3 matches actual state; room/key detail visible |
| Score integrity | Two reversible and two blocked/no-progress probes per viewport, seed1: objective returns, score0→0. Only room clear awards points; extra moves reduce bonus |
| Device Best | Separate CURRENT SCORE / DEVICE BEST; GameKit best600 persists after practice reload |
| Completion | Success and result/finished in the same observed virtual frame:0ms, within100ms contract; no post-success wait |
| Results / replay | Success and TIME UP captured; replay resets tick46→0 |
| 390px readability | Overflow0, critical DOM/canvas fonts≥14px, no reported collisions, controls≥44px |
| Mobile result | Replay x14/y687,85.25×44px, bottom731 within844px first viewport |
| Motion | Initial reduce and runtime bidirectional changes PASS; existing bounded native settlement observed24–50ms |
| Feedback | Three distinct moving frames before settling; reduced mode static alternative holds across intermediate frames then settles |
| Writes | Capture writes0; practice only permitted local GameKit best persistence; production/network writes0 |

Zero-millisecond latency and subsecond optimal QA completion use accelerated browser time. They establish no dead time, not human completion speed.

## Evidence, CI and RC transport

All obtainable version reports, provider requests/responses, ledger, source snapshots as .txt, screenshots and WebM are committed under [evidence/fourth-real-game](evidence/fourth-real-game/). [Artifact index](evidence/fourth-real-game/artifact-index.json) gives SHA256 and byte counts. v3 has50 Product artifacts plus12 common Technical entry/playing/midgame/terminal captures. Unreachable v1 captures were not fabricated.

- [Entry](evidence/fourth-real-game/factory/v3/product/product-390-entry.png), [playing](evidence/fourth-real-game/factory/v3/product/product-390-playing.png), [midgame](evidence/fourth-real-game/factory/v3/product/product-390-midgame.png).
- [Milestone1](evidence/fourth-real-game/factory/v3/product/product-390-milestone-1.png), [2](evidence/fourth-real-game/factory/v3/product/product-390-milestone-2.png), [3](evidence/fourth-real-game/factory/v3/product/product-390-milestone-3.png).
- [Success / mobile result](evidence/fourth-real-game/factory/v3/product/product-390-mobile-result.png), [failure](evidence/fourth-real-game/factory/v3/product/product-390-failure.png), [desktop midgame](evidence/fourth-real-game/factory/v3/product/product-1280-midgame.png).
- [Gameplay WebM](evidence/fourth-real-game/factory/v3/product/product-390-gameplay.webm): short generic QA input/feedback recording, not a promotional video or full real-time human session.

Cloud Preview Start/Pause and resolved asset URLs were observed. Its separate screenshot could not synchronize for attachment; all Docker images/video above are preserved.

[Workflow evidence](evidence/fourth-real-game/workflow-evidence.json) includes exact RC check results and archive digests:

| Run | Purpose | Result |
| --- | --- | --- |
| [35807305853](https://github.com/andysong111/auto-lab/actions/runs/35807305853) | Build + repair1 and DockerQA | RC_READY v2 |
| [35808143408](https://github.com/andysong111/auto-lab/actions/runs/35808143408) | Read-only deployment metadata | SUCCESS |
| [35808995510](https://github.com/andysong111/auto-lab/actions/runs/35808995510) | Exact-ledger resume + repair2 and DockerQA | RC_READY v3 |
| [35809197340](https://github.com/andysong111/auto-lab/actions/runs/35809197340) | Exact RC CI/deployment + protected HTTP smoke | READY_TO_SHIP |

Release artifact10729540989, ZIP SHA256 `6c02775dde2bbd2e906e375f7dd6b3ca88254e0064c9703709f75b2c67288157`.

Exact RC commit CI passed Factory contracts/browser/regression, AI provider/isolated worker checks, all three Product Docker fixture shards, smoke and applicable project regressions. Production-only live was skipped. Existing Astra/Deep Descent/Core Pins/Nova Merge/Orbit coverage remains in the regression suite. Six local design/Preview observation tests passed;105 pre-paid tests passed.

The unchanged GitHubVercelAdapter prepared RC and Draft PR. [Preview smoke](evidence/fourth-real-game/factory/v3/preview-smoke.json) obtained HTTP200 and byte identity for all seven non-Markdown files, including HTML, GameKit and manifest. No normalization or stripping.

Direct authenticated HTTP was unavailable in Work. A read-only Actions transport used an ephemeral RSA/AES sealed temporary Preview grant; private key remained outside uploaded state and was deleted. Only ciphertext and nonsecret audit metadata are in git. No grant token/cookie was published. This transport made zero model calls and reused the unchanged Factory release adapter. [Transport audit](evidence/fourth-real-game/protected-transport.json)

## Limitations and continuation

READY_TO_SHIP is not production approval or a fun/retention claim. Legacy qualitative heuristics remain UNVERIFIED; measured Generic Product checks provide the concrete evidence.

Known weaknesses: elapsed-time text exposes long decimals; compact flat presentation has no audio; replay repeats the seed; samples transform the same three topologies; most key-order decision depth is in room3. The15–40-second human target has no usability-study validation. Generic visual checks establish readability/feedback, not aesthetic quality. Farming probes cover declared samples, not an exhaustive exploit proof.

Coverage gap: root-mounted Docker QA does not automatically reproduce Vercel clean-URL canonicalization. Generic observed-URL intake found the real defect and drove AI Repair. Next commissioning should specify hosting-path-independent resolution before generation; no bespoke Product QA was introduced.

Read this handoff, final manifest, v3 Product/combined QA, repair audit, Preview smoke and release packet. Runnable RC source is in Draft PR#56; reviewed oracle and trusted evidence/helpers are in Draft PR#55. Preserve both references. Owner review stays PENDING; production.authorized=false. Protected Preview may require the owner's existing access; no temporary grant is published.

Rollback base is exactly `e3203597e414ee258b7816f189eed3f4cff1392b`. No production rollback is required. Do not reset/recommission prior terminal games, create a fifth candidate, or rerun paid request files. Durable operation IDs and ledger remain authoritative.
