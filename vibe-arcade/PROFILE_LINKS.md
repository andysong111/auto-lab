# LoopJolt Profile Link Source of Truth

Use these links in each social profile. They redirect to the LoopJolt home page with channel-specific attribution.

- Instagram: https://vibe-arcade-dun.vercel.app/ig
- TikTok: https://vibe-arcade-dun.vercel.app/tt
- YouTube: https://vibe-arcade-dun.vercel.app/yt
- Threads: https://vibe-arcade-dun.vercel.app/th
- Facebook: https://vibe-arcade-dun.vercel.app/fb

## Why
- Short enough for profile fields.
- Channel source is preserved without exposing long UTM query strings.
- The destination can later be changed centrally without editing every old post.
- When a custom domain is adopted, preserve the same short paths on the new domain.

## Publishing rule
- Threads/Facebook posts may include direct game links with per-content UTM parameters.
- YouTube Shorts descriptions/comments have non-clickable external URLs. Use the channel profile link as the primary CTA; do not report a description URL as a clickable conversion path.
- A prepared cover image is not proof of custom Shorts thumbnail eligibility. Verify account capability; otherwise omit custom-thumbnail fields.
- Connected account names and actual profile website fields must be checked separately. As of 2026-09-21, Metricool reports Instagram/Threads `playloopjolt`, TikTok `loopjolt2`, and YouTube channel `UCKl5Kh2Nju1C67mBBcVb7Mw`. Do not paste the Instagram handle into TikTok directions.
- Instagram Reels and TikTok captions should use "link in bio" only after that profile link is verified.
- Every profile must have its tracked profile link when the platform supports a website/link field.
- Shared profile links identify the channel, not an individual video. Do not attach an invented per-video conversion rate to the profile traffic.

Official references (checked 2026-09-21):
- https://support.google.com/youtube/answer/13748639?hl=en
- https://help.metricool.com/how-to-add-a-cover-thumbnail-to-your-posts-jabtw
