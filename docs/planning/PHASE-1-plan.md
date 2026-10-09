# Phase 1 — Planning Proposal R0.2 (Acceptance-Coverage Audit)

- **Status:** Proposal — **not** authorized implementation scope. This document
  is review input for the next milestone decision. No Phase 1 code is
  authorized by it (AGENTS.md §82 `When to ask the human`).
- **Revision:** R0.2 (2026-10-09) — supersedes R0.1 (same date).
- **Base:** Phase 0 **closed (PASS)** at
  `0593ba053c9911e7021f31d91a40058c4f62c107` — native-desktop gate PASS
  (`docs/phase0-manual-smoke-check.md`), path-scope guard re-validated,
  WebView2 print exercised (ADR-003).
- **Companion docs:** `Main_Prompt.md` §46–§50 (V1 Foundation / V1.1–V1.4);
  `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` (authoritative release gate,
  118 V1 criteria audited in §2 below); `AGENTS.md` (workforce rules);
  ADR-001..004.
- **Method:** every criterion in the coverage matrix was classified only after
  inspecting the current IR schema (`src/core/ir/schema.ts`), the editor
  extension set and adapter (`src/editor/extensions.ts`, `adapter.ts`), the
  sidebar/editor UI (`src/components/Sidebar.tsx`, `EditorPanel.tsx`), the
  resolve/numbering engines (`src/core/resolve`, `src/core/numbering`), the
  layout pipeline (`src/core/layout`), the theme registry (`src/core/theme`),
  the file workflow (`src/app/files.ts`), and the unit/e2e/golden test suite.

---

## 0. Change log — R0.1 → R0.2 (2026-10-09)

Substantive changes in this revision:

1. **Full acceptance-coverage matrix added** (§2): all 118 V1 criteria are
   classified PASS — existing / PARTIAL — existing / PLANNED — Phase 1 /
   DEFERRED — later phase / OPEN DECISION, each with evidence or a justified
   gap statement. R0.1 did not enumerate criteria.
2. **Page-size gap made explicit**: `pageSetup.format` is `z.enum(["A4"])` only
   (schema.ts:231); V1-PAGE-001 (A3/A5/Letter/Legal/Tabloid/Executive/Custom)
   and the page-size leg of V1-PAG-004 are assigned to a new milestone **M4
   (Page setup & paper sizes)**.
3. **Metadata / dynamic fields / header-footer made explicit**
   (§3.2): V1-META-001 field gaps, the laboratory profile, body-level field
   blocks, header/footer token expansion, and unresolved-field detection are
   assigned to **M5 (Metadata, laboratory profile, dynamic fields)**.
   Deferred lifecycle/approval is kept out of the metadata field scope but
   does **not** excuse the required metadata fields.
4. **Lists rebuilt**: V1-LIST-001 (bullet marker styles), 002/003 (numbered
   lists + automatic renumbering) and 004 (multilevel, SHOULD) are assigned to
   **M3 (Lists)**; the flat-list IR compatibility proposal is formalised in
   §4 (new `list` block kind; legacy `bulletList` kept loadable; old/new JSON
   examples and ADR-004 classification).
5. **Tables split per-criterion**: V1-TABLE-002 (row/column editing UI), 003
   (merged cells), 004 (cell alignment), 005 (borders/shading/padding/widths/
   row height), 008 (row-split policy) and the caption-editing half of
   009 are assigned to **M8 (Table depth)**; V1-TABLE-006/007 already PASS.
6. **Images made explicit**: V1-IMG-002 (resize UI), 003 (alignment) and 004
   (caption editing) assigned to **M9 (Image depth)**; IMG-001/005 already
   PASS.
7. **Milestones re-numbered and re-sequenced by real dependencies** (§5):
   R0.1's M1–M8 map to R0.2's M1–M11 as follows — R0.1 M1 Styles → R0.2 M1
   (unchanged); **new M2** (character/paragraph formatting, from
   V1-FMT-001/002); R0.1 M2 Lists → R0.2 **M3**; **new M4** (page setup +
   sizes); R0.1 M4 Fields → R0.2 **M5**; R0.1 M3 Numbering/refs → R0.2 **M6**;
   R0.1 M5 Themes → R0.2 **M7**; R0.1 M8 Table/image → split into **M8**
   (tables) + **M9** (images); R0.1 M6 Autosave → R0.2 **M10**;
   **new M11** (accessibility pass, V1-A11Y-001). R0.1 M7 Markdown import is
   now an **OPEN DECISION** milestone placed in the remaining-V1 roadmap
   (§5.4) because `Main_Prompt.md` §50 places import in V1.4+ while the
   criteria list Markdown as SHOULD-for-V1.
8. **Phase 1 scope vs remaining-V1 roadmap split documented** (§5.3/§5.4):
   every remaining MUST criterion is assigned either to a Phase-1 milestone or
   to an explicit later-V1 decision.

---

## 1. Objective

Phase 1 deepens the **structured document engine** established in Phase 0,
targeting the V1 MUST/SHOULD acceptance criteria that remain open after
Phase 0, in the core development order of `Main_Prompt.md` §46 / `AGENTS.md`
§78: **Document Model → Business Logic → Rendering → Editor UI**, not
UI-first.

Phase 1 is **not** the whole V1: forms, calculations/units, lifecycle,
controlled-document components, and non-Markdown import remain later phases
(and are mostly DEFERRED by the acceptance criteria). The remaining-V1
roadmap (§5.4) names the work that must still happen inside the V1 boundary
after Phase 1 before the final acceptance demonstration (§49).

---

## 2. Complete V1 acceptance-coverage matrix (R0.2 audit)

Status legend — **PASS**: implemented and evidenced in Phase 0.
**PARTIAL**: works in part; the remainder is named. **PLANNED — P1-M#**:
assigned to a Phase-1 milestone. **DEFERRED**: later phase, justified.
**OPEN**: human decision required (details §6).

