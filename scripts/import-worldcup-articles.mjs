import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const source = '/Users/abdallamaklad/Downloads/world_cup_2026_arab_teams_article_pack.md';
const today = '2026-06-26';

const slugs = [
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

const seoTitles = {
  en: [
    'Morocco at World Cup 2026',
    'Egypt at World Cup 2026',
    'Saudi Arabia at World Cup 2026',
    'Tunisia at World Cup 2026',
    'Algeria at World Cup 2026',
    'Iraq at World Cup 2026',
    'Jordan at World Cup 2026',
    'Qatar at World Cup 2026',
    'Arab Teams at World Cup 2026',
    'Morocco’s Defensive Structure',
    'Egypt’s Midfield at World Cup 2026',
    'Saudi Arabia’s Technical Ceiling',
    'Tunisia’s Defensive Grit',
    'Algeria’s Attack at World Cup 2026',
    'Iraq, Jordan & Tournament Discipline',
    'Can an Arab Team Reach the Semifinals?',
    'World Cup Group-Stage Pressure',
    'Morocco, Egypt & Algeria Compared',
    'Arab Fans and World Cup 2026',
    'World Cup 2026 and Arab Football Legacy'
  ],
  ar: [
    'المغرب في كأس العالم 2026',
    'مصر في كأس العالم 2026',
    'السعودية في كأس العالم 2026',
    'تونس في كأس العالم 2026',
    'الجزائر في كأس العالم 2026',
    'العراق في كأس العالم 2026',
    'الأردن في كأس العالم 2026',
    'قطر في كأس العالم 2026',
    'المنتخبات العربية في كأس العالم 2026',
    'التنظيم الدفاعي المغربي',
    'وسط مصر في كأس العالم 2026',
    'السقف الفني للسعودية',
    'تونس وفن البقاء',
    'هجوم الجزائر في كأس العالم 2026',
    'العراق والأردن والانضباط البطولي',
    'هل يصل منتخب عربي إلى نصف النهائي؟',
    'ضغط دور المجموعات في كأس العالم',
    'المغرب ومصر والجزائر',
    'الجمهور العربي وكأس العالم 2026',
    'كأس العالم 2026 وإرث الكرة العربية'
  ]
};

const labels = {
  en: {
    langName: 'English',
    dir: '',
    home: 'Home',
    skip: 'Skip to content',
    navLabel: 'Main navigation',
    mobileLabel: 'Mobile menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    categoryTitle: 'World Cup 2026 & Arab Football',
    categoryHref: '/en/category/world-cup-2026.html',
    categoryMeta: 'World Cup 2026',
    articleBy: 'doyouknow.app Editorial Team',
    read: 'min read',
    contents: 'Table of Contents',
    sources: 'Sources',
    sourceIntro: 'This article was reviewed against current tournament context and official competition resources.',
    related: 'Related reading',
    newsletterTitle: 'Get More Facts Like This',
    newsletterBody: 'Bilingual explainers on sport, culture, places, and big global stories.',
    newsletterButton: 'Contact us',
    switchText: 'العربية',
    siteDescription: 'Bilingual World Cup 2026 explainers focused on Arab teams, tactics, fans, and football legacy.',
    disclaimer: 'This article is informational analysis only. It is not betting, gambling, financial, or professional advice.'
  },
  ar: {
    langName: 'العربية',
    dir: ' dir="rtl"',
    home: 'الرئيسية',
    skip: 'انتقل إلى المحتوى',
    navLabel: 'التنقل الرئيسي',
    mobileLabel: 'القائمة المتنقلة',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    categoryTitle: 'كأس العالم 2026 والكرة العربية',
    categoryHref: '/ar/category/world-cup-2026.html',
    categoryMeta: 'كأس العالم 2026',
    articleBy: 'فريق تحرير doyouknow.app',
    read: 'دقائق للقراءة',
    contents: 'جدول المحتويات',
    sources: 'المصادر',
    sourceIntro: 'تمت مراجعة المقالة ضمن سياق البطولة الحالي وبالاعتماد على موارد رسمية للمسابقة.',
    related: 'مقالات ذات صلة',
    newsletterTitle: 'احصل على المزيد من الشروحات',
    newsletterBody: 'مقالات عربية وإنجليزية مبسطة عن الرياضة والثقافة والأماكن والقصص العالمية.',
    newsletterButton: 'تواصل معنا',
    switchText: 'English',
    siteDescription: 'شروحات عربية وإنجليزية عن كأس العالم 2026 والمنتخبات العربية والتكتيك والجمهور والإرث الكروي.',
    disclaimer: 'هذه المقالة تحليل معلوماتي فقط، وليست نصيحة مراهنات أو مقامرة أو نصيحة مالية أو مهنية.'
  }
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function plainText(markdown) {
  return markdown
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function metaDescription(article, lang) {
  const body = article.sections.find((section) => ['Introduction', 'المقدمة'].includes(section.heading))?.lines.join(' ') || article.sections[0]?.lines.join(' ') || article.title;
  const clean = plainText(body);
  const max = lang === 'ar' ? 155 : 150;
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function parseArticles(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(\d+)\)\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const raw = markdown.slice(start, end).trim();
    const sections = [];
    let current = { heading: 'Intro', lines: [] };
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '—' || trimmed === '---' || trimmed === '**Image**' || trimmed === '**الصورة**') continue;
      const h2 = trimmed.match(/^##\s+(.+)$/);
      if (h2) {
        if (current.lines.length || current.heading !== 'Intro') sections.push(current);
        current = { heading: h2[1].trim(), lines: [] };
        continue;
      }
      current.lines.push(trimmed);
    }
    if (current.lines.length || current.heading !== 'Intro') sections.push(current);
    return { title: match[2].trim(), sections };
  });
}

