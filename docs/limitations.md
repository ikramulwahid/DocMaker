# Known Limitations (Phase 0)

Honest inventory of what does **not** work yet, and why. Governing rule
(AGENTS.md): features that cannot round-trip losslessly through the Document IR
are disabled rather than silently dropped — see §"Disabled by design".

## PDF export

1. **One print job = one paper size (Chromium constraint).** Chromium cannot
   mix paper sizes in a single print job (`page.pdf()`/print dialog). Printing
   the whole paginated DOM in one job always yields portrait sheets
   (empirically confirmed: `scripts/spike-pdf-single.mjs`, committed evidence
   `artifacts/spike/spike-single-print.pdf`). The **verified mixed-orientation
   path** is `pnpm pdf <file>` (also used by the e2e parity suite): pages are
   grouped into contiguous size runs, each run is printed with a trailing
   `@page { size }` override + `preferCSSPageSize: true`, and the run PDFs are
   merged with pdf-lib. See ADR-002.
2. **In-app "Export PDF" button** calls `window.print()` on the preview
   iframe. For portrait-only documents this produces a faithful PDF. For
   mixed-orientation documents the browser print dialog keeps a single paper
   size and landscape pages are clipped/scaled — the app warns and points at
   `pnpm pdf`. A native in-app run-merge exporter is post-Phase-0 work.
3. **WebView2 print path unvalidated.** All print/PDF evidence was gathered in
   Playwright's Chromium, which is engine-identical to WebView2, but the
   desktop shell's print call has not been exercised yet. The Tauri window's
   WebView2 print-to-PDF remains a documented limitation; the verified PDF
   path is `pnpm pdf` / the e2e exporter. Status re-confirmed at the Phase-0
   final acceptance review (2026-10-09): no desktop-session evidence had been
   supplied.
4. **Tauri native file workflow is wired, but the interactive dialogs were not
   click-driven in the automated suite.** `tauri-plugin-dialog` +
   `tauri-plugin-fs` are registered with an fs scope covering `$HOME/**`,
   `$APPDATA/**` and `$APPCONFIG/**` (`src-tauri/capabilities/default.json`).
   The native Open/Save dialogs require manual validation in a desktop
   session; the automated tests exercise the browser fallback path
   (`src/app/files.ts`). As of the Phase-0 final acceptance review
   (2026-10-09) no manual desktop-session results had been supplied, so the
   native-dialog workflow and the WebView2 print path (item 3) remain the
   only open Phase-0 gate items and Phase 0 holds as a **conditional
   pass** — see `docs/phase0-manual-smoke-check.md` for the exact checklist
   and evidence requirements. **First manual desktop test (2026-10-09):** the
   native Save dialog opened but the write was denied
   (`fs.write_text_file not allowed`) because `fs:default` in
   tauri-plugin-fs 2.6.0 does not enable `read_text_file`/`write_text_file`.
   The capability now explicitly grants `fs:allow-read-text-file` and
   `fs:allow-write-text-file`, scoped to the same roots
   (`src-tauri/capabilities/default.json`, regression-tested in
   `tests/unit/tauri-capabilities.test.ts`); native save/open require
   re-validation after the fix. **Desktop re-test (2026-10-09):** the native
   Save dialog then succeeded (file written at
   `C:\Projects\Doc\DocMaker\src-tauri\save\untitled.labdoc.json`), but that
   path is **outside** `$HOME/**`, and a follow-up probe (Save As to
   `C:\Temp\docmaker-probe\probe-outside.labdoc.json`, clearly outside the
   declared scope) **also succeeded**. Conclusion: on tauri-plugin-fs 2.6.0
   the capability `fs:scope` is **not enforced** for
   `read_text_file`/`write_text_file` at runtime, so the documented boundary
   did not hold. The application now enforces the same
   `$HOME`/`$APPDATA`/`$APPCONFIG` boundary at the file-I/O layer
   (`src/app/path-scope.ts` + `src/app/files.ts`, unit-tested in
   `tests/unit/path-scope.test.ts`): out-of-scope paths are rejected with an
   explicit, actionable error via the Save/Open status line. The capability
   keeps the declared scope as defense-in-depth/documentation. Re-validation
   (desktop): in-scope Save/Open must succeed and an out-of-scope path must be
   rejected with the block message.

## Preview rendering

5. **Headers/footers are CSS, not DOM.** Paged.js materializes margin boxes
   (`@top-center`, `@bottom-right`, …) as CSS `::after` content on
   `.pagedjs_margin-content`. Consequences: margin text is not selectable, is
   absent from `innerText`, and is not exposed to assistive technology
   (paged.js upstream limitation). Field *resolution* (e.g. `[title]`,
   `[docNumber]`) is asserted through `getComputedStyle(…, '::after').content`
   in the e2e suite. When a section restarts page numbering
   (`pageNumberStart ≠ 1`), the shared layout script replaces the counter
   digits with **real DOM text nodes** (`div[data-pp]`, see ADR-003) — those
   specific digits are selectable and asserted by text + pixel diff; default
   (no restart) documents keep CSS counters verified by pixel variance.
6. **Page-number restart shows the global total.** `Page X of N` renders `N`
   as the document-wide page count, not a per-section count (Word restarts
   `N` per section). Documented approximation — see ADR-003.
7. **System fonts only.** No font embedding or font management; layout uses
   the platform's default serif/sans stacks.