### §5 Platform (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PLAT-001 — Application launches | **PASS** | Tauri app installs/launches, creates blank doc; desktop gate rows 1–2 (`docs/phase0-manual-smoke-check.md`) |
| V1-PLAT-002 — Offline core operation | **PASS** | No backend; local first; gate rows 3–9 evidence |
| V1-PLAT-003 — No login | **PASS** | No auth surface exists |

### §6 Document IR (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-IR-001 — Canonical document representation | **PASS** | `documentSchema` envelope `labdoc/1.0`; renderer consumes only resolved IR (`src/core/layout`, `src/core/resolve`) |
| V1-IR-002 — Stable document identity | **PASS** | `doc_…` id survives JSON round-trip (`tests/unit/roundtrip.test.ts`, V1-JSON-005) |
| V1-IR-003 — Stable semantic object IDs | **PASS** | `sec/hd/pg/bl/tb/tr/tc/im/eq/hr/pb` prefixes, never numbering-derived (`src/core/ir/ids.ts`) |
| V1-IR-004 — Semantic blocks | **PASS** | paragraph/heading/bulletList/table/image/pageBreak/equation/hr/section in `blockSchema` |

### §7 Document creation (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DOC-001 — New document | **PASS** | `newDocument()` + New button (`src/App.tsx`) |
| V1-DOC-002 — New document defaults | **PARTIAL** | A4/portrait/margins/theme/metadata defaults exist (`factory.ts`); **"base style" default requires M1**; configurable defaults deferred to settings milestone |
| V1-DOC-003 — Document editing | **PASS** | Tiptap typing/edit/undo/redo/copy/paste mapped through adapter without model corruption (`tests/unit/adapter.test.ts`) |

### §8 Text and structure (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TXT-001 — Text blocks | **PARTIAL** | Only paragraph/heading; Title/Subtitle/Body Text/Caption/Quote/Note/Warning/Important Notice/Definition are **style-based types → M1** (V1-STYLE-001 lists the same names) |
| V1-TXT-002 — Heading hierarchy | **PASS** | Semantic heading blocks, levels 1–6, never font-size-derived |
| V1-TXT-003 — Heading structure | **PASS** | Numbering engine + layout identify headings/levels independently of formatting |

### §9 Text formatting
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FMT-001 — Character formatting (MUST) | **PARTIAL** | bold/italic/code/link only. Missing: font family/size, underline, strikethrough, superscript, subscript, text color, highlight → **M2** (IR mark model expansion) |
| V1-FMT-002 — Paragraph formatting (MUST) | **PARTIAL** | No IR alignment/spacing/indentation → **M2** |
| V1-FMT-003 — Advanced formatting (SHOULD) | **PARTIAL** | Not present; strikethrough/blockquote/code-block disabled by design (`docs/limitations.md` item 16). M2 delivers the feasible subset (superscript/subscript/underline/color/highlight); the rest stays a documented limitation |

### §10 Style system (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-STYLE-001 — Reusable styles | **PLANNED — M1** | No `styles` model in IR; toolbar has paragraph/heading only |
| V1-STYLE-002 — Style assignment | **PLANNED — M1** | Blocks cannot reference a style today |
| V1-STYLE-003 — Style modification | **PLANNED — M1** | No style definitions to change; re-render-on-style-change is new |
| V1-STYLE-004 — Style persistence | **PLANNED — M1** | Must survive save/reopen (round-trip + golden tests) |

### §11 Lists
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-LIST-001 — Bullets (MUST) | **PARTIAL** | Single default disc marker only; no circle/empty-circle/square/dash/arrow/check → **M3** |
| V1-LIST-002 — Numbered lists (MUST) | **PLANNED — M3** | `orderedList: false` in `extensions.ts` (disabled by design); IR has flat `bulletList` only |
| V1-LIST-003 — Automatic list numbering (MUST) | **PLANNED — M3** | No ordered lists, so no renumbering path; derive-at-resolve model proposed (§4) |
| V1-LIST-004 — Multilevel (SHOULD) | **PLANNED — M3** | Nested lists flattened today (`docs/limitations.md` item 12); §4 proposes the IR model. If multilevel depth is incomplete after M3 it must stay honestly tracked |

### §12 Page setup
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PAGE-001 — Page sizes (MUST) | **PLANNED — M4** | `pageSetup.format` is `z.enum(["A4"])` (schema.ts:231). A3/A5/Letter/Legal/Tabloid/Executive/Custom + custom size are missing |
| V1-PAGE-002 — Orientation (MUST) | **PASS** | portrait/landscape per section, mixed-orientation gate PASS (`golden-03`, `pnpm pdf`) |
| V1-PAGE-003 — Margins (MUST) | **PARTIAL** | IR + renderer respect margins; **no sidebar controls** → **M4** (margin inputs) |
| V1-PAGE-004 — Document-level page settings (MUST) | **PARTIAL** | Defaults exist in factory; **no document-level settings UI** → **M4** |

### §13 Sections (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-SEC-001 — First-class sections | **PASS** | `sectionSchema` in IR; per-section editing in UI |
| V1-SEC-002 — Section-level layout | **PARTIAL** | size/orientation/margins/header/footer in IR; size + margin **UI** → **M4** |
| V1-SEC-003 — Mixed orientation | **PASS** | Gate document P/P/L/L/P; `pnpm pdf` verified path; in-app print single-size caveat documented (limitations items 1–3) |

### §14 Page flow
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FLOW-001 — Page break (MUST) | **PASS** | `pageBreak` block + toolbar button; stress e2e includes manual break |
| V1-FLOW-002 — Section break (MUST) | **PASS** | Add/remove section in sidebar; per-section page flow |
| V1-FLOW-003 — Keep with next (SHOULD) | **DEFERRED — later phase** | No layout-engine support; propose with layout/flow hardening milestone (V1.1 advanced engine lists widow/orphan control) |
| V1-FLOW-004 — Keep together (SHOULD) | **DEFERRED — later phase** | Same as above; explicit deferral, not a silent drop |

