# AGENTS.md — PlayJolt / auto-lab operating instructions

This repository is the durable source of truth for the PlayJolt Autonomous Publishing OS. Older files may still use the name **LoopJolt**; do not rename code just for terminology. Treat PlayJolt as the current project/program name.

## Read first

Before substantial work, read:

1. `vibe-arcade/PLAYJOLT_PROJECT_CONTEXT.md`
2. `vibe-arcade/MASTER_PLAN.md`
3. `vibe-arcade/GOALS.md`
4. `vibe-arcade/autonomy/commissioning/README.md`
5. `vibe-arcade/autonomy/cycle/README.md`

Then fetch/pull the latest `main` and inspect current GitHub Actions. Runtime code + latest Actions are authoritative for what is actually deployed/running; the project-context file is authoritative for owner intent, roadmap, historical decisions, and non-code constraints.

## Owner intent

The target is a low-labor 24/7 game experimentation and publishing OS:

`IDEA -> BUILD -> Technical QA -> Product QA -> Commercial QA -> bounded REPAIR -> RC/REJECT -> Preview/Release -> MEASURE -> PROMOTE -> LEARN`

The owner should normally only review results weekly and make exceptional approvals or strategic decisions.

## Current engineering phase

Engineering Phase 4 (autonomous multi-candidate factory) is complete.

Engineering Phase 5 (owner-gated RC Preview / release / rollback) is implemented in main. The remaining Phase 5 proof is an actual eligible `RC_READY` candidate completing exact-source Preview + release-packet verification and then, only with explicit owner approval, a controlled Production release / rollback exercise.

The candidate supply is now a Learning Foundry rather than one repeated permutation template. Odd candidate sequences use an original exploration lane and even sequences use a reviewed Google Play market-benchmark lane. Benchmarking may transfer abstract product principles only; copying names, branding, art, audio, layouts, assets, code or a distinctive ruleset is forbidden. Terminal outcomes feed family-level learning, and a family with three rejections and no RC_READY is retired before another paid build.

Do not lower quality gates merely to manufacture an `RC_READY` candidate.

## Non-negotiable safety rules

- Production auto-publish is forbidden. `AUTO_PRODUCTION_SHIP=false` remains the default boundary.
- Never revive a terminal `REJECTED` game.
- Never reset a repair budget.
- Never clone the same failed game under a new GAME ID to regain budget.
- Candidate provider limit: max 6 provider calls unless an explicit newer owner decision changes it.
- Candidate estimated provider-cost ceiling: USD 2 unless an explicit newer owner decision changes it.
- Candidate execution remains serial unless a reviewed change explicitly proves safe concurrency.
- Generated candidate code must stay inside the existing isolated QA/runtime boundaries.
- Do not weaken Technical, Product, Commercial, Quality, reduced-motion, mobile-readability, score-integrity, or exact-source checks to increase pass rate.
- Draft PR creation is best effort and must never be a hard dependency for the autonomous factory.
- Repository-wide irreversible/destructive changes, new paid subscriptions, auth/security changes, public Production publication, destructive DB migrations, legal/tax decisions, or spending above the existing authorization boundary require owner involvement.

## Autonomous work style

For safe, reversible repo work:

- inspect first;
- implement;
- run relevant tests/CI;
- fix regressions;
- merge CI-passing changes when the task is clearly within the agreed roadmap;
- continue to the next logical step without stopping merely to report status.

Only stop for a genuine owner decision, missing credentials/authorization, a new paid commitment, or a safety boundary.

When architecture, roadmap, safety policy, throughput policy, or owner-intervention rules materially change, update `PLAYJOLT_PROJECT_CONTEXT.md` in the same PR so future Codex sessions do not depend on chat history.

## Quality philosophy

The system exists to run cheap real experiments, not to self-congratulate.

AI self-review alone is never enough. Prefer:
- deterministic contracts;
- browser QA;
- multi-seed evidence;
- mobile evidence;
- visual/commercial evidence;
- exact-source Preview;
- real player data.

A valid REJECTED candidate is a successful Factory outcome when the system correctly prevents a weak game from shipping.

## Throughput

The autonomous factory uses an adaptive daily ramp:

- 0 proven fully autonomous generated completions -> max 1 candidate / UTC day
- after 1 proven completion -> max 3 / UTC day
- after 3 proven completions -> max 6 / UTC day

Execution stays serial. The purpose of the ramp is to increase experiment velocity only after end-to-end autonomy is proven.

Owner taste-calibration override (2026-10-05):

- candidate sequence 38 and later stays at zero-paid `IDLE` until the owner plays all three private taste-calibration prototypes and selects one protected interaction baseline;
- after that selection, the effective cap is temporarily **1 candidate / UTC day**, even if the older adaptive ramp would allow more;
- two consecutive measured quality regressions pause further paid candidates for owner review;
- this override does not authorize Production or weaken any QA gate.

## Source-of-truth precedence

When sources disagree:

1. current `main` code + latest GitHub Actions state
2. this `AGENTS.md` for execution rules
3. `PLAYJOLT_PROJECT_CONTEXT.md` for roadmap/owner intent/history
4. specialized autonomy docs
5. older planning docs and historical handoffs

Do not infer a production approval from an old chat, old PR, or `RC_READY` state. Production approval must be explicit and current.
