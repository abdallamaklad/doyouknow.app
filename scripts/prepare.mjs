import { readdir, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url).pathname;
const googleTag = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6VQZY87LJB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6VQZY87LJB');
</script>`;

const editorialReview = new Set([
  'en/article/why-is-dubai-rich.html',
  'ar/article/why-is-dubai-rich.html',
  'en/article/uae-free-zones-comparison.html',
  'ar/article/uae-free-zones-comparison.html',
  'en/article/uae-vs-saudi-business-setup.html',
  'ar/article/uae-vs-saudi-business-setup.html',
  'en/article/golden-visa-investor-track.html',
  'ar/article/golden-visa-investor-track.html',
  'en/article/dubai-company-registration-cost.html',
  'ar/article/dubai-company-registration-cost.html',
  'en/article/saudi-sme-support-programs.html',
  'ar/article/saudi-sme-support-programs.html',
  'en/article/what-is-chatgpt.html',
  'en/article/what-is-google-gemini.html',
  'en/article/hajj-guide.html',
  'en/article/islamic-finance-guide.html',
  'en/article/ramadan-health-guide.html',
  'en/article/umrah-guide.html',
  'en/article/what-is-zakat.html'
]);
const removedContent = new Set([
  'en/article/10-facts-about-uae-formation.html',
  'en/article/bedouin-culture-uae.html',
  'en/article/falconry-uae-tradition.html',
  'en/article/history-pearl-diving-uae.html',
  'en/article/sheikh-zayed-biography.html',
  'en/article/trucial-states-history.html',
  'en/article/uae-minister-happiness.html',
  'en/article/uae-national-day.html',
  'en/category/uae.html'
]);
const removedArticleSlugs = [...removedContent]
  .filter((path) => path.startsWith('en/article/'))
  .map((path) => path.split('/').at(-1).replace('.html', ''));
const worldCupArticleSlugs = [
  'morocco-world-cup-2026',
  'egypt-world-cup-2026',
  'saudi-arabia-world-cup-2026',
  'tunisia-world-cup-2026',
  'algeria-world-cup-2026',
  'iraq-world-cup-2026',
  'jordan-world-cup-2026',
  'qatar-world-cup-2026',
  'arab-teams-world-cup-2026',
  'morocco-defensive-structure-world-cup-2026',
  'egypt-midfield-world-cup-2026',
  'saudi-technical-ceiling-world-cup-2026',
  'tunisia-defensive-grit-world-cup-2026',
  'algeria-attack-world-cup-2026',
  'iraq-jordan-tournament-discipline-world-cup-2026',
  'arab-team-semifinals-world-cup-2026',
  'world-cup-2026-group-stage-pressure-arab-teams',
  'morocco-egypt-algeria-world-cup-2026',
  'arab-fans-world-cup-2026',
  'arab-football-legacy-world-cup-2026'
];
const worldCupCategorySlugs = [...worldCupArticleSlugs, 'arab-teams-world-cup-2026-pillar'];
const categoryGroups = [
  { lang: 'en', slug: 'world-cup-2026', title: 'World Cup 2026 & Arab Football', description: 'Bilingual World Cup 2026 explainers focused on Arab teams, tactics, fans, and football legacy.', files: worldCupCategorySlugs },
  { lang: 'en', slug: 'dubai', title: 'Dubai & UAE Places', description: 'Discover Dubai and Abu Dhabi landmarks, engineering stories, cultural destinations, and practical travel inspiration.', files: ['abu-dhabi-complete-guide','best-time-visit-dubai','burj-khalifa-facts','deep-dive-dubai','dubai-art-culture-scene','dubai-frame','dubai-free-zones-guide','dubai-metro-guide','dubai-miracle-garden','dubai-police-lamborghini','dubai-vs-abu-dhabi','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','sheikh-zayed-grand-mosque-guide','things-to-do-dubai-this-week','uae-imports-sand','yas-island-abu-dhabi'] },
  { lang: 'en', slug: 'guides', title: 'UAE Practical Guides', description: 'Clear UAE guides for residents, visitors, professionals, and anyone planning a major decision in the Emirates.', files: ['best-beach-clubs-dubai','best-beaches-dubai','best-brunches-dubai','best-restaurants-dubai','dubai-day-trips','dubai-driving-car-guide','dubai-families-guide','dubai-fitness-outdoor-guide','dubai-free-things-to-do','dubai-nightlife-guide','dubai-parking-guide','dubai-shopping-guide','dubai-tourist-visa-guide','dubai-water-parks-guide','save-money-dubai','start-business-dubai','uae-corporate-tax','uae-golden-visa-guide'] },
  { lang: 'en', slug: 'technology', title: 'Technology Explained', description: 'Plain-language introductions to important artificial intelligence tools and the technology changing everyday life.', files: ['what-is-chatgpt','what-is-google-gemini'] },
  { lang: 'en', slug: 'islamic', title: 'Islamic Knowledge & Culture', description: 'Clear English explainers on Islamic practice, finance, and religious seasons, written with care and sourced from authoritative institutions.', files: ['hajj-guide','islamic-finance-guide','ramadan-health-guide','umrah-guide','what-is-zakat'] },
  { lang: 'en', slug: 'business', title: 'Business & Marketing', description: 'Practical business, marketing, and market-entry guides for professionals working across Arabic-speaking markets.', files: ['arabic-facebook-ads-guide','cold-email-startup-guide','dubai-company-registration-cost','golden-visa-investor-track','saudi-ai-market-entry-guide','saudi-sme-support-programs','uae-free-zones-comparison','uae-vs-saudi-business-setup','why-is-dubai-rich'] },
  { lang: 'en', slug: 'saudi-guides', title: 'Saudi Practical Guides', description: 'Clear English guides to essential Saudi government services and procedures, from Absher and Qiyas to driving licenses and bank accounts.', files: ['absher-portal-guide','open-bank-account-saudi','qiyas-guide','qobool-guide','saudi-driving-license','saudi-health-insurance'] },
  { lang: 'en', slug: 'saudi', title: 'Saudi Arabia', description: 'Discover Saudi Arabia\'s history, culture, landscapes, and travel experiences through clear, reliable guides.', files: ['alula-saudi-arabia','best-places-saudi-arabia','best-restaurants-riyadh','complete-saudi-travel-guide','diriyah-saudi-arabia','edge-of-the-world-riyadh','jeddah-travel-guide','pearl-diving-saudi','riyadh-complete-guide','riyadh-nightlife-guide','ronaldo-saudi-arabia','saudi-arabia-history','saudi-archaeology-ancient-sites-guide','saudi-asir-abha-guide','saudi-coffee-culture-guide','saudi-cuisine-guide','saudi-desert-camping','saudi-e-visa-guide','saudi-eastern-province-guide','saudi-education-system-guide','saudi-football-global','saudi-hail-northern-region-guide','saudi-national-day','saudi-no-rivers','saudi-red-sea-coast-guide','saudi-tabuk-neom-region-guide','saudi-traditional-crafts-souks-guide','saudi-traditional-dress-culture-guide','saudi-wildlife-nature-reserves-guide'] },
  { lang: 'en', slug: 'vision-2030', title: 'Saudi Vision 2030 & Megaprojects', description: 'Clear explainers on Saudi Vision 2030, NEOM, and the megaprojects reshaping the Kingdom.', files: ['neom-city-facts','saudi-vision-2030-guide','what-is-neom','the-line-neom','red-sea-project-saudi','kingdom-tower-riyadh','riyadh-season','qiddiya-saudi-arabia'] },
  { lang: 'ar', slug: 'world-cup-2026', title: 'كأس العالم 2026 والكرة العربية', description: 'شروحات عربية وإنجليزية عن كأس العالم 2026 والمنتخبات العربية والتكتيك والجمهور والإرث الكروي.', files: worldCupCategorySlugs },
  { lang: 'ar', slug: 'dubai', title: 'دبي والإمارات', description: 'اكتشف دبي وأبوظبي والإمارات من خلال أدلة عربية واضحة عن المعالم، الهندسة، والوجهات السياحية والعملية.', files: ['abu-dhabi-complete-guide','best-beach-clubs-dubai','best-beaches-dubai','best-brunches-dubai','best-restaurants-dubai','best-time-visit-dubai','burj-khalifa-facts','deep-dive-dubai','dubai-art-culture-scene','dubai-day-trips','dubai-driving-car-guide','dubai-families-guide','dubai-fitness-outdoor-guide','dubai-frame','dubai-free-things-to-do','dubai-free-zones-guide','dubai-metro-guide','dubai-miracle-garden','dubai-nightlife-guide','dubai-parking-guide','dubai-police-lamborghini','dubai-shopping-guide','dubai-tourist-visa-guide','dubai-vs-abu-dhabi','dubai-water-parks-guide','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','save-money-dubai','sheikh-zayed-grand-mosque-guide','things-to-do-dubai-this-week','uae-imports-sand','yas-island-abu-dhabi'] },
  { lang: 'ar', slug: 'business', title: 'الأعمال والتسويق', description: 'أدلة عملية في الأعمال والتسويق ودخول الأسواق للمحترفين في الأسواق العربية والسعودية.', files: ['arabic-facebook-ads-guide','cold-email-startup-guide','dubai-company-registration-cost','golden-visa-investor-track','saudi-ai-market-entry-guide','saudi-sme-support-programs','start-business-dubai','uae-corporate-tax','uae-free-zones-comparison','uae-golden-visa-guide','uae-vs-saudi-business-setup','why-is-dubai-rich'] },
  { lang: 'ar', slug: 'technology', title: 'التقنية', description: 'شروحات عربية واضحة لأهم أدوات الذكاء الاصطناعي والتقنيات التي تغيّر حياتنا اليومية.', files: ['what-is-chatgpt','what-is-google-gemini'] },
  { lang: 'ar', slug: 'saudi', title: 'السعودية: التاريخ والثقافة', description: 'اكتشف تاريخ المملكة العربية السعودية وتراثها ومدنها وثقافتها من خلال مقالات عربية واضحة وموثوقة.', files: ['alula-saudi-arabia','best-places-saudi-arabia','complete-saudi-travel-guide','diriyah-saudi-arabia','edge-of-the-world-riyadh','jeddah-travel-guide','pearl-diving-saudi','riyadh-complete-guide','riyadh-nightlife-guide','ronaldo-saudi-arabia','saudi-arabia-history','saudi-archaeology-ancient-sites-guide','saudi-asir-abha-guide','saudi-coffee-culture-guide','saudi-cuisine-guide','saudi-desert-camping','saudi-eastern-province-guide','saudi-education-system-guide','saudi-football-global','saudi-hail-northern-region-guide','saudi-national-day','saudi-no-rivers','saudi-red-sea-coast-guide','saudi-tabuk-neom-region-guide','saudi-traditional-crafts-souks-guide','saudi-traditional-dress-culture-guide','saudi-wildlife-nature-reserves-guide'] },
  { lang: 'ar', slug: 'vision-2030', title: 'رؤية السعودية 2030 والمشاريع الكبرى', description: 'تعرف على مشاريع رؤية السعودية 2030 والمدن والوجهات الجديدة من خلال شروحات تفصل الحقائق عن التوقعات.', files: ['kingdom-tower-riyadh','neom-city-facts','qiddiya-saudi-arabia','red-sea-project-saudi','riyadh-season','saudi-vision-2030-guide','the-line-neom','what-is-neom'] },
  { lang: 'ar', slug: 'guides', title: 'أدلة عملية في السعودية', description: 'أدلة عربية مبسطة للخدمات والمنصات والإجراءات المهمة في السعودية مع إحالات إلى المصادر الرسمية.', files: ['absher-portal-guide','best-restaurants-riyadh','open-bank-account-saudi','qiyas-guide','qobool-guide','saudi-driving-license','saudi-e-visa-guide','saudi-health-insurance'] },
  { lang: 'ar', slug: 'islamic', title: 'الثقافة والمعرفة الإسلامية', description: 'شروحات عربية واضحة حول العبادات والتمويل الإسلامي والمواسم الدينية مع احترام السياق والمصادر الموثوقة.', files: ['hajj-guide','islamic-finance-guide','ramadan-health-guide','umrah-guide','what-is-zakat'] }
];
const categoryByArticle = new Map(categoryGroups.flatMap((group) =>
  group.files.map((slug) => [`${group.lang}/article/${slug}.html`, group])
));
const knownCategoryHrefs = new Set(categoryGroups.map((group) => `/${group.lang}/category/${group.slug}.html`));
const categoryFallback = new Map([
  ['en', { lang: 'en', slug: 'dubai', title: 'Dubai & UAE Places' }],
  ['ar', { lang: 'ar', slug: 'saudi', title: 'السعودية: التاريخ والثقافة' }]
]);
const pairedPages = new Map([
  ['en/', 'ar/'],
  ['ar/', 'en/'],
  ['en/about.html', 'ar/about.html'],
  ['ar/about.html', 'en/about.html'],
  ['en/contact.html', 'ar/contact.html'],
  ['ar/contact.html', 'en/contact.html'],
  ['en/privacy.html', 'ar/privacy.html'],
  ['ar/privacy.html', 'en/privacy.html'],
  ['en/terms.html', 'ar/terms.html'],
  ['ar/terms.html', 'en/terms.html'],
  ['en/work-with-us.html', 'ar/work-with-us.html'],
  ['ar/work-with-us.html', 'en/work-with-us.html'],
  ['en/newsletter-template.html', 'ar/newsletter-template.html'],
  ['ar/newsletter-template.html', 'en/newsletter-template.html']
]);
pairedPages.set('en/category/world-cup-2026.html', 'ar/category/world-cup-2026.html');
pairedPages.set('ar/category/world-cup-2026.html', 'en/category/world-cup-2026.html');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    entry.isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

async function addSameSlugArticlePairs() {
  const enArticleFiles = new Set((await readdir(join(root, 'en/article'))).filter((name) => name.endsWith('.html')));
  const arArticleFiles = new Set((await readdir(join(root, 'ar/article'))).filter((name) => name.endsWith('.html')));
  for (const filename of enArticleFiles) {
    if (!arArticleFiles.has(filename)) continue;
    pairedPages.set(`en/article/${filename}`, `ar/article/${filename}`);
    pairedPages.set(`ar/article/${filename}`, `en/article/${filename}`);
  }
}

await addSameSlugArticlePairs();

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function absoluteUrl(relativePath) {
  if (relativePath === 'index.html') return 'https://doyouknow.app/';
  if (relativePath === 'en/index.html') return 'https://doyouknow.app/en/';
  if (relativePath === 'ar/index.html') return 'https://doyouknow.app/ar/';
  return `https://doyouknow.app/${relativePath}`;
}

