# World League UI — benchmark, design and implementation record

Date: 2026-09-19. User requirement: country/player competition and readable scoreboards define LoopJolt. No Figma upgrade or other new paid service.

## Research scope and evidence
This is a review of public site structure and published platform requirements, NOT a private architecture, uptime, revenue or security audit. Large-platform mechanics are not evidence that LoopJolt will acquire users or make money. No competitor art, brand or private code is copied.

| Primary source | What the source supports | LoopJolt decision |
| --- | --- | --- |
| https://poki.com/ | Search, category links, directly accessible games; instant browser play without downloads. | Keep one-click game entry and a small searchable four-game grid, not a forced login wall or oversized catalog. |
| https://www.crazygames.com/ | Clear Home/Recently played/New/Popular/Updated/Multiplayer/Leaderboards navigation; leaderboard season section. | Separate League, Games, Rankings, My country and Player card; show actual UTC reset countdown, with no fabricated activity numbers. |
| https://www.crazygames.com/leaderboards | Explicit leaderboard destination separate from browsing games. | Game cards link directly both to play and to the relevant standings. |
| https://docs.crazygames.com/requirements/technical/ | Mobile/desktop/browser usability, performance and loading requirements. | Responsive layouts, lazy/static game previews rather than animated background loops, usable failure states, light client-side filtering. This is a design decision, not a claim that all platform requirements were certified. |
| https://lichess.org/player | Readable discipline-specific ranked player lists. | Game/period/scope are explicit independent controls; ranks, names, real SVG flags and scores stay aligned. Lichess is used as a UX reference, not as proof of an advertising business model. |
| https://lichess.org/tournament | Visible tournament schedule, durations and organized events. | Weekly UTC competition context and explainable reset timing; no false live-multiplayer promise. |

## Product position and visual design
A league that has games, not a random game directory with a hidden leaderboard. Charcoal shell, lime championship accent, restrained mint verified state, actual SVG country flags. Large score typography, consistent spacing, category labels and mobile bottom navigation. No new remote fonts or UI dependency.

Home: real country standings -> player/country context -> four games -> individual standings -> concise instructions. Sparse leaderboard states invite the next participant; they never fabricate opponents.
Rankings: overall/game, period and world/country/player scope; search within displayed top 100; filtered-share URL; current user's highlighted row when present; no invented exact rank for a user outside returned top 100. Profile editing is collapsed for established users and expanded for initial registration.

## Reliability and integration boundaries
- Existing Google Identity client, server OIDC validation, DB schema, scores, country rules and all four canonical games remain unchanged.
- Read-only board calls keep independent loading/error/empty states; controls abort stale requests, use request ordering and offer manual retry. Game entry remains available if standings fail.
- 249 self-hosted SVG flags and neutral/error placeholders retained.
- Home/community now reuse Arcade 3 attribution script; classic-game telemetry remains a separate older implementation. Do not claim fully unified analytics or durable conversion reporting.
- Original advertised game URLs stay intact. `/arcade3` catalog entry redirects to the main game grid; `/arcade3/play` is unchanged.
- No new Figma design was completed: its blank draft remains. The deliverable is actual website code, not an editable Figma file.

## Monetization decisions (not implemented in this release)
First establish repeat use and attributable sessions. Then consider capped ad tests only outside active ranked play, with explicit provider eligibility/consent checks. Never sell score advantages or extra ranked lives. Do not add ads, sponsor logos, fake sponsors or subscription prompts before a real decision. Track contribution after hosting/content cost, not gross ad impressions alone.

## Testing gates
Existing replay/clock/auth-mock tests must stay green. Browser tests should cover 360/390/768/1440 layouts, real decoded local flags, deep-link/filter changes, signed-in mock identity, empty/error/retry, XSS-safe labels, no overflow and preserved game entry links. Mocked authentication is NOT a new real-Google-login validation. Capture actual deployed pages before claiming visual completion.

## Explicitly left for later
Individual game shells and result modals retain their prior layout. Persistent cross-tab login, full history/rank-delta APIs, truly global search beyond returned top 100, durable analytics dashboard, subscriptions/ads and additional games are not part of this UI release. Keep these separate from the home/scoreboard redesign.
