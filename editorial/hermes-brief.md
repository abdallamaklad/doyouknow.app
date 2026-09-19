# Hero image generation brief — 106 remaining articles

Companion to `editorial/image-generation-sheet.csv` (full prompt per row) and
`editorial/image-generation-sheet-compact.csv` (subject only, for the Google
Sheet). Use whichever suits the runner.

The compact sheet holds only the unique **subject** per row. The style and
negative clauses below are identical for all 106 and are given to the agent
once, rather than repeated in every cell.

## Final prompt shape

```
<STYLE>  Subject: <subject from the sheet>  <NEGATIVE>
```

### STYLE (prefix, same every time)

> Editorial documentary photograph, photorealistic, shot on a full-frame camera
> with a fast prime lens. Natural available light, honest muted colour grade,
> candid and unstaged, real textures and imperfections. Composed as a wide 16:9
> editorial hero with calm negative space.

### NEGATIVE (suffix, same every time)

> Absolutely no text, letters, words, numbers, captions, labels, signage, logos,
> brand marks, club crests, flags with writing, watermarks or user-interface
> chrome anywhere in the frame. No collage, no split screens, no infographic
> overlays, no illustration or 3D-render look, no glossy stock-photo gloss, no
> recognisable real public figures.

## Output rules

- **Aspect ratio 16:9**, landscape. A 3:2 or square render is still usable — the
  import step centre-crops to 1200x675 — but 16:9 loses least.
- **At least 1200px wide.** Anything narrower gets upscaled and looks soft;
  the import step warns when this happens.
- **Save each file as the exact `filename` in the sheet**, i.e. `<slug>.jpg`.
  The filename is how the image is matched to its article. PNG and WebP are
  accepted too — the import converts them.
- One image per row. English and Arabic share the same image, so 106 images
  cover all 212 article pages.

## Why "no text" is a hard rule

`CLAUDE.md` rule 7 forbids AI-rendered text inside images. Generated lettering
is also the most common giveaway of an AI image, and it cannot be localised —
the same file is served on the Arabic pages, where Latin text in the artwork
would read as a mistake.

If a render comes back with text, signage or a watermark, regenerate it rather
than accepting it.

## Sensitive topics

Several rows touch religion (Friday prayer, moon sighting, Ramadan). The
subjects are deliberately architectural or natural — mosque interiors, a
crescent moon, a set iftar table. Do not introduce depictions of prophets,
Quranic text, or identifiable worshippers' faces.

Rows covering football and public figures are written to avoid club crests and
recognisable likenesses, both of which the negative clause also forbids.

## When the images are ready

Drop them all in one folder, then from the repo root:

```bash
node scripts/import-dropped-images.mjs --dir <folder>   # normalise to 1200x675
node scripts/wire-higgsfield-images.mjs --slugs editorial/imported-slugs.txt
npm test
```

The import step reports unrecognised filenames, flags anything too small, and
prints which slugs are still outstanding, so it is safe to run repeatedly as
batches come in.
