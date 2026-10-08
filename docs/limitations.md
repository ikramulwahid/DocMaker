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
   desktop shell's print call has not been exercised yet.

## Preview rendering

4. **Headers/footers are CSS, not DOM.** Paged.js materializes margin boxes
   (`@top-center`, `@bottom-right`, …) as CSS `::after` content on
   `.pagedjs_margin-content`. Consequences: margin text is not selectable, is
   absent from `innerText`, and is not exposed to assistive technology
   (paged.js upstream limitation). Field *resolution* (e.g. `[title]`,
   `[docNumber]`) is asserted through `getComputedStyle(…, '::after').content`
   in the e2e suite; `counter(page)` digits are verified by per-page footer
   pixel variance.
5. **System fonts only.** No font embedding or font management; layout uses
   the platform's default serif/sans stacks.
6. **Scale not stress-tested.** Validated on ~5-page golden documents. Paged.js
   re-paginates on every content change (debounced 250 ms); 100+ page
   performance is unknown.
7. **Equations are deferred.** Prompt 001's Phase-0 gate does not list
   equations, but V1 acceptance §46 does include equation rendering in the
   Phase-0 rendering gate. This is a tracked traceability gap: no KaTeX/
   MathML pipeline exists yet (documented, not silently ignored).

## Editor ⇄ IR adapter

8. **Nested lists are flattened.** Tiptap allows arbitrary nesting; the IR
   stores flat bullet lists. Nested lists are flattened depth-first on
   conversion (structure lost, content kept).
9. **Merged cells are dropped.** IR table cells carry no colspan/rowspan;
   Tiptap cells with spans are converted to plain cells.
10. **Column widths are px-only in the editor.** Tiptap's `colwidth` attr is
    pixel-based; non-pixel widths (`%`, `mm`) are preserved via a table-level
    IR attribute but are not resizable in the Phase-0 UI.
11. **Table captions and image captions/widths are IR-preserved but not
    editable** in the Phase-0 UI (no caption input). They render from the IR
    and survive round-trips (adapter tests cover this).
12. **Disabled by design** (IR cannot represent them → editor must not create
    them): ordered lists, strikethrough, blockquote, code blocks, hard breaks.
    Content containing them from elsewhere is dropped rather than faked.
13. **Empty sections**: an empty editor maps to one empty paragraph (Tiptap
    requires a non-empty doc), so `[] → [empty paragraph]` on round-trip.

## Application

14. **One section is edited at a time** via the section selector; no
    cross-section search/replace.
15. **Metadata is basic** (title, doc number, revision, effective date,
    author, organization, description). Document lifecycle states
    (draft/review/approved) are V1 scope.
16. **Header editing supports plain text + `[field]` tokens**
    (`[title]`, `[docNumber]`, `[revision]`, `[effectiveDate]`, `[page]`,
    `[count]`). Structured multi-run headers are representable in the IR but
    not editable as separate runs in the sidebar.
17. **Watermark UI exposes text + enabled only** (angle/opacity exist in the
    IR/CSS pipeline but have no Phase-0 controls).
18. **Web "Save" downloads a file** (browser fallback); native save dialogs
    are available in the Tauri shell.
