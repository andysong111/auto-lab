# Gyro Drop — Deep Descent v2

## User-approved scope (2026-09-20)
Focus on one flagship, not three similar games. Keep owner code work at zero, do not buy subscriptions/assets, keep actual gameplay suitable for later short-form capture.

## Implemented
- 48 rings, 12 sectors, three themed worlds and guardian gates; 90-second maximum run.
- Stone, independently drifting rings, two-contact brittle floors and timed laser/guardian shutters.
- Perfect-drop scoring, earned three-floor burst, focus crystals (slower obstacle motion, not slower score timer), one shield repair at region boundaries.
- One canonical contact angle (900/3600) shared by rendering and score rules. Exact gap boundaries in visual geometry.
- Original code-painted sprite textures: glazed drone, cylindrical stone shaft, shards, light sprites, layered region skies/clouds. 2.5D projection, not a claim of a 3D engine or commissioned art.
- Phaser rendering with bounded particles/tweens, parallax, fall tracking, visible hazard feedback; reduced-motion control.
- Original synthesized sound effects and a quiet rhythmic backing; sound toggle. No paid sound library.
- Practice vs ranked modes, current-version weekly official score, actual failure reasons, guarded asynchronous save/retry results, optional login return to game.

## Safety and preservation
- Rules are `gd-descent-v2`, separate from `gd-phaser-v1`. Old score rows and old advertised game URLs are preserved. Only one version of Gyro Drop contributes to current championship standings after activation.
- Edge adapter continues to accept server-owned in-flight v1 runs. A v1 claimed score cannot become a v2 score.
- Score verification replays bounded ordered inputs. No claimed score/game/country is trusted.
- Ranked frame stalls or pausing downgrade to practice; tab hiding pauses play. These checks do not make the game bot-proof. No prizes.
- No new paid plan/project, external image CDN, video generation job or social post changes.

## Verified locally before PR update
- 14 deterministic rules tests; complete 48-ring runs across five seeds.
- 4 adapter compatibility tests, including v1 compatibility and claimed-score rejection.
- Browser tests with mocked identity/storage and real gameplay: 360/390/768/1280px layouts, practice and ranked submission, start failure, save retry with same run ID, frame downgrade, pause/resume, late response isolation, capture guard and complete 48-ring keyboard-input playthrough.
- Mocked browser identity is NOT a real Google-account E2E. QA records never reach production.

## Remaining release gates
GitHub CI, rolled-back database integration, backwards-compatible Edge deployment, production route/API/render checks, then explicit v2 activation. A real user's Google-authenticated v2 finish still requires an actual user run; never claim it from mocked tests.

## Reference APIs used
Phaser 3 texture generation/canvas texture refresh and camera effects were checked against official documentation: https://docs.phaser.io/phaser/concepts/textures and https://docs.phaser.io/api-documentation/3.90.0/class/cameras-scene2d-effects-shake . Existing pinned Phaser 3.90.0 is reused.
