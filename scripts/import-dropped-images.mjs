// Imports hero images produced outside this repo (e.g. by the Hermes agent
// working from editorial/image-generation-sheet.csv) and normalises them to
// the site hero spec: 1200x675 progressive JPEG at assets/images/articles/.
//
// Drop files named <slug>.jpg|jpeg|png|webp into a folder, then:
//   node scripts/import-dropped-images.mjs --dir ~/Desktop/hero-images
//
// It reports unknown filenames, images too small for the hero, and which
// slugs are still outstanding, and writes the slug list for the wiring step.
//
// Flags: --dir <folder> [--force] [--slugs-out <path>] [--dry-run]

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imageDir = join(root, 'assets', 'images', 'articles');

const args = process.argv.slice(2);
function flag(name, fallback = null) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}
const dir = flag('--dir');
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const slugsOut = flag('--slugs-out', join(root, 'editorial', 'imported-slugs.txt'));

if (!dir) {
  console.error('Usage: node scripts/import-dropped-images.mjs --dir <folder> [--force] [--dry-run]');
  process.exit(1);
}

const WIDTH = 1200;
const HEIGHT = 675;
const QUALITY = 82;
const ACCEPTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const manifest = JSON.parse(await readFile(join(root, 'editorial', 'image-manifest.json'), 'utf8'));
const wanted = new Set(manifest.map((m) => m.slug));

await mkdir(imageDir, { recursive: true });

const files = (await readdir(dir)).filter((f) => !f.startsWith('.'));
const imported = [];
const skipped = [];
const unknown = [];
const warnings = [];

for (const file of files.sort()) {
  const ext = extname(file).toLowerCase();
  if (!ACCEPTED.has(ext)) {
    unknown.push(`${file} (unsupported extension)`);
    continue;
  }
  const slug = basename(file, ext);
  if (!wanted.has(slug)) {
    unknown.push(`${file} (no article needs this slug)`);
    continue;
  }

  const dest = join(imageDir, `${slug}.jpg`);
  if (existsSync(dest) && !force) {
    skipped.push(slug);
    continue;
  }

  const src = join(dir, file);
  const meta = await sharp(src).metadata();
  if (meta.width < WIDTH) {
    warnings.push(`${slug}: source is ${meta.width}x${meta.height}, narrower than ${WIDTH}px — will upscale`);
  }

  if (!dryRun) {
    await sharp(src)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
      .toFile(dest);

    const out = await sharp(dest).metadata();
    if (out.width !== WIDTH || out.height !== HEIGHT) {
      throw new Error(`${slug}: wrote ${out.width}x${out.height}, expected ${WIDTH}x${HEIGHT}`);
    }
  }
  imported.push({ slug, from: `${meta.width}x${meta.height}`, kb: dryRun ? 0 : Math.round(statSync(dest).size / 1024) });
}

for (const i of imported) console.log(`ok    ${i.slug}  ${i.from} -> ${WIDTH}x${HEIGHT}${i.kb ? ` (${i.kb}KB)` : ''}`);
for (const s of skipped) console.log(`have  ${s} (already present, use --force to replace)`);
for (const u of unknown) console.log(`?     ${u}`);
for (const w of warnings) console.warn(`warn  ${w}`);

const present = manifest.filter((m) => existsSync(join(imageDir, `${m.slug}.jpg`))).map((m) => m.slug);
const outstanding = manifest.filter((m) => !existsSync(join(imageDir, `${m.slug}.jpg`))).map((m) => m.slug);

if (!dryRun && present.length) {
  await writeFile(slugsOut, `${present.join('\n')}\n`);
}

console.log(`\n${imported.length} imported, ${skipped.length} already present, ${unknown.length} unrecognised.`);
console.log(`${present.length}/${manifest.length} of the missing heroes now exist, ${outstanding.length} outstanding.`);
if (outstanding.length && outstanding.length <= 20) {
  for (const s of outstanding) console.log(`  todo: ${s}`);
}
if (!dryRun && present.length) {
  console.log(`\nSlug list written to ${slugsOut}`);
  console.log(`Next: node scripts/wire-higgsfield-images.mjs --slugs ${slugsOut} && npm test`);
}
