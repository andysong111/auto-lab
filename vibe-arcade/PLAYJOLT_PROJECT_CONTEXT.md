# PlayJolt Autonomous Publishing OS — Durable Project Context

Last synchronized from prior ChatGPT project work: **2026-10-02**

This document exists so future Codex sessions can continue the PlayJolt project from the repository itself without requiring old ChatGPT conversations.

It captures owner intent, long-range roadmap, decisions, lessons, safety boundaries, and historical context that are not fully recoverable from code alone.

> Runtime truth still comes from current `main` and latest GitHub Actions. If a SHA, run, candidate status, or implementation detail in this document becomes stale, inspect the repository and Actions before acting.

---

## 1. Project identity and terminology

Repository:

`andysong111/auto-lab`

Primary app:

`vibe-arcade`

Current program name:

**PlayJolt Autonomous Publishing OS**

Older documents and code may use **LoopJolt** or **vibe-arcade**. These are historical/product names inside the same broader browser-game project. Do not perform mass renames merely for consistency.

The current engineering objective is not simply "make games with AI." It is to build a low-labor operating system that continuously creates, tests, rejects, previews, publishes, measures, distributes, and learns from browser-game experiments.

---

## 2. Owner's ultimate target

The desired end state is a system that can run for long periods without the owner or ChatGPT manually pushing each step.

Target operating loop:

`IDEA -> SPEC -> AI BUILD -> Technical QA -> Product QA -> Commercial QA -> bounded REPAIR -> RC/REJECT -> Preview/Release -> DEPLOY -> MEASURE -> PROMOTE -> LEARN -> next IDEA`

Long-term owner role:

- roughly weekly review of outcomes and economics;
- approve genuinely sensitive boundaries;
- make strategy/allocation decisions;
- avoid being the daily operator.

The owner explicitly prefers:
- minimum repetitive labor;
- automated GitHub/Vercel workflows;
- systems that continue without chat prompts;
- safe CI-passing repo changes to be carried through to merge when no genuine owner judgment is required;
- status checks to be status checks, not hidden "wake-up commands."

---

## 3. Two different phase systems — do not confuse them

There are two phase concepts in the repository.

### A. Business-validation phase

Older `MASTER_PLAN.md` / `GOALS.md` use "Phase 1" to mean validating:
- external acquisition;
- player engagement;
- replay;
- retention;
- whether a web-game business deserves more capital.

That business-validation frame is still valid.

### B. Autonomous Publishing OS engineering phases

The later ChatGPT/Codex work uses an engineering roadmap:

1. **Factory foundation** — manifest/state machine, GameKit, browser QA, quality gate, repair loop
2. **Real AI Builder/Repair provider**
3. **Generic Product + Commercial quality gates**
4. **Autonomous multi-candidate factory**
5. **RC Preview + owner-gated Production release/rollback**
6. **Automated distribution / Shorts / social / SEO**
7. **Real-user measurement + resource allocation**
8. **Learning loop from winners/losers back into generation**

When someone says "Phase 5" in recent engineering discussions, it means engineering Phase 5, not business-validation Phase 5.

---

## 4. Engineering roadmap and current status

### Phase 1 — Factory foundation — COMPLETE

Delivered:
- versioned game manifest/state machine;
- GameKit runtime contract;
- deterministic QA contracts;
- Playwright/browser QA;
- bounded Repair loop;
- Quality Gate;
- RC/Preview interfaces;
- control-plane kill switches;
- production auto-ship hard disabled.

### Phase 2 — Real Builder / Repair provider — COMPLETE

Delivered:
- real provider calls;
- provider operation accounting;
- bounded input/output/cost;
- idempotency/quarantine/recovery protections;
- exact repair feedback.

Current autonomous candidate policy is stricter than the owner's broad paid-call permission:
- max provider calls: **6 per candidate**
- max estimated provider cost: **USD 2 per candidate**

Historical owner permission also allowed PlayJolt paid AI operations up to **KRW 50,000 per operation** without re-asking, but the autonomous Factory should keep the current USD 2 ceiling unless a newer explicit owner decision raises it. New subscriptions or plan changes require owner approval.

