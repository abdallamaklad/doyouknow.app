#!/usr/bin/env node
// Tells IndexNow engines (Bing, Yandex, Seznam, Naver; shared with Copilot and
// other Bing-grounded assistants) which pages changed, so they recrawl in hours
// instead of weeks. Only URLs listed in sitemap.xml are submitted, which keeps
// held/noindex pages out by construction.
//
//   node scripts/indexnow-submit.mjs <changed files...>   (deploy workflow)
//   node scripts/indexnow-submit.mjs --all               (one-off full submit)
//   add --dry-run to print without sending
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const host = 'doyouknow.app';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const files = args.filter((arg) => !arg.startsWith('--'));

const keyFile = (await readdir(root)).find((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) throw new Error('IndexNow key file (<32 hex>.txt) missing from the site root');
const key = (await readFile(join(root, keyFile), 'utf8')).trim();

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const indexable = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));

function urlFor(file) {
  const rel = file.replace(/^\.?\//, '');
  if (!rel.endsWith('.html')) return null;
  if (rel === 'index.html') return `https://${host}/`;
  if (/^(en|ar)\/index\.html$/.test(rel)) return `https://${host}/${rel.slice(0, 2)}/`;
  return `https://${host}/${rel}`;
}

const urls = all
  ? [...indexable]
  : [...new Set(files.map(urlFor).filter((url) => url && indexable.has(url)))];

if (urls.length === 0) {
  console.log('IndexNow: no indexable URLs changed.');
  process.exit(0);
}

for (let i = 0; i < urls.length; i += 10000) {
  const urlList = urls.slice(i, i + 10000);
  const body = { host, key, keyLocation: `https://${host}/${keyFile}`, urlList };
  if (dryRun) {
    console.log(`IndexNow (dry run): would submit ${urlList.length} URLs, e.g. ${urlList.slice(0, 3).join(', ')}`);
    continue;
  }
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  });
  console.log(`IndexNow: submitted ${urlList.length} URLs -> HTTP ${res.status}`);
  if (res.status >= 400) {
    console.log(await res.text());
    process.exitCode = 1;
  }
}
