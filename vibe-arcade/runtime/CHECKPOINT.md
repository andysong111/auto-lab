# LoopJolt Stage 2-1 — bounded runtime extraction

Owner approved all four decisions on 2026-09-20.

## Scope
- Extract config/profile/login integration, ranked start, input-only score submission, same-run retry and version-checked board reads into a reusable runtime.
- Integrate ONLY Deep Descent, using an adapter over the existing LoopCommunity provider. Do not copy/store credentials or change Google/OAuth/session policy.
- Preserve all current HTML/UI copy, CSS, game rules, rendering, audio, input timing and local records. No database or Edge migrations. Other games stay untouched.
- No dependencies, paid subscriptions, assets, generation credits, social posts or ad spending.
- Automatically merge/deploy only after tests and visual/behavioral regression gates; no new approval needed for this reversible scope.

## Baseline
main: 8e373aa5211cd50c9e109ae7d02ed646d0fba762
Deep Descent app blob: cdf737e09606920115553dcd858cce0ec0245d3c
New branch: refactor/runtime-stage-2-1
Source + built-assets baseline recovered from PR18 quality-gate artifact (e46002d, merged unchanged).

## Planned gates
1. Pure runtime tests: practice/capture isolation, failed/duplicate/stale start, exact-version enforcement, immutable input snapshots, verified vs unconfirmed save, same-ID retry, stale-response isolation, auth expiry and board errors.
2. Existing full Deep Descent browser flow and deterministic rules unchanged.
3. Before/after identical input trace + DOM/screenshot comparison on desktop/mobile.
4. CI review, Production browser/read-only API checks. Never call a mock login or synthetic score a real Google-user E2E.

## Current checkpoint
Scope recorded. Implementation not yet merged or deployed. Resume by reading this file, the PR head and test results, not by repeating the whole project history.
