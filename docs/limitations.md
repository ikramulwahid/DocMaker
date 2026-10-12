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
   merged with pdf-lib. See ADR-002. **M4:** the run grouping is keyed on the
   shared effective page geometry (`src/core/ir/pageGeometry.ts`), so every
   listed format — A4/A3/A5/Letter/Legal/Tabloid/Executive portrait &
   landscape plus Custom — exports with the correct MediaBox in millimetres →
   points (`72/25.4`); the e2e parity suite asserts every format/orientation
   (golden-07) with a ±1 pt tolerance.
2. **In-app "Export PDF" button** calls `window.print()` on the preview
   iframe. When every sheet shares one effective geometry this produces a
   faithful PDF. For **mixed-geometry** documents (differing page size or
   orientation) the browser print dialog keeps a single paper size and the
   non-matching pages are clipped/scaled — the app warns and points at
   `pnpm pdf`. A native in-app run-merge exporter is post-Phase-0 work.
3. **WebView2 print path — validated in a desktop session (2026-10-09,**
   **Phase 0.6).** Exercised via the in-app Export PDF button in the native
   Tauri shell. Portrait-only document: faithful PDF
   (`C:\Users\Ikram\Downloads\Moisture_in_Coal.labdoc.pdf`, 3 pages, all
   595×842 pt). Mixed-orientation document: the print dialog keeps the
   documented single paper size — `golden-03-phase0-gate.pdf` has 5 pages, all
   595×842 pt, landscape pages clipped/scaled — with the in-app warning
   pointing at `pnpm pdf` (matches items 1–2; documented limitation, not a
   defect). The **verified mixed-orientation path remains `pnpm pdf`** / the
   e2e exporter; a native in-app run-merge exporter is post-Phase-0 work.
4. **Tauri native file workflow — status: PASS (2026-10-09, Phase 0.6);
   historical incident and mitigation recorded below.** Native Win32 Open/Save
   dialogs cannot be click-driven by the automated (Playwright) suite —
   engine-identical Chromium is not the desktop shell — so the dialogs require
   a manual desktop session; the automated tests exercise the browser fallback
   path (`src/app/files.ts`). That manual session has now been executed: **all
   nine rows of `docs/phase0-manual-smoke-check.md` are PASS** with recorded
   evidence (native Save/Open artifacts and WebView2 print PDFs, listed there).
   The earlier statement that "Phase 0 holds as a **conditional pass** pending
   desktop evidence" is **obsolete — superseded** by that walkthrough and is
   retained below only as the historical record. **First manual desktop test
   (2026-10-09):** the
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
   keeps the declared scope as defense-in-depth/documentation. Path traversal
   is rejected as well: any path whose components include `.` or `..` (e.g.
   `C:\Users\Ikram\..\..\Temp\probe.json`, which resolves to `C:\Temp\probe.json`
   outside the root) is blocked by `src/app/path-scope.ts` before the
   containment check — lexical prefix matching cannot resolve `..` safely
   (regression-tested in `tests/unit/path-scope.test.ts`). This guard is an
   application-level check on the paths routed through `saveJson()` /
   `openJson()`; it is **not** an OS-level security boundary and does not
   intercept direct calls to the Tauri fs plugin or other filesystem access.
   Desktop re-validation (Phase 0.6, 2026-10-09): in-scope Save
   (`C:\Users\Ikram\Documents\Moisture_in_Coal.labdoc.json`) and Open
   succeeded; out-of-scope Save/Open was rejected with the block message; a
   typed `..` path was canonicalized by the Windows dialog itself into the
   in-scope folder, so the app-side dot-component rule could not be triggered
   through the dialog and remains pinned by unit tests
   (`tests/unit/path-scope.test.ts`). See `docs/phase0-manual-smoke-check.md`
   for the full evidence set.

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

12. **Mixed-type nesting is normalised to the outer list type.** Canonical
    lists are recursive (M3): a list item may hold nested child items to
    arbitrary depth. The model is *uniform* — the whole tree shares one
    `listType` and bullet `marker` — so a foreign nested list of a **different**
    type is normalised to the outer list's type rather than dropped (structure
    and content are preserved). Legacy flat `bulletList` blocks load unchanged
    and are upgraded to the canonical recursive `list` on the next edit/save
    (see the lists section below).
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
    them): blockquote, code blocks, hard breaks. Content
    containing them from elsewhere is dropped rather than faked. Strikethrough
    was in this list through M1 — M2 now models it as a character mark (see the
    character/paragraph-formatting section below). Ordered lists were in this
    list through M2 — M3 now models them as canonical `list` blocks (see the
    lists section below).
