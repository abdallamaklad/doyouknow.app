// Composes the final image-generation prompt for each slug that needs a hero:
// shared editorial style + the per-topic subject + the shared negative clause.
//
// Usage:
//   node scripts/compose-image-prompts.mjs [--out <path>] [--from N] [--count N]

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
function flag(name, fallback = null) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}

const manifest = JSON.parse(await readFile(join(root, 'editorial', 'image-manifest.json'), 'utf8'));
const spec = JSON.parse(await readFile(join(root, 'editorial', 'image-prompts.json'), 'utf8'));

const from = Number(flag('--from', '0'));
const count = Number(flag('--count', String(manifest.length)));

const composed = manifest.map((m, i) => ({
  index: i,
  slug: m.slug,
  title: m.title,
  prompt: `${spec._style} Subject: ${spec.prompts[m.slug]} ${spec._negative}`
})).slice(from, from + count);

const outPath = flag('--out');
const payload = `${JSON.stringify(composed, null, 2)}\n`;
if (outPath) {
  await writeFile(outPath, payload);
  console.log(`Composed ${composed.length} prompts -> ${outPath}`);
} else {
  process.stdout.write(payload);
}
