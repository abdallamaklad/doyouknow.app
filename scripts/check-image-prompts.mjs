// Validates editorial/image-prompts.json against editorial/image-manifest.json:
// every missing-hero slug must have exactly one prompt, and no prompt may
// reference a slug that does not need an image.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(join(root, 'editorial', 'image-manifest.json'), 'utf8'));
const { prompts } = JSON.parse(await readFile(join(root, 'editorial', 'image-prompts.json'), 'utf8'));

const need = new Set(manifest.map((m) => m.slug));
const have = new Set(Object.keys(prompts));

const missing = [...need].filter((s) => !have.has(s));
const extra = [...have].filter((s) => !need.has(s));
const empty = [...have].filter((s) => !String(prompts[s] || '').trim());

for (const s of missing) console.error(`NO PROMPT: ${s}`);
for (const s of extra) console.error(`STALE PROMPT: ${s}`);
for (const s of empty) console.error(`EMPTY PROMPT: ${s}`);

console.log(`${need.size} slugs need images, ${have.size} prompts defined.`);
if (missing.length || extra.length || empty.length) {
  console.error(`FAIL: ${missing.length} missing, ${extra.length} stale, ${empty.length} empty.`);
  process.exit(1);
}
console.log('OK: prompt coverage is exact.');
