// Vice City Nights — dev server.
//
// Serves app/ as plain static files on http://localhost:8080, so the
// editor can be tried in a desktop browser with no build step and no
// network request. Run from the repository root:
//
//   node serve.ts
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every path resolves from this file's own directory — never a relative
// path, so the server works from any working directory.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = join(repoRoot, 'app');
const PORT = 8080;

const MIME = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  // Strip the query first, then map the bare root to index.html — a URL
  // like /?shot=editor is the editor page, not a missing file.
  const rawPath = (req.url || '/').split('?')[0];
  const target = rawPath === '/' ? '/index.html' : rawPath;
  let path;
  try {
    path = decodeURIComponent(target);
  } catch (e) {
    path = target;
  }
  const file = join(appDir, path);
  if (!file.startsWith(appDir) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  // Screenshots and previews must never be stale while iterating.
  res.writeHead(200, { 'cache-control': 'no-store', 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Vice City Nights at http://localhost:${PORT}`);
});
