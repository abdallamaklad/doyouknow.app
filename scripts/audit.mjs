import { readdir, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'scripts') continue;
    const path = join(dir, entry.name);
    entry.isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const errors = [];
const canonicals = new Map();
const noindexCanonicals = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = file.slice(root.length);
  for (const required of ['<html lang=', '<title>', 'name="description"', 'rel="canonical"', '<h1']) {
    if (!html.includes(required)) errors.push(`${rel}: missing ${required}`);
  }
  const h1Count = (html.match(/<h1(?=[\s>])/g) || []).length;
  if (h1Count !== 1) errors.push(`${rel}: expected exactly one h1, found ${h1Count}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
  if (title.length < 15 || title.length > 75) errors.push(`${rel}: title length ${title.length} outside 15–75`);
  if (description.length < 40 || description.length > 180) errors.push(`${rel}: description length ${description.length} outside 40–180`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (canonical && !canonical.startsWith('https://doyouknow.app/')) errors.push(`${rel}: canonical must be absolute`);
  if (canonical && !html.includes('name="robots" content="noindex')) {
    if (canonicals.has(canonical)) errors.push(`${rel}: duplicate canonical also used by ${canonicals.get(canonical)}`);
    canonicals.set(canonical, rel);
  }
  if (canonical && rel !== 'index.html' && html.includes('name="robots" content="noindex')) noindexCanonicals.push(canonical);
  for (const json of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json[1]); } catch { errors.push(`${rel}: invalid JSON-LD`); }
  }
  if (!html.includes('property="og:image"')) errors.push(`${rel}: missing Open Graph image`);
  if (!html.includes('rel="icon"')) errors.push(`${rel}: missing favicon`);
  const googleTagCount = (html.match(/G-6VQZY87LJB/g) || []).length;
  if (googleTagCount !== 2) errors.push(`${rel}: expected one Google tag, found measurement ID ${googleTagCount} times`);
  if (html.includes('/doyouknow-app-site/')) errors.push(`${rel}: development path leaked`);
  for (const match of html.matchAll(/href="([^"#]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const clean = href.split('?')[0];
    const target = clean.startsWith('/') ? join(root, clean) : join(dirname(file), clean);
    try { await access(target.endsWith('/') ? join(target, 'index.html') : target); }
    catch { errors.push(`${rel}: broken link ${href}`); }
  }
}
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
for (const canonical of noindexCanonicals) {
  if (sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap.xml: noindex URL included ${canonical}`);
}
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  console.error(`\n${errors.length} audit error(s).`);
  process.exit(1);
}
console.log(`SEO/link audit passed for ${htmlFiles.length} HTML pages.`);
