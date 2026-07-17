import { readdir, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const siteOrigin = 'https://doyouknow.app';

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasArabic(value) {
  return /[\u0600-\u06FF]/.test(value);
}

function localPathFromSiteUrl(url) {
  const parsed = new URL(url);
  if (parsed.origin !== siteOrigin) return null;
  let pathname = decodeURI(parsed.pathname).replace(/^\/+/, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
  return pathname;
}

function localPathFromRootUrl(url) {
  const clean = url.split('?')[0].split('#')[0];
  const pathname = decodeURI(clean).replace(/^\/+/, '');
  if (!pathname || pathname.endsWith('/')) return `${pathname}index.html`;
  return pathname;
}

function absoluteUrl(relativePath) {
  if (relativePath === 'index.html') return `${siteOrigin}/`;
  if (relativePath === 'en/index.html') return `${siteOrigin}/en/`;
  if (relativePath === 'ar/index.html') return `${siteOrigin}/ar/`;
  return `${siteOrigin}/${relativePath}`;
}

async function htmlFilenames(dir) {
  try {
    return new Set((await readdir(join(root, dir))).filter((name) => name.endsWith('.html')));
  } catch {
    return new Set();
  }
}

function hreflangMap(html) {
  return new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" ?\/?>/g)]
    .map(([, hreflang, href]) => [hreflang, href]));
}

function extractServiceWorkerPrecacheUrls(swSource) {
  const urls = new Set();
  const arrayPattern = /const\s+(CORE_URLS|EN_ARTICLES|AR_ARTICLES|PRECACHE_URLS)\s*=\s*\[([\s\S]*?)\];/g;
  for (const [, , body] of swSource.matchAll(arrayPattern)) {
    for (const [, url] of body.matchAll(/['"]([^'"]+)['"]/g)) {
      urls.add(url);
    }
  }
  return [...urls];
}

function extractConstArray(source, name) {
  const declaration = `const ${name} = [`;
  const start = source.indexOf(declaration);
  if (start === -1) throw new Error(`scripts/prepare.mjs: missing ${name}`);
  let depth = 0;
  let quote = '';
  let escaped = false;
  const arrayStart = source.indexOf('[', start);
  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart, index + 1);
    }
  }
  throw new Error(`scripts/prepare.mjs: could not parse ${name}`);
}

function extractCategoryGroups(prepareSource) {
  const worldCupArticleSlugs = Function(`return ${extractConstArray(prepareSource, 'worldCupArticleSlugs')}`)();
  const worldCupCategorySlugs = [...worldCupArticleSlugs, 'arab-teams-world-cup-2026-pillar'];
  return Function(
    'worldCupArticleSlugs',
    'worldCupCategorySlugs',
    `return ${extractConstArray(prepareSource, 'categoryGroups')}`
  )(worldCupArticleSlugs, worldCupCategorySlugs);
}

