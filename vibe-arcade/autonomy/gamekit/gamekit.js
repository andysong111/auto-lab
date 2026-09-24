/* New-game runtime only. Existing canonical rules/runtime/auth remain untouched.
 * Core contract: create(seed), step(state,input), observe(state), terminal(state).
 * Rendering receives snapshots and cannot modify the canonical simulation. */
(function (root) {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  function create({core, draw = null, renderer = null, canvas, metadata, rankedAdapter = null, seed, capture, qa, presentation = null}) {
    const query = new URLSearchParams(location.search);
    capture = capture === true || query.get('capture') === '1';
    qa = qa === true || query.get('qa') === '1';
    const isolated = capture || qa;
    const raw = seed ?? query.get('seed');
    seed = raw !== null && raw !== undefined && /^\d+$/.test(String(raw)) ? Number(raw) : crypto.getRandomValues(new Uint32Array(1))[0];
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    if (!metadata.game_id || !metadata.version) throw Error('missing_version_metadata');
    if ((!draw && !renderer) || (renderer && typeof renderer.render!=='function')) throw Error('missing_renderer');
    if (!presentation) presentation = renderer?.presentation || (() => ({}));
    const productContract = metadata.product_contract || null, commercialContract = metadata.commercial_contract || null;
    const productActions = productContract?.actions && typeof productContract.actions === 'object' ? productContract.actions : {};
    const readPath = (value, key) => String(key || '').split('.').filter(Boolean).reduce((v, part) => v == null ? undefined : v[part], value);
    const setText = (selector, value) => { if (!selector) return; const node = document.querySelector(selector); if (node) node.textContent = String(value ?? ''); };
    const formatValue = (template, value) => String(template || '{value}').replaceAll('{value}', String(value ?? ''));
    const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    let reducedMotion = !!motionQuery?.matches;
    const q = name => document.querySelector('[data-game-' + name + ']');
    for (const id of ['start', 'pause', 'resume', 'restart', 'status', 'score', 'progress', 'error']) if (!q(id)) throw Error('missing_game_ui:' + id);
    const storageKey = 'playjolt_practice_' + metadata.game_id + '_' + metadata.version;
    let state = core.create(seed), phase = 'idle', paused = false, disposed = false, frame = 0, last = 0, acc = 0, epoch = 0;
    let inputs = {x: 0, y: 0, action: false, pointer: null, actions: {}}, accepted = {keyboard: 0, pointer: 0}, error = null, best = 0;
    const keys = new Set(), removers = [], effects = {frames: 0, discarded_ms: 0};
    try { if (!isolated) best = Number(localStorage.getItem(storageKey)) || 0; } catch { /* Practice works without storage. */ }
    function on(target, type, handler, options) { target.addEventListener(type, handler, options); removers.push(() => target.removeEventListener(type, handler, options)); }
    function resetInput() { keys.clear(); inputs = {x: 0, y: 0, action: false, pointer: null, actions: {}}; }
    function pulseNamedAction(name) { if (name) inputs.actions[name] = true; }
    function mapKeyToNamedAction(code) {
      for (const [name, spec] of Object.entries(productActions)) if (spec?.key === code) pulseNamedAction(name);
    }
    function mapPointerToNamedAction(point) {
      let bestMatch = null, bestDistance = Infinity;
      for (const [name, spec] of Object.entries(productActions)) {
        const touch = spec?.touch; if (!touch || !Number.isFinite(touch.x) || !Number.isFinite(touch.y)) continue;
        const d = Math.hypot(point.x - touch.x, point.y - touch.y);
        if (d < bestDistance) { bestDistance = d; bestMatch = name; }
      }
      if (bestDistance <= .22) pulseNamedAction(bestMatch);
    }
    function snapshot() {
      const o = core.observe(state);
      return clone({schema_version: 1, metadata, seed, phase, paused, disposed, capture, qa, ranked: false,
        state, tick: o.tick, progress: o.progress, score: o.score, interactions: o.interactions,
        entities: o.entities, accepted_inputs: accepted, error, best, effects,
        quality: o.quality || null, presentation: {...(presentation() || {}), platform_reduced_motion: reducedMotion}});
    }
    function render() {
      const s = snapshot();
      if(renderer) renderer.render(s,{width:canvas.clientWidth||canvas.width,height:canvas.clientHeight||canvas.height});
      else draw(canvas.getContext('2d'), s, {width: canvas.width, height: canvas.height});
      q('score').textContent = String(s.score); q('progress').textContent = String(s.progress);
      if (productContract) {
        setText(productContract.objective?.visible_selector, productContract.objective?.expected_text);
        const progressValue = readPath(s, productContract.progress?.state_path);
        if (progressValue !== undefined) setText(productContract.progress?.selector, formatValue(productContract.progress?.format, progressValue));
        setText(productContract.score?.selector, s.score);
        setText(productContract.score?.label_selector, productContract.score?.expected_label);
        setText(productContract.best?.selector, s.best);
        setText(productContract.best?.label_selector, productContract.best?.expected_label);
        const completion = productContract.completion, outcome = completion ? readPath(s, completion.state_path) : undefined;
        if (completion && outcome === completion.success_value) setText(completion.result_selector, completion.success_text);
        else if (completion && outcome === completion.failure_value) setText(completion.result_selector, completion.failure_text);
        else if (completion) setText(completion.result_selector, '');
      }
      if (commercialContract?.replay_motivation) setText(commercialContract.replay_motivation.selector, commercialContract.replay_motivation.reason);
      q('start').hidden = phase !== 'idle'; q('pause').hidden = phase !== 'playing' || paused;
      q('resume').hidden = !paused || phase !== 'playing'; q('restart').hidden = phase !== 'finished' && phase !== 'error';
      q('status').textContent = error ? 'Unable to continue. Restart to try again.' : paused ? 'Paused' : phase === 'finished' ? 'Run finished · Practice' : phase === 'playing' ? 'Practice · No account needed' : 'Ready · No account needed';
    }
    function fail(e) {
      if (disposed) return;
      error = String(e?.message || e).slice(0,500); phase = 'error'; paused = false; resetInput();
      q('error').hidden = false; q('error').textContent = error;
      q('restart').hidden = false; q('pause').hidden = true; q('resume').hidden = true;
    }
    function safe(fn) { return (...args) => { try { return fn(...args); } catch (e) { fail(e); } }; }
    function finish() {
      if (phase !== 'playing') return;
      phase = 'finished'; paused = false; resetInput();
      const score = Number(core.observe(state).score);
      if (Number.isFinite(score)) { best = Math.max(best, score); if (!isolated) try { localStorage.setItem(storageKey, String(best)); } catch {} }
      render();
    }
    function start() {
      if (disposed || phase === 'playing' || document.hidden) return;
      epoch++; state = core.create(seed); phase = 'playing'; paused = false; error = null;
      q('error').hidden = true; accepted = {keyboard: 0, pointer: 0}; resetInput(); acc = 0; last = performance.now();
      core.begin?.(state); canvas.focus({preventScroll: true}); render();
    }
    function pause() { if (phase === 'playing') { paused = true; resetInput(); acc = 0; render(); } }
    function resume() { if (phase === 'playing' && !document.hidden && !disposed) { paused = false; resetInput(); last = performance.now(); acc = 0; render(); } }
    function restart() { if (phase === 'playing' || disposed) return; phase = 'idle'; start(); }
    function loop(now) {
      if (disposed) return;
      try {
        const dt = Math.max(0, now - last); last = now;
        if (dt > 250 && phase === 'playing') { effects.discarded_ms += dt; pause(); }
        if (phase === 'playing' && !paused) {
          acc += Math.min(dt, 100);
          let steps = 0;
          while (acc >= 1000 / 60 && steps++ < 6 && phase === 'playing') {
            inputs.x = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
            inputs.y = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
            core.step(state, clone(inputs)); inputs.action = false; inputs.actions = {}; acc -= 1000 / 60;
            if (core.terminal(state)) finish();
          }
        }
        effects.frames++; render();
      } catch (e) { fail(e); }
      frame = requestAnimationFrame(loop);
    }
    on(q('start'), 'click', safe(start)); on(q('pause'), 'click', safe(pause));
    on(q('resume'), 'click', safe(resume)); on(q('restart'), 'click', safe(restart));
    on(window, 'keydown', safe(e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); paused ? resume() : pause(); return; }
      if (phase !== 'playing' || paused || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space'].includes(e.code)) return;
      e.preventDefault(); keys.add(e.code); if (!e.repeat) { accepted.keyboard++; mapKeyToNamedAction(e.code); }
      if (e.code === 'Space' && !e.repeat) inputs.action = true;
    }));
    on(window, 'keyup', e => keys.delete(e.code));
    const pointer = safe(e => {
      if (phase !== 'playing' || paused) return;
      e.preventDefault(); const b = canvas.getBoundingClientRect();
      inputs.pointer = {x: Math.max(0,Math.min(1,(e.clientX-b.x)/b.width)), y: Math.max(0,Math.min(1,(e.clientY-b.y)/b.height))};
      mapPointerToNamedAction(inputs.pointer); inputs.action = true; accepted.pointer++;
      if (e.type === 'pointerdown') canvas.setPointerCapture?.(e.pointerId);
    });
    on(canvas, 'pointerdown', pointer); on(canvas, 'pointermove', e => { if (e.buttons) pointer(e); });
    on(canvas, 'pointerup', () => { inputs.pointer = null; }); on(canvas, 'pointercancel', resetInput);
    if (motionQuery) on(motionQuery, 'change', safe(e => { reducedMotion = !!e.matches; render(); }));
    on(window, 'blur', safe(pause)); on(document, 'visibilitychange', safe(() => { if (document.hidden) pause(); }));
    on(window, 'pagehide', safe(e => { pause(); if (!e.persisted) dispose(); }));
    on(window, 'pageshow', safe(() => { last = performance.now(); acc = 0; }));
    on(window, 'error', e => fail(e.error || e.message)); on(window, 'unhandledrejection', e => fail(e.reason));
    function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); if(renderer?.resize) renderer.resize(Math.max(1,r.width),Math.max(1,r.height),dpr); else {canvas.width = Math.max(1, Math.round(r.width*dpr)); canvas.height = Math.max(1, Math.round(r.height*dpr));} safe(render)(); }
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    function dispose() { if (disposed) return; disposed = true; epoch++; resetInput(); cancelAnimationFrame(frame); observer.disconnect(); try{renderer?.dispose?.();}catch{} for (const remove of removers) remove(); }
    // Reserved adapter slot, intentionally no start/finish/ranking traffic in Phase 1.
    // Existing LoopJoltRuntime remains the future server-verified ranked boundary.
    void rankedAdapter; void epoch;
    const diagnostics = Object.freeze({snapshot});
    Object.defineProperty(root, 'GameDiagnostics', {value: diagnostics, configurable: true});
    resize(); last = performance.now(); frame = requestAnimationFrame(loop);
    return Object.freeze({start: safe(start), pause: safe(pause), resume: safe(resume), finish: safe(finish), restart: safe(restart), dispose, diagnostics});
  }
  const api = Object.freeze({create, version: 'gamekit-2'});
  root.PlayJoltGameKit = api; if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
