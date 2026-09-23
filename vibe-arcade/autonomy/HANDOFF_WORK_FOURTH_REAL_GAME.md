# Fourth real commissioning: Keywake

Work in progress. This document will be finalized with the terminal disposition and exact evidence.

Base main: `e3203597e414ee258b7816f189eed3f4cff1392b` (tree `6dc88f8c4878e9c2c435931ed8cef7f21f3710bd`). Rollback is that exact main; no production changes are authorized.

One new candidate: **Keywake / GAME-20260923-141**, family `discrete-key-collection-navigation`. Other ideas: Ember Mosaic (linked parity toggles) and Gear Bloom (coupled discrete dials). Selection and reasons: [ideas.json](commissioning/fourth-real-game/ideas.json).

Prism Relay 110, Cloud Cargo 121 and Ribbon Shift 131 remain terminal REJECTED after five repairs. Their sources are not inputs to this candidate. No fifth candidate may be created in this Work.

The immutable [proposal](commissioning/fourth-real-game/proposal.json) includes eleven public-quality prose requirements and the [machine-readable contract](commissioning/fourth-real-game/product-contract.json). Spec Gate, schema and reviewed data approval all pass before any provider call.

Trusted infrastructure authoring is limited to commissioning setup and the reviewed finite DATA model. [design.cjs](commissioning/fourth-real-game/design.cjs) generates JSON from independently specified room topology. It does not load candidate source or run browser QA. The unchanged Generic Product Gate derives BFS paths and checks actual normal keyboard/touch inputs against the model. The model has 47 states per seed, six seeds, stage-entry transition widths 2/3/4 and minimum actions 2/4/6. Entry alternatives have bounded normal-input return paths. Room 3 key order costs six versus eight moves. [Oracle review and hashes](commissioning/fourth-real-game/oracle-review.json) pins both model and contract via the trusted registry. These offline results do not claim candidate browser conformance.

The one-shot workflow uses existing OpenAI Responses `gpt-5.6-terra`, one build and at most five repairs, one concurrent build, operation IDs and durable private ledger. It retains main's stricter **USD 2** estimated ceiling inside the user's USD 3 ceiling. Conservative configured rates are USD 4/M input and USD 18/M output, verified above the official short-context model rates on 2026-09-23 (https://developers.openai.com/api/docs/models/gpt-5.6-terra). Reported usage is recorded; these are estimates, not billing reconciliation.

The unchanged default DockerQA runs Technical QA plus Generic Product QA at 390×844, 768×1024 and 1280×800. The commissioning wrapper logs results only. It does not implement candidate-specific checks. Network-none, read-only, non-root Docker constraints remain in force. Complete provider requests are preserved privately; repeated identical validation failures pause before reservation/submission via provider availability preflight for system review. Quarantined output is never executed.

Candidate source may only come from the Builder/Repair provider. Release candidates remain disabled during commissioning; success stops at RC_READY for exact-source RC transport. Production, main merge, homepage, sitemap, ranking, DB, SNS and ads are unauthorized.
