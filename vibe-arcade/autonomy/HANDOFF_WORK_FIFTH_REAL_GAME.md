# HANDOFF — Fifth Real Autonomous Candidate

## Terminal disposition

- Game: Shard Armada
- GAME ID: `GAME-20260923-151`
- Mechanic family: `aimed-salvo-recruitment-siege`
- Base main: `ebb8b858b528f7d7829cd3f0a5b4d0074af0a177`
- Commissioning PR: #61
- Original commissioning run: `35836436847`
- Final Factory state: **REJECTED**
- Terminal target version: `v6`
- Repair accounting: **5 / 5**
- Production authorization: **false**
- Production/public catalog/ranking/DB/auth/SNS/ads changes: **none**
- Revival, repair reset, or cloned GAME ID: **forbidden**

The terminal disposition is immutable. The candidate must not be revived or copied to a fresh ID to bypass the exhausted repair budget.

## Pre-paid gates

Before the first model call, all five reviewed preflight gates passed:

- Commissioning Spec — PASS
- Product Contract — PASS
- Commercial Contract — PASS
- Reviewed Product Oracle — PASS
- Reviewed Commercial Contract — PASS

This was design/data review only. It did not claim browser, pixel, audio, or human-fun conformance.

## Provider operations and cost

Only three paid provider operations were actually submitted:

| Operation | Materialized version | Result | Input | Output | Estimated cost |
| --- | --- | --- | ---: | ---: | ---: |
| `GAME-20260923-151/build/v1` | v1 | COMPLETE | 6,846 | 5,705 | $0.130074 |
| `GAME-20260923-151/repair/2` | v3 | COMPLETE | 9,795 | 6,917 | $0.163686 |
| `GAME-20260923-151/repair/4` | v5 | COMPLETE | 9,796 | 5,567 | $0.139390 |

Total: **3 calls**, 26,437 input tokens, 18,189 output tokens, estimated **$0.43315**.

Attempts 1, 3 and 5 did not submit a provider call.

## Materialized source history

Provider-backed candidate source exists only for:

- v1 — initial build
- v3 — repair/2
- v5 — repair/4

No v2, v4 or v6 candidate source was materialized.

Latest successfully materialized source:

- version: `v5`
- source hash: `4f049cca182a8fe6f7e5bc8adc64ebc4e03f507dcf93115b2e5c017406bbfeef`
- provider operation: `GAME-20260923-151/repair/4`
- response: `resp_08ac8e585337691f006ab38ec6769c87d18c1fa7536e722261`

Recovered provenance is stored at:

`vibe-arcade/autonomy/commissioning/fifth-real-game/recovered/source-provenance-v5.json`

All six generated v5 files were verified byte-identical to the latest COMPLETE provider response for those paths. Factory-supplied `gamekit.js` and `manifest.json` remain outside model ownership.

## QA history

### v1

Technical, Product and Commercial were all non-passing.

Representative failures included:

- no score/progress change
- mobile text below required readability threshold
- sub-44px controls
- reduced-motion presentation not settling
- feedback presentation missing
- practice-best mismatch
- Commercial run timeout

### v3

Non-passing issues remained and expanded to include:

- mobile readability
- reduced-motion behavior
- feedback presentation
- reviewed difficulty/depth transition mismatches
- progress/completion/replay failures
- practice-best mismatch
- Commercial run timeout

### v5

The final materialized candidate still had genuine product/technical failures, including:

- no observed score/progress change in technical probes
- start/mute controls below 44px on 390px mobile
- reduced-motion presentation not settling
- feedback presentation missing
- reversible score-integrity probe not returning to the reviewed state
- reviewed progression/difficulty transition mismatches
- normal-input completion not reached as required
- replay/result failures
- practice-best mismatch
- Commercial run timeout

Therefore this candidate did **not** satisfy the launch contract independently of the infrastructure defect described below.

## Infrastructure defect discovered

The repair compiler in `providers/prompts.cjs` assumed that any present Product/Commercial suite report always contained full `checks` and `artifacts` arrays.

Commercial timeout fallback reports can legitimately exist without those arrays.

The compiler attempted:

- `full.commercial_qa.checks.filter(...)`
- `full.commercial_qa.artifacts.map(...)`

on that fallback shape, producing:

`Cannot read properties of undefined (reading 'filter')`

This happened before provider submission on repair attempts 1, 3 and 5. Factory then classified the trusted compiler exception as `build_failed`, moved to the next repair attempt, and eventually reached repair 5/5.

This is a Factory defect and must be fixed before another real candidate is commissioned. It does **not** authorize retroactive repair-budget restoration for Shard Armada.

## Original workflow conclusion

The actual provider/QA loop itself completed and returned terminal `REJECTED`.

The GitHub Actions run nevertheless concluded `failure` because the post-terminal provenance step attempted to open terminal target `v6/core.js`. v6 never materialized, so the script failed with ENOENT.

The lifetime artifact upload still succeeded and was recovered as artifact `10740625919`.

Recovery metadata is retained at:

`vibe-arcade/autonomy/commissioning/fifth-real-game/recovered/recovery-status.json`

## Required Factory lessons before candidate six

1. Repair-context compilation must accept timeout/fallback Product/Commercial suite shapes without assuming optional arrays exist.
2. Unexpected trusted pre-provider context-compilation faults must pause/retry the same attempt rather than silently consume another game repair attempt.
3. Terminal provenance must audit the latest successfully materialized version when the terminal target version failed before source materialization.
4. Regression tests must cover all three behaviors.
5. Do not weaken Product or Commercial contracts to make the candidate pass.

## Final decision

Shard Armada / `GAME-20260923-151` remains:

**REJECTED — repair 5/5 — terminal — no production.**

No RC PR is created. PR #61 is retained only as commissioning/evidence provenance and should be closed unmerged.