### §15 Tables (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TABLE-001 — Insert table | **PASS** | Toolbar inserts 3×3 (`EditorPanel.tsx`) |
| V1-TABLE-002 — Table editing | **PARTIAL** | Tiptap row/column commands exist but **no UI** (no row/col add/delete controls) → **M8** |
| V1-TABLE-003 — Merge cells | **PLANNED — M8** | IR has no colspan/rowspan; adapter forces 1×1 (`adapter.ts` cellToTiptap); merged cells dropped (limitations item 13) |
| V1-TABLE-004 — Cell alignment | **PLANNED — M8** | No horizontal/vertical alignment in IR/renderer/editor |
| V1-TABLE-005 — Table formatting | **PLANNED — M8** | borders only default; no border thickness, cell background, padding, row height (column widths exist: `columnWidths` grammar, item 11/14) |
| V1-TABLE-006 — Header row | **PASS** | `headerRow` IR flag + `<thead>` render |
| V1-TABLE-007 — Multi-page table | **PASS** | 43-row table + repeated `<thead>` (`repeatTheads` in html.ts, ADR-002; stress + goldens) |
| V1-TABLE-008 — Row split behavior | **PLANNED — M8** | No configured row-split policy in IR/layout; new `rowSplit`/keep-together-per-table policy |
| V1-TABLE-009 — Caption and identity | **PARTIAL** | Stable `tb_` id + derived "Table N" + caption render PASS; **caption editing UI missing** → **M8** |

### §16 Images (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-IMG-001 — Insert image | **PASS** | Local file → data-URI, sanitized allow-list (input-security tests) |
| V1-IMG-002 — Resize | **PARTIAL** | `widthMm` in IR + honoured by renderer; **no editor control** → **M9** |
| V1-IMG-003 — Alignment | **PLANNED — M9** | No image alignment in IR/renderer/editor |
| V1-IMG-004 — Caption | **PARTIAL** | Caption IR-preserved + rendered (`figcaption`); **not editable in UI** → **M9** |
| V1-IMG-005 — Figure identity | **PASS** | `im_` stable id + derived "Figure N" (numbering engine) |

### §17 Headers and footers (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-HF-001 — Header | **PASS** | Sidebar header string + `[field]` tokens; structured margin box IR |
| V1-HF-002 — Footer | **PASS** | Default "Page X of Y" footer + per-section footer editing |
| V1-HF-003 — Dynamic metadata in HF | **PARTIAL** | Tokens `[title] [docNumber] [revision] [effectiveDate] [page] [count]` work (e2e `getComputedStyle` assertions); **reviewDate/status/laboratory name tokens missing** → **M5** |
| V1-HF-004 — Page numbering | **PASS** | `Page X` / `Page X of Y`; auto-update (CSS counters + materializer, ADR-003); global `N` documented approximation (limitations item 6) |

### §18 Metadata (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-META-001 — Structured metadata | **PLANNED — M5** | IR has title/docNumber/revision/effectiveDate/author/organization/description; **missing** document type, department, review date, status, prepared by, reviewed by, approved by, confidentiality/classification (criteria list) → expand `metadataSchema` |
| V1-META-002 — Metadata panel | **PARTIAL** | Panel exists (Sidebar) but only current 7 fields → **M5** adds the missing fields to the UI |
| V1-META-003 — Metadata as source of truth | **PARTIAL** | Editing metadata updates linked margin tokens for existing fields (IR is the source); new fields + body fields follow in **M5** |

### §19 Dynamic fields (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FIELD-001 — Document fields | **PLANNED — M5** | Only margin-box tokens exist; no body-level `{{document.*}}` fields |
| V1-FIELD-002 — Laboratory fields | **PLANNED — M5** | No laboratory profile in IR; `{{laboratory.name/address/logo}}` unsupported |
| V1-FIELD-003 — Page fields | **PARTIAL** | `[page]`/`[count]` in margin boxes only; body-level `{{page.number}}`/`{{page.total}}` → **M5** |
| V1-FIELD-004 — Unresolved field detection | **PLANNED — M5** | No unresolved-field reporting before export |

### §20 Automatic numbering (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-NUM-001 — Heading numbering | **PASS** | Derived hierarchical numbering (`src/core/numbering`) |
| V1-NUM-002 — Table numbering | **PASS** | Derived "Table N" (never stored) |
| V1-NUM-003 — Figure numbering | **PASS** | Derived "Figure N" |
| V1-NUM-004 — Dynamic renumbering | **PASS** | Derived at every resolve → reorder/insert/delete renumbers automatically |
| V1-NUM-005 — Numbering persistence | **PASS** | Numbers never stored; survive save/load by construction (round-trip tests) |

### §21 Basic references
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-REF-001 — Stable reference target (MUST) | **PASS** | Stable IDs for headings/tables/figures (V1-IR-003) |
| V1-REF-002 — Basic cross-reference (SHOULD) | **PLANNED — M6** | No reference fields → new reference field node |
| V1-REF-003 — Reference updates (SHOULD) | **PLANNED — M6** | Derived numbering ⇒ references update automatically once they resolve through the numbering engine |

### §22 Equations
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-EQ-001 — Structured insertion (SHOULD) | **PARTIAL** | LaTeX block insert/edit via dialog works (semantic, not image); **equation numbering/cross-refs absent → M6 (SHOULD element)** |
| V1-EQ-002 — Scientific notation (MUST) | **PASS** | Symbol coverage tested (H₂O, CO₂, m², ±, Δ, √, Σ …) |
| V1-EQ-003 — Semantic storage (MUST) | **PASS** | Stored as LaTeX source, rendered by bundled KaTeX — never an image |

### §23 Themes (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-THEME-001 — Theme count | **PLANNED — M7** | 2 of 20 themes (`src/core/theme`) |
| V1-THEME-002 — B&W themes | **PLANNED — M7** | 1 of ≥5 B&W (`bw_standard`) |
| V1-THEME-003 — Live switching | **PASS** | Sidebar `theme-select`; preview re-render |
| V1-THEME-004 — Semantic preservation | **PASS** | Unit tests prove IR bytes unchanged; theme regression spec exists |