17. **Empty sections**: an empty editor maps to one empty paragraph (Tiptap
    requires a non-empty doc), so `[] → [empty paragraph]` on round-trip.

## Application

18. **One section is edited at a time** via the section selector; no
    cross-section search/replace.
19. **Metadata** carries title, doc number, revision, effective date, author,
    organization, description **and (M5) document type, department, review
    date, status, prepared/reviewed/approved by, classification** — see the M5
    section below. Document lifecycle states (draft/review/approved as a
    workflow) are V1 scope; `status` is a plain data field, not a lifecycle.
20. **Header/footer editing supports plain text + `[field]` tokens**
    (`[title]`, `[docNumber]`, `[revision]`, `[effectiveDate]`, `[reviewDate]`,
    `[status]`, `[laboratoryName]`, `[pageNumber]`, `[pageCount]`; `[page]` and
    `[count]` are accepted **parse aliases** for the two page tokens).
    Structured multi-run headers are representable in the IR but not editable as
    separate runs in the sidebar. The **laboratory logo** field is a documented
    HF limitation (M5 section below); `[laboratoryName]` works in HF.
21. **Watermark UI exposes text + enabled only** (angle/opacity exist in the
    IR/CSS pipeline but have no Phase-0 controls).
22. **Theme selection is a minimal POC**: two themes (Lab Default /
    B&W Standard — ids `lab_default` / `bw_standard`) selectable in the
    sidebar; presentation-only, semantic data is unchanged (tests prove it).
    The full theme library (20 themes) is post-Phase-0.
23. **Web "Save" downloads a file** (browser fallback); the Tauri shell has
    native open/save dialogs wired and desktop-validated (2026-10-09 — see
    item 4 and `docs/phase0-manual-smoke-check.md`).

## Style system (M1, delivered 2026-10-10)

V1-STYLE-001..004, V1-TXT-001 and the V1-DOC-002 base-style leg are delivered
(ADR-005); the honest residual limits are:

24. **Deleted/unknown style references fall back deterministically, they do
    not delete content.** A block whose `style` reference no longer exists
    (custom style removed, or a file hand-edited to reference an unknown id)
    keeps its content and its reference; the resolver substitutes the
    documented safe default (`defaultFallbackStyle()`, normal-shaped) and the
    renderer emits **no** CSS rule for the unknown id, so the block renders
    with defaults. The reference is *not* rewritten to `normal`, so a re-save
    preserves the author's (possibly stale) reference — deterministic, no
    silent data loss (AGENTS.md §46/§64). Style lookups are own-property
    based, so a reference whose id collides with a JavaScript object
    prototype member (`constructor`, `toString`, `hasOwnProperty`, …) is
    treated as exactly this unknown-id case: it falls back safely and never
    resolves to an inherited member.
25. **The style editor exposes an allow-listed token set only** — font size,
    line height, font family (inherit/serif/sans/mono), alignment, bold,
    italic, colour (`#rrggbb`), capitalization, indent, space before/after.
    Underline, strikethrough, superscript/subscript, font-size-on-marks and
    other advanced formatting are character/paragraph formatting →
    **M2** (V1-FMT-001/002), delivered 2026-10-11 as *character marks and
    per-block paragraph overrides*, not style tokens — the style editor still
    exposes only the allow-listed token set above.
26. **No template authoring, no style library import/export, no renumbering
    of style definitions.** Styles are document-scoped; creating a reusable
    cross-document template is a planned future capability (out of M1 scope).
27. **Style defaults are theme-driven, not per-style locked.** Built-in style
    definitions mostly hold `null` tokens; the effective look comes from the
    active theme. Redefining a built-in style (e.g. "Note" bold) is a
    document-level override that survives round-trips and wins over the theme
    for that document — themes only supply defaults where the style has no
    explicit token (separation of concerns, AGENTS.md §30; tested).

## Character & paragraph formatting (M2, delivered 2026-10-11)

V1-FMT-001 and V1-FMT-002 are delivered as *structured* character marks and
*additive* per-block paragraph overrides (ADR-004); V1-FMT-003 (text case) is
delivered as a **partial, opinionated subset**. The honest residual limits are:

28. **V1-FMT-003 is a partial subset, not the whole criterion.** Uppercase and
    lowercase text case are modelled (a `textCase` mark with a
    `transform` enum) and render via `text-transform`. The remaining
    V1-FMT-003 formatting features are **not** implemented and are
    intentionally absent from the toolbar: small caps, character/letter
    spacing, paragraph borders, paragraph shading, hanging indent, and tab
    stops. They are not silently dropped — there is no control that pretends
    to offer them (AGENTS.md §64).
