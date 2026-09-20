# Stage 2-2 Game Shell — bounded change

Owner requested 2-2 after all four Stage 2 decisions were approved. Baseline main: b278caafd1e9f56f51422cdf5d6ccceaaaef7e01 (2-1 deployed, PR19).

## Scope
Deep Descent only. Extract reusable DOM presentation for entry/Practice/Ranked, HUD bindings, pause/resume, result/save status, identity and common button actions. Keep game-specific copy/metrics in a small adapter. Reuse existing static markup and CSS; no redesign, new game, physics or art work. Shell must never authenticate, fetch a board, infer save success, change input timing or own score rules. Runtime 2-1 still owns platform requests; the game owns gameplay and timing.

## Forbidden in this PR
No other game migration, Runtime/auth rewrite, DB/Edge/OAuth change, dependency/subscription, score/profile writes, generated assets or SNS schedule changes. No 2-3 Feel Kit work.

## Gates
- Core presentation tests: missing/optional slots, disabled actions, text escaping, independent mounts, listener disposal, native dialog dismissal and replay races.
- Existing Runtime41, Descent22 and browser suites; complete 48-ring course.
- Before/after baseline DOM/state/request and desktop/mobile screenshots; canonical rules, art/audio/CSS/runtime byte-identical.
- Reversible merge only after CI/review; verify live assets and guest play with analytics suppressed and no score writes.

Current checkpoint: branch opened; implementing and testing locally. Not deployed.
Resume from this file + PR discussion, not all prior chat. Stop after 2-2. Rollback is PR revert/previous Vercel deployment, no DB rollback.
