# Stage 2-4 — Core Pins proof migration

User approved next bounded stage2026-09-20. Baseline main:e01093ac350525ea6bf4bf4d635ca71662c0abee. Branch:refactor/core-pins-proof-2-4. PR22.

## Current checkpoint: implemented and locally tested; not yet a deployment claim
Core Pins alone reuses all five existing Runtime/Shell/Feel source modules unchanged. New per-game app/scene/UI/feedback mappings. cp-phaser-v1 canonical rules, original geometry, URL and stored-best key preserved. Conditional entry dispatcher, plain build-time concatenation to avoid nine serial script downloads, no new packages.

Local evidence:proof15tests, browser23scenarios including before/after canonical input-only replay, existing97unit tests, Shell38 and Feel22browser checks. Initial canvas pairs390/1280 have zero changed pixels. See PROOF.md for explicit UI/recovery changes and honest code/transfer overhead. Do not advertise reduction in source size or50% time savings; neither was demonstrated.

## Finish gates
Review findings, all required CI, expected-SHA merge, VercelREADY, exact committed/built asset verification, actual guest keyboard/touch/pause/sound/replay, readonly boards and unchanged legacy routes. No actual Google-user identity or production-score test writes. Add final checkpoint comment to PR22.

## Scope boundary / resume
No other-game migration or gameplay redesign; no DB/Edge/OAuth, paid tools/assets/dependencies, ads or SNS changes. Stage3 is not part of this change. Stop after2-4; shared infrastructure work is complete enough for this proof. Rollback by reverting PR22 or restoring preceding Vercel deployment; no data rollback.
