# LoopJolt Marketing Stage 2-2 — Flag-first Vertical Video System
Date: 2026-09-20

## Goal
Make national competition readable before the viewer understands the game. This stage creates the reusable 9:16 visual system only. No social publishing.

## Canvas / safe area
- Master: 1080 × 1920, 30fps delivery target.
- Hard safe zone: left/right 96px, top 120px, bottom 250px.
- Do not place country score, rank, flag identity or CTA outside the hard safe zone.
- Keep primary game subject inside the middle ~760px width when possible so Reels/TikTok UI cannot cover it.

## Visual hierarchy
1. Real flag image.
2. Country name/code.
3. One competition fact: score, rank, gap or challenge target.
4. Gameplay.
5. Player handle when useful.
6. CTA.

Flags are never emoji. Use the same SVG flag assets as the product.

## System palette
- Background: #0d1516
- Panel: #142224
- Divider: #29403c
- Primary text: #f6f7f2
- Muted text: #9fb1ac
- LoopJolt competition accent: #d8ff5f
- Brand gold: #f0cc7a
These colors frame the competition; they never recolor national flags.

## Type
- Production font target: Montserrat ExtraBold / equivalent bold geometric sans.
- Hook: 64–92px.
- Scores: 54–72px minimum.
- Country labels: 32–42px.
- Secondary copy: 24–30px.
- Never use dense paragraphs inside video.

## Motion timing
### Hook
0.00–0.25s: flags already visible. No fade from blank.
0.25–0.90s: hook locks in.
The viewer should understand "countries are competing" before 1 second.

### Gameplay body
- Cut or meaningful movement every ~0.7–2.0s.
- Do not manufacture constant zoom/shake.
- Use a scoreboard cut only when it contains a real current fact.
- Static deliberate scoreboards may remain up to 0.55s; longer holds require visible animated progress so the freeze gate does not mistake a broken video for design.

### CTA
Last 1.5–2.5s:
- PICK YOUR FLAG / PLAY FOR YOUR FLAG
- PLAY FREE
- URL or LINK IN BIO
Keep gameplay motion behind the CTA when possible.

## Template A — FLAG CHALLENGE
First frame:
- 3–5 flags.
- Central hook: WHICH FLAG CLEARS THIS?
- One target fact, e.g. 48 RINGS.

Body:
- gameplay near miss;
- progress target;
- line: ONE VERIFIED RUN → COUNTRY BOARD.

End:
- REPRESENT YOUR FLAG.

Thumbnail:
- center gameplay subject;
- 3–4 flags;
- maximum 2–4 words: WHICH FLAG? / CLEAR 48?

## Template B — FLAG VS FLAG
Only with genuine board data.

First frame:
- left flag + country;
- right flag + country;
- exact current score values;
- THIS WEEK or other exact period.

Body:
- relevant gameplay action;
- return to exact gap.

End:
- CHANGE THE BOARD.

Thumbnail:
- two flags;
- VS;
- one exact score/gap fact only.

## Template C — WORLD BOARD
Only with >=3 genuine country rows.

First frame:
- Top 3–5 flags with rank numbers.

Body:
- gameplay;
- return to board;
- highlight a real close gap/new entrant if one exists.

End:
- CLIMB FOR YOUR FLAG.

Thumbnail:
- #1/#2/#3 + three flags;
- WORLD BOARD.

## Renderer
Implemented in `marketing/flag-video-template.js`.

Input JSON selects:
- mode: challenge | vs | world;
- country codes;
- labels;
- exact scores/ranks when required;
- hook/progress/CTA copy.

Outputs:
- `overlay.svg` at 1080×1920;
- `thumbnail.svg` at 1080×1920.

The renderer deliberately refuses:
- invalid country codes;
- VS mode without both real score values;
- WORLD BOARD with fewer than three rows.

It never invents ranking data.

## Example JSON
```json
{
  "mode": "challenge",
  "flags": [
    {"country":"KR","label":"KOREA"},
    {"country":"US","label":"USA"},
    {"country":"JP","label":"JAPAN"},
    {"country":"DE","label":"GERMANY"}
  ],
  "title":"WHICH FLAG CLEARS THIS?",
  "progress":"48 RINGS",
  "cta":"REPRESENT YOUR FLAG"
}
```

## Publishing boundary
This template is not permission to publish. A rendered MP4 must still pass:
- full decode;
- full freeze scan;
- start/25%/50%/75%/end inspection;
- full 1x playback;
- cover QA;
before Metricool scheduling.

## Next bounded task
Stage 2-3: map Deep Descent, Core Pins and Nova Merge into three concrete scripts using this visual system. Still no publication until each final media file passes the integrity gate.
