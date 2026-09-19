# LoopJolt Challengers v1 — research and release notes

Date: 2026-09-19

## Objective
Create three higher-quality, short-session browser games that:
- work on desktop and mobile;
- produce visually strong real-gameplay footage for Shorts/Reels/TikTok;
- remain deterministic enough for server replay and verified rankings;
- use original names, graphics, rules tuning and code;
- require no new paid asset subscription.

## Benchmarks (mechanics only)
1. Gyro Drop — benchmark: Helix Jump.
   - Borrowed pattern: rotate a structure, find gaps, avoid forbidden sectors, reward consecutive drops.
   - Original implementation: LoopJolt seeded ring layouts, shield damage, three-drop smash state, original graphics and score rules.
2. Core Pins — benchmark: Knife Show / rotating-target precision games.
   - Borrowed pattern: one-tap projectile timing against a rotating target, collision avoidance, escalating stages and boss cadence.
   - Original implementation: energy-core theme, seeded seals, stage speed changes, shield lives, original graphics and score rules.
3. Nova Merge — benchmark: Merge Rot / watermelon-style merge games.
   - Borrowed pattern: drop matching objects, grow them into larger objects, manage limited space and chase chains.
   - Original implementation: seven-column deterministic board, neighbour resonance chains, space limit, original cosmic art and scoring.

No competitor source, images, characters, names, maps or audio are included.

## Rendering / cost
- Phaser 3.90.0 is pinned and self-hosted from npm at build time.
- Gameplay state and scoring stay in a separate pure JavaScript rules module; Phaser only renders and collects inputs.
- Current art is procedural vector art, particles and tweens generated in the browser. No new paid image/video generation is required.
- Existing Vercel, Supabase, GitHub and Google login infrastructure is reused.

## Release gate
New games are not added to the homepage or social schedule until:
1. canonical replay tests pass;
2. server adapter tests pass;
3. desktop/mobile browser smoke passes;
4. live Edge verification and ranked score save are tested;
5. screenshots are reviewed for actual gameplay quality.

Then update the homepage featured games and create content from actual gameplay, with explicit nonblank cover frames.
