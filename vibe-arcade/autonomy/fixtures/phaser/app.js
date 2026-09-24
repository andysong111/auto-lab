'use strict';
fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('manifest_missing');return r.json();})
  .then(metadata=>PlayJoltPhaserKit.create({core:FactoryFixtureCore,sceneHooks:FactoryPhaserScene,canvas:document.querySelector('[data-game-canvas]'),metadata}));
