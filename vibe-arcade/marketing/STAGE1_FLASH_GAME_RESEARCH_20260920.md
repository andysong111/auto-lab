# LoopJolt Marketing Research Stage 1 — 2026-09-20

## Scope
Research high-view-count Flash/browser-game-style YouTube content, extract repeatable attention patterns, and protect future publishing from frozen-frame uploads. This checkpoint intentionally stops before producing the next campaign batch.

## Benchmarks observed
- The World's Hardest Game: high-view speedrun/completion content emphasizes impossible difficulty, zero-death/clear payoff, retry tension and visible progress.
- Happy Wheels: high-view content emphasizes chaotic physics, spectacular failure, instant retry, surprise and personality/reactivity.
- Fireboy & Watergirl: high-view content emphasizes clear role contrast, cooperative problem solving, level progression, environment changes and completion/walkthrough payoff.
- Simple frustration/retry games such as Flappy Bird historically use an instantly understood rule plus repeated near-failures.

## Sources checked
- SocialCounts: The World's Hardest Game 0-death speedrun (~18.0M views when checked).
- Let's Play Index: Happy Wheels category and high-view videos, including individual videos above ~29M and hundreds of millions of channel-level Happy Wheels views.
- Let's Play Index / YouTube: Fireboy & Watergirl top videos, including ~22.9M, ~19.4M and 7M+ examples.

## Attention patterns to carry forward
1. Rule understood in under 1 second.
2. Impossible-looking challenge stated before the attempt.
3. Visible failure danger / near miss.
4. Immediate retry or escalation.
5. Progress milestone that viewers can track.
6. Strong payoff: clear, boss, perfect, new world, zero-death, etc.
7. Identity or role: character, team, partner or player.
8. Short-form title framed as a challenge or outcome, not a generic game description.

## LoopJolt-specific differentiator
Do not copy competitor characters, art, layouts or code. Combine the attention patterns with:
- self-selected flag;
- player leaderboard;
- country leaderboard;
- weekly shared challenge/course;
- genuine server-verified score;
- real ranking data only when it exists.

Until multiple countries have real records, wording must invite competition (e.g. "Which flag can clear all 48?") rather than fabricate a Korea-vs-USA matchup or rank movement.

## Video-freeze incident
The freeze is present in the uploaded media files themselves, not only in Instagram/TikTok playback.

Checked published files:
- Perfect Timing: repeated/static segments inside the 7.44s file.
- Deep Descent flag challenge: long static intervals inside the 18.27s file.

Checked pending 2026-09-21 through 2026-09-24 files:
- Reaction Rush: static tail.
- Gyro Drop: multiple static runs.
- Core Pins / Nova Merge: long static tail portions.

Response:
- Pending old-campaign posts were changed to draft=true and autoPublish=false.
- Already-published posts were not deleted.
- No further scheduled video may be auto-published until the freeze gate below passes.

## Mandatory media gate before scheduling
1. Full ffmpeg decode returns no corruption/truncation error.
2. freezedetect checks the entire output, not only first/cover frames.
3. Reject unplanned static/repeated-frame runs >= 0.60s in the gameplay body.
4. Explicitly inspect start, 25%, 50%, 75%, and final second.
5. Verify audio/video duration and final frame.
6. Watch one complete local 1x playback.
7. Verify Instagram/TikTok/YouTube cover is nonblank and informative.
8. Only then upload/schedule in Metricool.

## Next bounded task
Stage 2 only: convert the research into 3 original LoopJolt national-competition content formulas. No publishing until a freshly rendered video passes the media gate.