### Phase 3 — Product and Commercial quality system — COMPLETE

Pipeline evolved from technical-only checks into:

`Technical QA -> Generic Product QA -> Commercial Polish Gate -> Quality Gate -> Repair`

The system must reject technically functional but weak games.

### Phase 4 — Autonomous multi-candidate factory — COMPLETE

Delivered:
- Autonomous Candidate Cycle;
- Candidate Queue Supervisor;
- Trusted Intake Generator;
- terminal candidate -> Supervisor handoff;
- generated-candidate preflight;
- duplicate-run protection;
- PR creation treated as best effort instead of a hard dependency;
- adaptive throughput;
- serial execution;
- automatic continuation without ChatGPT wakeups.

By 2026-09-28 the Factory had demonstrated multiple `commissioning/auto-*` candidates generated and completed autonomously in one UTC day.

Adaptive throughput policy:
- 0 proven fully autonomous generated completions -> max **1/day**
- after 1 proven completion -> max **3/day**
- after 3 proven completions -> max **6/day**
- execution remains **serial**, one active autonomous candidate at a time

A "successful Factory completion" can end in `REJECTED`; the success criterion here is that the automation safely reaches a clean terminal checkpoint without owner intervention.

### Phase 5 — RC Preview / Production release / rollback — IMPLEMENTED, E2E RC_READY PROOF PENDING

Merged in PR #93.

Implemented:
- eligible `RC_READY` -> isolated RC branch;
- direct terminal-cycle dispatch to RC Preview using the immutable source run ID;
- Factory CI;
- exact-source Vercel Preview;
- byte/source identity checks;
- SHA-256-addressed release packet;
- owner-only Production workflow;
- exact packet digest requirement;
- exact confirmation phrase requirement;
- `playjolt-production` environment boundary;
- fast-forward-only release from the packet's recorded base;
- Production smoke verification;
- rollback by normal revert commit;
- no history rewriting;
- no autonomous Production trigger.

Important current status:
- the Preview/release workflow has already been exercised against a REJECTED source and correctly skipped Preview/release-packet creation;
- this proves the rejection boundary works;
- the remaining Phase 5 proof is an actual eligible `RC_READY` candidate completing exact-source Preview + release packet;
- after that, an owner-approved Production release/rollback exercise is the final real-world boundary proof.

Operational lesson from 2026-09-29:
- an implicit `workflow_run` continuation did not fire for autonomous cycles that were themselves dispatched through the repository token;
- eligible terminal cycles now explicitly dispatch the RC Preview workflow, while rejected candidates continue directly to the Supervisor;
- the trusted permutation contract now supplies the exact Oracle target matrix and aligns its first active touch with the generic Technical QA probe. Earlier templates forced a touch failure and allowed generated target logic to diverge from the reviewed Oracle; fixing those contradictions preserves rather than lowers the quality bar.

Candidate-supply lesson from 2026-09-30:
- generated candidates 13 through 18 all exhausted repair budget in the same permutation-ordering mechanic family, so adding more gates alone was not improving the raw material;
- the permutation-ordering family is retired and must not be cloned under a new game ID;
- the Learning Foundry now alternates `original` and `market-benchmark` lanes, making exactly one of every two candidates use fresh reviewed Google Play evidence;
- market benchmarking transfers only abstract principles such as first-turn clarity, visible progress and feedback cadence. Names, branding, characters, art, audio, layouts, assets, code and distinctive rulesets remain forbidden inputs;
- every terminal cycle emits a lightweight outcome artifact. Family attempts, QA passes, costs, recurring failure codes and used design IDs inform the next selection;
- three rejections with no RC_READY automatically retire a mechanic family before another paid provider call;
- unreviewed mechanics remain `incubating`, and no eligible reviewed design means safe `IDLE`, not an improvised paid build;
- the first reviewed proof pair uses two distinct finite-state families: original `kinetic-balance` and market-informed `pressure-allocation`.

