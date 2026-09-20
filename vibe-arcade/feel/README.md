# LoopJolt Feel Kit · 2-3

Two small presentation modules, no new production package. Only Deep Descent is integrated.

## Boundaries
- `phaser-fx.js`: transient sprite budget/TTL, floating text, owned notification/pulse tweens, capped camera shake, reduced-motion gate, reset/shutdown cleanup.
- `audio.js`: lazy owned WebAudio context, original synthesized note/sequence playback, voice cap, on/off race handling, immediate voice cancellation and disposal.
- `descent/feel.js`: the game's original message/color/texture/position/event mapping. Another game supplies another adapter, not another copy of the whole engine.
- `descent/audio.js`: same original sound recipes/melody; voice/context plumbing delegates to the kit.
- Canonical input/physics/time/score stay in the game. Runtime and Shell stay unchanged. No hit-stop that pauses official simulation. No invented effects or sound choice that changes rankings.

## Small example for a different game (not a production migration)
```js
const fx = LoopJoltFeelFX.create(scene, { reduced: () => settings.lessMotion, maxParticles: 50 });
// Called AFTER a rules event, never to decide whether a hit/merge happened.
fx.burst({ x: 120, y: 200, texture: 'my-puzzle-star', tint: 0xffd166, count: 12 });
fx.floatText({ x: 130, y: 180, text: '+150', style: { fontSize: '20px' } });
// The scene update passes render delta; there is no second rAF/game timer.
fx.update(deltaMs);
fx.clear(); // new run: release transient sprites and owned tweens, not other owners' objects
fx.destroy(); // idempotent; also wired to scene shutdown/destroy

const audio = LoopJoltFeelAudio.create({ volume: 0.13, maxVoices: 16 });
await audio.enable(true); // call from a user gesture; default is silent/uninitialized
// freq Hz, seconds, oscillator type, gain, delay seconds, optional end frequency
const played = audio.note(523, 0.22, 'sine', 0.26);
await audio.enable(false); // mute immediately, stop queued voices, suspend hardware
await audio.destroy(); // disconnect nodes and close owned context
```

## Recovery and accessibility
Particles never exceed the configured budget (hard cap200); floaters have a separate cap. Audio has at most32 voices (Deep Descent16), including notes scheduled in the future. No particle textures, music, external image requests or commercial libraries are downloaded by the kit.

New-run/reset cancels old fragments, floating numbers and owned pulse/notice tweens. It does not kill all scene tweens or camera FX owned elsewhere. Camera shake self-expires within200ms, skips an already-running shake, and is disabled in reduced motion. Reduced motion also reduces fragment count and suppresses scale pulses; changing it mid-pulse settles that pulse. It is not a promise of a completely motion-free game.

Sound-off and pause stop/disconnect old queued cues rather than replaying them on resume. Rapid on/off completions cannot unmute a newer off request. Reset clears old voices without changing the preference. Missing/blocked audio remains silent instead of breaking play. The application owns storage/UI preferences and page lifetime.

## Evidence and limits
Run `node --test vibe-arcade/tests/feel-core.test.cjs`. Browser tests use real pinned Phaser and Web Audio in local fixtures; no production score writes. Before/after parity is a one-time extraction proof with an explicit baseline, not a permanent ban on future graphics improvements. Existing Descent and platform tests remain required.

This is reuse and reliability work, not a new graphics release. Second-game integration and measured time savings are Stage2-4. No new social schedules, subscriptions, DB/Edge/OAuth changes or production dependency changes.

References checked: https://docs.phaser.io/phaser/concepts/scenes ; https://docs.phaser.io/phaser/concepts/tweens ; https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume ; https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend ; https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close . Pinned Phaser3.90 runtime is tested, not upgraded to the latest docs version.
