import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const imageDir = join(root, 'assets', 'images', 'world-cup-2026');

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

const palettes = [
  ['#006233', '#C1272D'], ['#CE1126', '#111827'], ['#006C35', '#F8FAFC'], ['#E70013', '#F8FAFC'],
  ['#006233', '#FFFFFF'], ['#CE1126', '#111827'], ['#007A3D', '#CE1126'], ['#8A1538', '#FFFFFF'],
  ['#0F172A', '#D97706'], ['#006233', '#0F172A'], ['#CE1126', '#D97706'], ['#006C35', '#0F172A'],
  ['#E70013', '#111827'], ['#006233', '#D97706'], ['#CE1126', '#007A3D'], ['#0F172A', '#2563EB'],
  ['#7C2D12', '#D97706'], ['#006233', '#CE1126'], ['#2563EB', '#D97706'], ['#0F172A', '#059669']
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function svgFor(slug, index) {
  const [primary, accent] = palettes[index % palettes.length];
  const label = slug
    .replace('-world-cup-2026', '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(label)} — World Cup 2026 football illustration</title>
  <desc id="desc">Original doyouknow.app football artwork for a World Cup 2026 article.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="56%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="69%" cy="34%" r="48%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".34"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#020617" flood-opacity=".35"/>
    </filter>
    <pattern id="dots" width="38" height="38" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2.3" fill="#FFFFFF" opacity=".18"/>
    </pattern>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#dots)" opacity=".65"/>
  <circle cx="840" cy="230" r="330" fill="url(#glow)"/>
  <path d="M0 497 C164 430 280 534 424 466 C572 397 688 493 832 426 C956 368 1056 392 1200 322 L1200 675 L0 675 Z" fill="#FFFFFF" opacity=".12"/>
  <path d="M110 540 C250 480 340 575 493 514 C650 451 782 525 935 467 C1045 425 1121 430 1200 397" fill="none" stroke="#FFFFFF" stroke-width="4" opacity=".34"/>
  <g transform="translate(105 105)" opacity=".42">
    <rect x="0" y="0" width="990" height="465" rx="34" fill="none" stroke="#FFFFFF" stroke-width="5"/>
    <line x1="495" y1="0" x2="495" y2="465" stroke="#FFFFFF" stroke-width="5"/>
    <circle cx="495" cy="232" r="82" fill="none" stroke="#FFFFFF" stroke-width="5"/>
    <rect x="0" y="128" width="158" height="210" fill="none" stroke="#FFFFFF" stroke-width="5"/>
    <rect x="832" y="128" width="158" height="210" fill="none" stroke="#FFFFFF" stroke-width="5"/>
  </g>
  <g filter="url(#shadow)" transform="translate(766 216)">
    <circle cx="0" cy="0" r="132" fill="#F8FAFC"/>
    <path d="M0-74 70-23 43 60-43 60-70-23Z" fill="#0F172A"/>
    <path d="M0-124 0-74M118-38 70-23M73 101 43 60M-73 101-43 60M-118-38-70-23" stroke="#0F172A" stroke-width="18" stroke-linecap="round"/>
    <path d="M-42-116 C-86-98-121-51-128 0M42-116 C86-98 121-51 128 0M-103 78 C-65 121-4 143 52 128M103 78 C65 121 4 143-52 128" fill="none" stroke="#CBD5E1" stroke-width="7" opacity=".9"/>
  </g>
  <g transform="translate(92 116)">
    <text x="0" y="0" fill="#FFFFFF" opacity=".88" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">DOYOUKNOW.APP</text>
    <text x="0" y="82" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800">World Cup 2026</text>
    <text x="0" y="138" fill="#FFFFFF" opacity=".88" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">${escapeHtml(label)}</text>
    <rect x="0" y="178" width="320" height="8" rx="4" fill="${accent}"/>
  </g>
  <g transform="translate(92 537)">
    <rect x="0" y="0" width="356" height="58" rx="29" fill="#FFFFFF" opacity=".14"/>
    <text x="30" y="38" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">Arab football analysis</text>
  </g>
</svg>
`;
}

function replaceArticleSchema(html, imageUrl) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (match, raw) => {
    try {
      const data = JSON.parse(raw);
      if (data['@type'] !== 'Article') return match;
      data.image = {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 675
      };
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return match;
    }
  });
}

async function updateArticle(lang, slug) {
  const path = join(root, lang, 'article', `${slug}.html`);
  let html = await readFile(path, 'utf8');
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug;
  const alt = lang === 'ar'
    ? `رسم توضيحي لكرة القدم لمقال ${title}`
    : `Football illustration for ${title}`;
  const imagePath = `/assets/images/world-cup-2026/${slug}.svg`;
  const imageUrl = `https://doyouknow.app${imagePath}`;

  html = html
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${imageUrl}">`)
    .replace(
      /<div class="featured-image"[\s\S]*?<\/div>/,
      `<img class="featured-image" src="${imagePath}" alt="${escapeHtml(alt)}" width="1200" height="675" loading="eager" fetchpriority="high">`
    );

  html = replaceArticleSchema(html, imageUrl);
  await writeFile(path, html);
}

await mkdir(imageDir, { recursive: true });

for (const [index, slug] of slugs.entries()) {
  await writeFile(join(imageDir, `${slug}.svg`), svgFor(slug, index));
  await updateArticle('en', slug);
  await updateArticle('ar', slug);
}

console.log(`Added original hero images to ${slugs.length * 2} World Cup article pages.`);
