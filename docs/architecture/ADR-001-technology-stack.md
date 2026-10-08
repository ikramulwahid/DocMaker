# ADR-001 — Technology Stack & Deployment Architecture

**Status:** Accepted
**Date:** 2026-10-07
**Decision Type:** Architecture / Technology
**Project:** DocMaker — Laboratory Document Maker
**Repository:** https://github.com/ikramulwahid/DocMaker.git

---

# 1. Context

DocMaker is intended to be a professional, single-user laboratory document authoring and generation application.

The target use case is primarily Indian testing and calibration laboratories producing documentation associated with:

* ISO/IEC 17025
* NABL-oriented quality documentation
* laboratory procedures
* SOPs
* work instructions
* quality manuals
* technical documents
* forms
* worksheets
* registers
* schedules
* checklists
* reports
* certificates
* controlled laboratory records

The application requires capabilities beyond a conventional rich-text editor, including:

* semantic document structure
* reusable styles
* page-oriented layout
* pagination
* sections
* mixed portrait/landscape pages
* headers and footers
* dynamic fields
* automatic numbering
* references
* tables spanning pages
* images
* equations
* laboratory-specific document components
* forms
* calculations
* units
* JSON persistence
* document import/export
* PDF generation
* future controlled-document lifecycle
* future AI-assisted document generation

The initial product is explicitly intended for:

> **A single user operating locally on their own computer.**

There is no initial requirement for:

* multi-user collaboration
* authentication
* login
* cloud storage
* centralized database
* remote document management
* server-side business logic

Therefore, introducing a conventional backend would add architectural and operational complexity without providing sufficient value for the initial product.

---

# 2. Decision

DocMaker will initially be implemented as a:

> **Single-user, local-first desktop application with no traditional backend server.**

The preferred technology baseline is:

| Area                      | Decision                                         |
| ------------------------- | ------------------------------------------------ |
| Desktop shell             | Tauri 2                                          |
| Frontend                  | React                                            |
| Language                  | TypeScript                                       |
| Build tooling             | Vite                                             |
| Package manager           | pnpm                                             |
| Structured editor         | Tiptap / ProseMirror                             |
| Application state         | Zustand                                          |
| Canonical document model  | Custom Document IR                               |
| Persisted document format | Versioned JSON                                   |
| Runtime/schema validation | Zod and/or JSON Schema/Ajv                       |
| Markdown processing       | unified / remark ecosystem                       |
| PDF extraction            | PDF.js or validated equivalent                   |
| Equations                 | LaTeX + KaTeX and/or MathML                      |
| Calculation arithmetic    | Decimal-aware implementation                     |
| Calculation evaluation    | Restricted/safe expression engine                |
| Unit system               | Dedicated typed quantity/unit subsystem          |
| Unit/pagination renderer  | To be finalized through Phase-0 proof-of-concept |
| PDF output                | Shared semantic/layout rendering pipeline        |
| DOCX                      | Import/export adapter layer                      |
| Local application state   | IndexedDB where appropriate                      |
| Unit testing              | Vitest                                           |
| End-to-end testing        | Playwright                                       |
| Visual/golden testing     | Golden documents + visual regression             |
| Repository                | GitHub                                           |

The selected technologies form the **initial engineering baseline**.

Individual dependency versions are not permanently fixed by this ADR. Actual versions must be selected based on:

* compatibility
* security
* project tooling
* maintenance
* platform support
* licensing
* demonstrated functionality

---

# 3. Deployment Architecture

The initial application architecture is:

```text
                         DOCMAKER
                            │
             ┌──────────────┴──────────────┐
             │                             │
       React + TypeScript              Tauri
             │                             │
             │                      Native/Desktop Layer
             │                             │
             └──────────────┬──────────────┘
                            │
                      Document IR
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       Editor           Business            Layout
       Layer             Engines             Engine
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                      Shared Renderer
                            │
               ┌────────────┼────────────┐
               ▼            ▼            ▼
            Preview        PDF          DOCX
```