Learning Foundry continuation from 2026-10-01:
- sequence 19 `Counterweight Garden` used the original `kinetic-balance` lane and sequence 20 `Capacity Chorus` used the Google Play market-benchmark `pressure-allocation` lane;
- both remained serial, stopped at `REJECTED` after repair 5/5, used exactly six provider calls, stayed below USD 2 and kept Production disabled;
- both uploaded terminal learning artifacts, and the next intake correctly stopped before a paid call because no further reviewed original design was available;
- recurring difficulty, progress, action-feedback, mobile-hierarchy and result-presentation failures now feed the next bounded implementation contract;
- a second reviewed pair adds original `signal-composition` and market-informed `trajectory-interception`, each with a distinct deterministic six-seed Oracle and reviewed Product and Commercial contracts. Other sibling designs remain `incubating`.
- sequences 23 `Echo Switchyard` and 24 `Cadence Forge` both completed autonomously but remained `REJECTED` after repair 5/5. Echo Switchyard reduced its final failure surface, while Cadence Forge regressed, so there is not yet evidence of a reliable upward product-quality trend;
- the learning translator now reserves bounded priority for recurring keyboard/touch parity and lifecycle-integrity failures such as unreachable completion, missing result/replay and broken practice-best behavior. These blocking failures can no longer be crowded out by a larger count of downstream polish failures;
- each reviewed Foundry proposal now includes a strictly validated `build_invariants` packet derived from the same immutable six-seed Oracle used by Product QA. It supplies exact projections, named input bindings, lifecycle selectors, diagnostic paths and normal-input success routes so Builder establishes deterministic core/lifecycle behavior before Phaser polish. This adds production material without lowering or bypassing Technical, Product or Commercial QA.
- the next reviewed proof pair starts at sequence 25 with original `flux-harvesting` and sequence 26 with market-informed `aperture-shaping`. These are distinct charge-and-polarity and aperture-and-focus state machines, not renamed copies of a rejected game. They are the first candidates intended to measure the effect of the stricter build-invariant construction packet while preserving the existing six-call, USD 2, five-repair, serial and Production-off boundaries.
- sequences 27 `Phase Arbor` and 28 `Gradient Loom` also remained serial and safely reached `REJECTED` at repair 5/5 with six provider calls, estimated cost below USD 2 and Production disabled. Neither reached browser QA: the pre-apply construction validator incorrectly looked for `presentation.*` diagnostics in DOM-free `core.js`, even when `view/art.js` correctly exposed them, and empty-workspace repairs were not explicit enough that all six required candidate files had to be returned together;
- construction validation now checks deterministic `quality.*` diagnostics in `core.js` and presentation diagnostics in `view/art.js`. An empty accepted workspace carries an explicit complete-response contract listing every required file. Rejected model output remains quarantined context only, and all existing Technical, Product and Commercial gates remain unchanged.

Supervisor wake-up lesson from 2026-09-30:
- GitHub skipped multiple consecutive hourly schedule events while the workflow remained active, delaying the first post-Foundry candidate despite a new UTC-day allowance;
- the Supervisor now has two staggered schedule signals per hour instead of one;
- this is wake-up redundancy only. Existing concurrency, active-run detection, exact-SHA duplicate blocking and adaptive daily quota remain authoritative, so duplicate schedule delivery cannot create concurrent candidates or reset any budget.

Wake-up continuation from 2026-10-01:
- after the second reviewed Foundry pair merged, the Supervisor again missed several consecutive schedule opportunities;
- an independent `PlayJolt Factory Wake Relay` schedule now dispatches only the guarded Supervisor and has no intake, candidate, provider or Production authority;
- the active Relay's first four scheduled opportunities also produced no run, so it now listens to pushes on `main` and gives reviewed design or workflow merges an immediate guarded continuation path;
- scheduled wakeups remain the UTC-day continuation mechanism, while the push trigger removes manual candidate dispatch from merge-driven continuation;
- the Supervisor remains the sole queue decision point, so both wake sources share the same serial, quota, duplicate-SHA and Production-off protections.

