# Astra Sentinel — P1 owner playtest (NOT APPROVED FOR PRODUCTION)

The user explicitly requested on 2026-09-21: develop the movement/graphics upgrade here, then let them play before deciding whether to deploy. Earlier blanket deployment permissions do NOT apply. Keep the PR a draft, do not merge, enable auto-merge, promote a Vercel deployment, change main, or update the production game without a new explicit approval after this playtest.

Base: main c90e21179cf648383e348c55c99a2c9088bad26f. The candidate is generated at /labs/astra-sentinel only on the review branch/preview. /games/astra-sentinel, the homepage, other games, SEO sitemap, accounts, ranking databases and marketing tasks remain unchanged. This candidate is not linked on the home page. Its HTML is noindex/nofollow/noarchive. Existing verification and canonical source files remain untouched.

## Implemented

- Controlled fixed-tick acceleration: about 94% of requested speed in four simulation ticks, sharper braking (under 1.3 logical units of drift from baseline speed; stop in five ticks), fast direction reversal. Top speed, dash duration/distance/invulnerability and enemy progression values stay the same. Feel changes can affect player difficulty even when combat parameters are unchanged.
- Segmented stepping/shoulder movement, body lean, cloth/wing articulation and muzzle recoil. These affect drawings only. No physical hit knockback, forced camera pan, hit-stop or game-clock slowdown was introduced.
- Redrawn layered armor, helmet optics/jaw, tier-dependent weapon rails, feathered mechanical wings and crown. Device portraits use the same art as gameplay.
- Bounded dash afterimages (7 high / 3 low), hit sparks (64), death rings (20), evolution rings (2), cached glow textures and stronger stage material/edge details. Background additions are baked once, not an expensive per-frame filter.
- Exact next radial shot direction markers for bosses, timed zone arcs, original projectile/ground hit anchors preserved. Effects are drawn before hostile projectiles. Brief edge-only hurt feedback rather than a full-screen flash.
- Short, non-blocking upgrade reveal. Motion-off is visible on mobile, obeys reduced-motion preferences, disables character lean/afterimages/camera shake. High/Low effects are selectable. Main canvas backing scale is capped at 1.5x; no claim of physical-phone frame-rate validation.
- Separate preview records (by movement mode) and fixed seed 74021 for repeatable comparisons. Same full nine-gate game; no god mode, unlocked-stage shortcut or fake successful run. No production scores/accounts or analytics calls.

## Test UI

Open the preview URL ending in /labs/astra-sentinel. The yellow PLAYTEST P1 / NOT LIVE banner identifies the candidate. Movement: Responsive (new) versus Direct (original instantaneous movement, new art). Changing movement restarts the run; Effects High/Low can change during play. The link to the live original opens a separate tab for visual comparison. A new expedition resets upgrades normally; preview records never overwrite live records.

## Build and review

`node vibe-arcade/scripts/build-astra-polish.cjs` creates the isolated page from production files plus the modules here. Exact replacements deliberately fail on source drift rather than silently modifying an unknown base. `npm run build` also emits this page on the preview branch, without changing the production game files. Generated files are disposable; review the generator and modules.

The original arena test suite is reused against the generated candidate with a virtual clock for complete input-driven campaigns, plus a separate native-HTTP/wall-clock route and touch check. Core tests verify motion bounds, unchanged combat parameters, reproducibility and four full seeded playthroughs. Passing a pilot is not a human difficulty study. Browser viewport emulation is not a physical-device benchmark. Tests using fixture clocks or synthetic render states must be labeled accordingly.

Reference for cached drawing/DPR budget: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas . Local implementation measurements, not documentation, determine whether this candidate actually performs acceptably.

Release status: PREVIEW ONLY / OWNER PLAYTEST REQUIRED. No automatic promotion task is installed.
