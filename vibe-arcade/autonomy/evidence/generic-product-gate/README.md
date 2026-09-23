# Generic Product Quality Gate evidence

Verified code: `fd13b3f202fe72624bcd0596f13ca7700a5e7cb7`, [product CI](https://github.com/andysong111/auto-lab/actions/runs/35751765988), [PR #53](https://github.com/andysong111/auto-lab/pull/53).

- [Overall verification](verification-summary.json) — all 12 fixture assertions pass; GOOD/delayed PASS; ten intentional negative fixtures correctly FAIL.
- [CI and downloaded archive identities](github-verification.json) — all nine workflows green on the tested code.
- [GOOD product report](final/GOOD/qa.json), [Quality Gate PASS](final/GOOD/quality-gate.json), [artifact index](final/GOOD/artifact-index.json).
- [Common Technical QA](final/TECHNICAL_GOOD/qa.json), with its original entry/playing/midgame/terminal PNGs.
- [MULTI_BAD combined report](final/MULTI_BAD/qa.json), [Repair request](final/MULTI_BAD/repair-request.json), [compiled feedback](final/MULTI_BAD/repair-feedback-summary.json), [Control Plane](final/MULTI_BAD/control-plane/snapshot.json).
- [Production regression](production-regression.json), [read-only historical audit](legacy-audit.json).
- [Iteration 1](iterations/01.json), [iteration 2](iterations/02.json), and [iteration 3](iterations/03.json) record actual fixture/harness failures before correction, including the live-clock setup race.

Every fixture directory contains its own report and artifact index, including native media settlement samples, normal-input seed traces, screenshots and WebM. Artifacts are test fixtures, not launch candidates. All files are copied unchanged from verified CI archives; no secret or temporary download URL is stored. The media is accelerated QA capture, not human play or marketing evidence.

Prism, Cloud Cargo and Ribbon Shift remain REJECTED, repair 5/5. Historical manifests and quarantined source text are read-only data, never executed by this work. Model calls and estimated model cost: 0. No production action.
