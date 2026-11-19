// Vice City Nights — a GTA-style cover art maker (Node 22, standard library
// only). The app lives in app/ as plain static files a desktop browser loads
// offline: app/index.html plus its ES modules, no libraries and no network
// requests. This program hands it in: it copies app/ and screenshots/ from
// beside this file into /output and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
// Try it locally first with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier as makeDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = path.join(repoRoot, 'app');
const shotsDir = path.join(repoRoot, 'screenshots');

fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(appDir, path.join(outDir, 'app'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'screenshots'), { recursive: true });
if (fs.existsSync(shotsDir)) {
  fs.cpSync(shotsDir, path.join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, mirrored from the kit's reference gate: only the text
// cap shapes the dossier bytes; the rest refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; app/ over 993 files
// or 48 MiB in all; any app/ path over 1000 bytes; /output's own cap of
// 1000 entries and 64 MiB shared by app/, screenshots/ and dossier.json).
const dossier = makeDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
fs.writeFileSync(path.join(outDir, 'dossier.json'), dossier);
const shots = fs.readdirSync(path.join(outDir, 'screenshots')).sort();
console.log(`Vice City Nights handed in: app/ + ${shots.length} screenshot(s) -> ${outDir}`);
console.log(`dossier.json: ${dossier.length} bytes; screenshots: ${shots.join(', ')}`);
