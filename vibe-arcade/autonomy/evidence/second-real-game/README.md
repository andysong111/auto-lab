# Cloud Cargo commissioning evidence

Final: GAME-20260922-121 v6 REJECTED, repair5/5. Six real Terra responses failed output validation; no candidate browser QA or release occurred.

- `manifest.json`, `immutable-spec.json`, `spec-gate.json`: authoritative rejected job and pre-paid gate PASS.
- `provider-ledger.json`, `commissioning-summary.json`: six original operation/response IDs, actual usage, USD0.690536 estimated.
- `factory/`: original five Repair Requests and build-failure history.
- `rejected-responses/`: six existing provider outputs recovered by GET; no new generation calls. The summary identifies the browser-only core export in every response and proves ledger/state unchanged.
- `source-provenance.json`: quarantined response provenance only; accepted_candidate=false and Factory source_hash=null.
- `quarantined-v6/*.txt`: readable rejected source data; never applied or executed.
- `verification-coverage.json`: candidate QA, seeds, mobile/reduced-motion/screenshots/video not executed or unavailable.
- `release-review-packet.json`: passed=false, production.authorized=false.
- `production-regression.json`, contract logs and `baseline-*.png`: existing-game/system tests. The PNGs are NOT Cloud Cargo screenshots.
- `github-verification.json`: execution/CI/artifact/source references.

Complete interpretation and next-team actions: [handoff](../../HANDOFF_WORK_SECOND_REAL_GAME.md). Do not rerun the paid workflow or use these files as a release-ready source tree.
