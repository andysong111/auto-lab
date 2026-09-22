# First real game: Prism Relay

One original real candidate, GAME-20260922-110. This is not the earlier Terra canary fixture. See ideas.json for all three concepts and the qualitative selection, proposal.json for the original implementation brief, spec-gate.json for the passed gate, and run-request.json for the user's bounded paid-call authorization.

The existing Worker, AI adapters, provider operation journal, Factory, five-repair budget, Docker QA and Quality Gate perform the build. No candidate source is manually authored or edited. Only the dedicated commissioning state copy enables intake; repository production policy stays OFF.

System corrections needed before building:

1. Spec Gate now preserves a bounded declarative implementation_contract in the immutable Factory spec. Previously it dropped the entire game-design brief. The Factory already preserves and supplies spec.json; no Factory rewrite is needed.
2. The existing QA runner also saves entry, playing and midgame screenshots alongside its result screenshot. All acceptance checks and fatal policies remain unchanged. The existing Docker adapter exports only these explicitly allowlisted PNG names.

Execution uses the existing GitHub OPENAI_API_KEY secret on an ephemeral Actions Linux/Docker worker. It never prints, exports or places the secret in candidate mounts. A single branch/request-file push triggers the paid job. Workflow reruns and subsequent fresh submissions are blocked; recovery must restore the complete provider ledger from the artifact, including hidden directories, and reuse operation IDs. An ambiguous accepted submission is never retried as a new generation.

Budgets: six calls total (one build plus at most five repairs), one concurrent job, USD 2 total/daily estimated ceiling, 60-minute elapsed budget, 300-second request deadline, 18k output-token cap. Price reservations use conservative Terra long-context USD 4 input / USD 18 output per million tokens, even though this brief is short. No production release, homepage, sitemap, ranking, DB, marketing or second candidate is authorized.

After RC_READY, the existing GitHub/Vercel adapter must publish only the candidate source on factory/GAME-20260922-110, validate the exact commit deployment and perform source-byte Preview smoke before release-packet is generated. A paid-call hold is not a fabricated rejection or PASS. The full resulting handoff will be at autonomy/HANDOFF_WORK_FIRST_REAL_GAME.md.
