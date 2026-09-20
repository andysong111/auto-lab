# LoopJolt Marketing Stage 2-2 — Flag-first Vertical Template
Date: 2026-09-20

## Scope
Reusable 1080×1920 visual system for FLAG CHALLENGE, FLAG VS FLAG and WORLD BOARD. This stage creates the layout/template only. It does not publish, schedule, invent leaderboard data or alter game code.

## Product truth correction
Country competition copy must match the live scoring model. Do not say "every run adds points" or "one run = one country score." A player's verified best may affect a game-country board; Championship placement points are a separate aggregation. Safe default copy:
- SET YOUR BEST. BACK YOUR FLAG.
- PLAY RANKED FOR YOUR FLAG.
- VERIFIED BESTS SHAPE THE BOARD.
- CAN YOU CHANGE THE STANDINGS?

## House canvas and safe zones
These are LoopJolt production targets, not guarantees about platform UI.
- Master: 1080×1920, 30fps.
- Essential horizontal safe area: x 90–900.
- Avoid essential text/flags in right-side UI rail: x 920–1080.
- Hook safe band: y 150–330.
- Flag/team band: y 330–510.
- Gameplay focal band: y 430–1430.
- Progress/fact chip: y 520–690.
- CTA safe band: y 1480–1635.
- Footer/disclosure: y 1660–1770.
- Avoid essential CTA below y 1640.
- Keep the game subject around x 300–780 for platform crops.

## Typography
- Hook: 72–86px, uppercase, max 2 lines, max ~24 characters per line.
- Country name: 34–42px.
- Score/rank: 54–72px.
- Progress/fact: 34–46px.
- CTA: 42–50px.
- Disclosure/footer: 22–26px.
- Use bold geometric sans. White primary, LoopJolt gold #F0CC7A accent, muted #AFC0BA secondary.
- Flags keep native colors and are never recolored.

## Motion timing
FLAG CHALLENGE:
- 0.00–0.35s: gameplay already moving; flags snap/fade in.
- 0.15–1.00s: hook resolves.
- 1.00–5.00s: danger/near-miss gameplay.
- 5.00–10.00s: escalation/progress.
- 10.00–14.00s: success or honest failure.
- 14.00–17.00s: CTA, gameplay still moving.

FLAG VS FLAG:
- 0.00–1.25s: two real flags + real current-period score/gap.
- 1.25–6.00s: relevant gameplay.
- 6.00–9.00s: board/gap returns.
- 9.00–13.00s: CTA.

WORLD BOARD:
- 0.00–1.75s: real Top 3–5.
- 1.75–7.00s: gameplay.
- 7.00–11.00s: real board change/gap if supported.
- 11.00–15.00s: reset countdown/CTA only if accurate.

## Layout A — FLAG CHALLENGE
- Top: small LOOPJOLT / FLAG CHALLENGE label.
- Hook centered in hook band.
- 3–5 equal flag cards; no fake ranks.
- Progress chip uses game truth only: 31 / 48, BOSS 2 / 3, ONE SHIELD LEFT.
- CTA: PICK YOUR FLAG · PLAY RANKED.
- Thumbnail: dramatic gameplay + 3 flags + 2–4 word hook.

## Layout B — FLAG VS FLAG
Eligibility: two genuine countries on the same game/version/period.
- Left flag card and right flag card, equal visual weight.
- Exact scores/ranks from a captured board snapshot.
- One fact only: score gap OR rank positions.
- Period label always visible, e.g. THIS WEEK · AS OF 20:15 KST.
- CTA: SET YOUR BEST · BACK YOUR FLAG.
- If verified data is absent, the template masks numbers and shows LAYOUT PREVIEW · LIVE DATA REQUIRED.

## Layout C — WORLD BOARD
Eligibility: 3+ genuine country rows.
- Top 3 emphasized; optional 4–5 smaller.
- Exact order from a single timestamped snapshot.
- No animated rank movement unless two real snapshots prove it.
- CTA: PLAY RANKED FOR YOUR FLAG.
- Thumbnail: three real flags + 1 / 2 / 3 + WORLD BOARD.

## Reusable renderer contract
The browser template is at marketing/flag-templates/index.html.
Query/API config:
- format: challenge | versus | board
- flags: comma separated ISO2 codes
- hook
- progress
- cta
- period
- verified=1 only when score/rank facts came from a real current board snapshot
- leftScore / rightScore for versus
- boardRows=KR:8420,JP:8310,US:7900 for board
- bg optional gameplay image/video URL for preview/rendering

Safety behavior:
- challenge can render without verified data.
- versus/board without verified=1 mask numbers and show a preview warning.
- flag images come from /assets/flags/7.5.0/{code}.svg.
- text is inserted as textContent, not HTML.

## Thumbnail layouts
1. CHALLENGE: center gameplay subject; three flags across upper third; hook "WHICH FLAG?".
2. VERSUS: two oversized flags split left/right; exact single gap; "VS".
3. BOARD: podium 1/2/3 with real flags; "WORLD BOARD".

## Mandatory pre-schedule gate
Keep Stage1 playback gate active:
- full decode;
- whole-file freeze scan;
- reject unintended >=0.60s gameplay holds;
- inspect start/25/50/75/end;
- complete 1× playback;
- cover QA;
- facts rechecked against current board snapshot.

## Stage 2-2 stop point
Template and three visual states implemented and QA'd. No Metricool schedule changes and no publishing in this stage.

## Next bounded task
Stage 2-3: map Deep Descent, Core Pins and Nova Merge to one concrete script/shot list each using this template. No batch publication yet.
