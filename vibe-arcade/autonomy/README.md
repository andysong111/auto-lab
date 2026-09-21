# PlayJolt Autonomous Publishing OS — Phase 1

This additive engine builds **unlisted practice candidates**. It does not register games in the production catalog, change canonical rules, call Supabase, publish social posts, or merge/deploy to production. `AUTO_PRODUCTION_SHIP=false` is a hard Phase 1 boundary.

## Local operation

Node 22+, Python 3 for existing regression tools, and Chromium are required. From `vibe-arcade`:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
cd autonomy
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
cd ..
node autonomy/cli.cjs create --spec autonomy/examples/dummy-spec.json
node autonomy/cli.cjs run GAME-20260921-001 --workspace autonomy/fixtures/dummy
node autonomy/cli.cjs status GAME-20260921-001
```

The fixture demonstrates the contract; it is not a commercially complete game. Do not infer Astra/Descent-level design quality from its mechanical PASS. An arbitrary new game must implement `core.js`, `app.js`, `view/art.js`, `style.css`, `index.html`, `README.md`, the GameKit core/DOM contract, and manifest input probes. The factory supplies trusted `gamekit.js` and immutable `manifest.json`.

`qa <id>` runs through the next QA checkpoint. `repair <id>` resumes a failed/pending repair job. `run <id>` is the complete resumable build → browser QA → bounded repairs → quality gate → RC command. Optional `--rc` adds a GitHub/Vercel adapter. `--root` selects a separate app workspace for commissioning or tests. JSON output and exit code 2 mean REJECTED; exit code 1 means an operational error.

## Adapters

Provide trusted operator configuration with `--config <file>`, with paths resolved from the current working directory:

```json
{
  "workspace": "autonomy/fixtures/dummy",
  "repair_workspaces": ["/absolute/reviewed/revision-1", "/absolute/reviewed/revision-2"],
  "base_ref": "main"
}
```

`WorkspaceBuilder`/`WorkspaceRepair` import reviewed files; they do not execute generated Node code. A provider can implement `build(context)` and `repair(context)` to populate the supplied workspace. Each context has manifest, immutable spec, operationId and repair request. Repeated calls for the same operation ID must produce the same intended result and avoid duplicate paid requests. Provider SDKs/credentials belong outside generated game files and the browser.

`CommandAdapter` accepts `{ "command": { "command": ["/usr/bin/node", "builder.js"], "timeout_ms": 120000 } }` in operator config. It requires Linux `bwrap`, an isolated network/mount/process namespace, and a command available in its mounted runtime or supplied workspace. Only that workspace is writable; no shell interpolation or inherited credentials. If isolation is unavailable it fails closed. No unrestricted shell fallback. This interface is for a trusted workspace command; an external AI service should write a reviewed output workspace or use a separate provider adapter.

## State, evidence and recovery

`schema/game-manifest.schema.json` is validated on every write. `orchestrator/manifest.cjs` owns allowed edges; no ad hoc state strings. Initial build is `v1`; repair 1 produces `v2`, through repair 5 / `v6`. Repairs cannot reset or exceed five attempts. Irreparable results become `REJECTED`; rejected jobs never restart automatically.

Local state: `jobs/<id>/manifest.json`, original `spec.json`. Evidence: `artifacts/<id>/<version>/{build,qa,quality,preview-smoke,rc}.json`, screenshots, `repair-<attempt>.json` and `repair-history.json`. Sources: `games/<id>/<version>/`. All are isolated from existing routes and ignored by normal Git staging. Only explicitly released candidate files enter `factory/<id>` branches. Operator evidence is not copied into the homepage or telemetry.

Writes use temporary-file rename and fsync; one live process owns each job. A dead same-host lock is recovered; a remote-host lock is never stolen. Re-running `run` resumes the recorded state, checks source/policy fingerprints and reuses completed build/QA evidence. A source modified after verification is rejected. Interrupted repairs keep their attempt and operation ID. A policy change invalidates downstream approval. FileStore is single-host; a future DB store needs transactional compare-and-swap/leases. Do not put file state on multiple workers sharing unreliable locks.

## Browser and quality contract

Real Chromium loads each candidate's actual HTML/assets at 390×844, 768×1024, and 1280×800. An isolated origin serves only that game's files. Separate hard gates verify real-clock progression, real keyboard input, CDP touch, state effects, score/progress, an interaction, terminal/restart, pause/resume, hidden/pagehide safety, layout, resource bounds, and zero console/page errors. Virtual time accelerates a later full lifecycle only; it never edits game state/score. Browser processes have a wall-clock deadline and process-group cleanup.

Fresh contexts carry no account/cookies. HTTP mutations, external requests (including GET beacons), WebSockets, service workers, beacons and peer connections are blocked/audited; capture storage writes fail QA. Any attempted production side effect is fatal even when blocked. This is browser commissioning, not a hostile-code security service; run unknown adapters in isolated workers.

`policies/quality-gate.json` separates hard tests from declared/unknown heuristics. Missing evidence fails closed. A PASS only creates an RC. No numeric “fun score”, retention claim, heuristic-only release approval or simulated user KPI exists. Visual completeness, first-five-second clarity and repeatability remain explicitly UNVERIFIED until the supervising team supplies evidence.

## GitHub and Preview

Set an existing appropriately scoped `GITHUB_TOKEN` in the operator environment (never commit it), then `run <id> --config <file> --rc`. The adapter only writes candidate files under `vibe-arcade/autonomy/games/<id>/<version>/`, on exactly `factory/<id>`. It never force-pushes, edits main, auto-merges, registers rankings or changes secrets.

A draft PR is reused on retry. The adapter waits for the required Factory checks and all check-runs to succeed, then finds a successful **Preview** deployment for the exact candidate commit. `PREVIEW_DEPLOYING` is resumable; run again after CI/deployment completes. HTTP smoke uses GET only, verifies every runtime asset byte against local QA source and rejects production aliases or redirects outside the candidate. A protected preview returns an explicit smoke failure; do not disable deployment protection to make a test green. `READY_TO_SHIP` remains a candidate state and does not imply production/design approval.

## Tests

```sh
cd vibe-arcade/autonomy
npm test
npm run test:browser
npm run test:regression
```

See `HANDOFF_WORK_PHASE1_FACTORY.md` for the current actual evidence and PR/Preview. Existing CI is reused; the dedicated Factory workflow adds contracts, real failure/repair/rejection browser scenarios and regression against built Astra V3, Deep Descent, Core Pins, Nova Merge and Orbit Sprint.

## Production enable and rollback

There is intentionally no Phase 1 production activation command. Setting `AUTO_PRODUCTION_SHIP=true` alone cannot ship. The supervising team must add a reviewed production adapter, quality evidence policy, server replay/version registry for any ranked game, real metric eligibility, deployment/rollback criteria and a budgeted worker/provider. Until then all fixtures/candidates remain unlisted and `metrics_eligibility=false`.

Rollback: close the factory PR or stop its worker; production is unaffected. If Phase 1 engine code is later merged, revert that engine PR. No production DB changes or migrations need reversal. Archive local jobs instead of deleting production data. A future namespace can be `loopjolt_factory.{jobs,attempts,qa_runs,repair_runs,releases}` with private grants/RLS; no live migration is required or applied here.
