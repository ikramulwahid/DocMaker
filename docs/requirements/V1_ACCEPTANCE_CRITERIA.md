# V1 ACCEPTANCE CRITERIA

## Laboratory Document Maker

### Version 1 — Document Editor & Formatting Foundation

---

# 1. Purpose

This document defines the acceptance criteria for **V1 of DocMaker**.

V1 establishes the foundational structured-document authoring system and must provide a reliable basis for later:

* controlled-document lifecycle
* approval
* revision management
* cross-references
* forms
* calculations
* units
* advanced import
* AI generation

V1 is **not** intended to implement the entire long-term laboratory document platform.

V1 is accepted only when the application demonstrates that its foundational architecture can support professional laboratory documentation without compromising the canonical Document IR.

---

# 2. V1 Product Definition

V1 is a:

> **Single-user, local-first desktop laboratory document authoring application with a structured document model, professional editor, live paginated preview, themes, metadata, basic numbering, local JSON persistence, and PDF rendering/export.**

V1 must run without:

* login
* authentication
* user account
* backend server
* cloud database
* mandatory internet connectivity

Core document-authoring functionality must operate locally.

---

# 3. V1 Acceptance Gate

V1 is considered accepted only when all of the following are true:

```text
[ ] Application installs and launches successfully
[ ] Core authoring works without a backend
[ ] Document IR is the canonical source of truth
[ ] Documents can be created and edited
[ ] Metadata can be managed
[ ] Styles work correctly
[ ] H1-H4 hierarchy works
[ ] Lists work
[ ] Tables work
[ ] Images work
[ ] Sections/page settings work
[ ] Header/footer works
[ ] Dynamic fields work
[ ] Basic numbering works
[ ] 20 themes exist
[ ] 5 B&W themes exist
[ ] Theme switching preserves semantics
[ ] Live page preview works
[ ] PDF output works
[ ] JSON save/load works
[ ] JSON round trip preserves document semantics
[ ] Representative golden documents pass
[ ] No critical data-loss defects remain
[ ] No critical rendering defects remain
```

A feature may not be marked "complete" merely because its UI exists.

---

# 4. ACCEPTANCE LEVELS

Use these classifications:

## MUST PASS

Required for V1 release.

## SHOULD PASS

Expected for V1 unless a documented technical limitation exists.

## DEFERRED

Explicitly outside V1.

A deferred capability must not compromise the V1 architecture.

---

# 5. PLATFORM ACCEPTANCE

## V1-PLAT-001 — Application launches

**Priority:** MUST PASS

The packaged application must:

1. Install successfully on the supported target desktop platform.
2. Launch without a backend.
3. Open the main workspace.
4. Create a blank document.

**Pass condition:**

A fresh installation can start the application and create a document without network connectivity.

---

## V1-PLAT-002 — Offline core operation

**Priority:** MUST PASS

Core functions must operate without internet:

* create
* edit
* format
* preview
* save JSON
* load JSON
* theme switching
* PDF export, subject to local renderer requirements

**Pass condition:**

Disconnect network access and perform the above operations successfully.

---

## V1-PLAT-003 — No login

**Priority:** MUST PASS

V1 must not require authentication.

There must be no blocking login screen.

---

# 6. DOCUMENT IR ACCEPTANCE

## V1-IR-001 — Canonical document representation

**Priority:** MUST PASS

The application must have a structured Document IR.

The editor must not be the authoritative source of document semantics.

**Pass condition:**

A document can be represented independently of the editor UI and rendered from the Document IR.

---

## V1-IR-002 — Stable document identity

**Priority:** MUST PASS

Each document must have a stable unique ID.

Reloading the same JSON must preserve the document identity.

---

## V1-IR-003 — Stable semantic object IDs

**Priority:** MUST PASS

Referenceable objects must have stable IDs.

At minimum:

* sections
* headings
* tables
* figures/images
* equations where implemented
* semantic blocks

Visible numbering must not be used as the permanent object ID.

---

