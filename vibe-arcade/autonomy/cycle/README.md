# PlayJolt Autonomous Candidate Cycle

This workflow removes the chat/operator handoff between a reviewed candidate's zero-paid preflight and its bounded commissioning run.

## Trigger

A branch matching `commissioning/**` can opt in by committing exactly one request at:

`vibe-arcade/autonomy/commissioning/<slot>/preflight-request.json`

The request must explicitly contain:

- `auto_commission: true`
- `authorized_provider_calls` between 1 and 6
- `estimated_usd_ceiling` greater than 0 and no more than USD 2
- `production_authorized: false`

The same directory must contain a trusted checked-in `commission.cjs`.

## Flow

The single GitHub Actions run performs:

`resolve request -> zero-paid prepare -> reviewed contract verification -> trusted Docker image -> AI build -> Technical/Product/Commercial QA -> bounded repairs -> terminal checkpoint`

There is no separate chat message or manual run-request commit between preflight PASS and commissioning.

## Safety boundary

- candidate code is still generated as data and executed only inside the existing network-disabled Docker QA boundary;
- the workflow cannot authorize more than 6 provider calls or USD 2 estimated cost;
- Production remains hard OFF;
- a request without explicit auto commissioning authorization fails before provider execution;
- the trusted candidate script remains responsible for its own stricter per-game budgets and reviewed oracle/contracts;
- terminal RC/REJECT does not automatically publish or merge anything.

## Current autonomous continuation

The original v1 handoff gap is closed.

The live system now includes:
- Candidate Queue Supervisor;
- Trusted Intake Generator;
- terminal candidate -> Supervisor direct handoff;
- eligible terminal RC -> RC Preview direct handoff using the immutable source run ID;
- duplicate-run protection;
- best-effort draft PR creation;
- adaptive 1 -> 3 -> 6 candidate/day ramp;
- serial execution;
- Learning Foundry selection of the next reviewed mechanic family when the static queue is exhausted;
- an exact one-in-two market-benchmark lane that transfers abstract principles from a fresh Google Play snapshot without copying protected expression;
- terminal outcome learning that retires a family after three rejections with no RC_READY result.

A normal terminal REJECTED candidate should not require a ChatGPT or Codex wake-up. The Supervisor continues according to quota/safety policy.

GitHub scheduled events can be delayed or skipped. The Supervisor therefore uses two staggered schedule signals per hour. This changes only wake-up redundancy: the concurrency group, active-cycle check, candidate-SHA duplicate protection and adaptive UTC daily cap still make repeated signals harmless and preserve serial execution.

The RC continuation also uses an explicit `workflow_dispatch` from the terminal cycle. Do not replace it with an implicit `workflow_run` trigger without a live proof: the GITHUB_TOKEN-dispatched chain completed candidates without emitting those downstream runs.

The first 18 generated candidates used the trusted permutation template. That family remains historical evidence but is retired: it exhausted repeated repair budgets without producing RC_READY. New Foundry candidates use reviewed family-specific finite-state Oracles and still pass the same Technical, Product and Commercial checks.

Foundry selection happens before any paid provider call. Used designs, stale market evidence, unreviewed runners and retired families fail closed to `IDLE`. See `../foundry/README.md`.

The next major engineering boundary is not another intake v2. It is the Phase 5/6 transition: prove a real RC_READY through exact-source Preview/release packet, then proceed to owner-gated Production proof and automated distribution.


## Queue supervisor retry safety

The queue supervisor is idempotent by candidate branch SHA. Before dispatching a queued candidate, it resolves the branch's current commit and checks prior `PlayJolt Autonomous Candidate Cycle` runs for that exact SHA.

- an unchanged candidate SHA that already ran is never dispatched again automatically;
- a reviewed code change produces a new SHA and can be dispatched on a later supervisor pass;
- the daily candidate cap still applies;
- Production remains off.

This prevents a preflight/build failure from silently consuming another daily slot with identical source.


## Adaptive throughput ramp

The factory starts conservatively and increases experiment throughput only after end-to-end autonomous proof:

- 0 successful fully autonomous generated candidates: max 1 candidate / UTC day;
- after 1 successful `commissioning/auto-*` workflow-dispatch completion: max 3 / UTC day;
- after 3 successful fully autonomous completions: max 6 / UTC day.

"Successful" here means the autonomous workflow reached a clean terminal checkpoint; the game itself may validly end RC_READY or REJECTED. Candidates remain serial: one active autonomous cycle at a time. Provider calls stay capped at 6 per candidate, estimated provider cost stays capped at USD 2 per candidate, and Production remains off.
