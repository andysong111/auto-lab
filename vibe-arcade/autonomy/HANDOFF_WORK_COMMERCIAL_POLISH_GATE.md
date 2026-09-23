# Commercial Polish Gate v1

Status: implementation under verification; Docker fixture and regression CI results will be recorded here before handoff.

Base: `417c7e2ee2760ec7541ac57489d6c2e7ae56f57a`. Branch: `feature/commercial-polish-gate`.

Technical QA → unchanged Generic Product QA → Commercial Polish → Quality Gate. The new stage runs in the existing pinned, network-disabled, read-only Docker Chromium boundary. No host candidate QA fallback. All three viewports remain required, with native touch at 390×844 and keyboard at larger viewports.

New machine contract declares reviewed oracle state pairs, visual regions, core-action probes, intermediate timing, nonnumeric early/mid/late progression, result presentation, audio requirements or reviewed silence, local foreground/background hierarchy, replay motivation and diagnostic performance. Its exact hash and the product contract hash require a trusted review entry. Candidate data cannot supply executable QA or alter thresholds.

Hard checks use actual PNG pixels, normalized region comparison, structural diagnostics and text masks; normal player inputs cross-check the existing data-only product oracle. Feedback records before, two intermediate frames and settled output, including reduced-motion alternatives. Independent audio event checks collect real WebAudio destination energy, gesture timing, voice/context bounds, mute, pause and pagehide cleanup. Headless frame and resource measurements are diagnostics, not phone FPS.

The provider-neutral `VisualReviewAdapter` accepts evidence data only. The shipped machine corroboration adapter binds issues to hashed captures and explicitly reports aesthetics UNVERIFIED. No live vision provider or paid generation call is used. Machine PASS plus complete visual evidence and no critical corroborating issues is the implemented pass rule; it does not certify fun, retention or aesthetic parity with a commercial title.

Fixtures: COMMERCIAL_GOOD, BAD_INVISIBLE_TOPOLOGY, BAD_TELEPORT, BAD_FLAT_PROGRESSION, BAD_RESULT, BAD_HIERARCHY, BAD_AUDIO, BAD_MOBILE_DENSITY, MULTI_COMMERCIAL_BAD. These are infrastructure fixtures based on the existing reviewed switch oracle, not commissioned game candidates.

Every commercial defect carries expected/actual values, viewport, relevant state pair/probe/region/selector and capture references. The existing repair request preserves all issues and operation IDs. Lifetime budgets and provider call limits are unchanged. Control Plane separates Technical, Product, Commercial and Quality statuses; historical missing Commercial evidence is UNVERIFIED and holds RC progression. New paid worker jobs require reviewed Commercial contracts before provider execution. Release packets require Commercial PASS.

Benchmark interpretation: Top Lords is a quality rubric reference only (simple input, strong response, visible scale/progression and completion feedback). Official listing: https://play.google.com/store/apps/details?id=com.gamespark.topking.gp&hl=en . No external artwork, screenshot, source, wording or mechanic was copied. Astra Sentinel and Deep Descent remain regression baselines.

Cost/model calls: 0 paid gameplay calls, 0 paid visual-review calls; provider ledger unchanged. Production auto-ship OFF. No new candidate, catalog/homepage/sitemap/DB change, candidate revival, repair reset or production deployment.

Next candidate: author product and commercial data contracts together; independently review complete decision-state coverage and regions; pin approval hashes in trusted infrastructure; only then authorize the existing build. Generated source cannot self-approve its own contract. Existing rejected candidates remain terminal.

Rollback: revert this infrastructure PR as a unit. Never rewrite candidate manifests, provider ledgers or terminal dispositions to roll it back. Keep production shipping disabled.

Known limits: fixed thresholds are conservative visual guards, not complete aesthetic judgment. Review quality and coverage matter; numeric text is masked but complex image-rendered typography cannot be semantically recognized. Canvas 2D/DOM/WebAudio are instrumented; native/device-specific performance and human perception still need owner review. Live visual AI remains optional and unconfigured.

## Keywake read-only audit

Archived v6 entry PNG (390×844) and independently reviewed seed 1 / room 1 layout are preserved under `evidence/commercial-polish/keywake-readonly/`. The open `[0,4]` edge and absent `[1,5]` edge are parallel boundaries between adjacent floor tiles. Reviewed 18×10 pixel regions contain the relevant boundary marker, excluding labels and player/key sprites. The generic archive comparator found mean pixel delta **0**, changed fraction **0**, structural delta **0**, unmasked fraction **1**. It emits `product_route_topology_not_visible` with the same machine thresholds as live capture. Source review corroborates that mask-0 passages are skipped and absent-edge walls are never drawn.

This is an archived-pixel diagnostic, not a fresh full candidate run. Source `b6d1cfe671f88687dc289aa0eb38dc3972d5de638b99175f78166f98403fd629`, candidate commit `67623d8f6132e40f41208bde38776e89ce06c23d`, evidence commit `52235734dd9769a257c814f2b128615b1ec1e806`. Keywake remains REJECTED at repair 5/5 and lifetime calls 6/6. No source execution, provider call, state mutation, new ID or production authorization.

## Verification scope

Local unit results: Factory 46/46, Worker 55/55, Generic Product 8/8, Commercial 12/12. Commercial tests cover schema strictness, reviewed semantics, raster/text-mask behavior, bound visual-review response, fail-closed evidence, all-issue repair handoff, terminal budget, Control Plane holds, Docker argument isolation, archived Keywake detection, combined suite ordering and real commissioning rejection of missing/self-approved contracts.

`evidence/commercial-polish/protected-baseline.json` records exact unchanged Git blob SHAs for the Generic Product worker/contract/browser/schema/registry, provider lifetime budget configuration, catalog and production Control Plane policy. Historical infrastructure tests retain their explicit trusted fixture exemptions; real commissioning has no missing-contract exemption.
