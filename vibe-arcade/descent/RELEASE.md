# Gyro Drop — Deep Descent · Stage 1

## Scope approved 2026-09-20
One flagship, not another batch of similar games. Owner writes no code. Reuse existing tools; no new subscription, paid art/audio, ad spending or generative-video credits. Keep the simple site and individual/country competition.

## Playable content
48 rings in 12 four-ring sectors, three different environments, maximum 90-second run. Rotate by drag or arrow keys; the drone contacts the visible FRONT edge. Learn drifting rings, two-contact brittle stone and timed shutters. Clean/centered drops charge a three-ordinary-floor burst. Focus pickups slow obstacle motion, NOT the official timer. Region boundaries repair one shield.

### Guardian encounters
- Sky Warden, ring 16: one seal; long opening interval.
- Prism Sentinel, ring 32: two seals; opening moves after the first hit.
- Ember Engine, ring 48: three seals; shorter openings and repeated realignment.
A full burst breaks only one guardian seal and is consumed. These are original timing encounters, not a claim of complex combat-AI bosses. Every seal, gap and hazard follows canonical server-replayed rules.

## Art and interaction
Original code-painted drone and guardian sprite textures, shaded stone shaft and ring surfaces, depth-tracking camera, independent cloud layers, floating sanctuary ruins, a crystal cave and a mechanical furnace. Soft region transitions, bounded fragments, impact squash, seal-break feedback and synthesized sound with an off switch. This is 2.5D projection on Phaser 3.90, not a 3D model pipeline or purchased asset pack. No competitor artwork/source copied.
The game and scoreboard stay simple. Practice/Ranked start choices, separate local/official records, actual save outcomes, retrying the SAME run, visible pause-to-practice downgrade and read-only diagnostics. No fabricated opponents, score changes or rank movement.

## Quality evidence before final CI/deployment
- 18 core tests + 4 adapter compatibility tests: 22 passing locally.
- Keyboard-input complete run traverses all 48 rings and breaks all six seals; no injected score or direct state setter. Multiple seeded courses verified by canonical replay.
- Four viewport widths (360/390/768/1280), practice, mocked authenticated save, start failure, same-run retry, frame discontinuity, hidden-tab downgrade, pause/resume, stale-response isolation, capture guard and full-run completion passed.
- Guardian/region screenshots reviewed from test gameplay; screenshots labelled QA are NOT production-player evidence or ads.
- SQL integration exercised all EIGHT registered game/version pairs: start, lower/upper elapsed-time rejection, successful completion, duplicate retry, v1/v2 isolation and player/country board queries. All synthetic rows and activation changes rolled back. Real baseline remains one profile / two scores (Orbit 392, Skyforge 592).
- Explicit upper wall-time protection added to the OUTERMOST gateway as a follow-up migration. The live nested v3 guard was also verified present; preserve both. Applied registry migration is not rewritten.

## Release safety
New rules are gd-descent-v2. Preserve old v1 rows/URLs and the three previously scheduled social clips. Old advertised Gyro Drop remains playable; current championship uses only one active version. Deploy matching Edge sources before explicit v2 activation, and verify live config, public boards, unauthorized writes and browser rendering. Roll back by deactivating v2/reactivating v1 and restoring the preceding Vercel deployment; no score deletion needed.

## Honest remaining boundaries
A real Google-authenticated v2 run is not fabricated by QA. Verify the first actual user completion separately. User retention, revenue and perceived commercial quality have NOT been demonstrated by tests. Stage 2 reusable-kit expansion and Stage 3 new marketing/measurement are outside this change. No new social posts were created in Stage 1.

## API references
Phaser canvas textures and refresh: https://docs.phaser.io/phaser/concepts/textures
Pinned runtime and existing CI are reused. Production confirmation is recorded in PR #18 after deployment, not assumed here.
