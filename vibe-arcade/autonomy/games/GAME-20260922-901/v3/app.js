(function () {
  'use strict';

  fetch('./manifest.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Unable to load game manifest.');
      }
      return response.json();
    })
    .then(function (metadata) {
      PlayJoltGameKit.create({
        core: globalThis.TerraProviderCanaryChamberCore,
        draw: globalThis.TerraProviderCanaryChamberArt.draw,
        canvas: document.querySelector('[data-game-canvas]'),
        metadata: metadata
      });
    })
    .catch(function (error) {
      var target = document.querySelector('[data-game-error]');
      if (target) {
        target.hidden = false;
        target.textContent = error && error.message ? error.message : 'Unable to start the game.';
      }
    });
}());