### §24 Live preview (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PREV-001 — Side-by-side | **PASS** | Editor \| Preview panes |
| V1-PREV-002 — Page-oriented preview | **PASS** | Paged.js paginated sheets in iframe |
| V1-PREV-003 — Pagination visibility | **PASS** | Boundaries, count, headers/footers, page numbers, sections visible (e2e) |
| V1-PREV-004 — Responsiveness | **PASS** | Debounced re-render; no manual reload |

### §25 Pagination (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PAG-001 — A4 pagination | **PASS** | Goldens + stress (93 pages) |
| V1-PAG-002 — Header/footer interaction | **PASS** | No overlap (layout margin boxes; e2e) |
| V1-PAG-003 — Page count | **PASS** | `counter(pages)` + materializer |
| V1-PAG-004 — Mixed sections | **PARTIAL** | Orientation mixing PASS; **mixed page SIZES impossible until M4** (A4-only) |
| V1-PAG-005 — Table pagination | **PASS** | Multi-page tables with repeated headers |
| V1-PAG-006 — Deterministic pagination | **PASS** | Same IR+styles+theme → equivalent output (goldens, derived numbering) |

### §26 PDF output (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PDF-001 — PDF generation | **PASS** | `pnpm pdf` + in-app print; MediaBox-verified |
| V1-PDF-002 — PDF visual correctness | **PASS** | Text/layout/headers/footers/page numbers/theme/dimensions verified for supported (A4) content; non-A4 sizes follow M4 |
| V1-PDF-003 — PDF pagination parity | **PASS** | Same pipeline as preview; parity verified by page count/order/MediaBox/text (ADR-002/003) |

### §27 JSON save/load (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-JSON-001 — Save to `.json` | **PASS** | `saveJson()` (native + browser fallback) |
| V1-JSON-002 — Load | **PASS** | `openJson()` + `tryDeserializeDocument` |
| V1-JSON-003 — Versioned schema | **PASS** | `labdoc` / `1.0` envelope (V1-JSON-003 example format) |
| V1-JSON-004 — Round-trip | **PASS** | `roundtrip.test.ts`; serialize/deserialize deep-equal |
| V1-JSON-005 — Identity preservation | **PASS** | doc + node ids survive (part of round-trip) |
| V1-JSON-006 — Invalid JSON handling | **PASS** | `DocFormatError` with per-field issues; no crash (V1-ERR-003) |

### §28 Autosave
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-AUTO-001 — Draft recovery (SHOULD) | **PLANNED — M10** | No autosave/IndexedDB today |

### §29–§30 Import
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| Markdown (SHOULD) | **OPEN** | Not implemented. `Main_Prompt.md` §50 places import in V1.4+; criteria say SHOULD-for-V1 → decision in §6 (milestone `IMP-MD` in remaining-V1 roadmap) |
| DOCX (DEFERRED/V1.1) | **DEFERRED — V1.1** | Clean import boundary (adapter architecture) retained |
| PDF (DEFERRED/V1.1) | **DEFERRED — V1.1** | Extraction/reconstruction only, fidelity surfaced |
| DOC (DEFERRED) | **DEFERRED** | Must not delay V1 foundation |
| §30 Import-acceptance principle | **DEFERRED (with import)** | Applies when any import lands; imported content must enter the editable IR |

### §31–§34 Deferred subsystems
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-CD-001 — Controlled-document block (DEFERRED V1.2) | **DEFERRED — V1.2** | IR keeps extension point; a plain formatted table is not an implementation |
| V1-FORM-001 — Forms (DEFERRED) | **DEFERRED** | Extension point reserved (semantic blocks, not forced to paragraphs) |
| V1-CALC-001 — Calculations/units (DEFERRED) | **DEFERRED** | IR must not preclude quantity/unit/formula later — no blocking structure introduced |
| V1-LIFE-001 — Lifecycle/approval (DEFERRED V1.2) | **DEFERRED — V1.2** | `metadata.status/revision` fields landed in M5 are a **field**, not lifecycle enforcement; transitions/immutable history stay V1.2 |

### §35 Rendering architecture (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-REN-001 — Shared semantic pipeline | **PASS** | One `renderLayout()` for preview + export |
| V1-REN-002 — No hard-coded samples | **PASS** | Renderer operates on arbitrary IR (goldens + stress) |
| V1-REN-003 — No page-number hardcoding | **PASS** | Counters + derived materializer |

### §36 Performance
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PERF-001 (MUST) | **PARTIAL** | 93-page stress baseline recorded (`artifacts/stress-summary.json`); **formal thresholds** to be pinned in release hardening (§5.4) |

### §37 Data integrity (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DATA-001 | **PASS** | Adapter/persistence tests; no silent delete/corrupt paths |
| V1-DATA-002 | **PASS** | Theme semantic-invariant tests |
| V1-DATA-003 | **PASS** | Round-trip tests |

### §38 Error handling (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-ERR-001 — Visible, understandable errors | **PASS** | Status-line messages (`Save failed — …`, `Open failed — …`); `DocFormatError` |
| V1-ERR-002 — No silent loss on import | **DEFERRED (with import)** | Vacuous until an import exists; becomes active acceptance for `IMP-MD` |
| V1-ERR-003 — Malformed JSON no crash | **PASS** | `tryDeserializeDocument` + e2e/unit |

### §39 Security (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-SEC-001 — No content execution | **PASS** | Renderer treats content as data; `sanitize.ts` allow-lists; links sanitized |
| V1-SEC-002 — No eval in formulas | **PASS** | No calculation engine; pattern prohibition documented for future (AGENTS.md §21) |
| V1-SEC-003 — Untrusted imports | **PASS** | Schema/load-boundary validation (envelope + sanitize); import pipeline inherits it |

