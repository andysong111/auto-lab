# PlayJolt supervisory control plane

This layer sits **above** the commissioned Phase 1 Factory. It does not replace the Factory state machine and does not enable production shipping.

## Purpose

- aggregate Factory job states into one operator snapshot;
- decide the next safe supervisory action without mutating a game;
- surface only genuine owner exceptions;
- keep kill switches and production policy in one reviewed file;
- define the Phase 2 KPI handoff without pretending small/missing data is a winner;
- generate a private/noindex weekly dashboard artifact.

Current safety posture is intentional: `intake_enabled=false` until a real Builder/Repair provider is commissioned, and production shipping/marketing promotion are hard held. The underlying Phase 1 `productionShip()` path is separately disabled, so changing this policy alone cannot publish a game.

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

## Next integration

1. commission a real Builder/Repair provider with operation-ID idempotency and budget caps;
2. enable intake with a small active/daily cap;
3. add a private distributed store/worker lease before running on multiple hosts;
4. implement a reviewed production-release adapter separately from READY_TO_SHIP;
5. connect real game KPI aggregates in Phase 2.