29. **Character values are allow-listed enums / validated primitives, never
    raw CSS.** Font family is `serif | sans | mono`, resolved to a theme font
    stack at render time; font size is a bounded number in pt (6–72); text
    colour and highlight are validated hex only
    (`#rgb`/`#rgba`/`#rrggbb`/`#rrggbbaa`). The renderer re-validates every
    value at the boundary (defense in depth): a value that does not survive
    re-validation renders **plain** rather than emitting arbitrary CSS
    (AGENTS.md §61).
30. **Contradictory runs are impossible by construction.** Superscript and
    subscript are mutually exclusive, as are uppercase and lowercase: the
    editor marks declare `excludes`, the adapter normalises foreign input
    keep-first, and the schema **rejects** a run that still carries both. The
    IR never stores a contradictory state.
31. **Paragraph overrides are additive and inherit-first.** Each override
    field (alignment, line spacing, space before/after, left indent) is
    nullable; `null` = "inherit the assigned style". An override touches only
    the aspect the author set — the style/theme definitions are never mutated.
    Precedence is theme → assigned style → paragraph overrides → character
    marks.
32. **Overrides apply to text blocks only** (paragraph, heading, list item,
    and table-cell paragraphs; a cell paragraph renders the override after a
    tight `margin:0` so the override still wins for that aspect). They are
    stored inline on the block, so they are not reusable named styles — that
    remains the M1 style system.

M2 is **additive**: `schema_version` stays `1.0`. M1 and legacy style-less
documents load unchanged (a missing `format` defaults to pure-inherit, a
missing `marks` array defaults to `[]`), and every mark/override round-trips
through save → reload (ADR-004; golden-05 plus the adapter/format unit tests
and the M2 round-trip e2e test).

## Lists & multilevel numbering (M3, delivered 2026-10-11)

V1-LIST-001..004 are delivered as *structured, derived* lists. The IR gains a
recursive canonical `list` block (bullets, five numbering styles, configurable
`start`, nested child items); visible ordinals are **derived** at resolve/render
time and never stored. The honest residual limits are:

33. **A list tree has one type and one bullet marker.** Bullet and numbered
    lists are separate canonical blocks; nesting shares the parent's
    `listType`/`marker` (item 12). The editor exposes a marker picker only for
    bullets and a numbering picker only for numbered lists.
34. **Numbered lists render explicit derived labels; the browser's native list
    marker is suppressed.** Each numbered item's hierarchical label (`3.1.`,
    `4.1.1.`, `IV.`, …) is emitted inline as allow-listed text and the native
    `<ol>` marker is turned off (`list-style: none`), so the visible numbering
    comes from the IR, not from the browser. Bullets keep the native marker,
    selected by an allow-listed `data-marker` value (disc, circle, square,
    dash, arrow, check).
35. **Nested levels restart at 1.** Only the outermost level honours the
    configurable `start`; each nested level begins at 1 (the common
    laboratory-document convention). Per-level custom starts are not modelled.
36. **Forward compatibility (ADR-004).** A document saved by an M3+ build that
    contains a canonical `list` block cannot be opened by an older build that
    predates the kind: the envelope still reports `1.0`, but the older build's
    schema union rejects the unknown block type with an actionable load error.
    This is the documented ADR-004 "additive pre-release" asymmetry — loading
    *older* documents stays guaranteed (backward compatible), while
    forward loading is not.
37. **An ordered list's `start` is bounded to 1–9999.** The configurable start
    of a numbered list is limited to **1–9999**, enforced identically by the IR
    schema (a load outside the range is rejected), the Tiptap adapter and the
    render/numbering boundary (an out-of-range in-memory value is normalised to
    1). The Roman-numeral formatter additionally caps its input at the maximum
    and guards non-finite input, so a malformed value that bypasses validation
    (e.g. `1e100` in a hand-edited `.labdoc.json`) yields a short, deterministic
    label instead of an unbounded subtraction loop. All five numbering styles
    remain correct across the accepted range.

M3 is **additive**: `schema_version` stays `1.0`. Legacy flat `bulletList`
blocks and M1/M2 documents load unchanged; legacy lists are normalised to the
canonical recursive `list` on the next edit/save (open → Save also converges,
even with no text edit). Every list structure round-trips through save → reload
(ADR-004; golden-06 plus the `list`/adapter unit tests and the M3 round-trip
e2e test). The R0.10 hardening added the bounded `start` (item 37) and stable-id
renumbering tests; no list semantics changed.

