import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const googleTag = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6VQZY87LJB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6VQZY87LJB');
</script>`;

function worldCupCompactWidget(lang) {
  return `<div class="wc-home-widget" data-world-cup-live data-widget="compact" data-lang="${lang}"></div>`;
}

function ensureWorldCupWidgetScript(html) {
  if (!html.includes('data-world-cup-live') || html.includes('/assets/js/world-cup-live.js?v=20260626-2312')) return html;
  return html.replace('</body>', '<script src="/assets/js/world-cup-live.js?v=20260626-2312" defer></script></body>');
}
const editorialReview = new Set([
  'en/article/start-business-dubai.html',
  'en/article/uae-corporate-tax.html',
  'en/article/uae-golden-visa-guide.html',
  'en/article/what-is-chatgpt.html',
  'en/article/what-is-google-gemini.html',
  'ar/article/absher-portal-guide.html',
  'ar/article/hajj-guide.html',
  'ar/article/open-bank-account-saudi.html',
  'ar/article/qiyas-guide.html',
  'ar/article/qobool-guide.html',
  'ar/article/ramadan-health-guide.html',
  'ar/article/riyadh-season.html',
  'ar/article/saudi-driving-license.html',
  'ar/article/saudi-health-insurance.html',
  'ar/article/umrah-guide.html'
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
const categoryGroups = [
  { lang: 'en', slug: 'world-cup-2026', title: 'World Cup 2026 & Arab Football', description: 'Bilingual World Cup 2026 explainers focused on Arab teams, tactics, fans, and football legacy.', files: worldCupArticleSlugs },
  { lang: 'en', slug: 'dubai', title: 'Dubai & UAE Places', description: 'Discover Dubai and Abu Dhabi landmarks, engineering stories, cultural destinations, and practical travel inspiration.', files: ['burj-khalifa-facts','deep-dive-dubai','dubai-frame','dubai-metro-guide','dubai-miracle-garden','dubai-police-lamborghini','dubai-vs-abu-dhabi','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','sheikh-zayed-grand-mosque-guide','yas-island-abu-dhabi'] },
  { lang: 'en', slug: 'guides', title: 'UAE Practical Guides', description: 'Clear UAE guides for residents, visitors, professionals, and anyone planning a major decision in the Emirates.', files: ['best-beaches-dubai','best-restaurants-dubai','save-money-dubai','start-business-dubai','uae-corporate-tax','uae-golden-visa-guide'] },
  { lang: 'en', slug: 'technology', title: 'Technology Explained', description: 'Plain-language introductions to important artificial intelligence tools and the technology changing everyday life.', files: ['what-is-chatgpt','what-is-google-gemini'] },
  { lang: 'ar', slug: 'world-cup-2026', title: 'كأس العالم 2026 والكرة العربية', description: 'شروحات عربية وإنجليزية عن كأس العالم 2026 والمنتخبات العربية والتكتيك والجمهور والإرث الكروي.', files: worldCupArticleSlugs },
  { lang: 'ar', slug: 'saudi', title: 'السعودية: التاريخ والثقافة', description: 'اكتشف تاريخ المملكة العربية السعودية وتراثها ومدنها وثقافتها من خلال مقالات عربية واضحة وموثوقة.', files: ['alula-saudi-arabia','best-places-saudi-arabia','diriyah-saudi-arabia','edge-of-the-world-riyadh','pearl-diving-saudi','ronaldo-saudi-arabia','saudi-arabia-history','saudi-football-global','saudi-national-day','saudi-no-rivers'] },
  { lang: 'ar', slug: 'vision-2030', title: 'رؤية السعودية 2030 والمشاريع الكبرى', description: 'تعرف على مشاريع رؤية السعودية 2030 والمدن والوجهات الجديدة من خلال شروحات تفصل الحقائق عن التوقعات.', files: ['kingdom-tower-riyadh','qiddiya-saudi-arabia','red-sea-project-saudi','riyadh-season','the-line-neom','what-is-neom'] },
  { lang: 'ar', slug: 'guides', title: 'أدلة عملية في السعودية', description: 'أدلة عربية مبسطة للخدمات والمنصات والإجراءات المهمة في السعودية مع إحالات إلى المصادر الرسمية.', files: ['absher-portal-guide','open-bank-account-saudi','qiyas-guide','qobool-guide','saudi-driving-license','saudi-health-insurance'] },
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
  ['ar/terms.html', 'en/terms.html']
]);
for (const slug of worldCupArticleSlugs) {
  pairedPages.set(`en/article/${slug}.html`, `ar/article/${slug}.html`);
  pairedPages.set(`ar/article/${slug}.html`, `en/article/${slug}.html`);
}
pairedPages.set('en/category/world-cup-2026.html', 'ar/category/world-cup-2026.html');
pairedPages.set('ar/category/world-cup-2026.html', 'en/category/world-cup-2026.html');
pairedPages.set('en/world-cup-2026-live.html', 'ar/world-cup-2026-live.html');
pairedPages.set('ar/world-cup-2026-live.html', 'en/world-cup-2026-live.html');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    entry.isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

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

function stripSearchAction(html) {
  return html.replace(/<script type="application\/ld\+json">(?=[\s\S]*?"SearchAction")[\s\S]*?<\/script>\s*/g, '');
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
    '<a href="/en/category/dubai.html" class="category-tile"><div class="tile-icon">◈</div><div class="tile-info"><h4>Dubai &amp; places</h4><span>13 articles</span></div></a><a href="/en/category/guides.html" class="category-tile"><div class="tile-icon">✓</div><div class="tile-info"><h4>Practical guides</h4><span>6 articles</span></div></a><a href="/en/category/technology.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>Technology</h4><span>2 articles</span></div></a>'
  );
  html = html.replace(
    '<a href="/ar/category/General.html" class="category-tile"><div class="tile-icon" style="background:#64748B15;color:#64748B;">📚</div><div class="tile-info"><h4>عام</h4><span>28 مقال</span></div></a>',
    '<a href="/ar/category/saudi.html" class="category-tile"><div class="tile-icon">🏛️</div><div class="tile-info"><h4>تاريخ السعودية</h4><span>10 مقالات</span></div></a><a href="/ar/category/vision-2030.html" class="category-tile"><div class="tile-icon">✦</div><div class="tile-info"><h4>رؤية 2030</h4><span>6 مقالات</span></div></a><a href="/ar/category/guides.html" class="category-tile"><div class="tile-icon">✓</div><div class="tile-info"><h4>أدلة عملية</h4><span>6 مقالات</span></div></a><a href="/ar/category/islamic.html" class="category-tile"><div class="tile-icon">◆</div><div class="tile-info"><h4>معرفة إسلامية</h4><span>5 مقالات</span></div></a>'
  );
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
  html = stripSearchAction(html);
  html = linkExistingCategory(html, relativeFile);
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
  if (relativeFile === 'en/index.html' && !html.includes('data-world-cup-live')) {
    html = html.replace('</div><div class="section-header">\n<h2>Latest Articles</h2>', `</div>${worldCupCompactWidget('en')}<div class="section-header">\n<h2>Latest Articles</h2>`);
  }
  if (relativeFile === 'ar/index.html' && !html.includes('data-world-cup-live')) {
    html = html.replace('</div><div class="section-header">\n<h2>أحدث المقالات</h2>', `</div>${worldCupCompactWidget('ar')}<div class="section-header">\n<h2>أحدث المقالات</h2>`);
  }
  html = ensureWorldCupWidgetScript(html);
  html = normalizeHreflang(html, relativeFile);
  let h1Seen = 0;
  html = html.replace(/<\/?h1(?=[\s>])[^>]*>/g, (tag) => {
    if (tag.startsWith('<h1')) h1Seen += 1;
    if (h1Seen <= 1) return tag;
    return tag.replace(tag.startsWith('</') ? '</h1' : '<h1', tag.startsWith('</') ? '</h2' : '<h2');
  });
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
  const cards = articles.map((article) => {
    const image = group.slug === 'world-cup-2026'
      ? `<img class="card-image" src="/assets/images/world-cup-2026/${article.slug}.svg" alt="" width="1200" height="675" loading="lazy">`
      : '';
    return `<a href="/${group.lang}/article/${article.slug}.html" class="article-card">${image}<div class="card-content"><span class="category-badge">${escapeHtml(group.title)}</span><h2 class="card-title">${escapeHtml(article.title)}</h2><p class="card-excerpt">${escapeHtml(article.description)}</p></div></a>`;
  }).join('');
  const liveCta = group.slug === 'world-cup-2026'
    ? worldCupCompactWidget(group.lang)
    : '';
  const itemList = articles.filter((a) => !a.noindex).map((article, index) => ({ '@type': 'ListItem', position: index + 1, url: `https://doyouknow.app/${group.lang}/article/${article.slug}.html`, name: article.title }));
  const alternateBlock = hreflangBlock(`${group.lang}/category/${group.slug}.html`, group.lang, canonical);
  const page = `<!doctype html><html lang="${group.lang}"${rtl ? ' dir="rtl"' : ''} data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(group.description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">${alternateBlock}<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml"><meta property="og:title" content="${escapeHtml(group.title)} | doyouknow.app"><meta property="og:description" content="${escapeHtml(group.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://doyouknow.app/assets/images/og-${group.lang}.png"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(group.title)} | doyouknow.app</title><link rel="stylesheet" href="/assets/css/style.css"><script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org', '@type':'CollectionPage', name:group.title, description:group.description, url:canonical, inLanguage:group.lang, mainEntity:{ '@type':'ItemList', itemListElement:itemList } })}</script>${googleTag}</head><body><a href="#main-content" class="skip-link">${rtl ? 'انتقل إلى المحتوى' : 'Skip to content'}</a><header class="site-header"><div class="header-inner"><a href="${home}" class="logo" aria-label="doyouknow.app"><span class="logo-text">doyouknow<span class="accent">.app</span></span></a><nav class="main-nav" aria-label="${rtl ? 'التنقل الرئيسي' : 'Main navigation'}"><ul class="nav-links"><li><a href="${home}">${rtl ? 'الرئيسية' : 'Home'}</a></li><li><a href="${home}">${rtl ? 'كل المقالات' : 'All articles'}</a></li><li><a href="/${rtl ? 'en' : 'ar'}/">${rtl ? 'English' : 'العربية'}</a></li></ul></nav></div></header><main id="main-content"><section class="content-section"><p class="category-badge">doyouknow.app</p><h1>${escapeHtml(group.title)}</h1><p class="hero-subtitle" style="margin-inline:0">${escapeHtml(group.description)}</p>${liveCta}<div class="article-grid">${cards}</div></section></main><footer class="site-footer"><div class="footer-bottom"><span>© 2026 doyouknow.app</span><a href="${home}">${rtl ? 'الرئيسية' : 'Home'}</a></div></footer><script src="/assets/js/site.js"></script>${group.slug === 'world-cup-2026' ? '<script src="/assets/js/world-cup-live.js?v=20260626-2312" defer></script>' : ''}</body></html>`;
  await writeFile(join(root, group.lang, 'category', `${group.slug}.html`), page);
}

const sitemapFiles = (await walk(root)).filter((path) => path.endsWith('.html'));
const sitemapUrls = new Map();
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
}
const sitemapEntries = [...sitemapUrls.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([loc, meta]) => `<url><loc>${loc}</loc><lastmod>${meta.dateModified}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority></url>`)
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
await writeFile(join(root, 'sitemap.xml'), sitemap);
console.log('Prepared production paths and metadata.');
