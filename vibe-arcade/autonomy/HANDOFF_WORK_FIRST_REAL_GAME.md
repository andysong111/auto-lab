# First real autonomous candidate — Prism Relay

**Terminal result: READY_TO_SHIP v4. Production authorized: false.**

The real Factory completed Spec Gate → GPT-5.6 Terra Build → Docker Chromium failures → three AI repairs → QA PASS → Quality Gate PASS → Draft RC PR → exact-commit Vercel Preview → byte-identical smoke → release-review packet. No candidate file was manually authored or repaired by Work. This technical completion does **not** establish Astra/Deep Descent-level polish, fun, retention or market value; see the concrete design gaps below.

| Identity | Value |
| --- | --- |
| Game | Prism Relay — `GAME-20260922-110`, generation 1, v4 |
| Mechanic family | `spatial-optical-routing` |
| Controls | PC arrows/WASD select, Space rotates; mobile tap rotates |
| Run | 45 seconds; light three receivers for success, continue scoring |
| Provider / model | Real OpenAI Responses / `gpt-5.6-terra` |
| Calls / cost | 4 calls: build + 3 repairs; **USD 0.58391601 estimated**, billed cost unknown |
| Candidate branch / Draft PR | `factory/GAME-20260922-110` — [#45](https://github.com/andysong111/auto-lab/pull/45) |
| Exact RC commit | `73dd47cbc50db6825c2fcc9d6a19d60136cd5818` |
| Source hash | `32c334dadddacc3d5bc337dc013c827bd5ac628aba2b2dac610549a80b4c8de8` |
| Exact Preview | [Play candidate](https://vibe-arcade-ivrp070e0-a2bsangsa.vercel.app/autonomy/games/GAME-20260922-110/v4/) — protection retained |
| Deployment | `dpl_B6HHwPb2dLgeZPtsQjJDzY5gQDSy`; GitHub deployment `6585931823`; READY, Preview target, exact commit verified |
| System/evidence branch / PR | `commissioning/first-real-game-20260922` — [#44](https://github.com/andysong111/auto-lab/pull/44) |
| Rollback / untouched base | `c64d9f10d8a0f099603e5a6a9b78f1ad1d823a2d` |

## Idea selection and immutable spec

Three ideas were evaluated qualitatively, without a numeric fun score:

- **Selected: Prism Relay.** Rotate a stationary spatial light path to charge receivers. Unlike the eight catalog games, the primary decision is spatial routing, with no combat/autofire, tower descent, radial pin timing, column merge, runner movement, reaction cue or timing-window test. One-touch mobile control and a visible connection pulse suit a short run.
- **Deferred: Balance Bloom.** Place weighted seeds to stabilize a growing platform. Distinct, but readable torque and touch placement add physics/tuning risk.
- **Deferred: Fold Harbor.** Slide two translucent layers into a target silhouette. Distinct, but layer selection needs more first-five-second explanation.

[Ideas and selection](commissioning/first-real-game/ideas.json) · [Original proposal](commissioning/first-real-game/proposal.json) · [Spec Gate PASS](evidence/first-real-game/spec-gate.json) · [Immutable spec](evidence/first-real-game/immutable-spec.json).

The spec prescribes a 4×3 board, constructed solvable seeded paths, bounded effects, 2700-tick/45-second terminal, score/progression, restart, pause, account-free practice and original procedural art. QA uses seed 23, `ArrowRight → state.cursor.x`, touch → `state.rotations`, with a 47-second terminal verification bound. The mechanic itself is distinct; a blocked family was not renamed. No Astra/Descent code or artwork was supplied to the model or copied into the candidate.

## Real build and repair history

[Paid-run CI 35700802371](https://github.com/andysong111/auto-lab/actions/runs/35700802371) ran the existing `node autonomy/worker.cjs run-once`, without a mock. Full responses/accounting are in [provider-ledger.json](evidence/first-real-game/provider-ledger.json).

| Operation ID | Model | Input tokens | Output tokens | Estimated USD | Cumulative estimated USD | Actual result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| GAME-20260922-110/build/v1 | gpt-5.6-terra | 2,533 | 5,853 | 0.11548600 | 0.11548600 | v1: loading/JS syntax failure |
| GAME-20260922-110/repair/1 | gpt-5.6-terra | 8,289 | 6,823 | 0.15597000 | 0.27145600 | v2: same syntax failure remained |
| GAME-20260922-110/repair/2 | gpt-5.6-terra | 9,414 | 6,541 | 0.15539400 | 0.42685000 | v3: same syntax failure remained |
| GAME-20260922-110/repair/3 | gpt-5.6-terra | 9,319 | 6,655 | 0.15706601 | 0.58391601 | v4: actual QA PASS; RC_READY |

Versions v1–v3 mixed arrow-IIFE openings with function-IIFE closing syntax `}());` in core/app/view. Chromium reported `Unexpected token '('`; diagnostics never booted and HTML checks timed out at all three widths. Repair 1 and 2 retained the fault; repair 3 generated valid function IIFEs. These were model failures, not hand-fixed code. Actual requests, causes, changed-file lists and results are in [repair-history.json](evidence/first-real-game/factory/repair-history.json), the three repair requests and per-version build/qa JSON.

All four operations have response IDs and reported usage. No ambiguous submission was repeated. Review/Preview made no model calls. Budget: 6 generations / 5 repairs, one concurrent build, USD 2 cumulative/daily estimated cost, 60 elapsed minutes, 300-second request timeout. Two allowed calls remained unused after success.

Costs use reported tokens and conservative Terra rates of USD 4 input / USD 18 output per million, ignoring cache discounts. [Official pricing](https://developers.openai.com/api/docs/pricing) was checked 2026-09-22; standard short-context rates were USD 2/12. Estimates are not billing-API invoices, and do not assert CI/Vercel usage is free. No secret value entered prompts, candidate mounts or committed evidence.

## Actual QA and visual evidence

Original [v4 QA](evidence/first-real-game/factory/v4/qa.json) and [Quality Gate](evidence/first-real-game/factory/v4/quality.json) PASS. A supplementary [isolated input-driven playthrough](evidence/first-real-game/quality-review/qa.json) also passed in [review CI 35702212896](https://github.com/andysong111/auto-lab/actions/runs/35702212896).

At **390×844, 768×1024, 1280×800**, real Chromium verified HTML/assets, zero console/page errors, start, real-clock ticking, keyboard/touch effects, progress, board interaction, terminal/restart, pause/resume, hidden/pagehide safety, overflow, freeze/resource caps and **zero attempted production/network/persistence writes**. Execution remained in a reviewed non-root, read-only, network-disabled Docker runtime with resource/deadline limits. No host execution fallback.

The supplementary pilot reads diagnostics but uses only normal keyboard/touch events: no score, board or victory injection. Every viewport lit 3 receivers, earned 385 points, and reached the real success screen at tick 2700. The unsolved common-QA run reached incomplete with 0 points. This proves reachable scoring/success/failure, not human difficulty or fun.

- [Entry/mobile](evidence/first-real-game/quality-review/viewport-390-entry.png)
- [Mid-game desktop](evidence/first-real-game/quality-review/viewport-1280-midgame.png)
- [Mobile charged receiver](evidence/first-real-game/quality-review/viewport-390-charged.png)
- [Mobile success/result](evidence/first-real-game/quality-review/viewport-390-success.png)
- [Mobile incomplete/result](evidence/first-real-game/quality-review/viewport-390.png)
- [Tablet entry](evidence/first-real-game/quality-review/viewport-768-entry.png)
- [Short gameplay capture, WebM](evidence/first-real-game/quality-review/viewport-390-playthrough.webm) — accelerated diagnostic recording, not real-time human play.

### Concrete quality comparison and known weaknesses

Astra V3 and Deep Descent were inspected through current source and actual regression screenshots; their art/code was not passed to Builder. No numeric winner or parity claim is made.

| Aspect | Evidence and gap |
| --- | --- |
| Entry / first five seconds | Prism board/emitter/receiver and rotation hint are immediately visible. But the explicit “light 3 receivers” objective is missing from visible entry. Descent has a much stronger large objective/Play presentation. |
| Controls | Real tap/keyboard controls produce points; prism hit areas are large. Start/Replay and small canvas hint text are less prominent than the baselines. |
| Progression | Timer, circuits, score and SPARK/SURGE/SPECTRUM change. Astra has 9 gates, evolving equipment and 3 worlds/guardians; Descent has 48 rings, sectors and guardian vaults. Prism has much less variety and no comparable campaign depth. |
| Visual feedback | Original navy prisms, amber leak, mint connection, charge arc and bounded pulse/particles. Coherent but flatter/sparser than baseline environments. No audio. |
| Replay / difficulty | Seeded replay works. On seed 23, the pilot solved the first three boards with one rotation each. Rising difficulty is not demonstrated by this seed; broader seed and human replay-value evaluation remain open. |
| Results / records | Success/incomplete and replay work. GameKit tracks local best (385 in the pilot), but the generated view does not visibly display it or a target “0/3” counter. |
| Shorts moment | Connection/pulse is captured. Shareability is not proven; no SNS content was published. |

**Recommendation: retain as a technical launch candidate; do not approve public launch merely from READY_TO_SHIP.** Goal clarity, visible target/best, difficulty variety and polish require supervising-team judgment. No second candidate was generated to hide these limits.

## RC, exact-source smoke and release packet

The existing `GitHubVercelAdapter.prepare()` created the source-only commit/Draft PR through authorized GitHub connector transport. A read-only Actions token then ran the same adapter to reconcile the exact tree, green checks and GitHub Preview deployment. The RC diff contains only candidate files; transport did not modify source or fabricate QA.

Protection correctly paused the initial smoke at PREVIEW_SMOKE. The connected Vercel temporary-authentication method established a host-scoped cookie. Unchanged `smokePreview()` then used a trusted GET transport with manual, candidate-scoped redirects and verified all seven non-Markdown runtime files byte-for-byte. Project protection settings were unchanged. Cookie/share credentials are not committed; the clean URL contains no token. Future reviewers need their existing Vercel access after temporary access expires.

[Preview smoke PASS](evidence/first-real-game/factory/v4/preview-smoke.json) · [Final manifest](evidence/first-real-game/manifest.json) · [Release packet PASS](evidence/first-real-game/release-review-packet.json).

The existing command produced the packet:

```sh
node autonomy/commissioning/cli.cjs release-packet /path/to/final/manifest.json \
  --out /path/to/release-review-packet.json \
  --base-ref c64d9f10d8a0f099603e5a6a9b78f1ad1d823a2d
```

Owner decision is PENDING; `production.authorized=false`, `metrics_eligibility=false`, `AUTO_PRODUCTION_SHIP=false`; repository intake remains OFF. Neither PR was merged. No homepage, sitemap, ranking, auth/country, Supabase production data, SNS or ad change occurred.

## System changes and validation

These infrastructure changes are separate from AI-authored game code:

1. Spec Gate retains a bounded declarative implementation contract instead of dropping the design brief. Existing Factory spec persistence is reused; no replacement engine/state machine.
2. Existing QA captures entry/playing/midgame as well as terminal. A game-ID-scoped opt-in review mode reuses its runner/guard/container for an input pilot and capture. Acceptance/fatal policies were not relaxed. The pilot is trusted test code and is not shipped as game source.
3. One-shot paid workflow rejects reruns/prior submissions and retains the hidden provider ledger. Its initial configuration failed before any runner job: [35700612984](https://github.com/andysong111/auto-lab/actions/runs/35700612984), verified `jobs.total_count=0`. Corrected preflight independently rechecked this zero-job exception; no call/operation was consumed or reset.

Actual checks: 39 Factory/control/commissioning contracts, 50 Worker/provider contracts, 9 Factory browser cases, 5 isolated Worker tests, real candidate QA, 3 input-driven success cases, and existing production canonical/browser regressions. All executed [RC checks](https://github.com/andysong111/auto-lab/pull/45/checks) passed; existing opt-in `live` was skipped. Astra V3/campaign, Descent, Core Pins/Nova Merge, legacy games and Orbit/auth-shell regression passed. [Candidate Factory CI](https://github.com/andysong111/auto-lab/actions/runs/35701687388) · [CI/deployment snapshot](evidence/first-real-game/github-verification.json). Final system/evidence-head CI is linked from [PR #44 checks](https://github.com/andysong111/auto-lab/pull/44/checks); the PR description records its last verified head.

[Source provenance](evidence/first-real-game/source-provenance.json) proves zero manual candidate edits. [Evidence index](evidence/first-real-game/README.md) covers recovery. JSON, screenshots and capture are committed permanently even after Actions ZIP expiration.

## Supervising-team actions and rollback

1. Review PR #45, this handoff, visual evidence and cost ledger directly on GitHub; no chat-copy transfer is needed.
2. Play the protected Preview and assess the listed design gaps. Decide whether to commission bounded AI polish of this same candidate in a separately scoped follow-up. Unused budget is not an instruction for another game or continued spending.
3. Review PR #44 infrastructure separately. Do not merge/register public routes, rankings or sitemap without a separate production-release decision and integration checks.
4. Preserve original operation IDs/journal for continuation. Never replace an ambiguous submission with a fresh call.

Rollback now: keep the worker OFF and close the unmerged RC PR. Production remains unchanged; no database rollback is needed. Pinned restore target: `c64d9f10d8a0f099603e5a6a9b78f1ad1d823a2d`. Archive evidence; no force-push, main merge or production ship is part of this work.
