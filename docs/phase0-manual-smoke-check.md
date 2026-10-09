# Phase 0 — Manual Windows Desktop Smoke Check (Open Gate)

- **Last status:** as of the Phase-0 final acceptance review (2026-10-09) the
  items below had **not** been executed in a desktop session with recorded
  evidence. The native-desktop gate is therefore **unverified** and Phase 0
  holds as **CONDITIONAL PASS**.
- **Why manual:** `tauri-plugin-dialog` + `tauri-plugin-fs` are wired
  (`src-tauri/capabilities/default.json`, `src/app/files.ts` has a browser
  fallback), and the in-app Export PDF calls `window.print()` on the preview
  iframe. Native Win32 Open/Save dialogs and the WebView2 print path cannot be
  click-driven by the automated (Playwright) suite — that is engine-identical
  Chromium, not the desktop shell. See `docs/limitations.md` items 2–4 and
  ADR-003.
- **Do not** treat the passing browser test suite or the `pnpm pdf` CLI (used
  by the e2e parity suite) as evidence for the native dialogs or WebView2
  printing.

## Instructions for the target Windows machine

Run against `main` at the current checkpoint (`git log -1 --oneline`) after a
clean `pnpm install`. Use the **native** Tauri window; do not use the browser
fallback. Record PASS/FAIL for every row and save the evidence listed below.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | `pnpm tauri:dev` starts the native window | App launches with editor + preview panes, no backend | |
| 2 | Create a document with: metadata (title/doc number/revision), a numbered heading, a 2+ column table, an embedded image (PNG or SVG), an equation (LaTeX dialog), a page break, and a section with `pageNumberStart` restart (e.g. 5) | All structures insert; live preview re-paginates; restart digits show 5,6,7… | |
| 3 | **Save via the native Save dialog** to `<name>.labdoc.json` | Native dialog opens; file written; schema envelope `labdoc` / `1.0` | |
| 4 | Close and reopen the application | Clean relaunch | |
| 5 | **Open the saved file via the native Open dialog** | Native dialog opens; document loads without errors | |
| 6 | Verify content, metadata, equations, theme, and stable IDs survived save/reopen; save again and reopen a second time | Round-trip preserves semantics; IDs stable (document id, section/block ids) | |
| 7 | Open `tests/golden/golden-03-phase0-gate.json` and inspect the live preview | Five-page preview shows **P/P/L/L/P** (pages 1–2 portrait, 3–4 landscape, 5 portrait) | |
| 8 | Use the in-app **Export PDF** button on a portrait-only document, then on the mixed-orientation gate document | Portrait-only: faithful PDF. Mixed-orientation: browser print dialog keeps a single paper size; landscape pages clipped/scaled; app warns and points at `pnpm pdf` — matching `docs/limitations.md` items 1–2 | |
| 9 | WebView2 print-to-PDF (where the shell exposes it) | Record actual observed behavior | |

## Evidence to capture

- For every row: PASS / FAIL (+ a short note on anything unexpected).
- At least one saved `.labdoc.json` (created by the **native Save dialog**).
- A screenshot of the five-page gate preview (P/P/L/L/P) and of the exported
  PDF's first landscape page.
- The actual WebView2/print-dialog behavior (item 8/9) — success, clipped
  landscape, or the app warning; record which.
- Any failure: record whether it is a code defect, environment issue, or
  documented limitation (AGENTS.md §48).

## When the gate closes

Phase 0 may be declared fully passed only when every item above is PASS with
recorded evidence. Until then, keep the Phase 0 status as **CONDITIONAL PASS**
and the WebView2 print path unverified.