Durable provider continuation from 2026-10-01:
- sequence 22 reached `PAUSED_PROVIDER` when its first background build exceeded the request timeout after a response ID had been saved;
- Candidate Cycle recovery now restores the exact failed-run artifact, validates same-branch ancestry and reviewed contracts, and resumes only that saved response by GET;
- recovery is limited to three retrieval attempts and preserves the original operation reservation, provider-call count, elapsed wall clock and repair budget. Missing IDs, mismatched artifacts, terminal candidates and exhausted limits fail closed without another generation POST;
- Production remains disabled throughout recovery.

Do **not** lower quality requirements merely to create an RC_READY.

### Phase 6 — Automated distribution — NEXT AFTER PHASE 5 PROOF

Target flow after a released or selected game:

`game -> gameplay capture -> short-form creative variants -> caption/CTA/UTM -> publish -> attribution`

Primary target channels:
- YouTube Shorts
- Instagram Reels
- TikTok
- Threads
- Facebook only as a secondary/cross-post channel when useful

Owner's long-term intent is global English exposure and automated publication.

Creative principle:
- **actual gameplay is the product**
- AI is an attention/marketing layer

Default creative composition:
- 70–100% real gameplay
- 0–30% AI intro/transition/hook

Do not fabricate gameplay, scores, URLs, or brand spelling with generative video.

Exact brand text, CTA, score, URL, and handle should be rendered deterministically in post-processing.

### Phase 7 — Measurement and selection

The Factory's value is not the number of games generated. It is the number of cheap real experiments that produce reliable market evidence.

Minimum Phase-2/evaluator-style readiness currently encoded in policy:
- observed sessions >= 100
- started sessions >= 30
- candidate age >= 72 hours
- required metrics include:
  - observed_sessions
  - starting_sessions
  - replaying_sessions
  - game_finish_sessions
  - error_rate

Business-level directional milestones from earlier planning:
- first useful cohort: 100+ real external sessions;
- game-level signal: roughly 300–500 external plays across the catalog;
- repeatability: 1,000+ external plays, or strong concentration on one game;
- replay near/above ~15% on a winner is a meaningful positive signal;
- starts per visitor trending toward ~1.5+ is desirable.

These are operating thresholds, not promises of commercial success.

Decision classes:

**KEEP**
- relative replay/completion/share/next-game strength;
- invest more.

**MODIFY**
- traffic arrives but product engagement is mediocre;
- fix the weakest proven bottleneck and retest.

**KILL**
- meaningful traffic + reasonable iteration + no relative advantage;
- stop spending effort.

### Phase 8 — Learning loop

The end-state system must feed real market evidence back into:
- mechanic selection;
- difficulty;
- session shape;
- visual/commercial patterns;
- onboarding;
- creative hooks;
- distribution allocation;
- future spec generation.

The goal is a learning portfolio, not an AI game-content treadmill.

---

## 5. Current Factory pipeline

Current conceptual pipeline:

`SPEC -> AI BUILD -> Technical QA -> Generic Product QA -> Commercial Polish Gate -> Quality Gate -> AI REPAIR -> terminal RC/REJECT`

Depending on the current implementation, Preview/RC release continuation sits after an eligible terminal RC state.

Repair policy:
- maximum 5 repairs per candidate;
- build + repairs are bounded by provider-call/cost ceilings;
- exact failures must be passed to Repair;
- do not manually edit candidate code to rescue a terminal run;
- do not reset lifetime accounting.

---

## 6. Quality philosophy

A technically working game is not enough.

A candidate must be understandable, playable, visually legible, commercially credible, and mobile-safe.

### Technical evidence
Examples:
- boots correctly;
- no runtime failure;
- deterministic state;
- keyboard/touch equivalence;
- protected/runtime boundaries preserved.

### Product evidence
Examples:
- objective clear in first seconds;
- meaningful progression;
- objective reachable by normal input;
- valid replay;
- honest score;
- device-local best when required;
- no reversible score farming;
- multi-seed depth;
- success/failure terminal timing;
- 390px mobile readability;
- controls reachable;
- dynamic reduced-motion behavior.

