# Generic Product Quality Gate v1

Infrastructure work for `andysong111/auto-lab`, starting from exact main `deb415a968afb6fbcaa7d9c9b6855191d7024fe8`. Branch `feature/generic-product-quality-gate`, [Draft PR #53](https://github.com/andysong111/auto-lab/pull/53). No new launch candidate, paid generation, historical repair/reset, production deployment or main merge.

Verification is in progress on this draft. The final evidence section will be updated after the final Docker/CI run; earlier runs below are explicitly versioned.

## Architecture and integration

The existing Technical Hard QA worker remains byte-for-byte unchanged. The existing Docker adapter dispatches fixed trusted suite names, runs Technical QA plus Product QA in separate containers, then combines their reports. No candidate ID, title, mechanic family or candidate-authored QA script is selected by the runner.

`product-worker.cjs` reads the immutable manifest's machine contract, while the prose `implementation_contract` remains in the immutable spec. GameKit adds cloned optional `quality` and `presentation()` diagnostics. No diagnostic setters, state mutation or solver hooks are exposed. Ordinary start/replay clicks and Chromium keyboard/touch input are the only pilot actions.

Technical failures retain the original QA_FAILED/repair/fatal behavior. Technical PASS with a product report enters Quality Gate even when Product QA fails. The gate verifies report/source/policy/contract/runner identity, Docker isolation, reviewed oracle approval, required checks and six-seed evidence. Product defects yield QUALITY_FAILED → existing REPAIR_PENDING. Five repairs still exhaust to REJECTED; fatal production/path/source violations remain fatal.

A missing product contract cannot produce a default Quality Gate PASS. Real Worker preflight pauses an unreviewed contract before provider reservation/submission. New commissioning `check-spec` requires and validates the reviewed machine contract before any paid generation. Release packets also require separate technical/product PASS. Existing technical-only infrastructure fixtures use an explicit trusted test policy or validated mock provider path; these exceptions cannot commission a real candidate and their product status remains UNVERIFIED.

## Schema and diagnostics

- [Machine contract schema](schema/product-quality-contract.schema.json): objective, progress, score, best, completion, replay, difficulty, mobile, reduced_motion, feedback and normal action declarations.
- [Example](schema/product-quality-contract.example.json) and [updated commissioning template](commissioning/examples/real-game-spec.template.json): intentionally unapproved placeholders. The old rejected game ID is removed from the template.
- [Contract validator and data-oracle review](qa/product-contract.cjs).
- [Runner](qa/product-worker.cjs), [trusted canvas/frame instrumentation](qa/product-browser.cjs), [operating and migration documentation](qa/README.md).

Selectors are bounded CSS strings; state paths are traversed read-only without eval and reject prototype access. Bounds enforce at least six unique seeds, minimum 12px critical text, 44px controls, terminal latency no more than 1000ms and bounded actions. Score, best, time/tick and HP/health paths cannot supply difficulty. Best is explicitly `GameKit.best`; score/best selectors are distinct.

A result contains suite/version/hash identity, oracle approval, independent `checks`, structured `hard_failures`, three viewport cases, deterministic seed traces, screenshots, artifact records, capture side effects, separately audited practice effects and Docker isolation metadata. Every actionable failure includes the exact check, selector/state path where applicable, expected versus actual, viewport/seed and evidence references. Missing or physically blocked checks cannot silently become PASS.

## Difficulty strategy and reviewed diagnostic adapter

There is no universal semantic solver. V1 deliberately supports a bounded, **reviewed data-only finite-state graph**, rather than arbitrary candidate Playwright or JavaScript adapters.

`qa/reviewed/registry.json` pins both the graph and the entire product-contract digest, scope and reviewer. The graph specifies decision-relevant state projections, per-seed initial states, stages, normal-action edges and success nodes. It contains no executable code, DOM access or state/score mutation authority. The registry is trusted infrastructure in the pinned Docker image, outside Provider output/Repair scope. The checked-in graph is **test-only**, and production preflight rejects it.

Trusted code independently computes shortest paths and consequential branching width. Chromium then cross-checks the graph against real input:

1. Each of six seeds runs twice, via touch and keyboard.
2. Stage-entry alternatives are exercised using normal input and reviewed return paths; no-op or fake advertised choices fail.
3. Every model edge on the solution path must match the actual projected state and increment meaningful actions exactly once.
4. Actual solution action counts equal independently derived shortest-path lengths. Every later stage increases both consequential choices and required actions.
5. Both runs must match decision-state, score and quality traces. This is sampled reachability/determinism, not proof over all 32-bit seeds or a human success-rate estimate.

The fixture's derived widths are 3 → 4 → 5 and shortest solution actions 2 → 3 → 4. Branch probes add verification actions but do not inflate the reported minimum solution cost. The full graph is bounded at 128 nodes/seed, 24 model seeds, eight outgoing actions and a contract action budget up to 64.

V1 requires bounded return paths for stage-entry choice probes. Irreversible-entry games and continuous/large-state games fail preflight as unsupported rather than passing invented numbers. Extending that data contract is a future reviewed infrastructure task. Approval must establish that the projection and graph capture meaningful decisions; the model's own declarations are never a sufficient approval.

## Product checks and repair efficiency

- First-five-second objective: visible meaningful declared text in the initial viewport.
- Goal progress: exact state-to-DOM formatting and every declared milestone.
- CURRENT SCORE / DEVICE BEST: separate visible labels/values; GameKit storage key and practice reload persistence; capture writes zero.
- Completion: objective success reaches a visible complete result within the declared bound, measured from frame observations. Failure result also exercised. No post-success time-filling exemption.
- Score integrity: declared reversible/no-progress cycles must return to the same objective state without net score gain. Coverage is explicit when probes are omitted.
- Replay: normal restart resets to reviewed initial state; primary replay must fit the first 390×844 result viewport.
- Mobile: horizontal overflow, DOM critical text collisions, critical fonts, DOM controls and canvas hit regions. Canvas fillText/strokeText instrumentation checks transformed text bounds, collisions and clipping.
- Motion: initial reduce plus live no-preference ↔ reduce transitions. Main's unchanged 800ms bounded native media settlement helper avoids false failures from delayed event delivery; permanently stale presentation fails.
- Feedback: declared meaningful state change plus measured before/intermediate/settled visual changes. Normal mode must have transient presentation; reduced mode accepts visible static feedback. Probe PNGs and a mobile WebM are indexed.

Independent checks are caught and recorded individually. Fresh contexts isolate success/replay from score/motion probes and exercise failure/initial-reduce separately. A failed reduced-motion assertion cannot suppress score, replay, readability, terminal, practice or seed checks.

Repair requests preserve all independent failures. Provider prompt compilation preserves gate failures alongside browser failures, carries the product contract and references the evidence index. It does not lower the contract, replace diagnostics or allow edits to Factory policy/manifest/GameKit/oracle.

## Fixtures and evidence

Authored infrastructure fixtures only: GOOD, BAD_SCORE, BAD_RESULT, BAD_MOTION, BAD_GOAL, BAD_FEEDBACK, DELAYED_MEDIA_GOOD (75ms native application delay), PERMANENT_MEDIA_BAD, MULTI_BAD, plus BAD_DEADTIME, BAD_TEXT and BAD_GOAL_OPACITY.

The generic runner automatically records entry, playing, midgame, each progress milestone, success, failure, mobile result and desktop midgame; physically unreachable phases are documented as failed checks. Feedback crops preserve before/intermediate/settled frames and hashes. The mobile recording is an accelerated QA capture, not human-play evidence. Every exported artifact is indexed and bound to source/contract. The Docker exporter now preserves the pre-existing common QA entry/playing/midgame/terminal images and enforces filename/type/size/count limits; missing exports fail instead of silently disappearing.

[Evidence directory](evidence/generic-product-gate/) contains versioned results. First iteration [35744478763](https://github.com/andysong111/auto-lab/actions/runs/35744478763), commit `23661fe8e8c12e8308bea088c85c5d10cb73fe4e`, classified all product fixtures correctly, including delayed PASS and permanently stale FAIL. The suite still failed because its extra common-QA check found a fixture touch-edge/observation defect. The fixture was corrected; the common runner and assertions were not changed. [Iteration record](evidence/generic-product-gate/iterations/01.json) preserves the failure, rather than relabeling it green.

## Control Plane

Snapshots expose `technical_qa`, `product_qa`, and `quality_gate` independently, plus `repair_attempt / max_repair_attempts`. Product failure check names are displayed in the noindex dashboard with HTML escaping. Legacy jobs show UNVERIFIED product quality. The dashboard explicitly says Technical CI PASS does not establish product quality or authorize release. Actual MULTI_BAD Factory evidence includes the generated dashboard, manifest, combined report and repair request.

## Existing rejected candidates

[Read-only migration audit](evidence/generic-product-gate/legacy-audit.json) uses copies of original manifests/evidence from [Prism polish PR #46](https://github.com/andysong111/auto-lab/pull/46), [Cloud Cargo PR #49](https://github.com/andysong111/auto-lab/pull/49) and [Ribbon Shift PR #51](https://github.com/andysong111/auto-lab/pull/51). The first-game handoff was also read; its historical v4 readiness is superseded by Prism's terminal rejection.

All three remain REJECTED, repair 5/5. None has a reviewed v1 machine contract, so Generic Product QA remains UNVERIFIED and the default gate refuses approval. Their historical browser results are not rebranded as new generic PASS evidence. No old source was executed or modified. The current static provider validator re-confirms Cloud Cargo's quarantined core export at line 33, identifier `window`, without executing it. Manifest and source-text hashes remain unchanged. Existing Ribbon/Prism product weaknesses are historical findings, not newly claimed generic browser reproductions.

## Tests, CI and cost

Required commands:

```sh
npm test --prefix vibe-arcade/autonomy
npm run test:worker --prefix vibe-arcade/autonomy
npm run test:product --prefix vibe-arcade/autonomy
# Pinned Docker image required; deliberately fails closed without Docker.
npm run test:product:docker --prefix vibe-arcade/autonomy
```

CI: [product workflow](../../.github/workflows/playjolt-product-quality-ci.yml), unchanged existing Factory browser/regression workflow and AI Worker isolation workflow, plus existing project workflows. They cover real non-root network-none/read-only Docker isolation, no secret/socket/root writes, resource/deadline containment, bounded repair and fatal rejection, and Astra V3/campaign, Deep Descent, Core Pins/Nova Merge, legacy challengers and Orbit/auth-shell regressions with mocked production dependencies.

Local verification currently passes 42 Factory/control/commissioning tests, 53 Provider/Worker tests and eight product contract/preflight/static-audit tests. Final Docker and exact-commit CI results will be recorded below when complete. Model generation calls: **0**, estimated model cost **USD 0**. No provider secret is required by the new workflow. CI/hosting usage is not included in that model-cost statement.

## Known limitations, next candidate and rollback

This is a generic enforceable product baseline, not a fun/retention/marketability score. Text meaning and true decision relevance require reviewed contract/model semantics. Only sampled seeds and observed decision-state determinism are proven. V1 supports bounded finite graphs with return paths; continuous/large/irreversible cases need a reviewed extension. Canvas auditing covers native text drawing, not glyphs drawn as arbitrary paths/images. Rotated text uses conservative axis-aligned collision boxes. Visual delta cannot independently know whether unrelated decoration explains the mechanic; the reviewed probe region and actual frames matter. Score integrity covers declared bounded probes, not every possible exploit. Audio and bfcache-specific media-listener restoration are not newly generalized here; fixtures are silent.

For the next separately authorized candidate, review a small graph and the whole contract, register candidate-scoped digests, rebuild/pin the QA image and pass commissioning check-spec before Builder. Keep the prose design brief. Builder/Repair alone implements candidate code. Missing coverage must remain blocked or UNVERIFIED. Never migrate terminal Prism/Cloud/Ribbon by resetting counters or changing IDs.

Rollback base: **`deb415a968afb6fbcaa7d9c9b6855191d7024fe8`**. This branch is unmerged infrastructure; close/revert its commits if unwanted and preserve audit evidence. No production app or database rollback is needed. No homepage, sitemap, ranking, auth/country, Supabase production, SNS or advertising change was made.
