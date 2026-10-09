# Phase 1 — Planning Proposal R0.3 (Criteria Integrity and Decision Readiness)

- **Status:** Proposal — **not** authorized implementation scope. This document
  is review input for the next milestone decision. No Phase 1 code is
  authorized by it (AGENTS.md §82 `When to ask the human`).
- **Revision:** R0.3 (2026-10-09) — supersedes R0.2 (same date).
- **Base:** Phase 0 **closed (PASS)** at
  `0593ba053c9911e7021f31d91a40058c4f62c107` (gate evidence ADR-003); planning
  revisions R0.1/R0.2 at `c46cffaae4e7e1139c1985a723c32a81b38315b3`.
- **Authoritative criteria updated in this revision (permitted by scope):**
  `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` — identifier collisions
  corrected (see §2). All criterion content preserved; headings/identifiers
  only.
- **Companion docs:** `Main_Prompt.md` §§46–51 (V1 Foundation / V1.1–V1.4 /
  Phase-0 PoC); `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` (release gate);
  `AGENTS.md`; ADR-001..004; `docs/limitations.md`;
  `docs/phase0-manual-smoke-check.md`.
- **Method:** every criterion and acceptance status was re-verified against the
  current IR schema (`src/core/ir/schema.ts`), factory (`src/core/ir/factory.ts`),
  editor extension set + adapter (`src/editor/extensions.ts`, `adapter.ts`),
  sidebar/editor UI, resolve/numbering engines, layout pipeline, theme
  registry, file workflow, and the unit/e2e/golden suites (including
  `tests/e2e/stress.spec.ts`, `tests/e2e/pdf-parity.spec.ts`,
  `tests/golden/generator.ts`, `artifacts/stress-summary.json`).

---

## 0. Change log — R0.2 → R0.3 (2026-10-09)

Substantive changes in this revision:

1. **Criterion identifier integrity fixed** (§2): four collisions in the
   authoritative criteria removed — `V1-DOC-001` (document creation vs
   documentation acceptance) and `V1-SEC-001..003` (sections vs security) —
   and all 11 unnumbered acceptance requirements now carry identifiers
   (`V1-IMP-001..005`, `V1-TECH-001`, `V1-GATE-001..004`, `V1-DEMO-001`).
   Recount documented explicitly (§2.2): **122 criterion blocks / 118 unique
   IDs / 4 collisions / 11 unnumbered → 133 / 133 / 0 / 0**, one-to-one.
2. **Status contradictions corrected** (§3–§4): `V1-PDF-002` reclassified
   PASS → **PARTIAL** (non-A4 page dimensions unimplemented until M4; A4
   evidence preserved); `V1-DOC-002`'s orphaned configurable-defaults work
   assigned to **M4** (renamed milestone); the full matrix swept for
   PASS-vs-planned-work contradictions (results in §4.3).
3. **Phase-boundary reconciliation** (§5): four V1.1 capabilities pulled into
   Phase 1 are now **explicit scope promotions requiring approval** — multilevel
   lists/numbering (M3), cross-references (M6), equation numbering (M6),
   advanced table pagination (M8). Boundarially intact items are confirmed and
   the Markdown decision is retained.
4. **Testable release gates defined** (§6): `V1-PERF-001` (fixture extension:
   10+ tables / 10+ images / headers + recorded headings; committed thresholds
   and gate condition), `V1-VIS-001/002` (corpus, committed screenshot
   baselines, tolerance policy, gate condition), `V1-A11Y-001` (no automatic
   waiver; M11 demonstrable per-requirement checks).
5. **Nested-list schema proposal preserved** (§7) with the ADR-004
   backward-vs-forward loading distinction made explicit; still unimplemented.
6. **Open-decision list extended to ten items** (§9), now including the four
   scope promotions and the two release-gate definitions (PERF thresholds,
   VIS corpus policy).

---

## 1. Objective

Phase 1 deepens the **structured document engine** established in Phase 0,
targeting the V1 MUST/SHOULD criteria that remain open, in the core
development order of `Main_Prompt.md` §46 / `AGENTS.md` §78: **Document Model →
Business Logic → Rendering → Editor UI**, not UI-first.

R0.3 adds a decision-readiness layer: every criterion has a unique,
one-to-one matrix entry; every status is consistent with its named gaps; every
phase-boundary tension is either resolved or flagged for approval; and the
performance/visual-regression/accessibility requirements are defined as
**testable release gates** rather than intentions.

---

## 2. Criterion identifier integrity (R0.3 audit)

### 2.1 Collisions found and resolution

| Collision | Location | Resolution |
|---|---|---|
| `V1-DOC-001` used twice | §7 creation ("New document") and §44 documentation acceptance | **Created:** `V1-DOC-001` (created); **Documentation:** `V1-DOCU-001 — Documentation acceptance` (renamed) |
| `V1-SEC-001..003` used twice | §13 sections and §39 security | **Sections retained:** `V1-SEC-001..003`; **Security renamed:** `V1-SECU-001..003` |
| `## Markdown`, `## DOCX`, `## PDF`, `## DOC` (no IDs) | §29 import | `V1-IMP-001 — Markdown` (SHOULD-for-V1), `V1-IMP-002 — DOCX`, `V1-IMP-003 — PDF`, `V1-IMP-004 — DOC` |
| §30 import acceptance principle (no ID) | §30 | `V1-IMP-005 — Import acceptance principle` |
| §45 technology baseline (no ID) | §45 | `V1-TECH-001 — Technology baseline` |
| §46 phase-0 gate (no ID) | §46 | `V1-GATE-001 — Phase-0 rendering acceptance gate` (closed, PASS) |
| §48 release-blocking defects (no ID) | §48 | `V1-GATE-002 — Release-blocking defects` |
| §49 acceptance demonstration (no ID) | §49 | `V1-DEMO-001 — Final acceptance demonstration` |
| §50 final acceptance statement (no ID) | §50 | `V1-GATE-003 — Final acceptance statement` |
| §51 release checklist (no ID) | §51 | `V1-GATE-004 — V1 release checklist` |

§47 non-goals are exclusions, not acceptance requirements — intentionally **not**
given identifiers.

### 2.2 Recount (before → after)

| Measure | Before (R0.2) | After (R0.3) |
|---|---|---|
| Criterion blocks carrying a `V1-*` identifier (`## V1-*` headings) | 122 | 133 |
| Unique identifiers | 118 | 133 |
| Identifier collisions | 4 (`V1-DOC-001`, `V1-SEC-001..003`) | 0 |
| Unnumbered acceptance requirements | 11 (§29 ×4, §30, §45, §46, §48, §49, §50, §51) | 0 (all identified) |
| Matrix rows | 118 ID-keyed + section-keyed remainder | **133 rows = 133 unique identifiers (one-to-one)** |
| Non-goal bullets (§47) | 16 | 16 (unchanged, excluded from IDs) |