const ignoredOutboundHosts = new Set([
  'doyouknow.app',
  'www.doyouknow.app',
  'www.googletagmanager.com',
  'googletagmanager.com',
  'www.google-analytics.com',
  'google-analytics.com',
  'analytics.google.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

function sourceCitationSection(html) {
  const sectionMatch = html.match(/<section\b[^>]*class="[^"]*\bsources-section\b[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  if (sectionMatch) return sectionMatch[1];
  const headingMatch = html.match(/<h2\b[^>]*id="(?:sources|[^"]*مصادر[^"]*)"[^>]*>[\s\S]*?(?=<h2\b|<footer\b|<\/article>|$)/i);
  return headingMatch?.[0] || '';
}

function outboundCitationHosts(html) {
  const sourceHtml = sourceCitationSection(html);
  const hosts = new Set();
  for (const [, href] of sourceHtml.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    if (!/^https?:\/\//.test(href)) continue;
    try {
      const host = new URL(href).hostname.toLowerCase();
      if (!ignoredOutboundHosts.has(host)) hosts.add(host);
    } catch {}
  }
  return hosts;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'scripts' || entry.name === '.claude') continue;
    const path = join(dir, entry.name);
    entry.isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const errors = [];
const canonicals = new Map();
const indexableTitles = new Map();
const noindexCanonicals = [];
const indexableCanonicals = new Set();
const enArticleFiles = await htmlFilenames('en/article');
const arArticleFiles = await htmlFilenames('ar/article');
const prepareSource = await readFile(join(root, 'scripts/prepare.mjs'), 'utf8');
const categoryGroups = extractCategoryGroups(prepareSource);
const categorizedArticles = new Set(categoryGroups.flatMap((group) =>
  group.files.map((slug) => `${group.lang}/article/${slug}.html`)
));
for (const [language, articleFiles] of [['en', enArticleFiles], ['ar', arArticleFiles]]) {
  for (const filename of articleFiles) {
    const articlePath = `${language}/article/${filename}`;
    if (!categorizedArticles.has(articlePath)) {
      errors.push(`${articlePath}: article is not assigned to any categoryGroups entry`);
    }
  }
}
const pairedArticlePaths = new Map();
for (const filename of enArticleFiles) {
  if (!arArticleFiles.has(filename)) continue;
  pairedArticlePaths.set(`en/article/${filename}`, `ar/article/${filename}`);
  pairedArticlePaths.set(`ar/article/${filename}`, `en/article/${filename}`);
}
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = file.slice(root.length);
  if (/^(en|ar)\/category\/General\.html$/.test(rel)) errors.push(`${rel}: legacy General category page should not exist`);
  const isNoindex = html.includes('name="robots" content="noindex');
  for (const required of ['<html lang=', '<title>', 'name="description"', 'rel="canonical"', '<h1']) {
    if (!html.includes(required)) errors.push(`${rel}: missing ${required}`);
  }
  const h1Count = (html.match(/<h1(?=[\s>])/g) || []).length;
  if (h1Count !== 1) errors.push(`${rel}: expected exactly one h1, found ${h1Count}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
  const h1Text = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || '');
  if (title.length < 15 || title.length > 80) errors.push(`${rel}: title length ${title.length} outside 15–80`);
  if (description.length < 40 || description.length > 180) errors.push(`${rel}: description length ${description.length} outside 40–180`);
  if (description.trim() === '...') errors.push(`${rel}: placeholder meta description`);
  if (html.includes('<p class="card-excerpt">...</p>')) errors.push(`${rel}: placeholder card excerpt`);
  if (rel.startsWith('ar/') && !hasArabic(title)) errors.push(`${rel}: Arabic page title does not contain Arabic text`);
  if (rel.startsWith('ar/') && !rel.endsWith('404.html') && !hasArabic(h1Text)) errors.push(`${rel}: Arabic page h1 does not contain Arabic text`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (canonical && !canonical.startsWith('https://doyouknow.app/')) errors.push(`${rel}: canonical must be absolute`);
  if (canonical?.startsWith(`${siteOrigin}/`)) {
    const canonicalLocalPath = localPathFromSiteUrl(canonical);
    try { await access(join(root, canonicalLocalPath)); }
    catch { errors.push(`${rel}: canonical target does not exist ${canonical}`); }
  }
  if (canonical && !isNoindex) {
    if (canonicals.has(canonical)) errors.push(`${rel}: duplicate canonical also used by ${canonicals.get(canonical)}`);
    canonicals.set(canonical, rel);
    if (indexableTitles.has(title)) errors.push(`${rel}: duplicate indexable title also used by ${indexableTitles.get(title)}: ${title}`);
    indexableTitles.set(title, rel);
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
  const pairedArticlePath = pairedArticlePaths.get(rel);
  if (pairedArticlePath) {
    const hreflangByLanguage = hreflangMap(html);
    const pairedLanguage = pairedArticlePath.startsWith('ar/') ? 'ar' : 'en';
    const pairedUrl = absoluteUrl(pairedArticlePath);
    if (hreflangByLanguage.get(pairedLanguage) !== pairedUrl) {
      errors.push(`${rel}: missing cross-language hreflang ${pairedLanguage} -> ${pairedUrl}`);
    } else {
      const pairedHtml = await readFile(join(root, pairedArticlePath), 'utf8');
      const reciprocalLanguage = rel.startsWith('ar/') ? 'ar' : 'en';
      const reciprocalUrl = absoluteUrl(rel);
      const pairedHreflangs = hreflangMap(pairedHtml);
      if (pairedHreflangs.get(reciprocalLanguage) !== reciprocalUrl) {
        errors.push(`${rel}: hreflang is not reciprocal from ${pairedArticlePath}`);
      }
    }
  }
  for (const json of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(json[1]);
      if (JSON.stringify(data).includes('/category/General.html')) errors.push(`${rel}: JSON-LD references legacy General category`);
      if (/^(en|ar)\/article\/[a-z0-9-]+\.html$/.test(rel) && data['@type'] === 'Article') {
        const schemaPageId = typeof data.mainEntityOfPage === 'object'
          ? data.mainEntityOfPage?.['@id']
          : data.mainEntityOfPage;
        if (canonical && schemaPageId && schemaPageId !== canonical) {
          errors.push(`${rel}: Article mainEntityOfPage.@id does not match canonical (${schemaPageId} !== ${canonical})`);
        }
      }
    } catch { errors.push(`${rel}: invalid JSON-LD`); }
  }
  if (html.includes('"SearchAction"')) errors.push(`${rel}: SearchAction schema present without a live search page`);
  if (html.includes('data-world-cup-live')) errors.push(`${rel}: World Cup live widget should stay disabled`);
  if (html.includes('/assets/js/world-cup-live.js')) errors.push(`${rel}: World Cup live script should stay disabled`);
  if (html.includes('/world-cup-2026-live.html')) errors.push(`${rel}: links to disabled World Cup live page`);
  if (/<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css/.test(html)) errors.push(`${rel}: render-blocking Google Fonts dependency present`);
  if (/fonts\.(?:googleapis|gstatic)\.com/.test(html)) errors.push(`${rel}: dead Google Fonts hint present`);
  if (html.includes('<script src="/assets/js/site.js"></script>')) errors.push(`${rel}: site.js should be deferred`);
  if (/class="mobile-nav" role="dialog"/.test(html)) errors.push(`${rel}: mobile nav should not use dialog role`);
  if (/<div class="tile-info"><h4>/.test(html)) errors.push(`${rel}: category tile skips heading levels`);
  if (/<div class="footer-column"><h4>/.test(html)) errors.push(`${rel}: footer column skips heading levels`);
  if (!html.includes('property="og:image"')) errors.push(`${rel}: missing Open Graph image`);
  if (html.includes('📷 Featured Image')) errors.push(`${rel}: placeholder featured image still present`);
  if (html.includes('📷</span></div><div class="card-content"')) errors.push(`${rel}: placeholder article-card image still present`);
  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = img[0];
    const alt = tag.match(/\balt="([^"]*)"/);
    const isDecorativeCardImage = /\bclass="[^"]*\bcard-image\b/.test(tag) && alt && alt[1] === '';
    if ((!alt || !alt[1].trim()) && !isDecorativeCardImage) {
      errors.push(`${rel}: image missing non-empty alt text ${tag.slice(0, 120)}`);
    }
  }
  if (/^(en|ar)\/article\/[a-z0-9-]+\.html$/.test(rel) && !isNoindex) {
    const language = rel.startsWith('ar/') ? 'ar' : 'en';
    if (html.includes(`property="og:image" content="https://doyouknow.app/assets/images/og-${language}.png"`)) {
      errors.push(`${rel}: indexable article uses default social image`);
    }
    const sourceHosts = outboundCitationHosts(html);
    if (sourceHosts.size < 2) {
      errors.push(`${rel}: indexable article has fewer than 2 unique outbound source domains`);
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
const serviceWorker = await readFile(join(root, 'sw.js'), 'utf8');
for (const url of extractServiceWorkerPrecacheUrls(serviceWorker)) {
  if (!url.startsWith('/')) continue;
  const localPath = localPathFromRootUrl(url);
  try { await access(join(root, localPath)); }
  catch { errors.push(`sw.js: precache URL target does not exist ${url} -> ${localPath}`); }
}
try {
  await access(join(root, 'assets/js/search-index.json'));
  errors.push('assets/js/search-index.json: old combined search index should not exist');
} catch {}

for (const expectedLanguage of ['en', 'ar']) {
  const searchIndexFile = `assets/js/search-index.${expectedLanguage}.json`;
  const searchIndex = JSON.parse(await readFile(join(root, searchIndexFile), 'utf8'));
  if (searchIndex.count !== searchIndex.articles.length) errors.push(`${searchIndexFile}: count does not match article length`);
  for (const article of searchIndex.articles) {
    if (!article.url?.startsWith(`${siteOrigin}/`)) {
      errors.push(`${searchIndexFile}: non-site URL ${article.url}`);
      continue;
    }
    const localPath = localPathFromSiteUrl(article.url);
    if (!localPath?.startsWith(`${expectedLanguage}/`)) {
      errors.push(`${searchIndexFile}: wrong-language URL included ${article.url}`);
    }
    if (article.language !== expectedLanguage) {
      errors.push(`${searchIndexFile}: wrong language field ${article.language} for ${article.url}`);
    }
    let indexedHtml = '';
    try { indexedHtml = await readFile(join(root, localPath), 'utf8'); }
    catch {
      errors.push(`${searchIndexFile}: indexed URL target does not exist ${article.url}`);
      continue;
    }
    if (indexedHtml.includes('name="robots" content="noindex')) {
      errors.push(`${searchIndexFile}: noindex URL included ${article.url}`);
    }
    if (localPath.startsWith('ar/') && !hasArabic(article.title || '')) {
      errors.push(`${searchIndexFile}: Arabic result has non-Arabic title ${article.url}`);
    }
    if (localPath.startsWith('ar/') && !hasArabic(article.excerpt || '')) {
      errors.push(`${searchIndexFile}: Arabic result has non-Arabic excerpt ${article.url}`);
    }
    if ([article.title, article.description, article.excerpt].some((value) => String(value || '').trim() === '...')) {
      errors.push(`${searchIndexFile}: placeholder text included ${article.url}`);
    }
  }
}
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  console.error(`\n${errors.length} audit error(s).`);
  process.exit(1);
}
console.log(`SEO/link audit passed for ${htmlFiles.length} HTML pages.`);
