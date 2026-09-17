# Vibe Arcade — Source of Truth

## Mission
Build a low-maintenance global web-game business where AI rapidly creates small browser games, real player data selects winners, and only winners receive more development and distribution.

## Current phase
**Phase 1: public traffic + engagement validation**

Production: https://vibe-arcade-dun.vercel.app

## Phase 1 question
Can we bring real players to small AI-built web games at low cost and get meaningful play/retention signals?

## Non-goals before validation
- No creator marketplace
- No user accounts
- No creator payouts
- No complex recommendation engine
- No paid infrastructure unless required
- No large game production

## Phase 1 success signals
Any meaningful combination of:
- 1,000+ total external plays
- 500+ plays on one game
- 60s+ average play time
- 15%+ replay rate
- 1.5+ game starts per visitor

## Kill rule
If 10 meaningfully different games receive distribution tests and show neither acquisition nor engagement signal, stop platform development. Diagnose distribution vs game quality before adding features.

## Operating rule
Every change must improve one of: acquisition, activation, engagement, retention, virality, monetization readiness. Cosmetic work without a measurable hypothesis is deprioritized.

## Initial portfolio
1. Don't Press — curiosity / inhibition
2. Perfect Timing — mastery / replay
3. Reaction Rush — reflex / score chase

## Measurement
Track at minimum:
- page_view
- game_open
- game_start
- game_finish
- replay
- share
- next_game
- UTM source / medium / campaign
- referrer and anonymous session ID

Initial events are stored in Vercel runtime logs through `/api/event`; add a durable analytics store only when real traffic volume makes it worthwhile.

## Development loop
Idea → build → automated sanity check → deploy → traffic → measure → KEEP / MODIFY / KILL.

## Owner intervention
Only when external account authorization, spending, domain purchase, ad-network approval, or irreversible business decisions are required.