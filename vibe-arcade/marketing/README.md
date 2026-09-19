# LoopJolt Social Render Pipeline

## Rule
Never rely on generative video models for exact brand text.

The `LoopJolt` / `@playloopjolt` name, hook, CTA, URL, scores that must be exact, and legal disclosures are deterministic overlays.

## Generation prompt
Ask the model for:
- gameplay-like motion only
- dark premium arcade visual language
- NO text
- NO logo
- NO username
- NO URL
- NO exact score numbers

Then run `render-social.sh` to add exact copy.

## Output
- 1080x1920
- H.264 / yuv420p
- top hook band
- exact LoopJolt watermark
- bottom CTA band

This prevents variants such as LoopJult / LoopJolt / misspelled handles from entering production.

## Reels / Shorts / TikTok cover QA
Publishing is not complete until the cover has been checked.

Required checks before scheduling:
- first frame must not be white, blank, loading, or transitional
- inspect frames around 0.5s, 1.0s and 1.5s
- use the strongest real-gameplay frame as the cover
- for Instagram Reels, set `videoCoverMilliseconds` or a custom cover image
- keep the game subject near the center so the Instagram profile grid crop still reads
- avoid tiny text; the cover should work even when shown as a small profile tile
- if no frame is strong enough, create a deterministic cover from real gameplay rather than generating fake gameplay

Default fallback: use a verified non-blank gameplay frame around 1.0s, never the first frame automatically.
