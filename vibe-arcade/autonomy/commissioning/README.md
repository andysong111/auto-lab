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

## Current catalog cap

The snapshot records eight public or legacy-public games. The project rule is a maximum of ten meaningfully different public games before validation, so this milestone commissions only one additional candidate and leaves one slot unallocated.


## Learned quality loop

The first autonomous launch candidate, Prism Relay, correctly ended **REJECTED** after exhausting its five-repair lifetime budget. The Factory itself succeeded: it prevented a technically functional but under-polished game from shipping.

That rejection is now used as generation input, not as permission to reset the same job. New paid commissioning must include an implementation contract covering first-five-second objective clarity, visible goal progress, visible device-local best, multi-seed depth, mobile readability, result presentation and dynamic reduced-motion behavior. Generic QA now preserves entry/playing/midgame screenshots before release review.

A rejected candidate remains terminal. Start a new GAME ID for the next original candidate; never clone the rejected job merely to regain repair calls.
