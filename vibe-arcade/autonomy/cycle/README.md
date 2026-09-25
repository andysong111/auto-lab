# PlayJolt Autonomous Candidate Cycle v1

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

## Remaining v2 work

v1 removes the stage-to-stage chat dependency. Generating the *next new mechanic/spec itself* still requires a reviewed intake source. v2 will add a trusted bounded candidate generator/queue so terminal RC/REJECT can feed the next candidate without chat.


## Queue supervisor retry safety

The queue supervisor is idempotent by candidate branch SHA. Before dispatching a queued candidate, it resolves the branch's current commit and checks prior `PlayJolt Autonomous Candidate Cycle` runs for that exact SHA.

- an unchanged candidate SHA that already ran is never dispatched again automatically;
- a reviewed code change produces a new SHA and can be dispatched on a later supervisor pass;
- the daily candidate cap still applies;
- Production remains off.

This prevents a preflight/build failure from silently consuming another daily slot with identical source.
