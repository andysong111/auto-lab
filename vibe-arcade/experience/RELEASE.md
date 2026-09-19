# Game experience v2 — 2026-09-19

Scope: continue the approved simple Play / Rankings design inside all four current games. No additional paid services or Figma upgrade.

- One focused game column. Instructions and nonessential links collapse below the game.
- Main button says Play practice or Play ranked before it starts. Signed-in users may explicitly choose practice.
- Failed ranked initialization never silently starts practice; the player chooses what to do next.
- Google/player setup links carry a validated, same-origin returnTo back to the exact game. Successful explicit sign-in/profile save returns there; no token is put in URLs.
- Device best and this week's verified best are separate. The latter is fetched from the existing top-100 endpoint: outside that list is labeled, never reported as zero or as no record.
- Results prioritize actual score, save status and replay. Secondary links go to this game ranking and the next game.
- Saved results can show current weekly world/country positions and the nearest higher returned score. No historical rank deltas or exact country contribution gains are invented.
- Unconfirmed saves can retry the exact same immutable run payload within its validity window. One request at a time; a new attempt invalidates older UI callbacks. Pending save is never presented as confirmed. No offline submission queue or persistent replay storage is added.
- Existing Arcade ranked clock guard stays intact and is also used by Orbit Sprint; pausing, hiding the tab or unstable frames makes that attempt practice-only. Core game scoring, assets, versions and server replay functions are unchanged.
- Keyboard activation of menus/start buttons does not inject game input. Control buttons accept explicit keyboard actions.

## Verification boundary
Canonical test suite: 43 rule/clock tests. Existing three-game mocked replay tests remain. Additional browser tests cover four-game responsive entry, practice, expired login, Orbit replay, same-run retry and stale result handling. Mock records are QA fixtures only, never inserted in production.
A genuinely new Google sign-in and production ranked run must not be claimed based on mocks or read-only screenshot checks.

## Remaining separate work
Persistent-login security, historical ranking snapshots/deltas, full-population personal-rank lookup, durable unified analytics, and new marketing content are not implemented by this UI slice. Capture mode for Arcade remains practice-only with no score/telemetry submissions.
