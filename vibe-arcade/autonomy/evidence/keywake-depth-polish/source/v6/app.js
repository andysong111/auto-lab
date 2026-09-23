(() => {
  'use strict';
  const canvas = document.querySelector('[data-game-canvas]');
  const $ = (s) => document.querySelector(s);
  const progress = $('[data-product-progress]'), keys = $('[data-room-keys]');
  const score = $('[data-game-score]'), best = $('[data-best]'), result = $('[data-result]'), status = $('[data-game-status]');
  function keyCount(mask) {
    let count = 0, value = mask >>> 0;
    while (value) { count += value & 1; value >>>= 1; }
    return count;
  }
  function rating(state) {
    const extra = state.total_moves - state.total_par;
    return extra <= 0 ? 'Perfect route' : extra <= 2 ? 'Efficient route' : 'Detour +' + extra;
  }
  function update(snapshot) {
    const s = snapshot.state, room = s.stage <= 3 ? globalThis.KeywakeCore.roomFor(s.seed, s.stage) : null;
    progress.textContent = 'ROOMS ' + s.objective_progress + ' / 3';
    keys.textContent = room
      ? 'ROOM ' + s.stage + ' · KEYS ' + keyCount(s.key_mask) + ' / ' + room[1].length
      : 'ROOMS COMPLETE';
    score.textContent = String(s.score);
    if (Number.isFinite(snapshot.best)) best.textContent = String(snapshot.best);
    if (s.outcome === 'success') { result.textContent = 'ALL ROOMS CLEARED · ' + s.score + ' POINTS · ' + s.total_moves + ' MOVES · ' + rating(s); status.textContent = 'Vault route complete'; }
    else if (s.outcome === 'failure') { result.textContent = 'TIME UP · ROOMS CLEARED ' + s.objective_progress + ' / 3'; status.textContent = 'Route clock expired'; }
    else { result.textContent = 'Plan your key order. Locked gate bars require their marked keys.'; status.textContent = 'Exploring room ' + s.stage; }
  }
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const change = () => globalThis.KeywakeArt.setReducedMotion(query.matches);
  change(); query.addEventListener('change', change);
  addEventListener('pagehide', (e) => { if (!e.persisted) query.removeEventListener('change', change); });
  fetch('./manifest.json').then((r) => { if (!r.ok) throw new Error('manifest unavailable'); return r.json(); }).then((metadata) => {
    PlayJoltGameKit.create({ core:globalThis.KeywakeCore, canvas, metadata, draw(ctx,snapshot,size) { globalThis.KeywakeArt.draw(ctx,snapshot,size); update(snapshot); }, presentation:globalThis.KeywakeArt.presentation });
  }).catch((e) => { const node = $('[data-game-error]'); node.hidden = false; node.textContent = 'Unable to start Keywake: ' + e.message; });
})();
