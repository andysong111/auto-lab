# LoopJolt Stage 2-1 — bounded runtime extraction

Owner approved all four decisions on 2026-09-20: unchanged gameplay/UI, Deep Descent only, preserve game specifics via adapter, automatic reversible no-cost deployment after checks.

## Scope boundary
Config/profile/login integration, ranked start, input-only score submission, same-run retry and version-checked board reads become reusable. Existing LoopCommunity still owns credentials. Do NOT modify other games, game rules/render/audio/CSS, session policy, DB/Edge/OAuth, ads or scheduled posts. No additional packages/subscriptions.

## Baseline and resume point
- Released main: 8e373aa5211cd50c9e109ae7d02ed646d0fba762
- Prior Descent app blob: cdf737e09606920115553dcd858cce0ec0245d3c
- Branch: refactor/runtime-stage-2-1
- PR: #19
- Current checkpoint: implementation and local tests complete; review/CI/production confirmation still required. This file does NOT claim deployment.

## Completed locally
- 41 runtime/adapter tests (includes actual Community provider with fake VM transport).
- Existing 22 Descent core/adapter tests.
- Existing browser suite: 4 viewports, practice/mock-ranked, failed start, retry, pause/frame/visibility downgrade, stale response, capture isolation, all 48 rings and six seals.
- Before/after comparison: same gameplay snapshots, UI text/state and platform request bodies. Six screenshots (390/1280 × entry/play/result) had zero changed pixels in the completed local run. Protected source files match exactly. No real production player or score was created by tests.

## Finish gates
1. Commit tested files to this PR in one batch; review findings; all required CI green.
2. Merge with expected head SHA and verify Vercel Production serves exact committed code.
3. Live read-only config/board check and guest practice/browser screenshot; never impersonate the owner or claim fake-profile QA as a real Google-user E2E.
4. Record merge/deployment/test results in PR #19. Stop at 2-1; do not begin 2-2 in the same change.

Rollback: revert PR or restore preceding deployment. No score/schema rollback required.