### Commercial evidence
Examples:
- state distinction visible, not just text changes;
- action feedback has meaningful before/intermediate/after evidence;
- progression gains visual spectacle/readability;
- result presentation feels final;
- mobile hierarchy is obvious;
- replay motivation is legible;
- audio is either meaningfully reviewed or intentionally silent by reviewed contract;
- performance remains bounded.

Commercial review should be machine/evidence based. AI critique may corroborate evidence but must not be the sole shipping authority.

### Quality gate principle

**REJECTED can be the correct result.**

The Factory succeeds when it prevents a poor game from shipping.

Do not weaken the gate just because many candidates reject.

---

## 7. Terminal-candidate immutability

Hard rule:

A terminal `REJECTED` candidate is dead.

Never:
- revive it;
- reset `repair_attempt`;
- copy it to a new GAME ID solely to regain repairs;
- rewrite terminal history;
- manually patch it into a pass.

A later genuinely new game may reuse a broad mechanic family only when the evidence does not show the entire family is blocked and the new design is materially different.

---

## 8. Important historical candidates and lessons

### Prism Relay — GAME-20260922-110 — REJECTED

Mechanic:
- spatial-optical-routing

Outcome:
- exhausted repair 5/5;
- terminal;
- this exact family/design path was blocked.

Major lessons:
- technical functionality is not product quality;
- objective/progress/best/result/mobile/reduced-motion evidence needed stronger contracts.

### Cloud Cargo — GAME-20260922-121 — REJECTED

Major failure mode:
- provider output contract violations, including required global export.

Lesson:
- provider output must fail with exact validation file/line/identifier;
- rejected provider output should be quarantined;
- invalid source must not silently become the next Repair context.

Do not recreate Cloud Cargo under a new ID merely to regain budget.

### Ribbon Shift — GAME-20260922-131 — REJECTED

Design:
- same 3x3 row/column cycling style must not be recreated under a new ID.

Lessons:
- reduced-motion settlement needed bounded real wall-clock handling;
- reversible actions must not farm score;
- meaningful transitions need visible whole-state feedback;
- success should finish promptly;
- replay must be visible in the initial mobile result viewport.

The broad permutation/toroidal family is not automatically globally banned; the exact failed design is.

### Keywake — GAME-20260923-141 — REJECTED

At one point it passed Technical/Product/Quality and reached a shipping-ready state, but owner review held it because the game was too simple/easy.

Lesson:
- machine correctness does not replace game depth;
- commercial topology/readability matters;
- owner feedback can reveal structural shallowness that becomes a future contract requirement.

No resurrection/reset.

### Pulse Loom — GAME-20260924-181 — REJECTED

Runtime:
- Phaser 4 commissioning generation

Outcome:
- repair 5/5;
- provider calls 6;
- estimated cost about USD 0.5782;
- Production false.

It exposed **repair budget starvation**:
- a persistent early Technical failure could consume repairs while Product/Commercial failures never received useful attention.

Factory fix:
- after repeated stagnant same-stage failures, use integrated recovery;
- include deferred later-stage failures;
- allow a structural rewrite rather than wasting all remaining repairs on one narrow symptom.

This was a Factory lesson, not permission to revive Pulse Loom.

### Beacon Forge — GAME-20260925-191 — REJECTED

Outcome:
- v6;
- repair 5/5;
- provider calls 6;
- estimated cost about USD 0.6974;
- Production false.

Lessons included:
- progress/completion consistency;
- declared vs derived complexity must agree;
- normal-input completion and replay evidence must match the reviewed model.

### Shield Mosaic — GAME-20260926-201 — REJECTED

Outcome:
- v6;
- repair 5/5;
- provider calls 6;
- estimated cost about USD 0.7042;
- Production false.

This was one of the first candidates run through the shared Autonomous Candidate Cycle rather than bespoke chat-driven commissioning.

### Vector Parade — GAME-20260926-211 — REJECTED