No criterion was merged, removed, or weakened. The four reused IDs were
retained for their primary (earlier) family and the colliding criteria moved
to distinct families; section numbers are unchanged, so existing §-number
references in ADRs, `docs/limitations.md` and the smoke-check remain valid.

### 2.3 Reference sweep

- Updated: `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` (this revision) and
  `docs/planning/PHASE-1-plan.md` (R0.3).
- Verified clean (no colliding-ID references): `Main_Prompt.md`, README,
  ADR-001..004, `docs/limitations.md`, `docs/phase0-manual-smoke-check.md`,
  all `src/`, `scripts/` and test specs.
- **Residual code comment:** `tests/unit/input-security.test.ts:2` comments
  reference the pre-rename `V1-SEC-003` (security family). The test file is
  **not** modified by this documentation-only revision; a comment-only update
  is recorded as a follow-up for the first Phase-1 checkpoint that touches the
  file (§10).

---

## 3. One-to-one coverage matrix (133 / 133)

Status legend — **PASS**: implemented + evidenced in Phase 0. **PARTIAL**:
works in part, remainder named. **PLANNED — P1-M#**: Phase-1 milestone.
**DEFERRED**: later phase, justified. **OPEN**: human decision (§9).
Rows marked **◂R0.3** changed in this revision (see §4.1 for the full
rationale).

### §5 Platform (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PLAT-001 — Application launches | **PASS** | Tauri install/launch + blank doc; gate rows 1–2 (`docs/phase0-manual-smoke-check.md`) |
| V1-PLAT-002 — Offline core operation | **PASS** | No backend, local-first; gate rows 3–9 |
| V1-PLAT-003 — No login | **PASS** | No auth surface |

### §6 Document IR (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-IR-001 — Canonical representation | **PASS** | `documentSchema` envelope `labdoc/1.0`; renderer consumes only resolved IR |
| V1-IR-002 — Stable document identity | **PASS** | `doc_…` id survives JSON round-trip (`roundtrip.test.ts`) |
| V1-IR-003 — Stable semantic object IDs | **PASS** | `sec/hd/pg/bl/tb/tr/tc/im/eq/hr/pb` prefixes, never numbering-derived |
| V1-IR-004 — Semantic blocks | **PASS** | paragraph/heading/bulletList/table/image/pageBreak/equation/hr/section in `blockSchema` |

### §7 Document creation (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DOC-001 — New document | **PASS** | `newDocument()` + New button |
| V1-DOC-002 — New document defaults | **PARTIAL** ◂R0.3 | A4/portrait/margins/theme/metadata defaults exist (`factory.ts`). Remaining: **base style → M1**; **defaults configurable where appropriate → M4** (§4.2). Not PASS until both land |
| V1-DOC-003 — Document editing | **PASS** | Tiptap typing/edit/undo/redo/copy/paste via adapter (`adapter.test.ts`) |

### §8 Text and structure (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TXT-001 — Text blocks | **PARTIAL** | paragraph/heading only; Title/Subtitle/Body Text/Caption/Quote/Note/Warning/Important Notice/Definition are style-based types → **M1** (V1-STYLE-001 lists the same names) |
| V1-TXT-002 — Heading hierarchy | **PASS** | Semantic heading blocks levels 1–6, never font-derived |
| V1-TXT-003 — Heading structure | **PASS** | Numbering + layout identify headings/levels independently of formatting |

### §9 Text formatting
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FMT-001 — Character formatting (MUST) | **PARTIAL** | bold/italic/code/link only; font family/size, underline, strikethrough, superscript, subscript, color, highlight → **M2** |
| V1-FMT-002 — Paragraph formatting (MUST) | **PARTIAL** | no IR alignment/spacing/indentation → **M2** |
| V1-FMT-003 — Advanced formatting (SHOULD) | **PARTIAL** | absent; strikethrough/blockquote/code disabled by design (limitations item 16). M2 delivers feasible subset; remainder stays documented |

### §10 Style system (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-STYLE-001 — Reusable styles | **PLANNED — M1** | no `styles` model in IR |
| V1-STYLE-002 — Style assignment | **PLANNED — M1** | blocks cannot reference a style |
| V1-STYLE-003 — Style modification | **PLANNED — M1** | no definitions; re-render-on-change is new |
| V1-STYLE-004 — Style persistence | **PLANNED — M1** | round-trip + golden tests required |

### §11 Lists
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-LIST-001 — Bullets (MUST) | **PARTIAL** | single default disc marker; circle/empty-circle/square/dash/arrow/check → **M3** |
| V1-LIST-002 — Numbered lists (MUST) | **PLANNED — M3** | `orderedList: false` in extensions; flat `bulletList` only |
| V1-LIST-003 — Basic automatic list numbering (MUST) | **PLANNED — M3** | derive-at-resolve per-level ordinals (§7) |
| V1-LIST-004 — Multilevel lists (SHOULD) | **PLANNED — M3** ◂R0.3 | nested lists flattened (item 12); **promotes V1.1 multilevel numbering** — approval item D8 |

### §12 Page setup
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PAGE-001 — Page sizes (MUST) | **PLANNED — M4** | `pageSetup.format` is `z.enum(["A4"])`; A3/A5/Letter/Legal/Tabloid/Executive/Custom missing |
| V1-PAGE-002 — Orientation (MUST) | **PASS** | portrait/landscape per section; mixed gate PASS (`pnpm pdf`) |
| V1-PAGE-003 — Margins (MUST) | **PARTIAL** | IR + renderer respect margins; no sidebar controls → **M4** |
| V1-PAGE-004 — Document-level page settings (MUST) | **PARTIAL** | factory defaults only; no UI → **M4** |

### §13 Sections (MUST) — IDs retained
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-SEC-001 — First-class sections | **PASS** | `sectionSchema`; per-section editing |
| V1-SEC-002 — Section-level layout | **PARTIAL** | size/orientation/margins/header/footer in IR; size + margin UI → **M4** |
| V1-SEC-003 — Mixed orientation | **PASS** | gate P/P/L/L/P; `pnpm pdf` verified; in-app single-size caveat documented (items 1–3) |

### §14 Page flow
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FLOW-001 — Page break (MUST) | **PASS** | `pageBreak` block + toolbar; stress includes manual break |
| V1-FLOW-002 — Section break (MUST) | **PASS** | add/remove sections in sidebar |
| V1-FLOW-003 — Keep with next (SHOULD) | **DEFERRED — later phase** | no layout-support; proposed with V1.1 widow/orphan controls; explicit deferral, not a silent drop |
| V1-FLOW-004 — Keep together (SHOULD) | **DEFERRED — later phase** | same boundary as V1-FLOW-003 |

