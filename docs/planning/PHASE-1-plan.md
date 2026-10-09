# Phase 1 — Planning Proposal (Draft for Review)

- **Status:** Proposal — **not** authorized implementation scope. This document
  is review input for the next milestone decision. No Phase 1 code is
  authorized by it (AGENTS.md §82 `When to ask the human`).
- **Date:** 2026-10-09
- **Base:** Phase 0 **closed (PASS)** at `d343b504f8ec7d47cd58afacdc1cbdd755aeba15`
  — native-desktop gate PASS (`docs/phase0-manual-smoke-check.md`), path-scope
  guard re-validated, WebView2 print exercised (ADR-003).
- **Companion docs:** `Main_Prompt.md` §46–§50 (V1 Foundation / V1.1–V1.4);
  `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` (authoritative release gate);
  `AGENTS.md` (workforce rules); ADR-001..004.

---

## 1. Objective

Phase 1 deepens the **structured document engine** established in Phase 0,
targeting the V1 MUST/SHOULD acceptance criteria that remain open after Phase
0. It follows the core development order of `Main_Prompt.md` §46 / `AGENTS.md`
§78: **Document Model → Business Logic → Rendering → Editor UI**, not
UI-first.

Phase 1 is **not** the whole V1: forms, calculations/units, lifecycle,
controlled-document components, and non-Markdown import remain later phases
(and are mostly DEFERRED by the acceptance criteria).

Proposed Phase-1 scope, keyed to V1 criteria:

| # | Item | Criteria |
|---|------|----------|
| 1 | **Style system** — reusable styles (IR `styles`), assignment, modification, persistence; presentation stays separated from content (`AGENTS.md` §58) | V1-STYLE-001..004 (MUST) |
| 2 | **Lists** — numbered lists and automatic list numbering; multilevel numbering; replace the flat-list IR with a nested list model (lift `docs/limitations.md` item 12) | V1-LIST-002/003 (MUST), V1-LIST-004 (SHOULD) |
| 3 | **Object numbering & cross-references** — extend the existing derived-numbering engine (`src/core/numbering`) to equations; add stable-ID cross-reference fields with automatic update | V1-NUM-002/003/004/005 (MUST), V1-REF-001 (MUST), V1-REF-002/003 (SHOULD) |
| 4 | **Dynamic fields** — body-level field blocks (document, laboratory, page) resolved from structured data, plus unresolved-field detection | V1-FIELD-001..004 (MUST) |
| 5 | **Theme library** — grow from 2 to **20 themes incl. 5 deliberate B&W**, presentation-only, semantic-invariant tests pass for all | V1-THEME-001/002 (MUST); V1-THEME-003/004 already pass |
| 6 | **Autosave / draft recovery** via IndexedDB — never overwrites an intentional save without user awareness | V1-AUTO-001 (SHOULD) |
| 7 | **Markdown import** — remark/unified → IR structure mapping (headings, paragraphs, lists, basic formatting, basic tables); untrusted-input pipeline with a fidelity report for lossy conversion | V1 §29 Markdown (SHOULD) |
| 8 | **Table/image editor depth** — merge cells (rowspan/colspan in IR + renderer + editor), cell alignment, image resize/alignment/caption editing, figure identity | V1-TABLE-002/003/004 (MUST), V1-IMG-002..005 (MUST) |

## 2. Explicit non-goals (Phase 1)

- **DOCX / DOC / PDF import** — DEFERRED to V1.1 by criteria (§29); only the
  import boundary contract is kept clean.
- **Controlled-document component, lifecycle, approval, revision history** —
  DEFERRED to V1.2 (§31/§34).
- **Forms, calculations, units engine** — DEFERRED (§32/§33); the IR must keep
  the extension point, nothing more this phase.
- **AI generation / extraction** — post-V1.
- **Renderer / framework replacement** (ADR-001/002 frozen); no new backend,
  no auth, no cloud (product non-goals).
- **JSON schema 2.0** — Phase-1 additions are additive with Zod defaults under
  ADR-004; any approved backward-incompatible change gets a versioned,
  tested migration instead.
- **20-theme "theming engine beyond selection"** — theme *authoring* UI is out
  of scope; themes are shipped data + CSS under the existing theme module.

## 3. Dependencies and sequencing

Why this order:

- **M1 styles first**: styles are the shared presentation contract that
  references, fields, and new blocks depend on for rendering; they are also
  IR-safe with no pagination risk.
- **M2 lists** extends the IR block set and the editor adapter — plumbing that
  M3/M4 reuse.
- **M3 numbering/references** sits on stable IDs (already present) and the
  existing `deriveNumbering`; it adds the reference engine, which **M4 fields**
  reuse for `[ref]`-style resolution.
- **M4 fields** extends the resolve pipeline (`src/core/resolve`) and the
  layout HTML — the last engine change before presentation work.
- **M5 themes** is presentational and therefore **parallelizable** with any of
  M1–M4 (independent of engine milestones; only needs the semantic-invariant
  tests).
- **M6 autosave** is independent (IndexedDB + app shell) — can be scheduled
  anywhere after M1.
- **M8 table/image depth** is the riskiest editor work (merge cells + table
  pagination per `AGENTS.md` §18) and is sequenced after the engine milestones
  so table changes build on a complete block/numbering model.
- **M7 Markdown import** is last: it consumes the finished IR engine and the
  style/list/field models; it also introduces the first import dependency
  (remark/unified) which must be version-verified before addition
  (`AGENTS.md` §35/§72).

**Proposed order:** M1 → M2 → M3 → M4 → (M5 ∥ M6) → M8 → M7.
Each milestone ends in a verified checkpoint (tests green, docs current,
focused commit + push) per `AGENTS.md`; the next milestone starts from it.

