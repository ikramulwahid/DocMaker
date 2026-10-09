# ADR-004: JSON Schema Versioning Policy

- **Status:** Accepted (Phase 0, 2026-10-09)
- **Context:** the wire format is the versioned `labdoc` envelope
  (`src/core/ir/schema.ts` → `envelopeSchema`, `SCHEMA_NAME = "labdoc"`,
  `SCHEMA_VERSION = "1.0"`), emitted and accepted only through
  `src/core/json/envelope.ts`. During Phase 0 the IR gained additive features
  while `schema_version` stayed `1.0`: `settings.theme`, `equation` blocks,
  per-section `pageNumberStart` / `showPageNumber`, watermark fields and more.
  We must decide whether that is legitimate development-format evolution or a
  silent contract violation that requires a version bump and a migration.

## Decision

`schema_version "1.0"` **is the unreleased development format**, and the
Phase-0 additions are **additive and backward compatible**:

- Every new field has a Zod default or is nullable — `theme` → `lab_default`,
  `watermark` → `DRAFT`, `pageNumberStart` → `1`, `showPageNumber` → `true`,
  `equation` blocks are simply absent in older documents. A document written
  before a field existed therefore loads unchanged and renders with the
  semantics its author intended.
- **No migration code is shipped.** Nothing has been released, so there are no
  external `labdoc` documents to migrate, and every `1.0` document produced at
  an earlier Phase-0 checkpoint loads as-is (proven by
  `tests/unit/roundtrip.test.ts` — "loads a legacy 1.0 envelope that predates
  additive fields").
- The envelope is the **only accepted interchange format**. Bare document IR
  without `{ schema, schema_version, document }` is rejected explicitly — it is
  never silently auto-wrapped (`deserializeDocument`).
- A `labdoc` envelope reporting any `schema_version` other than `1.0` is
  rejected with an **actionable error** naming the reported version and this
  build's supported version; it is never silently mis-parsed
  (`src/core/json/envelope.ts`).

## Policy going forward

1. **Additive, defaulted fields** (new block types, new optional settings,
   extra metadata) keep `1.0` during pre-release.
2. A **backward-incompatible change** (removed/renamed field with no default,
   changed meaning of an existing field) bumps `SCHEMA_VERSION` and requires a
   versioned, tested migration path that upgrades older envelopes on load —
   covered by round-trip + golden tests — before the new version is accepted.
3. Serialization is a single code path (`serializeDocument`), so files saved
   by the app always carry the current envelope/version; drift between saved
   files and the schema is impossible by construction.

## Consequences

- No breaking change for any document produced at a Phase-0 checkpoint.
- Loading a document from a future build fails loudly and actionably instead
  of corrupting silently.
- When the first real release ships, `1.0` becomes the released baseline; any
  post-release incompatible change then bumps to `2.0` under this policy.