## Page setup & new-document defaults (M4, delivered 2026-10-11)

V1-PAGE-001..004, V1-SEC-002 (section size/margin UI), V1-PAG-004 (mixed page
sizes), the V1-PDF-002 non-A4 leg and the V1-DOC-002 configurability leg are
delivered. One authoritative geometry table/function
(`src/core/ir/pageGeometry.ts`) is shared by the schema, the layout CSS, the PDF
exporter's size-run grouping and the UI; orientation is applied **exactly once**.
The honest residual limits are:

38. **In-app "Export PDF" is faithful for one sheet geometry only.** The
    browser print dialog has a single paper size per job, so a document whose
    sections mix **page sizes or orientations** is clipped/scaled by the
    in-app button; the app detects the mismatch (any two sections with a
    different **effective** size) and points at `pnpm pdf`. This generalises
    the Phase-0 orientation caveat (items 1–3) from orientation to
    size-or-orientation. The verified mixed-geometry path is `pnpm pdf` / the
    e2e exporter.
39. **A Custom page size ignores orientation by design.** `widthMm`/`heightMm`
    ARE the final effective sheet dimensions, so the Orientation control is
    disabled while Custom is selected (an accessible note explains why): the
    author sets the exact numbers and there is no double-swap possible. The
    standard formats apply orientation once in
    `effectivePageSizeMm` (landscape swaps the intrinsic pair); switching a
    section back to a standard format retains the (inactive) custom pair so it
    can be restored, and switching to Custom seeds the pair from the current
    effective size so the rendered sheet does not jump.
40. **Custom dimensions and margins are bounded.** A custom width/height must
    be 10–2000 mm (`PAGE_SIZE_MM_MIN`/`PAGE_SIZE_MM_MAX`): the schema rejects
    values outside that range on load/save, and the render boundary clamps a
    value that bypassed validation so a malformed `.labdoc.json` can never emit
    `NaN`/zero/negative CSS. Margins must leave a strictly positive usable area
    of at least 1 mm in both directions (`pageAreaProblem`), otherwise the
    setup is rejected. Margins remain whole millimetres.
41. **New-document defaults cover page setup, theme and a metadata skeleton
    only.** The metadata skeleton is limited to the fields that exist in the
    model today — `docNumber`, `revision`, `author`, `organization`,
    `description` (the rest of the metadata schema is M5). The default theme is
    chosen from the themes currently available (the 20-theme library is M7);
    an unknown stored theme id falls back to the default. Preferences are
    **local to the machine** (`localStorage`, key
    `docmaker.new-document-defaults.v1`) — no backend, login or cloud sync
    (V1-PLAT-002/003). A corrupt/absent stored snapshot falls back to the
    built-in defaults without blocking startup; storage read/write failures are
    swallowed.
42. **Defaults are a creation-time snapshot, never applied retroactively.**
    Editing a default does not touch the open document; creating a document
    applies a validated snapshot of the defaults; opening a file keeps that
    file's own settings (preferences never override a document); and a reset
    restores the built-in A4/portrait/no-metadata defaults. The defaults editor
    is a distinct panel (its labels are prefixed "Default …") so it cannot be
    confused with the active section's page-setup or the document metadata.

M4 is **additive**: `schema_version` stays `1.0`. `pageSetup.format` gains the
standard formats (A3/A5/Letter/Legal/Tabloid/Executive) and the `Custom`
sentinel; `widthMm`/`heightMm` are new **nullable** fields defaulting to `null`
(so every pre-M4 document loads unchanged — proven by the regenerated
goldens-01..06, whose HTML is byte-identical). Every page setup round-trips
through save → reload (ADR-004; golden-07 plus `tests/unit/page-setup.test.ts`
and `tests/e2e/page-setup.spec.ts` / `tests/e2e/document-defaults.spec.ts`).

## Metadata, laboratory profile & dynamic fields (M5, delivered 2026-10-12)

V1-META-001/002/003, V1-FIELD-001..004 and V1-HF-003 are delivered. One typed,
allow-listed field registry (`src/core/fields/keys.ts`) is the single source of
field names, read by the editor picker, the body resolver, the header/footer
renderer and the pre-export validator, so a field name cannot drift between
consumers. The honest residual limits are:

