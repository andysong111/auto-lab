# PlayJolt Marketing Rail

An owner-approved game enters this rail immediately for honest marketing preparation. Asset production and public publication are separate gates.

## Asset production

- capture actual gameplay;
- create a 1080x1920 real-gameplay master and platform-safe cover;
- use Higgsfield only for a short intro, transition or atmosphere around the real game;
- add exact brand, CTA, handle and URL deterministically;
- verify full decode, freezes, cover crops, copy and SHA-256 lineage.

## Publication

Public scheduling remains blocked until the same source has an RC release packet, exact-source Preview, live Production URL, scoped owner approval, passing marketing QA, connected social accounts and a verified scheduler-hosted copy. Organic posts use distinct UTM content IDs. Paid ads remain separately disabled.

`queue.json` places Halo Guard V9 on the asset-production rail. It does not claim that the game is released, that a video exists, or that any SNS post has been created.

`.github/workflows/playjolt-marketing-rail.yml` validates the queue and uploads a source-bound status artifact. Its external-publication job is intentionally disabled. A later implementation may enable provider writes only by evaluating the same fail-closed publication contract with fresh credentials and evidence.
