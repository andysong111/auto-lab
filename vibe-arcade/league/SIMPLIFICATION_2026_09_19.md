# LoopJolt — less interface, more play

User-approved scope: simplify the home and scoreboard shown in the 2026-09-19 screenshots. Do not buy Figma, add a subscription or generate marketing art to achieve this.

## Removed from the primary screen
- Five-item desktop rail and duplicate four-item mobile navigation.
- Oversized three-line uppercase slogan, duplicate hero actions and promotional player strip.
- Search for a catalog of only four games, repeated RANKED labels and duplicate play buttons.
- Second simultaneous leaderboard, onboarding step cards and repeated trust/verification panels.
- Permanent account editor beside the rankings.

## Kept and made direct
- One shared header: Play / Rankings / sign-in or actual image flag + player ID.
- Four single-link game cards with existing game renderers (no altered game mechanics).
- One compact weekly scoreboard, switchable between countries and players.
- Full scoreboard: game, period and two obvious tabs. Country drill-down and top-100 search live under Filter & search.
- Real SVG flags, actual verified rows, empty/error/retry states, request cancellation and own-row highlighting.
- Player profile and existing Google login/save/delete operations in an explicitly opened, keyboard-dismissable native dialog. Existing profile/return-to-game links continue to work.
- Scoring rules stay available under How scoring works; fairness/privacy/age notices are not removed from the account flow.
- Existing advertised legacy game URLs stay live.

## Visual direction
A restrained sports score sheet, not an admin dashboard: flat warm charcoal, one muted lime accent, numbered game entries, strong typographic hierarchy, fine row rules and actual flag images. System fonts only; no external font request, no new paid assets.

## Boundaries
No database changes, account/score mutations, game-rule or token-storage changes. No fabricated rank changes, opponents, country contributions or activity. Simplification is a design hypothesis; reduced bounce/greater replay must be measured, not promised. Individual game shells/result screens remain a separate next task.

## Release gates
Updated browser tests must preserve rankings/filters/URLs, actual-image decoding, error/retry/stale response, safe labels/return URLs, profile editing, mobile navigation and all four existing game identities. Tests use mocks rather than user credentials; no live score is inserted. Production read-only screenshot review required after CI. Final release status is recorded in the PR.
