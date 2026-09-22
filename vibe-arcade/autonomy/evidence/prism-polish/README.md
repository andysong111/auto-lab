# Persistent Prism Relay polish evidence

**REJECTED at v6 / 5 of 5 lifetime repairs. Production unauthorized.** See [complete handoff](../../HANDOFF_WORK_PRISM_RELAY_POLISH.md).

- `manifest.json`: exact final Factory state, including historical v4 RC fields. Do not mistake its predecessor commit for a v6 RC; no v6 Preview was published.
- `commissioning-summary.json`, `provider-ledger.json`: all six actual provider operations, cached source, reported usage and estimated cost; no secret values.
- `polish-authorization.json`: one explicit bounded follow-up window, original lifetime accounting preserved.
- `polish-starting-*`: preceding READY manifest/history retained verbatim.
- `factory/v4`: newly measured baseline failures; `v5`: first AI polish and its impossible-board failure; `v6`: AI core repair and final tests/capture.
- `factory/repair-4.json`, `repair-5.json`, `repair-history.json`: original Factory-generated requests and attempt history.
- `difficulty.json`: six seeds, exact shortest routes/rotation costs, normal-input completion.
- `source/v5`, `source/v6`: exact source bytes with `.txt` appended for non-executable GitHub review. These are not hand-authored patches or public game routes.
- `source-provenance.json`: every candidate file equals a real provider response; Factory owns GameKit/manifest.
- `release-review-packet.json`: failed release packet, production.authorized=false.
- `qa-audit`: corrected scheduled-frequency measurement and independent local-practice persistence on unchanged v6. Original reports/state are never overwritten.

Original paid execution: [35719738363](https://github.com/andysong111/auto-lab/actions/runs/35719738363), source commit 4930ea643ee661204153fde0d93be0f57801a8a1. Workflow success means the bounded run safely reached REJECTED, not that game QA passed. The complete original Actions ZIP expires after 30 days; this evidence remains in Git.

No further provider calls or automatic retries are authorized by these files. Preserve operation IDs and terminal rejection; do not restart from the old four-call snapshot.
