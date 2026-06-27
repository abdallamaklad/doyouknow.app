import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const imageDir = join(root, 'assets', 'images', 'articles');

const categories = [
  { lang: 'en', slug: 'dubai', files: ['burj-khalifa-facts','deep-dive-dubai','dubai-frame','dubai-metro-guide','dubai-miracle-garden','dubai-police-lamborghini','dubai-vs-abu-dhabi','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','sheikh-zayed-grand-mosque-guide','uae-imports-sand','yas-island-abu-dhabi'] },
  { lang: 'en', slug: 'guides', files: ['best-beaches-dubai','best-restaurants-dubai','save-money-dubai','start-business-dubai','uae-corporate-tax','uae-golden-visa-guide'] },
  { lang: 'en', slug: 'technology', files: ['what-is-chatgpt','what-is-google-gemini'] },
  { lang: 'ar', slug: 'saudi', files: ['alula-saudi-arabia','best-places-saudi-arabia','diriyah-saudi-arabia','edge-of-the-world-riyadh','pearl-diving-saudi','ronaldo-saudi-arabia','saudi-arabia-history','saudi-football-global','saudi-national-day','saudi-no-rivers'] },
  { lang: 'ar', slug: 'vision-2030', files: ['kingdom-tower-riyadh','qiddiya-saudi-arabia','red-sea-project-saudi','riyadh-season','the-line-neom','what-is-neom'] },
  { lang: 'ar', slug: 'guides', files: ['absher-portal-guide','best-restaurants-riyadh','open-bank-account-saudi','qiyas-guide','qobool-guide','saudi-driving-license','saudi-health-insurance'] },
  { lang: 'ar', slug: 'islamic', files: ['hajj-guide','islamic-finance-guide','ramadan-health-guide','umrah-guide','what-is-zakat'] }
];

const categoryByArticle = new Map(categories.flatMap((category) =>
  category.files.map((slug) => [`${category.lang}/${slug}`, category.slug])
));

const palettes = {
  dubai: ['#0F172A', '#0EA5E9', '#F59E0B'],
  guides: ['#123C69', '#22C55E', '#F59E0B'],
  technology: ['#111827', '#6366F1', '#06B6D4'],
  saudi: ['#052E16', '#16A34A', '#F8FAFC'],
  'vision-2030': ['#111827', '#A855F7', '#F59E0B'],
  islamic: ['#064E3B', '#14B8A6', '#FDE68A'],
  general: ['#0F172A', '#F59E0B', '#38BDF8']
};

const labels = {
  dubai: 'Dubai & UAE',
  guides: 'Practical Guide',
  technology: 'Technology',
  saudi: 'السعودية',
  'vision-2030': 'رؤية 2030',
  islamic: 'معرفة إسلامية',
  general: 'doyouknow.app'
};

const icons = {
  dubai: `<path d="M315 475V220l54-70 54 70v255M505 475V156l42-58 42 58v319M700 475V255l58-68 58 68v220" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".72"/><path d="M260 475h625" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".72"/>`,
  guides: `<path d="M350 190h392c33 0 60 27 60 60v246c0 33-27 60-60 60H350c-33 0-60-27-60-60V250c0-33 27-60 60-60Z" fill="#fff" opacity=".16"/><path d="M378 284h336M378 356h336M378 428h222" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".72"/><path d="m734 410 47 47 88-105" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>`,
  technology: `<path d="M420 175h310c44 0 80 36 80 80v220c0 44-36 80-80 80H420c-44 0-80-36-80-80V255c0-44 36-80 80-80Z" fill="#fff" opacity=".14"/><path d="M410 315c55-78 122-78 177 0s122 78 177 0M410 420c55 78 122 78 177 0s122-78 177 0" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".76"/><circle cx="502" cy="365" r="18" fill="#fff" opacity=".82"/><circle cx="672" cy="365" r="18" fill="#fff" opacity=".82"/>`,
  saudi: `<path d="M320 475h520M380 475V255h400v220M420 255v-58h320v58" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".72"/><path d="M430 330h300M430 390h300" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".62"/><path d="M360 540c116-58 284-58 400 0" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".42"/>`,
  'vision-2030': `<path d="M565 126 628 314l198 2-159 116 59 190-161-112-162 112 60-190-160-116 198-2Z" fill="#fff" opacity=".2"/><path d="M376 490c150-175 310-175 470 0" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".72"/><path d="M440 390h250M520 300h250" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".7"/>`,
  islamic: `<path d="M590 150c-92 12-163 91-163 186 0 104 84 188 188 188 77 0 143-46 172-112-31 19-68 30-107 30-113 0-205-92-205-205 0-31 7-60 19-87Z" fill="#fff" opacity=".24"/><path d="M790 190 815 250l65 5-50 42 16 64-56-34-56 34 16-64-50-42 65-5Z" fill="#fff" opacity=".7"/><path d="M330 520h520" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".55"/>`,
  general: `<circle cx="600" cy="340" r="180" fill="#fff" opacity=".14"/><path d="M500 340h200M600 240v200" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".72"/>`
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function decodeHtml(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', '’')
    .replaceAll('&#39;', '’');
}

function getTitle(html, slug) {
  return decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug);
}