### §15 Tables (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TABLE-001 — Insert table | **PASS** | toolbar inserts 3×3 |
| V1-TABLE-002 — Table editing | **PARTIAL** | Tiptap row/column commands exist, no UI → **M8** |
| V1-TABLE-003 — Merge cells | **PLANNED — M8** | no colspan/rowspan in IR; adapter forces 1×1 (item 13) |
| V1-TABLE-004 — Cell alignment | **PLANNED — M8** | no h/v alignment anywhere |
| V1-TABLE-005 — Table formatting | **PLANNED — M8** | borders only default; thickness/background/padding/row height missing (column widths exist) |
| V1-TABLE-006 — Header row | **PASS** | `headerRow` flag + `<thead>` |
| V1-TABLE-007 — Multi-page table | **PASS** | 43-row split + repeated `<thead>` (ADRs 002/003, stress) |
| V1-TABLE-008 — Row split behavior | **PLANNED — M8** ◂R0.3 | new `rowSplit` policy; **advanced-table-pagination promotion** — approval item D8 |
| V1-TABLE-009 — Caption and identity | **PARTIAL** | stable `tb_` id + derived "Table N" + caption render PASS; caption editing → **M8** |

### §16 Images (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-IMG-001 — Insert image | **PASS** | local file → data-URI, sanitized allow-list |
| V1-IMG-002 — Resize | **PARTIAL** | `widthMm` in IR + honoured by renderer; no editor control → **M9** |
| V1-IMG-003 — Alignment | **PLANNED — M9** | no image alignment in IR/renderer/editor |
| V1-IMG-004 — Caption | **PARTIAL** | IR-preserved + rendered; not editable → **M9** |
| V1-IMG-005 — Figure identity | **PASS** | stable `im_` id + derived "Figure N" |

### §17 Headers and footers (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-HF-001 — Header | **PASS** | sidebar header string + `[field]` tokens; structured margin box IR |
| V1-HF-002 — Footer | **PASS** | default "Page X of Y" + per-section editing |
| V1-HF-003 — Dynamic metadata in HF | **PARTIAL** | `[title] [docNumber] [revision] [effectiveDate] [page] [count]` verified (e2e `getComputedStyle`); reviewDate/status/laboratory tokens → **M5** |
| V1-HF-004 — Page numbering | **PASS** | Page X / Page X of Y; auto-update; global-N approximation documented (item 6) |

### §18 Metadata (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-META-001 — Structured metadata | **PLANNED — M5** | has title/docNumber/revision/effectiveDate/author/organization/description; missing document type, department, review date, status, prepared/reviewed/approved by, classification → expand `metadataSchema` |
| V1-META-002 — Metadata panel | **PARTIAL** | panel exists (7 fields) → **M5** adds the rest |
| V1-META-003 — Metadata as source of truth | **PARTIAL** | linked token updates work for existing fields; new fields + body fields → **M5** |

### §19 Dynamic fields (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FIELD-001 — Document fields | **PLANNED — M5** | margin tokens only; no body `{{document.*}}` |
| V1-FIELD-002 — Laboratory fields | **PLANNED — M5** | no laboratory profile in IR |
| V1-FIELD-003 — Page fields | **PARTIAL** | `[page]`/`[count]` in margin boxes only; body-level → **M5** |
| V1-FIELD-004 — Unresolved field detection | **PLANNED — M5** | no pre-export unresolved reporting |

### §20 Automatic numbering (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-NUM-001 — Heading numbering | **PASS** | derived hierarchical numbering |
| V1-NUM-002 — Table numbering | **PASS** | derived "Table N", never stored |
| V1-NUM-003 — Figure numbering | **PASS** | derived "Figure N" |
| V1-NUM-004 — Dynamic renumbering | **PASS** | derived at every resolve |
| V1-NUM-005 — Numbering persistence | **PASS** | never stored; survive save/load by construction |

### §21 Basic references
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-REF-001 — Stable reference target (MUST) | **PASS** | stable IDs (V1-IR-003) |
| V1-REF-002 — Basic cross-reference (SHOULD) | **PLANNED — M6** ◂R0.3 | **promotes V1.1 cross-references** — approval item D8 |
| V1-REF-003 — Reference updates (SHOULD) | **PLANNED — M6** ◂R0.3 | derived numbering ⇒ auto-update once resolver exists |

### §22 Equations
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-EQ-001 — Structured insertion (SHOULD) | **PARTIAL** | LaTeX insert/edit via dialog; numbering/cross-ref absent → **M6 (SHOULD element)** ◂R0.3 — equation numbering **promotes V1.1** — approval item D8 |
| V1-EQ-002 — Scientific notation (MUST) | **PASS** | H₂O, CO₂, m², ±, Δ, √, Σ … tested |
| V1-EQ-003 — Semantic storage (MUST) | **PASS** | LaTeX source, bundled KaTeX — never an image |

### §23 Themes (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-THEME-001 — Theme count | **PLANNED — M7** | 2 of 20 |
| V1-THEME-002 — B&W themes | **PLANNED — M7** | 1 of ≥5 (`bw_standard`) |
| V1-THEME-003 — Live switching | **PASS** | sidebar `theme-select`; live re-render |
| V1-THEME-004 — Semantic preservation | **PASS** | unit invariants + theme-regression spec |

### §24 Live preview (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PREV-001 — Side-by-side | **PASS** | Editor \| Preview |
| V1-PREV-002 — Page-oriented preview | **PASS** | Paged.js sheets |
| V1-PREV-003 — Pagination visibility | **PASS** | boundaries/count/headers/footers/page numbers/sections (e2e) |
| V1-PREV-004 — Responsiveness | **PASS** | debounced re-render |

### §25 Pagination (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PAG-001 — A4 pagination | **PASS** | goldens + stress (93 pages) |
| V1-PAG-002 — Header/footer interaction | **PASS** | no overlap (layout margin boxes; e2e) |
| V1-PAG-003 — Page count | **PASS** | `counter(pages)` + materializer |
| V1-PAG-004 — Mixed sections | **PARTIAL** | orientation PASS; **mixed page sizes impossible until M4** (A4-only) |
| V1-PAG-005 — Table pagination | **PASS** | multi-page tables, repeated headers |
| V1-PAG-006 — Deterministic pagination | **PASS** | same IR+styles+theme → equivalent output |

### §26 PDF output (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PDF-001 — PDF generation | **PASS** | `pnpm pdf` + in-app print; MediaBox-verified |
| V1-PDF-002 — PDF visual correctness | **PARTIAL** ◂R0.3 | A4 path PASS (text/headings/tables/images/sections/HF/page numbers/theme; MediaBox 595×842 asserted). **`page dimensions` for non-A4 are unimplemented until M4** — evidence for A4 retained (pdf-parity + gate + user 3-page PDF) |
| V1-PDF-003 — PDF pagination parity | **PASS** | same pipeline as preview; parity by page count/order/MediaBox/text (ADRs 002/003) |

