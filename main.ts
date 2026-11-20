// Vice City Nights — entrypoint: hand the app in.
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from the
// kit's vendor library. Run with Node 22, standard library only:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Every path resolves from this file's own directory — never a relative
// path, so the grader's working directory cannot change what we copy.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function clearDirectoryContents(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  // Clear only the directory's CONTENTS — never the directory itself:
  // the grader runs as an unprivileged user and the output directory
  // itself is owned by root, so deleting it fails with EPERM.
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { force: true, recursive: true });
  }
}

function main() {
  for (const dir of ['app', 'screenshots']) {
    if (!existsSync(join(repoRoot, dir))) {
      throw new Error(`missing ${dir}/ in the repository — nothing to hand in`);
    }
  }
  clearDirectoryContents(outDir);
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    app_max_bytes: 50331648,
    app_max_files: 993,
    screenshots: { max: 4, max_bytes: 262144 },
    text_max_bytes: 163840,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log('wrote', join(outDir, 'dossier.json'));
}

main();
