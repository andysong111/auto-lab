# AGENTS.md - Everyday Relief Studio operating instructions

This repository is the durable source of truth for the AI short-video project the owner calls
**일상시원공감프로젝트** (Everyday Relief Studio).

The former PlayJolt / LoopJolt game program was discontinued by the owner on 2026-10-06.
Do not restart its candidates, schedules, releases, marketing rail, or production deployment.

## Read first

Before substantial work, read:

1. `everyday-relief/PROJECT_CONTEXT.md`
2. `everyday-relief/FORMAT_CONTRACT.json`
3. `everyday-relief/PUBLISHING.md`

## Mission

Create globally understandable vertical shorts about ordinary frustration, anger, sadness, or
awkwardness. Each story should resolve through an unexpected, safe, emotionally satisfying turn.

The operating loop is:

`OWNER IDEA -> NONVERBAL STORY -> SAFETY/FORMAT QA -> VIDEO GENERATION -> VISUAL QA -> OWNER APPROVAL -> METRICOOL PUBLISH -> MEASURE -> LEARN`

The owner supplies an idea or reference and makes the final approval decision. The system handles
story design, generation, QA, publishing preparation, approved distribution, measurement, and
learning.

## Non-negotiable creative rules

- Final videos are global and language-free: no speech, narration, subtitles, captions inside the
  frame, readable signs, readable UI, logos, watermarks, or other linguistic dependence.
- Music, sound effects, and nonverbal vocal reactions are allowed.
- Use a 9:16 composition with one immediately readable situation and one primary emotional arc.
- The first two seconds must communicate the relatable problem visually.
- The resolution must be surprising and cathartic without realistic injury, dangerous imitation,
  humiliation, cruelty, harassment, or targeting a protected class.
- The ending should be clear without explanatory text and should support a natural replay loop.
- Never publish, schedule public distribution, buy credits, change a paid plan, or start paid ads
  without the applicable owner approval.
- Do not reuse PlayJolt / LoopJolt names, profiles, descriptions, logos, game assets, or marketing.

## Approval boundaries

- Story drafts and private previews may be prepared after the owner supplies an idea.
- Public posting requires the owner's explicit approval of the exact rendered video.
- Profile renames, bios, logos, and other public channel changes require approval of the exact brand
  package before saving them.
- Existing connected accounts must be verified before any edit. Never guess which Metricool brand or
  social account is the former game account.
- `Absurd Mirror` is an independent modern-art brand. Never treat its recent content direction as
  evidence that it belongs to PlayJolt, Twist Relief, or this project, and never edit its Metricool
  brand or social profiles as part of this migration.
- Before changing a public profile, match the live Metricool brand ID, destination channel ID,
  handle, and visible brand name against a reviewed account map. A matching topic, login, or recent
  browser tab is not sufficient evidence.

## Engineering style

- Prefer deterministic contracts and validators over prompt-only rules.
- Preserve provenance for each idea, story spec, generation job, render, approval, publication, and
  measured result.
- Do not claim a video passed because generation completed. Verify the actual rendered pixels,
  audio, duration, aspect ratio, continuity, language absence, and emotional readability.
- Keep paid retries bounded. A failed render remains part of the learning record and is not silently
  regenerated without a recorded reason.
- Update `everyday-relief/PROJECT_CONTEXT.md` when strategy, policy, or owner-intervention rules
  change.

## Source-of-truth precedence

1. Current repository code and saved run evidence
2. This `AGENTS.md`
3. `everyday-relief/PROJECT_CONTEXT.md`
4. Format, publishing, and QA contracts
5. Older chat history
