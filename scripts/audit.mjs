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
const indexableCanonicals = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = file.slice(root.length);
  const isNoindex = html.includes('name="robots" content="noindex');
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
  if (canonical && !isNoindex) {
    if (canonicals.has(canonical)) errors.push(`${rel}: duplicate canonical also used by ${canonicals.get(canonical)}`);
    canonicals.set(canonical, rel);
    if (!rel.endsWith('404.html')) indexableCanonicals.add(canonical);
  }
  if (canonical && rel !== 'index.html' && isNoindex) noindexCanonicals.push(canonical);
  if (!isNoindex) {
    const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" ?\/?>/g)];
    const language = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
    if (!hreflangs.some(([, hreflang, href]) => hreflang === language && href === canonical)) {
      errors.push(`${rel}: missing self-referencing hreflang`);
    }
    if (!hreflangs.some(([, hreflang]) => hreflang === 'x-default')) {
      errors.push(`${rel}: missing x-default hreflang`);
    }
    for (const [, hreflang, href] of hreflangs) {
      if (!['en', 'ar', 'x-default'].includes(hreflang)) errors.push(`${rel}: unsupported hreflang ${hreflang}`);
      if (!href.startsWith('https://doyouknow.app/')) errors.push(`${rel}: hreflang must be absolute ${href}`);
    }
  }
  for (const json of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(json[1]);
      if (JSON.stringify(data).includes('/category/General.html')) errors.push(`${rel}: JSON-LD references legacy General category`);
    } catch { errors.push(`${rel}: invalid JSON-LD`); }
  }
  if (html.includes('"SearchAction"')) errors.push(`${rel}: SearchAction schema present without a live search page`);
  if (html.includes('data-world-cup-live')) errors.push(`${rel}: World Cup live widget should stay disabled`);
  if (html.includes('/assets/js/world-cup-live.js')) errors.push(`${rel}: World Cup live script should stay disabled`);
  if (html.includes('/world-cup-2026-live.html')) errors.push(`${rel}: links to disabled World Cup live page`);
  if (/fonts\.(googleapis|gstatic)/.test(html)) errors.push(`${rel}: render-blocking Google Fonts dependency present`);
  if (html.includes('<script src="/assets/js/site.js"></script>')) errors.push(`${rel}: site.js should be deferred`);
  if (/class="mobile-nav" role="dialog"/.test(html)) errors.push(`${rel}: mobile nav should not use dialog role`);
  if (/<div class="tile-info"><h4>/.test(html)) errors.push(`${rel}: category tile skips heading levels`);
  if (/<div class="footer-column"><h4>/.test(html)) errors.push(`${rel}: footer column skips heading levels`);
  if (!html.includes('property="og:image"')) errors.push(`${rel}: missing Open Graph image`);
  if (html.includes('📷 Featured Image')) errors.push(`${rel}: placeholder featured image still present`);
  if (html.includes('📷</span></div><div class="card-content"')) errors.push(`${rel}: placeholder article-card image still present`);
  if (/^(en|ar)\/article\/[a-z0-9-]+\.html$/.test(rel) && !isNoindex) {
    const language = rel.startsWith('ar/') ? 'ar' : 'en';
    if (html.includes(`property="og:image" content="https://doyouknow.app/assets/images/og-${language}.png"`)) {
      errors.push(`${rel}: indexable article uses default social image`);
    }
  }
  const featuredImage = html.match(/<img class="featured-image" src="([^"]+)"/)?.[1];
  if (featuredImage && featuredImage.startsWith('/assets/images/')) {
    try { await access(join(root, featuredImage)); }
    catch { errors.push(`${rel}: missing featured image asset ${featuredImage}`); }
  }
  for (const cardImage of html.matchAll(/<img class="card-image" src="([^"]+)"/g)) {
    const src = cardImage[1];
    if (!src.startsWith('/assets/images/')) continue;
    try { await access(join(root, src)); }
    catch { errors.push(`${rel}: missing card image asset ${src}`); }
  }
  if (!html.includes('rel="icon"')) errors.push(`${rel}: missing favicon`);
  const googleTagCount = (html.match(/G-6VQZY87LJB/g) || []).length;
  if (googleTagCount !== 2) errors.push(`${rel}: expected one Google tag, found measurement ID ${googleTagCount} times`);
  if (html.includes('/doyouknow-app-site/')) errors.push(`${rel}: development path leaked`);
  for (const match of html.matchAll(/href="([^"#]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    if (/^\/(?:en|ar)\/category\/General\.html/.test(href)) errors.push(`${rel}: links to legacy General category ${href}`);
    const clean = href.split('?')[0];
    const target = clean.startsWith('/') ? join(root, clean) : join(dirname(file), clean);
    try { await access(target.endsWith('/') ? join(target, 'index.html') : target); }
    catch { errors.push(`${rel}: broken link ${href}`); }
  }
}
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrlSet = new Set(sitemapUrls);
if (sitemapUrls.length !== sitemapUrlSet.size) errors.push('sitemap.xml: duplicate URLs present');
for (const url of sitemapUrls) {
  if (!indexableCanonicals.has(url)) errors.push(`sitemap.xml: non-indexable or unknown URL included ${url}`);
  if (url.includes('/category/General.html')) errors.push(`sitemap.xml: legacy General category included ${url}`);
}
for (const canonical of indexableCanonicals) {
  if (!sitemapUrlSet.has(canonical)) errors.push(`sitemap.xml: missing indexable canonical ${canonical}`);
}
for (const canonical of noindexCanonicals) {
  if (!indexableCanonicals.has(canonical) && sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap.xml: noindex URL included ${canonical}`);
}
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  console.error(`\n${errors.length} audit error(s).`);
  process.exit(1);
}
console.log(`SEO/link audit passed for ${htmlFiles.length} HTML pages.`);
