# Phase 1 — Plan & Approval Record R0.14 (M6 Delivery)

- **Status:** **APPROVED + M1, M2, M3, M4, M5 & M6 DELIVERED** — the Phase-1 scope
  and decisions listed in §0 remain explicitly approved by the human (approval
  record R0.4, 2026-10-09). Revision R0.5 recorded the **delivery of M1**
  (reusable style system, V1-STYLE-001..004 / V1-TXT-001 / V1-DOC-002
  base-style leg); R0.6 recorded the **M1 post-delivery hardening**; R0.7
  recorded the **delivery of M2** (character & paragraph formatting:
  V1-FMT-001/002 PASS, V1-FMT-003 a documented partial subset); R0.8 was a
  **documentation-only reconciliation** of the M2 matrix rows; R0.9 recorded
  the **delivery of M3** (lists & multilevel numbering: V1-LIST-001/002/003
  PASS, V1-LIST-004 PASS as a documented structured subset); R0.10 recorded the
  **M3 post-delivery hardening**; R0.11 recorded the **delivery
  of M4** (page setup, paper sizes & new-document defaults: V1-PAGE-001..004
  PASS, V1-SEC-002 PASS, V1-PAG-004 PASS, the V1-PDF-002 non-A4 leg PASS, and
  the V1-DOC-002 configurability leg PASS); R0.12 recorded the **M4 evidence
  hardening** (the `golden-07-page-setup` fixture and the PDF MediaBox e2e test
  were expanded so the **real exported PDF** is checked for **all 14 standard
  format × orientation combinations plus Custom (15 cases)**). R0.13 recorded the
  **delivery of M5** (metadata, laboratory profile &
  dynamic fields: V1-META-001/002/003 PASS, V1-FIELD-001..004 PASS, V1-HF-003
  PASS). This revision (**R0.14**) records the **delivery of M6**
  (numbering & cross-references: V1-REF-002 and V1-REF-003 PASS, and the
  numbering/cross-reference leg of V1-EQ-001 — **equation numbering** — PASS).
  It adds **no** new scope beyond the already-approved M6 (§8.2) and does
  **not** alter the R0.4 approval, re-open approved decisions, change M1–M5
  acceptance, or authorize further milestones. **All Phase 0 PASS
  classifications and evidence are preserved unchanged.** No feature scope or
  criterion definition changed.
- **Revision:** R0.14 (2026-10-12) — M6 delivery; supersedes R0.13
  (M5 delivery) which superseded R0.12
  (M4 evidence hardening) which superseded R0.11 (M4 delivery record) which
  superseded R0.10 (M3 post-delivery hardening) which superseded R0.9 (M3
  delivery record) which superseded R0.8 (M2 status reconciliation) which
  superseded R0.7 (M2 delivery record) which superseded R0.6 (M1 hardening
  record) which superseded R0.5 (M1 delivery) which superseded R0.4 (approval
  record).
- **Base:** Phase 0 **closed (PASS)** at
  `0593ba053c9911e7021f31d91a40058c4f62c107` (gate evidence ADR-003); planning
  R0.1–R0.3 at `c46cffaae4e7e1139c1985a723c32a81b38315b3`; approval at
  `b381ab3c3417eb95f5392397cbf222c449c97829` (R0.3) and `fc9b00b` (R0.4);
  M1 delivered on top of `fc9b00b` (§0.5, checkpoint `4083c0c`, hardened at
  `c26f567`); M2 delivered at `85e2db3` (§0.7); the M2 matrix reconciliation
  at `409c5051809f5a01ca72f9dd0c00c058e49af07f` (R0.8); M3 delivered at
  `88578896ccd47f862d7fff20bf6d21fdbd97774b` (§0.9) and hardened at
  `a18a91cdded03a85995ff0bd5455166d836cfca4` (§0.10, R0.10); M4 delivered at
  `cd1b0d5034943bde77a5d22c8a2b9ff7822ba964` (§0.11, R0.11); the M4 evidence
  hardening (R0.12) at `30867718756a83f3bfe60c24409b2d0a06493374` (§0.12); the
  M5 delivery (R0.13) at
  `cbcb708e42946b79c248e54eb3ead00a361774f2` (§0.13); the
  **M6 delivery (R0.14) sits on top of `cbcb708`** — the base commit for this
  delivery.
- **Authoritative criteria:** `docs/requirements/V1_ACCEPTANCE_CRITERIA.md`
  (133 unique identifiers, one-to-one — corrected in R0.3; unchanged here).
  All Phase 0 PASS classifications and existing evidence in §4 are preserved
  unchanged.
- **Companion docs:** `Main_Prompt.md` §§46–51 (V1 Foundation / V1.1–V1.4 /
  Phase-0 PoC); `docs/requirements/V1_ACCEPTANCE_CRITERIA.md` (release gate);
  `AGENTS.md`; ADR-001..005; `docs/limitations.md`;
  `docs/phase0-manual-smoke-check.md`.
- **Method:** evidence in §4–§9 was re-verified in R0.3 against the current
  IR schema (`src/core/ir/schema.ts`), factory (`src/core/ir/factory.ts`),
  editor extension set + adapter (`src/editor/extensions.ts`, `adapter.ts`),
  sidebar/editor UI, resolve/numbering engines, layout pipeline, theme
  registry, file workflow, and the unit/e2e/golden suites (including
  `tests/e2e/stress.spec.ts`, `tests/e2e/pdf-parity.spec.ts`,
  `tests/golden/generator.ts`, `artifacts/stress-summary.json`). R0.4 is
  documentation-only: no executable verification was run or claimed. **R0.5**
  is the first implementation checkpoint: M1 was executed end-to-end with
  `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` and `pnpm build` run against
  the final tree (results recorded in §0.5). **R0.7** is the second
  implementation checkpoint: M2 was likewise executed end-to-end with
  `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` and `pnpm build` run against
  the final tree (results recorded in §0.7). **R0.8 was documentation-only:** it
  corrected the coverage-matrix status rows to match the R0.7 delivery record;
  no executable verification was run or claimed for it, and M2's previously
  recorded results (§0.7) are kept intact. **R0.9** is the third
  implementation checkpoint: M3 was executed end-to-end with `pnpm typecheck`,
  `pnpm test`, `pnpm test:e2e` and `pnpm build` run against the final tree
  (results recorded in §0.9). **R0.11** is the fifth implementation checkpoint
  (and R0.10 recorded the M3 hardening): M4 was executed end-to-end with
  `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build` and
  `git diff --check` run against the final tree (results recorded in §0.11).
  **R0.12** is the sixth implementation checkpoint (M4 evidence hardening): the
  expanded fixture and the strengthened PDF MediaBox test were run end-to-end
  with the same five commands against the final tree (results recorded in §0.12).
  **R0.13** is the seventh implementation checkpoint (M5 delivery): metadata, the
  laboratory profile and dynamic fields were executed end-to-end with the same
  five commands against the final tree (results recorded in §0.13).
  **R0.14** is the eighth implementation checkpoint (M6 delivery): cross-references
  and derived equation numbering were executed end-to-end with the same five
  commands, plus real-document PDF/export checks (reference renumbering and
  broken-target behaviour), against the final tree (results recorded in §0.14).

---

## 0. Approval record, change history & milestone delivery (R0.14)

### 0.1 Approval summary

- **Status:** APPROVED (scope + decisions D1–D11, §9).
- **Date:** 2026-10-09.
- **Base:** `b381ab3c3417eb95f5392397cbf222c449c97829` (R0.3 published).
- **Repository:** `https://github.com/ikramulwahid/DocMaker.git`, branch `main`.
- **Authority:** explicit human approval of the Phase-1 scope and decisions
  listed in §0.3. Approval is recorded exactly as granted; nothing not listed
  is inferred as approved.

### 0.2 Authorization boundary (this checkpoint)

This checkpoint is **documentation-only**:

- No Phase 1 feature implementation is authorized by this approval record.
- No application code, IR schemas, dependencies, lockfiles, tests, test
  fixtures, or golden artifacts were or may be modified by this checkpoint.
- The only file change is this planning document (R0.4). The authoritative
  criteria document was finalized in R0.3 and is unchanged here.
- Phase-1 implementation begins only in a **separate task after this checkpoint
  is published**, starting from M1, following the AGENTS.md checkpoint
  workflow (inspect → plan → implement → test → review → commit → push →
  report).

### 0.3 Approved scope (as granted)

| # | Approved item | Where recorded |
|---|---|---|
| 1 | M1–M11 as the Phase-1 scope | §8.2 (D1) |
| 2 | Sequential execution with separate checkpoint commits per milestone; M4 conceptually independent but **no simultaneous implementation in the same working tree**; M1 starts only in a separate task | §8.1, §8.2 (D2) |
| 3 | Markdown import scheduled as a separate remaining-V1 milestone after M1–M11 and before final V1 acceptance; recorded as an intentional deviation from `Main_Prompt.md` §50; `remark`/`unified` dependency approval remains separate and requires a package-version, license and security review before implementation | §5.2, §8.4, §9 (D3) |
| 4 | Canonical `list` node + legacy `bulletList` compatibility strategy; `schema_version` stays `1.0` under ADR-004; documented that older builds may reject files containing newly introduced block types; **schema not implemented here** | §7 (D4) |
| 5 | `rowSplit: "allow"` default + per-table "prevent row splitting"; deterministic behavior specified when a prevented row cannot fit within a page | §8.2 M8 (D5) |
| 6 | `metadata.status` as an organizational label; lifecycle enforcement + immutable history deferred to V1.2 | §8.2 M5 (D6) |
| 7 | paged.js margin-box accessibility constraint accepted **without waiving** main-interface accessibility acceptance requirements | §6.3 (D7) |
| 8 | The four scope promotions (multilevel lists, cross-references, equation numbering, advanced table pagination) | §5.1 (D8) |
| 9 | Performance targets preview ≤ 12 s and export ≤ 20 s as **targets**; reference environment and representative fixture documented and pinned before the release gate becomes enforceable | §6.1 (D9) |
| 10 | Visual-regression corpus + committed screenshot baseline approach; exact browser/runtime pin and pixel-difference tolerance policy documented before the gate is activated | §6.2 (D10) |
| 11 | Configurable new-document defaults stay in M4; treated separately from the visual-regression decision | §4.2, §8.2 M4 (D11) |

### 0.4 Change history

- **R0.1/R0.2 (2026-10-09):** initial Phase-1 planning proposal; full V1
  acceptance-coverage audit (122 criterion blocks), milestone plan,
  open decisions. Published at `c46cffa`.
- **R0.3 (2026-10-09):** criteria-integrity and decision-readiness audit —
  identifier collisions removed (133 unique IDs, one-to-one), status
  corrections (V1-PDF-002 → PARTIAL; V1-DOC-002 orphan resolved),
  phase-boundary reconciliation, testable release gates, nested-list ADR-004
  clarification. Criteria document updated. Published at `b381ab3`.
- **R0.4 (2026-10-09):** approval record — D1–D11 approved by
  the human (R0.3 D10 split into D10 visual regression + D11 configurable
  defaults); execution governance fixed (sequential checkpoints; M1 starts in
  a separate task); Markdown import recorded separately from the four scope
  promotions; reference-environment prerequisites added to the V1-PERF-001
  gate; all Phase 0 PASS classifications and existing evidence preserved
  unchanged. Published at `fc9b00b`.
- **R0.5 (2026-10-10):** **M1 delivered** — reusable style
  system implemented, tested and published (see §0.5). Plan status markers
  updated: V1-STYLE-001..004 and V1-TXT-001 → PASS; V1-DOC-002 base-style leg
  delivered (stays PARTIAL — configurability remains in M4). ADR-005 records
  the style-system architecture. R0.4 approval record retained verbatim in
  its substance.
- **R0.6 (2026-10-10):** M1 post-delivery hardening (see §0.6) — style
  fallback lookups hardened against JavaScript object prototype property names
  (own-property checks in `resolveStyleDefinition`, `resolveStyles` and the
  store; regression tests for `constructor`, `toString`, `hasOwnProperty`);
  the e2e parity PDF was relocated from the tracked
  `artifacts/spike/e2e-sop.pdf` to the ignored `artifacts/e2e-sop.pdf` so E2E
  runs never dirty the working tree (tracked spike PDF restored to its pre-M1
  bytes). M1 acceptance unchanged; M2 not started. Published at `c26f567`.
- **R0.7 (2026-10-11):** **M2 delivered** — character and
  paragraph formatting implemented, tested and published (see §0.7). Plan
  status markers updated: V1-FMT-001 and V1-FMT-002 → PASS; V1-FMT-003 →
  PARTIAL (documented feasible subset — uppercase/lowercase only). A latent
  M1 defect was also corrected: the colour-token validator accepted only
  3/4/6/8-digit hex (the previous `{3,8}` range wrongly allowed 5/7 digits).
  ADR-004 additive policy holds — `schema_version` stays `1.0`. R0.4 approval
  record retained verbatim in its substance; M3 not started. Published at
  `85e2db3`.
- **R0.8 (2026-10-11):** **M2 status reconciliation
  (documentation only).** The R0.7 revision updated the narrative status
  markers (§0.7, §8.2, header) and `docs/limitations.md`, but the §3
  coverage-matrix rows for V1-FMT-001/002/003 still carried their pre-M2
  `PARTIAL` text. R0.8 aligns those three rows with the delivered state —
  V1-FMT-001 → PASS, V1-FMT-002 → PASS, V1-FMT-003 → PARTIAL (uppercase/
  lowercase delivered; remainder documented) — and adds the R0.7 transitions
  note to the matrix legend. No application code, schema, test, fixture or
  golden changed; `schema_version` stays `1.0`; no criterion definition
  altered; M2's recorded test results (§0.7) are unchanged and were not
  re-run. M3 not started. Published at `409c505`.
- **R0.9 (2026-10-11):** **M3 delivered** — lists and
  multilevel numbering implemented, tested and published (see §0.9). Plan
  status markers updated: V1-LIST-001/002/003 → PASS; V1-LIST-004 → PASS as a
  documented structured subset (recursive nesting + hierarchical derived
  numbering; the honest residuals — one uniform type/marker per tree, nested
  levels restart at 1, native ordered markers suppressed in favour of derived
  inline labels — are recorded in §0.9 and `docs/limitations.md` §M3). A new
  canonical recursive `list` block kind was added to the IR union and legacy
  flat `bulletList` blocks are normalised to it on the next edit/save. ADR-004
  additive policy holds — `schema_version` stays `1.0`. R0.4 approval record
  retained verbatim in its substance; M4–M11 not started. Published at `8857889`.
