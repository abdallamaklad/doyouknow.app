#!/usr/bin/env node
/**
 * sensitivity-screen.mjs — hard pre-publish sensitivity gate for doyouknow.app
 *
 * Policy (growth POLICY.md):
 *   prohibited: politics/conflict, allegations, gambling/lotteries — never publish.
 *   approval-required: religion, health, finance, legal, government-procedure —
 *     must not be published without an explicit owner approval record.
 *
 * This script fails (exit 1) when:
 *   - a slug matches a prohibited pattern (regardless of approvals), or
 *   - a slug matches an approval-required pattern with no "approved" record
 *     for that slug in sensitivity-approvals.json.
 *
 * Usage:
 *   node scripts/sensitivity-screen.mjs slug-a slug-b ...   # explicit slugs
 *   node scripts/sensitivity-screen.mjs --pr                # slugs added by this branch vs origin/main
 *   node scripts/sensitivity-screen.mjs --all               # every en/article page (audit mode)
 *   node scripts/sensitivity-screen.mjs --selftest          # built-in assertions
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPROVALS_PATH = join(ROOT, "sensitivity-approvals.json");

const RULES = [
  // prohibited — hard fail, cannot be approved
  ["gambl(e|ing)|casino|lottery|betting|sports-bet", "prohibited"],
  ["election|political-party|geopolitics", "prohibited"],
  // health
  ["melatonin|sleep-apnea|apnea|cpap|insomnia|sleep-paralysis|sleep-regression(s)?|baby-sleep|sleep-tracker(s)?|sleep-debt", "health"],
  ["vitamin(s)?|supplement(s)?|retinol|collagen|probiotic(s)?|creatine|ashwagandha|omega-3|dietary", "health"],
  ["red-light-therapy|cryotherapy|hyperbaric|cold-plunge|ice-bath", "health"],
  ["nasal-breathing|mouth-breathing|breathwork|breathing-technique", "health"],
  ["cochlear|implant(s)?|defibrillator|pacemaker|x-ray|xray|mri|ct-scan|ultrasound|dialysis|ventilator|stent", "health"],
  ["braces|orthodont|invisalign|wisdom-teeth|root-canal|dental|dentist|cavit(y|ies)|fluoride", "health"],
  ["laser-eye|lasik|laser-vision|cataract|glaucoma|eye-surgery|vision-correction", "health"],
  ["surgery|surgical|anesthesia|transplant(s)?|biopsy|chemotherapy|radiation-therapy", "health"],
  ["vaccine(s)?|vaccination|antibiotic(s)?|antidepressant|insulin|diabetes|blood-pressure|cholesterol", "health"],
  ["cancer|tumor|tumour|oncology|alzheimer(s)?|parkinson(s)?|dementia", "health"],
  ["pregnan(cy|t)|fertility|ivf|contraception|birth-control|menopause|pcos", "health"],
  ["mental-health|depression|anxiety|adhd|autism|bipolar|ptsd|therapist(s)?", "health"],
  ["weight-loss|ozempic|wegovy|glp-1|bariatric", "health"],
  ["hormone(s)?|thyroid|testosterone|estrogen|cortisol", "health"],
  ["virus|bacteria|infection|pandemic|epidemic|flu|covid|immunity|immune-system|herd-immunity", "health"],
  ["allerg(y|ies)|intolerance(s)?|asthma|eczema|psoriasis|migraine(s)?|headache", "health"],
  ["genetic(s)?|stem-cell(s)?|blood-test|organ-transplant|heart-disease|stroke", "health"],
  ["clinical-trial(s)?|placebo|medication(s)?|pharmaceutical", "health"],
  ["intermittent-fasting", "health"],
  // religion
  ["umrah|hajj|zamzam|tawaf|kaaba|kiswah|pilgrim(s)?", "religion"],
  ["eid|ramadan|iftar|suhoor|laylat-al-qadr|ashura|mawlid|moon-sighting", "religion"],
  ["islamic|islam|quran|hadith|fatwa|halal|haram|zakat|salah|prayer(s)?|jummah|mosque(s)?|imam|wudu|ablution|janazah|hifz|tafsir|sadaqah", "religion"],
  ["funeral|burial|prophets-mosque|holy-mosques", "religion"],
  ["bible|church|synagogue|buddhis(m|t)|hindu", "religion"],
  // finance
  ["central-bank(s)?|interest-rate(s)?|monetary|inflation|deflation|currency|exchange-rate(s)?|trade-deficit", "finance"],
  ["mortgage|loan(s)?|credit-card(s)?|credit-score(s)?|debt|bank-account(s)?|banking", "finance"],
  ["crypto(currency)?|bitcoin|blockchain|tokenization|nft|defi|stablecoin(s)?", "finance"],
  ["invest(ing|ment)?|investor|stock(s)?|buyback(s)?|etf|index-fund(s)?|sukuk|takaful|mutual-fund(s)?|stock-exchange(s)?|stock-market(s)?|investment-fund", "finance"],
  ["insurance|pension|remittance(s)?|forex|underwriter(s)?", "finance"],
  ["tax|vat|tariff(s)?|customs-duty|income-tax|corporate-tax", "finance"],
  ["salary|minimum-wage|gratuity|end-of-service|payroll", "finance"],
  ["emv|chip-card(s)?|counterfeit|money-laundering", "finance"],
  // legal
  ["small-claims|court|lawsuit|litigation|arbitration|judiciary|mediation", "legal"],
  ["difc|adgm|sharia-court", "legal"],
  ["divorce|custody|alimony|inheritance|estate-planning|faraid", "legal"],
  ["tenant|eviction|landlord|labor-law|labour-law|employment-law", "legal"],
  ["consumer-rights|legal-rights|liability|trademark|copyright", "legal"],
  ["notary|power-of-attorney|attestation", "legal"],
  // government procedure
  ["visa(s)?|immigration|passport(s)?|residency|citizenship|golden-visa|e-gate(s)?|smart-gate(s)?", "government"],
  ["emirates-id|iqama|absher|tawakkalna|national-id|civil-id", "government"],
  ["driving-license|license-transfer|license-renewal|traffic-fine(s)?|salik|municipality", "government"],
  ["government-services|government-funding|ministry|customs-import|census", "government"],
  ["social-security|unemployment-benefit(s)?|welfare", "government"],
  ["elm-platform", "government"],
].map(([pattern, category]) => ({
  category,
  pattern,
  // anchor alternation to hyphen-token boundaries so "bluetooth" never
  // matches "tooth" and "suspension" never matches "pension"
  re: new RegExp(`(^|-)(?:${pattern})($|-)`),
}));

function screen(slug) {
  const hits = [];
  for (const rule of RULES) if (rule.re.test(slug)) hits.push(rule);
  return hits;
}

function loadApprovals() {
  if (!existsSync(APPROVALS_PATH)) return {};
  try {
    const data = JSON.parse(readFileSync(APPROVALS_PATH, "utf8"));
    return data.approvals || {};
  } catch (err) {
    console.error(`FATAL: cannot parse sensitivity-approvals.json: ${err.message}`);
    process.exit(2);
  }
}

function slugsFromArg(argv) {
  return argv.map((s) => s.replace(/\.html$/, "").replace(/^.*\//, ""));
}

function slugsFromPR() {
  let base = "origin/main";
  try {
    execSync("git rev-parse --verify origin/main", { stdio: "pipe" });
  } catch {
    base = "main";
  }
  const out = execSync(
    `git diff --name-only --diff-filter=A ${base}...HEAD -- en/article ar/article`,
    { encoding: "utf8" }
  );
  const slugs = new Set();
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(?:en|ar)\/article\/(.+)\.html$/);
    if (m) slugs.add(m[1]);
  }
  return [...slugs];
}

function slugsFromAll() {
  const dir = join(ROOT, "en", "article");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => basename(f, ".html"));
}

function selftest() {
  const cases = [
    // [slug, expectFlag, expectedCategory|null]
    ["how-a-defibrillator-actually-restarts-a-stopped-heart", true, "health"],
    ["how-umrah-crowd-management-actually-tracks-millions-of-pilgrims", true, "religion"],
    ["how-egypts-income-tax-system-actually-works", true, "finance"],
    ["how-small-claims-court-actually-works", true, "legal"],
    ["how-airport-immigration-e-gates-actually-verify-your-identity", true, "government"],
    ["how-lottery-draws-work", true, "prohibited"],
    ["how-bluetooth-pairing-actually-works", false, null], // 'tooth' substring trap
    ["how-suspension-bridges-actually-hold-up-their-own-weight", false, null], // 'pension' trap
    ["how-vending-machines-actually-verify-your-cash", false, null],
    ["how-traffic-roundabouts-actually-reduce-accidents", false, null],
    ["how-mri-machines-actually-work", true, "health"],
    ["why-moon-sighting-still-matters-for-islamic-dates", true, "religion"],
  ];
  let failures = 0;
  for (const [slug, expectFlag, cat] of cases) {
    const hits = screen(slug);
    const flagged = hits.length > 0;
    const cats = hits.map((h) => h.category);
    const ok = flagged === expectFlag && (!cat || cats.includes(cat));
    if (!ok) {
      failures++;
      console.error(`SELFTEST FAIL: ${slug} -> flagged=${flagged} cats=${cats} (expected flag=${expectFlag} cat=${cat})`);
    }
  }
  if (failures) {
    console.error(`selftest: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log(`selftest: ${cases.length} cases passed`);
  process.exit(0);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--selftest")) selftest();

  let slugs;
  let mode;
  if (argv.includes("--pr")) {
    slugs = slugsFromPR();
    mode = "PR (added article pages vs origin/main)";
  } else if (argv.includes("--all")) {
    slugs = slugsFromAll();
    mode = "full audit (all en/article pages)";
  } else {
    slugs = slugsFromArg(argv.filter((a) => !a.startsWith("--")));
    mode = "explicit slug list";
  }

  if (slugs.length === 0) {
    console.log(`sensitivity-screen: no new article slugs to screen (${mode}). PASS`);
    process.exit(0);
  }

  const approvals = loadApprovals();
  const failures = [];
  const approvedFlags = [];

  for (const slug of slugs) {
    const hits = screen(slug);
    if (hits.length === 0) continue;
    const cats = [...new Set(hits.map((h) => h.category))];
    if (cats.includes("prohibited")) {
      failures.push({ slug, cats, reason: "PROHIBITED topic — never publish (policy)" });
      continue;
    }
    const record = approvals[slug];
    if (record && record.decision === "approved") {
      approvedFlags.push({ slug, cats, record });
    } else if (record && record.decision === "removed") {
      failures.push({ slug, cats, reason: "owner decision=removed on record — page must not be published" });
    } else {
      failures.push({
        slug,
        cats,
        reason: `approval-required (${cats.join(", ")}) with no owner approval record in sensitivity-approvals.json`,
      });
    }
  }

  console.log(`sensitivity-screen: screened ${slugs.length} slug(s) [${mode}]`);
  for (const f of approvedFlags)
    console.log(`  APPROVED-OK  ${f.slug}  [${f.cats.join(",")}] (approved ${f.record.date || "?"})`);
  for (const f of failures) console.error(`  BLOCKED      ${f.slug}  ${f.reason}`);

  if (failures.length > 0) {
    console.error(
      `\nsensitivity-screen: FAIL — ${failures.length} slug(s) blocked.\n` +
        `Hold these pages unpublished until the owner records a decision.\n` +
        `To approve: add an entry per slug to sensitivity-approvals.json, e.g.\n` +
        `  "approvals": { "${failures[0].slug}": { "decision": "approved", "category": "${failures[0].cats[0]}", "date": "YYYY-MM-DD", "evidence": "Discord ops thread message link" } }`
    );
    process.exit(1);
  }
  console.log("sensitivity-screen: PASS");
}

main();
