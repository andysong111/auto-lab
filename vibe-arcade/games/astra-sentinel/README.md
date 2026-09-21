# Astra Sentinel — original arena expedition

Scope approved 2026-09-21: one new game, a different genre from Deep Descent, visibly evolving character on clears and rising difficulty. This supersedes the immediate priority of the unfinished retention UX PR; it does not merge that PR or claim it complete.

## Play

Route: `/games/astra-sentinel`. Free local expedition, no account and no server score submission. WASD/arrows or drag-to-move; automatic target/fire; Space or PHASE DASH for a limited invulnerability dash; P/Escape pauses. Mobile uses a floating drag control and a separate dash button.

Nine gates in three distinct painted environments: Verdant Reliquary, Prism Foundry, Solar Citadel. Guardians at 3/6/9 have different patterns and enrage below half hull. Later stages add ranged enemies, charging lancers, armor and timed impact zones. Enemy health, speed and damage rise by stage. Telegraphs precede shots, charges and impact damage.

Every clear increases frame tier, base damage and maximum hull, repairs part of the hull and changes armor visuals. Eight inter-gate choices offer three currently eligible modules from nine types: damage, multishot, fire rate, orbit blades, chain lightning, plating, dash mobility, piercing and repair. Drones unlock at tiers 3 and 6; final tier 9 is the victory form. Upgrade stats and visuals are connected, not a fake level number.

Fresh expeditions reset power/stage/armor upgrades. Device best and furthest gate persist when browser storage is available. This is intentional roguelite run progression, not permanent account power. Capture mode does not write records. No account identity, national score, invented rankings, paid upgrades, ad placements or external game assets.

## Benchmark, not a clone

- Poncle's official Vampire Survivors description: survival/minimal controls and roguelite growth. https://poncle.games/vampire-survivors
- Archero's developer listing: skill selection/combinations and world progression. https://apps.apple.com/us/app/archero/id1453651052
- Existing LoopJolt Deep Descent source/deployed page reviewed at main `74dc8314fbcb012c49989232a7eae1003a71e90a`.

Astra uses an original armored sentinel, procedural temple art, original enemies/boss names, new rules and original synthesized audio. No trademark/logo/character/art copy. This documentation does not assert trademark clearance for the new name.

## Quality bar and boundaries

Implemented to match the requested reference on distinct regions, readable stage progression, major guardians, depth/atmosphere, original sound and combat effects, responsive UI, failure/retry and input safety. This is a different visual/gameplay style; quality and fun are not objectively proven by passing tests. No retention or performance-lift claim.

No new runtime dependency, CDN, image-generation charge or subscription. Five core page/JS/CSS files are about 67 KB before compression, with cached Canvas2D scenery. The home adds one dedicated LOCAL EXPEDITION invitation, preserving all four existing ranked game cards. The current fixed eight-URL sitemap and ranking contracts remain unchanged. New-page canonical metadata and a crawlable home link are present; indexation is not claimed.

The game does not join the existing server-ranked catalog and does not send acquisition events under an invented game key. National ranking and integration with the stage-4 aggregate collector remain separate follow-up work; current stats are device-local. Existing auth, country policy, scores, game cores, old social drafts and marketing automations are untouched.

## Tests

`node --test vibe-arcade/tests/astra-core.test.cjs vibe-arcade/tests/astra-package.test.cjs`

Core tests include deterministic outcomes, real clears and offered upgrades, monotonic difficulty parameters, score/resource caps, no post-terminal farming, reset semantics, and four seeded completed movement pilots. Four stationary pilots fail; this is a useful regression, not a human-difficulty study.

`astra-browser.cjs` uses an isolated virtual clock to check the original app/core/art together, normal movement/dash inputs, eight actual upgrade choices and all guardians, four responsive widths, pause/resume, capture exclusion and storage. No game-state injection or fake success. The offline pilot is never imported by the live page. Virtual-clock campaign time is not a performance benchmark or human skill record.

`astra-routes.cjs` separately uses native local HTTP navigation with normal wall-clock frames, slash/no-slash URLs, real browser touch events, sound controls and pause. It blocks all writes/external network. `astra-live.cjs` compares exact deployed bytes and checks home/reference/verification URLs using read-only HTTP; it does not claim a human watched live gameplay.

Unchanged-game regression workflows remain in force. Production release requires passing new CI and relevant existing checks. Do not mark a tree object or preview as a live release. Current release state belongs in the deployment checkpoint, not this specification.


## Production control policy — v3

Approved 2026-09-21 after owner playtest: Astra Sentinel production controls are intentionally simplified to **movement only + automatic fire**.

- Desktop: WASD or arrow keys move. P / Escape pauses.
- Mobile: drag in the arena to move.
- There is no dash button, Space dash, dash gauge, dash invulnerability or dash-based upgrade in the public release.
- The former `flux` upgrade ID is retained internally for compatibility but is presented as **VECTOR DRIVE / MOBILITY** and only increases movement speed.
- The wider P2 arena, smaller actor scale, harder enemy progression, three guardians and fixed safe-lane sweep warnings remain.
- Local records use the `astra-v3` namespace because controls changed materially.
- The committed v1 source directory remains rollback material; the canonical clean URL is generated at build time from the approved release builder.