### §27 JSON save/load (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-JSON-001 — Save document | **PASS** | `saveJson()` (native + browser) |
| V1-JSON-002 — Load document | **PASS** | `openJson()` + `tryDeserializeDocument` |
| V1-JSON-003 — Versioned schema | **PASS** | `labdoc` / `1.0` envelope |
| V1-JSON-004 — Round-trip | **PASS** | deep-equal serialize/deserialize |
| V1-JSON-005 — Identity preservation | **PASS** | doc + node ids survive |
| V1-JSON-006 — Invalid JSON handling | **PASS** | `DocFormatError`, per-field issues, no crash |

### §28 Autosave/recovery
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-AUTO-001 — Draft recovery (SHOULD) | **PLANNED — M10** | no autosave/IndexedDB today |

### §29–§30 Imports (identifiers added in R0.3)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-IMP-001 — Markdown (SHOULD for V1) | **OPEN** ◂R0.3 | not implemented; criteria SHOULD-for-V1 conflicts with `Main_Prompt.md` §50 (V1.4+) → decision D3 |
| V1-IMP-002 — DOCX (DEFERRED / V1.1) | **DEFERRED — V1.1/V1.4+** | clean import boundary retained |
| V1-IMP-003 — PDF (DEFERRED / V1.1) | **DEFERRED — V1.1/V1.4+** | extraction/reconstruction only; fidelity surfaced |
| V1-IMP-004 — DOC (DEFERRED) | **DEFERRED — V1.4+** | must not delay V1 foundation |
| V1-IMP-005 — Import acceptance principle | **DEFERRED (with import)** | applies when any import lands; result must enter the editable IR |

### §31–§34 Deferred subsystems
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-CD-001 — Controlled-document component (DEFERRED V1.2) | **DEFERRED — V1.2** | extension point reserved; a formatted table is not an implementation |
| V1-FORM-001 — Forms (DEFERRED) | **DEFERRED** | semantic extension point reserved |
| V1-CALC-001 — Calculations/units (DEFERRED) | **DEFERRED** | IR must not preclude quantity/unit/formula; no blocking structure added |
| V1-LIFE-001 — Lifecycle/approval (DEFERRED V1.2) | **DEFERRED — V1.2** | `metadata.status/revision` in M5 are **fields**, not lifecycle enforcement |

### §35 Rendering architecture (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-REN-001 — Shared semantic pipeline | **PASS** | one `renderLayout()` for preview + export |
| V1-REN-002 — No hard-coded sample rendering | **PASS** | renderer operates on arbitrary IR (goldens + stress) |
| V1-REN-003 — No page-number hardcoding | **PASS** | counters + derived materializer |

### §36 Performance
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PERF-001 (MUST) | **PARTIAL** ◂R0.3 | stress baseline: 93 pages, 1 table, 3 images, 3 sections. Criterion minimum: 20+ pages, **10+ tables, 10+ images**, multiple headings, headers/footers, multiple sections. Fixture extension + **release gate** defined in §6.1 |

### §37 Data integrity (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DATA-001 | **PASS** | adapter/persistence tests; no silent delete/corrupt paths |
| V1-DATA-002 | **PASS** | theme semantic-invariant tests |
| V1-DATA-003 | **PASS** | round-trip tests |

### §38 Error handling (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-ERR-001 — Visible, understandable errors | **PASS** | status-line messages; `DocFormatError` |
| V1-ERR-002 — No silent loss on import | **DEFERRED (with import)** | vacuous until an import exists; becomes active acceptance for V1-IMP-001 |
| V1-ERR-003 — Malformed JSON no crash | **PASS** | `tryDeserializeDocument` + e2e/unit |

### §39 Security (renamed to V1-SECU-001..003 in R0.3)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-SECU-001 — No execution of imported content | **PASS** ◂R0.3 | renderer treats content as data; sanitize allow-lists; links sanitized |
| V1-SECU-002 — No eval in formulas | **PASS** ◂R0.3 | no calc engine exists (vacuous today; prohibition applies to V1-CALC-001 work — AGENTS.md §21) |
| V1-SECU-003 — Imports are untrusted | **PASS** ◂R0.3 | envelope + sanitize + path-scope at load boundary; inherits to future V1-IMP imports |

### §40 Test acceptance (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TEST-001 — Automated tests | **PASS** | `ir.test.ts`, `adapter.test.ts` |
| V1-TEST-002 — JSON tests | **PASS** | `roundtrip.test.ts`, envelope paths |
| V1-TEST-003 — Numbering tests | **PASS** | `numbering.test.ts` |
| V1-TEST-004 — Rendering tests | **PASS** | `layout.test.ts`, `golden.test.ts` |
| V1-TEST-005 — Golden documents | **PASS** | 3 goldens collectively cover basic-sop/table-heavy/multi-page/mixed-orientation/header-footer/theme/image/metadata (+ stress) |
| V1-TEST-006 — End-to-end tests | **PASS** | create→edit→save→reopen→preview→PDF covered |

### §41–§43 Visual regression, theme regression, accessibility
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-VIS-001 — Visual regression (MUST) | **PARTIAL** ◂R0.3 | structural assertions + footer/page-number pixel-difference checks + PDF media/text parity pass; **no committed screenshot corpus** — release gate in §6.2 |
| V1-VIS-002 — Theme regression | **PARTIAL** | mechanism + invariants for 2 themes; complete with M7 (20); gate in §6.2 |
| V1-A11Y-001 (SHOULD) | **PLANNED — M11** ◂R0.3 | demonstrable per-requirement scope (§6.3); documented margin-box AT limitation is **not** a waiver |

### §44–§51 Documentation, technology, gates (identifiers added in R0.3)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DOCU-001 — Documentation acceptance (MUST) ◂R0.3 | **PASS** | AGENTS.md, ADRs 001–004, limitations, planning, README |
| V1-TECH-001 — Technology baseline ◂R0.3 | **PASS** | Tauri/React/TS/Vite/Tiptap/Zustand/pnpm; renderer validated by Phase-0 PoC (ADR-002) |
| V1-GATE-001 — Phase-0 rendering acceptance gate ◂R0.3 | **PASS** (closed) | gate evidence ADR-003; nine smoke-check rows PASS; screenshots not captured (documented) |
| V1-GATE-002 — Release-blocking defects ◂R0.3 | **PASS** (current) | no known critical defects; re-asserted at release |
| V1-DEMO-001 — Final acceptance demonstration ◂R0.3 | **PLANNED — after Phase 1** | realistic SOP (styles, lists, sizes, fields, themes, tables, images) |
| V1-GATE-003 — Final acceptance statement ◂R0.3 | **PLANNED — at release** | aggregated gate check |
| V1-GATE-004 — V1 release checklist ◂R0.3 | **PLANNED — at release** | checklist sign-off (V1.0 release gates in §6) |

