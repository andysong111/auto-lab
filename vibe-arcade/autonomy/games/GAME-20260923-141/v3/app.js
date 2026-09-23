(() => {
  'use strict';

  const canvas = document.querySelector('[data-game-canvas]');
  const roomProgress = document.querySelector('[data-product-progress]');
  const roomKeys = document.querySelector('[data-room-keys]');
  const result = document.querySelector('[data-result]');
  const score = document.querySelector('[data-game-score]');
  const best = document.querySelector('[data-best]');
  const status = document.querySelector('[data-game-status]');
  const errorNode = document.querySelector('[data-game-error]');

  function updateUi(snapshot) {
    const state = snapshot.state;
    const keys = globalThis.KeywakeArt.keyCount(state);
    roomProgress.textContent = 'ROOMS ' + state.objective_progress + ' / 3';
    roomKeys.textContent = state.stage <= 3
      ? 'ROOM ' + state.stage + ' · KEYS ' + keys.held + ' / ' + keys.total
      : 'ROOMS COMPLETE';
    score.textContent = String(state.score);
    if (Number.isFinite(snapshot.best)) best.textContent = String(snapshot.best);

    if (state.outcome === 'success') {
      result.textContent = 'ALL ROOMS CLEARED · ' + state.score + ' POINTS · ' + state.moves + ' MOVES · ' + (state.score === 600 ? 'Perfect route.' : 'Efficient routes earn more.');
      status.textContent = 'Complete';
    } else if (state.outcome === 'failure') {
      result.textContent = 'TIME UP · ROOMS CLEARED ' + state.objective_progress + ' / 3';
      status.textContent = 'Time expired';
    } else {
      result.textContent = 'Find every brass key before entering the gold hatch.';
      status.textContent = 'Exploring room ' + state.stage;
    }
  }

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = () => globalThis.KeywakeArt.setReducedMotion(motionQuery.matches);
  globalThis.KeywakeArt.setReducedMotion(motionQuery.matches);
  motionQuery.addEventListener('change', onMotion);
  addEventListener('pagehide', (event) => {
    if (!event.persisted) motionQuery.removeEventListener('change', onMotion);
  });

  fetch('manifest.json')
    .then((response) => {
      if (!response.ok) throw new Error('manifest unavailable');
      return response.json();
    })
    .then((metadata) => {
      PlayJoltGameKit.create({
        core: globalThis.KeywakeCore,
        canvas,
        metadata,
        draw(ctx, snapshot, size) {
          globalThis.KeywakeArt.draw(ctx, snapshot, size);
          updateUi(snapshot);
        },
        presentation: globalThis.KeywakeArt.presentation
      });
    })
    .catch((error) => {
      errorNode.hidden = false;
      errorNode.textContent = 'Unable to start Keywake: ' + error.message;
    });
})();
