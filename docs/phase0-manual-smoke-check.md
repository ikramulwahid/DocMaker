# Phase 0 — Manual Windows Desktop Smoke Check — Result: PASS

- **Status (2026-10-09, Phase 0.5/0.6):** the full desktop walkthrough was
  executed in the native Tauri window with recorded evidence. **All nine rows
  below are PASS** and the native-desktop gate is **closed (PASS)**. Evidence
  paths are recorded per row; screenshot captures remain optional supplemental
  evidence (not captured).
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
| 1 | `pnpm tauri:dev` starts the native window | App launches with editor + preview panes, no backend | **PASS** — native window launched; editor + preview panes present; no backend |
| 2 | Create a document with: metadata (title/doc number/revision), a numbered heading, a 2+ column table, an embedded image (PNG or SVG), an equation (LaTeX dialog), a page break, and a section with `pageNumberStart` restart (e.g. 5) | All structures insert; live preview re-paginates; restart digits show 5,6,7… | **PASS** — all structures inserted; live preview re-paginated; restart digits 5,6,7 observed |
| 3 | **Save via the native Save dialog** to `<name>.labdoc.json` | Native dialog opens; file written; schema envelope `labdoc` / `1.0` | **PASS** — native Save works. In-scope: `C:\Users\Ikram\Documents\Moisture_in_Coal.labdoc.json` (envelope `labdoc`/`1.0`, doc id `doc_jg1ma5c2`). Out-of-scope Save As `C:\Temp\docmaker-probe\probe-traversal.labdoc.json` rejected with "Save blocked — … outside the allowed folder scope". Typed `..` path (`C:\Users\Ikram\..\..\Temp\…`) was canonicalized **by the Windows dialog** into the in-scope folder (`C:\Users\Ikram\Documents\probe-traversal.labdoc.json`, 19,024 B); the app-side dot-component rule remains unit-tested (`tests/unit/path-scope.test.ts`) |
| 4 | Close and reopen the application | Clean relaunch | **PASS** — closed and relaunched (`pnpm tauri:dev`) cleanly; no errors; saved file correctly not auto-loaded |
| 5 | **Open the saved file via the native Open dialog** | Native dialog opens; document loads without errors | **PASS** — native Open loads in-scope files; out-of-scope Open rejected with the block message; golden gate opened from in-scope copy (SHA256-identical to repo) |
| 6 | Verify content, metadata, equations, theme, and stable IDs survived save/reopen; save again and reopen a second time | Round-trip preserves semantics; IDs stable (document id, section/block ids) | **PASS** — content intact (title "Determination of Moisture in Coal", doc no. `SMJ/SOP/LAB/01`, rev `01`, eff. date `2024-07-01`; theme `lab_default`; DRAFT watermark); equations present; document id `doc_jg1ma5c2` and the full id set (pg/hd/bl/eq/im/sec histogram) identical between the 15:54 and 16:01 native saves; second native save (overwrite, 16:01) + reopen OK |
| 7 | Open `tests/golden/golden-03-phase0-gate.json` and inspect the live preview | Five-page preview shows **P/P/L/L/P** (pages 1–2 portrait, 3–4 landscape, 5 portrait) | **PASS** — five-page P/P/L/L/P preview confirmed (opened from in-scope copy `C:\Users\Ikram\Documents\golden-03-phase0-gate.json`, SHA256-identical to repo: `584A6DD1…8544`); direct repo-path Open is blocked by the scope guard (designed behavior, since the repo is outside `$HOME`) |
| 8 | Use the in-app **Export PDF** button on a portrait-only document, then on the mixed-orientation gate document | Portrait-only: faithful PDF. Mixed-orientation: browser print dialog keeps a single paper size; landscape pages clipped/scaled; app warns and points at `pnpm pdf` — matching `docs/limitations.md` items 1–2 | **PASS** — portrait-only: `C:\Users\Ikram\Downloads\Moisture_in_Coal.labdoc.pdf` (3 pages, all 595×842 pt, faithful). Mixed: `C:\Users\Ikram\Downloads\golden-03-phase0-gate.pdf` (5 pages, all 595×842 pt → single paper size; landscape clipped/scaled) and the in-app warning "Mixed orientation: use `pnpm pdf <file>` for the verified PDF path; printing keeps portrait paper" appeared — documented limitation, not a defect |
| 9 | WebView2 print-to-PDF (where the shell exposes it) | Record actual observed behavior | **PASS** — exercised via the in-app Export PDF button in the native shell (the shell's print path); both PDFs above are genuine `%PDF-1.7` files produced by the WebView2 print dialog; behaviors matched rows 8 expectations |

## Evidence captured (2026-10-09, native session)

- Per-row results recorded above (all **PASS**).
- Native-dialog-created `.labdoc.json` files:
  - `C:\Users\Ikram\Documents\Moisture_in_Coal.labdoc.json` (native Save; later re-saved/overwritten by the new build, 7,056,980 B)
  - `C:\Users\Ikram\Documents\probe-traversal.labdoc.json` (native Save during the traversal probe; 19,024 B)
  - `C:\Users\Ikram\Documents\golden-03-phase0-gate.json` (in-scope copy of the repo golden, SHA256-identical:
    `584A6DD1F058A41218414CF199DC8C88EB92EBF0F70B427843FAE2DB51878544`)
- WebView2 print-to-PDF outputs (both genuine `%PDF-1.7`):
  - `C:\Users\Ikram\Downloads\Moisture_in_Coal.labdoc.pdf` (portrait-only export; 3 pages, 595×842 pt)
  - `C:\Users\Ikram\Downloads\golden-03-phase0-gate.pdf` (mixed-orientation export; 5 pages, all 595×842 pt — single paper size, landscape clipped/scaled)
- Scope-guard observations: out-of-scope Save/Open rejected with the block message; typed `..` path canonicalized by the Windows dialog (in-scope save); repo-path Open blocked by design.
- **Not captured:** screenshots of the gate preview and of the exported landscape page. The recorded rows and artifacts above are the evidence basis; screenshots remain optional supplemental evidence.
- Any failure recorded: none — all observed behavior matched the documented expectations (limitations items 1–2 for mixed-orientation printing).

## Gate status

Closed on 2026-10-09: **every item above is PASS** with recorded evidence
(rows above + the artifacts listed under "Evidence captured"). The WebView2
print path is no longer unverified — it was exercised in the native shell and
produced the two PDFs listed above; mixed-orientation printing keeps the
documented single-paper-size limitation (see `docs/limitations.md` items 1–2),
which is a documented limitation, not a defect. Screenshots were the only
recommended-but-not-captured evidence and do not block the gate.