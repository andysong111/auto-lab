'use strict';
fetch('./manifest.json').then(r => { if (!r.ok) throw Error('manifest_missing'); return r.json(); })
  .then(metadata => PlayJoltGameKit.create({core:FactoryFixtureCore, draw:FactoryFixtureArt.draw, canvas:document.querySelector('canvas'), metadata}));
