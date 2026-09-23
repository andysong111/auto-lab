# Commercial Polish Gate v1

This trusted suite runs after Technical and Generic Product QA and before the Quality Gate. It supplies presentation evidence, not a claim of fun or aesthetic equivalence to a commercial game. No generated candidate code runs on the host.

## Commissioning a new candidate

1. Author and review the existing data-only product oracle. Keep all real keyboard/touch input mappings and state projections accurate.
2. Declare `commercial_contract` with schema `schema/commercial-polish-contract.schema.json`. Use oracle node IDs for important decision pairs, action feedback and three increasing stage checkpoints. Regions are normalized within one visible DOM/canvas selector. Declare every core action and every decision-critical visual distinction; a reviewer must assess coverage, not merely schema validity.
3. Review the marker meaning and crop locations independently of the candidate. Add a trusted registry entry in `qa/commercial/reviewed/registry.json`, with scope `candidate`, reviewer, rationale, and exact `hash(contract)` / `hash(product_contract)` values using `orchestrator/files.cjs`. Any change invalidates that approval. Fixture approvals cannot approve public candidates.
4. Run the existing isolated worker. Before reserving any provider call it reviews both contracts. The candidate receives declarations and concrete repair feedback, never authority to modify QA, thresholds or review registries.
5. Review the resulting exact preview separately. Machine PASS never changes `production.authorized` or merges a branch.

The current registry deliberately contains only the infrastructure fixture. Rejected historical games are not migration targets. Missing commercial evidence is UNVERIFIED and blocks RC/release packets without modifying terminal manifests.

## Evidence and hard checks

- Actual Chromium PNG regions are sampled at 64×64. A decision distinction requires at least 40% unmasked pixels, mean normalized RGB delta ≥0.035, and changed-pixel fraction ≥0.08 (each changed pixel exceeds 0.08 delta). Structural delta is recorded diagnostically. Text masks cover DOM text ranges and recorded Canvas 2D text; numeric-only changes do not qualify as visual progression.
- Core action probes use a before frame, two intermediate frames, and settled frame. Normal motion must differ between intermediates and from settled output; reduced motion may use a static visible response. Cross-check each player transition against the reviewed finite state graph.
- Three stage captures must show non-text progression. The result region must differ at actual success and failure; title, score, best and replay use the existing product selectors/state paths.
- Important foreground/background regions require local luminance separation ≥1.8. This is a scene heuristic, not a WCAG contrast claim. Gameplay area on 390×844 must occupy ≥22% of the viewport. Visible text density is bounded. Existing Product readability checks still apply.
- Required audio: trusted input before AudioContext creation/resume/start; actual destination waveform energy after primary, progress, final success and failure; mute including an active sound; pause and actual native pagehide cleanup; at most two contexts and eight simultaneous voices. Local assets decoded through WebAudio are supported. Intentional silence requires a reviewed exception.
- A real-clock sample guards frame gaps ≥400ms, runaway DOM/entity counts and resource bounds. These are Docker diagnostic thresholds, never real-phone FPS measurements.
- Seven required evidence phases: entry, early, mid, late, success, failure and gameplay video. Files carry SHA256 hashes, source identity, contract and policy bindings.

During navigation, AudioContext shutdown completion can be asynchronous and the old document is destroyed. The audit records delegated native suspend/close calls during the actual pagehide event, with later resumes removing shutdown coverage. Paused state is checked after settlement. Per the [Web Audio specification](https://www.w3.org/TR/webaudio/#dom-audiocontext-suspend), an analyser retains its last data while suspended; the audit preserves raw samples but counts audible energy only when the native context is running. A mere declared diagnostic flag is never accepted as audio evidence.

`VisualReviewAdapter` receives immutable evidence metadata/checks/contract. A future vision implementation must transport verified media bytes, verify current provider capability, retain operation/cost accounting, return structured evidence-bound issues, and cannot override hard failures. The shipped `MachineCorroboration` records critical measured issues and labels aesthetic judgment UNVERIFIED. No paid provider is configured here.

## Tests

```
npm run test:commercial
# Build and pin the reviewed Docker image using the existing isolation workflow.
FACTORY_QA_IMAGE=sha256:... npm run test:commercial:docker
```

Nine infrastructure fixtures isolate missing topology, missing transitions, flat progression, weak results, hierarchy, audio leakage, text density and multiple simultaneous defects. The original Generic Product fixture core/oracle is reused unchanged; no new game is commissioned. The archived grid-edge comparator is a separate read-only diagnostic and cannot produce Factory PASS or execute historical candidate source.