function shortTitle(title, lang) {
  const limit = lang === 'ar' ? 46 : 54;
  return title.length > limit ? `${title.slice(0, limit - 1).trim()}…` : title;
}

function imagePath(lang, slug) {
  return `/assets/images/articles/${lang}-${slug}.svg`;
}

function svgFor({ lang, slug, title, category }) {
  const [bg, primary, accent] = palettes[category] || palettes.general;
  const isRtl = lang === 'ar';
  const label = labels[category] || labels.general;
  const titleX = isRtl ? 1080 : 120;
  const anchor = isRtl ? 'end' : 'start';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(title)} — doyouknow.app illustration</title>
  <desc id="desc">Original doyouknow.app editorial artwork for ${escapeHtml(title)}.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="58%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="76%" cy="22%" r="58%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="42" height="42" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.5" fill="#fff" opacity=".16"/>
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#020617" flood-opacity=".38"/>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#dots)" opacity=".72"/>
  <circle cx="884" cy="170" r="360" fill="url(#glow)"/>
  <path d="M0 520 C160 438 302 560 460 478 C632 388 772 496 936 414 C1049 357 1136 372 1200 338 L1200 675 L0 675Z" fill="#fff" opacity=".13"/>
  <g filter="url(#shadow)" transform="translate(0 0)">
    ${icons[category] || icons.general}
  </g>
  <g transform="translate(0 0)" direction="${isRtl ? 'rtl' : 'ltr'}">
    <text x="${titleX}" y="122" text-anchor="${anchor}" fill="#fff" opacity=".82" font-family="Inter, Cairo, Tajawal, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="3">DOYOUKNOW.APP</text>
    <text x="${titleX}" y="202" text-anchor="${anchor}" fill="#fff" font-family="Inter, Cairo, Tajawal, Arial, sans-serif" font-size="56" font-weight="900">${escapeHtml(shortTitle(title, lang))}</text>
    <text x="${titleX}" y="262" text-anchor="${anchor}" fill="#fff" opacity=".86" font-family="Inter, Cairo, Tajawal, Arial, sans-serif" font-size="30" font-weight="700">${escapeHtml(label)}</text>
    <rect x="${isRtl ? 760 : 120}" y="300" width="320" height="8" rx="4" fill="${accent}"/>
  </g>
  <g transform="translate(120 542)">
    <rect width="386" height="58" rx="29" fill="#fff" opacity=".14"/>
    <text x="32" y="38" fill="#fff" font-family="Inter, Cairo, Tajawal, Arial, sans-serif" font-size="24" font-weight="800">${escapeHtml(label)}</text>
  </g>
</svg>
`;
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
  const path = imagePath(lang, slug);
  const url = `https://doyouknow.app${path}`;
  const alt = lang === 'ar'
    ? `رسم توضيحي لمقال ${title}`
    : `Editorial illustration for ${title}`;

  html = updateSocialImages(html, url);
  html = html.replace(
    /<div class="featured-image"[\s\S]*?<\/div>/,
    `<img class="featured-image" src="${path}" alt="${escapeHtml(alt)}" width="1200" height="675" loading="eager" fetchpriority="high">`
  );
  html = updateArticleSchema(html, url);
  return html;
}

function updateCardImages(html) {
  return html.replace(/<a href="\/(en|ar)\/article\/([a-z0-9-]+)\.html" class="article-card">([\s\S]*?)<div class="card-content">/g, (match, lang, slug, beforeContent) => {
    if (!categoryByArticle.has(`${lang}/${slug}`)) return match;
    const img = `<img class="card-image" src="${imagePath(lang, slug)}" alt="" width="1200" height="675" loading="lazy">`;
    const cleaned = beforeContent
      .replace(/<img class="card-image"[^>]*>/g, '')
      .replace(/<div class="card-image"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*>📷<\/span><\/div>/g, '');
    return `<a href="/${lang}/article/${slug}.html" class="article-card">${img}${cleaned}<div class="card-content">`;
  });
}

await mkdir(imageDir, { recursive: true });

const updated = [];
for (const lang of ['en', 'ar']) {
  const dir = join(root, lang, 'article');
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.html')) continue;
    const slug = file.replace('.html', '');
    const category = categoryByArticle.get(`${lang}/${slug}`);
    if (!category) continue;
    const articlePath = join(dir, file);
    let html = await readFile(articlePath, 'utf8');
    if (!html.includes('📷 Featured Image') && html.includes(imagePath(lang, slug))) continue;
    const title = getTitle(html, slug);
    await writeFile(join(imageDir, `${lang}-${slug}.svg`), svgFor({ lang, slug, title, category }));
    html = updateArticleHtml(html, { lang, slug, title });
    await writeFile(articlePath, html);
    updated.push(`${lang}/${slug}`);
  }
}

for (const lang of ['en', 'ar']) {
  for (const area of ['', 'category']) {
    const dir = join(root, lang, area);
    try {
      for (const file of await readdir(dir || join(root, lang))) {
        if (!file.endsWith('.html')) continue;
        const htmlPath = join(dir || join(root, lang), file);
        const html = await readFile(htmlPath, 'utf8');
        const next = updateCardImages(html);
        if (next !== html) await writeFile(htmlPath, next);
      }
    } catch {}
  }
}

console.log(`Added article images for ${updated.length} pages.`);
