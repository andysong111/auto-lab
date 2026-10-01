# PlayJolt Learning Foundry

The Foundry changes the candidate supply, not the QA bar. It selects a reviewed mechanic family and an unused design before any paid provider call.

## Candidate cadence

- odd sequence numbers use the `original` exploration lane;
- even sequence numbers use the `market-benchmark` lane;
- market evidence must come from a fresh reviewed Google Play catalog snapshot;
- benchmarks transfer only abstract product principles such as first-turn clarity, progress readability and feedback cadence;
- names, branding, characters, art, audio, layouts, assets, code and distinctive rulesets may not be copied.

## Learning loop

Each terminal cycle uploads a lightweight `commissioning-summary.json`. `learning.cjs` combines those immutable outcomes with the seed history and records:

- attempts, `RC_READY` and `REJECTED` counts by mechanic family;
- QA pass counts;
- provider calls and estimated cost;
- recurring failure codes;
- used design IDs.

A family with three rejections and no `RC_READY` is retired. A retired family is never given a new game ID to regain its budget. Known recurring failure codes are converted into bounded correction priorities such as result presentation, difficulty progression, mobile hierarchy and action feedback; those priorities are injected into the next implementation contract. Unknown text from artifacts is ignored. The selector also excludes used designs, stale benchmark evidence and families or designs without reviewed runners.

When no eligible reviewed design exists, the Foundry returns `IDLE` before a provider call. New mechanics enter the catalog as `incubating` and require deterministic multi-seed Oracle, Product and Commercial contracts plus a reviewed runner before their status can become `reviewed`.

## Reviewed supply batches

- Sequences 19 and 20 exercised the first pair: original `kinetic-balance` and market-informed `pressure-allocation`. Both reached a clean terminal `REJECTED` state after the bounded repair budget and uploaded learning artifacts.
- The resulting recurring difficulty, progress, action-feedback, mobile-hierarchy and result-presentation failures are correction priorities for the next implementation contracts; they do not weaken any gate.
- The second reviewed pair is original `signal-composition` followed by market-informed `trajectory-interception`. Each has a separate finite-state mechanic, six deterministic seed models, reversible score probes and reviewed Product and Commercial contracts.
- Only one design in each new family is reviewed. Sibling designs remain `incubating` until they receive their own reviewed rules and evidence, so catalog expansion cannot silently turn into budget-reset cloning.

## Safety boundaries

The existing limits remain unchanged: serial execution, at most six provider calls, at most USD 2 estimated provider cost, at most five repairs and `Production=false`. The Foundry cannot lower QA gates, revive a terminal rejection, reset a repair budget or authorize Production.