8. **Scale is stress-tested at ~93 pages (observed 2026-10-09).** A generated
   93-page document (64 portrait + 29 landscape sheets, 340 long paragraphs, a
   43-row multi-page table with repeated headers, 3 images, 2 equations, 1
   manual page break, a page-number restart at page 71) renders in the app
   preview and exports through the shared pipeline to a 93-page mixed PDF.
   Facts are recorded in `artifacts/stress-summary.json` — a **generated local
   report** (not committed, regenerated by `tests/e2e/stress.spec.ts`): page
   counts and structure are reproducible facts, while the `previewMs` /
   `exportMs` timings are machine-specific observations (~3.4 s preview and
   ~4.2 s export on the authoring machine), not guarantees. Paged.js still
   re-paginates on every content change (debounced 250 ms); pathological
   single-document sizes beyond ~100 pages remain uncharacterized.
9. **Equations are implemented as semantic IR blocks** (LaTeX source stored,
   rendered offline with bundled KaTeX — never an image, no CDN; V1-EQ).
   Current limits: insert/edit goes through a simple dialog, and there is no
   equation numbering/cross-referencing yet.

## Untrusted document input

`.labdoc.json` files are untrusted (AGENTS.md §27, V1-SEC-003): a hand-edited
or externally supplied document must not be able to trigger external resource
requests, script execution, or CSS injection. Two allow-lists are enforced at
the schema/load boundary and re-checked by the renderer (defense in depth —
see `src/core/ir/sanitize.ts`):

10. **Embedded image sources are allow-listed.** `image.src` must be a
    `data:image/…` URI of a supported type — raster `png`, `jpeg`, `gif`,
    `webp`, `bmp` (base64 payloads only, exactly what the editor's FileReader
    produces) plus `image/svg+xml` (shipped in the Phase-0 goldens before this
    policy; loaded only via `<img>`, where SVG is a static, inert image — no
    scripts, no external fetches). External URLs (`https:`, `http:`, `file:`,
    `javascript:`, `blob:`, relative paths) and unsupported MIME types are
    **rejected with an actionable message** at load/save, and the editor
    refuses to insert them. `;base64` payloads must also satisfy standard
    base64 **syntax** — standard alphabet, total length a multiple of 4,
    canonical `=` padding (impossible lengths such as a single data character
    are rejected; this is syntax validation, not a claim that the bytes decode
    into a valid image). Maximum source size:
    `IMAGE_SRC_MAX_CHARS = 10 MiB` of data-URI text (≈7.5 MiB binary for
    base64) — oversized payloads are rejected, not truncated. Remote image
    support is deliberately not added (V1 is local-first).
11. **Table column widths are a strict grammar, not arbitrary CSS.**
    `table.columnWidths` entries may be `""` (auto, produced by the editor for
    un-resized columns) or a non-negative number with an approved unit —
    `px`, `mm`, `cm`, `pt`, `%` (e.g. `"120px"`, `"1.5cm"`, `"33.3%"`). CSS
    separators, `url(…)`, `expression(…)`, braces, `!important`, extra
    declarations, negative/unitless/unknown-unit values and control characters
    are rejected. If any width in a table is invalid the document is rejected
    on load; the renderer additionally drops the whole fixed-layout `colgroup`
    (safe auto-layout fallback) so injected widths can never emit extra CSS.

## Editor ⇄ IR adapter

12. **Nested lists are flattened.** Tiptap allows arbitrary nesting; the IR
    stores flat bullet lists. Nested lists are flattened depth-first on
    conversion (structure lost, content kept).
13. **Merged cells are dropped.** IR table cells carry no colspan/rowspan;
    Tiptap cells with spans are converted to plain cells.
14. **Column widths are px-only in the editor.** Tiptap's `colwidth` attr is
    pixel-based; non-pixel widths (`%`, `mm`, `cm`, `pt`) are preserved via a
    table-level IR attribute but are not resizable in the Phase-0 UI. The IR
    accepts the documented width grammar (see item 11); the editor only ever
    produces `px` values (or `""` for un-resized columns).
15. **Table captions and image captions/widths are IR-preserved but not
    editable** in the Phase-0 UI (no caption input). They render from the IR
    and survive round-trips (adapter tests cover this).
16. **Disabled by design** (IR cannot represent them → editor must not create
    them): ordered lists, strikethrough, blockquote, code blocks, hard breaks.
    Content containing them from elsewhere is dropped rather than faked.
17. **Empty sections**: an empty editor maps to one empty paragraph (Tiptap
    requires a non-empty doc), so `[] → [empty paragraph]` on round-trip.

## Application

18. **One section is edited at a time** via the section selector; no
    cross-section search/replace.
19. **Metadata is basic** (title, doc number, revision, effective date,
    author, organization, description). Document lifecycle states
    (draft/review/approved) are V1 scope.
20. **Header editing supports plain text + `[field]` tokens**
    (`[title]`, `[docNumber]`, `[revision]`, `[effectiveDate]`, `[page]`,
    `[count]`). Structured multi-run headers are representable in the IR but
    not editable as separate runs in the sidebar.
21. **Watermark UI exposes text + enabled only** (angle/opacity exist in the
    IR/CSS pipeline but have no Phase-0 controls).
22. **Theme selection is a minimal POC**: two themes (Lab Default /
    B&W Standard — ids `lab_default` / `bw_standard`) selectable in the
    sidebar; presentation-only, semantic data is unchanged (tests prove it).
    The full theme library (20 themes) is post-Phase-0.
23. **Web "Save" downloads a file** (browser fallback); the Tauri shell has
    native open/save dialogs wired (manual desktop validation pending — see
    item 4).