43. **The dynamic-field set is a fixed allow-list, not an expression
    language.** The supported keys are document metadata (`document.number`,
    `title`, `revision`, `effective_date`, `review_date`, `status`, `type`,
    `department`, `prepared_by`, `reviewed_by`, `approved_by`, `classification`,
    `author`, `organization`), the laboratory profile (`laboratory.name`,
    `laboratory.address`, `laboratory.logo`) and two page fields
    (`page.number`, `page.total`). An unknown key is **rejected** at the
    schema/load boundary and skipped defensively by the adapter — it is never
    resolved to empty text and never silently erased (AGENTS.md §64). There is
    no arithmetic, formatting or conditional syntax in a field key; that is not
    V1 scope.
44. **The IR stores the field KEY, never a copied value.** A body field is a
    first-class inline node (`{ field: "document.number" }`) rendered at
    resolve time from the canonical metadata/laboratory profile, so a metadata
    edit updates **every** occurrence (V1-META-003) and the preview and PDF stay
    in agreement. The editor shows a distinguishable, non-editable chip that
    carries only the key; the rendered value lives exclusively in the preview
    and export.
45. **An *unused* empty metadata property is not an error; a *used* field with
    an empty/missing source is unresolved (never blank).** A single shared
    walker (`src/core/fields/unresolved.ts`) reports each occurrence with its
    key and location (body block / header / footer), so repeated occurrences are
    all traced. The sidebar "Dynamic fields" panel, the preview (a visible
    unresolved chip) and both export paths all consume this one report — there
    is no scattered string check. HTML-sensitive values are escaped as text; a
    field value can never become markup or script (AGENTS.md §61).
46. **Final PDF export is refused while unresolved fields remain.** The in-app
    "Export PDF" button and the `pnpm pdf` CLI both call the same shared
    collector and, when it is non-empty, refuse with the list of unresolved
    fields (the app writes it to the status line; the CLI prints it to stderr
    and exits non-zero). Saving the `.labdoc.json` **draft is unaffected** —
    only the final PDF is gated. Page fields are exempt: they are resolved
    after pagination, so an empty `page.total`/`page.number` never blocks.
47. **Page fields resolve only after pagination.** `page.number` and
    `page.total` are emitted as placeholder elements and materialised by the
    shared Paged.js script once the document has paginated (total = document
    page count; number = the running counter, honouring section restarts). They
    are therefore **never reported unresolved pre-pagination**, and they update
    after edits/repagination in both preview and PDF.
48. **The laboratory logo field renders in the document body only, not in a
    header/footer margin box.** A body `{{laboratory.logo}}` renders a
    constrained, allow-listed `<img>` (max 45 mm × 20 mm) exactly like any other
    embedded image. Paged.js margin boxes are CSS `content` strings and cannot
    carry an `<img>`, so a **logo field placed in a header/footer cannot be
    rendered** — this is a documented limitation of the HF engine, not a silent
    failure (the textual `[laboratoryName]` token DOES work in HF). The
    laboratory logo is an embedded data-URI subject to the same
    image allow-list as any other image (item 10): an unsupported type, a remote
    URL or an oversized payload is refused before it enters the IR.
49. **The laboratory profile is document-scoped.** `name`, `address` and
    `logo` are serialised inside the `.labdoc.json` (no separate
    laboratory-profile store, no backend/login/cloud — V1-PLAT-002/003). An
    unset logo used as a field is unresolved; an unset logo that is not used is
    not an error. Per-document isolation is tested.
50. **`status` is document data, not a lifecycle workflow.** Setting a status
    value does not create draft/review/approval transitions, signatures or audit
    events; those remain V1.2 scope (approved D6; V1-LIFE-001 unchanged).
51. **Fields are inserted through the picker; user-typed `{{…}}` text is left
    untouched.** There is no implicit conversion of typed braces into a field —
    the semantic field is created only by the labelled picker (an explicit
    editor command) so the IR is never silently rewritten from prose. The
    legacy `[title]`-style header/footer tokens are preserved unchanged;
    `[page]`/`[count]` remain accepted **parse aliases** that normalise to the
    canonical `[pageNumber]`/`[pageCount]` on parse and serialise back
    canonically.

M5 is **additive**: `schema_version` stays `1.0`. The new metadata properties
default to `""` and `laboratoryProfile` defaults to `{ name: "", address: "",
logo: null }`, so every pre-M5 document loads unchanged with safe defaults
(proven by the regenerated goldens-01..07, whose HTML is byte-identical). The
new `golden-08-fields` exercises body fields, laboratory fields and page fields
in both the body and header/footer. Every field reference round-trips through
save → reload (ADR-004; `tests/unit/fields.test.ts`, plus the M5 e2e tests and
the adapter/round-trip unit tests). Field CSS and the page-field materialiser
are emitted only when the document actually contains fields, so legacy goldens
stay byte-identical.
