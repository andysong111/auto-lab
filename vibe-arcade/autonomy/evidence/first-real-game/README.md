# Prism Relay commissioning evidence

Authoritative terminal snapshot: `manifest.json` (READY_TO_SHIP v4). `release-review-packet.json` passes with production.authorized=false. Technical commissioning is complete; Astra-level polish and market value are not established.

- `commissioning-summary.json`: original real-worker RC_READY result, four operations and estimated cost.
- `provider-ledger.json`: complete original operation journal, reservations, usage, response IDs and cached AI files. No credentials. Preserve for recovery; never reset it to create more calls. This is an immutable snapshot, not an active worker ledger.
- `source-provenance.json`: all six AI-authored files byte-identical to real-provider output. GameKit/manifest supplied by Factory. No manual game edits.
- `factory/`: all build metadata, failed/passed QA, three repair requests/history, final quality and exact-source Preview smoke.
- `quality-review/`: second isolated Chromium pass, normal touch/keyboard success evidence, entry/midgame/result PNGs and accelerated WebM capture. No state injection or human-performance claim.
- `github-verification.json`: exact RC commit, CI/check results, Vercel metadata and original artifact identities.
- Spec, authorization and worker-config JSON: original intent, gate and approved budget. These snapshots do not enable production.

Final game source is on [RC PR #45](https://github.com/andysong111/auto-lab/pull/45), commit `73dd47cbc50db6825c2fcc9d6a19d60136cd5818`, at `vibe-arcade/autonomy/games/GAME-20260922-110/v4/`. Earlier generated revisions are retained as cached provider files in the ledger. Do not execute candidate JS on the host.

For recovery, restore the authenticated original CI artifact including hidden directories into one dedicated root outside the repository. Verify hashes before overlaying the final manifest and RC/smoke evidence. The approved experiment is complete; restoring evidence does not authorize another generation. Routine workflow reruns cannot re-submit the paid run.

Read `../../HANDOFF_WORK_FIRST_REAL_GAME.md` for quality gaps and rollback. This evidence remains in GitHub after Actions artifacts expire.
