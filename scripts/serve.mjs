import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
// Keep this in step with what production serves. Missing image/font types fall
// back to application/octet-stream, which browsers refuse to render in <img> —
// that made every article image look broken in local visual QA while production
// was fine.
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.xml':'application/xml', '.txt':'text/plain',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif',
  '.ico':'image/x-icon', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json',
  '.woff2':'font/woff2', '.woff':'font/woff' };
createServer(async (req, res) => {
  try {
    let path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    let file = join(root, path);
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
