/** Server statico minimale per vedere dist/ in locale: npm run dev → http://localhost:4321 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadConfig } from './lib/util.mjs';

const DIST = path.join(ROOT, 'dist');
const config = await loadConfig();
const base = new URL((process.env.SITE_URL || config.site.url).replace(/\/$/, '') + '/').pathname;
const PORT = process.env.PORT || 4321;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };

createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!url.startsWith(base)) { res.writeHead(302, { location: base }); return res.end(); }
  let file = path.join(DIST, url.slice(base.length));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(await readFile(path.join(DIST, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`▶ http://localhost:${PORT}${base}`));
