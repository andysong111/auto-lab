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

A family with three rejections and no `RC_READY` is retired. A retired family is never given a new game ID to regain its budget. The profile retains at most 24 known failure codes and converts them into at most four correction priorities such as lifecycle integrity, keyboard/touch parity, result presentation, difficulty progression, mobile hierarchy and action feedback; those priorities are injected into the next implementation contract. Blocking input and lifecycle failures receive reserved priority so a large number of later polish failures cannot crowd them out. Unknown text from artifacts is ignored. The selector also excludes used designs, stale benchmark evidence and families or designs without reviewed runners.

Every reviewed Foundry proposal also carries a validated `build_invariants` packet derived from the same immutable multi-seed Oracle used by Product QA. It gives Builder the exact projection, named GameKit action expressions, lifecycle selectors, diagnostic paths, per-stage Oracle complexity checkpoints, preterminal transition and ordinary-input success route for all six seeds. Builder must establish those deterministic core/lifecycle invariants before visual polish. Generated files are rejected before application when they omit reviewed `input.actions` bindings or lifecycle selectors. Replay remains owned by GameKit, and the final action must change the core outcome in the same step. The packet is construction data, not an autoplay or a weaker QA path; Product and Commercial QA still independently exercise the candidate and remain authoritative.

When no eligible reviewed design exists, the Foundry returns `IDLE` before a provider call. New mechanics enter the catalog as `incubating` and require deterministic multi-seed Oracle, Product and Commercial contracts plus a reviewed runner before their status can become `reviewed`.

The shared finite-state calibration runner used through sequence 28 is retired for later candidates. A new title or theme may not disguise the same choose-values-then-commit loop as a new experiment. Sequence 29 or later stays `IDLE` with `new_interaction_runner_required` until a genuinely different reviewed interaction runner, deterministic Oracle and evidence contracts exist.

## Reviewed supply batches

- Sequences 19 and 20 exercised the first pair: original `kinetic-balance` and market-informed `pressure-allocation`. Both reached a clean terminal `REJECTED` state after the bounded repair budget and uploaded learning artifacts.
- The resulting recurring difficulty, progress, action-feedback, mobile-hierarchy and result-presentation failures are correction priorities for the next implementation contracts; they do not weaken any gate.
- The second reviewed pair is original `signal-composition` followed by market-informed `trajectory-interception`. Each has a separate finite-state mechanic, six deterministic seed models, reversible score probes and reviewed Product and Commercial contracts.
- Sequence 23 first proved the exhaustion guard by returning `no_reviewed_original_design` before any provider call. The next reviewed batch starts at sequence 23 with original `echo-routing`, followed at sequence 24 by market-informed `cadence-buffering`; both use new bounded state models rather than relabeling a prior game.
- Sequences 23 and 24 also reached terminal `REJECTED`. Sequence 23 reduced the final failure surface, but sequence 24 regressed, so the result is not yet a reliable quality trend. Their repeated completion, replay, input, progress and feedback failures motivated the reviewed build-invariant packet and blocking-focus priority described above.
- Sequences 25 and 26 both reached terminal `REJECTED` with six provider calls, five repairs and `Production=false`. Their measured failure surfaces were smaller than sequences 23 and 24, but touch parity, reachable completion, replay lifecycle and Oracle-complexity mismatches remained, so this is not yet a proven quality trend.
- Sequences 27 and 28 used original `phase-coupling` and market-informed `gradient-compression`. They were the first supply using the stronger construction packet with exact action, complexity, terminal and replay requirements, but still used the now-retired shared calibration runner.
- Owner playtesting of sequence 25 found the result plainly unfun. That direct product signal overrides any inference from a smaller QA failure surface: deterministic correctness and polish compliance do not establish fun.
- New Foundry construction requires a first-ten-second payoff, tension curve, mastery hook, replay hook and sensory payoff. The Factory supplies bounded FeelFX and gesture-gated FeelAudio, and Foundry audio can no longer choose reviewed silence merely to avoid an evidence surface.
- Only one design in each new family is reviewed. Sibling designs remain `incubating` until they receive their own reviewed rules and evidence, so catalog expansion cannot silently turn into budget-reset cloning.

## Safety boundaries

The existing limits remain unchanged: serial execution, at most six provider calls, at most USD 2 estimated provider cost, at most five repairs and `Production=false`. The Foundry cannot lower QA gates, revive a terminal rejection, reset a repair budget or authorize Production.
