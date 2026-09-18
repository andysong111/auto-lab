# LoopJolt — Distribution Experiment v1

## Goal
Get the first real external players without paid acquisition, then compare game-level engagement before adding more platform features.

## Do not count
- Owner/developer testing
- Vercel/crawler/bot sessions
- Direct QA sessions without an experiment UTM

## Canonical production
https://vibe-arcade-dun.vercel.app

## UTM rule
Every deliberate external post uses a distinct source + campaign so its sessions can be separated in `/api/event` logs.

### Game links
- Don't Press — `https://vibe-arcade-dun.vercel.app/games/dont-press/?utm_source=social&utm_medium=organic&utm_campaign=launch1&utm_content=dont_press`
- Perfect Timing — `https://vibe-arcade-dun.vercel.app/games/perfect-timing/?utm_source=social&utm_medium=organic&utm_campaign=launch1&utm_content=perfect_timing`
- Reaction Rush — `https://vibe-arcade-dun.vercel.app/games/reaction-rush/?utm_source=social&utm_medium=organic&utm_campaign=launch1&utm_content=reaction_rush`

## First copy tests

### Don't Press
**Hook:** One rule: don't press the red button for 30 seconds. Most people fail because they get curious.

### Perfect Timing
**Hook:** This looks easy until you try to hit 100%. Three taps. No install.

### Reaction Rush
**Hook:** You get 30 seconds. How many targets can you hit before time runs out?

## First decision metrics
Compare per external session:
1. landing -> game start rate
2. game finish rate
3. replay events / game starts
4. next_game events / game finishes
5. share events / game finishes

## Decision rule
- Do not expand the platform because of impressions alone.
- A game with stronger replay / next-game behavior earns variants.
- If traffic arrives but play is weak, change the game/hook.
- If traffic does not arrive, change distribution before changing the platform.
- No paid ads until at least one organic channel proves it can deliver relevant players or a small approved test is explicitly justified.