The local persistence architecture is:

```text
                    Local Machine
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     JSON Documents    Assets       IndexedDB
```

No network service is required for the core V1 workflow.

---

# 4. Why a Desktop Application

A browser-only implementation is technically possible, but the application's requirements strongly favor a desktop shell.

DocMaker needs extensive interaction with local files:

* `.json`
* `.doc`
* `.docx`
* `.pdf`
* `.md`
* images
* exported files
* document assets

The application may also eventually require local utilities or sidecars for document processing.

A desktop shell provides a more reliable environment for:

* filesystem access
* native file dialogs
* local asset management
* local conversion utilities
* local document processing
* offline operation
* desktop packaging

Therefore:

> **Tauri is preferred over a pure browser/PWA deployment for the initial product.**

---

# 5. Why No Backend

A conventional backend is not justified by the V1 requirements.

The initial product does not require:

```text
Browser
   ↓
API
   ↓
Server
   ↓
Database
```

Instead:

```text
Desktop Application
       ↓
Local Document IR
       ↓
Local Files
```

is sufficient.

Avoid introducing:

* REST API
* GraphQL
* PostgreSQL
* MongoDB
* Firebase
* Supabase
* cloud storage
* authentication service

solely because they are common application technologies.

A backend may be introduced in a future architecture decision if requirements change to include:

* multiple users
* collaboration
* centralized storage
* organization-wide deployment
* centralized audit
* shared laboratory data
* role-based approval
* remote processing
* server-mediated AI services

Such a future backend must not unnecessarily invalidate the Document IR or local document architecture.

---

# 6. Frontend Architecture

The frontend will use:

> **React + TypeScript + Vite**

Reasons:

* mature component ecosystem
* strong support for complex application interfaces
* suitable for document-editor tooling
* strong TypeScript integration
* suitable for desktop applications through Tauri
* broad testing/tooling ecosystem

TypeScript will be used as the primary application language.

Strict typing should be enabled where practical.

---

# 7. Desktop Shell — Tauri

Tauri is selected as the preferred desktop shell.

Tauri is responsible primarily for:

* desktop packaging
* filesystem access
* native dialogs
* native integration
* application lifecycle
* local processing integration
* optional sidecar execution where justified

The Rust/native layer should remain thin.

Ordinary document business logic should remain primarily in TypeScript unless there is a concrete technical reason to move a component into Rust.

---

# 8. Editor — Tiptap / ProseMirror

Tiptap/ProseMirror is selected as the preferred structured editing foundation.

It is suitable for:

* paragraphs
* headings
* lists
* inline formatting
* tables
* custom nodes
* semantic blocks
* structured editing commands
* transactional document updates

However:

> **Tiptap/ProseMirror is an editing layer, not the canonical document model.**

The architecture must remain:

```text
             Document IR
                 ↑ ↓
           Editor Adapter
                 ↑ ↓
        Tiptap / ProseMirror
```

This allows the application to evolve the editor independently from its long-term document format.

---

# 9. Canonical Document IR

The canonical document representation will be a project-defined:

> **Laboratory Document Intermediate Representation (Document IR).**

It will be the authoritative representation for:

* document content
* metadata
* sections
* styles
* themes
* fields
* numbering
* references
* assets
* forms
* calculations
* units
* lifecycle
* revisions
* approvals
* relationships

The Document IR MUST NOT be:

* HTML
* DOM
* Tiptap JSON
* DOCX XML
* PDF
* Markdown
* canvas state

Those are boundary representations or adapters.

---

# 10. Stable Semantic Identity

Referenceable semantic objects will have stable IDs.

Examples:

```text
document
section
heading
table
figure
equation
field
component
annexure
appendix
```

Visible numbers such as:

```text
3.2
Table 4
Figure 7
```

must never be used as permanent object identities.

This decision directly supports:

* automatic renumbering
* cross-references
* document relationships
* versioning
* reproducibility

