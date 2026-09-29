# PlayJolt supervisory control plane

This layer sits **above** the commissioned Phase 1 Factory. It does not replace the Factory state machine and does not enable production shipping.

## Purpose

- aggregate Factory job states into one operator snapshot;
- decide the next safe supervisory action without mutating a game;
- surface only genuine owner exceptions;
- keep kill switches and production policy in one reviewed file;
- define the Phase 2 KPI handoff without pretending small/missing data is a winner;
- generate a private/noindex weekly dashboard artifact.

The repository's base control policy remains conservative and Production shipping/marketing promotion stay hard held. Real Builder/Repair provider execution is now commissioned through bounded autonomous workflows, which construct isolated per-run control policy/state. The underlying Factory Production path remains separately disabled, so autonomous candidate execution cannot publish a game merely by changing a control-plane flag.

## Commands

From `vibe-arcade`:

```sh
node autonomy/control-plane/cli.cjs snapshot
node autonomy/control-plane/cli.cjs dashboard
node autonomy/control-plane/cli.cjs decision GAME-YYYYMMDD-NNN
```

The generated dashboard lives under `autonomy/artifacts/control-plane/`; that directory is operational evidence, not a public admin route.

## Owner alert rule

Normal QA failures, repairs, rejected games and insufficient metrics stay inside the machine. Owner action is reserved for the critical codes in `policy.json`, currently production side effects, verified-source tamper and path-isolation failures. Stalled Preview/Repair states are warnings for automation recovery, not automatic owner escalation.

## Phase 2 boundary

`metrics.cjs` only says whether data is ready for a later evaluator. It cannot label Winner/Loser. Current policy keeps Phase 2 disabled. When commissioned, the evaluator must use real observed denominators, age windows and error health; a pageview or one tagged request is never treated as a player.

## Current integration status and next boundaries

Completed:
1. real Builder/Repair provider with operation accounting and budget caps;
2. bounded autonomous intake/queue with adaptive daily throughput;
3. reviewed owner-gated Production release/rollback adapter separate from RC_READY.

Still intentionally pending:
1. first genuine eligible RC_READY exact-source Preview + release-packet proof;
2. owner-approved Production release/rollback exercise;
3. automated short-form/social/SEO distribution;
4. real game KPI aggregates and Phase 2 market evaluator;
5. distributed worker leasing only if/when multiple worker hosts are actually required.
