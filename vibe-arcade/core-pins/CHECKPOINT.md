# Stage 2-4 — Core Pins proof migration

Owner requested the next bounded stage on 2026-09-20. Baseline main: e01093ac350525ea6bf4bf4d635ca71662c0abee. Branch: refactor/core-pins-proof-2-4.

## Scope
Prove existing Runtime + Game Shell + Feel Kit can serve a second game WITHOUT modifying those shared modules. Core Pins only. Keep its canonical cp-phaser-v1 rules, scores, drawing geometry, click/Space mechanics, current URL and stored best-score key. Other games retain legacy controller and source. No DB/Edge/OAuth changes, subscriptions, dependency upgrades, asset purchases/generation or social schedule changes.

Route only game=core-pins to the new adapters; test legacy Gyro/Nova paths. Preserve original core scene art; small functional pause/sound/reduced-motion/retry controls are allowed and documented, not a visual redesign. Shared resource limits may change transient particle trajectories or note envelopes, not rules/time/score. Never claim pixel-identical sound/FX if not measured.

## Work / gates
1. Extract a Core Pins scene and small UI/feedback adapters. Delegate all platform start/finish/retry/board operations to unchanged Runtime, common DOM roles to unchanged Shell, effect/audio lifecycle to unchanged Feel Kit.
2. Canonical replay/duration/input parity, fresh-user/config/offline/expiry/race/retry/hidden/capture tests, real Phaser and emulated mobile touch; protect existing games and Deep Descent.
3. Record actual reuse counts, code/transfer overhead and adapter cost. Do not claim 50% faster development or less total code without evidence.
4. Review/CI, expected-SHA merge, Production asset/guest verification and checkpoint comment. Tests never create real-user scores. Real Google-account E2E is separate.

Initial checkpoint only; implementation and deployment are NOT complete yet. Stop at 2-4. Rollback: revert this PR or restore previous Vercel deployment; no data rollback needed.
