# AI Provider / Autonomous Worker handoff

Local implementation commit: `4467bb2c25f26a99d2121d31d0a9c474395216f3`; subsequent local commit records final lock hardening/evidence. Both are on the branch below.

Implementation branch: `feature/autonomous-ai-provider-worker`, based on main `d0763f7c47a0f801cc82e49b1fd1d7a42c780e9e` (Factory #38 and supervisory #40 integrated).

Status: **REMOTE_COMMISSIONING_IN_PROGRESS.** GitHub account and main access recovered on 2026-09-22. Local implementation and regressions are preserved; branch/PR publication and actual isolated Docker CI are now being commissioned. Real paid provider calls remain disabled.

## Architecture and files

- Existing Factory is reused: `orchestrator/engine.cjs` adds a before-step policy hook, operational pause propagation and provider metadata only. State graph, quality policy, five-repair budget, QA checks and RC adapter are preserved.
- `adapters/ai.cjs`: `AIBuilderAdapter` / `AIRepairAdapter` implement the existing interfaces.
- `providers/{prompts,output,manager,openai,config,errors}.cjs`: immutable implementation contract, actual repair request/QA compiler, validated file schema, durable operation/cost ledger, official OpenAI Responses adapter, limits and typed holds.
- `worker.cjs`, `worker/{runtime,status,lock}.cjs`: Control Plane-gated single-host job acquisition, bounded loop/backoff, shutdown/crash recovery, worker state overlay.
- `isolation/`: trusted Playwright Docker image and read-only/network-none/resource-limited execution adapter. No generated code is executed on the host.
- `worker/tests/`: provider/worker contracts and real isolated browser integration; `.github/workflows/playjolt-ai-worker-ci.yml` adds CI with read-only repository permissions and no provider credentials.
- Control Plane snapshot/dashboard displays worker pause/status; production policy stays OFF. Its CLI now correctly reads options immediately following `snapshot`/`dashboard`.

## Provider, secrets and cost

OpenAI Responses API is implemented via built-in `fetch`, with configurable model, strict JSON files, background response IDs, durable reservations before POST, GET recovery and no SDK retries/tools. `X-Client-Request-Id` is for tracing only. Unknown submission status never causes an automatic second generation.

Required when explicitly authorized later: existing `OPENAI_API_KEY`, selected `FACTORY_OPENAI_MODEL`, `FACTORY_ALLOW_PAID_CALLS=1`, freshly verified configured USD token rates and immutable `FACTORY_QA_IMAGE`. Optional RC secrets remain existing GitHub/Preview tokens. No production secret was created or modified.

No real-provider canary has been performed. No OpenAI API calls or API charges were initiated by this work. There is no API key/free API entitlement available in this Work environment. Existing CI/hosting usage is governed by the owner's existing plans; it is not claimed to be free.

Default per-game limits: 6 generation calls / 240k input / 96k output / **$0.50 estimated** / 15 elapsed minutes. Default global UTC-day limits: 6 generations / **$0.50 estimated** / one concurrent build. Every request reserves conservative input plus max output before submission; known usage refines the estimate. Unknown usage keeps the full reservation. Billing is not queried or asserted. See `worker/README.md` for accounting and recovery details.

## Isolation and commands

Linux Docker and host `flock` are required; worker/ledger use kernel advisory locks with automatic crash release and abort on lock loss; runtime requires a pinned local image ID, network none, no secrets, no production mounts, read-only candidate/root, non-root user, dropped capabilities, 1 CPU, 1 GiB, 128 PIDs and deadlines. A missing isolation runtime pauses before a provider call; no bwrap/host fallback is added. Existing CommandAdapter remains unchanged.

Default safe command: `node autonomy/worker.cjs run-once` → `PAUSED_INTAKE`. Operational commands and complete preparation steps are in [worker/README.md](worker/README.md). Use a dedicated directory outside the checkout with a copied commissioning-only policy, the existing `cli.cjs create`, then worker `run-once`/`loop`. The default never enables production intake. RC is additionally opt-in and reuses existing branch/PR/Preview/smoke logic.

## Validation

Actual local results, 2026-09-22 UTC:

| Check | Result |
| --- | --- |
| Existing Factory / Control Plane | 26 / 26 PASS |
| New provider / worker contracts | 49 / 49 PASS; mock HTTP only |
| Existing Factory real Chromium | 9 / 9 PASS; trusted existing fixtures |
| Existing production canonical contracts | 283 / 283 PASS |
| Production browser suites | 6 / 6 PASS: Astra V3 + campaign, Deep Descent, Core Pins/Nova Merge, legacy Challengers, Orbit Sprint/auth shell |
| New AI-worker Docker integration | BLOCKED locally: all 5 cases fail closed at isolation preflight; no AI output executes on host |
| GitHub PR / CI | Publication and CI commissioning in progress; exact results to follow |
| Real provider canary | NOT RUN; 0 paid API calls |

Machine-readable status and logs are under [`evidence/ai-provider-worker/`](evidence/ai-provider-worker/). Existing real-browser fixture repair/rejection passed; this does **not** substitute for the pending new AI-adapter + Docker end-to-end suite. Production network writes are blocked and existing account/ranking responses are mocked locally by the existing regression harness. Generated build outputs are excluded from the feature commit.

PR and CI links will be recorded after creation and validation. No paid canary or new RC game is included in commissioning. `.github/workflows/playjolt-ai-worker-ci.yml` performs the new container integration using mock model responses.

## Known limits and next supervising-team actions

- Production shipping is unsupported/disabled; no intake enable, new production game, DB change, auth/ranking/country/marketing change was performed.
- FileStore/ledger is single-host. Multiple hosts require transactional leases/shared budget accounting before any scaling. Do not create multiple roots to bypass a budget.
- Model design quality and compatibility are not established by mock tests. Mechanical PASS is an RC, not proof of originality/fun or production approval.
- Response background storage is explicit (`store:true`); owner must ensure it fits the account's data policy. No ZDR claim.
- Container isolation requires a maintained dedicated Linux host and reviewed runtime images. It does not claim protection against host-kernel vulnerabilities.
- Ambiguous submissions require provider-log reconciliation; this is intentionally not automated by a second POST. The state/ledger must be retained across worker restarts.
- GitHub transport is restored. Before approval require `AI provider worker contracts`, `AI worker isolated browser` and all existing Factory/production checks green. The new Docker suite must actually execute successfully; do not skip it or switch it to host execution. Save the resulting CI run/artifact URLs here. No new service, payment or production secret is needed for this step.
- A real paid canary remains owner-gated. After isolated CI passes and the PR is reviewed/merged, supply an existing scoped API key through the secret store, choose a supported model, verify rates, and explicitly approve one bounded fixture run. Keep production intake OFF. Set commissioning policy only in the dedicated state directory. Do not give the candidate any secrets. Record the actual response/usage/estimated cost and quality results before considering further intake.

## Rollback

Stop the worker, set its copied policy `intake_enabled:false` or `kill_switches.factory:true`, unset paid-call authorization, and retain state/ledger for reconciliation. Revert this feature PR if code rollback is needed. No DB migration, production game or credential change needs rollback. Never delete unresolved cost records as a retry mechanism.
