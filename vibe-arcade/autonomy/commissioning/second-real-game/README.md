# Second real candidate: Cloud Cargo

Scope: exactly `GAME-20260922-121`, from main `b4db1b3f9858eaa7f62403ab16da8085e97267a9`. Prism Relay stays terminal REJECTED; no reused ID, source or budget.

`ideas.json` records three distinct ideas and selection. `proposal.json` passes the current Spec Gate and carries the full immutable product implementation contract. The explicit user ceiling is USD3; this run keeps the stricter existing commissioning USD2 limit, six lifetime calls (one build/five repairs), one worker, 60 minutes. Rates are conservative USD4 input/USD18 output per million; official standard short-context Terra USD2/USD12 was verified 2026-09-22 at https://developers.openai.com/api/docs/pricing. Costs are estimated, billed values unknown.

Before the sole paid trigger, run:

```sh
node autonomy/commissioning/cli.cjs check-spec autonomy/commissioning/second-real-game/proposal.json
npm test --prefix autonomy
npm run test:worker --prefix autonomy
```

The one-shot branch-specific workflow only triggers when `run-request.json` changes. It rejects any previous runner submission, preflights Spec Gate, copies a commissioning-only intake policy into a dedicated directory, builds a pinned Docker image and calls the existing AutonomousWorker. The existing AIBuilderAdapter / AIRepairAdapter / ProviderManager / Factory own generated files, operation IDs, journal, states and repair counters. `run.cjs` only composes original mechanical Docker QA with an additional Docker product test. Original hard gates and 150-second common deadline stay unchanged; separate product QA has a 300-second cap. No unsafe host fallback.

The API secret is only injected into the provider step. Candidate containers are read-only, non-root, network none, 1CPU/1GiB/128PIDs; no production secrets, Supabase, host repository or home mounts. No RC action occurs before direct public-quality evidence review. Production remains unauthorized.

New trusted QA checks normal-input solutions over six seeds, meaningful mass/energy constraint differences, mobile canvas text collisions, visible goal/best, separate complete/failure outcomes, initial and dynamic reduced-motion, capture no writes and ordinary GameKit local best persistence. No candidate solve function or state injection is used. Generic entry/playing/midgame screenshots were being lost at Docker export; the artifact filter now preserves bounded phase PNGs/video too. No candidate source has been hand-authored by Work.

Do not rerun the paid workflow from empty state. Recover the full artifact including `autonomy/.provider/ledger.json`, original spec and all source/QA/history. Reuse existing operation IDs; uncertain submission must be reconciled rather than POSTed again. An exhausted/rejected candidate is terminal. Keep the default repository intake OFF. The run request is a commissioning instruction, not recurring scheduling or production authorization.

Final state, costs, source provenance, CI and review evidence will be recorded in `../../HANDOFF_WORK_SECOND_REAL_GAME.md` and permanent `../../evidence/second-real-game/`.
