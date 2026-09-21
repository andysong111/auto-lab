# Commissioning fixture

This deliberately small original simulation proves the factory contract. It is not an Astra/Descent-quality production candidate and is never added to discovery, sitemap, rankings, acquisition, or the homepage. `core.js` works under Node without a DOM. Only `view/art.js` draws; `app.js` boots the common kit. The builder inserts the trusted kit and immutable version manifest.

For failure tests a copied workspace changes `const BROKEN = false` to `true`, freezing core progression while the UI still renders. A repaired workspace restores the real step function; QA never sets a score or terminal state.