---

# 11. State Management

Zustand is selected as the initial application state-management library.

It may manage:

* UI state
* editor session state
* preview state
* preferences
* temporary interaction state
* application settings

However:

> **Zustand is not the authoritative document store.**

The Document IR remains the source of truth.

Avoid creating multiple competing representations of the document.

---

# 12. Persistence

The primary user document format will be:

> **Versioned JSON files.**

Conceptual structure:

```json
{
  "schema": "labdoc",
  "schema_version": "1.0",
  "document": {}
}
```

JSON must support:

* semantic persistence
* stable IDs
* metadata
* styles
* sections
* references
* numbering
* fields
* assets
* future forms/calculations/lifecycle structures

IndexedDB may be used for:

* autosave
* recovery
* preferences
* recently opened documents
* temporary application state

IndexedDB does not replace the portable JSON document format.

---

# 13. Schema Validation

The persisted document format is considered a project contract.

The implementation should use:

* strong TypeScript types
* runtime validation

Preferred tools:

* Zod
* JSON Schema
* Ajv

The exact combination may be refined during implementation.

Schema versions must be explicit.

Persistent schema changes require consideration of:

* migration
* backward compatibility
* validation
* test coverage
* documentation

---

# 14. Markdown

Markdown import will use the unified/remark ecosystem or an equivalent validated parser.

Conceptually:

```text
Markdown
   ↓
Markdown Parser
   ↓
Document IR
```

Markdown is not the canonical storage format.

---

# 15. PDF Import

PDF import will initially be treated as extraction/reconstruction.

Preferred initial technology:

> **PDF.js or validated equivalent**

Conceptually:

```text
PDF
 ↓
Text/Layout Extraction
 ↓
Structure Inference
 ↓
Document IR
```

PDF is not assumed to contain semantic information such as:

* Heading 2
* Table
* Figure
* Caption

with the same reliability as structured authoring formats.

Perfect arbitrary-PDF reconstruction is not a V1 requirement.

---

# 16. DOCX Import/Export

DOCX will be handled through adapters.

Import:

```text
DOCX
 ↓
Parser
 ↓
Structure Mapping
 ↓
Document IR
```

Export:

```text
Document IR
 ↓
DOCX Adapter
 ↓
DOCX
```

DOCX XML must not become the canonical internal representation.

---

# 17. Legacy DOC

Legacy `.doc` will be treated as a boundary compatibility concern.

Where required, an appropriate local conversion path may be used:

```text
DOC
 ↓
Local Conversion
 ↓
DOCX
 ↓
DOCX Import
 ↓
Document IR
```

The `.doc` requirement must not dictate the architecture of the core document engine.

Any conversion tool must be evaluated for:

* licensing
* platform compatibility
* maintenance
* security
* deterministic behavior

---

# 18. Equation Technology

Structured equations will use a representation compatible with:

* LaTeX
* MathML
* or an equivalent semantic model

Rendering may use:

* KaTeX
* MathML
* or an equivalent validated renderer

Equations must remain structured semantic objects rather than screenshots.

---

# 19. Calculation Technology

Calculations will use a constrained expression system.

The calculation architecture is:

```text
Expression
 ↓
Parser
 ↓
AST
 ↓
Typed Values
 ↓
Unit Engine
 ↓
Result
```

Arbitrary code execution is prohibited.

In particular, do not use:

```text
eval()
Function(...)
```

or equivalent arbitrary code execution mechanisms for user formulas.

Numerical calculations should use decimal-aware arithmetic where required for technical/documentation reliability.

---

# 20. Unit Technology

Technical laboratory values will be represented as typed quantities.

Conceptually:

```ts
interface Quantity {
  value: Decimal;
  unit: UnitId;
}
```

For example:

```text
value = 12.5
unit = mg/L
```

rather than storing only:

```text
"12.5 mg/L"
```

as a string.

The unit subsystem will eventually support:

* compatible operations
* dimensional consistency
* conversion
* formatting
* precision
* significant figures

---

# 21. Pagination and Layout

Pagination is considered one of the highest-risk subsystems.

The application therefore requires a dedicated page-oriented layout approach.

Candidate technologies include:

* Paged.js
* Vivliostyle
* another mature paged-media implementation
* custom layout engine if justified by technical evidence

The final choice is intentionally **not fixed by this ADR**.

It will be selected after Phase-0 validation.

---

# 22. Rendering Architecture

The preferred rendering model is:

```text
Document IR
    ↓
Resolution
    ↓
Layout Engine
    ↓
Canonical Page/Layout Model
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Live Preview │     PDF      │    DOCX      │
└──────────────┴──────────────┴──────────────┘
```

The objective is to ensure that:

* preview
* PDF
* DOCX

share the same semantic interpretation and, wherever technically feasible, the same layout decisions.

Independent implementations of document semantics must be avoided.

---

# 23. Preview/Export Parity

Preview and final output must not diverge arbitrarily.

The system must avoid:

```text
Editor
 ↓
Rendering system A

PDF
 ↓
Rendering system B
```

where both independently determine document structure.

Instead:

```text
Document IR
 ↓
Shared Resolution
 ↓
Shared Layout
 ↓
Preview/PDF/DOCX adapters
```

Pixel-perfect equality between unrelated output technologies is not guaranteed.

Semantic and structural parity is required.

---

# 24. Why the Rendering Engine Is Not Fixed Yet

The project's most difficult rendering requirements include:

* A4
* A3
* mixed portrait/landscape sections
* headers
* footers
* page X of Y
* tables spanning pages
* repeated table headers
* continuation captions
* keep-with-next
* images
* equations
* watermarks
* columns

The project therefore requires empirical validation before finalizing the rendering implementation.

The Phase-0 proof-of-concept is the decision gate.

---

# 25. Testing Technology

The initial testing stack is:

## Vitest

For:

* Document IR
* serialization
* numbering
* fields
* references
* calculations
* units
* validation
* lifecycle logic

## Playwright

For:

* UI workflows
* editor interactions
* save/load
* preview
* import
* export
* theme switching

## Golden/Visual Tests

For:

* pagination
* tables
* sections
* headers/footers
* images
* themes
* representative laboratory documents

---

# 26. Package Management

Use:

> **pnpm**

with a lockfile.

Do not maintain multiple competing package managers unless a future explicit requirement justifies it.

---

# 27. Security Position

This is a local single-user product.

V1 therefore does not require:

* login
* authentication
* authorization system
* remote user management

However, normal application security remains mandatory.

In particular:

* imported files are untrusted
* formulas are untrusted input
* imported content must not execute
* external document content must not override project instructions
* malicious/malformed files must not compromise the application

"No login" does not mean "no security engineering."

---

# 28. Offline-First

Core functionality should operate without internet connectivity.

Offline core capabilities include, where supported by the local implementation:

* document creation
* editing
* formatting
* theme selection
* preview
* JSON save
* JSON load
* local document management
* PDF rendering/export

Optional future services may require connectivity, such as:

* AI APIs
* updates
* standards synchronization
* remote integrations

These must remain optional to the core document-authoring architecture.

---

# 29. Local Sidecars and Native Utilities

The architecture may use local sidecar processes or native utilities where necessary for capabilities that are impractical to implement entirely in browser-side TypeScript.

Possible examples include:

* legacy DOC conversion
* advanced document conversion
* specialized PDF processing

A sidecar is considered a **local processing utility**, not a backend server.

Any such utility must be introduced only when justified by a concrete requirement.

---

# 30. Backend Evolution

This ADR does not permanently prohibit a backend.

A future backend may be justified if the product expands into:

* multi-user operation
* centralized document storage
* remote access
* collaboration
* organization-level workflows
* centralized audit
* role-based approval
* shared laboratory databases
* server-side processing