function canonicalPathFromRelative(relativePath) {
  if (relativePath === 'en/index.html') return 'en/';
  if (relativePath === 'ar/index.html') return 'ar/';
  return relativePath;
}

function hreflangBlock(relativePath, lang, canonical) {
  const canonicalPath = canonicalPathFromRelative(relativePath);
  const alternates = [{ hreflang: lang, href: canonical }];
  const paired = pairedPages.get(canonicalPath);
  if (paired) {
    alternates.push({ hreflang: paired.startsWith('ar/') ? 'ar' : 'en', href: absoluteUrl(paired === 'en/' ? 'en/index.html' : paired === 'ar/' ? 'ar/index.html' : paired) });
  }
  alternates.push({ hreflang: 'x-default', href: lang === 'ar' ? 'https://doyouknow.app/ar/' : 'https://doyouknow.app/en/' });
  const deduped = new Map(alternates.map((alternate) => [`${alternate.hreflang}:${alternate.href}`, alternate]));
  return [...deduped.values()].map((alternate) => `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`).join('\n');
}

function normalizeHreflang(html, relativePath) {
  const lang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || absoluteUrl(relativePath);
  const block = hreflangBlock(relativePath, lang, canonical);
  html = html.replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+" ?\/?>\s*/g, '');
  return html.replace(/(<link rel="canonical" href="[^"]+">)/, `$1\n${block}`);
}

function addRevealClasses(html, className) {
  let count = 0;
  return html.replace(new RegExp(`class="${className}"`, 'g'), () => {
    count += 1;
    const delay = ((count - 1) % 3) + 1;
    return `class="${className} reveal reveal-delay-${delay}"`;
  });
}

function stripSearchAction(html) {
  return html.replace(/<script type="application\/ld\+json">(?=[\s\S]*?"SearchAction")[\s\S]*?<\/script>\s*/g, '');
}

function articleImagePath(lang, slug) {
  return worldCupArticleSlugs.includes(slug)
    ? `/assets/images/world-cup-2026/${slug}.svg`
    : `/assets/images/articles/${lang}-${slug}.svg`;
}

function articleRasterImagePath(lang, slug) {
  return worldCupArticleSlugs.includes(slug)
    ? `/assets/images/world-cup-2026/${slug}.png`
    : `/assets/images/articles/${lang}-${slug}.png`;
}

function updateSocialImageTags(html, imageUrl) {
  html = html
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${imageUrl}">`);
  if (!html.includes('name="twitter:image"')) {
    html = html.replace(/<meta name="twitter:card" content="summary_large_image">/, `$&\n<meta name="twitter:image" content="${imageUrl}">`);
  }
  return html;
}

function updateArticlePageImage(html, relativeFile) {
  const match = relativeFile.match(/^(en|ar)\/article\/([a-z0-9-]+)\.html$/);
  if (!match) return html;
  const [, lang, slug] = match;
  const imagePath = articleImagePath(lang, slug);
  const isIndexable = !editorialReview.has(relativeFile);
  const socialImagePath = isIndexable ? articleRasterImagePath(lang, slug) : imagePath;
  const socialImageUrl = `https://doyouknow.app${socialImagePath}`;
  html = updateSocialImageTags(html, socialImageUrl);
  if (categoryByArticle.has(relativeFile)) {
    const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug;
    const alt = lang === 'ar' ? `رسم توضيحي لمقال ${title}` : `Editorial illustration for ${title}`;
    html = html.replace(
      /<div class="featured-image"[\s\S]*?<\/div>/,
      `<img class="featured-image" src="${imagePath}" alt="${escapeHtml(alt)}" width="1200" height="675" loading="eager" fetchpriority="high">`
    );
  }
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (script, raw) => {
    try {
      const data = JSON.parse(raw);
      if (data['@type'] !== 'Article') return script;
      const isRaster = socialImageUrl.endsWith('.png');
      data.image = { '@type': 'ImageObject', url: socialImageUrl, width: 1200, height: isRaster ? 630 : 675 };
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return script;
    }
  });
  return html;
}

