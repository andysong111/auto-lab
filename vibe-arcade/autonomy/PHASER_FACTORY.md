# Phaser Factory v1

Phase 1 adds Phaser **4.2.1** as a pinned, factory-owned local visual runtime. There is no CDN dependency and no Phaser Editor subscription required.

## Ownership boundary

- `core.js`: deterministic gameplay state only.
- `PlayJoltGameKit`: input, lifecycle, simulation clock, diagnostics, score/best/result bindings.
- `PlayJoltPhaserKit`: owns the single `Phaser.Game` instance.
- `view/art.js`: candidate-owned Phaser scene visuals only.
- `phaser.js`, `phaserkit.js`, `gamekit.js`, `manifest.json`: factory-owned and protected.

Phaser physics, tweens, particles and cameras may visualize state, but they never decide canonical score, progression, legal actions or terminal outcomes.

## Rollout

1. **Phase 1 — free runtime:** run all Factory regressions on the Phaser-backed fixture and stabilize the shared bridge.
2. **Phase 2 — one bounded candidate:** compare QA pass rate, repairs, provider cost and visual evidence against the Canvas candidates. No Production auto-ship.
3. **Phase 3 — optional editor:** only if Phase 2 shows material benefit, evaluate Phaser Editor/MCP. This is not required by the runtime and is not purchased by this change.
4. **3D lane:** PlayCanvas remains a separate future experiment, not part of the 2D Factory runtime.

The current quality gates and five-repair lifetime budget remain unchanged.
