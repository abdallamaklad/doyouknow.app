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

// The GPT prompt must read as a description, never as an instruction to act on
// an existing picture. An imperative plus a pronoun ("Shoot it in natural
// light", "Keep the marks illegible") routes the request to the image EDIT
// path, where the tool refuses to generate without a source image.
const spec = JSON.parse(await readFile(join(root, 'editorial', 'image-prompts.json'), 'utf8'));
const EDIT_PHRASING = [
  /\bshoot it\b/i, /\bkeep (?:the|any|all)\b/i, /\blet the (?:photograph|picture|image)\b/i,
  /\bmake (?:it|the (?:photo|image|picture))\b/i, /\bedit\b/i, /\badjust\b/i,
  /\bchange the\b/i, /\bremove the\b/i, /\busing (?:this|the) image\b/i
];
const gptTexts = [
  ['_gpt_style', spec._gpt_style],
  ['_gpt_finish', spec._gpt_finish],
  ...Object.entries(spec._gpt_finish_overrides || {}).map(([k, v]) => [`override:${k}`, v]),
  ...Object.entries(prompts).map(([k, v]) => [`subject:${k}`, v])
];
const edity = [];
for (const [label, text] of gptTexts) {
  for (const re of EDIT_PHRASING) {
    // The note field documents the banned phrasing, so it is exempt.
    if (label !== '_gpt_note' && re.test(text)) edity.push(`${label}: matches ${re}`);
  }
}
for (const e of edity) console.error(`EDIT-MODE PHRASING: ${e}`);

if (missing.length || extra.length || empty.length || edity.length) {
  console.error(`FAIL: ${missing.length} missing, ${extra.length} stale, ${empty.length} empty, ${edity.length} edit-phrased.`);
  process.exit(1);
}
console.log('OK: prompt coverage is exact, and no edit-mode phrasing found.');
