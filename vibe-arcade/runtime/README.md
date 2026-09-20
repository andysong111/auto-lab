# LoopJolt Platform Runtime v1 — Stage 2-1

A small platform boundary, NOT a shared game engine or UI framework. Only Deep Descent currently uses it. Rules, physics, art, input timing, sound, DOM and local best records remain in the game.

## Files
- `community-adapter.js`: delegates to existing `LoopCommunity` and wraps public board reads. It does not access, copy or persist the Google token. Existing tab-only authentication and profile UI are unchanged.
- `core.js`: config/profile facade, version-checked ranked start, immutable input-only finish snapshots, same-run retry and stale-response isolation. Has no Phaser, DOM, storage, analytics or game-rule dependency.
- `descent/app.js`: retains the existing game behavior and all screen copy. Calls Runtime instead of assembling platform requests itself.

## Contract
```js
const platform = LoopJoltRuntime.create({
  game: rules.GAME, version: rules.VERSION,
  maxTicks: rules.MAX_TICKS, maxInputs: rules.MAX_INPUTS,
  capture,
  adapter: LoopJoltCommunityAdapter.create(LoopCommunity)
});
const config = await platform.boot();
const player = platform.getPlayer(); // public fields only
const attempt = ranked ? await platform.startRanked() : platform.startPractice();
// Game runs its own canonical rules from attempt.seed.
// On pause/hidden tab/timing failure: platform.downgrade().
const result = await platform.submitRun({actions, ticks});
if (platform.isCurrent(result) && result.status === 'verified') {
  // Display the SERVER-returned result.score. Never infer success locally.
}
if (platform.canRetry) await platform.retrySave();
const board = await platform.readBoard('world');
```

Start never falls back silently to ranked. Duplicate in-flight starts/saves coalesce. Finish only sends `runId`, deep-frozen primitive input arrays and `ticks`; claimed score, country and game are not accepted. Retries reuse exactly the saved payload without opening a new run. A new attempt invalidates earlier async outcomes; the caller checks `isCurrent` again after its rank lookup. Permanent auth/version/replay/time errors are not offered an endless retry.

The adapter continues to use the existing server replay/Google JWT validation. Client checks are usability protections, not an anti-cheat security boundary. No server validation is moved into the browser.

## Compatibility and gates
The release baseline is `8e373aa5211cd50c9e109ae7d02ed646d0fba762`. Runtime tests cover 41 cases including the real Community client in a VM with a LOCAL fake transport/session (not a real OAuth login). Existing Descent gameplay tests cover 48-ring completion and UI failure modes.
`tests/runtime-parity.cjs` compares unchanged rules/art/audio/CSS/auth/pinned packages byte-for-byte. It executes identical keyboard inputs against the old and new app, compares state/DOM/request payloads exactly and compares 6 desktop/mobile entry/play/result screenshots. Only up to 8 low-amplitude antialias pixels are tolerated, with max channel change 8/255; no layout/game differences are allowed. Latest local comparison: all 6 had zero changed pixels.

No new production package/dependency, database/Edge migration, OAuth change, paid service, generated asset or social schedule change. No performance savings or faster future game production are claimed as measured yet; proof migration belongs to 2-4. Game Shell and Feel Kit remain outside 2-1.

## Recovery
PR #19 and `CHECKPOINT.md` record the exact stage. Revert this single PR (or restore its preceding Vercel deployment) to restore the previous app; database and saved scores need no rollback. Keep the runtime unused in other games until they are explicitly migrated and tested.