## V1-IR-004 — Semantic blocks

**Priority:** MUST PASS

Core content must be represented as semantic blocks rather than only raw HTML.

At minimum:

* paragraph
* heading
* list
* table
* image
* page break
* section

---

# 7. DOCUMENT CREATION

## V1-DOC-001 — New document

**Priority:** MUST PASS

The user can create a new blank document.

---

## V1-DOC-002 — New document defaults

**Priority:** MUST PASS

New documents have sensible defaults:

* A4
* Portrait
* standard margins
* base style
* default theme
* initial metadata structure

Defaults must be configurable where appropriate.

---

## V1-DOC-003 — Document editing

**Priority:** MUST PASS

The user can:

* type text
* edit text
* delete text
* move cursor
* select text
* undo
* redo
* copy
* paste

without corrupting the document model.

---

# 8. TEXT AND STRUCTURE

## V1-TXT-001 — Text blocks

**Priority:** MUST PASS

Support:

* Paragraph
* Title
* Subtitle
* Body Text
* Caption
* Quote
* Note
* Warning
* Important Notice
* Definition

---

## V1-TXT-002 — Heading hierarchy

**Priority:** MUST PASS

Support:

* H1
* H2
* H3
* H4

The hierarchy must be semantic.

The displayed heading level must not depend merely on font size.

---

## V1-TXT-003 — Heading structure

**Priority:** MUST PASS

The document engine can identify all headings and their levels independently of their visual formatting.

---

# 9. TEXT FORMATTING

## V1-FMT-001 — Character formatting

**Priority:** MUST PASS

Support:

* font family
* font size
* bold
* italic
* underline
* strikethrough
* superscript
* subscript
* text color
* highlight

---

## V1-FMT-002 — Paragraph formatting

**Priority:** MUST PASS

Support:

* left
* center
* right
* justify
* line spacing
* paragraph spacing
* indentation

---

## V1-FMT-003 — Advanced text formatting

**Priority:** SHOULD PASS

Where practical in the selected editor technology:

* uppercase/lowercase
* small caps
* character spacing
* letter spacing
* paragraph borders
* paragraph shading
* hanging indentation
* tab stops

A limitation must be documented rather than silently omitted.

---

# 10. STYLE SYSTEM

## V1-STYLE-001 — Reusable styles

**Priority:** MUST PASS

The application provides reusable styles including:

* Normal
* Title
* Subtitle
* Heading 1
* Heading 2
* Heading 3
* Heading 4
* Body Text
* Note
* Warning
* Definition
* Caption
* Table Text
* Header
* Footer
* Reference

---

## V1-STYLE-002 — Style assignment

**Priority:** MUST PASS

A block can reference a style rather than requiring manually duplicated formatting.

---

## V1-STYLE-003 — Style modification

**Priority:** MUST PASS

Changing the definition of a style updates all document content using that style.

---

## V1-STYLE-004 — Style persistence

**Priority:** MUST PASS

Custom style changes survive:

```text
edit
→ save JSON
→ close
→ reopen
```

---

# 11. LISTS

## V1-LIST-001 — Bullets

**Priority:** MUST PASS

Support at minimum:

* circle
* empty circle
* square
* dash
* arrow
* check mark

---

## V1-LIST-002 — Numbered lists

**Priority:** MUST PASS

Support at minimum:

* 1, 2, 3
* A, B, C
* a, b, c
* I, II, III
* i, ii, iii

---

## V1-LIST-003 — Basic automatic list numbering

**Priority:** MUST PASS

Inserting, removing, or reordering list items updates visible numbering automatically.

---

## V1-LIST-004 — Multilevel lists

**Priority:** SHOULD PASS

Support hierarchical numbering such as:

```text
1. Purpose
2. Scope
3. Responsibilities
   3.1 Laboratory Manager
   3.2 Quality Manager
4. Procedure
   4.1 Sample Receipt
      4.1.1 Identification
```

If advanced multilevel behavior is incomplete, it must be explicitly tracked rather than represented as finished functionality.

