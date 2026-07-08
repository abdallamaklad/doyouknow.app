import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Lazy-load heavy dependencies only when rendering is requested.
let FontEditor = null;
let puppeteer = null;

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fontsDir = join(__dirname, 'fonts');
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const SOURCE_HEIGHT = 675;
const MAX_FILE_KB = 140;
const MAX_TITLE_WIDTH = 960; // 1200 - 2*120 margin

const fontSpecs = [
  { pkg: 'inter', src: 'inter-latin-400-normal.woff2', name: 'Inter-400.ttf', family: 'Inter', weight: 400 },
  { pkg: 'inter', src: 'inter-latin-700-normal.woff2', name: 'Inter-700.ttf', family: 'Inter', weight: 700 },
  { pkg: 'inter', src: 'inter-latin-800-normal.woff2', name: 'Inter-800.ttf', family: 'Inter', weight: 800 },
  { pkg: 'inter', src: 'inter-latin-900-normal.woff2', name: 'Inter-900.ttf', family: 'Inter', weight: 900 },
  { pkg: 'cairo', src: 'cairo-arabic-400-normal.woff2', name: 'Cairo-400.ttf', family: 'Cairo', weight: 400 },
  { pkg: 'cairo', src: 'cairo-arabic-700-normal.woff2', name: 'Cairo-700.ttf', family: 'Cairo', weight: 700 },
  { pkg: 'cairo', src: 'cairo-arabic-800-normal.woff2', name: 'Cairo-800.ttf', family: 'Cairo', weight: 800 },
  { pkg: 'cairo', src: 'cairo-arabic-900-normal.woff2', name: 'Cairo-900.ttf', family: 'Cairo', weight: 900 },
  { pkg: 'tajawal', src: 'tajawal-arabic-400-normal.woff2', name: 'Tajawal-400.ttf', family: 'Tajawal', weight: 400 },
  { pkg: 'tajawal', src: 'tajawal-arabic-700-normal.woff2', name: 'Tajawal-700.ttf', family: 'Tajawal', weight: 700 },
  { pkg: 'tajawal', src: 'tajawal-arabic-800-normal.woff2', name: 'Tajawal-800.ttf', family: 'Tajawal', weight: 800 },
  { pkg: 'tajawal', src: 'tajawal-arabic-900-normal.woff2', name: 'Tajawal-900.ttf', family: 'Tajawal', weight: 900 },
];

async function ensureFontEditor() {
  if (!FontEditor) {
    const mod = await import('fonteditor-core');
    FontEditor = mod.default || mod;
    await FontEditor.woff2.init();
  }
}

async function ensureFonts() {
  await mkdir(fontsDir, { recursive: true });
  await ensureFontEditor();
  for (const spec of fontSpecs) {
    const dest = join(fontsDir, spec.name);
    try {
      await access(dest);
      continue;
    } catch {
      // convert and cache
    }
    const srcPath = join(root, 'node_modules', `@fontsource/${spec.pkg}`, 'files', spec.src);
    const woff2 = await readFile(srcPath);
    const font = FontEditor.Font.create(woff2, { type: 'woff2' });
    const ttf = font.write({ type: 'ttf' });
    await writeFile(dest, ttf);
  }
}

function base64Font(filename) {
  return readFile(join(fontsDir, filename)).then((b) => b.toString('base64'));
}

async function buildFontFaces() {
  await ensureFonts();
  const faces = [];
  for (const spec of fontSpecs) {
    const data = await base64Font(spec.name);
    faces.push(`@font-face { font-family: '${spec.family}'; src: url('data:font/truetype;base64,${data}') format('truetype'); font-weight: ${spec.weight}; font-style: normal; }`);
  }
  return `<style>${faces.join('\n')}</style>`;
}

function isArabicSvg(svg) {
  return /<html[^>]*\blang="ar"/.test(svg) || /dir="rtl"/.test(svg) || /[\u0600-\u06FF]/.test(svg);
}

function findChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/google-chrome',
    '/usr/local/bin/chromium',
    '/snap/bin/chromium',
  ].filter(Boolean);
  return candidates.find((p) => {
    try {
      access(p);
      return true;
    } catch {
      return false;
    }
  });
}