Outcome:
- fully auto-started by scheduled Supervisor;
- v6;
- repair 5/5;
- provider calls 6;
- estimated cost about USD 0.7114;
- Production false.

Importance:
- this was a decisive proof that a candidate could be queued, started, run, terminate, and hand back to the Supervisor without a ChatGPT wake-up.

### Rune Cascade — GAME-20260927-301 — REJECTED

Trusted Intake generated candidate.

Outcome:
- zero-paid generated preflight passed;
- later autonomous cycle completed;
- v6;
- repair 5/5;
- provider calls 6;
- estimated cost about USD 0.6611;
- Production false.

Its first intake attempt exposed a GitHub Actions permission issue: Actions could push the branch but could not create a PR. The fix made draft PR creation best effort so PR permissions can never halt the Factory.

### Later trusted-intake candidates

By 2026-09-28 the system had autonomously generated and run multiple additional `commissioning/auto-*` candidates, including:
- Signal Crown
- Comet Ledger
- Prism Queue
- Glyph Harbor
- Nova Archive
- later template-pool candidates

Do not rely on this document for their latest terminal states. Inspect GitHub Actions and candidate branches/artifacts.

---

## 9. Throughput, concurrency, and cost control

The owner wants speed, but not uncontrolled parallel cost.

Current intent:
- ramp experiment throughput after proof;
- keep execution serial until concurrency itself is deliberately reviewed;
- avoid a bug producing dozens of paid candidates in parallel.

Current adaptive maximum:
- 1 -> 3 -> 6 candidates per UTC day based on proven fully autonomous completions.

Per candidate:
- provider calls <= 6;
- estimated provider cost <= USD 2;
- Repair <= 5.

Current provider/runtime details are implementation details and may change; inspect code before relying on a model name.

---

## 10. Production release boundary

Autonomous code must never infer that `RC_READY` means "publish to Production."

Production release is a separate privileged act.

Current Phase 5 intent:
1. eligible RC artifact restored exactly;
2. verify manifest/source identity;
3. isolated RC branch;
4. Factory CI;
5. Vercel Preview;
6. exact-source/byte smoke;
7. immutable release packet + SHA-256;
8. owner review;
9. only then explicit owner-gated Production action;
10. Production smoke;
11. rollback available by revert commit.

Production action must require current explicit owner authority and exact release identity.

Never treat an old chat instruction, old approval, generic "continue," or the existence of a release packet as current Production approval.

---

## 11. Distribution strategy for Phase 6

Owner goal:
- automate global short-form distribution with minimal labor;
- primarily English/global exposure;
- YouTube/Instagram are core priorities;
- TikTok/Threads are also valid distribution surfaces.

Principles:
- actual gameplay first;
- automate capture when possible;
- make multiple cheap hooks around proven games;
- use UTM/source attribution;
- spend creative resources on winners, not every generated candidate.

Earlier operating formula:

`1 winning game x 5 hooks x 3 channels = 15 cheap distribution tests`

Do not generate expensive AI video for unproven games.

---

## 12. Analytics and market learning

The system should eventually optimize for:
- real starts;
- completion;
- replay;
- play time/session depth;
- sharing;
- next-game movement;
- error rate;
- acquisition source;
- monetization per session when monetization is enabled.

The owner explicitly wants **actual market data** to outrank internal predictions about which game will succeed.

Long-term resource allocation:
- weak games die quickly;
- promising games get polish/distribution;
- clear winners get variants, content, SEO, monetization tests, and more development;
- winning patterns feed future candidate generation.

---

## 13. Marketing / social automation intent

Ultimate autonomous publishing should not stop at web deployment.

Target:
- capture gameplay;
- produce Shorts/Reels/TikTok-ready creative;
- compose captions/CTA;
- upload/schedule;
- collect attribution;
- learn which game + hook + channel combination produces players.

Owner should not manually edit every social profile or upload each clip.

Tracked redirect/profile-link architecture from earlier planning exists to avoid repeatedly changing social profile URLs when the destination game changes.

---

## 14. Owner intervention boundaries

