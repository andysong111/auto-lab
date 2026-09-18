# LoopJolt — Master Plan

Last updated: 2026-09-19

## 0. Executive thesis

LoopJolt is a low-maintenance global browser-game business.

The core loop is:

**idea → tiny game → automated QA → publish → distribute → measure → KEEP / MODIFY / KILL → scale only winners**

The business is not built by producing many games blindly. It is built by finding one or more replayable game mechanics, then compounding distribution, variants, SEO, social reach and monetization around proven winners.

The owner should not become the day-to-day operator. Human intervention is reserved for account authorization, irreversible spending, domain/ad-network approvals and major strategic decisions.

---

## 1. Current phase

### Phase 1 — public acquisition + engagement validation

Public games:
1. Don't Press
2. Perfect Timing
3. Reaction Rush

Unlisted prototypes:
1. Color Trap
2. Memory Grid
3. Odd One Out

Current distribution:
- Threads
- YouTube Shorts
- TikTok
- Instagram Reels
- Facebook available as a secondary channel

Current measurement:
- page_view
- game_open
- game_start
- game_finish
- replay
- share
- next_game
- UTM source / medium / campaign / content
- build version
- anonymous session id

Current public build:
- `quality-v2`

---

## 2. What must be proven first

Before platform expansion, LoopJolt must prove two independent things.

### A. Acquisition
Can external users be brought to the site at low cost?

Primary indicators:
- external sessions
- profile-link clicks
- content → site click-through
- channel-level traffic

### B. Game engagement
Once users arrive, do they actually play?

Primary indicators:
- landing → game_start
- game_start → game_finish
- replay / game_start
- next_game / game_finish
- share / game_finish
- starts per visitor
- time on site when durable analytics is justified

Do not confuse the two.

If traffic is weak, fix distribution.
If traffic exists but play is weak, fix games.
If both are weak after repeated tests, stop expanding.

---

## 3. Product strategy

### Public catalog rule
Keep the public catalog small until signals exist.

Maximum before validation:
- 10 meaningfully different public games

### Game design standard
Every game should:
- open instantly
- work mobile-first
- explain itself in under 5 seconds
- create a score, failure state or mastery target
- be replayable in 15–60 seconds
- support a social challenge hook
- avoid login before value is delivered

### Development priority
1. improve proven mechanics
2. build variants of winners
3. test one new mechanic at a time
4. only then add platform features

### Features explicitly deferred
- accounts
- creator upload marketplace
- creator payouts
- complex recommendation engine
- social graph
- heavy backend
- large multiplayer games
- expensive custom infrastructure

---

## 4. Distribution strategy

### Channel roles

#### Threads
Use for:
- text hooks
- rapid copy testing
- direct clickable game links
- fast low-cost experiments

#### YouTube Shorts
Use for:
- broad discovery
- exact direct game links in description
- searchable evergreen clips

#### TikTok
Use for:
- short viral challenge videos
- profile-link funnel
- fast creative testing

#### Instagram Reels
Use for:
- visual reach
- profile-link funnel
- repeated winner-game creatives

#### Facebook
Use only as:
- secondary distribution
- cross-posting
- later audience retargeting if justified

### Profile-link system
Tracked permanent routes:
- Instagram: /ig
- TikTok: /tt
- YouTube: /yt
- Threads: /th
- Facebook: /fb

Never force repeated manual profile edits when the destination changes. Change the redirect centrally.

---

## 5. Creative / Higgsfield strategy

### Rule
**Actual gameplay is the product. AI is the marketing layer.**

### Default creative composition
- 70–100% real gameplay
- 0–30% AI-generated intro, transition or attention hook
- exact brand text rendered deterministically

### Higgsfield is used for
- 1–2 second attention hooks
- visual intros
- transitions
- background / atmosphere
- multiple creative variants around a proven game
- concept mockups clearly labeled as concepts

### Higgsfield is not used for
- fake gameplay that differs from the live game
- exact brand spelling
- exact URLs / usernames
- exact score claims
- generating many expensive videos for unproven games

### Brand QA
AI must never be trusted to spell:
- LOOPJOLT
- @playloopjolt
- URL
- exact CTA

Those are added in post-processing.

---

## 6. Creative testing loop

For every public game:

1. create one honest real-gameplay video
2. publish across core channels
3. measure traffic and engagement
4. if the game shows promise, create 3–5 new hooks
5. keep the gameplay body substantially identical
6. test hook / caption / first frame / CTA independently
7. stop spending creative credits on weak games

Winner-game formula:

**1 winning game × 5 hooks × 3 channels = 15 cheap distribution tests**

Prefer multiplying a winner over building 15 unrelated games.

---

## 7. Decision framework

### KEEP
A game earns more investment when it shows relative strength in:
- replay
- completion
- next-game movement
- shares
- repeated traffic response

Action:
- create variants
- improve polish
- make more creatives
- increase distribution

### MODIFY
Traffic arrives but engagement is mediocre.

Action:
- reduce instructions
- improve first 3 seconds
- adjust difficulty
- strengthen feedback / score chase
- change hook
- retest once or twice

### KILL
After meaningful traffic and at least one reasonable iteration:
- weak start rate
- weak finish rate
- near-zero replay
- no relative advantage over alternatives

Action:
- stop development
- retain code only as reference
- redirect effort to stronger games

---

## 8. Validation milestones

### Milestone A — first usable signal
Target:
- 100+ real external sessions
- enough volume to compare start rates directionally

