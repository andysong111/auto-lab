# LoopJolt Marketing Stage 2-2 — Flag-first Vertical Video System
Date: 2026-09-20

## Objective
Create one reusable 9:16 visual system that makes country competition instantly legible before the viewer understands the game.

This stage designs and implements the reusable overlay/data contract only. No new social post is published here.

## Master canvas
- Canvas: 1080 x 1920.
- Gameplay safe frame: x=90..990, y=300..1540.
- Top competition zone: y=70..300.
- Bottom CTA zone: y=1540..1840.
- Absolute safety margin: 60 px left/right, 70 px top, 80 px bottom.
- Keep essential text away from the bottom 250 px because social-app controls can cover it.
- Gameplay must remain visible for at least 65% of the frame area.

## Typography
Use a heavy geometric sans for competitive facts and a lighter sans for supporting labels.
Preferred production fonts already available in the render environment:
- Montserrat ExtraBold — hooks, country score, rank.
- Metropolis — labels, CTA, period.

Type scale:
- Hero hook: 72–92 px.
- Country code/name: 42–54 px.
- Score/rank: 64–88 px.
- Small period/status: 24–30 px.
- CTA: 34–44 px.
- Disclosure: 18–22 px.

Maximum:
- 2 lines for a hero hook.
- 5 words per hero line where possible.
- 1 numerical fact per shot.

## Color
- Background system: near-black / charcoal.
- LoopJolt accent: warm gold/lime for system information only.
- Flags keep their true colors and must never be recolored.
- Country cards use neutral dark backing so national flags remain visually dominant.
- Do not assign moral/value colors to countries (e.g. green=good, red=bad).

## Flag rules
- Production uses real flag image assets, never emoji flags.
- Minimum displayed flag width in a 1080x1920 video: 120 px for hero flags.
- Small scoreboard flags: minimum 72 px.
- Preserve aspect ratio; use a subtle neutral border for white-heavy flags.
- Always pair a flag with country code/name when score/rank appears.
- Never show a flag next to a score that was not sourced from the matching current leaderboard row.

# Template A — FLAG CHALLENGE

## Purpose
Acquisition/default format while real country participation is sparse.

## First 1 second
Top zone:
[FLAG] [FLAG] [FLAG] [FLAG]
WHICH FLAG CLEARS THIS?

Gameplay already moving underneath — no intro card before motion.

## Layout
- 3–5 hero flags arranged in one horizontal row or shallow arc.
- No scores beside flags.
- Center gameplay subject remains unobstructed.
- Challenge fact sits directly below flags:
  48 RINGS
  BOSS 2 / 3
  ONE SHIELD LEFT
  etc.

## Motion timing
0.00–0.25s: flags snap/fade into place while gameplay is already moving.
0.25–1.00s: hook locks.
1.00–5.00s: flags reduce to a compact top strip; gameplay gets full attention.
5.00–10.00s: one progress fact appears.
10.00–15.00s: success/failure; then identity statement.
15.00–18.00s: CTA.

Allowed CTA:
PICK YOUR FLAG
PLAY RANKED
YOUR VERIFIED SCORE COUNTS

Never show a fictional winner.

# Template B — FLAG VS FLAG

## Data requirement
Exactly two genuine country rows from the same game, period and leaderboard snapshot.

## First frame
Left 46%:
[FLAG A]
COUNTRY A
8,420

Center 8%:
VS

Right 46%:
[FLAG B]
COUNTRY B
8,310

Top micro-label:
THIS WEEK

Bottom fact:
110 POINTS APART

Only the one most meaningful numerical fact is shown.

## Motion
0.00–0.40s: split flags enter from edges.
0.40–1.50s: exact gap settles.
1.50–6.00s: gameplay.
6.00–9.00s: compact matchup strip returns.
9.00–14.00s: CTA: PLAY FOR YOUR FLAG / CHANGE THE BOARD.

## Rules
- Score values and period must come from the same timestamped snapshot.
- Do not animate the score changing unless actual time-series data supports the change.
- Do not write LEADS / TAKES #1 unless actual ordering supports it.
- No aggressive geopolitical or nationality-insult framing.

# Template C — WORLD BOARD

## Data requirement
At least 3 genuine current-period country rows.

## First frame
WORLD BOARD
THIS WEEK

#1 [FLAG] COUNTRY    SCORE
#2 [FLAG] COUNTRY    SCORE
#3 [FLAG] COUNTRY    SCORE

Optional #4/#5 only if still readable.

## Motion
0.00–1.50s: board appears with actual order.
1.50–7.00s: strongest gameplay segment.
7.00–11.00s: board returns.
11.00–15.00s: factual gap / reset timer if available.
15.00–18.00s: PLAY FOR YOUR FLAG.

## Weekly serialization
- Reset: NEW WEEK. BOARD RESET.
- Midweek: TOP FLAGS SO FAR.
- Final day: 24H LEFT only if actual reset timing is confirmed.
- Closed period: LAST WEEK'S FINAL BOARD only after close.

# Thumbnail layouts

## Thumbnail 1 — Challenge
- 3–4 hero flags at top.
- Central gameplay danger moment.
- Text: WHICH FLAG? or CLEAR 48?
- No score table.

## Thumbnail 2 — VS
- Flag A on left, Flag B on right.
- Single central VS.
- One real numeric fact: score gap OR current rank, not both.

## Thumbnail 3 — World Board
- #1/#2/#3 with three large flag images.
- WORLD BOARD.
- No more than three scores on cover.

# Safe mobile grid crop
Instagram profile grid and other surfaces can crop vertical content.
Critical thumbnail information must fit inside the centered 864x1080 region:
- horizontal critical bounds x=108..972.
- vertical critical bounds y=420..1500.
Flags and hook must still read in that crop.

# Accessibility/readability
- High contrast text on an opaque/blurred dark plate when gameplay is visually busy.
- Do not rely on flag color alone; always include country code/name with data.
- Minimum 24 px supporting text.
- Avoid fast flashing.
- Reduced-motion render variant may use fades instead of slides/scales.

# Data contract
Every render request uses the JSON contract in flag-template.tokens.json plus factual payload fields.

Required by format:
FLAG_CHALLENGE:
- game
- hook
- flags: 3–5 valid country codes
- no fabricated score fields required

FLAG_VS_FLAG:
- game
- period
- snapshotAt
- exactly 2 countries
- each has code, name, score
- optional rank
- derived gap must equal the real score difference

WORLD_BOARD:
- game
- period
- snapshotAt
- 3–5 ordered countries
- each has code, name, score, rank
- ranks must be unique and ascending

# Production media gate
A correct overlay is not enough.
Before scheduling:
1. full video decode passes;
2. entire output freeze scan passes;
3. no unplanned static gameplay run >= 0.60s;
4. inspect 0/25/50/75/100% frames;
5. complete 1x playback;
6. cover crop reviewed;
7. factual payload rechecked against source data;
8. only then schedule.

## Stage 2-2 decision
LoopJolt social creative becomes FLAG-FIRST:
- flags visible in the first second;
- gameplay begins immediately;
- one competition fact per shot;
- country/rank data only when genuine;
- CTA always connects individual play to country contribution.

## Next bounded task
Stage 2-3: map Deep Descent, Core Pins and Nova Merge into three finished scripts/storyboards using these templates. No publishing yet.