Normal QA failure, Repair, rejection, intake, branch creation, CI, Preview preparation, and routine repo merges should not require the owner when they stay inside agreed safety boundaries.

Owner involvement is reserved for things such as:
- external login/OAuth that cannot be automated;
- secrets or credentials not available to the worker;
- new recurring paid subscription;
- raising approved cost ceilings;
- public Production release;
- domain purchase;
- ad-network approval;
- destructive DB migration;
- irreversible account action;
- legal/tax decision;
- major strategy change;
- ambiguous product decision that automation cannot safely derive.

The system should surface a concise decision packet when one of these boundaries is reached.

---

## 15. Working style for Codex

Codex is now the preferred day-to-day development environment for this repository.

Expected behavior:
- start from latest `main`;
- inspect live GitHub state before assuming a run is stale or current;
- preserve terminal candidate history;
- use branches/PRs for meaningful changes;
- test and fix before merge;
- merge safe CI-passing changes without repeatedly asking the owner;
- continue through logical implementation stages instead of pausing after each small success;
- ask the owner only at a genuine decision boundary.

The owner may use ChatGPT separately for high-level strategy, but normal PlayJolt implementation must not depend on ChatGPT chat being open.

---

## 16. Durable documentation rule

Important architectural and strategic decisions must not live only in chat.

Whenever any of the following change, update this file (or a directly linked specialized source-of-truth document) in the same PR:

- engineering phase/status;
- production approval boundary;
- repair/provider/cost policy;
- throughput/concurrency policy;
- quality gates;
- autonomous continuation logic;
- owner intervention rules;
- release/rollback policy;
- distribution strategy;
- analytics/winner-selection rules;
- terminal-family blocking rules;
- major lessons that should change future generation/QA.

This is how Codex sessions remain continuous without old conversation history.

---

## 17. Current continuation checkpoint (2026-09-30 snapshot)

Snapshot main around this sync:
- PR #93 owner-gated RC release/rollback pipeline merged;
- Phase 5 remained implemented while the candidate supply was upgraded from one exhausted template family to the Learning Foundry.

Engineering status:
- Phase 4: COMPLETE
- Phase 5 implementation: COMPLETE
- Phase 5 real eligible-RC proof: PENDING

Immediate goal:
- run the reviewed Foundry proof pair without weakening gates: one original family, then one market-benchmark family;
- confirm terminal outcome artifacts change future selection and prevent exhausted-family repetition;
- prove the direct terminal-cycle -> RC Preview handoff on the first naturally eligible candidate;
- when the first eligible `RC_READY` appears, run the exact-source RC Preview + release-packet pipeline;
- verify isolated Preview and release identity;
- stop at the owner Production approval boundary;
- only after explicit owner approval perform a controlled Production release/rollback proof;
- then move to Phase 6 automated distribution.

Do not manually force an RC_READY.

2026-10-01 continuation:
- `GAME-20261001-322` / Orbit Window resumed from its exact persisted provider response ID after an infrastructure timeout. The same game and lifetime ledger reached `REJECTED v6`, repair `5/5`, provider calls `6`, estimated cost `$1.031262`, and `Production=false`; no candidate or budget was reset.
- The next intake correctly stopped before paid work with `no_reviewed_original_design`. This is a safe supply-exhaustion state, not permission to repeat an old design.
- The next reviewed supply batch introduces original `echo-routing` at sequence 23 and market-informed `cadence-buffering` at sequence 24. Each has a distinct bounded finite-state model, six deterministic seeds, reversible score probes, reviewed Product and Commercial contracts, and an explicit minimum sequence so history is not rewritten.
- Sequences 23 and 24 later reached `REJECTED`, exhausting that reviewed pair without an eligible RC. The following reviewed batch starts at sequence 25 with original `flux-harvesting` and sequence 26 with market-informed `aperture-shaping`; both have new finite-state mechanics, reviewed six-seed contracts and build invariants derived from their exact Oracle routes.
- Trusted Intake no-op attempts are bounded per UTC day and exact `main` revision. This preserves loop protection when reviewed supply is unchanged, but a new reviewed supply merge resets only the no-op dispatch window and can resume generation without changing candidate, repair, provider-call or cost budgets.

