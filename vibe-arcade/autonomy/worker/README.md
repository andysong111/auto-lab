# AI provider worker operations

The worker connects the existing `Factory`, `AIBuilderAdapter` and `AIRepairAdapter`. It never implements a second game state machine or repair counter. Generated files are data until the existing browser QA runs inside a network-disabled Docker container. The checked-in Control Plane intake remains OFF, and production shipping remains disabled.

## Provider and configuration

`providers/openai.cjs` implements the official OpenAI Responses API with background responses, strict JSON file output and no tools. No SDK or model name is embedded in Factory. A different trusted provider implements `identity`, `assertAvailable()`, `generate({request,instructions,schema,max_output_tokens,max_response_bytes,response_id,onResponseId,signal})`, and optionally `cancel(id)`. `generate` returns `{output,usage}`; the manager validates it and attaches provider metadata. Call `onResponseId` as soon as the service accepts a request. Never execute a provider-suggested test or command.

Required operator environment, only after approval for paid calls:

- `OPENAI_API_KEY`: existing secret store injection, scoped project key with appropriate provider-side spend limits. ChatGPT subscription/access is not treated as free API entitlement.
- `FACTORY_OPENAI_MODEL`: an operator-selected Responses model supporting background mode and strict structured outputs.
- `FACTORY_ALLOW_PAID_CALLS=1`: explicit paid-call authorization. Default is disabled. Do not add this flag to normal CI.
- `FACTORY_QA_IMAGE=sha256:...`: immutable local ID of the reviewed QA image.

Optional RC-only secrets: existing `GITHUB_TOKEN`, and `VERCEL_AUTOMATION_BYPASS_SECRET` for protected Preview smoke. These stay in the trusted host; none is passed into the container, model prompt, ledger or artifacts. There is no Supabase credential requirement.

Copy `config.example.json` into a dedicated operational directory. `pricing:null` intentionally fails closed for real calls. After checking current official prices for the selected model, supply `pricing: {"input_per_million": <USD>, "output_per_million": <USD>, "as_of": "YYYY-MM-DD"}`. Rates must be positive and verified within 30 days. Use undiscounted input and maximum applicable output rates; there are no tools or separate billed media features. No price is inferred from a model name.

## Prepare a commissioning directory

Use one durable dedicated directory outside the repository and production app. Linux `flock` (util-linux) and Node 22+ are required on the trusted host. Kernel advisory locks serialize the worker and cost ledger, including competing crash-recovery attempts; there is no PID-file-only fallback for these global locks. Lock loss aborts work, and parent-process death closes the secret-free lock helper. The existing Factory job locks remain unchanged. File storage supports one host and one worker, not distributed leases. All workers using the same daily budget must share that directory. Do not reset the directory or ledger to evade limits.

From `vibe-arcade`, the following preparation does not call a model:

```sh
npm ci --prefix autonomy --ignore-scripts --no-audit --no-fund
docker build --iidfile /tmp/playjolt-qa-image -f autonomy/isolation/Dockerfile autonomy
export FACTORY_QA_IMAGE="$(cat /tmp/playjolt-qa-image)"
export FACTORY_WORKER_ROOT="/absolute/dedicated/commissioning-state"
mkdir -p "$FACTORY_WORKER_ROOT"
cp autonomy/worker/config.example.json "$FACTORY_WORKER_ROOT/worker-config.json"
cp autonomy/control-plane/policy.json "$FACTORY_WORKER_ROOT/control-policy.json"
node autonomy/cli.cjs create --root "$FACTORY_WORKER_ROOT" --spec autonomy/examples/dummy-spec.json
```

Only in the copied commissioning policy, set `intake_enabled:true` and `auto_rc_enabled:false`. Keep `auto_production_ship:false`, `kill_switches.production_shipping:true`, `kill_switches.marketing_promotion:true`. Do not edit the repository's policy. Configure verified prices and an explicitly authorized provider before execution. The fixture is unlisted and cannot create accounts/scores.

```sh
node autonomy/worker.cjs run-once --root "$FACTORY_WORKER_ROOT" --policy "$FACTORY_WORKER_ROOT/control-policy.json" --config "$FACTORY_WORKER_ROOT/worker-config.json"
node autonomy/worker.cjs loop --root "$FACTORY_WORKER_ROOT" --policy "$FACTORY_WORKER_ROOT/control-policy.json" --config "$FACTORY_WORKER_ROOT/worker-config.json"
node autonomy/control-plane/cli.cjs snapshot --root "$FACTORY_WORKER_ROOT" --policy "$FACTORY_WORKER_ROOT/control-policy.json"
```

`node autonomy/worker.cjs run-once` without configuration reports `PAUSED_INTAKE`, with zero provider calls. The worker acquires an existing job created through the existing intake/CLI; it does not invent or mass-produce new jobs. The immutable spec must contain meaningful GameKit input observation paths and terminal timing. Creating jobs remains subject to the existing supervisory intake policy; the worker does not call `create` itself.

`run-once` locks the worker, chooses the oldest resumable job, preflights provider/isolation, and calls `Factory.run()`. AI build/repair results populate only that candidate workspace. Defaults stop at RC_READY. Opting into `release_candidates:true` also requires the live Control Plane RC switch; then the unchanged GitHub/Vercel adapter performs branch/PR/checks/Preview/HTTP smoke. It cannot merge or ship. Missing GitHub access pauses at the existing RC checkpoint.

