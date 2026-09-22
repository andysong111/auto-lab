# AI Provider / Autonomous Worker handoff

PR: [#41 — AI Builder/Repair provider and isolated autonomous worker](https://github.com/andysong111/auto-lab/pull/41)

Branch: `feature/autonomous-ai-provider-worker`. Base: main `d0763f7c47a0f801cc82e49b1fd1d7a42c780e9e` (Factory #38 and Control Plane #40 merged). Main is not modified or merged by this task.

Status: **implementation and mock commissioning complete; real paid provider activation remains owner-gated.** GitHub transport recovered on 2026-09-22. Code, operations, test evidence and this handoff are now in the repository. Approval requires [current-head CI green](https://github.com/andysong111/auto-lab/pull/41/checks); the final PR description records the final checked head. No AI paid canary was performed. Production intake stays OFF and `AUTO_PRODUCTION_SHIP=false`.

## Architecture

The existing `Factory`, state graph, quality policy, five-repair budget, GameKit, browser acceptance checks and GitHub/Vercel RC adapter are reused. `orchestrator/engine.cjs` adds only a before-step supervisory hook, propagation of operational holds, and provider metadata in build evidence. Infrastructure failures do not create a new game failure/retry state machine.

| Files | Responsibility |
| --- | --- |
| `adapters/ai.cjs` | `AIBuilderAdapter` and `AIRepairAdapter`, implementing existing adapter interfaces |
| `providers/prompts.cjs` | Immutable Spec → Implementation Contract and actual Factory repair request/qa.json compiler; narrow CSS/core scopes, original-mechanic/no-copy/no-CDN/GameKit rules |
| `providers/output.cjs` | Strict file response validation, size/type/path allowlists, candidate-only writes; factory-owned manifest/kit excluded |
| `providers/manager.cjs` | Durable operation journal and conservative cost reservations before submission; cached output and response-ID recovery |
| `providers/openai.cjs` | Official OpenAI Responses HTTP adapter, background mode, strict JSON output, no tools/SDK retries |
| `providers/config.cjs`, `errors.cjs` | Bounded configuration, explicit recent prices, operational holds vs model failures |
| `worker.cjs`, `worker/{runtime,status,lock}.cjs` | run-once/loop, Control Plane gates, kernel worker/ledger locks, shutdown/crash recovery, status overlay |
| `isolation/` | Reviewed Playwright Docker runtime and no-network/read-only/resource-bounded QA adapter |
| `worker/tests/`, `.github/workflows/playjolt-ai-worker-ci.yml` | Provider/worker contracts plus real isolated browser commissioning; no provider secrets in CI |

The Control Plane snapshot/dashboard reads worker status (`PAUSED_BUDGET`, provider/isolation holds, etc.) alongside the unchanged Factory state. Only existing configured critical codes require owner attention. Routine holds do not send notifications. CLI option parsing after `snapshot`/`dashboard` is corrected. Existing production policy values and exception policy are unchanged.

## Provider and secrets

No model name is embedded in Factory. The real provider uses fixed official OpenAI Responses endpoints via built-in `fetch`, `background:true`, `store:true`, structured file output and no tool execution. Model failures and network/auth/rate-limit/protocol failures are distinguished. Secrets and environment values never enter model prompts or candidate containers.

Required only for an explicitly approved real call:

- Existing secret-store `OPENAI_API_KEY`.
- `FACTORY_OPENAI_MODEL`, selected by the owner for background Responses + strict structured-output support.
- `FACTORY_ALLOW_PAID_CALLS=1` after paid-call approval; disabled by default.
- Explicit model-appropriate `pricing.input_per_million`, `output_per_million`, and `as_of` verified within 30 days. `pricing:null` fails closed.
- `FACTORY_QA_IMAGE=sha256:...` for the locally built reviewed runtime.

Optional RC-only existing secrets: `GITHUB_TOKEN` and `VERCEL_AUTOMATION_BYPASS_SECRET`. No production secret was created/changed, and Supabase credentials are not needed. Injecting another provider does not bypass pricing; zero-price mocks require an explicit trusted test constructor flag and a mock identity. The CLI exposes no mock bypass.

There were **0 real model-generation calls and 0 model API charges initiated by this work**. Mock usage/cost figures are synthetic test evidence. ChatGPT access is not treated as free API entitlement. Existing CI/Vercel plan usage is not asserted to be free or included in the model-cost figure.

## Budgets and recovery

Per-game defaults: 6 generation calls (build + at most 5 repairs), 240k input tokens, 96k output tokens, **$0.50 estimated**, 15 elapsed minutes including downtime. Global UTC-day defaults: 6 generations, **$0.50 estimated**, one concurrent build. Per request: 60k input bound, 16k max output, 120 seconds, 512 KiB response, 64 KiB/file, 24 files. Hard configuration maxima apply.

The ledger reserves conservative UTF-8-byte input bounds plus framing margin and the full output cap before POST. File and containing-directory fsync protect reservation persistence. Known usage refines the estimate; uncertain/missing usage keeps the reservation. Billing is not queried, so amounts remain estimated. Provider-side limits are necessary for an absolute billed-currency ceiling. A limit produces `PAUSED_BUDGET`, preserving the Factory checkpoint.

`operation_id` + immutable request/provider hash prevents changed retries. COMPLETE uses cached validated output. A saved response ID resumes via GET. An ambiguous submission without an ID **never automatically posts again**; reconcile provider logs before authorizing a replacement. `X-Client-Request-Id` is tracing, not a documented billing idempotency guarantee. Preserve `autonomy/.provider/ledger.json` across restarts; never erase unresolved reservations to retry.

## Isolation

Trusted host: Linux, Node 22+, `flock`, Docker. Kernel advisory locks serialize worker and ledger operations, including competing crash recovery. Missing locks/isolation fail closed; no unsafe fallback. Existing Factory job locks remain unchanged.

Candidate execution: immutable local image ID, no pulls at runtime, `--network none`, read-only root/candidate, non-root UID, all capabilities dropped, no-new-privileges, no host home/repository/Docker socket/secret mounts. Default 1 CPU, 1 GiB memory with no extra swap, 128 PIDs, bounded descriptors/temp storage and deadlines. Only QA artifacts and ephemeral browser storage are writable. Both host cleanup and an inner deadline end child processes. The unchanged browser guard records blocked side effects; production-write attempts remain fatal and never enter AI repair.

Verified commissioning image: `sha256:895fc379e63fe422e2a8a9b87d3b080331aed406587d85c47407cead5bb56582` from the reviewed Dockerfile. Rebuild on the chosen worker and record its own immutable ID. Docker is unavailable in this local Work runtime; actual container commissioning was performed in GitHub CI, with no skip or host execution fallback. This is dedicated-host containment, not a claim against kernel vulnerabilities.

## Commands

From `vibe-arcade`:

```sh
node autonomy/worker.cjs run-once
# Default: PAUSED_INTAKE, zero provider calls.

node autonomy/cli.cjs create --root "$FACTORY_WORKER_ROOT" --spec autonomy/examples/dummy-spec.json
node autonomy/worker.cjs run-once --root "$FACTORY_WORKER_ROOT" --policy "$FACTORY_WORKER_ROOT/control-policy.json" --config "$FACTORY_WORKER_ROOT/worker-config.json"
node autonomy/worker.cjs loop --root "$FACTORY_WORKER_ROOT" --policy "$FACTORY_WORKER_ROOT/control-policy.json" --config "$FACTORY_WORKER_ROOT/worker-config.json"
```

Use a durable dedicated state directory outside the checkout. Only its copied commissioning policy may enable intake; repository production intake stays OFF. The worker acquires existing Factory jobs; it does not autonomously create batches. Defaults stop at RC_READY. RC needs both `release_candidates:true` and live Control Plane permission; it reuses the existing branch/PR/checks/Preview/smoke adapter and cannot merge/ship. A killed or intake-disabled worker starts no new calls. Loop defaults: 2-second polling, backoff capped at 30 seconds, 20 polls and one completed job, with no overlaps.

Complete setup, provider contract, official references and recovery instructions: [worker/README.md](worker/README.md).

## Actual validation and evidence

| Check | Result |
| --- | --- |
| Existing Factory / Control Plane | 26 / 26 PASS locally and CI |
| New provider / worker contracts | 50 / 50 PASS locally; initial commissioning CI passed 49 before adding the explicit custom-provider pricing test; current-head CI runs all 50 |
| New real Docker / Chromium integration | 5 / 5 PASS, 0 skipped |
| Existing Factory real Chromium | 9 / 9 PASS locally and CI |
| Existing production canonical contracts | 283 / 283 PASS |
| Production browser suites | 6 / 6 PASS: Astra V3 + campaign, Deep Descent, Core Pins/Nova Merge, legacy Challengers, Orbit Sprint/auth shell |
| Existing additional CI | All executed checks passed; existing opt-in `live` check was skipped, without production-account writes |
| Real paid provider canary | NOT RUN; owner approval required |

Initial complete commissioning head: `de1d8320020a09648f58c733b20e8bc63be37588`. [AI worker CI](https://github.com/andysong111/auto-lab/actions/runs/35676070212), [Factory/browser/regression CI](https://github.com/andysong111/auto-lab/actions/runs/35676070157), [current-head PR checks](https://github.com/andysong111/auto-lab/pull/41/checks). Final PR description records the final-head results after the additional pricing guard and documentation commit.

Permanent JSON/log snapshots are committed under [`evidence/ai-provider-worker/`](evidence/ai-provider-worker/), including 52 JSON files extracted from real isolated CI. [Full CI artifact including screenshots](https://github.com/andysong111/auto-lab/actions/runs/35676070212/artifacts/10673420186) expires 2026-10-06; the committed JSON/log evidence remains available.

Observed outcomes:

- Broken mock build → real freeze QA → actual Factory repair request → core/app-scoped AI mock repair → **RC_READY v2**, 2 generation calls, all 3 viewports PASS.
- Permanently broken mock → exactly 5 repairs / 6 generations → **REJECTED v6**.
- Obfuscated production POST → blocked and fatal **REJECTED**, 1 generation, no repair.
- Infinite loop → **timeout / REJECTED**; named containers and child processes removed.
- Probe → no secrets, no candidate/root writes, no raw outbound access, no socket, non-root execution.

[Feature PR Preview](https://vibe-arcade-git-feature-autonomous-ai-provider-worker-a2bsangsa.vercel.app) was provisioned by the existing Vercel integration. Its GitHub deployment status passed. Unauthenticated root GET returned 302; authenticated HTTP smoke is **not claimed** and no bypass secret was added. This is a preview of the worker-code PR, not a released AI game. No new game RC branch, live account/score or production deployment was created.

## Known limits and next supervising-team actions

1. Review PR #41 and its current-head CI. This task does not merge main or enable production shipping/intake. All handoff/evidence is readable from GitHub; no chat-copy transfer is needed.
2. If commissioning the actual model, approve **one generation call** and its cost ceiling first. Use [config.canary.example.json](worker/config.canary.example.json): one per-game/daily generation, $0.50 estimated ceiling, 5 minutes, one job, RC disabled. Add verified prices and an existing scoped key through the secret store. Leave production intake OFF. Enable only the isolated copied commissioning policy and run `run-once` on the unlisted fixture. If QA fails, the next provider call pauses on budget; do not raise limits without reviewing that result.
3. Record actual model/response ID, token usage, estimated cost, QA and original-game quality evidence. Mock success proves wiring and containment, not model compatibility, originality, fun or Astra/Descent-level design quality. No automatic production approval follows mechanical PASS.
4. Background storage (`store:true`) must fit the owner's account/data policy; no ZDR claim. Provider availability, model-specific support and actual billing remain unverified until the approved canary.
5. File state/ledger supports one host. Multi-host scaling requires transactional leases/shared budget accounting. Do not use multiple roots to bypass global limits. Maintain the reviewed isolation runtime and retain unresolved ledger records.

No SNS, ads, Winner/Loser, DB migration, authentication/country/ranking policy, production game rules or score validation changes were made. Source changes are confined to autonomy plus its new CI workflow; existing CommandAdapter remains fail-closed and unchanged.

## Rollback

Stop the worker, set its copied policy `intake_enabled:false` or `kill_switches.factory:true`, unset paid-call authorization and retain state/ledger for reconciliation. Close/revert PR #41 if code rollback is required. No production DB, game or secret changes need reversal. No force push, production merge or ship is part of rollback.