2026-10-02 construction-quality continuation:
- Sequences 25 (`Flux Orchard`) and 26 (`Lumen Aperture`) both reached `REJECTED v6` under the unchanged six-call, USD 2, five-repair, serial and Production-off boundaries. Their final failure surfaces improved over sequences 23 and 24, but repeated touch parity, reachable completion, replay lifecycle and Oracle-complexity mismatches mean the improvement is not yet proven.
- The reviewed `build_invariants` packet now carries exact GameKit action expressions, per-stage Oracle complexity and required-action checkpoints, the exact preterminal state/action transition, and the GameKit-owned replay rule. Provider output is rejected before application when reviewed action bindings or lifecycle selectors are absent. Technical, Product and Commercial gates remain unchanged and authoritative.
- Sequences 27 original `phase-coupling` and 28 Google Play market-informed `gradient-compression` were the final pair on the shared calibration runner. Both used six deterministic seeds and increasing two-, four- and six-decision stage depth, but both still ended `REJECTED v6`. Market transfer remained limited to abstract first-turn clarity, playfield-visible progress and complete short-session presentation; names, branding, art, audio, layouts, assets, code and distinctive rulesets remained forbidden.

2026-10-02 owner playtest quality reset:
- The owner directly played sequence 25 `Flux Orchard` and judged it very boring and disappointing. Treat this as authoritative Product evidence. A smaller automated failure surface is not evidence that the game itself is enjoyable.
- Root cause: the Foundry changed names, themes and finite-state rules while repeatedly using the same four-control choose-values-then-commit interaction shape. The reusable Feel Kit existed in the repository but was not supplied to autonomous candidate workspaces, and reviewed silence removed another feedback surface.
- GameKit v3 candidate workspaces now receive protected `feelfx.js` and `feelaudio.js`. PhaserKit exposes bounded `scene.playjoltFeel`; GameKit owns gesture-gated action/progress/success/failure cues, mute, pause, pagehide and disposal. Foundry contracts require a first-ten-second payoff, tension curve, mastery hook, replay hook and sensory payoff. These are construction requirements, not weaker QA gates.
- The shared finite-state calibration runner is retired after sequence 28. Sequence 29 or later must remain cost-free `IDLE` until a genuinely different reviewed interaction runner and Oracle exist; changing a title, theme or game ID cannot qualify.
- Sequence 29 `Comet Breaker` reached terminal `REJECTED v6` with six provider calls, estimated cost below USD 2, repair 5/5 and Production disabled. Owner playtesting found it plainly unfun and worse than the initial hand-authored games. Inspection showed why: the generated core used hidden lane targets and immediate teleportation while the visibly descending comet lived only in presentation. One correct input could finish a wave, so the apparent action game was not the canonical mechanic.
- Sequence 30 `Signal Bastion` therefore uses a new reviewed market-benchmark `threat-parry` family and separate `reflex-runner.cjs`. A protected Factory-owned `ReflexKit` now owns input, deadline, danger, score, progress, success and failure. The three waves require exactly 2, 4 and 6 successful parries across 2, 3 and 4 directions; waiting fails on the same deadline represented by the visible danger value, and a wrong direction scores nothing and adds one recovery beat. Generated code may present this state but cannot replace the core wrapper or runtime. Google Play evidence transfers only first-choice clarity, playfield-visible pressure and complete short-session payoff; copying remains forbidden.
- Production remains unauthorized. Serial execution, six provider calls, USD 2 estimated cost and five repairs remain unchanged.

---

## 18. Long-term definition of success

The project is successful when PlayJolt behaves like an autonomous experiment portfolio:

- cheap game ideas are generated continuously;
- bad games are rejected automatically;
- good candidates are previewed safely;
- approved games can be released and rolled back safely;
- distribution is automated;
- market data identifies winners;
- capital and creative effort move toward winners;
- winner patterns improve future generation;
- owner labor trends toward weekly oversight instead of daily operation.

That is the durable north star.