---

# 12. PAGE SETUP

## V1-PAGE-001 — Page sizes

**Priority:** MUST PASS

Support:

* A4
* A3
* A5
* Letter
* Legal
* Tabloid
* Executive
* Custom size

---

## V1-PAGE-002 — Orientation

**Priority:** MUST PASS

Support:

* Portrait
* Landscape

---

## V1-PAGE-003 — Margins

**Priority:** MUST PASS

Support:

* top
* bottom
* left
* right

---

## V1-PAGE-004 — Document-level page settings

**Priority:** MUST PASS

Page settings can be configured at document level.

---

# 13. SECTIONS

## V1-SEC-001 — First-class sections

**Priority:** MUST PASS

The document model must contain semantic sections.

---

## V1-SEC-002 — Section-level layout

**Priority:** MUST PASS

A section can define:

* page size
* orientation
* margins
* header
* footer

---

## V1-SEC-003 — Mixed orientation

**Priority:** MUST PASS

The following must render correctly:

```text
Section 1 — Portrait
Section 2 — Landscape
Section 3 — Portrait
```

The application must not fake landscape sections using arbitrary visual hacks.

---

# 14. PAGE FLOW

## V1-FLOW-001 — Page break

**Priority:** MUST PASS

User can insert an explicit page break.

---

## V1-FLOW-002 — Section break

**Priority:** MUST PASS

User can create section boundaries.

---

## V1-FLOW-003 — Keep with next

**Priority:** SHOULD PASS

A heading can remain with the following paragraph/block when the layout engine supports it.

---

## V1-FLOW-004 — Keep together

**Priority:** SHOULD PASS

Configured blocks can avoid inappropriate splitting.

---

# 15. TABLES

## V1-TABLE-001 — Insert table

**Priority:** MUST PASS

User can choose rows and columns and insert a table.

---

## V1-TABLE-002 — Table editing

**Priority:** MUST PASS

Support:

* add row
* delete row
* add column
* delete column
* edit cell content

---

## V1-TABLE-003 — Merge cells

**Priority:** MUST PASS

Cells can be merged.

---

## V1-TABLE-004 — Cell alignment

**Priority:** MUST PASS

Support:

* horizontal alignment
* vertical alignment

---

## V1-TABLE-005 — Table formatting

**Priority:** MUST PASS

Support:

* borders
* border thickness
* cell background
* padding
* column widths
* row height

---

## V1-TABLE-006 — Header row

**Priority:** MUST PASS

A table can define a header row.

---

## V1-TABLE-007 — Multi-page table

**Priority:** MUST PASS

A table spanning multiple pages must remain structurally correct.

The table header repeats when configured.

---

## V1-TABLE-008 — Row split behavior

**Priority:** MUST PASS

The renderer must not split a row inappropriately where the configured table policy prohibits splitting.

---

## V1-TABLE-009 — Table caption and identity

**Priority:** MUST PASS

A table can have:

* stable ID
* caption
* generated table number

The number is not manually hard-coded.

---

# 16. IMAGES

## V1-IMG-001 — Insert image

**Priority:** MUST PASS

The user can insert an image from the local filesystem.

---

## V1-IMG-002 — Resize

**Priority:** MUST PASS

The user can resize an image.

---

## V1-IMG-003 — Alignment

**Priority:** MUST PASS

The image can be aligned appropriately.

---

## V1-IMG-004 — Caption

**Priority:** MUST PASS

Images can have captions.

---

## V1-IMG-005 — Figure identity

**Priority:** MUST PASS

Images that participate as figures have stable IDs and can receive generated figure numbering.

---

# 17. HEADER AND FOOTER

## V1-HF-001 — Header

**Priority:** MUST PASS

The user can configure a document header.

---

## V1-HF-002 — Footer

**Priority:** MUST PASS

The user can configure a document footer.

---

## V1-HF-003 — Dynamic metadata in header/footer

**Priority:** MUST PASS