### §40 Test acceptance (all MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TEST-001 — IR tests | **PASS** | `tests/unit/ir.test.ts`, `adapter.test.ts` |
| V1-TEST-002 — JSON tests | **PASS** | `roundtrip.test.ts`, `envelope` paths |
| V1-TEST-003 — Numbering tests | **PASS** | `numbering.test.ts` |
| V1-TEST-004 — Rendering tests | **PASS** | `layout.test.ts`, `golden.test.ts` |
| V1-TEST-005 — Golden corpus | **PASS** | 3 goldens cover basic-sop/table-heavy/multi-page/mixed-orientation/header-footer/theme/image/metadata collectively (+ stress) |
| V1-TEST-006 — E2E | **PASS** | `tests/e2e/*` cover create→edit→save→reopen→preview→PDF |

### §41–§43 Visual regression, theme regression, accessibility
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-VIS-001 — Visual regression (MUST) | **PARTIAL** | Pixel-variance checks (footers), PDF text-layer for gate; **full corpus visual regression is a release-hardening item** (§5.4) |
| V1-VIS-002 — Theme regression | **PARTIAL** | Mechanism + tests exist for 2 themes; complete with M7 (20 themes) |
| V1-A11Y-001 (SHOULD) | **PLANNED — M11** | Main UI keyboard/labels/focus pass; note upstream margin-box AT limitation (limitations item 5) |

### §44–§46 Documentation, technology, Phase-0 gate
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DOC-001 — Documentation (MUST) | **PASS** | AGENTS.md, ADRs 001–004, limitations, planning, README |
| §45 Technology baseline | **PASS** | Tauri/React/TS/Vite/Tiptap/Zustand/pnpm; renderer validated by Phase-0 PoC (ADR-002) |
| §46 Phase-0 rendering gate | **PASS** | Closed at `0593ba0` predecessor (`d343b50`); matrix preserves Phase 0 as PASS |

### §48–§49 Release gates
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| §48 Release-blocking defects | **PASS** | No known critical defects (data loss/JSON corrupt/incorrect numbering/PDF corruption/orientation/table/preview-export mismatch/crash) |
| §49 Final acceptance demonstration | **PLANNED — after Phase 1** | Realistic SOP demonstration depends on M1–M11 (styles, lists, sizes, fields, themes, tables, images) |

> **Audit note:** criterion IDs are taken verbatim from
> `docs/requirements/V1_ACCEPTANCE_CRITERIA.md`; `V1-A11Y-001` is included
> (it contains a digit in its family token and is missed by naive regexes).

---

## 3. Known-omission resolutions

### 3.1 Page sizes and orientation
`pageSetup.format = z.enum(["A4"])` is the only paper size Phase 0 supports;
the renderer geometry is A4-hard-coded (`pageSizeMm` in `css.ts`). This is the
single largest V1-MUST omission after Phase 0 and it silently satisfies only
the A4 rows of V1-PAGE-001 and the orientation leg of V1-PAG-004. **M4** adds a
size table (A3/A5/Letter/Legal/Tabloid/Executive + custom width×height) with:
IR enum/length pair, layout geometry per format, PDF media-size support per
size (the `pnpm pdf` run-grouping already keyed on size), a document/section
page-settings UI, margin inputs, and goldens per size/orientation pair.
Assignment: **V1-PAGE-001/002/003/004, V1-PAG-004, V1-PDF-002 (non-A4)**.

### 3.2 Metadata, dynamic fields, header/footer integration
- **V1-META-001 fields missing:** document type, department, review date,
  status, prepared by, reviewed by, approved by, confidentiality/classi
  fication. Expand `metadataSchema` **additively** (empty-string defaults) and
  add the panel fields (**V1-META-002**), keeping the IR as the only source
  (**V1-META-003**). `status` is a **metadata field**, not lifecycle
  enforcement: draft/review/approved transitions, approval records and
  immutable revision history remain deferred with **V1-LIFE-001** (V1.2); the
  deferral must not and does not drop the field the V1 criteria require.
- **Body-level dynamic fields:** introduce an inline field node in the IR
  (`{{document.number}}`, `{{document.title}}`, `{{document.revision}}`,
  `{{document.effective_date}}`, `{{document.review_date}}`,
  `{{document.status}}`, `{{page.number}}`, `{{page.total}}`) resolved by the
  resolve engine (**V1-FIELD-001/003**), plus a **laboratory profile**
  (`laboratory.name/address/logo`, logo reuses the image allow-list
  sanitizer) for `{{laboratory.*}}` (**V1-FIELD-002**).
- **Header/footer tokens:** extend `marginFieldSchema` with
  `reviewDate/status/documentType/laboratoryName` etc. so V1-HF-003 is
  satisfied through the same structured margin-box model, not a parallel
  mechanism.
- **Unresolved-field detection (V1-FIELD-004):** explicit UI marker and
  export-time validation when a required field is missing/unsupplied.
- All of the above persist through JSON and are covered by round-trip +
  golden + e2e tests; assignment: **M5**.

### 3.3 Lists
`bulletList` currently renders one default disc bullet with flat paragraph
items; there are no bullet **marker styles** (V1-LIST-001), no ordered lists
(V1-LIST-002/003; `orderedList` is disabled in the editor), and no multilevel
support (V1-LIST-004, flattened — limitations item 12). Assignment: **M3**
with the nested-list IR model and compatibility strategy in §4. If multilevel
depth ends up partial after M3, the remainder is recorded, not dropped.

### 3.4 Tables
- **V1-TABLE-002** row/column add/delete has commands but no UI — bring the
  controls into the toolbar/table menu (M8).
- **V1-TABLE-003** merged cells: no colspan/rowspan in IR, renderer or editor
  (items 13) — IR `tableCell.colspan/rowspan` (+ `rowSpanSource` for
  pagination clones), renderer repeated-header + continuation-with-spans,
  editor merge/split — **M8**, goldens for multi-page merged tables.
- **V1-TABLE-004** horizontal/vertical cell alignment — IR cell attrs + CSS +
  toolbar (M8).
