# Generic Product Quality Gate v1

`worker.cjs` remains the Technical Hard QA runner. `product-worker.cjs` adds an independent product suite. The Worker already uses `DockerQA`; when a manifest contains `product_contract`, that adapter runs both suites in separate read-only, network-none containers, then writes a composite `qa.json`. Product failures enter the existing bounded Factory Repair flow. Fatal technical policy failures still stop execution immediately.

Run unit contracts with `npm run test:product`. Build the reviewed QA image using the existing isolation Dockerfile and run `FACTORY_QA_IMAGE=sha256:... npm run test:product:docker`. There is no host Chromium fallback and no model call. The product workflow runs the fixtures; existing Factory, Worker and production regression workflows are preserved.

## Contract and trust boundary

`schema/product-quality-contract.schema.json` is additive to the prose implementation contract. It declares visible selectors, exact progress formatting, diagnostic paths, labels, terminal outcomes, legal keyboard/touch inputs, reversible/no-progress probes, mobile text and hit regions, reduced-motion and feedback probes, and at least six seeds. Bounds cannot weaken minimum font/hit sizes, media settling or terminal latency. Selectors and paths are data; executable adapters and setters are not accepted.

GameKit snapshots clone optional `core.observe(state).quality` and the `presentation()` callback supplied to `GameKit.create`. They expose no QA action or mutation API. Quality metrics are not sufficient for PASS. The runner dispatches ordinary browser keyboard/touch events, with normal start/replay buttons, and verifies state, accepted input counters, DOM and rendered evidence.

## Reviewed diagnostic adapter

V1 supports a bounded finite-state transition **data** oracle. `qa/reviewed/registry.json` pins both model and whole product-contract SHA-256 digests. Its model file has only projections, per-seed initial nodes, projected values, stage identifiers, normal-action edges and success nodes. It has no code, DOM selectors, browser handles, score setter or mutation authority. Trusted Factory code enumerates shortest paths and computes the number of distinct consequential choices. Candidate code cannot change the registry or pinned Docker image. New oracle approvals require code review of the table semantics and contract, including whether the projection covers all decision-relevant state.

The runner compares core stage/complexity against this independent model, then requires increasing shortest-path action counts and branching width in later stages. Each stage-entry alternative is also exercised through normal input and a reviewed return path in both seeded runs; advertised choices that do nothing fail. V1 requires bounded return paths for these probes and fails preflight for unsupported irreversible entry branches. Every legal input on the solved path must reach the expected projected state and increment meaningful actions exactly once. Every seed runs twice, via touch and keyboard, with matching decision-state/score/quality traces. Time, HP and score paths cannot supply difficulty. This establishes reachability and deterministic conformance for the reviewed sample; it does not prove every possible seed or human completion rate.

There is deliberately no automatic approval based on model-provided numbers, candidate-provided JavaScript solver, or a model-authored graph without review. The checked-in oracle is **fixture-only**. Production commissioning rejects it; an explicit trusted test policy enables it in tests. A game outside this finite model requires a reviewed extension to the data contract or remains UNVERIFIED. Review is the unavoidable semantic trust boundary, not a hidden arbitrary solver.

## Checks and evidence

Independent check failures are collected with `check`, `selector`/`state_path`, expected/actual, viewport/seed and screenshot references. A failed media probe does not prevent score, replay, failure, practice best or six-seed checks. Fresh sessions isolate destructive probes from completion and replay. Physically blocked checks remain failures, not silent passes.

- Objective text and initial viewport visibility within five seconds.
- Visible goal progress equals its state path and reaches every declared milestone.
- Separate CURRENT SCORE and DEVICE BEST; exact GameKit practice storage key; reload persistence; capture/network writes stay zero.
- Success-to-terminal latency, success/failure result text, normal replay and mobile first-viewport CTA.
- Declared reversible and no-progress action cycles cannot increase score. No declarations means explicit limited coverage, not a universal anti-farming proof.
- DOM critical font/collision/overflow/hit sizes. Trusted canvas text instrumentation measures `fillText`/`strokeText` and transformed bounds, checks minimum font, collisions and clipping. Declared canvas control rectangles must meet 44px minimum.
- Initial reduce and runtime changes both ways use main's unchanged bounded native media settlement helper. Permanent staleness fails.
- Normal motion needs active feedback and distinct intermediate/settled visual samples. Reduced motion accepts a visible static alternative. Samples, hashes, screenshots and a mobile WebM document this; unrelated animation could confound generic visual deltas, so semantic review remains necessary.

`artifact-index.json` binds exported screenshots/video to source and contract. Entry, playing, midgame, milestones, success, failure, mobile result and desktop midgame are generated by the runner. The Docker exporter retains common QA phase screenshots too and accepts only bounded, regular, allowlisted artifact filenames. Composite paths distinguish `technical/` and `product/`.

## Migration

1. Write the prose implementation contract and machine contract together, before Builder.
2. Describe a small finite decision-state projection, normal actions and stage graph for six seeds. Review semantics and whole contract; register their hashes in trusted infrastructure with `scope: candidate` and named reviewer.
3. Rebuild/pin the trusted Docker QA image. `commissioning/cli.cjs check-spec` now rejects missing, invalid, unreviewed or test-only product contracts before paid generation.
4. Builder implements the immutable contract using GameKit; Repair fixes source against exact evidence. Never rewrite the oracle or weaken selectors to make a failed candidate pass.
5. Technical and product reports must bind the same source, contract and policy before Quality Gate permits RC. Existing legacy technical-only tests opt into a trusted test policy and display UNVERIFIED product quality. The default Factory gate, real Worker preflight and release packet reject missing product contracts; there is no technical-only production bypass.

No historical terminal disposition changes. No public game, production service, ranking or release operation is part of this infrastructure work.
