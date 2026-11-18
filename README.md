# Fortune Farms

A 3D, cartoon-style farm betting game that runs in the browser on desktop and mobile and installs as a PWA. Coins are play money.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/ (static, host anywhere)
npm test         # RTP verification (analytic + Monte Carlo)
```

The service worker (offline play, install prompt) only registers in the production build, served over HTTPS or localhost.

## How it plays

- **Tap a plot's tag** to zoom in, pick an upgrade, see its paytable and play just that plot.
- **Roll Harvest** plays the 5 core plots in sequence; **Run the Farm** plays all 9. Both unlock combo bonuses.
- **Upgrades** raise the stake on a plot and improve what it pays (e.g. Milk-o-matic 4000 unlocks cheeses, the pillow stops eggs breaking, Earthquake doubles the fruit drops).

## Maths

Every round's full result is rolled before any animation plays (`src/math/engine.js`).

- Each plot is a set of independent slots (16 combine finds, 8 cows, 10 hens, ...). Each slot pays either a filler (nothing, or the plot's lowest prize) or a draw from a weighted prize table.
- The hit rate is solved analytically so every plot, under every upgrade, returns exactly 96% of its stake (`RTP` in `src/math/data.js`).
- In circuit modes, combos pay a fixed multiple of the total round stake. Their exact probabilities are computed and the plots' return is scaled down so plots + combos still total 96%.
- Prize tables, weights, upgrades and combos all live in `src/math/data.js`; `npm test` re-verifies RTP after any change.

Outcomes are generated client-side with `crypto.getRandomValues`. A real-money version would need the roll moved to a server.

## Layout

- `src/math/` prize data and outcome engine
- `src/scene/` three.js world, animation runtime, shared models, one file per plot in `sectors/`
- `src/ui/` HUD, panels, popups, synth audio
- `public/` manifest, service worker, icons
