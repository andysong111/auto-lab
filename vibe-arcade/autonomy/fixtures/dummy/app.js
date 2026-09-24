'use strict';
fetch('./manifest.json').then(r => { if (!r.ok) throw Error('manifest_missing'); return r.json(); })
  .then(metadata => {
    const canvas=document.querySelector('[data-game-canvas]');
    const renderer=PlayJoltPhaserKit.create({canvas,visuals:GameVisuals});
    PlayJoltGameKit.create({core:GameCore,renderer,canvas,metadata,presentation:GamePresentation});
  });