> **Audit note:** the 133 identifiers above are exactly the 133 `## V1-*` blocks
> in the authoritative criteria (script-verified, §2.2). `V1-A11Y-001` is
> included (its family token contains a digit and is missed by naive regexes).

---

## 4. Status corrections (R0.3)

### 4.1 Reclassifications (PASS → PARTIAL where truth demands it)

- **V1-PDF-002 — PDF visual correctness: PASS → PARTIAL.** The criterion
  requires correct **page dimensions** in the PDF. Non-A4 page dimensions are
  unimplemented (`pageSizeMm` is A4-geometry; `format` enum is A4-only), so
  "visual correctness including page dimensions" is only satisfied for A4
  content today. Preserved A4 evidence: `pdf-parity.spec.ts` MediaBox
  assertions (595.28×841.89, ±1pt), gate + user PDFs, run-grouping per size in
  `pnpm pdf`. Non-A4 leg completes with **M4** (verified per-size MediaBox
  goldens). Status becomes PASS only after M4 + its PDF-size tests.

### 4.2 V1-DOC-002 orphaned work resolved

`V1-DOC-002` requires sensible new-document defaults (A4, portrait, standard
margins, **base style**, default theme, initial metadata structure) **and
"Defaults must be configurable where appropriate."** R0.2 left
"configurable defaults" orphaned ("settings milestone"):

- **Base style default** → **M1** (the style system is the only source of a
  "base style").
- **Configurable defaults where appropriate** → **M4** (milestone renamed
  "Page setup, paper sizes & document defaults"): document-level page
  settings UI (V1-PAGE-004) plus a new-document default-settings surface
  covering page setup, default theme and metadata skeleton.
- **Effect on V1 acceptance:** `V1-DOC-002` is **PARTIAL until M1 + M4** and
  cannot be claimed PASS earlier. If the user prefers to defer configurability
  beyond Phase 1, that is an explicit decision (D10) with rationale "predefined
  defaults satisfy the letter of the criterion"; the deferral would keep
  V1-DOC-002 PARTIAL and must be recorded — it is not an automatic pass.

### 4.3 Full-sweep result (no other PASS-vs-planned-work contradictions)

Re-checked every PASS row against its criterion text and implementation:

- PASS rows confirmed with no open work: PLAT-001..003, IR-001..004,
  DOC-001/003, TXT-002/003, PAGE-002, SEC-001/002/003, FLOW-001/002,
  TABLE-001/006/007, IMG-001/005, HF-001/002/004, NUM-001..005, REF-001,
  EQ-002/003, THEME-003/004, PREV-001..004, PAG-001/002/003/005/006,
  PDF-001/003, JSON-001..006, REN-001..003, DATA-001..003, ERR-001/003,
  SECU-001/002/003, TEST-001..006, DOCU-001, TECH-001, GATE-001, GATE-002.
- PARTIAL rows carry explicit remaining work: TXT-001 (M1), FMT-001/002/003
  (M2), LIST-001 (M3), PAGE-003/004 + SEC-002 + PAG-004 + PDF-002 (M4),
  TABLE-002/009 (M8), IMG-002/004 (M9), HF-003 + META-002/003 + FIELD-003
  (M5), EQ-001 (M6), THEME-001/002 (M7), PERF-001 + VIS-001/002 (gates §6).
- Vacuity is stated, not hidden: SECU-002 (no calc engine yet),
  ERR-002 (no import yet), GATE-001 (closed gate), GATE-002 (asserted current
  absence, re-asserted at release).
- The R0.2 claim "configurable defaults deferred to settings milestone" has
  been replaced (§4.2). No other PASS row names planned work as if complete.

---

## 5. Phase-boundary reconciliation (vs Main_Prompt §§46–50)

### 5.1 Promoted V1.1 capabilities inside Phase 1 (explicit, approval-gated)

| Phase-1 item | Main_Prompt placement | Criteria demand | Classification |
|---|---|---|---|
| M3 multilevel lists + per-level numbering | §47 "multilevel numbering" (V1.1) | V1-LIST-004 (SHOULD, V1); V1-LIST-003 requires renumbering | **Intentional promotion** — approval D8 |
| M6 cross-references | §47 "cross-references" (V1.1) | V1-REF-002/003 (SHOULD, V1) | **Intentional promotion** — approval D8 |
| M6 equation numbering | §47 "equations/figures" (V1.1) | none (V1-NUM covers headings/tables/figures only) | **Intentional promotion** — approval D8 |
| M8 advanced table pagination (merged cells × row-split × repeated headers) | §47 "advanced table pagination" (V1.1) | V1-TABLE-003/008 (MUST, V1) | **Criteria-mandated promotion** — approval D8 |

Rationale, stated plainly: the V1 acceptance criteria (the release gate)
demand merged cells, configured row-split and list renumbering **in V1**, and
list cross-references as SHOULD in V1; `Main_Prompt.md` §47 defers the
corresponding advanced capabilities to V1.1. Wherever the criteria mandate it,
the work must happen inside V1. The promotions are **additive scope**, require
explicit approval (D8), and do not weaken or rewrite the product roadmap —
they are flagged precisely so the boundary is a decision, not a silent change.

### 5.2 Retained boundaries (no change)

- **Imports:** V1-IMP-002/003/004 (DOCX/PDF/DOC) → V1.1+/V1.4+ per §50;
  **V1-IMP-001 (Markdown)** stays an explicit decision (criteria SHOULD-for-V1
  vs §50 V1.4+) — D3.
- **V1.1 §47 engine, not in V1 criteria:** TOC, generated lists, annexures,
  appendices, footnotes/endnotes, columns, widow/orphan control (which V1-FLOW
  -003/004 deferrals track), watermarks (already delivered in Phase 0).
- **V1.2:** V1-CD-001, V1-LIFE-001 (§48 engine).
- **V1.3:** V1-FORM-001, V1-CALC-001 (§49 engine).
- **V1.4+:** AI capabilities (§50).
- **Style-based text types:** V1-STYLE-001..004 / V1-TXT-001 deliver
  Title/Subtitle/Caption/Note/Warning/Definition etc. as Foundation work
  (§46 "Styles"), not V1.1 figures/annexures.

---

## 6. Testable release gates

### 6.1 V1-PERF-001 release gate

**Evidence gap (inspection of `tests/e2e/stress.spec.ts` +
`artifacts/stress-summary.json`):**