- **R0.10 (2026-10-11, this revision):** **M3 post-delivery hardening** (see
  §0.10) — review followed the M3 delivery and found two narrow issues, both
  closed without new scope: (1) an ordered list's configurable `start` was
  bounded only in the UI (1–9999) but not at the schema/adapter/render
  boundaries, so a hand-edited `.labdoc.json` with a huge `start` (e.g. `1e100`)
  could drive the Roman-numeral formatter's subtraction loop unboundedly; (2)
  the automatic-renumbering unit test rebuilt every list with position-derived
  ids, so delete/reorder were not proved with stable item identities. The
  hardening introduces one shared `LIST_START_MIN`/`LIST_START_MAX` (1–9999)
  policy used by the schema (zod range), the Tiptap adapter and the
  render/numbering boundary, a defensive finiteness/magnitude cap inside
  `toRoman`, and stable-id delete/reorder/insert/nest/unnest numbering tests
  plus a real-editor deletion e2e. No criterion definition changed; V1-LIST-001/
  002/003 remain PASS and V1-LIST-004 remains PASS as a documented structured
  subset (evidence strengthened). `schema_version` stays `1.0` (ADR-004);
  M4–M11 not started. Published at the checkpoint recorded in §0.10.
- **R0.11 (2026-10-11, this revision):** **M4 delivered** — page setup, paper
  sizes & new-document defaults implemented, tested and published (see §0.11).
  Plan status markers updated: V1-PAGE-001 → PASS, V1-PAGE-003 → PASS,
  V1-PAGE-004 → PASS, V1-SEC-002 → PASS, V1-PAG-004 → PASS, the V1-PDF-002
  non-A4 leg → PASS (V1-PDF-002 → PASS), and the V1-DOC-002 configurability
  leg → PASS (V1-DOC-002 → PASS). One authoritative geometry module
  (`src/core/ir/pageGeometry.ts`) is shared by the schema, the layout CSS, the
  PDF exporter's size-run grouping and the UI; `pageSetup.format` gains the
  standard formats (A3/A5/Letter/Legal/Tabloid/Executive) and a `Custom`
  sentinel with a nullable `widthMm`/`heightMm` pair. ADR-004 additive policy
  holds — `schema_version` stays `1.0` (goldens-01..06 regenerate with only the
  new nullable fields; their HTML is byte-identical). R0.4 approval record
  retained verbatim in its substance; M5–M11 not started. Published at the
  checkpoint recorded in §0.11.
- **R0.12 (2026-10-11, this revision):** **M4 evidence hardening** (see §0.12) —
  the R0.11 delivery record and the §3 V1-PAG-004 row described the new PDF
  MediaBox e2e test as covering "all seven standard formats in both
  orientations" on `golden-07-page-setup`, but the committed fixture held only
  **11 sections**: A4, A3 and Letter were proved in both orientations while A5,
  Legal, Tabloid and Executive were each proved in only one. R0.12 corrects the
  description and closes the gap by expanding `golden-07-page-setup` to **15
  geometry cases** (all seven standard formats × portrait + landscape, plus
  Custom 200×150) and strengthening `tests/e2e/pdf-parity.spec.ts` to assert the
  **real** MediaBox of every case. No criterion definition changed or weakened;
  V1-PAGE-001..004, V1-SEC-002, V1-PAG-004, V1-PDF-002 and V1-DOC-002 keep their
  R0.11 classifications (evidence strengthened). `schema_version` stays `1.0`
  (ADR-004); M5–M11 not started. Published at the checkpoint recorded in §0.12.
- **R0.13 (2026-10-12, this revision):** **M5 delivered** — metadata, laboratory
  profile and dynamic fields implemented, tested and published (see §0.13). Plan
  status markers updated: V1-META-001/002/003 → PASS, V1-FIELD-001..004 → PASS,
  V1-HF-003 → PASS. One typed, allow-listed field registry
  (`src/core/fields/keys.ts`) is the single source of field names for the editor
  picker, body resolver, header/footer renderer and pre-export validator; the
  IR gains a first-class inline **field node** (stores the key, never a copied
  value) and a document-scoped `laboratoryProfile` (name/address/logo). New
  metadata properties are additive with empty defaults; `metadata.status` is a
  **data field**, not a lifecycle (approved D6 — V1-LIFE-001 stays V1.2). Body
  and header/footer fields render through the shared resolve→layout pipeline;
  page fields materialise after pagination; unresolved used fields are reported
  and block final PDF export in both the app and `pnpm pdf` (draft save is
  unaffected). ADR-004 additive policy holds — `schema_version` stays `1.0`
  (goldens-01..07 regenerate with only the new defaulted fields; their HTML is
  byte-identical). R0.4 approval record retained verbatim in its substance;
  M6–M11 not started. Published at the checkpoint recorded in §0.13.
