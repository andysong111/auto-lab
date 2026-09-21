# Phase 1 commissioning evidence

These are actual local Chromium and CLI results, not generated evaluations. `summary.json` maps every scenario to its terminal state. The intentionally failing scenarios are successful tests of rejection behavior; their `qa.json` correctly says `passed: false`.

- `browser/repaired/v1/qa.json` → `browser/repaired/v2/qa.json`, plus repair history: frozen game repaired through a reviewed workspace, then all three browser sizes pass.
- `browser/irreparable/`: six failed QA runs, five recorded repairs, terminal REJECTED at v6.
- Other browser directories: missing asset, keyboard/touch failures, resource runaway, blocked external POST, infinite-loop deadline and successful lifecycle.
- `cli.json`: real create → run → repeated run → status; the repeat preserves revision and does not repeat QA/build.
- `production-regression.json`: all six production browser suites and 283 canonical contracts pass; protected source fingerprints before/after are identical.
- `ci-implementation.json`: all implementation-commit GitHub check runs succeeded or were intentionally skipped. The existing `live` job is skipped by its own policy; no production account/score test was enabled.
- `release/`: real isolated PR #39 / exact-commit Vercel Preview / GET byte-identity smoke / resulting READY_TO_SHIP manifest. GitHub provisioning used the connected GitHub transport; the unmodified orchestrator and GitHubVercelAdapter HTTP smoke consumed verified commit/deployment metadata. REST mutation/resumption behavior is additionally covered by `tests/rc.test.cjs`.

Screenshots referenced by local QA JSON are preserved in the `factory-browser-evidence` GitHub Actions artifact, rather than committed as duplicate binaries. Production screenshots/logs are in `factory-production-regression`. Follow the check URLs in the CI records to the workflow artifacts. Full state contains no production credentials. Temporary Preview access cookies/tokens are deliberately absent.

The current PR's checks also run on the final documentation/evidence commit. Their live status is visible on PR #38; the immutable implementation evidence is pinned to the code commit instead of attempting a self-referential final commit hash.
