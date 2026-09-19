// Downloads generated hero images and normalises them to the site's hero spec.
//
// Input: a JSON array of { slug, url } produced by the image generation run.
// Output: assets/images/articles/<slug>.jpg at 1200x675, progressive JPEG,
// matching the existing heroes (~140-190KB).
//
// Usage:
//   node scripts/fetch-article-images.mjs --results <path> [--force] [--concurrency 4]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imageDir = join(root, 'assets', 'images', 'articles');

const args = process.argv.slice(2);
function flag(name, fallback = null) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}
const resultsPath = flag('--results');
const force = args.includes('--force');
const concurrency = Number(flag('--concurrency', '4'));

if (!resultsPath) {
  console.error('Usage: node scripts/fetch-article-images.mjs --results <path> [--force]');
  process.exit(1);
}

const WIDTH = 1200;
const HEIGHT = 675;
const QUALITY = 82;

const results = JSON.parse(await readFile(resultsPath, 'utf8'));
await mkdir(imageDir, { recursive: true });

async function download(url, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return download(url, attempt + 1);
  }
}

async function processOne({ slug, url }) {
  const dest = join(imageDir, `${slug}.jpg`);
  if (existsSync(dest) && !force) return { slug, status: 'skipped' };
  if (!url) return { slug, status: 'no-url' };

  const raw = await download(url);
  await sharp(raw)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(dest);

  const meta = await sharp(dest).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    throw new Error(`${slug}: wrote ${meta.width}x${meta.height}, expected ${WIDTH}x${HEIGHT}`);
  }
  return { slug, status: 'written', kb: Math.round(statSync(dest).size / 1024) };
}

const queue = [...results];
const done = [];
const failed = [];

async function worker() {
  while (queue.length) {
    const item = queue.shift();
    try {
      const out = await processOne(item);
      done.push(out);
      if (out.status === 'written') console.log(`ok   ${out.slug} (${out.kb}KB)`);
      else console.log(`${out.status.padEnd(4)} ${out.slug}`);
    } catch (err) {
      failed.push({ slug: item.slug, error: String(err.message || err) });
      console.error(`FAIL ${item.slug}: ${err.message || err}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, results.length) }, worker));

const written = done.filter((d) => d.status === 'written');
console.log(`\n${written.length} written, ${done.length - written.length} skipped, ${failed.length} failed.`);
if (written.length) {
  const sizes = written.map((w) => w.kb).sort((a, b) => a - b);
  console.log(`size range ${sizes[0]}KB - ${sizes[sizes.length - 1]}KB`);
}
if (failed.length) process.exit(1);