- **V1-TABLE-005** borders, border thickness, cell background, padding,
  column widths (existing grammar), row height — IR table/cell attrs,
  pixel-safe grammar like `columnWidths` (M8).
- **V1-TABLE-008** row-split policy — explicit per-table option
  (`rowSplit: "allow" | "prevent"`, default allow) consulted by the layout
  script; keep together with repeated headers and merged cells in M8 to
  minimise pagination risk (AGENTS.md §18).
- **V1-TABLE-009** caption editing — caption input in the table toolbar (M8);
  stable id + generated number already PASS.
Multi-page tables, repeated headers, merged cells and row-split behavior are
kept together **within M8** rather than spread across milestones.

### 3.5 Images
- **V1-IMG-002** resize: `widthMm` editor control (number/units) in toolbar
  (M9).
- **V1-IMG-003** alignment: image alignment attr + renderer + toolbar (M9).
- **V1-IMG-004** caption: caption input (M9); caption already IR-preserved
  and rendered.
- **V1-IMG-005** figure identity: already PASS (stable `im_` id + derived
  "Figure N"); M9 keeps figure numbering integration with the M6 reference
  engine so a table of figures (V1.1) remains possible.
Editor behavior, IR round-trip and rendering are each tested per criterion.

---

## 4. Additive schema evolution for nested lists (proposal)

### 4.1 Why the R0.1 phrasing was ambiguous
R0.1 said "new optional `items` nesting". That is ambiguous because the
existing `bulletListSchema` **already has** an `items` array (of paragraphs);
silently changing the element type of `items` would violate ADR-004
("Do not silently change the meaning or type of existing fields"). This
section replaces that phrasing with a concrete proposal.

### 4.2 Current shape (legacy, unchanged on disk)
```json
{
  "id": "bl_ab12cd34",
  "type": "bulletList",
  "items": [
    { "id": "pg_11", "type": "paragraph", "content": [{ "text": "Step one" }] }
  ]
}
```

### 4.3 Proposed canonical shape (new `list` block kind, nested items)
```json
{
  "id": "bl_ab12cd34",
  "type": "list",
  "listType": "decimal",
  "marker": null,
  "start": 1,
  "items": [
    {
      "id": "li_91x2f7q1a",
      "content": [{ "id": "pg_11", "type": "paragraph", "content": [{ "text": "Purpose" }] }],
      "children": [
        {
          "id": "li_aabbcc01",
          "content": [{ "id": "pg_22", "type": "paragraph", "content": [{ "text": "Laboratory Manager" }] }],
          "children": []
        }
      ]
    }
  ]
}
```
`listType` ∈ `bullet | decimal | lower-alpha | upper-alpha | lower-roman |
upper-roman`; `marker` ∈ `disc | circle | square | dash | arrow | check`
(used only when `listType: "bullet"`) — required by V1-LIST-001/002.
Numbering is **derived** per level at resolve time (never stored).

### 4.4 Compatibility strategy (ADR-004)
- **New node kind, old kind retained:** `list` is added to the `blockSchema`
  union; the legacy `bulletList` schema is **kept byte-compatible** for
  loading existing flat documents. Element type of legacy `items` unchanged.
- **Load:** old documents parse with no change (additive union). The editor
  adapter (and a small normalize step) re-encodes legacy `bulletList` →
  canonical `list` (`listType: "bullet"`, `marker: "disc"`,
  `items: [listItem(childless)]`) on the next edit/save, so the written JSON
  converges on one canonical shape.
- **Round-trip/golden:** new `list` units (adapter both directions, resolve
  ordinals per level), a legacy-`bulletList` → `list` migration unit test, and
  a golden document exercising flat + nested + numbered + roman lists.
- **Schema classification:** additive and backward-compatible (new union
  member; defaults for new fields; old documents load unchanged), so
  `schema_version` stays `1.0` **under ADR-004 policy** — but this is the
  boundary case the ADR anticipates, so it is listed as an explicit review
  point in §6 rather than assumed.
- **Not implemented in this task** — the schema change itself requires
  approval of §4/§6.

---

## 5. Revised milestone plan

### 5.1 Dependency graph (why this order)
```text
M1 Styles ─────────────┐
M2 Character/paragraph format ─┐
M3 Lists (uses M2 marks, numbering principles)
M4 Page setup + sizes (independent layout thread; can overlap M2/M3)
M5 Metadata + lab profile + fields (uses M1 styles for field rendering)
M6 Numbering + references (needs M1 'Reference' style, M5 field engine)
M7 Themes (needs M1 styles + M5 field resolution for invariant tests)
M8 Tables depth (needs M4 geometry, M2 cell formatting; riskiest, kept last
   of the engine thread)
M9 Images depth (needs M2 alignment infra, M8 caption-UI patterns)
M10 Autosave (independent app-shell milestone)
M11 Accessibility pass (broad UI, last)
```
Ordering rule used: **model/business logic before renderer/editor**, shared
engines (fields, numbering) built before the components that consume them,
and the risky table pagination work happens once the geometry and formatting
layers exist. M4 is the one genuinely independent thread and may run in
parallel with M2/M3. M11 (a11y) deliberately follows the UI-heavy milestones
so it audits the final controls and dialog shapes (`window.prompt` dialogs are
an a11y liability and are replaced by real dialogs in M2/M5/M8/M9).

### 5.2 Phase-1 milestones (proposed scope)

#### M1 — Style system  ·  V1-STYLE-001..004 (MUST), V1-TXT-001 (MUST)
- Closes: no reusable styles; text block types exist only as paragraph/heading.
- IR: document-level `styles` map (name → tokens/rule) with style **assignment
  by block reference** (AGENTS.md §58: content/presentation separation);
  style-based text types: Title, Subtitle, Body Text, Caption, Quote, Note,
  Warning, Important Notice, Definition, Reference, Header, Footer, Table Text.
