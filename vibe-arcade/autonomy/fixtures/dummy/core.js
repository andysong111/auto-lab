/* Original tiny commissioning fixture. Not a production game or quality benchmark. */
(function(root) {
  'use strict';
  const BROKEN = false;
  function create(seed) { return {seed, tick: 0, score: 0, progress: 0, interactions: 0, x: 0.25, taps: 0, finished: false}; }
  function step(s, input) {
    if (BROKEN || s.finished) return;
    s.tick++; s.progress = Math.floor(s.tick / 6);
    s.x = Math.max(0, Math.min(1, s.x + input.x * 0.015));
    if (input.pointer) s.x = input.pointer.x;
    if (input.action) { s.taps++; s.score += 1 + s.seed % 3; s.interactions++; }
    // A bounded, actual time limit, reached via the same rules in QA and normal play.
    if (s.tick >= 600) s.finished = true;
  }
  const api = {create, step, terminal: s => s.finished, observe: s => ({tick:s.tick, score:s.score, progress:s.progress, interactions:s.interactions, entities:1})};
  root.FactoryFixtureCore = api; if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