function updateArticleCardImages(html) {
  let cardIndex = 0;
  return html.replace(/<a href="\/(en|ar)\/article\/([a-z0-9-]+)\.html" class="article-card">([\s\S]*?)<div class="card-content">/g, (match, lang, slug, beforeContent) => {
    if (!categoryByArticle.has(`${lang}/article/${slug}.html`)) return match;
    cardIndex += 1;
    const priority = cardIndex <= 3
      ? 'loading="eager" fetchpriority="high"'
      : 'loading="lazy"';
    const image = `<img class="card-image" src="${articleImagePath(lang, slug)}" alt="" width="800" height="450" ${priority}>`;
    const cleaned = beforeContent
      .replace(/<img class="card-image"[^>]*>/g, '')
      .replace(/<div class="card-image"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*>📷<\/span><\/div>/g, '');
    return `<a href="/${lang}/article/${slug}.html" class="article-card">${image}${cleaned}<div class="card-content">`;
  });
}

function optimizeImageAttributes(html) {
  let imgIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, (match) => {
    imgIndex++;
    const isFirst = imgIndex === 1;

    const hasFetchpriority = /fetchpriority\s*=\s*["']/.test(match);
    const hasLoading = /loading\s*=\s*["']/.test(match);
    const hasWidth = /width\s*=\s*["']/.test(match);
    const hasHeight = /height\s*=\s*["']/.test(match);
    const hasDecoding = /decoding\s*=\s*["']/.test(match);

    const attrsToAdd = [];

    if (isFirst) {
      if (!hasFetchpriority) attrsToAdd.push(`fetchpriority="high"`);
      if (!hasLoading) attrsToAdd.push(`loading="eager"`);
      if (!hasWidth) attrsToAdd.push(`width="1200"`);
      if (!hasHeight) attrsToAdd.push(`height="675"`);
    } else {
      if (!hasLoading) attrsToAdd.push(`loading="lazy"`);
      if (!hasWidth) attrsToAdd.push(`width="800"`);
      if (!hasHeight) attrsToAdd.push(`height="450"`);
    }

    if (!hasDecoding) attrsToAdd.push(`decoding="async"`);

    if (attrsToAdd.length === 0) return match;

    const isSelfClosing = match.endsWith('/>');
    const closing = isSelfClosing ? '/>' : '>';
    return match.slice(0, -closing.length) + ' ' + attrsToAdd.join(' ') + closing;
  });
}

function normalizePerformanceAndAccessibility(html) {
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">\s*/g, '')
    .replace(/<script src="\/assets\/js\/site\.js"><\/script>/g, '<script src="/assets/js/site.js" defer></script>')
    .replace(/<nav class="mobile-nav" role="dialog" aria-label="Mobile menu">/g, '<nav class="mobile-nav" aria-label="Mobile menu">')
    .replace(/<nav class="mobile-nav" role="dialog" aria-label="القائمة المتنقلة">/g, '<nav class="mobile-nav" aria-label="القائمة المتنقلة">')
    .replace(/<div class="tile-info"><h4>/g, '<div class="tile-info"><span class="tile-title">')
    .replace(/<\/h4><span>/g, '</span><span>')
    .replace(/<div class="footer-column"><h4>/g, '<div class="footer-column"><p class="footer-heading">')
    .replace(/<\/h4><ul class="footer-links">/g, '</p><ul class="footer-links">')
    .replace(/aria-label="Instagram">IG<\/a>/g, 'aria-label="IG Instagram">IG</a>')
    .replace(/aria-label="YouTube">YT<\/a>/g, 'aria-label="YT YouTube">YT</a>')
    .replace(/aria-label="TikTok">TT<\/a>/g, 'aria-label="TT TikTok">TT</a>');
  return html;
}

function injectResourceHints(html) {
  // Strip any existing managed resource hints to ensure idempotency
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, '')
    .replace(/<link rel="dns-prefetch" href="https:\/\/www\.googletagmanager\.com">\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/css\/style\.css" as="style">\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/js\/site\.js" as="script">\s*/g, '');

  const isArticle = html.includes('class="article-body"');
  let hints = '<link rel="dns-prefetch" href="https://www.googletagmanager.com">\n';
  if (isArticle) {
    hints += '<link rel="preload" href="/assets/js/site.js" as="script">\n';
  }
  const cssLink = '<link rel="stylesheet" href="/assets/css/style.css">';
  if (html.includes(cssLink)) {
    return html.replace(cssLink, `${hints}${cssLink}`);
  }
  return html.replace('</head>', `${hints}</head>`);
}

// --- Critical CSS Extraction and Injection ---

function isCriticalSelector(selector) {
  const s = selector.trim();
  if (s === ':root') return true;
  if (s.startsWith('[data-theme="dark"]')) return true;
  if (s.startsWith('[lang="ar"]')) return true;
  if (s === '*' || s.startsWith('*::')) return true;
  if (s === 'html' || s === 'body' || s.startsWith('body.')) return true;
  if (/^h[1-6]\b/.test(s)) return true;
  if (s === 'p') return true;
  if (s === 'a' || s.startsWith('a:')) return true;
  if (s.startsWith('.skip-link')) return true;
  if (s.startsWith('.site-header')) return true;
  if (s.startsWith('.header-inner')) return true;
  if (s.startsWith('.logo')) return true;
  if (s.startsWith('.main-nav')) return true;
  if (s.startsWith('.nav-links')) return true;
  if (s.startsWith('.header-controls')) return true;
  if (s.startsWith('.lang-switch') || s.startsWith('.theme-toggle') || s.startsWith('.search-toggle')) return true;
  if (s.startsWith('.mobile-menu-btn')) return true;
  if (s.startsWith('.mobile-nav')) return true;
  if (s.startsWith('.hero-section')) return true;
  if (s.startsWith('.hero-inner')) return true;
  if (s.startsWith('.hero-title')) return true;
  if (s.startsWith('.hero-subtitle')) return true;
  if (s.startsWith('.hero-trending')) return true;
  if (s.startsWith('.trending-pill')) return true;
  if (s.startsWith('.newsletter-signup')) return true;
  if (s.startsWith('.btn')) return true;
  if (s.startsWith('.content-section')) return true;
  if (s.startsWith('.section-header')) return true;
  if (s.startsWith('.category-explorer')) return true;
  if (s.startsWith('.category-tile')) return true;
  if (s.startsWith('.category-badge')) return true;
  if (s.startsWith('.article-grid')) return true;
  if (s.startsWith('.article-card')) return true;
  if (s.startsWith('.newsletter-cta')) return true;
  return false;
}

function extractCssBlocks(css) {
  const blocks = [];
  let i = 0;
  while (i < css.length) {
    if (css.slice(i, i + 2) === '/*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (/\s/.test(css[i])) { i++; continue; }
    if (css[i] === '@') {
      const blockStart = i;
      const braceIdx = css.indexOf('{', i);
      const semiIdx = css.indexOf(';', i);
      if (braceIdx !== -1 && (semiIdx === -1 || braceIdx < semiIdx)) {
        let depth = 1;
        let j = braceIdx + 1;
        while (j < css.length && depth > 0) {
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }
        blocks.push({ type: 'at-rule', content: css.slice(blockStart, j) });
        i = j;
      } else {
        const end = semiIdx === -1 ? css.length : semiIdx + 1;
        blocks.push({ type: 'at-rule', content: css.slice(blockStart, end) });
        i = end;
      }
    } else {
      const braceIdx = css.indexOf('{', i);
      if (braceIdx === -1) break;
      const selector = css.slice(i, braceIdx);
      let depth = 1;
      let j = braceIdx + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      blocks.push({ type: 'rule', selector, content: css.slice(i, j) });
      i = j;
    }
  }
  return blocks;
}

function extractCriticalCSS(cssText) {
  const blocks = extractCssBlocks(cssText);
  const critical = [];
  for (const block of blocks) {
    if (block.type === 'rule') {
      const selectors = block.selector.split(',').map(s => s.trim());
      if (selectors.some(isCriticalSelector)) {
        critical.push(block.content);
      }
    } else if (block.type === 'at-rule' && block.content.includes('{')) {
      const prefix = block.content.slice(0, block.content.indexOf('{'));
      const inner = block.content.slice(block.content.indexOf('{') + 1, block.content.lastIndexOf('}'));
      const innerBlocks = extractCssBlocks(inner);
      const innerCritical = [];
      for (const ib of innerBlocks) {
        if (ib.type === 'rule') {
          const selectors = ib.selector.split(',').map(s => s.trim());
          if (selectors.some(isCriticalSelector)) {
            innerCritical.push(ib.content);
          }
        }
      }
      if (innerCritical.length > 0) {
        critical.push(prefix + '{' + innerCritical.join('') + '}');
      }
    }
  }
  return critical.join('');
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/{\s+/g, '{')
    .replace(/;\s+/g, ';')
    .replace(/,\s+/g, ',')
    .replace(/:\s+/g, ':')
    .replace(/\s+{/g, '{')
    .trim();
}

function injectCriticalCSS(html, criticalCSS) {
  const stylesheetLink = '<link rel="stylesheet" href="/assets/css/style.css">';
  const stylesheetLinkPattern = /<link rel="stylesheet" href="\/assets\/css\/style\.css">\s*/g;

  // Normalize previous critical-CSS injections back to a single stylesheet anchor.
  html = html
    .replace(/<style(?:\s+data-critical="true")?>[\s\S]*?<\/style>\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/css\/style\.css" as="style"[^>]*>\s*/g, '')
    .replace(/<\/?noscript>/g, '');

  let hasStylesheet = false;
  html = html.replace(stylesheetLinkPattern, () => {
    if (hasStylesheet) return '';
    hasStylesheet = true;
    return stylesheetLink;
  });
  const inlineStyle = `<style data-critical="true">${criticalCSS}</style>`;
  const preloadLink = `<link rel="preload" href="/assets/css/style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">`;
  const noscriptFallback = `<noscript><link rel="stylesheet" href="/assets/css/style.css"></noscript>`;
  const replacement = `${inlineStyle}\n${preloadLink}\n${noscriptFallback}`;
  if (!hasStylesheet) return html.replace('</head>', `${replacement}</head>`);
  html = html.replace(stylesheetLink, replacement);
  return html;
}

function linkExistingCategory(html, relativeFile) {
  const lang = relativeFile.startsWith('ar/') || /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const category = categoryByArticle.get(relativeFile) || categoryFallback.get(lang);
  const categoryHref = `/${category.lang}/category/${category.slug}.html`;
  const categoryTitle = category.title;
  const categoryUrl = `https://doyouknow.app${categoryHref}`;
  html = html
    .replaceAll(`/${lang}/category/General.html`, categoryHref)
    .replaceAll(`https://doyouknow.app/${lang}/category/General.html`, categoryUrl)
    .replace(/"item":\s*"https:\/\/doyouknow\.app\/(?:en|ar)\/category\/General\.html"/g, `"item": "${categoryUrl}"`);
  html = html.replace(/(<span class="category-badge[^"]*"><a href=")[^"]+(">)([\s\S]*?)(<\/a><\/span>)/, `$1${categoryHref}$2${escapeHtml(categoryTitle)}$4`);
  html = html.replace(/(<nav class="breadcrumb" aria-label="breadcrumb"><ol><li><a href="\/(?:en|ar)\/">[\s\S]*?<\/a><\/li><li><a href=")[^"]+(">)([\s\S]*?)(<\/a><\/li>)/, `$1${categoryHref}$2${escapeHtml(categoryTitle)}$4`);
  return html;
}



const englishStopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','this','that','it','you','your','our','we','us','me','my','his','her','their','them','they','he','she','i','am','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','shall','about','above','across','after','against','along','among','around','before','behind','below','beneath','beside','between','beyond','down','during','except','inside','into','near','off','onto','outside','over','since','through','throughout','till','toward','under','until','up','upon','within','without']);
const arabicStopWords = new Set(['في','من','إلى','عن','على','مع','هي','هو','أن','لا','كان','قد','كل','بعض','هذه','هذا','الذين','التي','التى','و','ما','لا','لم','لن','لها','له','كما','بعد','قبل','بين','تحت','فوق','حول','خلال','دون','سوى','غير','لكن','لذلك','إلا','حتى','حيث','إذا','اذا','عند','عندما','حين','لأن','لان','لأنه','بسبب','نظرا','رغم','على','ضد','بجانب','بعيد','قريب','أمام','خلف','يمين','يسار','شمال','جنوب','شرق','غرب','أول','ثان','ثالث','رابع','خمس','ست','سبع','ثمان','تسع','عشر','مئة','ألف','مليون','مليار']);

function extractArticleBodyHtml(html) {
  const startMatch = html.match(/<div class="article-body"[^>]*>/);
  if (!startMatch) return '';
  const start = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = start;
  while (i < html.length && depth > 0) {
    if (html.substring(i, 4) === '<div' && (html[i + 4] === ' ' || html[i + 4] === '>')) {
      depth++;
      i += 4;
    } else if (html.substring(i, 6) === '</div>') {
      depth--;
      if (depth === 0) break;
      i += 6;
    } else {
      i++;
    }
  }
  return html.slice(start, i);
}

function countWords(text, lang) {
  const stripped = text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
  if (!stripped) return 0;
  const tokens = stripped.split(/\s+/).filter(t => /[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(t));
  return tokens.length;
}

function extractFaqPairs(html, lang) {
  const faqs = [];
  // First try .faq-item / .faq-question / .faq-answer pattern
  const faqItemRegex = /<div class="faq-item"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="faq-item"|<div class="share-bar"|<\/div>\s*$)/g;
  let m;
  while ((m = faqItemRegex.exec(html)) !== null) {
    const item = m[1];
    const qMatch = item.match(/<[^>]*class="faq-question"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const aMatch = item.match(/<[^>]*class="faq-answer"[^>]*>([\s\S]*?)<\/[^>]*>/);
    if (qMatch && aMatch) {
      faqs.push({ question: stripHtmlTags(qMatch[1]), answer: stripHtmlTags(aMatch[1]) });
    }
  }
  if (faqs.length > 0) return faqs;

  // Fallback: extract from FAQ section
  const faqH2Regex = /<h2[^>]*(?:id="faq(?:s)?"|id="[^"]*أسئلة[^"]*")[^>]*>([\s\S]*?)<\/h2>/i;
  let faqH2Match = html.match(faqH2Regex);
  if (!faqH2Match) {
    const faqSectionMatch = html.match(/<h2[^>]*>[\s\S]*?(?:FAQ|أسئلة شائعة|الأسئلة الشائعة)[\s\S]*?<\/h2>/i);
    if (!faqSectionMatch) return faqs;
    faqH2Match = faqSectionMatch;
  }

  const faqStartIndex = html.indexOf(faqH2Match[0]) + faqH2Match[0].length;
  const faqSection = html.slice(faqStartIndex);
  const nextH2 = faqSection.search(/<h2[^>]*>/i);
  const shareBar = faqSection.search(/<div class="share-bar">/);
  let endIndex = faqSection.length;
  if (nextH2 !== -1) endIndex = Math.min(endIndex, nextH2);
  if (shareBar !== -1) endIndex = Math.min(endIndex, shareBar);
  const faqContent = faqSection.slice(0, endIndex);

  if (lang === 'ar') {
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let p;
    let pendingQuestion = null;
    while ((p = pRegex.exec(faqContent)) !== null) {
      const text = p[1].trim();
      if (/<strong>/.test(text)) {
        if (pendingQuestion) {
          faqs.push({ question: pendingQuestion, answer: '' });
        }
        pendingQuestion = stripHtmlTags(text);
      } else if (pendingQuestion) {
        faqs.push({ question: pendingQuestion, answer: stripHtmlTags(text) });
        pendingQuestion = null;
      }
    }
    if (pendingQuestion) {
      faqs.push({ question: pendingQuestion, answer: '' });
    }
  } else {
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    const h3Positions = [];
    let h3;
    while ((h3 = h3Regex.exec(faqContent)) !== null) {
      h3Positions.push({ index: h3.index, text: h3[1] });
    }
    const pPositions = [];
    let p;
    while ((p = pRegex.exec(faqContent)) !== null) {
      pPositions.push({ index: p.index, text: p[1] });
    }
    for (let i = 0; i < h3Positions.length; i++) {
      const q = h3Positions[i];
      const nextH3 = h3Positions[i + 1];
      const answers = pPositions.filter(pp => pp.index > q.index && (!nextH3 || pp.index < nextH3.index));
      if (answers.length > 0) {
        faqs.push({ question: stripHtmlTags(q.text), answer: stripHtmlTags(answers[0].text) });
      } else {
        faqs.push({ question: stripHtmlTags(q.text), answer: '' });
      }
    }
  }

  return faqs;
}

function injectSchemas(html, relativeFile) {
  const isArticle = /^(en|ar)\/article\/[a-z0-9-]+\.html$/.test(relativeFile);
  if (!isArticle) return html;

  const lang = relativeFile.startsWith('ar/') ? 'ar' : 'en';

  const bodyHtml = extractArticleBodyHtml(html);
  const wordCount = countWords(bodyHtml, lang);
  const readingTime = Math.ceil(wordCount / (lang === 'ar' ? 150 : 200));
  const readingTimeText = lang === 'ar'
    ? `${readingTime} ${readingTime === 1 ? 'دقيقة' : 'دقائق'}`
    : `${readingTime} min read`;

  // Replace reading time
  html = html.replace(/<span class="read-time">[^<]*<\/span>/, `<span class="read-time">${readingTimeText}</span>`);

  const faqs = extractFaqPairs(html, lang);

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*\|\s*doyouknow\.app$/, '') || '';
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1] || '';
  const featuredImage = html.match(/<img class="featured-image"[^>]*src="([^"]+)"/)?.[1] || '';
  const imageUrl = ogImage || (featuredImage ? (featuredImage.startsWith('http') ? featuredImage : `https://doyouknow.app${featuredImage}`) : '');
  const timeMatch = html.match(/<time datetime="([^"]+)">/);
  const datePublished = timeMatch?.[1] || '2026-06-26';
  const dateModified = datePublished;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || `https://doyouknow.app/${relativeFile}`;
  const category = categoryByArticle.get(relativeFile) || categoryFallback.get(lang);
  const articleSection = category?.title || (lang === 'ar' ? 'عام' : 'General');
  const authorUrl = `https://doyouknow.app/${lang}/about.html`;

  const keywords = getKeywords(html, description, lang).join(', ');

  const articleBody = stripHtmlTags(bodyHtml).slice(0, 300);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Organization',
      name: 'doyouknow.app Editorial Team',
      url: authorUrl,
      sameAs: [
        'https://instagram.com/doyouknowapp',
        'https://twitter.com/doyouknowapp'
      ]
    },
    publisher: { '@type': 'Organization', name: 'doyouknow.app', logo: { '@type': 'ImageObject', url: 'https://doyouknow.app/assets/images/logo.png' } },
    datePublished,
    dateModified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection,
    keywords,
    wordCount,
    articleBody,
    inLanguage: lang
  };

  if (imageUrl) {
    const isRaster = imageUrl.endsWith('.png');
    articleSchema.image = { '@type': 'ImageObject', url: imageUrl, width: 1200, height: isRaster ? 630 : 675 };
  }

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  // Remove existing Article and FAQPage schemas while keeping others
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, content) => {
    try {
      const data = JSON.parse(content);
      if (data['@type'] === 'Article' || data['@type'] === 'FAQPage') return '';
      return match;
    } catch {
      return match;
    }
  });

  // Clean up any double newlines left by removed scripts
  html = html.replace(/\n{3,}/g, '\n\n');

  // Inject new schemas before </head>
  const articleScript = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;
  const faqScript = faqSchema ? `\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : '';

  html = html.replace('</head>', `${articleScript}${faqScript}\n</head>`);

  return html;
}
const criticalCSS = minifyCSS(extractCriticalCSS(await readFile(join(root, 'assets/css/style.css'), 'utf8')));
console.log('Critical CSS size:', criticalCSS.length, 'bytes');

const htmlFiles = (await walk(root)).filter((path) => path.endsWith('.html'));
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const relativeFile = file.slice(root.length);
  html = html
    .replaceAll('/doyouknow-app-site/', '/')
    .replace(/<meta name="keywords"[^>]*>\s*/g, '')
    .replaceAll('/en/category/UAE-Heritage/', '/en/category/General.html')
    .replaceAll('/en/category/KSA-Heritage/', '/en/category/General.html')
    .replaceAll('/en/category/Quick-Facts/', '/en/category/General.html')
    .replaceAll('/en/category/Travel/', '/en/category/General.html')
    .replaceAll('/en/category/Compare/', '/en/category/General.html')
    .replaceAll('/ar/category/UAE-Heritage/', '/ar/category/General.html')
    .replaceAll('/ar/category/KSA-Heritage/', '/ar/category/General.html')
    .replaceAll('/ar/category/Quick-Facts/', '/ar/category/General.html')
    .replaceAll('/ar/category/Travel/', '/ar/category/General.html')
    .replaceAll('/ar/category/Compare/', '/ar/category/General.html')
    .replace(/\/(en|ar)\/article\/([a-z0-9-]+)\//g, '/$1/article/$2.html')
    .replace(/\/(en|ar)\/category\/UAE-Heritage\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/KSA-Heritage\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Quick-Facts\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Travel\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Compare\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/newsletter\//g, '/$1/contact.html')
    .replace(/\/(en|ar)\/team\//g, '/$1/about.html')
    .replaceAll('10 Facts About Uae Formation', "10 Facts About the UAE's Formation in 1971")
    .replaceAll('Read this fascinating article on doyouknow.app...', 'Discover the decisions, leaders, and milestones that united the seven emirates.')
    .replaceAll('Join 10,000+ curious readers. No spam. Unsubscribe anytime.', 'A carefully curated bilingual newsletter is coming soon.')
    .replaceAll('انضم إلى أكثر من 10,000 قارئ فضولي. لا رسائل مزعجة.', 'قريباً: نشرة معرفية مختارة بعناية باللغتين العربية والإنجليزية.')
    .replace(/(<link rel="alternate" hreflang="[^"]+" href=")\//g, '$1https://doyouknow.app/')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // Remove discovery cards for retired UAE history and politics content.
  for (const slug of removedArticleSlugs) {
    const href = `/en/article/${slug}.html`;
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html
      .replace(new RegExp(`<a href="${escapedHref}" class="article-card">[\\s\\S]*?<\\/a>`, 'g'), '')
      .replace(new RegExp(`<a href="${escapedHref}" class="related-card">[\\s\\S]*?<\\/a>`, 'g'), '');
  }
  html = html
    .replace(/<p>Curious about the UAE's history\?[\s\S]*?<\/p>/g, '')
    .replace(/<p>Want more UAE facts\? Read our [\s\S]*?<\/p>/g, '')
    .replace(/<p>Looking for more UAE facts\? Explore our [\s\S]*?<\/p>/g, '')
    .replace(/<p>The name changed to Burj Khalifa at the last minute\.[\s\S]*?<\/p>/g, '')
    .replaceAll('/en/article/10-facts-about-uae-formation.html', '/en/article/burj-khalifa-facts.html')
    .replaceAll("10 Facts About the UAE's Formation in 1971", "Burj Khalifa: 10 Surprising Facts You Didn't Know")
    .replaceAll('Discover the decisions, leaders, and milestones that united the seven emirates.', 'Discover the design, engineering, and records behind the world’s tallest building.');

  // Preserve useful navigation without shipping dead internal links from drafts.
  const replacements = new Map();
  for (const match of html.matchAll(/href="([^"#]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/')) continue;
    const clean = href.split('?')[0];
    const target = join(root, clean);
    try { await access(target.endsWith('/') ? join(target, 'index.html') : target); }
    catch {
      if (knownCategoryHrefs.has(clean)) continue;
      const language = clean.startsWith('/ar/') ? 'ar' : 'en';
      replacements.set(href, `/${language}/`);
    }
  }
  for (const [from, to] of replacements) html = html.replaceAll(`href="${from}"`, `href="${to}"`);
  const descriptions = new Map([
    ["Read about 10 Facts About the UAE's Formation in 1971 on doyouknow.app", "Discover 10 defining facts about the UAE's formation in 1971, from the union of the emirates to the leaders and milestones that shaped the nation."],
    ['Read about Deep Dive Dubai on doyouknow.app', "Explore Deep Dive Dubai, the record-breaking 60-metre diving pool, with key facts, visitor guidance, safety notes, and what makes it unique."],
    ['Read about Dubai Metro Guide on doyouknow.app', "Plan your journey with this practical Dubai Metro guide covering lines, stations, Nol cards, fares, operating basics, accessibility, and useful travel tips."],
    ['Read about History Pearl Diving Uae on doyouknow.app', "Explore the history of pearl diving in the UAE, the divers and dhow crews behind the trade, and how this demanding heritage shaped Emirati life."],
    ['Read about Uae Golden Visa Guide on doyouknow.app', "Understand the UAE Golden Visa routes, broad eligibility categories, application steps, and the official sources to check before you apply."],
    ['Read about Qobool Guide on doyouknow.app', 'دليل مبسط لاستخدام منصة قبول في السعودية، من إنشاء الحساب وترتيب الرغبات إلى متابعة الطلب والتحقق من أحدث التعليمات الرسمية.'],
    ['Read about What Is Neom on doyouknow.app', 'ما هو مشروع نيوم؟ تعرف على مناطق المشروع وأهدافه وعلاقته برؤية السعودية 2030، مع فصل الحقائق الرسمية عن الوعود المستقبلية.'],
    ['Read about Saudi No Rivers on doyouknow.app', 'هل تعلم أن السعودية لا تضم أنهاراً دائمة؟ اكتشف الأسباب الجغرافية ومصادر المياه والحلول التي تعتمد عليها المملكة لتلبية احتياجاتها.']
    ,['Privacy policy for doyouknow.app.', 'Learn how doyouknow.app handles technical logs, analytics, newsletter consent, personal information, and privacy questions.']
    ,['Terms of use for doyouknow.app.', 'Read the doyouknow.app terms covering informational content, editorial corrections, reader responsibilities, and intellectual property.']
    ,['سياسة الخصوصية لموقع doyouknow.app.', 'تعرف على كيفية تعامل موقع doyouknow.app مع السجلات التقنية والتحليلات وموافقات النشرة البريدية واستفسارات الخصوصية.']
    ,['شروط استخدام موقع doyouknow.app.', 'اقرأ شروط استخدام موقع doyouknow.app المتعلقة بالمحتوى المعلوماتي والتصحيحات التحريرية ومسؤوليات القارئ وحقوق النشر.']
  ]);
  for (const [from, to] of descriptions) html = html.replaceAll(from, to);
  const textReplacements = new Map([
    ['Uae Golden Visa Guide', 'UAE Golden Visa Guide']
  ]);
  if (relativeFile.startsWith('ar/')) {
    textReplacements.set('Qobool Guide', 'دليل قبول: التقديم ومتابعة القبول الجامعي');
    textReplacements.set('Saudi No Rivers', 'لماذا لا توجد أنهار دائمة في السعودية؟');
    textReplacements.set('What Is Neom', 'ما هو نيوم؟ دليل شامل عن مدينة المستقبل');
    textReplacements.set('Page Not Found', 'الصفحة غير موجودة');
    textReplacements.set('The page you are looking for does not exist.', 'الصفحة التي تبحث عنها غير موجودة. يمكنك العودة إلى الصفحة الرئيسية أو استخدام البحث للوصول إلى المحتوى.');
  }
  for (const [from, to] of textReplacements) html = html.replaceAll(from, to);
  const cardExcerptReplacements = new Map([
    ['Deep Dive Dubai', 'Explore Deep Dive Dubai, the record-breaking 60-metre diving pool, with key facts, visitor guidance, safety notes, and what makes it unique.'],
    ['Dubai Metro Guide', 'Plan your journey with this practical Dubai Metro guide covering lines, stations, Nol cards, fares, operating basics, accessibility, and useful travel tips.'],
    ['UAE Golden Visa Guide', 'Understand the UAE Golden Visa routes, broad eligibility categories, application steps, and the official sources to check before you apply.'],
    ['دليل قبول: التقديم ومتابعة القبول الجامعي', 'دليل مبسط لاستخدام منصة قبول في السعودية، من إنشاء الحساب وترتيب الرغبات إلى متابعة الطلب والتحقق من أحدث التعليمات الرسمية.'],
    ['لماذا لا توجد أنهار دائمة في السعودية؟', 'هل تعلم أن السعودية لا تضم أنهاراً دائمة؟ اكتشف الأسباب الجغرافية ومصادر المياه والحلول التي تعتمد عليها المملكة لتلبية احتياجاتها.'],
    ['ما هو نيوم؟ دليل شامل عن مدينة المستقبل', 'ما هو مشروع نيوم؟ تعرف على مناطق المشروع وأهدافه وعلاقته برؤية السعودية 2030، مع فصل الحقائق الرسمية عن الوعود المستقبلية.']
  ]);
  for (const [title, excerpt] of cardExcerptReplacements) {
    html = html
      .replaceAll(`<h2 class="card-title">${title}</h2><p class="card-excerpt">...</p>`, `<h2 class="card-title">${title}</h2><p class="card-excerpt">${excerpt}</p>`)
      .replaceAll(`<h3 class="card-title">${title}</h3><p class="card-excerpt">...</p>`, `<h3 class="card-title">${title}</h3><p class="card-excerpt">${excerpt}</p>`);
  }
  const titleReplacements = new Map([
    ['<title>الصيام في رمضان: دليل صحي معتمد من طبيب — نصائح علمية للجميع | doyouknow.app</title>', '<title>الصيام الصحي في رمضان: دليل عملي | doyouknow.app</title>'],
    ['<title>Best Beaches in Dubai: 12 Top Picks for Every Type of Traveler | doyouknow.app</title>', '<title>12 Best Beaches in Dubai for Every Traveler | doyouknow.app</title>'],
    ['<title>Best Restaurants in Dubai: 15 Top Picks for Every Taste and Budget | doyouknow.app</title>', '<title>15 Best Restaurants in Dubai for Every Budget | doyouknow.app</title>'],
    ['<title>Hidden Gems in the UAE: 10 Off-the-Beaten-Path Destinations for Locals and Repeat Visitors | doyouknow.app</title>', '<title>10 Hidden Gems in the UAE Worth Exploring | doyouknow.app</title>'],
    ['<title>What Is Google Gemini? How It Works (A Beginner&#x27;s Guide) | doyouknow.app</title>', '<title>What Is Google Gemini? A Beginner’s Guide | doyouknow.app</title>'],
    ['<title>Did You Know? Surprising Facts About UAE, KSA &amp; the World | doyouknow.app</title>', '<title>UAE &amp; Saudi Facts and Guides | doyouknow.app</title>'],
    ['<title>doyouknow.app</title>', '<title>Choose Your Language | doyouknow.app</title>']
  ]);
  for (const [from, to] of titleReplacements) html = html.replaceAll(from, to);
  const shouldNoindex = editorialReview.has(relativeFile)
    || relativeFile.endsWith('404.html')
    || relativeFile === 'index.html'
    || relativeFile.endsWith('/category/General.html');
  html = html.replace(
    /name="robots" content="(?:index|noindex), ?follow"/,
    `name="robots" content="${shouldNoindex ? 'noindex' : 'index'}, follow"`
  );
  html = html
    .replaceAll('/en/category/General.html">UAE</a>', '/en/category/dubai.html">Dubai &amp; UAE</a>')
    .replaceAll('/en/category/General.html">KSA</a>', '/ar/category/saudi.html">KSA</a>')
    .replaceAll('/ar/category/General.html">الإمارات</a>', '/en/category/dubai.html">الإمارات</a>')
    .replaceAll('/ar/category/General.html">السعودية</a>', '/ar/category/saudi.html">السعودية</a>');
  html = html
    .replaceAll('href="/en/category/General.html">Dubai &amp; UAE</a>', 'href="/en/category/dubai.html">Dubai &amp; UAE</a>')
    .replaceAll('href="/ar/category/General.html">KSA</a>', 'href="/ar/category/saudi.html">KSA</a>')
    .replaceAll('href="/en/category/General.html">Did You Know</a>', 'href="/en/">Did You Know</a>')
    .replaceAll('href="/en/category/General.html">Best Of</a>', 'href="/en/category/dubai.html">Best Of</a>')
    .replaceAll('href="/en/category/General.html">Compare</a>', 'href="/en/category/guides.html">Compare</a>')
    .replaceAll('href="/en/category/General.html" class="view-all"', 'href="/en/category/dubai.html" class="view-all"')
    .replaceAll('href="/ar/category/General.html" class="view-all"', 'href="/ar/category/saudi.html" class="view-all"')
    .replaceAll('href="/en/category/General.html">الإمارات</a>', 'href="/en/category/dubai.html">الإمارات</a>')
    .replaceAll('href="/ar/category/General.html">هل تعلم</a>', 'href="/ar/">هل تعلم</a>')
    .replaceAll('href="/ar/category/General.html">الأفضل</a>', 'href="/ar/category/saudi.html">الأفضل</a>')
    .replaceAll('href="/ar/category/General.html">قارن</a>', 'href="/ar/category/guides.html">قارن</a>');
  html = html
    .replace(/<a href="\/en\/category\/(?:uae|General)\.html" class="category-tile">(?=[\s\S]*?<h4>UAE history<\/h4>)[\s\S]*?<\/a>/g, '')
    .replace(/<a href="\/en\/category\/General\.html" class="category-tile">(?=<div class="tile-icon">◈)/g, '<a href="/en/category/dubai.html" class="category-tile">')
    .replace(/<a href="\/en\/category\/General\.html" class="category-tile">(?=<div class="tile-icon">✓)/g, '<a href="/en/category/guides.html" class="category-tile">')
    .replace(/<a href="\/en\/category\/General\.html" class="category-tile">(?=<div class="tile-icon">✦)/g, '<a href="/en/category/technology.html" class="category-tile">')
    .replaceAll('30 articles', '22 articles');
  html = html.replace(
    '<a href="/en/category/General.html" class="category-tile"><div class="tile-icon" style="background:#64748B15;color:#64748B;">📚</div><div class="tile-info"><h4>General</h4><span>30 articles</span></div></a>',
    '<a href="/en/category/dubai.html" class="category-tile"><div class="tile-icon">◈</div><div class="tile-info"><h4>Dubai &amp; places</h4><span>14 articles</span></div></a><a href="/en/category/guides.html" class="category-tile"><div class="tile-icon">✓</div><div class="tile-info"><h4>Practical guides</h4><span>6 articles</span></div></a><a href="/en/category/technology.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>Technology</h4><span>2 articles</span></div></a>'
  );
  html = html.replace(
    '<a href="/ar/category/General.html" class="category-tile"><div class="tile-icon" style="background:#64748B15;color:#64748B;">📚</div><div class="tile-info"><h4>عام</h4><span>28 مقال</span></div></a>',
    '<a href="/ar/category/dubai.html" class="category-tile"><div class="tile-icon">◈</div><div class="tile-info"><h4>دبي والإمارات</h4><span>19 مقالاً</span></div></a><a href="/ar/category/saudi.html" class="category-tile"><div class="tile-icon">🏛️</div><div class="tile-info"><h4>تاريخ السعودية</h4><span>10 مقالات</span></div></a><a href="/ar/category/vision-2030.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>رؤية 2030</h4><span>7 مقالات</span></div></a><a href="/ar/category/guides.html" class="category-tile"><div class="tile-icon">✓</div><div class="tile-info"><h4>أدلة عملية</h4><span>8 مقالات</span></div></a><a href="/ar/category/islamic.html" class="category-tile"><div class="tile-icon">◆</div><div class="tile-info"><h4>معرفة إسلامية</h4><span>5 مقالات</span></div></a>'
  );
  html = html
    .replaceAll('<span>13 articles</span>', '<span>14 articles</span>')
    .replaceAll('<span>6 مقالات</span></div></a><a href="/ar/category/islamic.html"', '<span>7 مقالات</span></div></a><a href="/ar/category/islamic.html"');
  if (relativeFile === 'en/index.html' && !html.includes('/en/category/world-cup-2026.html')) {
    html = html.replace(
      '<a href="/en/category/technology.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>Technology</h4><span>2 articles</span></div></a>',
      '<a href="/en/category/technology.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>Technology</h4><span>2 articles</span></div></a><a href="/en/category/world-cup-2026.html" class="category-tile"><div class="tile-icon">⚽</div><div class="tile-info"><h4>World Cup 2026</h4><span>20 articles</span></div></a>'
    );
  }
  if (relativeFile === 'ar/index.html' && !html.includes('/ar/category/world-cup-2026.html')) {
    html = html.replace(
      '<a href="/ar/category/islamic.html" class="category-tile"><div class="tile-icon">◆</div><div class="tile-info"><h4>معرفة إسلامية</h4><span>5 مقالات</span></div></a>',
      '<a href="/ar/category/islamic.html" class="category-tile"><div class="tile-icon">◆</div><div class="tile-info"><h4>معرفة إسلامية</h4><span>5 مقالات</span></div></a><a href="/ar/category/world-cup-2026.html" class="category-tile"><div class="tile-icon">⚽</div><div class="tile-info"><h4>كأس العالم 2026</h4><span>20 مقالاً</span></div></a>'
    );
  }
  html = html.replaceAll('"url": "/assets/images/logo.png"', '"url": "https://doyouknow.app/assets/images/logo.png"');
  if (!html.includes('rel="icon"')) {
    html = html.replace('</head>', '<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml">\n</head>');
  }
  if (!html.includes('property="og:title"')) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'doyouknow.app';
    const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
    const language = html.includes('lang="ar"') ? 'ar' : 'en';
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || `https://doyouknow.app/${language}/`;
    const social = `<meta property="og:title" content="${title}">\n<meta property="og:description" content="${description}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${canonical}">\n<meta property="og:image" content="https://doyouknow.app/assets/images/og-${language}.png">\n<meta name="twitter:card" content="summary_large_image">`;
    html = html.replace('</head>', `${social}\n</head>`);
  }
  if (!html.includes('G-6VQZY87LJB')) {
    html = html.replace('</head>', `${googleTag}\n</head>`);
  }
  if (!html.includes('application/rss+xml')) {
    const pageLang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
    const feedLinks = `<link rel="alternate" type="application/rss+xml" title="RSS" href="/${pageLang}/rss.xml">\n<link rel="alternate" type="application/json" title="JSON Feed" href="/${pageLang}/feed.json">`;
    html = html.replace('</head>', `${feedLinks}\n</head>`);
  }
  html = stripSearchAction(html);
  html = updateArticlePageImage(html, relativeFile);
  html = updateArticleCardImages(html);
  html = optimizeImageAttributes(html);
  html = normalizePerformanceAndAccessibility(html);
  html = linkExistingCategory(html, relativeFile);
  // --- PWA manifest, apple-touch-icon, and theme-color ---
  const pageLang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const manifestHref = pageLang === 'ar' ? '/manifest-ar.json' : '/manifest.json';
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `<link rel="manifest" href="${manifestHref}">\n</head>`);
  }
  if (!html.includes('rel="apple-touch-icon"')) {
    html = html.replace('</head>', '<link rel="apple-touch-icon" href="/assets/images/icon-192.png">\n</head>');
  }
  if (html.includes('name="theme-color"')) {
    html = html.replace(/<meta name="theme-color" content="[^"]+">/, '<meta name="theme-color" content="#F59E0B">');
  } else {
    html = html.replace('</head>', '<meta name="theme-color" content="#F59E0B">\n</head>');
  }
  if (relativeFile === 'en/index.html' && !html.includes('/en/category/world-cup-2026.html')) {
    html = html.replace(
      '</div><div class="section-header">\n<h2>Latest Articles</h2>',
      '<a href="/en/category/world-cup-2026.html" class="category-tile"><div class="tile-icon">⚽</div><div class="tile-info"><h4>World Cup 2026</h4><span>20 articles</span></div></a>\n</div><div class="section-header">\n<h2>Latest Articles</h2>'
    );
  }
  if (relativeFile === 'ar/index.html' && !html.includes('/ar/category/world-cup-2026.html')) {
    html = html.replace(
      '</div><div class="section-header">\n<h2>أحدث المقالات</h2>',
      '<a href="/ar/category/world-cup-2026.html" class="category-tile"><div class="tile-icon">⚽</div><div class="tile-info"><h4>كأس العالم 2026</h4><span>20 مقالاً</span></div></a>\n</div><div class="section-header">\n<h2>أحدث المقالات</h2>'
    );
  }
  html = normalizePerformanceAndAccessibility(html);
  html = injectResourceHints(html);
  html = injectCriticalCSS(html, criticalCSS);
  html = normalizeHreflang(html, relativeFile);
  html = addRevealClasses(html, 'article-card');
  html = addRevealClasses(html, 'category-tile');
  let h1Seen = 0;
  html = html.replace(/<\/?h1(?=[\s>])[^>]*>/g, (tag) => {
    if (tag.startsWith('<h1')) h1Seen += 1;
    if (h1Seen <= 1) return tag;
    return tag.replace(tag.startsWith('</') ? '</h1' : '<h1', tag.startsWith('</') ? '</h2' : '<h2');
  });
  html = injectSchemas(html, relativeFile);
  await writeFile(file, html);
}

