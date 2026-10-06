const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_BEATS = [
  'recognition',
  'pressure',
  'expectation',
  'surprising_reversal',
  'visible_relief',
  'loopable_finish',
];

function validateStory(story) {
  const errors = [];
  for (const key of ['id', 'title', 'emotion', 'setting', 'owner_input']) {
    if (typeof story[key] !== 'string' || !story[key].trim()) errors.push(`${key} must be a non-empty string`);
  }
  if (story.aspect_ratio !== '9:16') errors.push('aspect_ratio must be 9:16');
  if (!Number.isFinite(story.duration_seconds) || story.duration_seconds < 8 || story.duration_seconds > 18) {
    errors.push('duration_seconds must be between 8 and 18');
  }
  if (!Array.isArray(story.beats)) {
    errors.push('beats must be an array');
  } else {
    const names = story.beats.map((beat) => beat && beat.name);
    for (const name of REQUIRED_BEATS) if (!names.includes(name)) errors.push(`missing beat: ${name}`);
    for (const beat of story.beats) {
      if (!beat || typeof beat.visual !== 'string' || !beat.visual.trim()) errors.push('every beat needs a visual description');
    }
  }
  for (const key of ['speech', 'narration', 'subtitles', 'readable_text', 'logos', 'watermarks']) {
    if (story.language && story.language[key] !== false) errors.push(`language.${key} must be false`);
  }
  if (!story.language || story.language.works_muted !== true) errors.push('language.works_muted must be true');
  if (!Array.isArray(story.characters) || story.characters.length < 1 || story.characters.length > 3) {
    errors.push('characters must contain 1 to 3 primary characters');
  }
  if (!story.safety || story.safety.safe_catharsis !== true) errors.push('safety.safe_catharsis must be true');
  if (!story.originality || story.originality.distinctive_expression_copied !== false) {
    errors.push('originality.distinctive_expression_copied must be false');
  }
  return { valid: errors.length === 0, errors };
}

function main(file) {
  const story = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const result = validateStory(story);
  if (!result.valid) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ valid: true, id: story.id }, null, 2));
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node src/validate-story.cjs <story.json>');
    process.exitCode = 2;
  } else {
    main(file);
  }
}

module.exports = { REQUIRED_BEATS, validateStory };

