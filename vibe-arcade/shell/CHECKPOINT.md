# Stage 2-2 — Game Shell

## Scope / baseline
User approved 2-2 after Runtime2-1. Baseline main b278caafd1e9f56f51422cdf5d6ccceaaaef7e01. Branch refactor/game-shell-stage-2-2, PR20.
Deep Descent-only UI binding extraction. Existing markup/copy/CSS/graphics/controls/scoring/Runtime/auth remain. No backend, other-game migration, new dependency/payment or social work.

## Implementation ready locally
- shell/core.js: reusable static-markup slots, entry controls, HUD text/meters, pause, native result dialog, identity/status presentation and common action routing.
- descent/shell.js: keeps game-specific copy/metrics out of the shell.
- descent/app.js: delegates presentation, retains rules, inputs/timing and Runtime current-result checks.
- Failed ranked replay restores entry buttons; stale close events cannot reset a new run.
- 38 isolated shell/browser checks; Runtime41 + Descent22; existing 4-width full-course suite plus replay-failure/Escape; 6 exact before/after state/DOM/request/screenshot pairs locally.
- Screenshots are mocked QA, not real-player or advertising evidence.

## Finish gates
Commit tested source, inspect review, pass all CI, merge with expected head and verify deployed blobs/guest behavior. Until confirmed in the PR20 release comment this file DOES NOT claim deployment. Do not update DB or impersonate a real Google user for QA.

## Resume
Read this file and PR20's last release/checkpoint comment. Stop after 2-2; Stage2-3 not started. Rollback: PR revert/previous Vercel deployment. No database rollback.