for (const group of categoryGroups) {
  const articles = [];
  for (const slug of group.files) {
    const articlePath = join(root, group.lang, 'article', `${slug}.html`);
    const article = await readFile(articlePath, 'utf8');
    articles.push({
      slug,
      title: article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '') || slug,
      description: article.match(/<meta name="description" content="([^"]*)">/)?.[1] || '',
      noindex: editorialReview.has(`${group.lang}/article/${slug}.html`)
    });
  }
  const rtl = group.lang === 'ar';
  const canonical = `https://doyouknow.app/${group.lang}/category/${group.slug}.html`;
  const home = `/${group.lang}/`;
  const cards = articles.map((article, index) => {
    const delay = (index % 3) + 1;
    const priority = articles.indexOf(article) < 3
      ? 'loading="eager" fetchpriority="high"'
      : 'loading="lazy"';
    const image = `<img class="card-image" src="${articleImagePath(group.lang, article.slug)}" alt="" width="800" height="450" ${priority}>`;
    return `<a href="/${group.lang}/article/${article.slug}.html" class="article-card reveal reveal-delay-${delay}">${image}<div class="card-content"><span class="category-badge">${escapeHtml(group.title)}</span><h2 class="card-title">${escapeHtml(article.title)}</h2><p class="card-excerpt">${escapeHtml(article.description)}</p></div></a>`;
  }).join('');
  const itemList = articles.filter((a) => !a.noindex).map((article, index) => ({ '@type': 'ListItem', position: index + 1, url: `https://doyouknow.app/${group.lang}/article/${article.slug}.html`, name: article.title }));
  const alternateBlock = hreflangBlock(`${group.lang}/category/${group.slug}.html`, group.lang, canonical);
  const manifestLink = rtl ? '<link rel="manifest" href="/manifest-ar.json">' : '<link rel="manifest" href="/manifest.json">';
  const page = `<!doctype html><html lang="${group.lang}"${rtl ? ' dir="rtl"' : ''} data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(group.description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">${alternateBlock}<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#F59E0B">${manifestLink}<link rel="apple-touch-icon" href="/assets/images/icon-192.png"><meta property="og:title" content="${escapeHtml(group.title)} | doyouknow.app"><meta property="og:description" content="${escapeHtml(group.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://doyouknow.app/assets/images/og-${group.lang}.png"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(group.title)} | doyouknow.app</title><link rel="stylesheet" href="/assets/css/style.css"><script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org', '@type':'CollectionPage', name:group.title, description:group.description, url:canonical, inLanguage:group.lang, mainEntity:{ '@type':'ItemList', itemListElement:itemList } })}</script>${googleTag}<link rel="alternate" type="application/rss+xml" title="RSS" href="/${group.lang}/rss.xml"><link rel="alternate" type="application/json" title="JSON Feed" href="/${group.lang}/feed.json"></head><body><a href="#main-content" class="skip-link">${rtl ? 'انتقل إلى المحتوى' : 'Skip to content'}</a><header class="site-header"><div class="header-inner"><a href="${home}" class="logo" aria-label="doyouknow.app"><span class="logo-text">doyouknow<span class="accent">.app</span></span></a><nav class="main-nav" aria-label="${rtl ? 'التنقل الرئيسي' : 'Main navigation'}"><ul class="nav-links"><li><a href="${home}">${rtl ? 'الرئيسية' : 'Home'}</a></li><li><a href="${home}">${rtl ? 'كل المقالات' : 'All articles'}</a></li><li><a href="/${rtl ? 'en' : 'ar'}/">${rtl ? 'English' : 'العربية'}</a></li></ul></nav></div></header><main id="main-content"><section class="content-section"><p class="category-badge">doyouknow.app</p><h1>${escapeHtml(group.title)}</h1><p class="hero-subtitle" style="margin-inline:0">${escapeHtml(group.description)}</p><div class="article-grid">${cards}</div></section></main><footer class="site-footer"><div class="footer-bottom"><span>© 2026 doyouknow.app</span><a href="${home}">${rtl ? 'الرئيسية' : 'Home'}</a>${rtl ? ' · <a href="/ar/work-with-us.html">اعمل معنا</a>' : ' · <a href="/en/work-with-us.html">Work With Us</a>'}</div></footer><script src="/assets/js/site.js" defer></script></body></html>`;
  await writeFile(join(root, group.lang, 'category', `${group.slug}.html`), injectCriticalCSS(optimizeImageAttributes(page), criticalCSS));
}

