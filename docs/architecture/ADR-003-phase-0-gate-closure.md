# ADR-003: Phase-0 Gate Closure — Page-Restart Rendering & Gate Evidence

- **Status:** Accepted (Phase 0, 2026-10-09)
- **Context:** `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` §46 (Phase-0
  Rendering Acceptance) requires, among other items: a structured equation POC, a minimal
  theme system (≥ 2 themes), a five-page mixed-orientation gate document
  (portrait/portrait/landscape/landscape/portrait) with heading/table
  numbering, multi-page table headers, header/footer, page numbers, image,
  equation, watermark, theme and dynamic fields; truthful
  `pageNumberStart` / `showPageNumber` behavior; a preview/PDF parity
  statement; a Tauri desktop file workflow; security-hardened links; stress +
  golden tests; and honest documentation. This ADR records the decisions that
  made each of those items verifiable rather than cosmetic.

## Problem 1: `pageNumberStart` must actually change rendered page numbering

Paged.js 0.4.3 represents per-section page resets as a DOM attribute
`[data-counter-page-reset="N"]` on the section's first page element and inserts
a CSS rule `counter-reset: page N` **during layout**. Empirically:

1. On a **fresh document load**, Chromium honours the reset at the margin
   box's first paint (a document with page number 5 renders "5"), and the
   print/PDF path works.
2. On the app's **live preview**, the iframe document is replaced in place
   (srcdoc swap); in that path the reset rule arrives after the margin
   `::after` has already painted, and the painted digits do **not** change.
   Computed styles show `counterReset: page 5` applied; the painted text stays
   "1".
3. Pushing a CSS override with the raw digit did not help: `content: "Page "
   5 " of " 1 !important` is **invalid CSS** (bare `<number>` tokens are not
   allowed in `content`), so the browser drops the declaration quietly, and
   even valid `content` re-assignments on a painted `::after` do **not**
   reliably repaint in Chromium.

**Decision:** the shared `renderLayout()` layout script ships
`materializePageNumbers()` (see `src/core/layout/html.ts`, in the Paged.js
`after` hook). When and only when a `[data-counter-page-reset]` element exists,
it walks every sheet, tracks the current restart value (skipping continuation
clones via `:not([data-split-from])`), resolves the serialized margin content
(e.g. `"Page " counter(page) " of " counter(pages)`) against the per-page
value and the global page count, and **replaces the counter-based
`::after` content with a real DOM text node** (`div[data-pp]`) inside the
margin box.

- Real DOM text always repaints and prints verbatim — no dependence on
  Chromium's pseudo-element repaint behaviour.
- The same HTML is used by the preview iframe and the PDF exporter, so both
  contexts show correct restart digits. In-app restart digits are verified
  automatically: e2e text assertions on the materialized `div[data-pp]`
  (`tests/e2e/page-setup.spec.ts`), painted-footer pixel diffs, and the
  multi-page restart sequences `1,2 | 5,6,7,8` (`tests/e2e/stress.spec.ts`).
  PDF text extraction of those specific restart digits was additionally probed
  manually with pdf.js during development; automated PDF text-layer
  verification is exercised for the gate golden (see Problem 3).
- No restarts (`pageNumberStart = 1` everywhere) → the function is a no-op and
  documents keep pure CSS counters (goldens unaffected).
- **Documented approximation:** `Page X of N` renders `N` as the
  document-wide page count, not a per-section count (Word restarts `N` per
  section). Recorded in `docs/limitations.md`.

## Problem 2: `showPageNumber` must control only the page counter

`buildCss()` / `marginContent()` (`src/core/layout/css.ts`) omit the
`@bottom-right` page-counter rule when `showPageNumber` is false, leaving
header/other margin content untouched. Paged.js always creates every margin
box even when empty, so the e2e test asserts content emptiness
(`getComputedStyle(…, '::after').content === "none"`), not box absence, and
proves header/pagination are unchanged and the counter rule returns when
re-enabled.

## Problem 3: Preview/PDF parity must be stated truthfully

The gate asks for parity between preview and PDF. Preview and export consume
the **same** `renderLayout()` HTML (markup, CSS, Paged.js version and
configuration) in **separate execution contexts**. The automated suites compare
page counts and per-page MediaBox sizes (`tests/e2e/pdf-parity.spec.ts`), and
assert **reproducible PDF text-layer evidence** for the gate golden:
`tests/e2e/phase0-gate.spec.ts` extracts the exported PDF's text with pdf.js
(`scripts/verify-pdf-text.mjs`, also runnable as a CLI) and requires the
document's distinctive content to be present — dynamic header/page fields
(`SOP-GATE-001`, title, `Page N of M`), generated caption numbering
(`Table 1`), the `DRAFT` watermark, and equation glyphs (`±`, `Δ`,
whitespace-collapsed `E=mc2`). Parity here means pipeline-identical input and
agreeing pagination geometry plus reproducible text — it explicitly does
**not** claim pixel-identity between the two contexts (see ADR-002). This
wording is mirrored in the acceptance evidence.

## Other gate-closure decisions

- **Equations (V1-EQ POC):** the IR stores an `equation` block as LaTeX
  **source** (`type: "equation"`, prefix `eq`, stable id) — never an image.
  Rendering uses KaTeX bundled offline (generated CSS module
  `src/core/layout/katex-css.generated.ts`; fonts under `public/katex/fonts`),
  no CDN. Editor insert/edit round-trips IR → Tiptap → IR. Symbol coverage is
  tested (e.g. `\mathrm{H_2O}` renders H₂O). Equation numbering /
  cross-references are post-Phase-0.
