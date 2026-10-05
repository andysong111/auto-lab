import {createHaloGuardView} from './view/art.js';

try {
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('Could not load local game metadata.');
  const metadata = await response.json();
  const canvas = document.querySelector('[data-game-canvas]');
  const renderer = await createHaloGuardView({canvas});
  PlayJoltGameKit.create({core: globalThis.GameCore, renderer, canvas, metadata});
} catch (error) {
  const node = document.querySelector('[data-game-error]');
  node.hidden = false;
  node.textContent = error.message;
}