Header/footer may display fields such as:

```text
document number
title
revision
effective date
laboratory name
```

---

## V1-HF-004 — Page numbering

**Priority:** MUST PASS

Support:

```text
Page X
Page X of Y
```

The displayed page numbers must update automatically as pagination changes.

---

# 18. METADATA

## V1-META-001 — Structured document metadata

**Priority:** MUST PASS

Support fields including:

* document number
* title
* document type
* department
* revision
* effective date
* review date
* status
* prepared by
* reviewed by
* approved by
* confidentiality/classification where applicable

---

## V1-META-002 — Metadata panel

**Priority:** MUST PASS

The user can view and edit metadata through a dedicated interface.

---

## V1-META-003 — Metadata as source of truth

**Priority:** MUST PASS

Changing metadata updates linked dynamic occurrences.

---

# 19. DYNAMIC FIELDS

## V1-FIELD-001 — Document fields

**Priority:** MUST PASS

Support:

```text
{{document.number}}
{{document.title}}
{{document.revision}}
{{document.effective_date}}
{{document.review_date}}
{{document.status}}
```

---

## V1-FIELD-002 — Laboratory fields

**Priority:** MUST PASS

Support a configurable laboratory profile with fields such as:

```text
{{laboratory.name}}
{{laboratory.address}}
{{laboratory.logo}}
```

---

## V1-FIELD-003 — Page fields

**Priority:** MUST PASS

Support:

```text
{{page.number}}
{{page.total}}
```

---

## V1-FIELD-004 — Unresolved field detection

**Priority:** MUST PASS

The system must identify unresolved required fields before final export.

---

# 20. AUTOMATIC NUMBERING

## V1-NUM-001 — Heading numbering

**Priority:** MUST PASS

Support automatic heading numbering.

---

## V1-NUM-002 — Table numbering

**Priority:** MUST PASS

Tables receive generated numbers.

---

## V1-NUM-003 — Figure numbering

**Priority:** MUST PASS

Figures receive generated numbers where configured.

---

## V1-NUM-004 — Dynamic renumbering

**Priority:** MUST PASS

Adding/removing/reordering numbered objects updates downstream numbering automatically.

---

## V1-NUM-005 — Numbering persistence

**Priority:** MUST PASS

Numbering rules survive JSON save/load.

---

# 21. BASIC REFERENCES

## V1-REF-001 — Stable reference target

**Priority:** MUST PASS

Referenceable objects use stable IDs.

---

## V1-REF-002 — Basic cross-reference

**Priority:** SHOULD PASS

At minimum support cross-reference to:

* headings
* tables
* figures

---

## V1-REF-003 — Reference updates

**Priority:** SHOULD PASS

When a referenced object's visible number changes, the cross-reference updates automatically.

---

# 22. EQUATIONS

## V1-EQ-001 — Structured equation insertion

**Priority:** SHOULD PASS

The editor should support structured mathematical equations.

---

## V1-EQ-002 — Scientific notation

**Priority:** MUST PASS

The system must be able to represent common scientific notation such as:

```text
H₂O
CO₂
m²
m³
10⁻³
μ
σ
Δ
±
≤
≥
≈
≠
√
Σ
```

---

## V1-EQ-003 — Semantic equation storage

**Priority:** MUST PASS

Equations must not be stored only as image screenshots.

---

# 23. THEMES

## V1-THEME-001 — Theme count

**Priority:** MUST PASS

At least 20 themes must be available.

---

## V1-THEME-002 — B&W themes

**Priority:** MUST PASS

At least 5 themes must be deliberately B&W-oriented.

---

## V1-THEME-003 — Live theme switching

**Priority:** MUST PASS

The user can switch themes while viewing the document.

---

## V1-THEME-004 — Semantic preservation

**Priority:** MUST PASS

Changing a theme must NOT change:

* document content
* metadata
* object IDs
* references
* numbering identities
* field definitions
* calculations

Only presentation may change.

---

# 24. LIVE PREVIEW

