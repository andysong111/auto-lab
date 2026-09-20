# Stage 2-4 proof: Core Pins uses the shared kit

## What was actually reused
The existing five infrastructure source files are byte-identical to release e01093ac350525ea6bf4bf4d635ca71662c0abee: Runtime core, Community adapter, Game Shell, FeelFX and FeelAudio. Core Pins supplies four small game-specific modules (flow, scene, presentation mapping, effect/audio mapping). Deep Descent remains unchanged. No rules logic, 60Hz timing/scoring, game version, stored-best key, home link or server code was changed.

The current `/challengers/play?game=core-pins` path dispatches to a build-generated bundle; every other challenger dispatches to the unchanged legacy `game.js`. Five shared files plus four local modules are concatenated without rewriting them or adding a bundler dependency. There is no runtime chain of nine requests. Build proof checks every original input occurs verbatim in the generated bundle. Reuse is at source level; concatenation duplicates the shared bytes in this second entry point and is not a promise of cross-game browser caching.

## Deliberate functional changes, not a graphics redesign
Core Pins now uses bounded start/finish handling, same-run retry, stale-result isolation and version-checked board reads. Practice/capture cannot post official scores. Active runs cannot be restarted accidentally with a second Start click. Sign-in expiry or invalid replays never produce a fake Verified message. Pause/hidden tabs downgrade a ranked attempt and pause practice; stable resume never restores ranked eligibility.

Small Pause, Sound and Less motion controls, a pause panel, public identity in the result and a conditional Retry save button are added only for Core Pins. Start choices hide while playing; replay retains ranked intent instead of silently reverting to practice. Failed ranked replay returns to visible practice/retry choices. Existing local best key is preserved. Capture suppresses analytics and persistence (the old controller did not guard those two side effects).

The Core Pins drawing method is exactly the old geometry with a state argument. Initial canvas renders match at390/1280. Particle colors/count intent and sound pitch/timbre are retained, but the shared bounded effects use a different transient trajectory and smoothed audio envelope. We do NOT claim pixel/audio-identical transient animations or a newly improved art style. Game rules and scores remain identical.

## Evidence completed locally
- 15 proof/dispatch/build/scope tests: exact route, UTM, missing asset failure, valid bundle, immutable shared sources, unchanged rule version/geometry/key, and deterministic replay on five seeds.
- 23 offline real-Chromium scenarios: four viewports, canonical old/new states and identical input-only finishes, mock authenticated verification, exact same-run retry, rejected start/version, expiry, pause, hidden tab, frame stall, capture isolation, offline/delayed config, stale save, failed replay recovery/Escape, failed board, real keyboard Space on canvas, duplicate start cancellation, emulated touch, resource bounds/audio/disposal and two unchanged legacy games.
- Existing Runtime41 + Feel34 + Descent22 unit tests:97pass. Existing Shell38 DOM tests and real Feel22 browser checks pass.
- Before/after seed7 runs: identical108points, fourticks and four input events at390/1280. This short adversarial run tests equality; it is not evidence of gameplay retention. Initial scene screenshots: zero changed pixels in local comparison.
- No fixture network requests, production score creation or impersonated real Google login. Test browser fixtures use synthetic time and a mock public profile solely for local verification.

## Cost and honest result
Current shared source reused:23,730bytes. Game-specific flow/scene/mappings:16,459bytes, plus780bytes CSS. Original 3-game controller:14,725bytes. Composed bundle:40,430bytes. Gzip estimate for bundle+dispatch+extraCSS:14,754bytes versus5,814bytes for the old controller, approximately8,940bytes extra for this changed portion (unchanged Phaser/rules/flags excluded). These are code compression estimates, not measured CDN billing or actual transfer.

**Total code and cold bytes increased, not decreased.** We gained one shared implementation of five infrastructure responsibilities, bounded resources and recovery, while retaining a different game's design. We have not run a controlled time-to-build experiment and cannot claim 50% less work, lower total source size or a revenue benefit. The original controller also serves two other games and is retained for compatibility, so deleting it to make the numbers look smaller would be misleading.

Decision: proof migration demonstrates compatibility without any shared-module edits. Stop building abstraction here. Use these components for actual differentiated gameplay and measure the next work cycle; remove unused abstractions rather than migrating every old game. Stage3 marketing/retention measurement is separate and was not executed in this PR.

## Release boundary
CI/review/merge and actual Production checks are required after this local report. Final evidence is recorded in PR22; this file alone does not claim deployment. No paid subscriptions, generated/purchased assets, production packages, database/Edge/OAuth edits or SNS schedule changes. Existing hosting/test usage costs still apply. Real Google-account score completion remains a separate check.
