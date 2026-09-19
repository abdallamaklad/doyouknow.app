// Builds the hand-off sheet used to generate the remaining article heroes
// through an external agent (Hermes on a GPT subscription) rather than the
// metered Higgsfield API.
//
// One row per missing hero: the exact output filename, the topic, and the
// full ready-to-paste prompt. The status/notes columns are for the operator.
//
// Usage: node scripts/build-image-sheet.mjs [--out <path>]

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const outPath = args.includes('--out')
  ? args[args.indexOf('--out') + 1]
  : join(root, 'editorial', 'image-generation-sheet.csv');

const manifest = JSON.parse(await readFile(join(root, 'editorial', 'image-manifest.json'), 'utf8'));
const spec = JSON.parse(await readFile(join(root, 'editorial', 'image-prompts.json'), 'utf8'));

// Spreadsheet-safe: quote every field, double inner quotes, and prefix any
// value that a spreadsheet would otherwise read as a formula.
function cell(value) {
  const s = String(value ?? '');
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

// --compact keeps only the unique subject per row; the shared style and
// negative clauses are given to the agent once (editorial/hermes-brief.md)
// instead of being repeated identically in 106 cells.
// --gpt emits the GPT Image 2.5 prompt form: one self-contained instruction
// per row, ready to paste, with the exclusion stated positively.
const compact = args.includes('--compact');
const gpt = args.includes('--gpt');

function gptPrompt(slug) {
  // A few scenes have writing as part of the subject (handwriting practice, a
  // ruler, a map, a printing block). For those the closing asks for the marks
  // to be illegible rather than absent, which would contradict the scene.
  const finish = spec._gpt_finish_overrides?.[slug] || spec._gpt_finish;
  return `${spec._gpt_style} ${spec.prompts[slug]} ${finish}`;
}

const headers = gpt
  ? ['#', 'filename', 'title', 'prompt', 'status', 'notes']
  : compact
    ? ['#', 'slug', 'filename', 'title', 'category', 'subject', 'status', 'notes']
    : ['#', 'slug', 'filename', 'title', 'category', 'prompt', 'status', 'notes'];

const rows = manifest.map((m, i) => gpt
  ? [i + 1, `${m.slug}.jpg`, m.title, gptPrompt(m.slug), '', '']
  : [
      i + 1,
      m.slug,
      `${m.slug}.jpg`,
      m.title,
      m.category,
      compact ? spec.prompts[m.slug] : `${spec._style} Subject: ${spec.prompts[m.slug]} ${spec._negative}`,
      '',
      ''
    ]);

const missingPrompt = manifest.filter((m) => !spec.prompts[m.slug]);
if (missingPrompt.length) {
  console.error(`Refusing to build: ${missingPrompt.length} slug(s) have no prompt.`);
  process.exit(1);
}

// BOM so Excel and Google Sheets both read the Arabic titles as UTF-8.
const csv = `﻿${[headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
await writeFile(outPath, csv);

console.log(`Wrote ${rows.length} rows to ${outPath}`);
