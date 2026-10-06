const test = require('node:test');
const assert = require('node:assert/strict');
const { validateStory } = require('../src/validate-story.cjs');
const good = require('../examples/queue-cutting.json');

test('accepts a complete language-free story', () => {
  assert.deepEqual(validateStory(good), { valid: true, errors: [] });
});

test('rejects text, speech, and missing emotional beats', () => {
  const bad = JSON.parse(JSON.stringify(good));
  bad.language.speech = true;
  bad.language.readable_text = true;
  bad.beats = bad.beats.filter((beat) => beat.name !== 'visible_relief');
  const result = validateStory(bad);
  assert.equal(result.valid, false);
  assert(result.errors.includes('language.speech must be false'));
  assert(result.errors.includes('language.readable_text must be false'));
  assert(result.errors.includes('missing beat: visible_relief'));
});

test('rejects an unsafe or copied concept', () => {
  const bad = JSON.parse(JSON.stringify(good));
  bad.safety.safe_catharsis = false;
  bad.originality.distinctive_expression_copied = true;
  const result = validateStory(bad);
  assert.equal(result.valid, false);
  assert(result.errors.includes('safety.safe_catharsis must be true'));
  assert(result.errors.includes('originality.distinctive_expression_copied must be false'));
});

