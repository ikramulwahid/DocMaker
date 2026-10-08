# Phase-0 Rendering Spike — Evidence

Empirical validation of the pagination engine before committing the architecture
(ADR-001 §21, §39: "chosen by PoC evidence, not popularity"). Engine: **Paged.js
0.4.3**. All results below were produced by the scripts in `scripts/` on
2026-10-08 with Chromium (Playwright 1.63 bundled Chrome-for-Testing 153).

## How to reproduce

```
node scripts/spike-pagedjs.mjs        # capability evidence + screenshots + paginated PDF
node scripts/spike-counters.mjs       # counter(page)/counter(pages) screen-rendering probe
node scripts/spike-pdf.mjs            # Q1 native named pages / Q2 baseline prints
node scripts/spike-pdf-perpage.mjs    # per-size-run print + pdf-lib merge (end-to-end PDF)
```

## Gate questions → results

| # | Question | Result | Artifact |
|---|----------|--------|----------|
| 1 | A4 geometry (96dpi) | Portrait pages = 794×1123 px (793.7×1122.5 + rounding) | `spike-evidence.json` |
| 2 | Mixed orientation via named pages (`@page land` + `page: land`) | ✅ works after sheet-var override (see gap #1). Landscape frame = 1123×794 px | `spike-page-4.png`, evidence `pages[3]` |
| 3 | Running header via `content: element(hdr)` | ✅ rendered text `Spike Laboratory \| SOP-SPIKE-001 \| Rev 03` in `@top-left` of every portrait page | `spike-evidence.json` margins + a11y probe |
| 4 | Footer `Page X of Y` (`counter(page)`/`counter(pages)`) | ✅ painted in **screen** media (shrink-to-fit widths 68–70 px vary per digit) and in print PDFs | `spike-counters.mjs` output |
| 5 | Multi-page table, repeated `thead` | ❌ **not supported upstream** (ancestor-rebuild drops `<thead>`) → ✅ with the prototype `TableHeaderRepeater` handler: continuation page first row = header row, `contentOverflowPx = 0` on all pages, `inserted=1, lookupsFailed=0` | handler in `paged-spike.html`, evidence `pages[1].tables` |
| 6 | Keep-together (`break-inside: avoid`) | ✅ block stayed intact on one page (`keepTogetherSplitAttr = intact`) | evidence `general.keepTogether*` |
| 7 | Keep-with-next (`break-after: avoid`) | ✅ honored by chunker (`layout.js` line 573 via `previousBreakAfter`); heading+paragraph co-located on same page in spike | evidence `general.blockPages` |
| 8 | Image | ✅ data-URI image rendered 420×180 px, `naturalWidth=420`, inside a `break-inside: avoid` figure | evidence `pages[2].images` |
| 9 | Watermark | ✅ `.pagedjs_sheet::after` content `"DRAFT"` computed on all 5 pages; prints with `printBackground` | evidence `watermarkContent` |
| 10 | Live preview | ✅ Paged.js paginates in-page; screenshots captured per rendered page | `spike-page-1..5.png` |
| 11 | PDF with mixed page sizes, preview parity | ✅ per-size contiguous-run print of the **same paginated DOM** + `pdf-lib` merge → `spike-merged.pdf` = 5 pages, sizes `[A4, A4, A4, A4L, A4]` | `spike-merged.pdf`, `run-1..3.pdf` |
| 12 | Whole-DOM single print (baseline, expected-bad) | ❌ all pages portrait (595.92×841.92) — Chromium print takes one paper size per job | `spike-paginated.pdf` |
| 13 | Chromium **native** named-page print (without Paged.js) | ✅ mixed MediaBoxes produced natively — *alternative path noted for ADR-002, rejected for parity reasons* | `native-named-pages.pdf` |

## Gaps found in Paged.js 0.4.3 (workarounds shipped with DocMaker)

1. **Named-page sheet size not applied.** `@page land { size }` writes
   `--pagedjs-pagebox-width/height` scoped to the named page, but the sheet frame
   reads root-level `--pagedjs-width/height` (+ `-left`/`-right` variants), so the
   landscape content was clipped by a portrait sheet. Workaround: a stylesheet
   rule setting all six vars on `.pagedjs_<name>_page` (in the spike HTML and
   destined for DocMaker's generated layout CSS).
2. **No `thead` repetition on continuation pages.** Ancestor rebuild
   (`rebuildAncestors`) clones only `table > tbody`, never `thead`. Workaround:
   a custom `Paged.Handler` (`TableHeaderRepeater`) that (a) re-inserts a cloned
   `thead` into `table[data-split-from]` fragments, looked up via the source
   `data-ref`, and (b) **re-runs `layout.findOverflow()` from `onOverflow`** so
   the header's height is accounted before the break token is finalized — this
   keeps `contentOverflowPx = 0` (no clipped rows).
3. Margin-box text (generated content with counters) is not exposed in the
   accessibility tree even though it paints. Cosmetic; noted as limitation.

## PDF export strategy selected

Print the paginated DOM (not the raw source) so the PDF is byte-identical to the
preview: group consecutive pages by page size, one `page.pdf()` job per run with
an injected trailing `@page { size }` rule + `preferCSSPageSize: true`, then merge
runs in order with `pdf-lib`. Verified: `[A4×3, A4L×1, A4×1]`.

Native Chromium named-page print (row 13) is *not* used: it would paginate with a
second, different engine than the preview (Chromium vs Paged.js) and break the
"one pipeline, preview = PDF" requirement.
