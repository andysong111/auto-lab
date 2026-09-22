(function () {
  'use strict';

  function showError() {
    var error = document.querySelector('[data-game-error]');
    if (error) {
      error.hidden = false;
      error.textContent = 'Unable to prepare Prism Relay.';
    }
  }

  fetch('./manifest.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Manifest unavailable');
      return response.json();
    })
    .then(function (metadata) {
      var canvas = document.querySelector('[data-game-canvas]');
      if (!canvas || !globalThis.PlayJoltGameKit || !globalThis.PrismRelayCore || !globalThis.PrismRelayView) {
        throw new Error('Game runtime unavailable');
      }
      globalThis.PlayJoltGameKit.create({
        core: globalThis.PrismRelayCore,
        draw: globalThis.PrismRelayView.draw,
        canvas: canvas,
        metadata: metadata
      });
    })
    .catch(showError);
}());
