import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const jobTmp = process.env.JOBTMP || '/Users/abdallamaklad/.claude/jobs/f082850f/tmp';
const doneSlugs = (await readFile(join(jobTmp, 'done-slugs.txt'), 'utf8'))
  .split('\n').map((s) => s.trim()).filter(Boolean);
const doneSet = new Set(doneSlugs);

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

function newImagePath(slug) {
  return `/assets/images/articles/${slug}.jpg`;
}
function newImageUrl(slug) {
  return `https://doyouknow.app${newImagePath(slug)}`;
}

function updateSocialImages(html, imageUrl) {
  html = html
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${imageUrl}">`);
  if (!html.includes('name="twitter:image"')) {
    html = html.replace(/<meta name="twitter:card" content="summary_large_image">/, `$&\n<meta name="twitter:image" content="${imageUrl}">`);
  }
  return html;
}

function updateArticleSchema(html, imageUrl) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, raw) => {
    try {
      const data = JSON.parse(raw);
      if (data['@type'] !== 'Article') return match;
      data.image = { '@type': 'ImageObject', url: imageUrl, width: 1200, height: 675 };
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return match;
    }
  });
}

function updateArticleHtml(html, { lang, slug, title }) {
  const path = newImagePath(slug);
  const url = newImageUrl(slug);
  const alt = lang === 'ar'
    ? `صورة تعبيرية لمقال ${title}`
    : `Photograph for ${title}`;

  html = updateSocialImages(html, url);
  if (html.includes('<div class="featured-image"')) {
    html = html.replace(
      /<div class="featured-image"[\s\S]*?<\/div>/,
      `<img class="featured-image" src="${path}" alt="${escapeHtml(alt)}" width="1200" height="675" loading="eager" fetchpriority="high">`
    );
  }
  html = html.replace(
    /<img\b[^>]*\bclass="[^"]*\b(?:featured-image|article-hero-image)\b[^"]*"[^>]*>/g,
    (tag) => tag.replace(/\bsrc="[^"]*"/, `src="${path}"`)
  );
  html = updateArticleSchema(html, url);
  return html;
}

function updateCardImagesForDoneSlugs(html) {
  return html.replace(/<a href="\/(en|ar)\/article\/([a-z0-9-]+)\.html" class="[^"]*\barticle-card\b[^"]*">([\s\S]*?)<div class="card-content">/g, (match, lang, slug, beforeContent) => {
    if (!doneSet.has(slug)) return match;
    const img = `<img class="card-image" src="${newImagePath(slug)}" alt="" width="1200" height="675" loading="lazy">`;
    const cleaned = beforeContent
      .replace(/<img class="card-image"[^>]*>/g, '')
      .replace(/<div class="card-image"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*>📷<\/span><\/div>/g, '');
    return `<a href="/${lang}/article/${slug}.html" class="article-card">${img}${cleaned}<div class="card-content">`;
  });
}

let articlesUpdated = 0;
for (const slug of doneSlugs) {
  for (const lang of ['en', 'ar']) {
    const path = join(root, lang, 'article', `${slug}.html`);
    let html;
    try {
      html = await readFile(path, 'utf8');
    } catch {
      continue;
    }
    if (html.includes(newImagePath(slug))) continue; // already wired
    const title = getTitle(html, slug);
    const next = updateArticleHtml(html, { lang, slug, title });
    if (next !== html) {
      await writeFile(path, next);
      articlesUpdated++;
    }
  }
}

let cardsUpdated = 0;
for (const lang of ['en', 'ar']) {
  for (const area of ['', 'category']) {
    const dir = join(root, lang, area);
    try {
      for (const file of await readdir(dir || join(root, lang))) {
        if (!file.endsWith('.html')) continue;
        const htmlPath = join(dir || join(root, lang), file);
        const html = await readFile(htmlPath, 'utf8');
        const next = updateCardImagesForDoneSlugs(html);
        if (next !== html) {
          await writeFile(htmlPath, next);
          cardsUpdated++;
        }
      }
    } catch {}
  }
}

console.log(`Wired ${articlesUpdated} article pages, updated cards in ${cardsUpdated} listing pages, for ${doneSlugs.length} done slugs.`);