## V1-PREV-001 — Side-by-side interface

**Priority:** MUST PASS

The main workflow supports:

```text
Editor | Live Preview
```

---

## V1-PREV-002 — Page-oriented preview

**Priority:** MUST PASS

The preview shows document pages rather than an unbounded text canvas alone.

---

## V1-PREV-003 — Pagination visibility

**Priority:** MUST PASS

The preview visibly reflects:

* page boundaries
* page count
* headers
* footers
* page numbers
* section changes

---

## V1-PREV-004 — Preview responsiveness

**Priority:** MUST PASS

Normal editing actions update preview without requiring manual full reload.

---

# 25. PAGINATION

## V1-PAG-001 — A4 pagination

**Priority:** MUST PASS

Normal documents paginate correctly onto A4 pages.

---

## V1-PAG-002 — Header/footer interaction

**Priority:** MUST PASS

Body content must not overlap headers or footers.

---

## V1-PAG-003 — Page count

**Priority:** MUST PASS

The system correctly calculates total pages for supported document content.

---

## V1-PAG-004 — Mixed sections

**Priority:** MUST PASS

Different section orientations and page sizes paginate correctly.

---

## V1-PAG-005 — Table pagination

**Priority:** MUST PASS

Tables paginate correctly over multiple pages.

---

## V1-PAG-006 — Deterministic pagination

**Priority:** MUST PASS

Given the same:

```text
Document IR
+
styles
+
theme
+
renderer configuration
```

the application should produce equivalent page structure consistently.

---

# 26. PDF OUTPUT

## V1-PDF-001 — PDF generation

**Priority:** MUST PASS

A valid PDF can be generated from a supported document.

---

## V1-PDF-002 — PDF visual correctness

**Priority:** MUST PASS

Generated PDFs must correctly represent:

* text
* headings
* tables
* images
* sections
* headers
* footers
* page numbers
* theme
* page dimensions

---

## V1-PDF-003 — PDF pagination parity

**Priority:** MUST PASS

The final PDF must follow the same semantic/layout decisions shown in preview, subject to known renderer-specific differences.

---

# 27. JSON SAVE/LOAD

## V1-JSON-001 — Save document

**Priority:** MUST PASS

The user can save a document to `.json`.

---

## V1-JSON-002 — Load document

**Priority:** MUST PASS

The user can open a saved `.json` document.

---

## V1-JSON-003 — Versioned schema

**Priority:** MUST PASS

The JSON includes an explicit schema/version identifier.

Example:

```json
{
  "schema": "labdoc",
  "schema_version": "1.0"
}
```

---

## V1-JSON-004 — Round-trip

**Priority:** MUST PASS

The following must preserve semantic equivalence:

```text
Create
→ Save JSON
→ Close
→ Open JSON
→ Render
```

---

## V1-JSON-005 — Document identity preservation

**Priority:** MUST PASS

The document ID and stable semantic object IDs survive JSON round trip.

---

## V1-JSON-006 — Invalid JSON handling

**Priority:** MUST PASS

Malformed/invalid JSON must produce an understandable error.

It must not crash the application or silently create corrupted content.

---

# 28. AUTOSAVE/RECOVERY

## V1-AUTO-001 — Draft recovery

**Priority:** SHOULD PASS

Where implemented, temporary autosave/recovery should allow the user to recover recent work after an application interruption.

Recovery must not overwrite an intentional saved document without user awareness.

---

# 29. DOCUMENT IMPORT — V1 SCOPE

Import is divided into different support levels.

## V1-IMP-001 — Markdown

**Priority:** SHOULD PASS for V1

Support:

* headings
* paragraphs
* lists
* basic formatting
* basic tables

---

## V1-IMP-002 — DOCX

**Priority:** DEFERRED / V1.1 unless already proven

The V1 architecture must provide a clean import boundary.

If implemented in V1, supported structures must be explicitly documented.

---

## V1-IMP-003 — PDF

**Priority:** DEFERRED / V1.1 unless already proven

