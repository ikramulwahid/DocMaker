# ADR-005: Reusable Style System (M1)

- **Status:** Accepted (M1, 2026-10-10)
- **Context:** V1-STYLE-001..004 (MUST) require reusable styles (Normal,
  Title, Subtitle, Heading 1–4, Body Text, Note, Warning, Definition, Caption,
  Table Text, Header, Footer, Reference), per-block style **assignment**
  instead of manually duplicated formatting, definition-driven **re-render of
  every user**, and **persistence** of custom styles through edit → save →
  reopen. V1-TXT-001 requires the style-based text types; V1-DOC-002 requires
  a base-style default for new documents. Before M1 the IR had **no** style
  model: blocks carried neither formatting nor style references, the renderer
  hard-coded label typography, and the editor exposed no style concept.
  `schema_version` is `1.0` under ADR-004, so the addition must be additive
  and backward compatible.

## Decision

Introduce a canonical, document-level **style library** as the single source of
presentation for text blocks:

- **IR shape:** `document.styles` is a `Record<styleId, StyleDefinition>`.
  A `StyleDefinition` is `{ id, name, kind }` where `kind` is
  `"paragraph" | "heading" | "tableText"` (headings carry a semantic
  `headingLevel` 1–6), plus an allow-listed `format` token set: `fontSizePt`,
  `lineHeight`, `fontFamily` (`inherit | serif | sans | mono`), `alignment`,
  `bold`, `italic`, `color` (`#rrggbb`), `textTransform`
  (`none | uppercase`), `indentMm`, `marginTopMm`, `marginBottomMm`. Values
  are typed and schema-validated (`styleFormatSchema`); invalid tokens are
  **rejected at the schema boundary**, never sanitized into arbitrary CSS.
- **References, not duplication (AGENTS.md §58):** `paragraph` and `heading`
  blocks carry a single `style: StyleId | null` reference. `null` means
  "derive": paragraph → `normal`, heading level N → `heading-N`. No block
  ever duplicates formatting tokens; the renderer derives all presentation
  from the resolved definition.
- **Stable ids:** style ids match `^[a-z][a-z0-9-]{0,31}$` (e.g.
  `heading-2`, `custom-x`). Visible labels (`name`) are never identity.
  The layout engine maps a style id to the CSS class `doc-style-<id>`; the
  Tiptap DOM attribute is `data-ir-style` (an attribute literally named
  `style` would be emitted by Tiptap as inline CSS — rejected by doctrine,
  so the editor JSON attribute is `style` and the DOM attribute is
  `data-ir-style`).
- **Built-ins (V1-STYLE-001):** a fixed built-in library
  (`BUILTIN_STYLE_IDS`, `src/core/ir/styles.ts`) covers all sixteen listed
  styles plus Heading 5/6 (kept working), Quote and Important Notice
  (V1-TXT-001 style-based types). Built-ins are present on every document
  (`buildDefaultStyles()` default) and cannot be deleted; they may be
  redefined by the user, and their defaults are theme-driven (mostly null
  tokens; title 22pt/bold/center, caption 9pt/center, note italic, warning
  bold, quote italic + 8 mm indent, reference 10.5 pt/italic, header/footer
  and table-text 9 pt).
- **Deterministic fallback (AGENTS.md §46/§64, §112):** a reference to a
  deleted/unknown style never throws and never loses content: the block keeps
  its id and its explicit reference, `resolveStyleDefinition` substitutes the
  documented safe default (`defaultFallbackStyle()`, normal-shaped), and the
  renderer emits **no** CSS rule for the unknown id — the block renders with
  defaults. Removing a custom style and re-rendering is the same path as
  deleting it in the UI.
- **Compatibility (ADR-004):** all additions are additive with safe defaults.
  A legacy style-less `labdoc/1.0` document loads uncorrupted: blocks without
  a `style` field become `style: null` and derive the documented built-ins at
  resolve time; `document.styles` fills with the built-in library default, so
  the document renders identically to before and the library is persisted on
  next save. `schema_version` stays `1.0`.
- **Editing model:** the store is the only mutator of definitions —
  `setStyleDefinition` re-validates the merged format via `styleFormatSchema`
  before touching the IR, `addCustomStyle` creates a document-local custom
  style, `removeCustomStyle` refuses built-ins. The sidebar edits a
  definition in place; the shared resolve→layout pipeline is re-run, so every
  block referencing the style re-renders (V1-STYLE-003) while ids, content,
  numbering and metadata are untouched by construction (pure transformation,
  AGENTS.md §57).
- **UI boundary:** a toolbar `style` select assigns the reference
  (V1-STYLE-002); the sidebar lists the library, edits definitions, creates
  and removes custom styles. No arbitrary CSS/HTML entry anywhere — the
  editor accepts only validated style ids, the layout emits only generated
  CSS for resolved definitions.

## Alternatives considered

- **Per-block direct formatting (Word model):** rejected — duplicates
  presentation, defeats V1-STYLE-003/004, violates AGENTS.md §58/§112.
- **CSS classes entered by the user:** rejected — arbitrary CSS/HTML
  injection surface; violates the allow-listed-tokens rule and the untrusted
  input policy (AGENTS.md §27, §61).
- **Hard-coded renderer typography per block type:** rejected — cannot
  represent style assignment, modification or persistence.
- **Schemaless `format` passthrough (any object):** rejected — no validation,
  no deterministic rendering, weak schema discipline (AGENTS.md §14/§40).

## Consequences

- All four V1-STYLE criteria plus the V1-TXT-001 style-based types and the
  V1-DOC-002 base-style leg are implemented and evidenced
  (`tests/unit/styles.test.ts`, `adapter.test.ts`, golden-04, e2e).
- `schema_version` remains `1.0`; older `1.0` documents load unchanged
  (proven by legacy round-trip tests), newer saves persist the style library.
- Custom styles live in the document (document.scoped), not the theme —
  themes continue to control presentation defaults; changing a theme leaves
  definitions and assignments unchanged (tested).
- Cost: every paragraph/heading serializes a `style` field (null or id) and
  every document carries the built-in `styles` map — accepted overhead for a
  canonical, extensible style system; M2 formatting will ride on the same
  definitions.