async function renderSvg(browser, svgPath, outputPath, fontFaces) {
  let svg = await readFile(svgPath, 'utf8');
  // Inject deterministic bundled fonts. We keep the original font-family list
  // so the SVG still prefers Inter/Cairo/Tajawal, but now those families are
  // actually available via @font-face.
  svg = svg.replace(/<defs>/, `<defs>${fontFaces}`);
  // Arabic SVGs rely on direction="rtl" on their title group. We also set
  // dir="rtl" on the SVG root and HTML document so bidi shaping is applied.
  if (/[\u0600-\u06FF]/.test(svg)) {
    svg = svg.replace(/<svg\b/, '<svg dir="rtl"');
  }

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: TARGET_WIDTH, height: SOURCE_HEIGHT, deviceScaleFactor: 1 });
    const isArabic = /[\u0600-\u06FF]/.test(svg);
    await page.setContent(`<!DOCTYPE html>
<html dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
<style>
  body { margin:0; padding:0; background:transparent; width:${TARGET_WIDTH}px; height:${SOURCE_HEIGHT}px; }
  body > svg { display:block; width:${TARGET_WIDTH}px; height:${SOURCE_HEIGHT}px; }
</style>
</head>
<body>
${svg}
</body></html>`, { waitUntil: 'networkidle0' });
    // Wait for embedded fonts to finish loading before measuring text.
    await page.evaluate(() => document.fonts.ready);

    // Arabic SVGs can be inconsistent: some right-margin text uses
    // text-anchor="end", some text-anchor="start", and some centered
    // templates use text-anchor="middle". Normalize every <text> element so
    // it extends inward from the edge it is nearest to, with direction set per
    // its actual content language. This fixes outliers like
    // ar-saudi-vision-2030-guide without changing English SVGs.
    if (isArabic) {
      await page.evaluate(() => {
        const centerX = 1200 / 2;
        for (const t of document.querySelectorAll('text')) {
          const x = parseFloat(t.getAttribute('x')) || 0;
          const hasArabic = /[\u0600-\u06FF]/.test(t.textContent || '');
          const originalAnchor = t.getAttribute('text-anchor') || 'start';
          // Centered text stays centered.
          if (originalAnchor === 'middle' || Math.abs(x - centerX) < 80) {
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('direction', hasArabic ? 'rtl' : 'ltr');
            continue;
          }
          if (x > centerX) {
            // Right side: extend left (inward).
            if (hasArabic) {
              t.setAttribute('text-anchor', 'start'); // rtl:start == right edge
              t.setAttribute('direction', 'rtl');
            } else {
              t.setAttribute('text-anchor', 'end'); // ltr:end == right edge
              t.setAttribute('direction', 'ltr');
            }
          } else {
            // Left side: extend right (inward).
            if (hasArabic) {
              t.setAttribute('text-anchor', 'end'); // rtl:end == left edge
              t.setAttribute('direction', 'rtl');
            } else {
              t.setAttribute('text-anchor', 'start'); // ltr:start == left edge
              t.setAttribute('direction', 'ltr');
            }
          }
        }
      });
    }

    // Measure and scale down any text that would overflow the canvas or
    // overlap large decorative graphics. After the normalization above, all
    // text extends inward from its anchor edge: right-side anchors extend left,
    // left-side anchors extend right. We compute the visual bounds from the
    // viewport anchor x and the measured width rather than relying on getBBox()
    // x, which is unreliable for bidi-reordered text in Chrome.
    await page.evaluate(() => {
      const centerX = 1200 / 2;
      const MARGIN = 120;
      const OBSTACLE_BUFFER = 40;

      function getViewportAnchorX(t) {
        const x = parseFloat(t.getAttribute('x')) || 0;
        const ctm = t.getCTM();
        if (!ctm) return x;
        return ctm.a * x + ctm.e;
      }

      function visualBounds(t) {
        const width = t.getBBox().width;
        const x = getViewportAnchorX(t);
        const anchor = t.getAttribute('text-anchor') || 'start';
        if (anchor === 'middle' || Math.abs(x - centerX) < 40) {
          return { left: x - width / 2, right: x + width / 2, edge: 'middle' };
        }
        // Normalized anchors extend inward from the x position.
        if (x > centerX) {
          return { left: x - width, right: x, edge: 'right' };
        }
        return { left: x, right: x + width, edge: 'left' };
      }

      // Detect large, opaque circular/elliptical graphics (e.g. the football
      // ball in World Cup templates) so text can shrink before overlapping them.
      const obstacles = Array.from(document.querySelectorAll('circle, ellipse'))
        .map((el) => {
          const r = parseFloat(el.getAttribute('r')) || 0;
          const rx = parseFloat(el.getAttribute('rx')) || r;
          const ry = parseFloat(el.getAttribute('ry')) || r;
          const rmax = Math.max(rx, ry);
          if (rmax < 80 || rmax > 200) return null;
          const fill = el.getAttribute('fill') || '';
          if (fill.startsWith('url(') || fill === 'none') return null;
          const opacity = parseFloat(el.getAttribute('opacity')) || 1;
          if (opacity < 0.5) return null;
          const rect = el.getBoundingClientRect();
          if (rect.width < 50 || rect.height < 50) return null;
          return {
            left: rect.left - OBSTACLE_BUFFER,
            right: rect.right + OBSTACLE_BUFFER,
            top: rect.top - OBSTACLE_BUFFER,
            bottom: rect.bottom + OBSTACLE_BUFFER,
          };
        })
        .filter(Boolean);

      function overflows(t) {
        const bounds = visualBounds(t);
        const textRect = t.getBoundingClientRect();
        const textTop = textRect.top;
        const textBottom = textRect.bottom;

        // Canvas-edge margin on the free side of the text so it doesn't butt
        // up against the edge (and, for the World Cup templates, gives the
        // ball some breathing room).
        if (bounds.edge === 'middle') {
          if (bounds.left < MARGIN || bounds.right > 1200 - MARGIN) return true;
        } else if (bounds.edge === 'left') {
          if (bounds.right > 1200 - MARGIN) return true;
        } else {
          if (bounds.left < MARGIN) return true;
        }

        // Explicit collision check against detected graphics.
        for (const obs of obstacles) {
          if (textBottom <= obs.top || textTop >= obs.bottom) continue;
          if (bounds.edge === 'left' && bounds.right > obs.left) return true;
          if (bounds.edge === 'right' && bounds.left < obs.right) return true;
          if (bounds.edge === 'middle' && bounds.right > obs.left && bounds.left < obs.right) return true;
        }
        return false;
      }

      const texts = Array.from(document.querySelectorAll('text'));
      for (const t of texts) {
        const originalSize = parseFloat(t.getAttribute('font-size')) || 24;
        let size = originalSize;
        for (let step = 0; step < 30; step++) {
          t.setAttribute('font-size', String(size));
          if (!overflows(t)) break;
          size *= 0.94;
        }
      }
    });

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: TARGET_WIDTH, height: TARGET_HEIGHT },
    });

    // Compress with sharp; use palette for large files.
    let outputBuffer = await sharp(screenshot)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    if (outputBuffer.length > MAX_FILE_KB * 1024) {
      outputBuffer = await sharp(outputBuffer)
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, colours: 128 })
        .toBuffer();
    }
    await writeFile(outputPath, outputBuffer);
    return outputBuffer.length;
  } finally {
    await page.close();
  }
}

