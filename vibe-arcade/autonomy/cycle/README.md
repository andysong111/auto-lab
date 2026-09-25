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

## Autonomous intake v2

The default-branch `PlayJolt Autonomous Intake` workflow runs hourly and may create the next candidate without a chat message when the previous autonomous candidate is terminal.

Safety and pacing:
- one active autonomous candidate at a time;
- at most four newly generated candidates per UTC day;
- trusted deterministic family compiler only; provider output cannot modify controller/oracle code;
- current reviewed families: `binary-pylon` and `adjacent-order`;
- each generated candidate explicitly authorizes at most 6 provider calls and USD 2 estimated cost;
- Production, marketing and automatic merge remain disabled;
- terminal REJECTED candidate PRs are archived/closed automatically; RC_READY stays available for owner review while the experiment loop may continue.

The intake workflow creates a candidate branch and draft PR, then explicitly dispatches `PlayJolt Autonomous Candidate Cycle`. This avoids GitHub's normal suppression of workflows caused by pushes made with `GITHUB_TOKEN`.

Future expansion should add more reviewed mechanic families and real post-release KPI selection. Do not let a model generate trusted controller code or self-approve new oracle families.