PDF import must be treated as extraction/reconstruction.

Do not claim perfect semantic reconstruction.

---

## V1-IMP-004 — DOC

**Priority:** DEFERRED

Legacy DOC support must not delay the V1 foundation.

---

# 30. IMPORT ACCEPTANCE PRINCIPLE

## V1-IMP-005 — Import acceptance principle

For supported import formats:

```text
source
→ parser
→ structure mapping
→ Document IR
→ editor
```

The result must enter the editable document model.

Imported content must not become a non-editable screenshot or opaque blob unless that is an explicitly chosen fallback.

---

# 31. CONTROLLED-DOCUMENT COMPONENT

## V1-CD-001

**Priority:** DEFERRED to V1.2 unless a simplified foundation version is already available.

The Document IR must be designed so that a smart controlled-document block can later reference metadata.

A plain manually formatted table is not considered an implementation of the future semantic component.

---

# 32. FORMS

## V1-FORM-001

**Priority:** DEFERRED

V1 must reserve a semantic extension point for future structured fields.

The architecture must not force forms to be represented as ordinary paragraphs forever.

---

# 33. CALCULATIONS AND UNITS

## V1-CALC-001

**Priority:** DEFERRED

V1 need not provide the full calculation engine.

However, the Document IR must not make it impossible to later represent:

```text
quantity
unit
formula
calculated value
precision
significant figures
```

---

# 34. LIFECYCLE AND APPROVAL

## V1-LIFE-001

**Priority:** DEFERRED to V1.2

V1 does not require full controlled-document workflow.

However, the document model should reserve appropriate structures for:

* status
* revision
* approval
* lifecycle
* revision history

---

# 35. RENDERING ARCHITECTURE ACCEPTANCE

## V1-REN-001 — Shared semantic pipeline

**Priority:** MUST PASS

Preview and PDF must be generated from the same canonical Document IR.

---

## V1-REN-002 — No hard-coded sample rendering

**Priority:** MUST PASS

The renderer must operate on arbitrary supported Document IR instances.

It must not depend on hard-coded sample document content.

---

## V1-REN-003 — No page-number hardcoding

**Priority:** MUST PASS

Page numbers must be generated by the rendering system.

---

# 36. PERFORMANCE ACCEPTANCE

## V1-PERF-001

**Priority:** MUST PASS

The editor should remain practically usable for representative laboratory documents.

Minimum representative test document:

* 20+ pages
* 10+ tables
* 10+ images
* multiple headings
* headers/footers
* multiple sections

The application must not become unusably slow during ordinary editing.

Exact performance thresholds should be established after collecting baseline measurements.

---

# 37. DATA INTEGRITY ACCEPTANCE

## V1-DATA-001

**Priority:** MUST PASS

No supported editing operation may silently delete or corrupt:

* document content
* metadata
* styles
* stable IDs
* tables
* images
* section definitions

---

## V1-DATA-002

**Priority:** MUST PASS

Changing theme must preserve semantic document data.

---

## V1-DATA-003

**Priority:** MUST PASS

Saving and reopening a document must preserve semantic content.

---

# 38. ERROR HANDLING ACCEPTANCE

## V1-ERR-001

**Priority:** MUST PASS

Errors must be visible and understandable.

Examples:

```text
Unable to load document.
```

must be accompanied, where possible, by the reason.

---

## V1-ERR-002

**Priority:** MUST PASS

Unsupported imported structures must not silently disappear.

---

## V1-ERR-003

**Priority:** MUST PASS

A malformed JSON file must not crash the application.

---

# 39. SECURITY ACCEPTANCE FOR A LOCAL SINGLE-USER APP

No login or authentication is required.

Nevertheless:

## V1-SECU-001

**Priority:** MUST PASS

The application must not execute arbitrary imported document content.

---

## V1-SECU-002

**Priority:** MUST PASS

The application must not execute arbitrary JavaScript supplied through calculation/formula fields.

---

## V1-SECU-003