- Schema: additive with defaults under ADR-004 (style-less docs load).
- Dependencies: none. Tests: unit (assign/change/persist), round-trip, golden,
  e2e (style change re-renders; theme switch does not alter style semantics).
- Risk: style/theme interplay — resolved once M7 lands; acceptance: changing a
  style updates every block using it (V1-STYLE-003) and survives save/reopen
  (V1-STYLE-004).
- Out of scope: style *authoring* beyond definitions list; templates.

#### M2 — Character & paragraph formatting  ·  V1-FMT-001/002 (MUST), V1-FMT-003 (SHOULD, feasible subset)
- IR: extend `markSchema` (underline, strikethrough, superscript, subscript,
  text color, highlight, font family/size as needed for the allow-listed set);
  paragraph attrs (alignment left/center/right/justify, line/paragraph
  spacing, indentation). Direct formatting is stored as an **override** on the
  block, never replacing styles (AGENTS.md §58).
- Editor: toolbar controls; real dialogs replace `prompt()` for color etc.
- Dependencies: **M1** (direct formatting overrides styles). Tests: adapter
  both directions, layout CSS, round-trip, e2e; disabled-by-design list
  updated in `docs/limitations.md` (strikethrough becomes supported, etc.).
- Risk: sanitize allow-lists for font-family/color values; acceptance:
  V1-FMT-001/002 demonstrated in a golden; V1-FMT-003 documented subset.

#### M3 — Lists  ·  V1-LIST-001 (MUST), V1-LIST-002 (MUST), V1-LIST-003 (MUST), V1-LIST-004 (SHOULD)
- Closes: default-disc-only bullets; ordered lists disabled; nested lists
  flattened (limitations item 12).
- IR: new `list` block kind per §4; bullet markers; numbered list types with
  `start`; derived per-level ordinals (extend numbering engine); legacy
  `bulletList` normalization.
- Dependencies: **M2** (marks inside items). Tests: §4.4 suite + e2e
  (insert/remove/reorder renumbers — V1-LIST-003).
- Risk: adapter mapping Tiptap list nesting ↔ IR children (round-trip);
  acceptance: all six bullet markers and five numbering styles work; multilevel
  honest if partial (V1-LIST-004 SHOULD tracks any remainder explicitly).

#### M4 — Page setup & paper sizes  ·  V1-PAGE-001/002/003/004 (MUST), V1-PAG-004 (MUST), V1-PDF-002 (MUST, non-A4)
- Closes: A4-only `format` enum; no margin/size UI; no document-level settings.
- IR: `format` enum expansion + optional custom `widthMm/heightMm`; layout
  geometry table; document-level default page settings.
- Renderer: per-size `@page` geometry; `pnpm pdf` run-grouping already
  size-keyed — confirm per-size MediaBoxes (goldens per size×orientation).
- Dependencies: none (parallel thread). Tests: unit geometry, golden
  per size/orientation, e2e PDF media sizes.
- Risk: PDF single-paper-size constraint per print job — verified mixed path
  already handles size runs; acceptance: each listed size paginates and
  exports correctly.

#### M5 — Metadata, laboratory profile, dynamic fields  ·  V1-META-001/002/003 (MUST), V1-FIELD-001..004 (MUST), V1-HF-003 (MUST)
- Closes: §3.2 gaps — missing metadata fields; no lab profile; no body-level
  fields; no unresolved detection; HF tokens limited.
- IR: expanded `metadataSchema` (additive defaults); new `laboratoryProfile`
  (name/address/logo, logo through the existing image allow-list); inline
  field node in `inlineSchema`; `marginFieldSchema` extension; persisted.
- Resolve: field resolution against metadata/lab profile/counters; page fields
  in body; unresolved-field registry fed to V1-FIELD-004 UI marker +
  export-time validation.
- Dependencies: **M1** (field rendering uses styles). Tests: resolution unit
  tests, round-trip, golden with fields in body + HF, e2e metadata→field
  updates (V1-META-003) and unresolved detection.
- Risk: deterministic resolution (AGENTS.md §56); keep lifecycle semantics out
  (V1-LIFE-001 stays deferred); acceptance as per §3.2.

#### M6 — Numbering & cross-references  ·  V1-REF-001 (MUST, retained), V1-REF-002/003 (SHOULD), V1-EQ-001 numbering (SHOULD element)
- IR: reference field node (`ref` with target stable id + kind
  heading/table/figure/equation); equation numbering (derived).
- Resolve: reference labels resolved from `deriveNumbering` (heading number,
  "Table N", "Figure N") — automatic updates by construction (V1-REF-003);
  broken/deleted targets detected (AGENTS.md §46).
- Editor: reference insertion picker (targeted by id, shown by visible
  number); Reference style from M1.
- Dependencies: **M1, M5**. Tests: numbering-unit additions, adapter,
  round-trip (references survive JSON), e2e renumber-updates-reference.
- Risk: reference by stable id only (never stored numbers); acceptance:
  V1-REF-002/003 and equation numbering demonstrated in goldens.

#### M7 — Theme library  ·  V1-THEME-001/002 (MUST); 003/004 retained
- Ship 18 more presentation-only themes (≥20 total), ≥5 deliberately B&W
  beyond `bw_standard`; all pass the semantic-invariant unit suite and the
  theme-regression e2e (V1-VIS-002).
- Dependencies: **M1** (styles render through theme tokens), **M5** (fields
  must be presentation-stable). Tests: existing theme invariants x20.
- Risk: presentation drift between themes; acceptance:
  V1-THEME-001/002 met; V1-THEME-004 invariants green for all 20.

#### M8 — Table depth  ·  V1-TABLE-002 (MUST UI), 003 (MUST), 004 (MUST), 005 (MUST), 008 (MUST), 009 caption-editing (MUST)
- IR: `colspan/rowspan` on `tableCell`; cell alignment (h/v); table/cell
  borders, thickness, background, padding, row height (width grammar
  retained); `rowSplit` policy; caption editing persists to `caption`.