## 4. Testable acceptance criteria (per milestone)

Every milestone passes the project gates that apply to Phase-0 functionality:
`pnpm typecheck`, `pnpm test` (unit + golden + round-trip), `pnpm test:e2e`,
and `pnpm build`. In addition:

| Milestone | Acceptance (all must hold) |
|-----------|----------------------------|
| M1 Styles | V1-STYLE-001..004: styles stored in IR only; assign/modify/persist; golden + round-trip tests; theme switch does not alter style semantics |
| M2 Lists | V1-LIST-002/003: numbered lists with automatic numbering; V1-LIST-004: multilevel where feasible; nested IR list model round-trips; existing flat-list documents still load (additive migration) |
| M3 Numbering/refs | V1-NUM-002/003/005: table/figure/equation numbering derived, not stored; V1-REF-001: references target stable IDs; V1-REF-002/003: cross-reference inserts and updates; heading numbering goldens unchanged |
| M4 Fields | V1-FIELD-001..003: document/laboratory/page fields resolve from structured data deterministically; V1-FIELD-004: unresolved fields detected and surfaced, not silently blank |
| M5 Themes | V1-THEME-001/002: 20 themes selectable, ≥5 B&W; V1-THEME-004: semantic-invariant tests green for all 20 |
| M6 Autosave | V1-AUTO-001: draft recovery works; intentional saved documents are never overwritten without user awareness |
| M7 Markdown import | §29 Markdown: headings/paragraphs/lists/basic formatting/basic tables enter the editable IR; lossy conversion is reported; untrusted-input checks hold |
| M8 Table/image depth | V1-TABLE-003 (merge cells incl. repeated-header continuation), V1-TABLE-004 (cell alignment), V1-IMG-002..005 (resize/alignment/caption/figure identity); multi-page-table goldens stay green |

## 5. Risks, architecture constraints, migration considerations

- **IR evolution is additive-only** under ADR-004: new fields get Zod defaults
  or are nullable; `schema_version` stays `1.0` during pre-release; round-trip
  and golden tests pin backward compatibility. No silent field-meaning
  changes.
- **Numbering must stay derived**: visible numbers are computed by the
  numbering engine, never stored or hard-coded (`AGENTS.md` §11–12); extending
  to equations/references must not change existing heading/table/figure output
  (goldens are the guard).
- **References resolve by stable ID**, never by visible number; broken/deleted
  targets must be detected (V1-REF, `AGENTS.md` §46 failure cases).
- **Merge cells are the highest table risk**: rowspan/colspan must be added to
  the IR, the shared layout/table pagination (with repeated headers and
  continuation per `AGENTS.md` §18), and the Tiptap adapter together — golden +
  e2e coverage for multi-page merged tables before UI polish.
- **Field markup is untrusted content** at render time (sanitize allow-lists
  must cover field-derived output; deterministic resolution only).
- **Lists**: lifting the flat-list limitation requires an IR schema change —
  additive (new optional `items` nesting with default `null`/empty) so old
  flat documents load unchanged.
- **Themes**: any new theme must be pure presentation; the existing semantic
  invariant tests (content/IDs/numbering unchanged) apply to all 20.
- **Autosave**: IndexedDB is auxiliary state only (`Main_Prompt.md` §5.18); the
  canonical document remains the versioned JSON file.
- **Markdown import**: imported content is untrusted (`AGENTS.md` §27/§99/§100);
  fidelity limits are surfaced, never silently dropped (§29).
- **Performance**: the 93-page stress document stays green
  (`docs/limitations.md` item 8); new engines run inside the resolve/layout
  pipeline increments rather than full-document recompute rewrites.
- **No migration code is shipped** unless a backward-incompatible change is
  approved (ADR-004 policy 2).

## 6. Small, independently reviewable milestones

Each milestone below is a standalone checkpoint (scope → tests → docs → commit
→ push), reviewable on its own:

1. **M1 Styles** — IR `styles` + style assignment/modification/persistence in
   the editor + rendering from styles (V1-STYLE-001..004).
2. **M2 Lists** — nested IR list model + numbered/multilevel lists + adapter
   (V1-LIST-002..004).
3. **M3 Numbering & references** — equation numbering + reference fields +
   auto-update (V1-NUM-002..005, V1-REF-001..003).
4. **M4 Dynamic fields** — body field blocks + resolution + unresolved
   detection (V1-FIELD-001..004).
5. **M5 Theme library** — 20 themes, ≥5 B&W, semantic-invariant tests
   (V1-THEME-001/002/004).
6. **M6 Autosave/recovery** — IndexedDB draft recovery (V1-AUTO-001).
7. **M7 Markdown import** — remark/unified → IR with fidelity reporting
   (V1 §29 Markdown).
8. **M8 Table/image depth** — merged cells, cell alignment, image resize /
   alignment / caption / figure identity (V1-TABLE-003/004, V1-IMG-002..005).

## 7. Review points / open decisions (user review required)

- Approve the **scope split** (items 1–8 in; the non-goals out).
- Confirm **milestone order**, especially: theme library in parallel vs
  sequential; table/image depth (M8) before or after Markdown import (M7).
- Decide whether **Markdown import** belongs in Phase 1 at all, given it is
  SHOULD-for-V1 and adds its first import dependency (remark/unified —
  version-verify before adding).
- Confirm **schema policy** stays additive-`1.0` for the list/styles/field
  additions (ADR-004).
- Approve any **new dependencies** individually (remark/unified for M7; none
  proposed for M1–M6).

> This document is a proposal. Implementing any part of it requires explicit
> approval of the scope and order above (AGENTS.md §82).