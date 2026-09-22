# Prism Relay bounded follow-up

Same GAME-20260922-110, v4, original spec and source provenance. This follow-up is explicitly owner-authorized and may spend only the remaining lifetime repairs 4 and 5. No new game, manual game edit, production action or budget reset.

The trusted `run.cjs` wrapper reuses `AutonomousWorker`, `AIRepairAdapter`, `Factory` and `DockerQA`. It invalidates the old QA cache by archiving it and uses the existing READY_TO_SHIP → QA_RUNNING transition. Original common browser tests run unchanged. A second network-disabled Docker run applies the owner polish contract. Its failures enter the existing QA/Repair loop, with the complete bounded polish contract supplied as QA evidence to the existing prompt compiler.

Independent QA enumerates every possible four-column route (including visible mandatory gates), computes true shortest clockwise rotation cost and solves boards using normal keyboard/CDP touch events. It does not import/execute candidate code on the host or inject canonical state. Tested seeds: 1, 7, 23, 89, 2026, 4294967295; a seventh seed 314159 tests ordinary device-local practice persistence. First three stages must require at least 2/4/6 rotations respectively. This concrete commissioning threshold is not a fun score or human-performance claim.

Goal/best/progress/result DOM, actual WebAudio starts/voice cleanup, sound toggle, reduced-motion presentation, capture side effects, input reachability and screenshots/video supplement the unchanged baseline gates. The extra 300-second Docker process has the same CPU/memory/network/mount restrictions; the original QA's 150-second hard deadline is unchanged. Local best writes are permitted only in a separate disposable non-capture context, only to GameKit's exact versioned local key. Capture contexts must make zero writes.

## Cost and time

Original lifetime ledger: 4 completed operations / USD 0.58391601 estimated. Retain all original responses, usage and operation IDs. Lifetime max is 6 provider calls, 5 repairs, USD 2 estimated and 1 concurrent worker. Rates remain conservative USD 4 input / USD 18 output per million, verified against [official pricing](https://developers.openai.com/api/docs/pricing) on 2026-09-22. These exceed standard short-context 2/12 rates; billed cost is unavailable. No cache discount is assumed.

The first commissioning's 60-minute wall clock expired before this newly requested follow-up. `providers/continuation.cjs` records ONE explicit 45-minute authorization window only for a reconciled READY candidate and its remaining operation IDs. It preserves original start, operation hashes and all lifetime accounting. Retry cannot extend the window. Uncertain responses, exhausted repair budgets or modified prior operation evidence fail closed. The normal worker never creates continuation authorizations automatically.

## Execution and recovery

The one-shot GitHub workflow restores the previous exact Actions state/ledger, verifies provenance, runs tests before secret exposure, builds/pins the reviewed Docker image and invokes:

```sh
FACTORY_WORKER_ROOT=/dedicated/prism-state \
FACTORY_QA_IMAGE=sha256:... FACTORY_OPENAI_MODEL=gpt-5.6-terra \
FACTORY_ALLOW_PAID_CALLS=1 \
node autonomy/commissioning/prism-polish/run.cjs
```

The existing secret store injects OPENAI_API_KEY into the trusted provider step only. Never pass secrets to Docker or prompts. The workflow rejects reruns and duplicate submissions. Do not launch again from the original artifact after a provider call: restore the latest full ledger, including hidden provider state; reconcile response IDs first. Any infrastructure-only verification must run without a model key or paid-call flag.

This is a dependent infrastructure/evidence PR on the first commissioning branch (PR #44). Candidate source remains on `factory/GAME-20260922-110` / Draft PR #45 and is updated only after all gates pass. No main merge or production publication.