| Criterion minimum | Stress doc (2026-10-09) | Verdict |
|---|---|---|
| 20+ pages | 93 | ✓ |
| 10+ tables | 1 (43-row register) | **✗ — extend** |
| 10+ images | 3 | **✗ — extend** |
| multiple headings | present but **not recorded** (sec1 h1+h2×2, sec3 h1; sec2 has none) | **✓ / must record** |
| headers/footers | footer (default "Page X of Y") only; no headers | **partial — add headers** |
| multiple sections | 3 | ✓ |

**Required fixture and measurements (release-hardening work):**

1. Extend `buildStressDocument()` in `tests/e2e/stress.spec.ts` to reach the
   criterion minimum: ≥10 tables (mix of short tables and ≥1 multi-page split
   register), ≥10 images (varied widths), ≥6 heading blocks spanning all
   sections, explicit `header` margin boxes (e.g., `docNumber | title | Rev
   revision`) on every section, ≥3 sections, 20+ pages.
2. Record in the summary artifact: page count, heading count, table count,
   image count, section count, `previewMs`, `exportMs` (+ preview/PDF page
   agreement) — currently missing heading count; tables/images well below
   minimum.
3. Keep the existing hard invariants green: preview pages == PDF pages;
   restart marker + materialized "Page 5 of N"; split table + repeated
   `<thead>`; all images/equations present; mixed orientations in the PDF.

**Release-gate condition (proposed, approval D9):** the extended
representative fixture must render and export within **committed thresholds**
on the documented reference environment. Proposed reference thresholds,
derived from the recorded baseline (93-page preview ≈ 3.0 s, export ≈ 4.3 s on
the Phase-0 recording machine) with ~3–4× headroom for the added
tables/images and machine variance: **preview ≤ 12 s, export ≤ 20 s** for the
extended fixture. The thresholds are committed constants in the perf spec,
asserted at release, with observed values captured in
`artifacts/perf-summary.json`. "Choosing thresholds later" is explicitly **not**
acceptance evidence — the gate only passes with the fixture, measurements,
computed thresholds, and a green assertion run.

### 6.2 V1-VIS-001 / V1-VIS-002 release gate

**Current state (verified):** structural assertions pass (page counts,
header/footer/page-number text, section-transition run order in parity) +
pixel-difference *checks* (footer changes between pages —
`app.spec.ts:142-154`; page-number before/after — `page-setup.spec.ts:29-55`)
+ PDF text/media parity. There is **no committed screenshot corpus** — the
"no screenshots captured" note in the smoke check is accurate.

**Remaining corpus work (release-hardening):**

1. Corpus = { `golden-01-mixed-orientation`, `golden-02-sop-long-table`,
   `golden-03-phase0-gate`, V1-PERF representative document }.
2. Baselines: committed Playwright screenshots of representative pages — first
   page, a table-split page, a section-transition page, last page — per
   document, in the default theme plus one B&W and one color theme (the
   V1-VIS-002 switching series: default → bw → color → default, asserting
   semantic equivalence of extracted text/structure while allowing visual
   difference).
3. Tolerance policy: pixel-diff ≤ an explicit per-page threshold (proposed:
   ≤0.1% differing pixels above a per-element floor) with the browser engine
   pinned for determinism; fast structural invariants retained alongside.
4. Only after baselines land: update the "screenshots not captured" notes in
   `docs/phase0-manual-smoke-check.md` / `docs/limitations.md` accordingly.

**Release-gate condition:** the corpus e2e suite is green on CI with committed
baselines and the documented tolerance; V1-VIS-001/002 are PASS on that gate
(V1-VIS-002 additionally requires the 20-theme library from M7).

### 6.3 V1-A11Y-001 — no automatic waiver

The documented margin-box AT limitation (upstream paged.js, limitations item
5) remains a **documented constraint scoped to the preview margin boxes
only**; it does **not** waive the main-interface criterion. M11 must
demonstrate each requirement with tests:

- **Keyboard navigation:** every toolbar/editing operation reachable
  keyboard-only; tab-order e2e assertions.
- **Accessible labels:** labeled inputs/controls; `getByRole`-based assertions
  (no unlabeled icon-only controls).
- **Logical focus:** predictable focus movement across panes (editor, toolbar,
  sidebar, preview); assertions.
- **Usable controls:** focusable, operable, adequate target size.
- **Accessible form/dialog messages:** `window.prompt`/`alert` replaced by
  real dialogs exposing `role="dialog"`/`status` semantics; message assertions
  (M2/M5/M8/M9 land the dialogs; M11 verifies them).

---

## 7. Nested-list schema proposal (preserved; ADR-004 clarified)

Preserved verbatim in intent from R0.2 §4 (still **unimplemented** — approval
D4 required):

- **Legacy shape (unchanged on disk):**
  ```json
  { "id": "bl_ab12cd34", "type": "bulletList",
    "items": [ { "id": "pg_11", "type": "paragraph", "content": [{ "text": "Step one" }] } ] }
  ```
- **Proposed canonical shape (new `list` block kind):**
  ```json
  { "id": "bl_ab12cd34", "type": "list", "listType": "decimal", "marker": null, "start": 1,
    "items": [ { "id": "li_91x2f7q1a",
      "content": [{ "id": "pg_11", "type": "paragraph", "content": [{ "text": "Purpose" }] }],
      "children": [] } ] }
  ```
  `listType` ∈ bullet|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman;
  `marker` ∈ disc|circle|square|dash|arrow|check (bullet only); ordinals
  **derived** per level at resolve time, never stored.
- **Compatibility strategy (ADR-004):**
  - New **node kind** `list` added to the `blockSchema` union; legacy
    `bulletList` **kept byte-compatible** so existing flat documents load
    unchanged; element type of legacy `items` never changed.
  - The editor adapter normalizes legacy `bulletList` → canonical `list`
    (`listType: "bullet"`, `marker: "disc"`, childless listItems) on the next
    edit/save, converging new saves on one canonical shape.
  - Tests: new-`list` adapter round-trip both directions, per-level ordinal
    resolution, legacy→canonical normalization unit test, and a golden
    exercising flat + nested + numbered + roman lists.
- **ADR-004 distinction made explicit (backward vs forward):**
  - **Backward loading (guaranteed):** documents saved before the `list` kind
    loads unchanged in the new build — additive union member, defaults/nullable
    for new fields, covered by the existing "loads a legacy 1.0 envelope that
    predates additive fields" round-trip test.
  - **Forward loading (not guaranteed, by design):** a document saved by a
    NEWER build that uses the `list` kind cannot be opened by an OLDER build
    that predates it — the envelope still reports `1.0`, but the older build's
    zod union rejects the unknown `type` with an actionable `DocFormatError`.
    This asymmetry is exactly what ADR-004 means by "additive during
    pre-release": version bumping is reserved for backward-**in**compatible
    changes (removed/renamed fields), while additive forward-incompatible
    structures keep `1.0` and accept that older builds cannot read them. When
    `1.0` ships, this becomes the released baseline; post-release incompatible
    changes then bump to `2.0`.
