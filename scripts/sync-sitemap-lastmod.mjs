// Sync <lastmod> in sitemap.xml from each page's own dateModified (JSON-LD).
//
// Why: sitemap.xml is committed to the repo, but the deploy workflow only runs
// `npm test` (audits) — it never runs `npm run build`. So whenever a page's
// dateModified changes without a full build+commit, the committed sitemap's
// <lastmod> drifts stale (see the 2026-09-21 Saudi National Day fix).
//
// What it does:
//   - Walks every <url> block in sitemap.xml (in place, preserving ordering,
//     image blocks, changefreq, priority — minimal diff).
//   - Maps <loc> to the local HTML file (https://doyouknow.app/ar/ -> ar/index.html).
//   - Reads "dateModified" from the page's JSON-LD; falls back to
//     "datePublished"; if neither exists the entry is left unchanged
//     (non-article pages like /about, /category/*, index pages carry no dates).
//   - Rewrites <lastmod> only when the value differs (idempotent: a second
//     run produces no diff and does not touch the file).
//
// Modes:
//   node scripts/sync-sitemap-lastmod.mjs          # fix in place
//   node scripts/sync-sitemap-lastmod.mjs --check  # exit 1 if any drift (CI)
//
// Wired into: package.json `build` and the `Deploy website` workflow, so the
// sitemap can no longer ship stale <lastmod> values.
//
// Note: scripts/prepare.mjs (build step) regenerates sitemap.xml wholesale and
// already uses dateModified; this script covers the far more common path where
// no build is run between a content edit and deploy.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const siteOrigin = 'https://doyouknow.app';
const checkOnly = process.argv.includes('--check');

function localPathFromLoc(loc) {
  let parsed;
  try {
    parsed = new URL(loc);
  } catch {
    return null;
  }
  if (parsed.origin !== siteOrigin) return null;
  let pathname = decodeURI(parsed.pathname).replace(/^\/+/, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
  return pathname;
}

function pageDate(html) {
  const dateModified = html.match(/"dateModified"\s*:\s*"([^"]+)"/)?.[1];
  const datePublished = html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1];
  const value = dateModified || datePublished;
  if (!value) return null;
  // Normalize ISO datetimes (2026-09-19T10:00:00Z) to the sitemap's YYYY-MM-DD style.
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  return dateOnly || null;
}

const sitemapPath = join(root, 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
const blocks = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)];

let synced = 0;
let alreadyOk = 0;
let noDate = 0;
let missingFile = 0;
const drifted = [];
const warnings = [];

let result = '';
let cursor = 0;
for (const match of blocks) {
  const block = match[0];
  let newBlock = block;
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const rel = loc ? localPathFromLoc(loc) : null;
  if (!rel) {
    warnings.push(`unparseable or off-origin loc, left unchanged: ${loc ?? '(none)'}`);
  } else {
    let html = null;
    try {
      html = await readFile(join(root, rel), 'utf8');
    } catch {
      missingFile += 1;
      warnings.push(`missing file for ${loc} (expected ${rel}), left unchanged`);
    }
    if (html) {
      const date = pageDate(html);
      if (!date) {
        noDate += 1; // no dateModified/datePublished on the page: fallback = leave unchanged
      } else {
        const lastmodMatch = block.match(/<lastmod>([^<]*)<\/lastmod>/);
        if (lastmodMatch && lastmodMatch[1] === date) {
          alreadyOk += 1;
        } else {
          synced += 1;
          drifted.push(`${loc}: ${lastmodMatch ? lastmodMatch[1] || '(empty)' : '(no lastmod)'} -> ${date}`);
          newBlock = lastmodMatch
            ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`)
            : block.replace(/<\/loc>/, `</loc><lastmod>${date}</lastmod>`);
        }
      }
    }
  }
  result += sitemap.slice(cursor, match.index) + newBlock;
  cursor = match.index + block.length;
}
result += sitemap.slice(cursor);

console.log(
  `sitemap lastmod sync: ${blocks.length} URLs — ${synced} updated, ${alreadyOk} already in sync, ` +
    `${noDate} without dateModified/datePublished (left unchanged), ${missingFile} missing files`
);
for (const line of drifted) console.log(`  updated ${line}`);
for (const line of warnings) console.log(`  warning: ${line}`);

if (checkOnly) {
  if (synced > 0) {
    console.error(`sitemap.xml is stale: ${synced} <lastmod> entries differ from their pages' dateModified. Run \`npm run sitemap:sync\`.`);
    process.exit(1);
  }
  console.log('sitemap.xml <lastmod> values are in sync.');
  process.exit(0);
}

if (result !== sitemap) {
  await writeFile(sitemapPath, result);
  console.log('sitemap.xml written.');
} else {
  console.log('sitemap.xml unchanged (idempotent).');
}