const sitemapFiles = (await walk(root)).filter((path) => path.endsWith('.html'));
const sitemapUrls = new Map();
const sitemapImages = new Map();
for (const file of sitemapFiles) {
  const relativeFile = file.slice(root.length);
  const html = await readFile(file, 'utf8');
  if (relativeFile.endsWith('404.html') || html.includes('name="robots" content="noindex')) continue;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical || canonical.includes('/category/General.html')) continue;
  const dateModified = html.match(/"dateModified":\s*"([^"]+)"/)?.[1]
    || html.match(/datetime="([^"]+)"/)?.[1]
    || '2026-06-26';
  const priority = canonical.endsWith('/en/') || canonical.endsWith('/ar/') ? '1.0'
    : canonical.includes('/article/') ? '0.8'
      : canonical.includes('/category/') ? '0.7'
        : '0.5';
  const changefreq = canonical.includes('/article/') || canonical.includes('/category/') ? 'weekly'
    : canonical.endsWith('/en/') || canonical.endsWith('/ar/') ? 'daily'
      : 'monthly';
  sitemapUrls.set(canonical, { dateModified, changefreq, priority });

  // Extract image for articles
  if (relativeFile.match(/^(en|ar)\/article\/[a-z0-9-]+\.html$/)) {
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
    const featuredImage = html.match(/<img class="featured-image"[^>]*src="([^"]+)"/)?.[1];
    const imageUrl = ogImage || (featuredImage ? (featuredImage.startsWith('http') ? featuredImage : `https://doyouknow.app${featuredImage}`) : '');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
    if (imageUrl) {
      sitemapImages.set(canonical, { imageUrl, title: escapeHtml(title) });
    }
  }
}
const sitemapEntries = [...sitemapUrls.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([loc, meta]) => {
    const imageBlock = sitemapImages.has(loc)
      ? `\n<image:image><image:loc>${sitemapImages.get(loc).imageUrl}</image:loc><image:title>${sitemapImages.get(loc).title}</image:title></image:image>`
      : '';
    return `<url><loc>${loc}</loc><lastmod>${meta.dateModified}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority>${imageBlock}</url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries}\n</urlset>\n`;
await writeFile(join(root, 'sitemap.xml'), sitemap);
console.log('Prepared production paths and metadata.');

// --- Search Index Generation ---

function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
}

function extractWords(text, lang) {
  const stopWords = lang === 'ar' ? arabicStopWords : englishStopWords;
  const words = new Set();
  for (const raw of text.split(/\s+/)) {
    const clean = raw.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (clean && clean.length > 2 && !stopWords.has(clean)) {
      words.add(clean);
    }
  }
  return words;
}

function getKeywords(html, description, lang) {
  const keywords = new Set();
  // H2 and H3 text
  for (const match of html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)) {
    for (const word of extractWords(stripHtmlTags(match[1]), lang)) {
      keywords.add(word);
    }
  }
  // Description words
  for (const word of extractWords(description, lang)) {
    keywords.add(word);
  }
  return [...keywords].sort();
}

