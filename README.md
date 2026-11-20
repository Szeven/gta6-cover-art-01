# Vice City Nights — SOLARA Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Szeven/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Szeven/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo and a caption into GTA-style cover art — offline, in your browser, no upload.

**Vice City Nights** is a cover maker for the invented city of **Solara City** and the fictional game **SOLARA**. Pick a layout, drop in your own photos (or the two fictional sample portraits), crop and position each panel, choose a sunset, neon or vice colour grade, write your caption in bold poster lettering, and export a PNG in the post sizes people actually share: 1080 × 1080, 1080 × 1350, and 1920 × 1080.

## What it does

- **Multi-panel covers** — four layouts: four-panel grid, hero-and-three, full-bleed hero, and tilted snapshots.
- **Any photo** — load your own photos from your machine, one per panel or one photo across several panels; drag to position, scroll to zoom, per-panel crop.
- **Three grades** — sunset, neon, and vice: gradient-map colour grades, halftone title block, grain and vignette.
- **Bold poster lettering** — big title, neon script subtitle, star heat meter and badge ribbon, all drawn on canvas.
- **One-step export** — PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080, straight from the browser.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — everything runs offline from static files under `app/`. Photos are read on your own machine and never uploaded.

## Layout

- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.
- `serve.ts` — dev server for `app/`.
- `app/index.html` — the editor page.
- `app/style.css` — the editor's dark neon UI.
- `app/src/cover.js` — the cover renderer: layouts, panels, lettering, badge.
- `app/src/grade.js` — the colour grades: gradient maps, halftone, grain, vignette.
- `app/src/main.js` — editor wiring: uploads, drag and zoom, export.
- `app/src/shots.js` — screenshot scenes (`?shot=cover` and `?shot=editor`).
- `app/samples/` — two fictional portraits made for this app (Driver, Neon Queen).
- `screenshots/` — the app with a photo loaded and the covers it exported.

Everything here is original: no Rockstar Games logo, artwork, character or font. The city, the game title and the portraits are invented.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