- Renderer: repeated-header + merged-cell continuation across pages
  (AGENTS.md §18); row-split policy enforced by the layout script; goldens for
  multi-page merged tables.
- Editor: row/column add-delete UI, merge/split, alignment, formatting.
- Dependencies: **M4** (geometry), **M2** (cell formatting). Tests: adapter,
  golden + e2e (multi-page merged table, repeated headers), round-trip.
- Risk: merged cells × pagination is the highest table risk — isolated in this
  milestone with the header-repeat/row-split suite; acceptance per criterion.
- Out of scope: table-of-contents/generated lists (V1.1), cross-format table
  styles.

#### M9 — Image depth  ·  V1-IMG-002 (MUST), 003 (MUST), 004 (MUST); 001/005 retained
- IR: image alignment attr; existing `widthMm`/`caption` gain editor controls.
- Editor: resize control, alignment, caption input (mirrors M8 caption UI).
- Dependencies: **M2** (alignment), **M8** (caption UI patterns).
- Tests: adapter both directions, round-trip, e2e (resize changes rendered
  width; alignment CSS; caption round-trips), figure numbering unchanged.

#### M10 — Autosave / draft recovery  ·  V1-AUTO-001 (SHOULD)
- IndexedDB draft of the current IR + recovery prompt on next launch;
  **never overwrites an intentional saved file without user awareness**
  (criterion pass condition). Canonical document remains the versioned JSON
  file (Main_Prompt §5.18).
- Dependencies: none (app shell). Tests: unit (draft write/read/expiry),
  e2e recovery flow.

#### M11 — Accessibility pass  ·  V1-A11Y-001 (SHOULD)
- Keyboard navigation, labels, logical focus, usable controls, accessible
  dialog messages; replace `window.prompt`/`alert` usages with proper dialogs;
  mitigate the margin-box AT limitation where possible and document the rest
  (limitations item 5).
- Dependencies: **M2/M5/M8/M9** (dialogs and controls exist by then).
- Tests: a11y-oriented e2e (keyboard-only editing path, labelled controls).

### 5.3 Phase 1 acceptance (cross-cutting)
Every Phase-1 milestone keeps the project gates green: `pnpm typecheck`,
`pnpm test`, `pnpm test:e2e`, `pnpm build`; ADR-004 additive schema discipline
(migration + round-trip + golden tests per change); `docs/limitations.md`
updated as features move from "disabled/limited" to supported; per-milestone
checkpoint commit + push (AGENTS.md Git workflow).

### 5.4 Remaining-V1 roadmap (after Phase 1, still V1)
| Milestone | Criteria | When |
|---|---|---|
| **IMP-MD** — Markdown import (remark/unified → IR, fidelity report, V1-ERR-002 active) | V1 §29 Markdown (SHOULD) | **OPEN** — approve in Phase 1 or defer (see §6) |
| V1-VIS regression corpus — formal visual regression for representative docs incl. all themes | V1-VIS-001 (MUST), V1-VIS-002 completion | Release hardening |
| Performance thresholds — formalize baselines against V1-PERF-001 definition | V1-PERF-001 (MUST) | Release hardening |
| Final acceptance demonstration + §51 release checklist | §49, §51 | Gate check before V1 release |
| V1.1 advanced engine (Main_Prompt §47): TOC, generated lists, annexures/appendices, footnotes, columns, widow/orphan/keep-with | — (not V1 acceptance criteria) | **V1.1, deferred by Main_Prompt §47** |
| V1.2 controlled engine (CD, lifecycle, approval, revisions) | V1-CD-001, V1-LIFE-001, §34 | **V1.2** |
| V1.3 forms/calc/units | V1-FORM-001, V1-CALC-001 | **V1.3** |
| V1.4+ DOCX/PDF/DOC import, AI | §29 (non-Markdown) | **V1.4+, per Main_Prompt §50** |

### 5.5 Retained non-goals (justified)
Unchanged from R0.1 and justified by `Main_Prompt.md` and the criteria:
DOCX/DOC/PDF import (V1.1+), controlled-document/lifecycle/approval (V1.2),
forms/calculations/units (V1.3), AI (V1.4+), renderer/framework replacement
(ADR-001/002 frozen), no backend/auth/cloud (product non-goals), and JSON
schema 2.0 (additive-only during pre-release under ADR-004).

---

## 6. Open decisions requiring approval

1. **Phase-1 scope endorsement** — approve milestones M1–M11 (§5.2) as Phase 1
   (or amend the list) before any implementation.
2. **Milestone order** — confirm the M1→…→M11 order and the parallel thread
   M4 ∥ (M2/M3); confirm M11 (a11y) belongs inside Phase 1 vs release
   hardening.
3. **Markdown import (IMP-MD)** — criteria mark Markdown SHOULD-for-V1, but
   `Main_Prompt.md` §50 places import in V1.4+. Decide: add IMP-MD to Phase 1
   (late slot, after M8), keep it in remaining-V1, or formally defer to V1.1.
   If approved, the `remark`/`unified` dependency is a separate approval
   (version-verify before adding — AGENTS.md §35/§72).
4. **Nested-list schema (§4)** — approve the new `list` block kind + legacy
   `bulletList` retention + normalization, and confirm the ADR-004
   classification that `schema_version` stays `1.0` (additive union member)
   for this change.
5. **Table row-split semantics (M8 / V1-TABLE-008)** — confirm the default
   (`rowSplit: "allow"` with per-table "prevent") and the UI surface (per-table
   toggle) since the criteria require configured policy, not a fixed rule.
6. **Metadata `status` field vs lifecycle** — confirm the field is valid as
   an organizational label now, with lifecycle enforcement deferred to V1.2
   (prevents the V1-META-001 requirement being gated on §34).
7. **A11y margin-box limitation** — accept documenting the paged.js
   upstream AT limitation (limitations item 5) as a known constraint for
   V1-A11Y-001 rather than a hard gate.

> This document is a proposal. Implementing any part of it requires explicit
> approval of the scope and order above (AGENTS.md §82).