- **R0.14 (2026-10-12, this revision):** **M6 delivered** — numbering &
  cross-references implemented, tested and published (see §0.14). Plan status
  markers updated: V1-REF-002 → PASS, V1-REF-003 → PASS, V1-EQ-001 → PASS
  (the equation-numbering / cross-reference leg; insertion via the existing
  dialog). The IR gains a first-class inline **reference node**
  (`{ ref, refKind }` — a target's stable id + kind, never a copied label); a
  shared resolver (`src/core/references`) derives the visible label from the
  authoritative numbering engine, and the numbering engine gains derived
  **equation** numbers (`"Equation N"`, every equation block in document
  order). The editor picker lists each numbered target with its current derived
  label and inserts a structural chip (kind, not a number); a broken target is
  surfaced (visible marker + issue panel) and blocks final PDF export in both
  the app and `pnpm pdf` (draft save unaffected). Preview and PDF consume the
  same resolver, so a renumber updates every dependent reference in both.
  ADR-004 additive policy holds — `schema_version` stays `1.0`
  (goldens-01..02 and 04..08 stay byte-identical; golden-03 changes only because
  its equations now carry derived numbers; new golden-09 added). R0.4 approval
  record retained verbatim in its substance; M7–M11 not started. Published at
  the checkpoint recorded in §0.14.

### 0.5 M1 delivery record (R0.5)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; M1
  work sits on top of `fc9b00b` (R0.4 approval).
- **Scope delivered:** document-level `styles` library (V1-STYLE-001),
  per-block style references with `null` → derived built-in defaults
  (V1-STYLE-002), definition edits re-rendering every assignee through the
  shared resolve→layout pipeline (V1-STYLE-003), custom styles persisting
  edit → save → reopen (V1-STYLE-004), style-based text types (V1-TXT-001),
  and the base-style default for new documents (V1-DOC-002 base-style leg).
  Architecture: ADR-005; schema additive under ADR-004 — `schema_version`
  stays `1.0`.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (unit + golden); `pnpm test:e2e` PASS (Playwright, incl. new
  `tests/e2e/styles.spec.ts`); `pnpm build` PASS. Golden suite extended with
  `golden-04-style-system` (heading hierarchy H1–H4 + style-based text types
  + persisted custom style).
- **Changed files:** `src/core/ir/styles.ts` (new), `schema.ts`,
  `factory.ts`, `ids.ts`, `resolve/index.ts`, `layout/html.ts`, `layout/css.ts`,
  `layout/index.ts`, `editor/adapter.ts`, `editor/extensions.ts`,
  `editor/EditorPanel.tsx`, `store.ts`, `components/Sidebar.tsx`,
  `styles.css`, `tests/unit/styles.test.ts` (new), `tests/unit/adapter.test.ts`,
  `tests/golden/generator.ts` + regenerated goldens + `golden-04-*`,
  `tests/e2e/styles.spec.ts` (new), `docs/architecture/ADR-005-style-system.md`
  (new), `docs/limitations.md`.
- **Out of scope (unchanged):** M2–M11 not started; no new dependencies;
  no schema-version bump; no lifecycle/metadata-status work.

### 0.6 M1 hardening record (R0.6)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; the
  hardening sits on top of the M1 delivery (§0.5).
- **Scope:** (1) style fallback lookups use own-property checks
  (`Object.prototype.hasOwnProperty`) in `resolveStyleDefinition`,
  `resolveStyles` and the store, so a block reference that collides with a
  JavaScript object prototype member (`constructor`, `toString`,
  `hasOwnProperty`, …) is treated as an unknown id: the same deterministic
  safe fallback applies, no inherited member leaks in as a style definition,
  and the render pipeline never throws. The canonical style-id grammar
  `^[a-z][a-z0-9-]{0,31}$` is unchanged. (2) `tests/e2e/pdf-parity.spec.ts`
  writes its regenerated parity PDF to `artifacts/e2e-sop.pdf` (ignored by
  `artifacts/*`) instead of the tracked spike path; the tracked
  `artifacts/spike/e2e-sop.pdf` was restored to its pre-M1 bytes and is no
  longer rewritten by E2E runs — committed spike evidence only.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (unit + golden); `pnpm test:e2e` PASS (full Playwright suite); `pnpm
  build` PASS.
- **Changed files:** `src/core/resolve/index.ts`, `src/store.ts`,
  `tests/unit/styles.test.ts` (prototype-name regression tests),
  `tests/e2e/pdf-parity.spec.ts`, `artifacts/spike/e2e-sop.pdf` (restored),
  `docs/architecture/ADR-005-style-system.md`, `docs/limitations.md`, this
  plan (R0.6).
- **M1 acceptance:** unchanged — V1-STYLE-001..004, V1-TXT-001 and the
  V1-DOC-002 base-style leg keep their R0.5 classifications; no criterion
  re-opened. M2 not started.

### 0.7 M2 delivery record (R0.7)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; M2
  sits on top of `c26f567` (M1 hardening).
- **Scope delivered:** structured **character marks** (V1-FMT-001) — font
  family (`serif | sans | mono`, resolved to a theme font stack), font size
  (bounded pt, 6–72), bold, italic, underline, strikethrough, superscript,
  subscript, text colour and highlight (validated hex only); **paragraph
  overrides** (V1-FMT-002) — alignment, line spacing, space before/after and
  left indent, stored as **additive nullable overrides** of the assigned
  style (never replacing it; `null` = inherit); and a documented **partial**
  V1-FMT-003 subset — uppercase/lowercase text case (small caps, character/
  letter spacing, paragraph borders/shading, hanging indent and tab stops are
  intentionally unsupported and listed in `docs/limitations.md` §M2). The
  editor toolbar exposes labelled controls with no `window.prompt`/`alert`
  (AGENTS.md §31/§32). Architecture: ADR-004 additive policy; no new
  dependencies. A latent M1 colour-validator defect was fixed and covered by
  regression tests.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (15 files, 182 tests — incl. new `tests/unit/format.test.ts`, 30
  tests); `pnpm test:e2e` PASS (28 tests, incl. new
  `tests/e2e/format.spec.ts`, 6 tests covering marks, sup/sub exclusivity,
  font/size/colour/highlight, text case, paragraph overrides, and a
  save→reopen round trip); `pnpm build` PASS. Golden suite extended with
  `golden-05-formatting` (all marks + overrides) and the existing
  goldens-01..04 regenerated only to carry the new `format` field and the
  new M2 preview CSS (semantic diff verified: no content/rendering change to
  the pre-M2 documents).
- **Changed files:** `src/core/ir/sanitize.ts`, `schema.ts`, `factory.ts`,
  `src/core/theme/index.ts`, `src/core/layout/html.ts`, `css.ts`, `index.ts`,
  `src/editor/extensions.ts`, `adapter.ts`, `EditorPanel.tsx`, `src/styles.css`,
  `tests/unit/format.test.ts` (new), `tests/unit/adapter.test.ts`,
  `tests/golden/generator.ts` + regenerated goldens-01..04 +
  `golden-05-formatting.{json,expected.html}` (new),
  `tests/e2e/format.spec.ts` (new), `docs/limitations.md`, this plan (R0.7).
- **Acceptance classification:** **V1-FMT-001 PASS**, **V1-FMT-002 PASS**,
  **V1-FMT-003 PARTIAL** (documented subset; the criterion as a whole is
  **not** declared PASS). Evidence: unit (`format.test.ts`), golden-05,
  e2e (`format.spec.ts`, incl. round trip).
- **Out of scope (unchanged):** M3–M11 not started; no new dependencies; no
  schema-version bump; `tests/unit/input-security.test.ts` untouched.

### 0.8 M2 status reconciliation record (R0.8, documentation only)

- **Base commit:** `85e2db3` (the R0.7 M2 delivery checkpoint).
- **Reason:** the R0.7 revision updated the narrative status markers (§0.7,
  §8.2, header) and `docs/limitations.md`, but the three §3 coverage-matrix
  rows for V1-FMT-001/002/003 still showed their pre-M2 `PARTIAL` text
  ("→ **M2**"), contradicting the delivered state. R0.8 corrects that
  inconsistency only.
- **Status corrections (matrix rows):** `V1-FMT-001` → **PASS** (structured
  character marks), `V1-FMT-002` → **PASS** (validated per-block paragraph
  overrides), `V1-FMT-003` → **PARTIAL** (uppercase/lowercase delivered;
  small caps, character/letter spacing, paragraph borders/shading, hanging
  indent and tab stops remain documented limitations). The R0.7 transitions
  note was added to the matrix legend.
- **Preserved verbatim:** the R0.4 approval record, the R0.5/R0.6/R0.7
  records, the R0.5 transitions note, all Phase 0 PASS classifications and
  evidence, all M2 test results, and every acceptance-criterion definition.
- **Not done:** no application/schema/test/fixture/golden change; no
  `schema_version` change; no criterion weakened; M2 tests were **not**
  re-run (R0.7 results stand); M3–M11 not started.
- **Verification:** `git diff --check` clean; only this plan file changed.

### 0.9 M3 delivery record (R0.9)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; M3
  sits on top of `409c5051809f5a01ca72f9dd0c00c058e49af07f` (R0.8).
- **Scope delivered:** structured, derived **lists & multilevel numbering**
  (V1-LIST-001..004).
  - **IR:** a new canonical recursive `list` block kind added additively to
    the `blockSchema` union per §7 — `listType` ∈
    bullet|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman; bullet
    `marker` ∈ disc|circle|square|dash|arrow|check; configurable `start`;
    recursive `items` each with a stable id, `content` paragraphs and nested
    `children` (`listItem`). Stable ids only; **ordinals are never stored**.
  - **Engine:** the numbering engine emits a derived per-item label map
    (`Numbering.lists`), producing hierarchical paths ("3.1", "4.1.1") and the
    five styles; the resolve + layout pipeline renders semantic `<ul>`/`<ol>`
    (bullets) and explicit derived inline labels (numbered; native marker
    suppressed). No arbitrary CSS/HTML is taken from document data.
  - **Editor:** labelled controls — bullet/ordered toggles, six-marker picker,
    five-style picker, a `start` input, and indent/outdent (nest/unnest) — all
    routed through the explicit adapter (never Tiptap-as-truth); no
    `window.prompt`/`alert`; conversion bullet↔ordered preserves text and
    marks.
  - **Compatibility:** legacy flat `bulletList` loads unchanged and is
    normalised to the canonical `list` on the next edit/save (open → Save also
    converges, even with no text edit). ADR-004 additive policy holds —
    `schema_version` stays `1.0`.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (16 files, **209 tests** — incl. new `tests/unit/list.test.ts`, 21
  tests: schema/IR, normalisation, five numbering styles, `start`, multilevel
  hierarchy, renumbering on insert/delete/reorder/nest/unnest, determinism,
  non-mutation, injection safety and JSON round-trip); `pnpm test:e2e` PASS
  (**33 tests**, incl. new `tests/e2e/lists.spec.ts`, 5 tests: bullet markers,
  numbered-label derivation + `start` + renumber-on-insert, indent/outdent
  nesting, bullet↔ordered conversion, and a save→reopen round trip); `pnpm
  build` PASS. Golden suite extended with `golden-06-lists`; goldens-01..05
  were regenerated **only** to carry the new M3 list CSS block (their
  pre-existing legacy `bulletList` markup is byte-identical — the change is the
  shared stylesheet only).
- **Changed files:** `src/core/ir/schema.ts`, `src/core/ir/factory.ts`,
  `src/core/ir/normalize.ts` (new), `src/core/numbering/index.ts`,
  `src/core/resolve/index.ts`, `src/core/layout/html.ts`,
  `src/core/layout/css.ts`, `src/editor/adapter.ts`, `src/editor/extensions.ts`,
  `src/editor/EditorPanel.tsx`, `src/store.ts` (load-path normalisation +
  canonical starter document), `tests/unit/list.test.ts` (new),
  `tests/unit/adapter.test.ts`, `tests/golden/generator.ts` + regenerated
  goldens-01..05 + `golden-06-lists.{json,expected.html}` (new),
  `tests/e2e/lists.spec.ts` (new), `docs/limitations.md`, this plan (R0.9).
- **Acceptance classification:** **V1-LIST-001 PASS** (six bullet markers),
  **V1-LIST-002 PASS** (five numbering styles + `start`), **V1-LIST-003 PASS**
  (derived numbering renumbers automatically on insert/remove/reorder/nest/
  unnest), **V1-LIST-004 PASS as a documented structured subset** (recursive
  nesting + hierarchical derived numbering; the residuals — one uniform
  type/marker per tree, nested levels restart at 1, native ordered markers
  suppressed in favour of derived inline labels — are tracked in
  `docs/limitations.md` §M3, **not** silently dropped). Evidence: unit
  (`list.test.ts`, `adapter.test.ts`), golden-06, e2e (`lists.spec.ts`, incl.
  round trip).
- **Out of scope (unchanged):** M4–M11 not started; no new dependencies; no
  schema-version bump; `tests/unit/input-security.test.ts` untouched (and still
  green); no unrelated schema/migration changes.

### 0.10 M3 post-delivery hardening record (R0.10)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; the
  hardening sits on top of `88578896ccd47f862d7fff20bf6d21fdbd97774b` (R0.9, M3
  delivery).
- **Reason for the revision:** an M3 review identified two narrow issues, both
  closed here without new scope. No approval was re-opened and no criterion
  definition was altered.
  1. **Unbounded ordered-list `start`.** The editor limited the configurable
     start to 1–9999, but the IR schema and the other trust boundaries did not.
     A hand-edited/imported `.labdoc.json` could carry a huge `start` (e.g.
     `1e100`); the schema accepted it and the derived Roman label is produced by
     a subtraction loop whose iteration count follows the value's magnitude, so
     the malformed value could hang rendering. The list-start bound is now
     enforced consistently (see below).
  2. **Weak renumbering tests.** The automatic-renumbering unit test rebuilt
     every list with position-derived ids (`li_0000000N`), so "delete" and
     "reorder" were not proved with **stable item identities** — the ids changed
     with position, which is exactly the property the test was meant to check.
- **Bound enforced at each layer (single source: `src/core/ir/sanitize.ts`):**
  `LIST_START_MIN = 1`, `LIST_START_MAX = 9999`.
  - **Schema** (`src/core/ir/schema.ts`): `list.start` is
    `z.number().int().min(LIST_START_MIN).max(LIST_START_MAX).default(1)` — a
    value outside 1–9999 fails `documentSchema.parse` (so load rejects it).
  - **Adapter** (`src/editor/adapter.ts`): Tiptap → IR `start` is passed through
    the shared `safeListStart`, so a stale/foreign/out-of-range editor attribute
    is safely normalised to 1 rather than entering the IR raw.
  - **Render/numbering boundary** (`src/core/layout/html.ts`,
    `src/core/numbering/index.ts`): both call `safeListStart`, so a malformed
    in-memory value that bypasses schema validation cannot reach the formatters.
  - **UI** (`src/editor/EditorPanel.tsx`): the `start` input's `max` and hint
    read the same `LIST_START_MAX`; the input's own range message remains
    actionable. The UI `max` is **not** treated as input validation.
  - **`toRoman` defense in depth** (`src/core/numbering/index.ts`): the formatter
    guards non-finite input and caps its (floored) argument at `LIST_START_MAX`,
    so even a value that somehow bypassed every other boundary yields a short,
    deterministic label instead of an unbounded loop. `toAlpha` likewise guards
    non-finite input (its loop is already logarithmic and bounded).
  - All five numbering styles remain correct across the accepted range,
    including a non-default Roman start.
- **Stronger renumbering evidence:** `tests/unit/list.test.ts` now builds one
  canonical list with fixed item ids (`li_aaaaaaaa`…) and reuses those exact
  objects through **delete-first**, **reorder**, **insert-between**, **nest** and
  **unnest** edits, asserting the derived labels follow position while the ids
  do not change, and asserting the canonical IR never gains a stored ordinal.
  `tests/e2e/lists.spec.ts` adds a real-editor **deletion** case (clear the
  middle item's text, then Backspace the empty item away) that proves the
  survivors renumber. Sibling **reorder has no dedicated toolbar control** (the
  M3 controls deliberately offer only nest/unnest), so reordering is covered by
  the stable-id unit test and this limitation is recorded honestly in the e2e
  file rather than faked by rebuilding the document.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (16 files, **222 tests** — 13 new hardening tests: start bounds at the
  schema, a shared clamp/validate helper, out-of-range values rejected, a
  malformed value that bypasses validation still yielding bounded labels, the
  Roman formatter capped, all five styles across the range, and the render
  boundary re-validating `start`; plus adapter normalisation and the stable-id
  renumbering suite); `pnpm test:e2e` PASS (**34 tests**, incl. the new deletion
  case); `pnpm build` PASS; `git diff --check` clean. Goldens are unchanged (no
  rendering change for valid documents).
- **Changed files:** `src/core/ir/sanitize.ts` (new list-start bounds +
  `isListStart`/`safeListStart`), `src/core/ir/schema.ts`,
  `src/core/numbering/index.ts`, `src/core/layout/html.ts`,
  `src/editor/adapter.ts`, `src/editor/EditorPanel.tsx`,
  `tests/unit/list.test.ts`, `tests/unit/adapter.test.ts`,
  `tests/e2e/lists.spec.ts`, `docs/limitations.md`, this plan (R0.10).
- **Acceptance classification (unchanged, evidence strengthened):**
  V1-LIST-001/002/003 remain **PASS**; V1-LIST-004 remains **PASS as a
  documented structured subset**. No criterion definition was changed.
- **Out of scope (unchanged):** M4–M11 not started; no new dependencies; no
  schema-version bump (`schema_version` stays `1.0`, ADR-004);
  `tests/unit/input-security.test.ts` untouched (and still green); no unrelated
  numbering for headings/tables/figures.

### 0.11 M4 delivery record (R0.11)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; M4
  sits on top of `a18a91cdded03a85995ff0bd5455166d836cfca4` (R0.10).
- **Scope delivered:** page setup, paper sizes and configurable new-document
  defaults (§8.2 M4; V1-PAGE-001..004, V1-SEC-002, V1-PAG-004, the V1-PDF-002
  non-A4 leg and the V1-DOC-002 configurability leg).
  - **Geometry (single source of truth):** `src/core/ir/pageGeometry.ts` holds
    the paper table (`PAPER_SIZES_MM`: A4/A3/A5/Letter/Legal/Tabloid/Executive
    in portrait mm), the `Custom` sentinel, the bounds (`PAGE_SIZE_MM_MIN`/
    `PAGE_SIZE_MM_MAX` = 10–2000 mm, `MIN_USABLE_MM` = 1 mm) and the resolver
    functions (`basePageSizeMm`, `effectivePageSizeMm`,
    `effectivePageSizeCssMm`, `customSizeProblem`, `pageAreaProblem`,
    `pageFormatPatch`, `formatMm`). **Orientation is applied exactly once**,
    inside `effectivePageSizeMm`, and only to standard formats; a **Custom**
    pair is the literal final size and is never swapped (impossible to
    double-swap), and the A4 fallback for invalid/unknown input also honours
    orientation. Every consumer — schema, layout CSS, PDF exporter's size-run
    grouping, UI — reads this module; no paper dimension is duplicated.
  - **IR (additive, ADR-004):** `pageSetup.format` becomes the eight-value
    `PageFormat` enum (seven standards + `Custom`); `widthMm`/`heightMm` are
    new **nullable** fields (`null` default). `pageSetupSchema.superRefine`
    rejects a Custom format without a valid pair and a setup whose margins
    leave a degenerate usable area. `createSection` defaults the new fields to
    `null`. `schema_version` stays `1.0`.
  - **Layout:** `pageSizeMm` (`src/core/layout/css.ts`) delegates to
    `effectivePageSizeCssMm`, so `@page`/named-page geometry and the paged.js
    sheet vars use the correct effective size for every format/orientation;
    section transitions apply the next section's geometry only.
  - **PDF export:** the exporter groups contiguous same-size runs from the
    effective geometry (no exporter code change was needed — the key was
    already size-driven). A new e2e test asserted the MediaBox on one
    **11-section** mixed document (`golden-07`) — A4/A3/Letter in **both**
    orientations, A5/Legal/Tabloid/Executive in **one** orientation each, plus
    Custom — converting mm → pt via `72/25.4` with a ±1 pt tolerance.
    ▸**Corrected in R0.12** (§0.12): the fixture and test were later expanded to
    all **14 standard format × orientation combinations + Custom (15 cases)**.
    (The R0.11 text first claimed "all seven standard formats in both
    orientations", which the 11-section fixture did not yet prove.)
  - **New-document defaults (D11):** `src/app/preferences.ts` — a versioned,
    validated `localStorage` snapshot (page setup, theme, metadata skeleton)
    that seeds a newly created document only; `normalizePreferences`/
    `loadPreferences` fall back to built-in defaults on missing/corrupt data
    without throwing; `safeThemeId` maps an unknown theme to the default. The
    store exposes `setDefaultPageSetup`/`setDefaultTheme`/`setDefaultMetadata`/
    `resetPreferences` and `newDocument()` applies the snapshot; `setPageSetup`
    validates the merged setup before mutating.
  - **UI:** a shared `PageSetupEditor` (format select; orientation select —
    disabled for Custom with an accessible note; four margin inputs; Custom
    width/height inputs shown only when Custom; an effective-size readout and
    validated `NumberField`s that reject out-of-range input inline without
    reaching the model) is used for each section in the sidebar; a distinct
    `NewDocumentDefaults` panel covers the configurable defaults. The in-app
    export warning now fires for any two sections with a different effective
    size.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (17 files, **250 tests** — incl. new `tests/unit/page-setup.test.ts`,
  26 tests: geometry for all formats × orientation, custom no-swap, the A4
  fallback, bounds, `pageFormatPatch`, schema rejection, and the preference
  load/save/reset/corrupt-input fallbacks); `pnpm test:e2e` PASS (**41 tests**,
  incl. the new M4 PDF MediaBox test, the section size/orientation render test
  in `page-setup.spec.ts`, and the new `tests/e2e/document-defaults.spec.ts`,
  5 tests: defaults apply on New without touching the open document, persist
  across reload, reset, open preserves the file's settings, and corrupt
  storage falls back without blocking startup); `pnpm build` PASS;
  `git diff --check` clean. Golden suite extended with `golden-07-page-setup`
  (at R0.11 an 11-section subset; expanded to **all formats × orientation +
  Custom = 15 cases** in ▸R0.12, §0.12); goldens-01..06 were regenerated with
  only the two new nullable fields (their expected HTML is byte-identical).
- **Changed files:** `src/core/ir/pageGeometry.ts` (new),
  `src/core/ir/schema.ts`, `src/core/ir/factory.ts`, `src/core/index.ts`,
  `src/core/layout/css.ts`, `src/app/preferences.ts` (new), `src/store.ts`,
  `src/components/Field.tsx` (new), `src/components/PageSetupEditor.tsx` (new),
  `src/components/NewDocumentDefaults.tsx` (new), `src/components/Sidebar.tsx`,
  `src/components/Preview.tsx`, `src/App.tsx`, `src/styles.css`,
  `tests/unit/page-setup.test.ts` (new),
  `tests/golden/generator.ts` + regenerated goldens-01..06 +
  `golden-07-page-setup.{json,expected.html}` (new),
  `tests/e2e/pdf-parity.spec.ts`, `tests/e2e/page-setup.spec.ts`,
  `tests/e2e/app.spec.ts`, `tests/e2e/document-defaults.spec.ts` (new),
  `docs/limitations.md`, this plan (R0.11).
- **Acceptance classification:** **V1-PAGE-001 PASS** (seven standard formats +
  Custom), **V1-PAGE-002 PASS** (retained), **V1-PAGE-003 PASS** (margins UI),
  **V1-PAGE-004 PASS** (document-level page settings UI), **V1-SEC-002 PASS**
  (section size/margins UI added; orientation/header/footer already editable),
  **V1-PAG-004 PASS** (mixed page sizes now paginate), **V1-PDF-002 PASS**
  (non-A4/Custom MediaBoxes verified), **V1-DOC-002 PASS** (configurability leg
  delivered). Evidence: `tests/unit/page-setup.test.ts`, golden-07,
  `tests/e2e/pdf-parity.spec.ts`, `tests/e2e/page-setup.spec.ts`,
  `tests/e2e/document-defaults.spec.ts`.
- **Out of scope (unchanged):** M5–M11 not started; Markdown import not
  started; no new dependencies; no schema-version bump (`schema_version` stays
  `1.0`, ADR-004); `tests/unit/input-security.test.ts` untouched (and still
  green); no tracked spike PDF/artifact changes.

### 0.12 M4 evidence-hardening record (R0.12)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; the
  hardening sits on top of `cd1b0d5034943bde77a5d22c8a2b9ff7822ba964` (R0.11,
  M4 delivery).
- **Reason for the revision:** the R0.11 record (and the §3 V1-PAG-004 row)
  described the new PDF MediaBox e2e test as covering "all seven standard
  formats in both orientations plus Custom" on `golden-07-page-setup`. The
  committed test and fixture did **not** back that claim: the fixture had **11
  sections**, so A4, A3 and Letter were proved in both orientations while A5,
  Legal, Tabloid and Executive were each proved in only **one** orientation.
  The documented claim was therefore broader than the end-to-end evidence. This
  revision closes that gap; it adds no feature scope, no criterion and no
  dependency, and it does not begin M5.
- **Fixture expansion (`tests/golden/golden-07-page-setup.json`):** the fixture
  now holds **15 geometry cases** in a deterministic (format-by-format) section
  order — the **14 standard** format/orientation combinations **plus** one
  Custom case:

  | Format | Portrait (mm) | Landscape (mm) |
  |---|---|---|
  | A4 | 210 × 297 | 297 × 210 |
  | A3 | 297 × 420 | 420 × 297 |
  | A5 | 148 × 210 | 210 × 148 |
  | Letter | 215.9 × 279.4 | 279.4 × 215.9 |
  | Legal | 215.9 × 355.6 | 355.6 × 215.9 |
  | Tabloid | 279.4 × 431.8 | 431.8 × 279.4 |
  | Executive | 184.15 × 266.7 | 266.7 × 184.15 |
  | Custom | 200 × 150 (**literal, never swapped**) | — |

  Each section forces a page break, so the fixture paginates to exactly one
  page per case. The four added sections (A5 landscape, Legal landscape,
  Tabloid portrait, Executive landscape) were inserted **preserving the 11
  existing section/heading ids**, so identity does not churn (AGENTS.md §11);
  `createPageSetupDocument()` in `tests/golden/generator.ts` was updated to the
  same 15-case order, and the committed `.expected.html` was regenerated through
  the normal `pnpm golden:update` procedure. Goldens-01..06 are **byte-identical**
  (the JSON diff is purely additive and no other expected HTML changed).
- **Strengthened e2e (`tests/e2e/pdf-parity.spec.ts`):** the MediaBox test now
  drives the **real** export path (`exportPaginatedPdf`) over all 15 cases and
  asserts, against the emitted PDF:
  - exactly **15 pages**;
  - the ordered contiguous **size runs** equal the 15 expected
    `width × height` values (all 15 adjacent sizes are distinct, so the exporter
    emits 15 single-page runs, never interleaved);
  - each page's **actual MediaBox** matches its expected `mm × (72/25.4)` within
    the documented **±1 pt** tolerance;
  - the **Custom** page stays exactly 200 × 150 mm (its authored pair is not
    swapped by its orientation setting);
  - the merged PDF retains **15 distinct** effective sizes.
  The pre-existing mixed-orientation and re-export-stability tests are kept and
  no earlier assertion was weakened.
- **Verification executed (final tree):** `pnpm typecheck` PASS; `pnpm test`
  PASS (17 files, **250 tests** — the unit count is unchanged because
  `tests/unit/page-setup.test.ts` already pinned every format × orientation in
  the geometry resolver); `pnpm test:e2e` PASS (**41 tests**, the strengthened
  MediaBox test now asserting all 15 cases); `pnpm build` PASS;
  `git diff --check` clean. No implementation defect was exposed by the expanded
  fixture — the M4 geometry/export path handled all 15 cases correctly — so **no
  production code changed**.
- **Evidence model (unit vs end-to-end):** `tests/unit/page-setup.test.ts` pins
  the geometry **resolver** (`effectivePageSizeMm`/`effectivePageSizeCssMm`,
  orientation applied once, Custom never swapped) for every standard format ×
  orientation; the strengthened `tests/e2e/pdf-parity.spec.ts` now proves the
  **same 14 standard combinations plus Custom** in the **actual exported PDF**
  — the geometry the resolver computes is what lands in the file.
- **Changed files:** `tests/golden/generator.ts`,
  `tests/golden/golden-07-page-setup.json`,
  `tests/golden/golden-07-page-setup.expected.html`,
  `tests/e2e/pdf-parity.spec.ts`, `docs/planning/PHASE-1-plan.md` (this plan).
  No `src/**` change.
- **Acceptance classification (unchanged, evidence strengthened):**
  V1-PAGE-001..004, V1-SEC-002, V1-PAG-004, V1-PDF-002 and V1-DOC-002 keep
  their R0.11 classifications. No criterion definition was changed or weakened.
- **Out of scope (unchanged):** M5–M11 not started; Markdown import not started;
  no new dependencies; no schema-version bump (`schema_version` stays `1.0`,
  ADR-004); `tests/unit/input-security.test.ts` untouched (and still green); no
  tracked spike PDF/artifact changes.

### 0.13 M5 delivery record (R0.13)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; the M5
  work sits on top of `30867718756a83f3bfe60c24409b2d0a06493374` (R0.12, M4
  evidence hardening) — the base commit for this delivery.
- **Scope delivered:** V1-META-001/002/003 (structured metadata: the schema gains
  document type, department, review date, status, prepared/reviewed/approved by
  and classification as additive empty-defaulted properties; the metadata panel
  edits every field; metadata stays the single source of truth for every linked
  occurrence); V1-META-002's laboratory profile leg (document-scoped
  `laboratoryProfile` with name/address/logo, the logo via the existing embedded
  image allow-list); V1-FIELD-001 (document fields — a canonical inline field
  node + labelled picker), V1-FIELD-002 (laboratory fields — text + constrained
  logo image), V1-FIELD-003 (page fields in the body, resolved post-pagination),
  V1-FIELD-004 (one shared unresolved-field collector driving the UI panel and
  both export gates); V1-HF-003 (dynamic metadata in header **and** footer via
  the shared margin-field registry).
- **Architecture (how the pieces fit):**
  - **One field registry** (`src/core/fields/keys.ts`): the complete,
    typed, allow-listed set of dotted field keys plus their definitions, the
    margin-token ↔ key bridge (`MARGIN_FIELD_TO_KEY`) and the legacy
    `[page]`/`[count]` parse aliases. **Every** consumer — the editor picker,
    the body resolver, the header/footer renderer and the pre-export validator —
    reads this one module, so a field name cannot drift between editor,
    resolver, HF renderer and export validation.
  - **One resolver / one collector** (`src/core/fields/resolve.ts`,
    `unresolved.ts`): `resolveField`/`resolveFieldText`/`resolveFieldImage` read
    only the canonical `metadata`/`laboratoryProfile` (never editor state);
    page fields are **deferred** (never reported unresolved pre-pagination);
    `collectUnresolvedFields` walks the body **and** header/footer via the
    shared `src/core/ir/walk.ts` traversal, one entry per occurrence with its
    location.
  - **Canonical IR** (`src/core/ir/schema.ts`): `inlineSchema` becomes
    `z.union([textRunSchema, fieldNodeSchema])`, both `.strict()` — a field node
    stores only its `field` key (the value is never copied into the IR);
    `metadataSchema` and `documentSchema` (`laboratoryProfile`) are extended
    additively with empty/null defaults; `marginFieldSchema` gains
    `reviewDate`/`status`/`laboratoryName` (and parses the `[page]`/`[count]`
    aliases to the canonical `pageNumber`/`pageCount`).
  - **Shared render** (`src/core/layout/html.ts`, `css.ts`, `index.ts`): the body
    renders a field as `.doc-field` (resolved value / visible unresolved chip /
    constrained `img.doc-field-logo`); the header/footer resolve their tokens
    through the same resolver; page fields are emitted as placeholder elements
    and materialised after pagination by the extended Paged.js script. Field CSS
    and the page-field materialiser are **only** emitted when the document
    actually contains fields, so legacy goldens stay byte-identical.
  - **Editor** (`src/editor/extensions.ts`, `adapter.ts`, `EditorPanel.tsx`): a
    `FieldRef` inline atom chip round-trips to/from the field node (preserving
    surrounding text and marks); a labelled `<select>` field picker inserts a
    field reference at the caret. User-typed `{{…}}` text is deliberately **not**
    converted (only the explicit picker creates a semantic field).
  - **Export gate** (`src/App.tsx`, `scripts/export-pdf.mjs`): the in-app
    "Export PDF" button and the `pnpm pdf` CLI both call the **same** shared
    collector and refuse to produce a final PDF while unresolved used fields
    remain; the `.labdoc.json` draft save is unaffected.
- **Tests added / extended:**
  - `tests/unit/fields.test.ts` (**new, 35 tests**): the registry + margin
    bridge; the resolver (including deferred page fields, empty→unresolved, and
    the logo image); the unresolved walker (body + header/footer, repeated
    occurrences, page deferral); inline rendering with HTML escaping; layout
    gating; metadata-change-updates-every-occurrence; inline-schema strictness
    (`{text, field}` is rejected); persistence/defaults/round-trip and invalid
    logo rejection; per-document isolation.
  - `tests/unit/margin-text.test.ts` (**+2**): the new M5 tokens; `[page]`/
    `[count]` normalise on parse to the canonical `pageNumber`/`pageCount` and
    serialise canonically.
  - `tests/unit/adapter.test.ts` (**+3**): the field-node round-trip, the atom
    node mapping, and the unknown-key skip.
  - `tests/e2e/fields.spec.ts` (**new, 5 tests**): the picker inserts a chip and
    the preview resolves it; an empty **used** field is reported and blocks
    final PDF export while a draft still saves; laboratory fields resolve in the
    body **and** header/footer and a rename updates every occurrence; the logo
    renders as a constrained safe image and bad files are refused; field
    references persist as keys (never a copied value) and reopen.
  - **Fixture maintenance:** the persistent sidebar logo `<input type="file">`
    made the bare `input[type="file"]` open-selector ambiguous, so
    `openJson()`'s transient input now carries
    `data-testid="open-file-input"` and the eight pre-existing e2e specs that
    open a file target it (no assertion changed).
- **Golden / fixture changes:** `tests/golden/generator.ts` gains
  `createFieldDocument()`; new `tests/golden/golden-08-fields.json` +
  `.expected.html`. Goldens-01..07 JSON are **additively** regenerated (new
  defaulted metadata properties + `laboratoryProfile`) and their `.expected.html`
  is **byte-identical**. `schema_version` stays `1.0` (ADR-004 additive
  pre-release policy — older documents load unchanged with safe defaults; a
  document saved by this build that uses the new field node cannot be opened by
  a pre-M5 build, the documented forward-compat asymmetry).
- **Verification executed (final tree):** `pnpm typecheck` **PASS**; `pnpm test`
  **PASS** (18 files, 292 tests — was 17/252); `pnpm test:e2e` **PASS** (46 tests
  — was 41, the M4 15-case MediaBox test still green); `pnpm build` **PASS**;
  `git diff --check` **clean**. The CLI gate was additionally exercised by hand
  on the final tree: `node scripts/export-pdf.mjs <cleared-status doc>` refused
  with `PDF export blocked — 2 unresolved field(s)` (body + header occurrences,
  exit 1); the fully-resolved `golden-08-fields` exported to a valid single-page
  A4 PDF (exit 0).
- **Changed files:** new `src/core/fields/{keys,resolve,unresolved,index}.ts` and
  `src/core/ir/walk.ts`; modified `src/core/ir/schema.ts`,
  `src/core/ir/factory.ts`, `src/core/index.ts`,
  `src/core/layout/{html,css,index}.ts`, `src/editor/{extensions,adapter}.ts`,
  `src/editor/EditorPanel.tsx`, `src/store.ts`, `src/App.tsx`,
  `src/app/files.ts`, `src/app/marginText.ts`, `src/components/Sidebar.tsx`, new
  `src/components/{LaboratoryProfilePanel,UnresolvedFieldsPanel}.tsx`,
  `src/styles.css`, `scripts/export-pdf.mjs`; new `tests/unit/fields.test.ts` and
  modified `tests/unit/margin-text.test.ts`, `tests/unit/adapter.test.ts`,
  `tests/unit/fixtures.ts`, `tests/unit/format.test.ts`, `tests/unit/ir.test.ts`,
  `tests/unit/sanitize.test.ts`, `tests/unit/styles.test.ts` and
  `tests/unit/theme.test.ts`; `tests/golden/generator.ts`, the additively
  regenerated `tests/golden/golden-01..07.json`, new
  `tests/golden/golden-08-fields.{json,expected.html}`; new
  `tests/e2e/fields.spec.ts` and the eight e2e specs' open-input hook;
  `docs/limitations.md`; `docs/planning/PHASE-1-plan.md` (this plan).
- **Acceptance classification (evidence):** V1-META-001/002/003, V1-FIELD-001..004
  and V1-HF-003 → **PASS** (§3 matrix). No criterion definition was changed or
  weakened. Residual limits (fixed field allow-list, the logo-in-margin-box HF
  limitation, `status` as data not lifecycle, key-not-value storage) are
  documented in `docs/limitations.md` §M5.
- **Out of scope (unchanged):** M6–M11 not started (no cross-references/equation
  numbering, themes, advanced tables, image editing, autosave, a11y audit);
  Markdown import not started; no lifecycle/approval/revision-history/signature
  workflow; no backend/login/cloud; no new dependencies; no schema-version bump
  (`schema_version` stays `1.0`, ADR-004).

### 0.14 M6 delivery record (R0.14)

- **Checkpoint commit:** `HEAD` of `main` after this revision is pushed; the M6
  work sits on top of `cbcb708e42946b79c248e54eb3ead00a361774f2` (R0.13, M5
  delivery) — the base commit for this delivery.
- **Scope delivered:** V1-REF-002 (basic cross-reference — a semantic reference
  to a numbered object using the target's stable id + kind, with a picker that
  lists each target's current derived label), V1-REF-003 (reference updates —
  labels are derived from the authoritative numbering engine at resolve time, so
  inserting/deleting/reordering a target renumbers every reference), and the
  numbering/cross-reference leg of V1-EQ-001 (**equation numbering** — a derived
  `"Equation N"` label for every equation block, addressable by a reference).
  V1-REF-001 (stable reference targets) was already satisfied by the stable-ID
  model and is unchanged.
- **Architecture (how the pieces fit):**
  - **Canonical IR** (`src/core/ir/schema.ts`): a first-class inline
    `referenceNodeSchema` (`{ ref: NodeId, refKind: "heading" | "table" |
    "figure" | "equation" }`, `.strict()`) added to `inlineSchema` as
    `z.union([textRunSchema, fieldNodeSchema, referenceNodeSchema])`. The node
    stores only the TARGET's stable id + kind — **never** a copied label or
    manual number (AGENTS.md §11/§12). A `reference(...)` factory builds it.
  - **Numbering engine** (`src/core/numbering/index.ts`): `Numbering` gains an
    `equations` map; every equation block (display or inline) is numbered in
    document order. Numbering stays **derived** (never stored), so it survives
    save/load by construction and updates on every resolve.
  - **One reference resolver** (`src/core/references/index.ts`):
    `resolveReference` maps a reference to the target's CURRENT derived label
    (or a broken result that distinguishes a deleted target from a wrong-kind
    target); `collectReferenceTargets` supplies the picker with each numbered
    object in document order; `collectBrokenReferences`/`referenceMessages`
    report every missing/deleted target with its location. This module is shared
    by the layout renderer, the editor picker and the pre-export validator, so
    preview and PDF can never disagree.
  - **Combined issues** (`src/core/issues/index.ts`): one walker over the two
    "unresolved content" families (M5 fields + M6 references) drives the sidebar
    panel and **both** export gates, so the field and reference rules cannot
    drift apart.
  - **Shared render** (`src/core/layout/html.ts`, `css.ts`, `index.ts`): a body
    reference renders a `.doc-ref` span carrying the target id/kind and the
    DERIVED label; a broken reference renders a visible `⟦missing <kind>⟧`
    marker with an actionable `title`; an equation appends a
    `.doc-equation-number` label. Reference CSS and the equation-number grid are
    emitted **only** when the document actually contains references/display
    equations, so reference-free goldens stay byte-identical. `data-reference`
    (not `data-ref`) is used because Paged.js owns `data-ref` for split
    fragments.
  - **Editor** (`src/editor/extensions.ts`, `adapter.ts`, `EditorPanel.tsx`): a
    `ReferenceRef` inline atom chip round-trips to/from the reference node; the
    chip shows the target **kind** (never a derived number, so a stale number
    can never masquerade as truth); a labelled `<select>` picker lists each
    numbered target with its current label and inserts the reference at the
    caret. Invalid ids/kinds from foreign editor state are skipped, never
    smuggled into the IR.
  - **Export gate** (`src/App.tsx`, `scripts/export-pdf.mjs`): the in-app
    "Export PDF" button and the `pnpm pdf` CLI both call the shared combined
    issue walker and refuse a final PDF while a broken reference (or unresolved
    field) remains; the `.labdoc.json` draft save is unaffected.
- **Tests added / extended:**
  - `tests/unit/references.test.ts` (**new, 19 tests**): reference-node schema
    strictness/exclusivity; stable-id save/reload (never a label); resolution to
    the current derived label for all four families; renumber on insert;
    wrong-kind vs deleted detection; broken-reference reporting and messages;
    picker target collection with labels/details; derived equation numbering and
    its update on structure change; layout rendering (label span, broken marker,
    deterministic pipeline parity, CSS gating); combined field+reference issues.
  - `tests/unit/numbering.test.ts` (**+1**): every equation block is numbered
    sequentially in document order.
  - `tests/unit/adapter.test.ts` (**+3**): the reference round-trip (text/marks
    preserved), the `referenceRef` atom mapping, and the invalid-id/kind skip.
  - `tests/unit/margin-text.test.ts` (**+2**): the M6 preflight drift guard —
    `MARGIN_FIELDS` is derived from the single `MARGIN_FIELD_TO_KEY` map (and
    matches `marginFieldSchema`), and every registered margin token parses.
  - `tests/e2e/references.spec.ts` (**new, 6 tests**): the picker lists derived
    labels and inserts a canonical reference (editor chip shows the kind); a
    reference persists as a stable id (never a label) and reopens; a broken
    reference is surfaced and blocks final PDF export; **inserting a numbered
    object renumbers the dependent reference in the real printed PDF text**
    (pdf.js text extraction with a sentinel isolating the reference); a broken
    reference still exports a PDF containing the visible marker; the golden
    round-trips through the JSON envelope.
  - `tests/golden/golden.test.ts` (**+2**, from the new fixture): golden-09 is
    checked for byte-exact layout **and** lossless JSON round-trip. The counts
    sum to the +27 suite delta (19 + 1 + 3 + 2 + 2) on top of the M5 baseline
    (18 files / 292 tests).
- **Preflight hardening:** the remaining hand-maintained margin-field
  enumerations in `src/app/marginText.ts` and `src/core/layout/css.ts` now derive
  from the single `MARGIN_FIELDS` registry in `src/core/fields/keys.ts`
  (`css.isPageField` delegates to `isPageFieldKey(marginFieldKey(field))`), so a
  future field addition cannot drift between the parser and the HF renderer
  (guarded by the new drift test).
- **Golden / fixture changes:** `tests/golden/generator.ts` gains
  `createReferencesDocument()`; new `tests/golden/golden-09-references.json` +
  `.expected.html` (heading/table/figure/equation references + one deliberately
  broken reference). `golden-03-phase0-gate.expected.html` changes **only**
  because its equations now carry derived numbers and the gated equation CSS is
  emitted (no other golden content changed). Goldens-01..02 and 04..08 are
  **byte-identical** (reference/equation CSS is gated). `schema_version` stays
  `1.0` (ADR-004 additive pre-release policy — older documents load unchanged; a
  document saved by this build that uses the new `ref` node cannot be opened by
  a pre-M6 build, the documented forward-compat asymmetry).
- **Verification executed (final tree):** `pnpm typecheck` **PASS**; `pnpm test`
  **PASS** (19 files, 319 tests — was 18/292); `pnpm test:e2e` **PASS** (52 tests
  — was 46); `pnpm build` **PASS**; `git diff --check` **clean**. The real-document
  PDF paths were exercised by the new e2e tests: `exportPaginatedPdf` +
  pdf.js text extraction prove the dependent reference label changes `Table 1`
  → `Table 2` after an insert (and does **not** linger as `Table 1`), and a
  broken reference exports a PDF containing the visible missing marker.
- **Changed files:** new `src/core/references/index.ts`,
  `src/core/issues/index.ts`; modified `src/core/ir/schema.ts`,
  `src/core/ir/factory.ts`, `src/core/index.ts`,
  `src/core/numbering/index.ts`, `src/core/layout/{html,css,index}.ts`,
  `src/core/fields/keys.ts`, `src/app/marginText.ts`,
  `src/editor/{extensions,adapter}.ts`, `src/editor/EditorPanel.tsx`,
  `src/App.tsx`, `src/components/UnresolvedFieldsPanel.tsx`,
  `scripts/export-pdf.mjs`; new `tests/unit/references.test.ts` and modified
  `tests/unit/{numbering,adapter,margin-text}.test.ts`; `tests/golden/generator.ts`,
  new `tests/golden/golden-09-references.{json,expected.html}`, modified
  `tests/golden/golden-03-phase0-gate.expected.html` (intentional); new
  `tests/e2e/references.spec.ts`; `docs/limitations.md`;
  `docs/planning/PHASE-1-plan.md` (this plan).
- **Acceptance classification (evidence):** V1-REF-002, V1-REF-003 and V1-EQ-001
  → **PASS** (§3 matrix). No criterion definition was changed or weakened.
  Residual limits (references target numbered objects only; the editor chip
  shows the kind not a number by design; equation numbering is document-order,
  not chapter-relative, with no manual tag or per-equation opt-out; numbering is
  derivation, not lifecycle control) are documented in `docs/limitations.md`
  §M6.
- **Out of scope (unchanged):** M7–M11 not started (themes, advanced tables,
  image editing, autosave, a11y audit); Markdown import not started; no
  lifecycle/approval/revision-history/signature workflow; no backend/login/cloud;
  no new dependencies; no schema-version bump (`schema_version` stays `1.0`,
  ADR-004).

---

## 1. Objective

Phase 1 deepens the **structured document engine** established in Phase 0,
targeting the V1 MUST/SHOULD criteria that remain open, in the core
development order of `Main_Prompt.md` §46 / `AGENTS.md` §78: **Document Model →
Business Logic → Rendering → Editor UI**, not UI-first.

R0.3 established a decision-readiness layer: a unique, one-to-one matrix entry
for every criterion; statuses consistent with their named gaps; every
phase-boundary tension resolved or flagged; performance/visual-regression/
accessibility requirements defined as **testable release gates** rather than
intentions. **R0.4 records the human approval of that scope and of all
decisions (D1–D11, §9)** without weakening any V1 acceptance criterion and
without altering any Phase 0 PASS classification or evidence (§4).

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

Status legend — **PASS**: implemented + evidenced in Phase 0, M1 (R0.5), M2
(R0.7) or M3 (R0.9). **PARTIAL**: works in part, remainder named. **PLANNED —
P1-M#**: Phase-1 milestone. **PLANNED — remaining-V1**: approved remaining-V1
work (after M1–M11). **DEFERRED**: later phase, justified. **OPEN**: human
decision (§9) — no rows remain open after the R0.4 approval.
Rows marked **◂R0.3** changed in the R0.3 audit (see §5 for the full
rationale); the only R0.4 matrix change is V1-IMP-001 (status → PLANNED —
remaining-V1, approved D3). **R0.5 (M1) transitions:**
V1-STYLE-001..004 → PASS, V1-TXT-001 → PASS, V1-DOC-002 base-style leg
delivered (still PARTIAL — configurability → M4). **R0.7 (M2) transitions:**
V1-FMT-001 → PASS, V1-FMT-002 → PASS, V1-FMT-003 → PARTIAL (uppercase/
lowercase text case delivered; the remainder is documented — §0.7 and
`docs/limitations.md` §M2). **R0.9 (M3) transitions:** V1-LIST-001/002/003 →
PASS; V1-LIST-004 → PASS as a documented structured subset (recursive
nesting + hierarchical derived numbering; residuals in §0.9 and
`docs/limitations.md` §M3). **R0.10 (M3 hardening)** changed **no** row's
status: it enforces a single ordered-list `start` bound (1–9999) across the
schema/adapter/render/numbering layers, caps the Roman formatter defensively,
and strengthens the renumbering evidence with stable-id tests (§0.10). **R0.11
(M4) transitions:** V1-PAGE-001/003/004 → PASS, V1-SEC-002 → PASS (section
size/margin UI), V1-PAG-004 → PASS (mixed page sizes), the V1-PDF-002 non-A4
leg → PASS (V1-PDF-002 → PASS), and the V1-DOC-002 configurability leg → PASS
(V1-DOC-002 → PASS); the residuals (in-app single-geometry print, Custom
orientation semantics, custom/margin bounds, defaults scope) are documented in
`docs/limitations.md` §M4 and §0.11. **R0.12 (M4 evidence hardening)** changed
**no** row's status: it expanded `golden-07-page-setup` and the PDF MediaBox
e2e test to prove all 14 standard format/orientation combinations plus Custom
(15 cases), correcting R0.11's broader-than-actual description (§0.12).
**R0.13 (M5) transitions:** V1-HF-003 → PASS, V1-META-001/002/003 → PASS,
V1-FIELD-001..004 → PASS; the residual limits (fixed field allow-list, the
logo-in-margin-box HF limitation, `status` as data not lifecycle, key-not-value
storage) are documented in `docs/limitations.md` §M5 and §0.13.
**All Phase 0 PASS classifications and evidence are preserved unchanged.**

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
| V1-IR-004 — Semantic blocks | **PASS** | paragraph/heading/bulletList/table/image/pageBreak/equation/hr/section in `blockSchema`; the canonical recursive `list` kind added in M3 (legacy `bulletList` kept byte-compatible) |

### §7 Document creation (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-DOC-001 — New document | **PASS** | `newDocument()` + New button |
| V1-DOC-002 — New document defaults | **PASS** ◂R0.5 ◂R0.11 | A4/portrait/margins/theme/metadata defaults exist (`factory.ts`); base-style leg delivered M1 (R0.5); **configurability leg delivered M4 (R0.11)** — a new-document defaults panel (page setup incl. all formats/Custom, default theme from the available themes, metadata skeleton over existing fields) seeds a newly created document from a validated local snapshot, distinct from the open/saved document (`docs/limitations.md` §M4 items 41–42). Evidence: `tests/e2e/document-defaults.spec.ts`, `tests/unit/page-setup.test.ts` |
| V1-DOC-003 — Document editing | **PASS** | Tiptap typing/edit/undo/redo/copy/paste via adapter (`adapter.test.ts`) |

### §8 Text and structure (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-TXT-001 — Text blocks | **PASS** ◂R0.5 | Paragraph + style-based text types (Title, Subtitle, Body Text, Caption, Quote, Note, Warning, Important Notice, Definition) delivered as reusable styles in M1; headings stay semantic (V1-STYLE-001) — `styles.test.ts`, golden-04, `styles.spec.ts` |
| V1-TXT-002 — Heading hierarchy | **PASS** | Semantic heading blocks levels 1–6, never font-derived |
| V1-TXT-003 — Heading structure | **PASS** | Numbering + layout identify headings/levels independently of formatting |

### §9 Text formatting
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FMT-001 — Character formatting (MUST) | **PASS** ◂R0.7 | Structured character marks: bold, italic, code, link, underline, strikethrough, superscript, subscript, font family (`serif / sans / mono`, resolved to a theme stack), font size (validated pt 6–72), text colour and highlight (validated hex). Allow-listed/validated values only, never raw CSS; contradictory runs impossible; the renderer re-validates at the boundary — `format.test.ts`, golden-05, `format.spec.ts` |
| V1-FMT-002 — Paragraph formatting (MUST) | **PASS** ◂R0.7 | Validated per-block overrides of the assigned style: left/center/right/justify alignment, line spacing, paragraph spacing (before/after) and left indentation; `null` = inherit; additive (style/theme definitions never mutated) — `format.test.ts`, golden-05, `format.spec.ts` |
| V1-FMT-003 — Advanced formatting (SHOULD) | **PARTIAL** ◂R0.7 | Uppercase/lowercase text case implemented (M2). **Not** implemented and explicitly documented rather than silently omitted: small caps, character spacing, letter spacing, paragraph borders, paragraph shading, hanging indentation, tab stops (`docs/limitations.md` §M2, item 28). The criterion as a whole is **not** claimed PASS |

### §10 Style system (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-STYLE-001 — Reusable styles | **PASS** ◂R0.5 | document-level `styles` library, sixteen listed built-ins + Heading 5/6, Quote, Important Notice (`src/core/ir/styles.ts`); allow-listed validated tokens (`styleFormatSchema`) — `styles.test.ts` "V1-STYLE-001"; ADR-005 |
| V1-STYLE-002 — Style assignment | **PASS** ◂R0.5 | per-block `style` reference (paragraph/heading); `null` → derived built-ins (paragraph → normal, heading N → heading-N); toolbar select; adapter round-trip — `styles.test.ts` "V1-STYLE-002", `adapter.test.ts` |
| V1-STYLE-003 — Style modification | **PASS** ◂R0.5 | definition edit re-renders every assignee via shared resolve→layout pipeline; content/ids/numbering untouched by construction — `styles.test.ts` "V1-STYLE-003", `styles.spec.ts` |
| V1-STYLE-004 — Style persistence | **PASS** ◂R0.5 | custom styles + assignments survive edit → save → close → reopen (JSON round-trip, byte-stable re-save); golden-04 persists a custom style — `styles.test.ts` "V1-STYLE-004" |

### §11 Lists
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-LIST-001 — Bullets (MUST) | **PASS** ◂R0.9 | Six bullet markers delivered as an allow-listed `marker` enum on the canonical `list` block — **disc** (filled circle), **circle** (empty circle), **square**, **dash**, **arrow**, **check** (matching the six required forms) — selected from a labelled toolbar control and rendered as semantic `<ul data-marker="…">`. Evidence: `tests/unit/list.test.ts`, `tests/unit/adapter.test.ts`, golden-06, `tests/e2e/lists.spec.ts` |
| V1-LIST-002 — Numbered lists (MUST) | **PASS** ◂R0.9 | Five numbering styles as an allow-listed `listType` enum — **decimal** (1,2,3), **upper-alpha** (A,B,C), **lower-alpha** (a,b,c), **upper-roman** (I,II,III), **lower-roman** (i,ii,iii) — with a configurable `start`. Evidence: `tests/unit/list.test.ts`, golden-06, `tests/e2e/lists.spec.ts` |
| V1-LIST-003 — Basic automatic list numbering (MUST) | **PASS** ◂R0.9 | Ordinals are **derived at resolve/renumber time, never stored**; inserting, removing, reordering, nesting or unnesting items recomputes the visible labels automatically (deterministic, non-mutating). Editor is wired through the explicit adapter, not Tiptap-as-truth. Evidence: `tests/unit/list.test.ts` (renumber on insert/delete/reorder/nest/unnest), `tests/e2e/lists.spec.ts` (insert → labels renumber) |
| V1-LIST-004 — Multilevel lists (SHOULD) | **PASS (structured subset)** ◂R0.9 ◂R0.3 | Hierarchical numbering (`1.`, `1.1.`, `4.1.1.`, …) via recursive canonical `list` items + a per-level derive-at-resolve label map; indent/outdent nest/unnest without flattening. **Documented residuals** (tracked, not dropped): one uniform `listType`/`marker` per tree (mixed-type nesting is normalised to the outer type), nested levels restart at 1, and native ordered markers are suppressed in favour of derived inline labels. Evidence: `tests/unit/list.test.ts`, golden-06, `tests/e2e/lists.spec.ts`; **approves the V1.1 multilevel promotion (D8)** |

### §12 Page setup
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PAGE-001 — Page sizes (MUST) | **PASS** ◂R0.11 ◂R0.12 | Eight `format` values — A4/A3/A5/Letter/Legal/Tabloid/Executive + `Custom` (explicit mm pair) — resolved by the shared `src/core/ir/pageGeometry.ts`; section format selector + Custom width/height inputs. golden-07 now covers all 14 standard format/orientation combinations + Custom (15 cases). Evidence: `tests/unit/page-setup.test.ts`, golden-07, `tests/e2e/page-setup.spec.ts` |
| V1-PAGE-002 — Orientation (MUST) | **PASS** | portrait/landscape per section; mixed gate PASS (`pnpm pdf`) |
| V1-PAGE-003 — Margins (MUST) | **PASS** ◂R0.11 | Top/right/bottom/left margin controls in the section editor; IR + renderer respect them; a degenerate usable area is rejected (`pageAreaProblem`). Evidence: `tests/unit/page-setup.test.ts`, `tests/e2e/page-setup.spec.ts` |
| V1-PAGE-004 — Document-level page settings (MUST) | **PASS** ◂R0.11 | Per-section page-setup UI (size/orientation/margins) at document level; a new-document defaults panel seeds a validated snapshot. Evidence: `tests/e2e/page-setup.spec.ts`, `tests/e2e/document-defaults.spec.ts` |

### §13 Sections (MUST) — IDs retained
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-SEC-001 — First-class sections | **PASS** | `sectionSchema`; per-section editing |
| V1-SEC-002 — Section-level layout | **PASS** ◂R0.11 | A section defines page size, orientation, margins, header and footer, all editable (size/margins added in M4; orientation/header/footer already). Evidence: `tests/e2e/page-setup.spec.ts` |
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
| V1-TABLE-008 — Row split behavior | **PLANNED — M8** ◂R0.3 | new `rowSplit` policy; **advanced-table-pagination promotion** — approved (D8) |
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
| V1-HF-003 — Dynamic metadata in HF | **PASS** ◂R0.13 | the margin-field registry resolves `[title] [docNumber] [revision] [effectiveDate] [reviewDate] [status] [laboratoryName] [pageNumber] [pageCount]` (plus the `[page]`/`[count]` parse aliases) in **both** header and footer through the shared resolver (e2e `getComputedStyle` + materialized footer text). The laboratory **logo** field is a documented HF limitation (margin boxes are CSS `content`, not DOM). Evidence: `tests/unit/fields.test.ts`, `tests/unit/margin-text.test.ts`, `tests/e2e/fields.spec.ts`, golden-08 |
| V1-HF-004 — Page numbering | **PASS** | Page X / Page X of Y; auto-update; global-N approximation documented (item 6) |

### §18 Metadata (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-META-001 — Structured metadata | **PASS** ◂R0.13 | `metadataSchema` carries title/docNumber/revision/effectiveDate/author/organization/description **plus** document type, department, reviewDate, status, prepared/reviewed/approvedBy and classification (additive, empty defaults). Evidence: `tests/unit/fields.test.ts`, golden-08 |
| V1-META-002 — Metadata panel | **PASS** ◂R0.13 | the sidebar edits every metadata field **and** the document-scoped laboratory profile (name/address/logo); the logo is an allow-listed embedded image (invalid/remote/oversized refused before the IR); per-document isolation tested. Evidence: `tests/e2e/fields.spec.ts`, `tests/unit/fields.test.ts` |
| V1-META-003 — Metadata as source of truth | **PASS** ◂R0.13 | every occurrence references the canonical property via a field **key** (never a copied value), so a metadata/laboratory edit updates all linked occurrences in the body and header/footer. Evidence: `tests/unit/fields.test.ts` (all-occurrence update), `tests/e2e/fields.spec.ts` |

### §19 Dynamic fields (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-FIELD-001 — Document fields | **PASS** ◂R0.13 | a canonical inline field node stores the **key**; the labelled picker inserts it as an editor chip; the body renders the resolved value from the shared resolver. Evidence: `tests/unit/fields.test.ts`, `tests/unit/adapter.test.ts`, `tests/e2e/fields.spec.ts`, golden-08 |
| V1-FIELD-002 — Laboratory fields | **PASS** ◂R0.13 | document-scoped `laboratoryProfile` (name/address/logo) in the IR; `laboratory.name`/`address` resolve as text and `laboratory.logo` as a constrained safe `<img>` in the body. Evidence: `tests/unit/fields.test.ts`, `tests/e2e/fields.spec.ts`, golden-08 |
| V1-FIELD-003 — Page fields | **PASS** ◂R0.13 | `page.number`/`page.total` in the **body** (and `[page]`/`[count]` in HF) resolve after pagination via the shared Paged.js materialiser; a section restart shifts the number; total = document page count. Evidence: `tests/unit/fields.test.ts`, `tests/e2e/fields.spec.ts`, golden-08 |
| V1-FIELD-004 — Unresolved field detection | **PASS** ◂R0.13 | one shared collector reports each used-but-empty/missing field with its location (body/header/footer, repeated occurrences); the sidebar panel and preview surface it and **both** export paths (`pnpm pdf` + in-app) refuse final PDF while it remains (draft save unaffected). Evidence: `tests/unit/fields.test.ts`, `tests/e2e/fields.spec.ts` |

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
| V1-REF-002 — Basic cross-reference (SHOULD) | **PASS** ◂R0.14 | a semantic inline `ref` node stores the target's stable id + kind (never a copied label); a picker lists each numbered target's current derived label; the body renders the derived label in a `.doc-ref` span. Evidence: `tests/unit/references.test.ts`, `tests/e2e/references.spec.ts`, golden-09 |
| V1-REF-003 — Reference updates (SHOULD) | **PASS** ◂R0.14 | labels are derived from the authoritative numbering engine at resolve time, so insert/delete/reorder renumbers every dependent reference; the real printed PDF text is checked after a renumber. Evidence: `tests/unit/references.test.ts`, `tests/e2e/references.spec.ts` (pdf.js text extraction), golden-09 |

### §22 Equations
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-EQ-001 — Structured insertion (SHOULD) | **PASS** ◂R0.14 | structured LaTeX insertion/editing via a dialog (V1-EQ-003 semantics) **plus (M6) derived equation numbering** — every equation block gets a `"Equation N"` label in document order (never stored) and is addressable by a cross-reference. Evidence: `tests/unit/references.test.ts`, `tests/unit/numbering.test.ts`, `tests/e2e/references.spec.ts`, golden-09 |
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
| V1-PAG-004 — Mixed sections | **PASS** ◂R0.11 ◂R0.12 | Different section orientations **and page sizes** paginate; the **15-case** golden-07 (all 14 standard format/orientation combinations + Custom) previews and exports with per-page MediaBoxes matching each section (§0.12). Evidence: `tests/e2e/pdf-parity.spec.ts` (M4 test), golden-07 |
| V1-PAG-005 — Table pagination | **PASS** | multi-page tables, repeated headers |
| V1-PAG-006 — Deterministic pagination | **PASS** | same IR+styles+theme → equivalent output |

### §26 PDF output (MUST)
| Criterion | Status | Evidence / gap → assignment |
|---|---|---|
| V1-PDF-001 — PDF generation | **PASS** | `pnpm pdf` + in-app print; MediaBox-verified |
| V1-PDF-002 — PDF visual correctness | **PASS** ◂R0.3 ◂R0.11 ◂R0.12 | Text/headings/tables/images/sections/HF/page numbers/theme + **page dimensions for every format** — A4 (595×842) plus the real non-A4/Custom MediaBoxes of all 15 golden-07 cases asserted from mm→pt (`72/25.4`, ±1 pt). Evidence: `tests/e2e/pdf-parity.spec.ts` (M4 MediaBox test over golden-07, strengthened in R0.12 to all 14 standard format/orientation combinations + Custom); gate + user 3-page PDF retained |
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
| V1-IMP-001 — Markdown (SHOULD for V1) | **PLANNED — remaining-V1** ◂R0.4 | not implemented; **approved (D3)** as a separate remaining-V1 milestone after M1–M11 and before final V1 acceptance (intentional deviation from `Main_Prompt.md` §50); `remark`/`unified` dependency approval separate |
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
| V1-PERF-001 (MUST) | **PARTIAL** ◂R0.3 | stress baseline: 93 pages, 1 table, 3 images, 3 sections. Criterion minimum: 20+ pages, **10+ tables, 10+ images**, multiple headings, headers/footers, multiple sections. Fixture extension + **release gate** defined in §6.1 (approved targets — D9) |

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
  **RESOLVED (R0.11):** M4 delivered the eight-format geometry and the M4
  MediaBox test over golden-07 (all formats × orientation + Custom, mm→pt
  `72/25.4`, ±1 pt), so V1-PDF-002 is **PASS** (see §0.11, §3 matrix).
  **EVIDENCE STRENGTHENED (R0.12):** the golden-07 fixture and the MediaBox test
  were expanded so the **real** PDF is verified for all 14 standard
  format/orientation combinations plus Custom (15 cases) — the R0.11 wording
  above described an 11-section subset as if it were the full matrix (§0.12).

### 4.2 V1-DOC-002 orphaned work resolved

`V1-DOC-002` requires sensible new-document defaults (A4, portrait, standard
margins, **base style**, default theme, initial metadata structure) **and
"Defaults must be configurable where appropriate."** R0.2 left
"configurable defaults" orphaned ("settings milestone"):

- **Base style default** → **M1** (the style system is the only source of a
  "base style"). **DELIVERED (R0.5):** new documents start from the built-in
  style library and default blocks reference `normal`/`heading-N`
  (`factory.ts` + `styles.test.ts` "V1-DOC-002").
- **Configurable defaults where appropriate** → **M4** (milestone renamed
  "Page setup, paper sizes & document defaults"): document-level page
  settings UI (V1-PAGE-004) plus a new-document default-settings surface
  covering page setup, default theme and metadata skeleton.
- **Effect on V1 acceptance:** `V1-DOC-002` is **PARTIAL until M4** — the
  base-style leg (R0.5) closes half the gap, but the configurability
  requirement remains open, so the criterion cannot be claimed PASS yet.
- **Approved (R0.4, D11):** configurable new-document defaults stay **in M4**
  as scoped here; no deferral was approved. A hypothetical future deferral
  would keep V1-DOC-002 PARTIAL — it would not be an automatic pass.

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
- **R0.11 (M4) update:** the following rows move to **PASS** per §0.11 —
  `PAGE-001`/`PAGE-003`/`PAGE-004` (sizes/margins/document settings UI),
  `SEC-002` (section size/margin UI; orientation/header/footer already),
  `PAG-004` (mixed page **sizes**, not just orientations), `PDF-002` (non-A4/
  Custom page dimensions) and `DOC-002` (configurability leg). No other row's
  status changed; the remaining named gaps (M5–M11, the §6 gates and
  remaining-V1 import) are unchanged.
- **R0.13 (M5) update:** `HF-003`, `META-001/002/003` and `FIELD-001/002/003/004`
  move to **PASS** per §0.13 (metadata + laboratory profile + dynamic fields);
  no other row's status changed, and the remaining named gaps are M6–M11, the §6
  gates and the remaining-V1 import.
- **R0.14 (M6) update:** `REF-002`, `REF-003` and `EQ-001` move to **PASS** per
  §0.14 (cross-references + derived equation numbering); `REF-001`, `NUM-001..005`
  keep their PASS status. No other row's status changed, and the remaining named
  gaps are M7–M11, the §6 gates and the remaining-V1 import.

---

## 5. Phase-boundary reconciliation (vs Main_Prompt §§46–50)

### 5.1 Promoted V1.1 capabilities inside Phase 1 (approved — D8)

| Phase-1 item | Main_Prompt placement | Criteria demand | Classification |
|---|---|---|---|
| M3 multilevel lists + per-level numbering | §47 "multilevel numbering" (V1.1) | V1-LIST-004 (SHOULD, V1); V1-LIST-003 requires renumbering | **Intentional promotion** — approved (D8) |
| M6 cross-references | §47 "cross-references" (V1.1) | V1-REF-002/003 (SHOULD, V1) | **Intentional promotion** — approved (D8) |
| M6 equation numbering | §47 "equations/figures" (V1.1) | none (V1-NUM covers headings/tables/figures only) | **Intentional promotion** — approved (D8) |
| M8 advanced table pagination (merged cells × row-split × repeated headers) | §47 "advanced table pagination" (V1.1) | V1-TABLE-003/008 (MUST, V1) | **Criteria-mandated promotion** — approved (D8) |

Rationale, stated plainly: the V1 acceptance criteria (the release gate)
demand merged cells, configured row-split and list renumbering **in V1**, and
list cross-references as SHOULD in V1; `Main_Prompt.md` §47 defers the
corresponding advanced capabilities to V1.1. Wherever the criteria mandate it,
the work must happen inside V1. The promotions are **additive scope** and were
**approved (D8)**: they do not weaken or rewrite the product roadmap — they
are recorded precisely so the boundary remains a decision, not a silent
change. **Markdown import (V1-IMP-001) is recorded separately** from these
four promotions: approved (D3) as its own remaining-V1 milestone after
M1–M11 and before final V1 acceptance, an intentional deviation from
`Main_Prompt.md` §50 (§5.2, §8.4, §9).

### 5.2 Retained boundaries (no change)

- **Imports:** V1-IMP-002/003/004 (DOCX/PDF/DOC) → V1.1+/V1.4+ per §50;
  **V1-IMP-001 (Markdown)** is **approved (D3)** as a separate remaining-V1
  milestone after M1–M11 and before final V1 acceptance — an intentional,
  recorded deviation from `Main_Prompt.md` §50 (V1.4+). The `remark`/`unified`
  dependency approval remains separate and requires a package-version, license
  and security review before any implementation (AGENTS.md §35/§72).
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

**Approved targets (D9, R0.4):** preview ≤ **12 s** and export ≤ **20 s** for
the extended representative fixture, derived from the recorded baseline
(93-page preview ≈ 3.0 s, export ≈ 4.3 s on the Phase-0 recording machine)
with ~3–4× headroom for the added tables/images and machine variance.

**Reference-environment prerequisites (D9, R0.4 — required before the release
gate is enforceable):** the following must be documented and pinned in the
repository before the gate can be enforced:

- reference environment: OS version, Node.js and pnpm versions (from the repo
  toolchain), browser engine pin (Playwright/Chromium version), and the
  reference hardware class (the Phase-0 recording machine, described by
  CPU/RAM class, is the documented reference);
- representative fixture: built and committed as a test fixture meeting the
  criterion minimum — ≥10 tables (incl. a multi-page split register), ≥10
  images, ≥6 headings across ≥3 sections, explicit headers and footers, 20+
  pages;
- measurement protocol: `previewMs` and `exportMs` recorded to
  `artifacts/perf-summary.json` on the pinned environment.

**Release-gate condition:** the gate passes only when (a) the fixture meets
the composition minimum (asserted in the spec), (b) the existing hard
invariants stay green (preview pages == PDF pages; restart marker; split
table + repeated `<thead>`; images/equations present; mixed orientations), and
(c) the committed thresholds (12 s preview / 20 s export) are asserted on the
pinned reference environment. The thresholds are committed constants in the
perf spec, with observed values captured in `artifacts/perf-summary.json`.
"Choosing thresholds later" is explicitly **not** acceptance evidence.

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

**Approved (D10, R0.4):** the visual-regression corpus and committed
screenshot-baseline approach are approved. **Gate-activation prerequisite
(D10):** the exact browser/runtime pin and the pixel-difference tolerance
policy must be documented in the repository before the gate is activated —
the corpus and baselines land in release hardening, and only then do the
"screenshots not captured" notes in `docs/phase0-manual-smoke-check.md` /
`docs/limitations.md` get updated.

**Release-gate condition:** the corpus e2e suite is green on CI with committed
baselines and the documented, pinned tolerance; V1-VIS-001/002 are PASS on
that gate (V1-VIS-002 additionally requires the 20-theme library from M7).
This gate is independent of the configurable-defaults decision (approved
separately — D11).

### 6.3 V1-A11Y-001 — no automatic waiver (approved — D7)

**Approved (D7, R0.4):** the paged.js margin-box accessibility constraint is
accepted as a documented limitation. The documented margin-box AT limitation
(upstream paged.js, limitations item 5) remains a **documented constraint
scoped to the preview margin boxes only**; it does **not** waive the
main-interface criterion. M11 must demonstrate each requirement with tests:

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

## 7. Nested-list schema (approved — D4; implemented in M3)

Preserved verbatim in intent from R0.2 §4. Approval D4 was granted in R0.4
and the schema, normalisation and tests were **implemented in M3** (R0.9,
§0.9); the proposal below is the agreed contract and is now reflected in
`src/core/ir/schema.ts` (`list`/`listItem`) and
`src/core/ir/normalize.ts`:

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
- **Implemented in M3 (R0.9, §0.9).** The `list` kind is in the `blockSchema`
  union; legacy `bulletList` loads unchanged and is normalised to the
  canonical `list` on the next edit/save; the §7 test suite (adapter
  round-trip, per-level ordinal resolution, legacy→canonical normalisation,
  flat + nested + numbered + roman golden) is delivered in
  `tests/unit/list.test.ts`, `tests/unit/adapter.test.ts` and golden-06.

---

## 8. Milestone plan

### 8.1 Dependency graph (why this order)

```text
M1 Styles ─────────────┐
M2 Character/paragraph format ─┐
M3 Lists (uses M2 marks, numbering principles)   ◂ promoted: multilevel
M4 Page setup, paper sizes & DOCUMENT DEFAULTS (conceptually independent —
   executed sequentially per approved D2; also M4 closes V1-DOC-002
   configurable defaults + V1-PAGE-004 settings UI)   ◂ DELIVERED R0.11 ◂ HARDENED R0.12
M5 Metadata + lab profile + fields (uses M1 styles for field rendering)   ◂ DELIVERED R0.13
M6 Numbering + references (+ equation numbering) ◂ promoted: cross-refs/eq   ◂ DELIVERED R0.14
M7 Themes (needs M1 + M5)
M8 Table depth (needs M4 geometry, M2 cell formatting) ◂ promoted: merged×pages
M9 Images depth (needs M2 alignment, M8 caption UI)
M10 Autosave (independent app-shell)
M11 Accessibility pass (last; audits final controls/dialogs)
```

Ordering rule: model/business logic before renderer/editor; shared engines
(fields, numbering) before consumers; the risky table-pagination work after
geometry + formatting exist; M4 conceptually independent but **executed
sequentially — one milestone at a time in the working tree, with a separate
checkpoint commit per milestone (approved D2)**; M11 (a11y) after the
UI-heavy milestones so it audits final controls and dialog shapes. Every
milestone is independently reviewable and ends at a Git checkpoint (AGENTS.md
workflow). M1 starts only in a separate task after this approval checkpoint.

### 8.2 Phase-1 milestones (approved scope — D1)

#### M1 — Style system · V1-STYLE-001..004 (MUST), V1-TXT-001 (MUST), V1-DOC-002 (base-style default)
Closes: no reusable styles; text types only as paragraph/heading. IR:
document-level `styles` map; per-block style **reference** (AGENTS.md §58);
style-based text types (Title, Subtitle, Body Text, Caption, Quote, Note,
Warning, Important Notice, Definition, Reference, Header, Footer, Table Text);
base-style default for new documents. Schema: additive under ADR-004. Tests:
assign/change/persist unit, round-trip, golden, e2e (style change re-renders;
theme switch preserves style semantics). Acceptance: V1-STYLE-003 (change
updates all users), V1-STYLE-004 (survives save/reopen), V1-DOC-002 base-style
leg. Out of scope: template authoring. **◂R0.5 — DELIVERED:** V1-STYLE-001..004
and V1-TXT-001 PASS (evidence: `tests/unit/styles.test.ts`, golden-04,
`tests/e2e/styles.spec.ts`, ADR-005); V1-DOC-002 base-style leg closed, the
configurability leg remains in M4 (a separate task per D2 — not started).
**◂R0.6 — HARDENED:** post-delivery hardening of M1 (own-property style
lookups for prototype-name ids; e2e parity PDF moved to an ignored output
path) — M1 acceptance unchanged, see §0.6.

#### M2 — Character & paragraph formatting · V1-FMT-001/002 (MUST), V1-FMT-003 (SHOULD, feasible subset)
IR: extend `markSchema` (underline, strikethrough, superscript, subscript,
color, highlight, font family/size within allow-list); paragraph attrs
(alignment, line/paragraph spacing, indentation) stored as **overrides** of
styles, never replacing them. Editor: toolbar; real dialogs replace
`prompt()`. Dep: M1. Tests: adapter both directions, layout CSS, round-trip,
e2e; limitations item 16 updated. Acceptance: V1-FMT-001/002 in a golden;
V1-FMT-003 documented subset. **◂R0.7 — DELIVERED:** V1-FMT-001 and
V1-FMT-002 PASS; V1-FMT-003 **PARTIAL** (uppercase/lowercase text case only —
small caps, character/letter spacing, paragraph borders/shading, hanging
indent and tab stops are documented unsupported, not silently dropped).
Evidence: `tests/unit/format.test.ts` (30 tests), golden-05,
`tests/e2e/format.spec.ts` (6 tests incl. save→reopen round trip). Character
values are allow-listed enums / validated primitives (never raw CSS); the
renderer re-validates at the boundary; contradictory runs are impossible by
construction. A latent M1 colour-validator defect (`{3,8}` hex range) was
fixed with regression tests. See §0.7; `docs/limitations.md` §M2.

#### M3 — Lists · V1-LIST-001 (MUST), 002 (MUST), 003 (MUST), 004 (SHOULD) ◂ promotes V1.1 multilevel (approved — D8)
IR: new `list` block kind per §7; bullet markers; numbered types with `start`;
derived per-level ordinals (extend numbering engine); legacy `bulletList`
normalization. Dep: M2. Tests: §7 suite + e2e (insert/remove/reorder
renumbers — V1-LIST-003). Acceptance: all six bullet markers and five
numbering styles work; any multilevel remainder tracked honestly, not dropped.
**◂R0.9 — DELIVERED:** V1-LIST-001/002/003 PASS; V1-LIST-004 PASS as a
documented structured subset. Canonical recursive `list` block
(`listType` ∈ bullet|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman;
bullet `marker` ∈ disc|circle|square|dash|arrow|check; configurable `start`;
recursive `items` with `content` paragraphs + nested `children`); derived
per-level hierarchical labels ("3.1", "4.1.1") computed in the numbering
engine and never stored; `orderedList` enabled with `marker`/`numbering`
global attrs; toolbar exposes labelled bullet/ordered toggles, six-marker and
five-style pickers, a start input and indent/outdent (nest/unnest) — no
`window.prompt`/`alert`. Legacy flat `bulletList` → canonical `list`
normalisation on the next edit/save; `schema_version` stays `1.0` (ADR-004).
Evidence: `tests/unit/list.test.ts` (21 tests), `tests/unit/adapter.test.ts`,
golden-06, `tests/e2e/lists.spec.ts` (5 tests incl. save→reopen round trip).
Residual limits recorded in §0.9 and `docs/limitations.md` §M3.
**◂R0.10 — HARDENED:** ordered-list `start` bounded to 1–9999 at every layer
(schema zod range + adapter + render/numbering via one shared
`LIST_START_MIN`/`LIST_START_MAX`), `toRoman` capped defensively so a malformed
value cannot hang rendering, and stable-id renumbering tests (delete/reorder/
insert/nest/unnest) plus a real-editor deletion e2e. No acceptance status
changed; see §0.10 and `docs/limitations.md` §M3.

#### M4 — Page setup, paper sizes & document defaults · V1-PAGE-001/002/003/004 (MUST), V1-PAG-004 (MUST), V1-PDF-002 (MUST, non-A4 leg), V1-DOC-002 (configurable defaults)
IR: `format` enum expansion + custom width/height pair; layout geometry table;
document-level and new-document default settings (page setup, default theme,
metadata skeleton) — closes the V1-DOC-002 configurability requirement (§4.2);
configurability **stays in M4 as approved (D11)** — no deferral.
Renderer: per-size `@page` geometry; `pnpm pdf` run-grouping (already
size-keyed) confirmed per-size MediaBoxes. Dep: none (conceptually independent;
executed sequentially — D2). Tests:
unit geometry, goldens per size×orientation, e2e PDF media sizes, settings
round-trip. Acceptance: every listed size paginates and exports correctly;
V1-PDF-002 and V1-PAG-004 complete.
**◂R0.11 — DELIVERED:** V1-PAGE-001/002/003/004 PASS, V1-SEC-002 PASS (section
size/margin UI), V1-PAG-004 PASS (mixed **page sizes**), V1-PDF-002 PASS
(non-A4/Custom MediaBoxes), V1-DOC-002 PASS (configurability leg). One
authoritative geometry module (`src/core/ir/pageGeometry.ts`: A4/A3/A5/Letter/
Legal/Tabloid/Executive + `Custom`, orientation applied exactly once, Custom
never swapped, 10–2000 mm bounds, usable-area validation); additive IR under
ADR-004 (`format` enum + nullable `widthMm`/`heightMm`, `schema_version` stays
`1.0`); a section `PageSetupEditor` and a distinct `NewDocumentDefaults` panel
(local, versioned, safe-fallback preferences). Evidence:
`tests/unit/page-setup.test.ts` (26 tests), golden-07,
`tests/e2e/pdf-parity.spec.ts` (MediaBox mm→pt for every format/orientation),
`tests/e2e/page-setup.spec.ts`, `tests/e2e/document-defaults.spec.ts` (5 tests).
Residual limits recorded in §0.11 and `docs/limitations.md` §M4.
**◂R0.12 — HARDENED (evidence):** the PDF MediaBox evidence was extended to the
full matrix — golden-07 now has **15 geometry cases** (all seven standard
formats × portrait + landscape, plus Custom 200×150) and `tests/e2e/pdf-parity`
verifies the **real** exported PDF for all 15 (mm→pt `72/25.4`, ±1 pt). No
acceptance status changed; the R0.11 description had overstated the 11-section
test as "all formats × orientation". See §0.12.

#### M5 — Metadata, laboratory profile, dynamic fields · V1-META-001/002/003 (MUST), V1-FIELD-001..004 (MUST), V1-HF-003 (MUST)
IR: expanded `metadataSchema` (document type, department, review date, status,
prepared/reviewed/approved by, classification — additive empty defaults); new
`laboratoryProfile` (name/address/logo via the existing image allow-list);
inline field node in `inlineSchema`; `marginFieldSchema` extension. Resolve:
document/page/lab field resolution; unresolved-field registry served to
V1-FIELD-004 UI + export validation. Dep: M1. Tests: resolution unit,
round-trip, golden (fields in body + HF), e2e metadata→field updates and
unresolved detection. `status` is a **field**, not lifecycle — approved (D6);
V1-LIFE-001 stays V1.2.
**◂R0.13 — DELIVERED:** V1-META-001/002/003 PASS, V1-FIELD-001..004 PASS,
V1-HF-003 PASS. One typed, allow-listed field registry
(`src/core/fields/keys.ts`) is the single source of field names, read by the
editor picker, the body/margin resolver, the renderer and the pre-export
validator; a new `src/core/fields/` module (registry, resolver, unresolved
collector) plus `src/core/ir/walk.ts` (shared inline traversal) carry the logic.
The IR gains a first-class inline **field node** (`z.union([textRun, fieldNode])`,
both `.strict()` — the key is stored, never a copied value) and a
document-scoped `laboratoryProfile` (name/address/logo, logo via the existing
image allow-list); the metadata schema gains document type, department, review
date, status, prepared/reviewed/approved by and classification (additive, empty
defaults). The shared resolver drives the body (`inlineHtml`) and the
header/footer (`marginText`/CSS), page fields materialise after pagination via
the extended Paged.js script, the sidebar adds a laboratory-profile panel and an
unresolved-fields panel, and **both** export paths refuse final PDF while
unresolved used fields remain (draft save unaffected). A new `golden-08-fields`
exercises body/lab/page fields in the body and HF. Additive IR under ADR-004
(`schema_version` stays `1.0`; goldens-01..07 regenerate with only the new
defaulted fields — HTML byte-identical). Evidence: `tests/unit/fields.test.ts`
(35 tests) plus additive cases in `tests/unit/margin-text.test.ts` /
`tests/unit/adapter.test.ts`, golden-08, `tests/e2e/fields.spec.ts` (5 tests).
Residual limits recorded in §0.13 and `docs/limitations.md` §M5. One app-level
consequence: the sidebar's persistent logo file input made the bare
`input[type="file"]` open-selector ambiguous, so the transient open-dialog input
now carries an explicit `data-testid="open-file-input"` and the e2e specs target
it.

#### M6 — Numbering & cross-references · V1-REF-001 (retained), V1-REF-002/003 (SHOULD), equation numbering (SHOULD) ◂ promotes V1.1 cross-refs/equation numbering (approved — D8)
IR: reference field node (`ref` → target stable id + kind); equation
numbering (derived). Resolve: labels from `deriveNumbering` (heading number,
"Table N", "Figure N", "Equation N") — automatic updates by construction
(V1-REF-003); broken targets detected (AGENTS.md §46). Editor: reference
picker by id shown as visible number; Reference style from M1. Dep: M1, M5.
Tests: numbering-unit additions, adapter, round-trip, e2e renumber-updates
reference. Acceptance: V1-REF-002/003 + equation numbering in goldens (D8).
**◂R0.14 — DELIVERED:** V1-REF-002 PASS, V1-REF-003 PASS, V1-EQ-001 PASS
(equation-numbering/cross-reference leg). A first-class inline **reference
node** (`{ ref, refKind }`, `.strict()`) stores the target's stable id + kind —
never a copied label; one shared resolver (`src/core/references/`) derives the
visible label from `deriveNumbering` for headings/tables/figures/equations and
distinguishes deleted from wrong-kind targets; the numbering engine gains a
derived `equations` map (`"Equation N"`, every equation block in document
order). The editor picker lists each numbered target with its current derived
label and inserts a structural chip (kind, not a number); broken targets are
surfaced (visible marker + issue panel) and block final PDF in both the app and
`pnpm pdf`. Preview and PDF share the resolver, so renumbering updates every
reference in both (verified against the real printed PDF text). A new
`golden-09-references` exercises all four families plus one broken reference;
`golden-03` changes only because its equations now carry derived numbers.
Additive IR under ADR-004 (`schema_version` stays `1.0`; goldens-01..02 and
04..08 byte-identical). Evidence: `tests/unit/references.test.ts` (19 tests)
plus additions in `tests/unit/{numbering,adapter,margin-text}.test.ts`,
golden-09, `tests/e2e/references.spec.ts` (6 tests). Residual limits recorded
in §0.14 and `docs/limitations.md` §M6.

#### M7 — Theme library · V1-THEME-001/002 (MUST); 003/004 retained; V1-VIS-002 completion
Ship 18 more presentation-only themes (≥20), extend B&W to ≥5; all pass the
semantic-invariant suite and theme-regression e2e. Dep: M1, M5. Tests:
invariants ×20, VIS-002 series over the corpus (§6.2). Acceptance: 20 themes,
5 B&W, invariants green, VIS-002 corpus green.

#### M8 — Table depth · V1-TABLE-002 (MUST UI), 003 (MUST), 004 (MUST), 005 (MUST), 008 (MUST), 009 caption-editing (MUST) ◂ promotes advanced table pagination (approved — D8)
IR: colspan/rowspan on `tableCell`; cell h/v alignment; table/cell borders,
thickness, background, padding, row height; `rowSplit` policy — **approved
(D5)**: `rowSplit: "allow"` default, per-table "prevent row splitting" option;
caption editing persists to `caption`. Renderer: repeated
header + merged-cell continuation across pages (AGENTS.md §18); row-split
enforcement by the layout script; goldens for multi-page merged tables.

**Deterministic behavior when a prevented row cannot fit (D5):**

1. A prevented row is **atomic** — the layout engine never splits it across
   pages.
2. If the row does not fit in the remaining space of the current page, the
   engine inserts a page break **before** the row: the whole row moves to the
   next page, and the repeated `<thead>` is emitted on the continuation page
   (existing V1-TABLE-007 header-repeat behavior). The preceding whitespace on
   the current page is preserved.
3. Degenerate case — the row's natural height exceeds the usable page height
   of a full page: the row is placed at the top of a fresh page and the
   renderer records an **explicit layout warning** (surfaced through the same
   non-destructive channel as other unresolved layout warnings, AGENTS.md §33);
   it must not silently clip or split the row.

These rules are baked into M8's layout-script tests and goldens (prevented row
moves to the next page whole; degenerate-case warning asserted).
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
| **IMP-MD** — Markdown import (remark/unified → IR; fidelity report; V1-ERR-002 becomes active) | V1-IMP-001 (SHOULD) | **Approved (D3):** separate remaining-V1 milestone after M1–M11 and before final V1 acceptance; intentional deviation from `Main_Prompt.md` §50 (V1.4+); `remark`/`unified` dependency approval remains separate (package-version, license and security review before implementation — AGENTS.md §35/§72) |
| **Release gates & hardening** | V1-PERF-001 gate, V1-VIS-001/002 gates, V1-GATE-002/003/004, V1-DEMO-001 | Release hardening: PERF fixture + thresholds + reference-environment pin (§6.1), VIS corpus + baselines + browser-pin/tolerance policy (§6.2), demonstration SOP, checklist sign-off |
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

## 9. Decision log (approved — R0.4)

All decisions below were **approved** by the human on 2026-10-09 (approval
record §0, items 1–11). R0.3 **D10 is split** into D10 (visual regression) and
D11 (configurable new-document defaults) as required by the approval record.
Resolutions do not weaken any V1 acceptance criterion; Phase 0 PASS results
and evidence are unchanged.

| # | R0.3 # | Decision | Resolution (approved) |
|---|---|---|---|
| D1 | D1 | Phase-1 scope M1–M11 (§8.2) | **APPROVED** — milestones as scoped in §8.2 |
| D2 | D2 | Milestone order; M4 "parallel" thread; M11 placement | **APPROVED** — sequential execution with a separate checkpoint commit per milestone; M4 conceptually independent but executed sequentially (no simultaneous implementation in one working tree); M11 in Phase 1; M1 starts only in a separate task after this checkpoint |
| D3 | D3 | Markdown import (V1-IMP-001) placement + `remark`/`unified` dependency | **APPROVED** — separate remaining-V1 milestone after M1–M11 and before final V1 acceptance; intentional deviation from `Main_Prompt.md` §50 (V1.4+); `remark`/`unified` approval remains separate (package-version, license and security review before implementation) |
| D4 | D4 | Nested-list `list` schema (§7) + stay on `1.0` | **APPROVED** — canonical `list` node + legacy `bulletList` compatibility (ADR-004 additive, `schema_version` stays `1.0`); it is documented that older builds may reject files containing newly introduced block types (`DocFormatError`); schema/migration/tests remain unimplemented until authorized Phase-1 M3 |
| D5 | D5 | Table row-split semantics (V1-TABLE-008) | **APPROVED** — `rowSplit: "allow"` default; per-table "prevent row splitting" option; deterministic not-fit behavior specified (§8.2 M8) |
| D6 | D6 | `metadata.status` label vs lifecycle | **APPROVED** — organizational label field in M5; lifecycle enforcement + immutable history deferred to V1.2 (V1-LIFE-001) |
| D7 | D7 | paged.js margin-box AT limitation vs V1-A11Y-001 | **APPROVED** — accepted as a documented constraint (preview margin boxes only), **not** a waiver of main-interface accessibility requirements; M11 scope per §6.3 |
| D8 | D8 | Four V1.1 scope promotions into Phase 1 (multilevel lists, cross-references, equation numbering, advanced table pagination) | **APPROVED** — additive promotions per §6.1/§5.1; **Markdown import recorded separately (D3)** |
| D9 | D9 | V1-PERF-001 release gate (fixture + thresholds) | **APPROVED** — targets preview ≤ 12 s / export ≤ 20 s; reference environment and representative fixture documented and pinned before the gate is enforceable (§6.1) |
| D10 | D10a | Visual-regression corpus + committed screenshot baselines (V1-VIS-001/002) | **APPROVED** — corpus + baseline approach approved; exact browser/runtime pin and pixel-difference tolerance policy documented before gate activation (§6.2) |
| D11 | D10b | Configurable new-document defaults (V1-DOC-002) | **APPROVED** — stays in M4, treated separately from the visual-regression decision (§4.2, §8.2 M4) |

---

## 10. Residual references and follow-ups

- `tests/unit/input-security.test.ts:2` comments reference the pre-rename
  security criterion `V1-SEC-003`. The test file is **not** modified by this
  documentation-only revision (R0.3 or R0.4 — no test files were touched); the
  comment becomes `V1-SECU-003` as a comment-only update at the first Phase-1
  checkpoint that touches the file. This follow-up stays visible here until
  it is actioned.
- `docs/phase0-manual-smoke-check.md` and `docs/limitations.md` "screenshots
  not captured" notes stay accurate until the V1-VIS corpus baselines land
  (§6.2).
- The 133-identifier one-to-one matrix (§3) is the authoritative traceability
  map for Phase 1 planning and release gating.

> This document is the **approved** Phase-1 scope and decision record (§0,
> R0.4, 2026-10-09). It records the approval only; feature implementation is
> **not** authorized by this document. Phase-1 implementation begins in a
> separate, explicitly authorized task after this checkpoint. **M1, M2, M3, M4,
> M5 and M6 have been delivered** (R0.5/R0.6, R0.7, R0.9/R0.10, R0.11, R0.13 and
> R0.14 respectively; the M4 PDF-geometry evidence was hardened in R0.12) on the
> strength of separate, explicitly authorized tasks following the AGENTS.md
> checkpoint workflow; **M7–M11 (and the Markdown import) have not been
> started.**