- **Themes (minimal POC):** two presentation-only themes stored in
  `settings.theme` — id `lab_default` ("Lab Default") and id `bw_standard`
  ("B&W Standard") — changing fonts/sizes/colours only (styles/CSS vars).
  Sidebar selection re-renders the preview; unit tests prove semantic IR bytes
  are unchanged while the rendered CSS changes. The full 20-theme library is
  deferred.
- **Links are untrusted data:** link targets are sanitized (the `javascript:`
  scheme is blocked before it reaches `href`; see
  `src/core/ir/sanitize.ts`) and the renderer treats all document content as
  data — no document-supplied code is executed (AGENTS.md §61).
- **Five-page gate document:** `tests/golden/golden-03-phase0-gate.json` is a
  frozen five-sheet portrait/portrait/landscape/landscape/portrait document
  containing every §46 feature; it is the golden for the layout pipeline and
  the subject of `tests/e2e/phase0-gate.spec.ts` (sheet order, features, PDF
  agreement including the text-layer assertions above).
- **Stress + golden tests:** `tests/e2e/stress.spec.ts` generates a ~93-page
  document (long paragraphs, 43-row multi-page table, varied images,
  equations, manual break, mixed orientations, page restart) and records
  facts in `artifacts/stress-summary.json` — a generated local report (not
  committed; timings are machine-specific observations, see
  `docs/limitations.md`); `tests/golden/` pins canonical
  documents (mixed-orientation, SOP long-table, gate) as HTML regression goldens.
- **Tauri file workflow:** `tauri-plugin-dialog` + `tauri-plugin-fs` with an
  fs scope of `$HOME/**`, `$APPDATA/**`, `$APPCONFIG/**`
  (`src-tauri/capabilities/default.json`). Interactive dialogs require manual
  desktop validation (documented in `docs/limitations.md`); WebView2
  print-to-PDF remains unvalidated. The Phase-0 final acceptance review
  (2026-10-09) re-confirmed this: desktop-session evidence had not yet been
  supplied, so the Phase-0 gate stays **conditional** pending the native-dialog
  and WebView2 checks (`docs/phase0-manual-smoke-check.md`). The first manual
  desktop test then exposed a real defect fixed before the gate can close:
  `fs:default` (tauri-plugin-fs 2.6.0) does not enable the `read_text_file` /
  `write_text_file` commands, so the native save was ACL-denied at runtime
  even though the dialog opened. The capability now explicitly grants
  `fs:allow-read-text-file` and `fs:allow-write-text-file` under the same
  `$HOME`/`$APPDATA`/`$APPCONFIG` scope; native save/open need
  re-validation after this fix. The fix was then verified in a desktop session
  (Save succeeded), but the re-test exposed a second, security-relevant
  discrepancy: the capability `fs:scope` is **not enforced** by
  tauri-plugin-fs 2.6.0 at runtime — the native save wrote
  `src-tauri\save\untitled.labdoc.json` (outside `$HOME/**`) and a probe Save
  As to `C:\Temp\docmaker-probe\…` also succeeded. Decision (ADR, 2026-10-09):
  enforce the documented boundary at the application layer
  (`src/app/path-scope.ts` + `src/app/files.ts`, regression-tested in
  `tests/unit/path-scope.test.ts`) instead of relying on the plugin ACL; the
  capability keeps the declared scope as defense-in-depth. Out-of-scope
  desktop Save/Open is rejected with an explicit error; re-verification of
  that guard in a desktop session is required before the Phase-0 gate closes.
  Phase-0.5 (2026-10-09): the guard was hardened against path traversal —
  paths containing `.`/`..` path components are rejected outright (lexical
  prefix matching cannot resolve `..`; e.g. `C:\Users\Ikram\..\..\Temp\probe.json`
  resolves outside the root), with regression coverage extended in
  `tests/unit/path-scope.test.ts`. The guard remains an application-level
  check on `saveJson()`/`openJson()`-routed paths, not an OS boundary.
  Phase-0.6 (2026-10-09): the native-desktop gate was executed end-to-end —
  all nine `docs/phase0-manual-smoke-check.md` rows PASS with recorded
  evidence (native save/open artifacts + WebView2 PDFs on disk). The scope
  guard was re-validated: out-of-scope Save/Open rejected with the block
  message; a typed `..` path was canonicalized by the Windows dialog itself
  into the in-scope folder. The WebView2 print path was exercised: portrait
  Export PDF faithful; mixed-orientation export keeps the documented
  single-paper-size limitation (5 pages, all portrait sheets; landscape
  clipped/scaled) with the in-app warning pointing at `pnpm pdf`. **Phase 0
  gate: closed (PASS).**

## Consequences

- Restart page digits are deterministic across refresh, theme change and PDF
  export because they are derived in the shared script and stored as text.
- The materializer is a small, testable script with explicit no-op behaviour
  for the common case; it is covered by unit tests, e2e tests, and (for
  non-restart documents) unchanged goldens.
- Two honest caveats are carried in `docs/limitations.md`: the global total in
  `Page X of N`, and the un-click-driven native dialogs / unvalidated WebView2
  print path.
- Future sections/counters (per-chapter `of N`, fields beyond
  counter(page)/counter(pages)) must extend `materializePageNumbers()` or move
  to a stronger counter strategy; the IR contract is unchanged.