function extractFirstParagraphFromArticleBody(html) {
  const startMatch = html.match(/<div class="article-body"[^>]*>/);
  if (!startMatch) return '';
  const start = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = start;
  while (i < html.length && depth > 0) {
    if (html.substring(i, 5) === '<div' && (html[i + 5] === ' ' || html[i + 5] === '>')) {
      depth++;
      i += 5;
    } else if (html.substring(i, 6) === '</div>') {
      depth--;
      if (depth === 0) break;
      i += 6;
    } else {
      i++;
    }
  }
  const bodyContent = html.slice(start, i);
  const pMatch = bodyContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  return pMatch ? stripHtmlTags(pMatch[1]).trim() : '';
}

const searchFiles = htmlFiles.filter((file) => {
  const rel = file.slice(root.length);
  return /^(en|ar)\/article\/[^/]+\.html$/.test(rel) || /^(en|ar)\/[^/]+\.html$/.test(rel);
});

const articles = [];
for (const file of searchFiles) {
  const rel = file.slice(root.length);
  if (rel.endsWith('404.html')) continue;

  const html = await readFile(file, 'utf8');
  if (html.includes('name="robots" content="noindex')) continue;

  const title = (html.match(/<title>([^<]+)<\/title>/)?.[1] || '').trim();
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';

  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] || (rel.startsWith('ar/') ? 'ar' : 'en');

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const datePublished = html.match(/<time datetime="([^"]+)">/)?.[1] || '2026-06-26';
  const url = canonical || absoluteUrl(rel);

  const slug = rel.split('/').pop().replace('.html', '');
  const type = rel.includes('/article/') ? 'article' : 'page';

  let excerpt = extractFirstParagraphFromArticleBody(html);
  if (!excerpt) {
    // Fallback: first meaningful <p> in the whole document
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (pMatch) {
      excerpt = stripHtmlTags(pMatch[1]).trim();
    }
  }
  if (excerpt.length > 200) {
    excerpt = excerpt.slice(0, 200) + '...';
  }

  let category = '';
  let categorySlug = '';

  // Try category badge in article header
  const badgeMatch = html.match(/<span class="category-badge[^"]*"><a href="\/(?:en|ar)\/category\/([^"]+)\.html">([\s\S]*?)<\/a><\/span>/);
  if (badgeMatch) {
    categorySlug = badgeMatch[1];
    category = stripHtmlTags(badgeMatch[2]).trim();
  }

  // Fallback to breadcrumb category link
  if (!categorySlug) {
    const breadcrumbMatch = html.match(/<nav class="breadcrumb"[\s\S]*?<li><a href="\/(?:en|ar)\/category\/([^"]+)\.html">([\s\S]*?)<\/a><\/li>/);
    if (breadcrumbMatch) {
      categorySlug = breadcrumbMatch[1];
      category = stripHtmlTags(breadcrumbMatch[2]).trim();
    }
  }

  // Fallback for pages
  if (!categorySlug) {
    category = lang === 'ar' ? 'عام' : 'General';
    categorySlug = 'general';
  }

  const keywords = getKeywords(html, description, lang);

  articles.push({
    title,
    description,
    excerpt,
    category,
    categorySlug,
    language: lang,
    url,
    slug,
    keywords,
    type,
    datePublished
  });
}