`loop` polls at 2 seconds, doubles backoff up to 30 seconds, ends after 20 polls or one completed job, and stops immediately on intake/kill/budget holds. SIGINT/SIGTERM abort in-flight provider/QA, release locks and persist status. After an abrupt crash, a brief `PAUSED_CONCURRENCY` can occur while the prior lock helper exits; bounded polling resumes after release. The live policy is re-read before every Factory step/provider call and monitored every 250 ms during work. There is no overlapping build. Routine pauses are machine-readable JSON results; configuration parse errors exit 1. Supervisors should inspect `status`, not assume exit 0 means an RC passed.

## Budgets, idempotency and recovery

Default ceilings: 6 generations per game (build + at most 5 repairs), 240,000 input tokens, 96,000 output tokens, $0.50 estimated cost, 15 minutes elapsed wall time including downtime. Global daily ceilings: 6 generation calls and $0.50 estimated cost, one concurrent build. Per request: 60,000 input bound, 16,000 maximum output tokens, 120 seconds, 512 KiB response, 64 KiB/file, 24 files. Hard configuration maxima also apply; see `providers/config.cjs`.

Costs are **estimated**, not billing assertions. Before sending a generation POST, the manager durably reserves a conservative UTF-8-byte input token bound plus framing margin and the full output cap at configured prices. Returned usage can release unused estimates; missing/uncertain usage retains the full reservation. Reported usage above reservation causes `PAUSED_BUDGET`. Daily accounting is UTC by original submission date, including reservations for unresolved requests; midnight-spanning actual billing can differ. Poll/retrieve/cancel requests do not create new generations and have their own time bounds. Provider-side billing limits remain necessary for an absolute currency guarantee.

`autonomy/.provider/ledger.json` contains immutable request hashes, reservations, response IDs and cached validated output. It contains candidate source, not API keys; it is ignored by Git and bounded to 16 MiB. Back it up with the state directory. Reconciliation/archival requires a trusted operator; never delete unresolved records. `X-Client-Request-Id` is a tracing value, **not** a documented OpenAI billing idempotency guarantee.

- COMPLETE: return the saved output without another provider call.
- Known response ID: retrieve the background response and resume the same Factory operation/repair attempt.
- Submission may have reached provider, but ID was not saved: `provider_submission_uncertain`; never POST again automatically. Owner reconciles provider logs using `operation_id` before any separately authorized replacement job. This includes timeouts before an ID is received.
- Model refusal/incomplete/malformed output: existing bounded game repair policy handles the failure. Network/auth/rate-limit/isolation errors pause the worker and preserve the Factory checkpoint.
- Source/path/production-write violations retain existing fatal policy and are not sent through repeated AI repair.

Worker holds (`PAUSED_BUDGET`, `PAUSED_PROVIDER`, etc.) are a supervisory overlay in `artifacts/worker/`, not new Factory states. Control Plane snapshots/dashboard show them. Only existing configured critical exception codes set `owner_action`; routine budget/provider pauses do not send notifications.

## Isolation boundary

Run this worker on a dedicated Linux worker with Docker. The image is built from the official Playwright runtime and reviewed Factory QA only; the Docker build context excludes candidates, operational data and secrets. Runtime accepts only an existing immutable `sha256:` image ID, never pulls a tag, and fails closed if Docker or the image is unavailable. The base tag is recorded in the Dockerfile; record the resulting ID and update/rebuild the reviewed runtime for security patches.

The candidate is staged as a read-only data copy. Docker has `--network none`, read-only root, all capabilities dropped, no-new-privileges, a non-root UID, no Docker socket, no host home/repository/env mounts, 1 CPU, 1 GiB memory with no extra swap, 128 PIDs, bounded file descriptors and 192 MiB temporary storage. Only QA artifact output and ephemeral browser storage are writable. The existing Playwright network guard adds side-effect evidence inside that boundary. The trusted provider host can reach only the fixed official API through this adapter; generated code cannot invoke its fetch function.

The inner QA PID has a wall deadline; normal timeout/SIGTERM explicitly removes the container and process group. A hard host-worker crash leaves at most the container's internal QA deadline; named `playjolt-qa-*` containers can be inspected/removed by the worker operator. Browser/OS/container vulnerabilities remain a residual risk: this is containment on a dedicated host, not proof against kernel exploits. Docker socket access is restricted to the trusted worker process. Never run AI candidate output through the old host `cli.cjs run --workspace` path; use this worker's Docker QA injection.

## Tests and evidence

```sh
npm test --prefix autonomy
npm run test:worker --prefix autonomy
FACTORY_EVIDENCE_DIR=/tmp/ai-worker-evidence npm run test:worker:isolated --prefix autonomy
npm run test:regression --prefix autonomy
```

The isolated suite has no skip/fallback when Docker is missing. It uses a mock provider, real candidate files and real Chromium across all existing viewports. It proves frozen build → targeted repair → PASS, six generations/five failed repairs → REJECTED, fatal attempted production writes, container secret/filesystem/network boundaries, and runaway deadline cleanup. The normal contract suite tests malformed/path escape output, budget/timeouts, live kill/intake gating, actual worker process crash recovery and Responses request shape using mocked HTTP only. Suggested model tests are recorded as unexecuted; they never substitute for browser QA.

CI: `.github/workflows/playjolt-ai-worker-ci.yml`; artifacts: `ai-worker-isolation-evidence` (14 days). Existing Factory and production regression workflows remain in place. See `../HANDOFF_WORK_AI_PROVIDER_WORKER.md` for actual results and activation actions.

Official references: [Responses background mode](https://developers.openai.com/api/docs/guides/background), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [request tracing](https://developers.openai.com/api/reference/overview), [current pricing](https://developers.openai.com/api/docs/pricing), [Playwright Docker](https://playwright.dev/docs/docker), [Docker runtime constraints](https://docs.docker.com/engine/containers/run/).
