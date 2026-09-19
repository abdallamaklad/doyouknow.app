// Corrects hero alt text on articles whose hero is a real photograph.
//
// The Higgsfield run swapped the hero <img> src from the generated .art.svg
// placeholder to a photographic <slug>.jpg but left the alt text describing an
// illustration ("Editorial illustration for" / "رسم توضيحي لمقال"). That is
// inaccurate for a screen-reader user in both languages.
//
// Only <img class="featured-image"> / .article-hero-image tags whose src is a
// real /assets/images/articles/<slug>.jpg hero are touched. Decorative card
// images (alt="") are left alone.
//
// Usage: node scripts/fix-hero-alt-text.mjs [--dry-run]

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');

function decodeHtml(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', '’')
    .replaceAll('&#39;', '’');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function getTitle(html, slug) {
  return decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug);
}

const HERO_IMG = /<img\b[^>]*\bclass="[^"]*\b(?:featured-image|article-hero-image)\b[^"]*"[^>]*>/g;

let changed = 0;
let scanned = 0;
const samples = [];

for (const lang of ['en', 'ar']) {
  const dir = join(root, lang, 'article');
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.html'))) {
    const slug = file.replace(/\.html$/, '');
    const path = join(dir, file);
    const html = await readFile(path, 'utf8');
    scanned++;

    const jpgPath = `/assets/images/articles/${slug}.jpg`;
    if (!html.includes(jpgPath)) continue; // still a placeholder hero

    const title = getTitle(html, slug);
    const alt = lang === 'ar'
      ? `صورة تعبيرية لمقال ${title}`
      : `Photograph for ${title}`;

    const next = html.replace(HERO_IMG, (tag) => {
      if (!tag.includes(jpgPath)) return tag;
      return tag.replace(/\balt="[^"]*"/, `alt="${escapeHtml(alt)}"`);
    });

    if (next !== html) {
      if (!dryRun) await writeFile(path, next);
      changed++;
      if (samples.length < 4) samples.push(`${lang}/${slug}: ${alt}`);
    }
  }
}

console.log(`${scanned} article pages scanned, ${changed} hero alt texts ${dryRun ? 'would be' : ''} corrected.`);
for (const s of samples) console.log(`  ${s}`);
