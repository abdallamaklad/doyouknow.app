// Builds the work manifest for article hero-image generation.
//
// Scans en/ + ar/ articles, finds every slug that still lacks a real
// /assets/images/articles/<slug>.jpg hero, and emits a manifest carrying the
// title, description and category needed to write an image prompt.
//
// Usage: node scripts/build-image-manifest.mjs [--out <path>]

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const imageDir = join(root, 'assets', 'images', 'articles');

const args = process.argv.slice(2);
const outPath = args.includes('--out')
  ? args[args.indexOf('--out') + 1]
  : join(root, 'editorial', 'image-manifest.json');

function decodeHtml(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', '’')
    .replaceAll('&#39;', '’')
    .replaceAll('&nbsp;', ' ');
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? decodeHtml(m[1].replace(/<[^>]+>/g, '')).trim() : '';
}

const files = (await readdir(join(root, 'en', 'article'))).filter((f) => f.endsWith('.html'));
const slugs = files.map((f) => f.replace(/\.html$/, '')).sort();

const missing = [];
for (const slug of slugs) {
  if (existsSync(join(imageDir, `${slug}.jpg`))) continue;
  const html = await readFile(join(root, 'en', 'article', `${slug}.html`), 'utf8');
  missing.push({
    slug,
    title: firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || slug,
    description: firstMatch(html, /<meta name="description" content="([^"]*)"/),
    category: firstMatch(html, /"articleSection":"([^"]*)"/),
    hasArabic: existsSync(join(root, 'ar', 'article', `${slug}.html`))
  });
}

await writeFile(outPath, `${JSON.stringify(missing, null, 2)}\n`);
console.log(`${slugs.length} articles scanned, ${missing.length} missing a hero image.`);
console.log(`Manifest written to ${outPath}`);