**Priority:** MUST PASS

Imported files are treated as untrusted input.

---

# 40. TEST ACCEPTANCE

## V1-TEST-001 — Automated tests

**Priority:** MUST PASS

Core Document IR functionality has automated tests.

---

## V1-TEST-002 — JSON tests

**Priority:** MUST PASS

Serialization/deserialization has automated tests.

---

## V1-TEST-003 — Numbering tests

**Priority:** MUST PASS

Automatic numbering has automated tests.

---

## V1-TEST-004 — Rendering tests

**Priority:** MUST PASS

Representative documents have rendering tests.

---

## V1-TEST-005 — Golden documents

**Priority:** MUST PASS

The project has a golden-document corpus.

At minimum:

```text
basic-sop
multi-page
table-heavy
mixed-orientation
header-footer
theme-heavy
image-heavy
metadata-heavy
```

---

## V1-TEST-006 — End-to-end tests

**Priority:** MUST PASS

The application has tests covering at least:

```text
Create document
→ edit
→ save JSON
→ reopen
→ preview
→ PDF export
```

---

# 41. VISUAL REGRESSION ACCEPTANCE

## V1-VIS-001

**Priority:** MUST PASS

Representative documents are visually checked for:

* page boundaries
* headings
* tables
* images
* header/footer
* page numbers
* section transitions

---

# 42. THEME REGRESSION

## V1-VIS-002

For a representative document:

```text
Theme 01
→ Theme 02
→ Theme 03
→ Theme 15
→ Theme 16
...
```

the document must remain semantically equivalent.

The visual presentation may differ.

---

# 43. ACCESSIBILITY ACCEPTANCE

## V1-A11Y-001

**Priority:** SHOULD PASS

The main editor interface must support:

* keyboard navigation
* accessible labels
* logical focus
* usable controls
* accessible form/dialog messages

---

# 44. DOCUMENTATION ACCEPTANCE

## V1-DOCU-001 — Documentation acceptance

**Priority:** MUST PASS

The repository contains current documentation for:

* architecture
* Document IR
* JSON schema
* development setup
* test commands
* renderer architecture
* known limitations

---

# 45. TECHNOLOGY ACCEPTANCE

## V1-TECH-001 — Technology baseline

V1 should use the selected technology baseline:

```text
Tauri
React
TypeScript
Vite
Tiptap/ProseMirror
Zustand
pnpm
```

with appropriate document-processing/rendering libraries.

Exact library versions may evolve.

The final pagination/rendering library must be validated by the Phase-0 proof of concept rather than selected purely by assumption.

---

# 46. PHASE-0 RENDERING ACCEPTANCE

## V1-GATE-001 — Phase-0 rendering acceptance gate

Before V1 rendering architecture is considered stable, demonstrate a document containing:

```text
Page 1     A4 Portrait
Page 2     A4 Portrait
Page 3     A4 Landscape
Page 4     A4 Landscape
Page 5     A4 Portrait
```

and include:

* heading numbering
* table numbering
* multi-page table
* repeated table headers
* header
* footer
* Page X of Y
* image
* equation
* watermark
* theme
* dynamic document fields

The preview and exported PDF must represent the same logical structure.

This is a **release gate**, not merely a demonstration.

---

# 47. V1 NON-GOALS

The following are explicitly outside the required V1 acceptance boundary unless already implemented without compromising the release:

* user login
* authentication
* remote collaboration
* cloud storage
* multi-user workflow
* centralized database
* full NABL compliance certification
* complete Microsoft Word feature parity
* arbitrary PDF-to-original-document fidelity
* complete legacy DOC fidelity
* advanced electronic signature infrastructure
* cryptographic digital-signature workflow
* full laboratory information system
* complete calculation/unit engine
* full controlled-document lifecycle
* complete AI document-generation platform

These remain future phases.

---

# 48. RELEASE-BLOCKING DEFECTS

## V1-GATE-002 — Release-blocking defects

