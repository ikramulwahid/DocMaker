# DocMaker — Laboratory Document Maker

Phase 0 checkpoint of a single-user, local-first desktop application for
authoring laboratory documents (SOPs, test methods, reports) with a
print-faithful A4 live preview and PDF export.

**Stack**: Tauri 2 · React · TypeScript · Vite · Tiptap (editing view) ·
Paged.js (pagination, preview **and** PDF) · pdf-lib (PDF merge) · Zod
(schema-first IR) · Vitest · Playwright.

## Principles (see AGENTS.md / Main_Prompt.md)

- **Document IR is the single source of truth.** Every node has a stable
  semantic id (`hd_…`, `sec_…`, …) never derived from visible numbering;
  numbering is computed at resolve time and never stored.
- **Tiptap is only an editing view**, mapped through an explicit pure adapter
  (`src/editor/adapter.ts`); features the IR cannot represent are disabled in
  the editor instead of being silently dropped.
- **One layout pipeline** (`src/core/layout`) feeds both the live preview and
  the PDF export, which paginate that same HTML in separate execution contexts.
  Parity is verified — page counts, page order, MediaBox sizes and extracted
  text — not assumed identical (ADR-002/003).
- **Untrusted documents are validated at every boundary.** Links, embedded
  image sources and table column widths from `.labdoc.json` input pass a
  documented allow-list (no external URLs, no CSS injection); the renderer
  re-checks them as defense in depth (see `src/core/ir/sanitize.ts`).
- **Local-first**: no backend, no auth, no cloud, no network calls.

## Quick start

```bash
pnpm install
pnpm dev            # browser dev server → http://localhost:5173
pnpm tauri:dev      # desktop shell
```

## Tests

```bash
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest: IR, numbering, resolve, JSON round-trip,
                    #         adapter, margin-text tokens, equations, themes,
                    #         link sanitizing, goldens
pnpm test:e2e       # Playwright: live preview, adapter→preview flow,
                    #             golden SOP + five-page Phase-0 gate doc,
                    #             equation insert/edit, theme switching,
                    #             pageNumberStart/showPageNumber truthfulness,
                    #             PDF parity (page counts + sizes + text),
                    #             save, ~93-page stress (generated local report:
                    #             artifacts/stress-summary.json)
pnpm golden:update  # regenerate golden JSON (only if missing) + expected HTML
```

## PDF export

```bash
pnpm pdf tests/golden/golden-02-sop-long-table.json -o out.pdf
```

Paginates the **same** `renderLayout()` HTML the preview shows, in its own
headless context: Paged.js paginates → pages are grouped into contiguous
paper-size runs → each run is printed by headless Chromium with a trailing
`@page { size }` override (`preferCSSPageSize: true`) → runs are merged with
pdf-lib. Preview/PDF parity means pipeline-identical input and agreeing page
count, order, MediaBox sizes and text — not pixel/byte identity. Mixed
portrait/landscape output is proven by the e2e suite and the committed spike
evidence. The in-app "Export PDF" button uses the browser print dialog, which
is single-paper-size only — see [docs/limitations.md](docs/limitations.md).

## Layout

| Path | Purpose |
| --- | --- |
| `src/core/` | Document IR (zod), ids, factory, numbering, resolve, JSON envelope, layout pipeline — pure, no DOM |
| `src/editor/` | Tiptap extension set + the IR ⇄ Tiptap adapter |
| `src/components/`, `src/App.tsx`, `src/store.ts` | App shell: sidebar (metadata/watermark/sections), editor pane, live preview |
| `scripts/` | Golden updater, PDF export CLI + shared lib, rendering spike + debug scripts |
| `tests/unit`, `tests/golden`, `tests/e2e` | Vitest, golden documents, Playwright |
| `docs/` | Acceptance criteria, ADRs (tech stack, rendering engine, Phase-0 gate closure, schema versioning), limitations |
| `artifacts/spike/` | Committed rendering-engine evidence (HTML, PDFs, screenshots, JSON) |

## Status

Phase 0 checkpoint: builds and runs (browser + Tauri shell), IR independence,
JSON round-trip, editor adapter, metadata, derived heading numbering,
A4 portrait/landscape/mixed sections, headers/footers with Page X of Y,
multi-page tables with repeated headers, images, watermarks, live preview,
PDF export with preview parity, structured equations (offline KaTeX), a
minimal two-theme system, truthful page-number start/hide controls, a frozen
five-page mixed-orientation gate golden, a ~93-page stress document, native
Tauri open/save wiring, passing unit + e2e suites, and documented decisions +
limitations (ADR-001/002/003/004). V1 features (full theme library, forms,
calculations, lifecycle, import, AI) are **not** implemented yet.