async function findSvgs(dirs) {
  const out = [];
  for (const dir of dirs) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.svg')) {
        out.push(join(dir, entry.name));
      }
    }
  }
  return out.sort();
}

async function main() {
  const testMode = process.argv.includes('--test');
  const testSlugs = ['en-burj-khalifa-facts', 'ar-burj-khalifa-facts', 'saudi-arabia-world-cup-2026'];

  puppeteer = (await import('puppeteer-core')).default;
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    console.error('Chrome/Chromium executable not found. Set PUPPETEER_EXECUTABLE_PATH or install Chrome.');
    process.exit(1);
  }
  console.log('Using Chrome:', chromePath);

  const fontFaces = await buildFontFaces();

  const imageDirs = [
    join(root, 'assets/images/articles'),
    join(root, 'assets/images/world-cup-2026'),
  ];
  const svgs = await findSvgs(imageDirs);
  const toRender = testMode
    ? svgs.filter((p) => testSlugs.includes(basename(p, '.svg')))
    : svgs;

  if (toRender.length === 0) {
    console.log('No SVGs matched.');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  console.log(`Rendering ${toRender.length} SVG(s) to ${TARGET_WIDTH}×${TARGET_HEIGHT} PNG…`);
  const results = [];
  try {
    for (const svgPath of toRender) {
      const outputPath = join(dirname(svgPath), `${basename(svgPath, '.svg')}.png`);
      try {
        const size = await renderSvg(browser, svgPath, outputPath, fontFaces);
        results.push({ svg: svgPath, png: outputPath, size });
        console.log(`✓ ${outputPath.replace(root, '')} (${(size / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`✗ ${svgPath.replace(root, '')}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  } finally {
    await browser.close();
  }

  const oversized = results.filter((r) => r.size > MAX_FILE_KB * 1024);
  if (oversized.length) {
    console.warn(`\nWarning: ${oversized.length} file(s) exceed ${MAX_FILE_KB} KB:`);
    for (const r of oversized) {
      console.warn(`  ${r.png.replace(root, '')} — ${(r.size / 1024).toFixed(1)} KB`);
    }
  }

  console.log(`\nDone. Rendered ${results.length} PNG(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