function latestPublishedDate(items) {
  return items
    .map((item) => item.datePublished)
    .filter(Boolean)
    .sort()
    .at(-1) || '2026-06-26';
}

function toIsoDateTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '2026-06-26T00:00:00.000Z';
  return d.toISOString();
}

const index = {
  version: 1,
  generated: toIsoDateTime(latestPublishedDate(articles)),
  count: articles.length,
  articles
};

const searchIndexByLanguage = (lang) => {
  const languageArticles = articles.filter((article) => article.language === lang);
  return {
    version: index.version,
    generated: toIsoDateTime(latestPublishedDate(languageArticles)),
    count: languageArticles.length,
    articles: languageArticles
  };
};

await writeFile(join(root, 'assets/js/search-index.en.json'), JSON.stringify(searchIndexByLanguage('en'), null, 2));
await writeFile(join(root, 'assets/js/search-index.ar.json'), JSON.stringify(searchIndexByLanguage('ar'), null, 2));
try {
  await unlink(join(root, 'assets/js/search-index.json'));
} catch {}
console.log('Generated split search indexes with', articles.length, 'articles');

// --- Feed Generation ---

function toRfc2822(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function generateRss(items, lang, title, description, link) {
  const now = toRfc2822(latestPublishedDate(items));
  const channelItems = items.map(item => `  <item>
    <title>${escapeHtml(item.title.replace(/\s*\|\s*doyouknow\.app$/, ''))}</title>
    <link>${item.url}</link>
    <guid isPermaLink="true">${item.url}</guid>
    <pubDate>${toRfc2822(item.datePublished)}</pubDate>
    <description>${escapeHtml(item.description)}</description>
    <category>${escapeHtml(item.category)}</category>
  </item>`).join('\n');
  const channel = `<channel>
  <title>${escapeHtml(title)}</title>
  <link>${link}</link>
  <description>${escapeHtml(description)}</description>
  <language>${lang}</language>
  <lastBuildDate>${now}</lastBuildDate>
${channelItems}
</channel>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
${channel}
</rss>
`;
}

function generateJsonFeed(items, lang, title, homePageUrl, feedUrl) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1',
    title,
    home_page_url: homePageUrl,
    feed_url: feedUrl,
    language: lang,
    items: items.map(item => ({
      id: item.url,
      url: item.url,
      title: item.title.replace(/\s*\|\s*doyouknow\.app$/, ''),
      content_text: item.description,
      date_published: item.datePublished,
      tags: [item.category]
    }))
  }, null, 2);
}