- **Not implemented in this task.**

---

## 8. Milestone plan

### 8.1 Dependency graph (why this order)

```text
M1 Styles ─────────────┐
M2 Character/paragraph format ─┐
M3 Lists (uses M2 marks, numbering principles)   ◂ promoted: multilevel
M4 Page setup, paper sizes & DOCUMENT DEFAULTS (parallel thread; also M4
   closes V1-DOC-002 configurable defaults + V1-PAGE-004 settings UI)
M5 Metadata + lab profile + fields (uses M1 styles for field rendering)
M6 Numbering + references (+ equation numbering) ◂ promoted: cross-refs/eq
M7 Themes (needs M1 + M5)
M8 Table depth (needs M4 geometry, M2 cell formatting) ◂ promoted: merged×pages
M9 Images depth (needs M2 alignment, M8 caption UI)
M10 Autosave (independent app-shell)
M11 Accessibility pass (last; audits final controls/dialogs)
```

Ordering rule: model/business logic before renderer/editor; shared engines
(fields, numbering) before consumers; the risky table-pagination work after
geometry + formatting exist; M4 genuinely independent (may overlap M2/M3);
M11 (a11y) after the UI-heavy milestones so it audits final controls and
dialog shapes. Every milestone is independently reviewable and ends at a Git
checkpoint (AGENTS.md workflow).

### 8.2 Phase-1 milestones (proposed scope)

#### M1 — Style system · V1-STYLE-001..004 (MUST), V1-TXT-001 (MUST), V1-DOC-002 (base-style default)
Closes: no reusable styles; text types only as paragraph/heading. IR:
document-level `styles` map; per-block style **reference** (AGENTS.md §58);
style-based text types (Title, Subtitle, Body Text, Caption, Quote, Note,
Warning, Important Notice, Definition, Reference, Header, Footer, Table Text);
base-style default for new documents. Schema: additive under ADR-004. Tests:
assign/change/persist unit, round-trip, golden, e2e (style change re-renders;
theme switch preserves style semantics). Acceptance: V1-STYLE-003 (change
updates all users), V1-STYLE-004 (survives save/reopen), V1-DOC-002 base-style
leg. Out of scope: template authoring.

#### M2 — Character & paragraph formatting · V1-FMT-001/002 (MUST), V1-FMT-003 (SHOULD, feasible subset)
IR: extend `markSchema` (underline, strikethrough, superscript, subscript,
color, highlight, font family/size within allow-list); paragraph attrs
(alignment, line/paragraph spacing, indentation) stored as **overrides** of
styles, never replacing them. Editor: toolbar; real dialogs replace
`prompt()`. Dep: M1. Tests: adapter both directions, layout CSS, round-trip,
e2e; limitations item 16 updated. Acceptance: V1-FMT-001/002 in a golden;
V1-FMT-003 documented subset.

#### M3 — Lists · V1-LIST-001 (MUST), 002 (MUST), 003 (MUST), 004 (SHOULD) ◂ promotes V1.1 multilevel
IR: new `list` block kind per §7; bullet markers; numbered types with `start`;
derived per-level ordinals (extend numbering engine); legacy `bulletList`
normalization. Dep: M2. Tests: §7 suite + e2e (insert/remove/reorder
renumbers — V1-LIST-003). Acceptance: all six bullet markers and five
numbering styles work; any multilevel remainder tracked honestly, not dropped.

#### M4 — Page setup, paper sizes & document defaults · V1-PAGE-001/002/003/004 (MUST), V1-PAG-004 (MUST), V1-PDF-002 (MUST, non-A4 leg), V1-DOC-002 (configurable defaults)
IR: `format` enum expansion + custom width/height pair; layout geometry table;
document-level and new-document default settings (page setup, default theme,
metadata skeleton) — closes the V1-DOC-002 configurability requirement (§4.2).
Renderer: per-size `@page` geometry; `pnpm pdf` run-grouping (already
size-keyed) confirmed per-size MediaBoxes. Dep: none (parallel thread). Tests:
unit geometry, goldens per size×orientation, e2e PDF media sizes, settings
round-trip. Acceptance: every listed size paginates and exports correctly;
V1-PDF-002 and V1-PAG-004 complete.

#### M5 — Metadata, laboratory profile, dynamic fields · V1-META-001/002/003 (MUST), V1-FIELD-001..004 (MUST), V1-HF-003 (MUST)
IR: expanded `metadataSchema` (document type, department, review date, status,
prepared/reviewed/approved by, classification — additive empty defaults); new
`laboratoryProfile` (name/address/logo via the existing image allow-list);
inline field node in `inlineSchema`; `marginFieldSchema` extension. Resolve:
document/page/lab field resolution; unresolved-field registry served to
V1-FIELD-004 UI + export validation. Dep: M1. Tests: resolution unit,
round-trip, golden (fields in body + HF), e2e metadata→field updates and
unresolved detection. `status` is a **field**, not lifecycle (V1-LIFE-001 stays
V1.2).

#### M6 — Numbering & cross-references · V1-REF-001 (retained), V1-REF-002/003 (SHOULD), equation numbering (SHOULD) ◂ promotes V1.1 cross-refs/equation numbering
IR: reference field node (`ref` → target stable id + kind); equation
numbering (derived). Resolve: labels from `deriveNumbering` (heading number,
"Table N", "Figure N", "Equation N") — automatic updates by construction
(V1-REF-003); broken targets detected (AGENTS.md §46). Editor: reference
picker by id shown as visible number; Reference style from M1. Dep: M1, M5.
Tests: numbering-unit additions, adapter, round-trip, e2e renumber-updates
reference. Acceptance: V1-REF-002/003 + equation numbering in goldens (D8).

#### M7 — Theme library · V1-THEME-001/002 (MUST); 003/004 retained; V1-VIS-002 completion
Ship 18 more presentation-only themes (≥20), extend B&W to ≥5; all pass the
semantic-invariant suite and theme-regression e2e. Dep: M1, M5. Tests:
invariants ×20, VIS-002 series over the corpus (§6.2). Acceptance: 20 themes,
5 B&W, invariants green, VIS-002 corpus green.