V1 must NOT be released with a known critical defect involving:

* document data loss
* JSON corruption
* inability to reopen saved documents
* incorrect document IDs
* incorrect basic numbering
* severe PDF corruption
* incorrect section orientation
* major table corruption
* preview showing content that disappears from export
* uncontrolled mutation of persistent document data
* application crash on normal supported workflows

---

# 49. ACCEPTANCE DEMONSTRATION

## V1-DEMO-001 — Final acceptance demonstration

The final V1 demonstration should create a realistic laboratory SOP.

Example:

```text
Document Title:
Sample Receipt Procedure

Document No:
SOP-SAM-001

Revision:
01

Department:
Sample Reception
```

The document should contain:

```text
Controlled-style metadata area
1. Purpose
2. Scope
3. Responsibilities
4. Procedure
   4.1 Receipt
   4.2 Identification
   4.3 Acceptance
   4.4 Rejection
5. Records
6. References

Table 1 — Sample Acceptance Criteria

Figure 1 — Sample Flow

Header:
Laboratory Name
SOP-SAM-001
Rev 01

Footer:
SOP-SAM-001 | Rev 01 | Page X of Y
```

The user must be able to:

```text
create
→ edit
→ format
→ change theme
→ modify metadata
→ see preview update
→ save JSON
→ close
→ reopen JSON
→ verify content
→ export PDF
```

without a backend.

---

# 50. FINAL V1 ACCEPTANCE STATEMENT

## V1-GATE-003 — Final acceptance statement

V1 is accepted when the application demonstrates all of the following:

> A single user can locally create a structured laboratory document, edit it using a professional document editor, apply reusable styles, structure content using headings/lists/tables/images, configure pages and sections, use metadata and dynamic fields, automatically number supported objects, view a live paginated preview, switch among 20 themes including at least 5 B&W themes, save and reload the document as versioned JSON, and generate a reliable PDF whose structure and pagination are consistent with the preview.

The underlying implementation must demonstrate that:

> **The Document IR—not the editor DOM, HTML, PDF, or DOCX—is the authoritative representation of the document.**

And:

> **The V1 architecture must leave clean extension points for the next phases: cross-references, controlled-document components, lifecycle/approval, forms, calculations, units, advanced imports, and AI generation.**

---

# 51. V1 RELEASE CHECKLIST

## V1-GATE-004 — V1 release checklist

```text
PRODUCT
[ ] Local single-user application works
[ ] No backend required
[ ] No login required
[ ] Offline core workflow works

DOCUMENT MODEL
[ ] Document IR implemented
[ ] Stable IDs implemented
[ ] Versioned JSON schema implemented

EDITOR
[ ] Text editing
[ ] H1-H4
[ ] Lists
[ ] Formatting
[ ] Styles
[ ] Tables
[ ] Images

LAYOUT
[ ] A4
[ ] Other supported sizes
[ ] Margins
[ ] Portrait
[ ] Landscape
[ ] Sections
[ ] Header
[ ] Footer
[ ] Page numbering
[ ] Basic pagination

DOCUMENT FEATURES
[ ] Metadata
[ ] Dynamic fields
[ ] Basic numbering
[ ] Basic references

THEMES
[ ] 20 themes
[ ] 5 B&W themes
[ ] Live switching
[ ] Semantic preservation

PERSISTENCE
[ ] Save JSON
[ ] Load JSON
[ ] JSON round-trip
[ ] Invalid JSON handling

RENDERING
[ ] Live page preview
[ ] PDF output
[ ] Preview/PDF semantic parity

QUALITY
[ ] Unit tests
[ ] Integration tests
[ ] E2E tests
[ ] Golden documents
[ ] Visual regression
[ ] No critical data-loss defects

DOCUMENTATION
[ ] Architecture documented
[ ] Document IR documented
[ ] JSON schema documented
[ ] Renderer documented
[ ] Known limitations documented
[ ] Development/test instructions documented
```

---

# END OF V1 ACCEPTANCE CRITERIA