Decision:
- distribution issue vs game issue

### Milestone B — game-level signal
Target:
- 300–500 external plays across the catalog
- at least one game showing clear relative engagement strength

Decision:
- promote a winner
- release one unlisted prototype only if needed

### Milestone C — repeatability
Target:
- 1,000+ total external plays
- 500+ plays on one game or equivalent strong concentration
- replay rate around or above 15% on a winner
- starts per visitor trending toward 1.5+

Decision:
- invest in winner variants and stronger analytics

These are operating thresholds, not guarantees of commercial success.

---

## 9. Monetization sequence

Do not monetize too early if it damages validation.

### Stage 1 — no monetization
Goal:
- prove users arrive and play

### Stage 2 — lightweight ads
Trigger:
- meaningful recurring traffic
- game sessions long enough to support ads without destroying retention

Tests:
- minimal display / interstitial placement
- revenue per session
- retention impact

### Stage 3 — traffic-scale monetization
Possible layers:
- display / video ads
- sponsorships
- game-specific branded challenges
- affiliate offers only when contextually relevant

### Stage 4 — platform economics
Only after strong user traffic exists:
- external creator submissions
- revenue share
- promoted games
- creator tools

Do not build creator economics before player demand.

---

## 10. SEO strategy

SEO is secondary during initial validation but should be structurally clean.

Maintain:
- unique game titles
- descriptions
- sitemap
- robots
- clean URLs
- fast loading
- mobile usability

After winner games emerge:
- dedicated landing copy
- “reaction test”, “timing game”, “memory game” style search pages
- internal links between related games
- shareable result pages if data supports the effort

Avoid mass AI SEO pages before user signal.

---

## 11. Analytics evolution

### Current
Vercel runtime logs are acceptable for low traffic.

### Upgrade trigger
Move to a durable analytics store when:
- log analysis becomes cumbersome
- traffic volume is meaningful
- retention/cohort analysis matters
- automated reporting is needed

Likely next layer:
- lightweight first-party event database
- daily game/channel scorecard
- automated KEEP / MODIFY / KILL candidate report

Do not add this infrastructure only for elegance.

---

## 12. Cost discipline

LoopJolt is an option-like experiment, not a project allowed to consume unlimited cash.

Rules:
- organic before paid
- real gameplay recording before AI video generation
- no new recurring SaaS unless it removes meaningful work or directly improves validation
- use existing Vercel/GitHub stack
- Higgsfield credits concentrated only on winning mechanics
- paid acquisition requires explicit justification and a capped experiment

Every recurring cost should answer:
**What measurable bottleneck does this remove?**

If no answer, remove it.

---

## 13. Owner intervention policy

Owner intervention should be required only for:
- login / OAuth authorization unavailable to the agent
- profile fields not exposed by available APIs
- payment authorization
- domain purchase
- ad-network approval
- legal / tax decisions
- irreversible account actions
- explicit budget approval for paid campaigns

Everything else should be automated, delegated or executed through connected tools.

---

## 14. Operating cadence

### Daily / automated
- publish scheduled content
- collect traffic and game events
- flag failures
- keep infrastructure healthy

### Every 2–3 days during active experiment
- compare channel traffic
- compare game start / finish / replay
- adjust hook or timing if needed

### Weekly
- KEEP / MODIFY / KILL review
- choose next game or winner variant
- review Higgsfield credit usage
- review recurring costs

### Monthly
- decide whether LoopJolt has earned more capital
- check monetization readiness
- remove unused services
- update strategic phase

---

## 15. Next 14 days

### Already completed
- public MVP
- 3 public games
- quality-v2 upgrade
- event tracking
- social accounts connected
- Metricool scheduling
- tracked profile redirects
- real-gameplay social recording pipeline
- 3 unlisted next-batch games

### Next actions
1. collect first real multi-channel cohort
2. verify profile links are live on each social profile
3. review first 100+ external sessions
4. identify acquisition bottleneck vs engagement bottleneck
5. modify only the weakest proven bottleneck
6. release one Batch B game only if existing games do not provide a clear winner
7. if a winner emerges, build 2–3 variants of that mechanic
8. create 3–5 Higgsfield-assisted hooks for the winner
9. delay paid ads until organic creative/channel fit is visible
10. decide monetization only after repeat traffic appears

---

## 16. 30–90 day paths

### Path A — winner appears
- concentrate content on winner
- make variants
- add durable analytics
- improve SEO around the winning intent
- test minimal monetization
- grow a family of related games

### Path B — traffic exists, no game winner
- cycle through Batch B one at a time
- improve gameplay quality bar
- kill weak mechanics quickly
- stop after 10 meaningful game tests if no signal

### Path C — games engage, traffic is weak
- increase content cadence
- test new hooks / formats / channels
- use Higgsfield on the strongest game
- consider one tightly capped paid distribution test only after organic creatives show clickability

### Path D — neither traffic nor engagement
- stop platform expansion
- preserve reusable tech
- cap losses
- redeploy effort to a different opportunity

---

## 17. Ultimate business model

The long-term target is not “a website with many random mini-games.”

It is:

**a global AI-assisted game discovery and distribution engine where player behavior selects the inventory, marketing is generated around proven winners, and monetization scales only after attention is proven.**

The moat, if one develops, comes from:
- fast production loop
- accumulated game-behavior data
- winning mechanic library
- creative/distribution system
- low operating labor
- portfolio economics

The system must remain capable of running with minimal owner involvement.