const articleItems = articles.filter(a => a.type === 'article');
const enArticleItems = articleItems.filter(a => a.language === 'en').sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 20);
const arArticleItems = articleItems.filter(a => a.language === 'ar').sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 20);

await writeFile(join(root, 'en', 'rss.xml'), generateRss(enArticleItems, 'en', 'doyouknow.app - English', 'Surprising facts about UAE, Saudi Arabia, and the world.', 'https://doyouknow.app/en/'));
await writeFile(join(root, 'ar', 'rss.xml'), generateRss(arArticleItems, 'ar', 'doyouknow.app - العربية', 'Surprising facts about UAE, Saudi Arabia, and the world.', 'https://doyouknow.app/ar/'));
await writeFile(join(root, 'en', 'feed.json'), generateJsonFeed(enArticleItems, 'en', 'doyouknow.app - English', 'https://doyouknow.app/en/', 'https://doyouknow.app/en/feed.json'));
await writeFile(join(root, 'ar', 'feed.json'), generateJsonFeed(arArticleItems, 'ar', 'doyouknow.app - العربية', 'https://doyouknow.app/ar/', 'https://doyouknow.app/ar/feed.json'));

console.log('Generated RSS and JSON feeds.');

async function updateServiceWorkerCacheName() {
  const mutableAssetFiles = [
    join(root, 'assets/css/style.css'),
    join(root, 'assets/js/site.js'),
    join(root, 'assets/js/search-index.en.json'),
    join(root, 'assets/js/search-index.ar.json')
  ];
  const hash = createHash('sha256');
  for (const file of mutableAssetFiles) {
    hash.update(await readFile(file));
  }
  const cacheName = `dyk-${hash.digest('hex').slice(0, 12)}`;
  const swPath = join(root, 'sw.js');
  const sw = await readFile(swPath, 'utf8');
  const next = sw.replace(/const CACHE_NAME = 'dyk-[^']+';/, `const CACHE_NAME = '${cacheName}';`);
  if (next !== sw) {
    await writeFile(swPath, next);
  }
  console.log('Updated service worker cache name:', cacheName);
}

await updateServiceWorkerCacheName();
