# First real game commissioning

This directory is the safety layer between the proven Factory and **real PlayJolt launch candidates**.

## What it does

- snapshots the eight current public/legacy-public mechanic families;
- rejects exact reuse of those mechanic families before a paid build;
- enforces a 15–60 second commissioning lifecycle and small control surface;
- limits this milestone to one new candidate;
- requires browser QA, quality PASS, exact-source Preview and rollback metadata;
- never authorizes production by itself.

The Factory remains authoritative for build/repair/QA state. This layer does not create a second state machine.

## Commands

```sh
cd vibe-arcade
node autonomy/commissioning/cli.cjs check-spec autonomy/commissioning/examples/real-game-spec.template.json
node autonomy/commissioning/cli.cjs release-packet /path/to/manifest.json --out /tmp/release-review.json
```

A real Work/worker commissioning should first write a concrete proposal, run `check-spec`, then create the Factory job from the emitted `factory_spec`. Paid model calls should not start when the spec gate fails.

## Release boundary

The first real game may progress through AI build, up to five repairs, browser QA, quality gate, candidate branch, Draft PR and Vercel Preview. Production catalog/home/sitemap/ranking/marketing changes remain outside this commissioning. Even a clean `READY_TO_SHIP` packet sets `production.authorized=false` until a separate reviewed production-release adapter consumes an explicit owner decision.

Rollback metadata is mandatory before that later adapter exists.

## Phase 5 release pipeline

`PlayJolt RC Preview and Release Packet` consumes the immutable artifact from a successful generated-candidate cycle. The terminal cycle directly dispatches it with its own run ID when the state is `RC_READY` or `READY_TO_SHIP`; this explicit handoff is used because implicit `workflow_run` chaining did not fire for the token-dispatched autonomous chain. The Preview workflow validates that source run and its `commissioning/auto-*` branch, resumes without model calls or repair-budget changes, creates the isolated `factory/GAME-*` branch, explicitly dispatches Factory CI, waits for a non-production Vercel Preview, performs byte-identity smoke checks, and emits a SHA-256-addressed release packet. Draft PR creation remains best effort because repository Actions may not have PR creation permission.

`PlayJolt Owner Production Release` has no automatic trigger. A release or rollback requires all of the following: a repository-owner dispatch, the successful Preview workflow run ID, the exact packet SHA-256, the exact action confirmation phrase, the `playjolt-production` environment, an unchanged RC branch, a single-parent RC commit, and a diff confined to the candidate's immutable runtime directory. Release is fast-forward-only from the packet's recorded base commit. Rollback creates a normal revert commit and never resets or rewrites history.

Production remains unavailable to the autonomous Factory. `AUTO_PRODUCTION_SHIP=false`, the packet records `production.authorized=false`, and only the separate owner workflow can cross the final boundary.

## Current catalog cap

The snapshot records eight public or legacy-public games. The project rule is a maximum of ten meaningfully different public games before validation, so this milestone commissions only one additional candidate and leaves one slot unallocated.


## Learned quality loop

The first autonomous launch candidate, Prism Relay, correctly ended **REJECTED** after exhausting its five-repair lifetime budget. The Factory itself succeeded: it prevented a technically functional but under-polished game from shipping.

That rejection is now used as generation input, not as permission to reset the same job. New paid commissioning must include an implementation contract covering first-five-second objective clarity, visible goal progress, visible device-local best, multi-seed depth, mobile readability, result presentation and dynamic reduced-motion behavior. Generic QA now preserves entry/playing/midgame screenshots before release review.

A rejected candidate remains terminal. Start a new GAME ID for the next original candidate; never clone the rejected job merely to regain repair calls.

## Rejected-family memory

Prism Relay (`GAME-20260922-110`, `spatial-optical-routing`) exhausted 5/5 repairs and remains terminal REJECTED. The next real candidate must use a different mechanic family; this is enforced before any paid provider call. A new title or GAME ID is not enough to bypass the rejected-family rule.


## Third-candidate lessons

Ribbon Shift (`GAME-20260922-131`) remains terminal **REJECTED** at repair 5/5. A zero-model-call audit later showed that its final reduced-motion failure was partly a browser-event settlement race, but that does not resurrect the job: the same source still had genuine product issues (no whole-strip transition, reversible move-score farming, artificial post-success wait, and mobile result/replay below the initial viewport).

The mechanic family `toroidal-strip-permutation` is **not** globally blocked because the commissioning did not prove the entire family unsuitable. However, future idea selection must not recreate Ribbon Shift's same 3×3 row/column-cycle design under a new ID merely to regain budget.

General rules carried forward:
- native media preference changes get a short bounded wall-clock settlement window before failure;
- score must not increase from reversible actions that make no objective progress unless that behavior is explicitly justified;
- successful objectives end promptly; target session length comes from meaningful play, not dead time after success;
- meaningful state changes need visible action feedback, with reduced-motion-safe alternatives;
- the primary replay action belongs in the initial mobile result viewport;
- browser boot timeouts should include any visible GameKit error text in repair feedback.