#### M8 — Table depth · V1-TABLE-002 (MUST UI), 003 (MUST), 004 (MUST), 005 (MUST), 008 (MUST), 009 caption-editing (MUST) ◂ promotes advanced table pagination
IR: colspan/rowspan on `tableCell`; cell h/v alignment; table/cell borders,
thickness, background, padding, row height; `rowSplit` policy (configurable
per table — D5); caption editing persists to `caption`. Renderer: repeated
header + merged-cell continuation across pages (AGENTS.md §18); row-split
enforcement by the layout script; goldens for multi-page merged tables.
Editor: row/column add-delete, merge/split, alignment, formatting. Dep: M4,
M2. Tests: adapter, golden + e2e (multi-page merged tables, repeated headers,
row-split), round-trip. Risk: merged cells × pagination is the highest table
risk — isolated here with the header-repeat/row-split suite. Out of scope:
TOC/generated lists (V1.1).

#### M9 — Image depth · V1-IMG-002 (MUST), 003 (MUST), 004 (MUST); 001/005 retained
IR: image alignment attr; `widthMm`/`caption` gain editor controls. Editor:
resize control, alignment, caption input (mirrors M8 caption UI). Dep: M2,
M8. Tests: adapter both directions, round-trip, e2e (resize changes rendered
width; alignment CSS; caption round-trips), figure numbering unchanged.

#### M10 — Autosave / draft recovery · V1-AUTO-001 (SHOULD)
IndexedDB draft of the current IR + recovery prompt on next launch; never
overwrites an intentional saved file without user awareness (criterion pass
condition). Canonical document remains the versioned JSON file. Dep: none.
Tests: unit (write/read/expiry), e2e recovery flow.

#### M11 — Accessibility pass · V1-A11Y-001 (SHOULD)
Demonstrable requirements per §6.3 (keyboard, labels, focus, usable controls,
accessible dialog messages); replace remaining `prompt`/`alert`; margin-box AT
limitation documented, not waived. Dep: M2/M5/M8/M9 (dialogs exist by then).
Tests: a11y-oriented e2e (keyboard-only editing path, labelled controls,
dialog messages).

### 8.3 Phase-1 acceptance (cross-cutting)
Every milestone keeps `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`,
`pnpm build` green; ADR-004 additive discipline (migration + round-trip +
golden per change); `docs/limitations.md` updated as features move from
disabled/limited to supported; per-milestone checkpoint commit + push.

### 8.4 Remaining-V1 roadmap and release gates (after Phase 1)
| Work | Criteria | When / gate |
|---|---|---|
| **IMP-MD** — Markdown import (remark/unified → IR; fidelity report; V1-ERR-002 becomes active) | V1-IMP-001 (SHOULD) | **D3 decision** — Phase-1 late slot, remaining-V1, or V1.1 deferral; `remark`/`unified` approval separate (AGENTS.md §35/§72) |
| **Release gates & hardening** | V1-PERF-001 gate, V1-VIS-001/002 gates, V1-GATE-002/003/004, V1-DEMO-001 | Release hardening: PERF fixture + thresholds (§6.1), VIS corpus + baselines (§6.2), demonstration SOP, checklist sign-off |
| V1.1 advanced engine (Main_Prompt §47) | TOC, generated lists, annexures/appendices, footnotes, columns, widow/orphan | V1.1 (not V1 criteria) |
| V1.2 controlled engine | V1-CD-001, V1-LIFE-001 | V1.2 |
| V1.3 forms/calc/units | V1-FORM-001, V1-CALC-001 | V1.3 |
| V1.4+ imports/AI | V1-IMP-002/003/004 (unless otherwise decided), AI | V1.4+ per §50 |

### 8.5 Retained non-goals (justified)
Unchanged: DOCX/PDF/DOC import (V1.1+/V1.4+), controlled-document/lifecycle/
approval (V1.2), forms/calculations/units (V1.3), AI (V1.4+), renderer/
framework replacement (ADR-001/002 frozen), no backend/auth/cloud, JSON schema
2.0 (additive-only pre-release under ADR-004), and the Phase-1 promotions are
**additions** — nothing in §47/§50 is silently rewritten.

---

## 9. Open decisions (prioritized)

| # | Decision | Needed for | Recommendation |
|---|---|---|---|
| D1 | Approve Phase-1 scope M1–M11 (§8.2) | Scope | Endorse as proposed (or amend) |
| D2 | Milestone order + M4 parallel thread; M11 placement | Sequencing | Confirm; M4 ∥ (M2/M3); M11 in Phase 1 |
| D3 | **V1-IMP-001 Markdown import**: Phase 1 / remaining-V1 / V1.1 deferral (+ separate `remark`/`unified` approval if in) | Imports | Decision required — criteria SHOULD vs Main_Prompt §50 |
| D4 | Nested-list `list` schema (§7) + stay on `1.0` (additive, forward-incompatible by design) | Schema | Approve model + ADR-004 classification |
| D5 | Table row-split semantics (V1-TABLE-008): default `allow` with per-table `prevent` + UI surface | Tables (M8) | Confirm proposed policy |
| D6 | `metadata.status` as organizational label now; lifecycle deferred to V1.2 | Metadata (M5) | Confirm (prevents META-001 being gated on §34) |
| D7 | Documented margin-box AT limitation vs V1-A11Y-001 (constraint, not waiver; M11 scope §6.3) | A11y (M11) | Accept constraint + M11 demonstrable scope |
| D8 | **V1.1 scope promotions into Phase 1**: multilevel lists/numbering (M3), cross-references (M6), equation numbering (M6), advanced table pagination (M8) | Phase boundary | Approve as additive promotions (§5.1) |
| D9 | **V1-PERF-001 gate**: extended fixture (10+ tables, 10+ images, headers, recorded headings) + committed thresholds (preview ≤ 12 s, export ≤ 20 s on reference env) + gate condition (§6.1) | Release gate | Approve gate + thresholds (or amend) |
| D10 | **V1-VIS-001/002 gate**: corpus + committed screenshot baselines + tolerance policy (§6.2); and/or deferral of V1-DOC-002 configurability beyond Phase 1 (§4.2) | Release gate / defaults | Approve corpus policy; confirm configurability stays in M4 |

---

## 10. Residual references and follow-ups

- `tests/unit/input-security.test.ts:2` comments reference the pre-rename
  security criterion `V1-SEC-003`. The test file is **not** modified by this
  documentation-only revision; the comment becomes `V1-SECU-003` as a
  comment-only update at the first Phase-1 checkpoint that touches the file.
- `docs/phase0-manual-smoke-check.md` and `docs/limitations.md` "screenshots
  not captured" notes stay accurate until the V1-VIS corpus baselines land
  (§6.2).
- The 133-identifier one-to-one matrix (§3) is the authoritative traceability
  map for Phase 1 planning and release gating.

> This document is a proposal. Implementing any part of it requires explicit
> approval of the scope, order and open decisions above (AGENTS.md §82). **No
> Phase 1 implementation has been started.**