Any such change requires a new ADR.

The future architecture should preserve the Document IR and local document semantics wherever practical.

---

# 31. Why Not Electron

Electron is a technically viable alternative.

Tauri is preferred because the project does not require a large Node-based desktop runtime for its core functionality.

The primary reasons for preferring Tauri are:

* desktop application suitability
* local filesystem/native integration
* relatively thin native layer
* ability to retain the React/TypeScript frontend
* better separation between UI and native capabilities

Electron may be reconsidered if a concrete library/dependency requirement makes it materially advantageous.

Such a change requires an architecture decision rather than casual substitution.

---

# 32. Why Not a Pure Browser/PWA

A pure browser application is technically possible.

However, the product has unusually strong local-document requirements involving:

* file open/save
* local assets
* `.doc`
* `.docx`
* `.pdf`
* `.md`
* local processing
* offline behavior
* potential local conversion utilities

A desktop shell therefore provides a more reliable initial deployment model.

A browser version may be considered later.

---

# 33. Why Not Next.js / Server-Centric Web Architecture

A server-centric React framework is not required for the initial product because:

* there is no initial backend
* the application is local
* the user is single-user
* core storage is local
* rendering and document processing are local

A conventional server/web architecture would add complexity without solving an initial requirement.

---

# 34. Why Not a Database

The V1 use case does not justify a database server.

Documents are naturally portable as structured JSON files.

IndexedDB can provide application-level temporary persistence.

A database may become relevant in a future multi-user or centralized system, but it is not required for the initial architecture.

---

# 35. Document Architecture Requirements

The technology stack must preserve these architectural principles:

```text
Document IR
    ↓
Semantic Components
    ↓
Resolution
    ↓
Layout
    ↓
Rendering
```

and:

```text
External Format
    ↓
Adapter
    ↓
Document IR
```

External formats must not define the application's internal document semantics.

---

# 36. Primary Risk Mitigation

This technology decision directly supports mitigation of the project's major risks.

## Pagination

Dedicated layout architecture.

## DOCX/PDF fidelity

Adapter boundary and best-effort reconstruction rather than canonical-format contamination.

## Numbering

Stable semantic IDs + dedicated numbering engine.

## Tables

First-class semantic table model + layout engine.

## Sections

First-class section model.

## Forms

Semantic field model.

## Calculations/Units

Typed calculation and unit subsystems.

## Controlled Versions

Document IR can represent immutable revisions independently of the editor.

## Preview/Export Parity

Shared resolution/layout pipeline.

## Microsoft Word Scope

A desktop document editor is provided without requiring full Word feature parity.

---

# 37. Technology Selection Rules

Technology decisions must follow these rules:

1. Prefer mature, maintained technologies.
2. Prefer technologies compatible with the local-first desktop model.
3. Prefer technologies that preserve the Document IR architecture.
4. Prefer technologies that can be tested deterministically.
5. Avoid unnecessary infrastructure.
6. Avoid unnecessary dependencies.
7. Validate high-risk technologies with proof-of-concepts.
8. Do not choose a renderer solely because it is popular.
9. Do not replace foundational technologies without evidence.
10. Record significant changes in an ADR.

---

# 38. Version Policy

This ADR specifies technology direction, not immutable dependency versions.

Actual versions must be recorded in:

* package manifests
* lockfiles
* project configuration

When selecting versions, evaluate:

* compatibility
* maintenance status
* security
* license
* platform support
* required feature support

Do not blindly upgrade to the latest available version if it introduces risk.

---

# 39. Phase-0 Technology Validation

Before substantial V1 implementation, validate the following architecture:

```text
Tauri
+
React/TypeScript
+
Tiptap/ProseMirror
+
Document IR
+
Selected pagination/rendering technology
```

The proof-of-concept must demonstrate:

```text
A4 portrait
       ↓
A4 landscape
       ↓
A4 portrait
```

including:

* headings
* numbering
* table
* multi-page table
* repeated header
* continuation caption
* header
* footer
* Page X of Y
* image
* equation
* watermark
* theme
* JSON round trip

The results must be documented before the rendering technology is considered final.

---

# 40. V1 Technology Baseline

Unless a documented architecture decision changes it, V1 development should begin from:

```text
Desktop
    Tauri 2

Frontend
    React
    TypeScript
    Vite

Editor
    Tiptap / ProseMirror

State
    Zustand

Package Manager
    pnpm

Document Model
    Custom Document IR

Persistence
    JSON
    IndexedDB

Validation
    TypeScript
    Zod / JSON Schema / Ajv

Markdown
    unified / remark

PDF Import
    PDF.js or validated equivalent

Equations
    LaTeX
    KaTeX / MathML

Calculations
    Restricted expression engine
    Decimal-aware arithmetic

Units
    Typed Quantity / Unit subsystem

Testing
    Vitest
    Playwright
    Golden/Visual Regression

Rendering
    Paginated document architecture
    Final engine selected after Phase-0
```

---

# 41. Consequences

## Positive consequences

### Simpler deployment

The initial product can be installed and used without operating a server.

### Offline operation

Core authoring does not depend on network availability.

### Local document ownership

Documents can remain under the user's control.

### Reduced infrastructure

No:

* server hosting
* database server
* authentication infrastructure
* API maintenance

is required for V1.

### Strong document architecture

The Document IR provides a stable foundation independent of editor/output formats.

### Better desktop integration

Local file handling is a first-class capability.

### Future extensibility

A future backend can be introduced without changing the fundamental semantic document architecture.

---

# 42. Negative Consequences / Trade-offs

### Desktop packaging complexity

Tauri introduces desktop build and distribution concerns.

### Native tooling

Some document-processing functionality may eventually require local native utilities or sidecars.

### Cross-platform considerations

If macOS/Linux support is introduced later, platform-specific testing may be required.

### Document rendering complexity

The lack of a browser/server document-rendering service means rendering must be engineered locally.

### Import fidelity

Arbitrary DOC/PDF documents cannot be guaranteed to reconstruct perfectly.

### Dependency selection

Some advanced document functionality may require careful evaluation of external libraries.

These trade-offs are accepted because they align with the intended single-user/local-first product.

---

# 43. Reconsideration Criteria

This decision should be revisited if one or more of the following becomes a product requirement:

* multi-user collaboration
* centralized document repository
* organization-wide deployment
* remote synchronization
* centralized audit
* distributed approval
* server-side AI orchestration
* shared laboratory data
* browser-only deployment requirement

A new ADR should be created before a major architectural change.

---

# 44. Related Documents

This ADR should be read together with:

```text
/AGENTS.md

/Main_Prompt.md

/docs/requirements/V1_ACCEPTANCE_CRITERIA.md
```

Their responsibilities are:

```text
Main_Prompt.md
    = Product vision + requirements + architecture direction

V1_ACCEPTANCE_CRITERIA.md
    = Testable V1 release gate

AGENTS.md
    = AI workforce rules

ADR-001
    = Technology/deployment architecture decision
```

---

# 45. Decision Summary

The approved initial architecture is:

```text
                 DOCMAKER
                    │
              Tauri Desktop
                    │
          React + TypeScript
                    │
             Document IR
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
   Tiptap       Business        Layout
 / ProseMirror   Engines        Engine
      │             │             │
      └─────────────┼─────────────┘
                    ▼
             Shared Rendering
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Preview     PDF       DOCX
```

Persistence:

```text
Document
   ↓
Versioned JSON

Application state
   ↓
IndexedDB
```

Deployment:

```text
Local desktop
+
No backend
+
No login
+
No cloud dependency for core authoring
```

This architecture is accepted as the starting point for Phase 0 and V1.

The final pagination/rendering implementation remains subject to Phase-0 proof-of-concept validation.

---

# END OF ADR-001
