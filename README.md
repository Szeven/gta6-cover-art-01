# Vice City Nights — GTA 6 Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Szeven/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Szeven/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into GTA-style cover art: a multi-panel poster with
bold caption lettering and a Vice City sunset or neon colour grade, exported as
a PNG to share. All art is original and invented — no Rockstar assets.

## Use it

Serve `app/` and open it in a desktop browser:

```sh
node serve.ts
# app/ is on http://localhost:8080
```

1. Load a photo (upload your own, or pick a sample).
2. Type a title and a tagline, pick a layout and a grade.
3. Export a PNG in 1080 x 1080, 1080 x 1350, or 1920 x 1080.

Everything runs offline in the browser from these files; no network requests.

## Layout

- `app/` — the cover maker (index.html, style.css, src/*.js, samples/)
- `screenshots/` — 3 screenshots: the exported cover first, then the editor
- `main.ts` — hands the app in: copies app/ and screenshots/ to /output and
  writes /output/dossier.json with the kit's library
- `vendor/makefun-app.ts` — the kit's library, unchanged

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