function renderSection(section, lang) {
  const headingId = slugify(section.heading);
  const lines = section.lines;
  let html = `<h2 id="${headingId}">${escapeHtml(section.heading)}</h2>\n`;
  let inList = false;
  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h3 id="${slugify(h3[1])}">${escapeHtml(h3[1])}</h3>\n`;
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      html += `<li>${inlineMarkdown(bullet[1])}</li>\n`;
      continue;
    }
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    const isDisclaimer = line.includes('betting') || line.includes('مراهنات');
    html += isDisclaimer
      ? `<aside class="editor-note">${escapeHtml(labels[lang].disclaimer)}</aside>\n`
      : `<p>${inlineMarkdown(line)}</p>\n`;
  }
  if (inList) html += '</ul>\n';
  return html;
}

function sectionHeadings(article) {
  return article.sections
    .filter((section) => !['Intro', 'Introduction', 'المقدمة'].includes(section.heading))
    .slice(0, 14)
    .map((section) => ({ title: section.heading, id: slugify(section.heading) }));
}

function faqJson(article) {
  const faq = article.sections.find((section) => ['FAQs', 'الأسئلة الشائعة'].includes(section.heading));
  if (!faq) return null;
  const questions = [];
  let current = null;
  for (const line of faq.lines) {
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      if (current) questions.push(current);
      current = { '@type': 'Question', name: plainText(h3[1]), acceptedAnswer: { '@type': 'Answer', text: '' } };
    } else if (current && !line.startsWith('- ')) {
      current.acceptedAnswer.text = `${current.acceptedAnswer.text} ${plainText(line)}`.trim();
    }
  }
  if (current) questions.push(current);
  return questions.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions } : null;
}

function renderArticle(article, index, lang) {
  const l = labels[lang];
  const slug = slugs[index];
  const otherLang = lang === 'ar' ? 'en' : 'ar';
  const canonical = `https://doyouknow.app/${lang}/article/${slug}.html`;
  const alternate = `https://doyouknow.app/${otherLang}/article/${slug}.html`;
  const title = article.title;
  const seoTitle = `${seoTitles[lang][index]} | doyouknow.app`;
  const description = metaDescription(article, lang);
  const intro = article.sections.find((section) => ['Introduction', 'المقدمة'].includes(section.heading));
  const bodySections = article.sections.filter((section) => section !== intro);
  const headings = sectionHeadings(article);
  const wordCount = plainText(article.sections.flatMap((section) => section.lines).join(' ')).split(/\s+/).length;
  const readTime = Math.max(4, Math.ceil(wordCount / (lang === 'ar' ? 180 : 220)));
  const previous = slugs[(index + slugs.length - 1) % slugs.length];
  const next = slugs[(index + 1) % slugs.length];
  const relatedTitles = lang === 'ar' ? seoTitles.ar : seoTitles.en;
  const related = [
    { slug: previous, title: relatedTitles[(index + slugs.length - 1) % slugs.length] },
    { slug: next, title: relatedTitles[(index + 1) % slugs.length] }
  ];
  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: 'doyouknow.app Editorial Team' },
    publisher: { '@type': 'Organization', name: 'doyouknow.app', logo: { '@type': 'ImageObject', url: 'https://doyouknow.app/assets/images/logo.png' } },
    datePublished: today,
    dateModified: today,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: lang
  };
  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: l.home, item: `https://doyouknow.app/${lang}/` },
      { '@type': 'ListItem', position: 2, name: l.categoryTitle, item: `https://doyouknow.app${l.categoryHref}` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical }
    ]
  };
  const faq = faqJson(article);
  return `<!DOCTYPE html>
<html lang="${lang}"${l.dir} data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${escapeHtml(description)}">
<meta name="author" content="doyouknow.app">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0F172A">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${lang}" href="${canonical}" />
<link rel="alternate" hreflang="${otherLang}" href="${alternate}" />
<link rel="alternate" hreflang="x-default" href="${lang === 'ar' ? canonical : alternate}" />
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://doyouknow.app/assets/images/og-${lang}.png">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_SA' : 'en_US'}">
<meta property="og:site_name" content="doyouknow.app">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="https://doyouknow.app/assets/images/og-${lang}.png">
<title>${escapeHtml(seoTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
<script type="application/ld+json">${JSON.stringify(articleJson)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>
${faq ? `<script type="application/ld+json">${JSON.stringify(faq)}</script>` : ''}
<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml">
</head>
<body>
<a href="#main-content" class="skip-link">${l.skip}</a>
<header class="site-header" role="banner">
  <div class="header-inner">
    <a href="/${lang}/" class="logo" aria-label="doyouknow.app home">
      <div class="logo-icon" aria-hidden="true"></div>
      <span class="logo-text">doyouknow<span class="accent">.app</span></span>
    </a>
    <nav class="main-nav" role="navigation" aria-label="${l.navLabel}">
      <ul class="nav-links">
        <li><a href="/${lang}/">${l.home}</a></li>
        <li><a href="${l.categoryHref}">${l.categoryMeta}</a></li>
        <li><a href="/${otherLang}/article/${slug}.html">${l.switchText}</a></li>
        <li><a href="/${lang}/about.html">${lang === 'ar' ? 'عن الموقع' : 'About'}</a></li>
        <li><a href="/${lang}/contact.html">${lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
      </ul>
    </nav>
  </div>
</header>
<main id="main-content">
<nav class="breadcrumb" aria-label="breadcrumb"><ol><li><a href="/${lang}/">${l.home}</a></li><li><a href="${l.categoryHref}">${l.categoryTitle}</a></li><li class="current" aria-current="page">${escapeHtml(title)}</li></ol></nav>
<div class="article-page">
<article>
<header class="article-header">
<span class="category-badge"><a href="${l.categoryHref}">${l.categoryTitle}</a></span>
<h1>${escapeHtml(title)}</h1>
<div class="article-meta">
<div class="author"><div class="author-avatar">${lang === 'ar' ? 'دك' : 'DY'}</div><span>${l.articleBy}</span></div>
<time datetime="${today}">${today}</time>
<span class="read-time">${readTime} ${l.read}</span>
</div>
</header>
<div class="featured-image" style="background:linear-gradient(135deg,#0F172A,#2563EB);display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;border-radius:12px;"><span style="color:white;font-size:1.1rem;">⚽ ${escapeHtml(l.categoryTitle)}</span></div>
${headings.length ? `<div class="toc"><h3>${l.contents}</h3><ul>${headings.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.title)}</a></li>`).join('')}</ul></div>` : ''}
<div class="article-body">
${intro ? intro.lines.map((line) => `<p>${inlineMarkdown(line)}</p>`).join('\n') : ''}
${bodySections.map((section) => renderSection(section, lang)).join('\n')}
<h2 id="${lang === 'ar' ? 'المصادر' : 'sources'}">${l.sources}</h2>
<p>${l.sourceIntro}</p>
<ul>
<li><a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026">FIFA World Cup 26 official tournament hub</a></li>
<li><a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/schedule">FIFA World Cup 26 match schedule and fixtures</a></li>
<li><a href="https://inside.fifa.com/fifa-world-ranking/men">FIFA/Coca-Cola Men’s World Ranking</a></li>
</ul>
</div>
</article>
<aside class="related-articles"><h2>${l.related}</h2><div class="related-grid">${related.map((item) => `<a href="/${lang}/article/${item.slug}.html" class="related-card"><div class="thumb" style="background:linear-gradient(135deg,#0F172A,#2563EB);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:white;">⚽</div><div class="info"><h4>${escapeHtml(item.title)}</h4><div class="meta">${l.categoryMeta}</div></div></a>`).join('')}</div></aside>
<div class="newsletter-cta" id="newsletter"><h2>${l.newsletterTitle}</h2><p>${l.newsletterBody}</p><a class="btn btn-primary" href="/${lang}/contact.html">${l.newsletterButton}</a></div>
</div>
</main>
<footer class="site-footer"><div class="footer-bottom"><span>© 2026 doyouknow.app</span><a href="/${lang}/">${l.home}</a></div></footer>
<script src="/assets/js/site.js"></script>
</body>
</html>
`;
}

const markdown = await readFile(source, 'utf8');
const articles = parseArticles(markdown);
if (articles.length !== 40) throw new Error(`Expected 40 articles, found ${articles.length}`);

await mkdir(join(root, 'en/article'), { recursive: true });
await mkdir(join(root, 'ar/article'), { recursive: true });

for (let index = 0; index < 20; index += 1) {
  await writeFile(join(root, 'en/article', `${slugs[index]}.html`), renderArticle(articles[index], index, 'en'));
  await writeFile(join(root, 'ar/article', `${slugs[index]}.html`), renderArticle(articles[index + 20], index, 'ar'));
}

console.log('Imported 40 World Cup 2026 bilingual articles.');
