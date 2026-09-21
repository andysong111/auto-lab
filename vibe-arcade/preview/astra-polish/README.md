# Astra Sentinel P2 — wider arena / real challenge, PREVIEW ONLY

Owner feedback: the character feels too large for the arena and the entire P1 campaign was cleared first try. This revision changes the candidate's playable geometry and combat, not just its graphics. The previous explicit owner-playtest-before-production gate is unchanged: keep PR #34 DRAFT; do not merge, promote, change main or schedule promotion.

## Geometry and control

Candidate world is 1008×1148 instead of 720×820. The navigable bounds are 1.4 times wider and deeper (1.96 times the area in game units). Actors, projectiles, collision anchors and warnings share the same 1/1.4 rendering transform, so a same-tier character is approximately 28.6% smaller relative to the visible arena. Portraits stay large for readability. This is not a smaller drawing with the old screen-space hitbox. Touch coordinates and joystick radius use the corresponding world transform.

Logical walk speed is 4.4 instead of 3.3 units/tick; after zooming out it is about 4.8% slower on screen, not 33% faster. Dash becomes 12.6 units/tick instead of 9, preserving exactly the previous screen-space reach, duration and invulnerability. P1 Responsive/Direct and High/Low controls remain. No forced knockback or hit-stop.

## Challenge without removing growth

- Charging lancers start at gate 2 instead of gate 4; tanks at gate 4 instead of 5. Ranged volleys and later attacks are more frequent. Enemy HP/speed/damage progression remains monotonic.
- Boss stages have more escort enemies. Guardian HP rises from 720/1850/3800 to 1000/2650/5100; this is only one part of the change.
- Guardians periodically sweep a horizontal or vertical energy wall across the field. A cyan corridor is fixed when the warning begins. Warning lasts 96 ticks (1.6 seconds at 60Hz), does no damage, and never snaps to later player movement. Only one wall is present; ordinary random ground zones are suppressed while a wall is active. The player can use the gap or phase through with the existing dash.
- Shot-direction telegraphs now use the exact same radial/fan definition as the actual attack. Low effects does not hide dangerous geometry.
- Clear repair changes 24→16, clear max hull +6→+4. Green pickup chance .16→.10 and heal 10→8. Living Metal restores up to 40, not full health; adds 8 max hull. No automatic full heal erasing earlier mistakes.
- Multishot extra bolts deal 70%; fire-rate stacking is 14% per level instead of 18%; plating gives +20 hull/10% reduction. Tier growth remains real, with eight choices, three regions, three guardians and evolving equipment/drones through tier 9.

Fresh runs reset power. P2 device records are separated from P1 and production by the preview2 namespace. Default preview seed remains 74021; an optional validated unsigned seed query permits reproducible QA (not a stage unlock). No god mode or injected successful result exists in the live page. New pilot code is confined to tests and is never imported by the candidate.

## Verification and interpretation

The earlier P1 assertion that combat parameters must be unchanged is intentionally superseded by this explicit difficulty-change request. Original production tests/hashes remain unchanged. P2 tests verify real field bounds, speed/dash semantics, exact warning/damage gap, reduced-heal descriptions, caps, determinism, no post-terminal farming and full progression.

Local final results: 52 combined candidate/production contracts passed (16 P2 + 36 original). Six browser groups passed including four widths, an actual normal pointer/dash/choice nine-gate run and mobile choice/storage/paused-FX checks. Native HTTP/wall-clock/touch routes require CI because local URL navigation is administrator-blocked. Do not claim them passed from offline text rendering.

Eight seeds per policy are diagnostic probes, NOT human win rates: stationary 0/8 clears, simple orbit 0/8, old-style reactive movement 0/8; a stronger danger/sweep-aware direction planner 6/8. The latter uses per-tick decisions and is not representative human skill. This supports that normal-input completion is possible and one repetitive strategy no longer trivially wins; it does not prove ideal difficulty, fun, or universal avoidability. Initial failed local full-browser attempts and tuning are not counted as passes. The final browser completion used seed 19, normal pointer inputs and offered choices with a virtual clock; no hull or score injection.

CI artifacts retain the final probes, actual completion state, screenshots, source identity and exact playable assets. Read the latest job state before claiming completion.

## Release boundary

Only preview modules, generators, tests and this note change. Production game/home/SEO/DB/accounts/rankings and old drafts are untouched. No automatic promotion, paid tools or new runtime dependencies. Owner must play P2 and explicitly approve any eventual production release.
