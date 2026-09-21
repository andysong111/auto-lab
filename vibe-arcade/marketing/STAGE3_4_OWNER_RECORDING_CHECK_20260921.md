# Marketing 3-4 — owner recording resolves the first native playback gate

Date: 2026-09-21. This supplements and supersedes the first-Instagram native UNVERIFIED status in STAGE3_EXECUTION_LEDGER_20260921.md. **It does not declare stage 3 complete.**

## Source and privacy
The owner supplied a 129.916667-second 1920x1080, 60-fps OBS desktop recording from a logged-in Chrome session. Source SHA-256: eecdd57b3e88814f58c42e0b369d20b6a7311721f3449b34eda79dc5b0844611. The video, browser chrome, click IDs, private analytics and screenshots are NOT uploaded to this public repository. Detailed evidence remains in the owner-only chat deliverable.

## First-release verification
The visible public URL is the intended /reel/Ddh9RSXDUJH/ and owner @playloopjolt; the caption and actual video match dd_fc01_instagram, not the older Deep Descent post also shown later in the recording.

The first playback begins around recording second 27.6, shows the moving game for approximately 12 seconds, then the declared six-second graphic CTA and a new loop around second 46. Crop, flags, game area and end CTA were inspected. A 30-fps gameplay comparison to the approved Publish_v1 (e5ce32b7b8fa40d4f05ef5a038d593e26e15030ccd8a05c50c5f469a9f2da0ad) has median normalized pixel correlation 0.995824 across 360 samples. This is correlation on a reduced, scaled gameplay region, NOT an original-file or platform-byte equality claim.

A gameplay-only ROI (380x560 at x=510,y=300 in the recording), -50 dB / 0.60 s freezedetect, recording 27.65–39.50 s, produced no freeze events. The intentional end cards are excluded. A complete first cycle, including cards and return to gameplay, was inspected in one-second screen-frame checkpoints. The recording itself is not an exact replacement for Instagram's native decoded-frame statistics.

PCM waveform comparison of the captured gameplay audio against the approved master produced correlation 0.961797; audio timing closely matches the video alignment. This verifies the captured original audio is present, not a claim of subjective human listening or every-device performance.

**First native release gate: PASSED WITH OWNER DESKTOP RECORDING EVIDENCE.** Mobile/in-app UI, all devices and other platforms remain untested. Preserve these evidence limits; do not repeatedly request this already-provided recording or retry the same unauthenticated login wall.

## Profile and playable destination
At approximately 0–15 s, @playloopjolt has a website link and the profile-suggestions control is enabled. At approximately 59–63 s, clicking the actual profile link opens the production home, and the owner then starts and plays Deep Descent without signing in. The destination contains utm_source=ig, utm_medium=social and utm_content=link_in_bio. It is functional but is not proven to be the newer /ig route. The unrelated opaque platform click identifier was deliberately not retained.

Record Instagram profile-link existence and end-to-end arrival as verified. Do not require a cosmetic /ig replacement before continuing. For reporting, group ig and instagram as one channel while retaining the raw fields; label link_in_bio attribution as channel-level, not per-Reel. Do not silently invent an alwayson campaign or backfill a Reel ID into this traffic.

## Exposure observations and next work
The private native insights show distribution to non-followers, not a demonstrated international audience, Google indexing, or a conversion lift. The older and newer Reels have different ages; never compare their cumulative counts as a controlled test. Missing watch-time/click data is null, not zero. The connected analytics response lagged the owner's native snapshot; keep separate observation times/sources.

The user also asked to use recorded evidence to improve SEO/exposure. A bounded build-time search foundation changes the public home card name to Deep Descent (the internal gyro-drop key and legacy entry remain), supplies descriptive home/Deep Descent title/meta/OG/canonical, and includes all four main games plus the three legacy games and home in the sitemap. These are universal built HTML changes, not bot-specific content. No rules, credentials, country policy, score storage or public performance claim changes.

Source HTML remains a template; build-search-metadata.cjs is now the source of truth for its deployed metadata and sitemap. Core Pins/Nova Merge still share the existing query-driven bootstrap: distinct pre-rendered metadata/content for those pages is follow-up work, not claimed completed here. The connected GSC Wizard account listed only AI-Saurus, not LoopJolt. This means LoopJolt search data is unavailable through that connection, NOT proof that no other GSC account/property exists.

Resume the previously authorized conservative rollout from current Metricool state, keeping all 15 older drafts unchanged and preserving per-new-platform requirements. The other 11 prepared candidates are not automatically counted published or validated by this document. No new SNS post is created by this code/evidence checkpoint. The original numbered marketing stage-4 specification remains unresolved; this SEO work responds to the new explicit request without relabeling an unfinished stage 3.

## Official basis
- Descriptive title links: https://developers.google.com/search/docs/appearance/title-link
- JavaScript, metadata and canonical: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Canvas is not text content for search: https://developers.google.com/search/docs/fundamentals/get-started-developers
- Sitemap scope/discovery versus indexation: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
