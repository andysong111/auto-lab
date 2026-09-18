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
