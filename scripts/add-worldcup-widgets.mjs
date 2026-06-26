import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
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

async function updateArticle(lang, slug) {
  const file = join(root, lang, 'article', `${slug}.html`);
  let html = await readFile(file, 'utf8');
  const widget = `<div class="wc-article-widget" data-world-cup-live data-widget="compact" data-lang="${lang}"></div>`;

  if (!html.includes('data-world-cup-live')) {
    html = html.replace(/<\/header>\s*<img class="featured-image"/, `</header>\n${widget}\n<img class="featured-image"`);
  }
  if (!html.includes('/assets/js/world-cup-live.js?v=20260626-2312')) {
    html = html.replace('</body>', '<script src="/assets/js/world-cup-live.js?v=20260626-2312" defer></script>\n</body>');
  }

  await writeFile(file, html);
}

for (const slug of slugs) {
  await updateArticle('en', slug);
  await updateArticle('ar', slug);
}

console.log(`Added compact World Cup widgets to ${slugs.length * 2} article pages.`);
