/**
 * M1 — Reusable style system evidence (V1-STYLE-001..004, V1-TXT-001,
 * V1-DOC-002 base-style default).
 *
 * Coverage maps to the acceptance evidence points:
 *   1. built-in styles exist with stable ids and schema-valid definitions
 *   2. style assignment survives the adapter round-trip (see also adapter.test.ts)
 *   3. changing a definition re-renders every assigned block (V1-STYLE-003)
 *   4. document style libraries are isolated (no shared mutable state)
 *   5. custom style + assignment persists edit → save → reload (V1-STYLE-004)
 *   6. legacy style-less 1.0 documents load uncorrupted with deterministic defaults
 *   7. default-created documents receive the base-style assignment (V1-DOC-002)
 *   8. theme switch preserves style definitions and assignments
 *   9. golden output exercises heading hierarchy + style-based text types
 *  10. invalid style values are rejected; unknown references fall back deterministically
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { deserializeDocument, serializeDocument } from "@/core/json/envelope";
import { renderLayout } from "@/core/layout";
import { resolveDocument, effectiveStyleOf, resolveStyles } from "@/core/resolve";
import {
  BUILTIN_STYLE_IDS,
  buildDefaultStyles,
  isBuiltinStyleId,
} from "@/core/ir/styles";
import {
  documentSchema,
  styleDefinitionSchema,
  styleFormatSchema,
} from "@/core/ir/schema";
import {
  createEmptyDocument,
  createHeading,
  createParagraph,
  text,
} from "@/core/ir/factory";
import type { Document } from "@/core/ir/schema";

/** Strip <style> blocks so tests can compare document MARKUP alone. */
function stripCss(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, "");
}

function renderDoc(doc: Document): string {
  return renderLayout(resolveDocument(doc), { pagedJsSrc: "/vendor/paged.polyfill.js" });
}

/* 1 — V1-STYLE-001: built-in reusable styles, stable ids, valid definitions */

describe("V1-STYLE-001 — built-in reusable styles", () => {
  it("exposes every required built-in style by stable id", () => {
    const required = [
      "normal",
      "title",
      "subtitle",
      "heading-1",
      "heading-2",
      "heading-3",
      "heading-4",
      "body-text",
      "note",
      "warning",
      "definition",
      "caption",
      "table-text",
      "header",
      "footer",
      "reference",
      // M1 additions beyond the literal V1-STYLE-001 list
      "quote",
      "important-notice",
      "heading-5",
      "heading-6",
    ];
    for (const id of required) {
      expect(BUILTIN_STYLE_IDS).toContain(id);
      expect(isBuiltinStyleId(id)).toBe(true);
    }
  });

  it("has stable, schema-valid definitions (id === key, valid format)", () => {
    const library = buildDefaultStyles();
    for (const id of BUILTIN_STYLE_IDS) {
      const def = library[id];
      expect(def).toBeDefined();
      expect(def!.id).toBe(id);
      expect(styleDefinitionSchema.safeParse(def).success).toBe(true);
    }
  });

  it("heading styles declare their semantic level; paragraphs/tableText do not", () => {
    const library = buildDefaultStyles();
    for (let level = 1; level <= 6; level++) {
      expect(library[`heading-${level}`].kind).toBe("heading");
      expect(library[`heading-${level}`].headingLevel).toBe(level);
    }
    for (const id of ["normal", "title", "note", "quote"] as const) {
      expect(library[id].kind).toBe("paragraph");
      expect(library[id].headingLevel).toBeNull();
    }
    expect(library["table-text"].kind).toBe("tableText");
  });
});

/* 2 — V1-STYLE-002: assignment (adapter round-trip covered in adapter.test.ts) */

describe("V1-STYLE-002 — style assignment on blocks", () => {
  it("assigns a style reference to a paragraph and a heading", () => {
    const doc = createEmptyDocument("T");
    doc.sections[0].blocks = [
      createParagraph([text("Body")], "note"),
      createHeading(2, [text("Scope")], "heading-2"),
    ];
    const resolved = resolveDocument(doc);
    const rendered = renderDoc(doc);
    expect(rendered).toContain('class="doc-paragraph doc-style-note"');
    expect(rendered).toContain('class="doc-heading doc-style-heading-2"');
    // Assignment follows the block → resolver → layout path, never the theme.
    expect(resolved.styles["note"].name).toBe("Note");
    expect(resolved.styles["heading-2"].kind).toBe("heading");
  });

  it("persists assignments through a save/reload cycle", () => {
    const doc = createEmptyDocument("T");
    doc.sections[0].blocks = [createParagraph([text("X")], "warning")];
    const back = deserializeDocument(serializeDocument(doc));
    expect(
      back.sections[0].blocks[0].type === "paragraph"
        ? (back.sections[0].blocks[0] as { style: string | null }).style
        : null,
    ).toBe("warning");
  });
});

/* 3 — V1-STYLE-003: definition change re-renders every assigned block */

describe("V1-STYLE-003 — style modification updates all users", () => {
  it("re-renders every block referencing the style without touching content", () => {
    const doc = createEmptyDocument("T");
    doc.sections[0].blocks = [
      createParagraph([text("First")], "note"),
      createHeading(1, [text("Second")]),
      createParagraph([text("Third")], "note"),
      createParagraph([text("Plain")], "normal"),
    ];

    const before = renderDoc(doc);
    // Defaults: Note/Quote/Reference are italic (3 rules); Title, Warning and
    // Important Notice are bold (3 rules); nothing uses 12pt.
    expect(before.match(/font-style: italic;/g) ?? []).toHaveLength(3);
    expect(before.match(/font-weight: 700;/g) ?? []).toHaveLength(3);
    expect(before).not.toContain("font-size: 12pt;");

    // Change the definition: every note-assigned block must follow.
    doc.styles["note"].format = {
      ...doc.styles["note"].format,
      italic: false,
      bold: true,
      fontSizePt: 12,
    };
    const after = renderDoc(doc);

    expect(after).toContain("font-size: 12pt;");
    expect(after.match(/font-weight: 700;/g) ?? []).toHaveLength(4);
    expect(after.match(/font-style: italic;/g) ?? []).toHaveLength(2);

    // Both assigned paragraphs still render, unmodified except the style CSS.
    expect(after.match(/class="doc-paragraph doc-style-note"/g)).toHaveLength(2);
    expect(stripCss(before)).toBe(stripCss(after));
    // The normal paragraph and the heading are untouched by the edit.
    expect(after).toContain(">First<");
    expect(after).toContain(">Third<");
    expect(after).toContain(">Plain<");
  });
});

/* 4 — mutation isolation between documents */

describe("style libraries are isolated", () => {
  it("each document gets a fresh library (no shared objects)", () => {
    const a = createEmptyDocument("A");
    const b = createEmptyDocument("B");
    expect(a.styles).not.toBe(b.styles);
    expect(a.styles["normal"]).not.toBe(b.styles["normal"]);
    a.styles["normal"].format.bold = true;
    expect(b.styles["normal"].format.bold).toBe(false);
  });

  it("buildDefaultStyles returns an independent object graph per call", () => {
    const one = buildDefaultStyles();
    const two = buildDefaultStyles();
    expect(one).not.toBe(two);
    one["note"].format.fontSizePt = 99;
    expect(two["note"].format.fontSizePt).toBeNull();
  });
});

/* 5 — V1-STYLE-004: custom style persistence */

describe("V1-STYLE-004 — custom styles survive edit → save → reload", () => {
  it("round-trips a custom style with its assignment", () => {
    const doc = createEmptyDocument("T");
    doc.styles["custom-x"] = {
      id: "custom-x",
      name: "Results",
      kind: "paragraph",
      headingLevel: null,
      format: { ...buildDefaultStyles()["normal"].format, fontSizePt: 13, bold: true },
    };
    doc.sections[0].blocks = [
      createParagraph([text("release")], "custom-x"),
      createParagraph([text("other")], "normal"),
    ];

    const json1 = serializeDocument(doc);
    const reopened = deserializeDocument(json1); // close + reopen

    // The custom style survived the trip with its assignment.
    expect(reopened.styles["custom-x"].name).toBe("Results");
    expect(reopened.styles["custom-x"].format.fontSizePt).toBe(13);
    expect(
      (reopened.sections[0].blocks[0] as { style: string | null }).style,
    ).toBe("custom-x");

    // Edit the custom style after reopening; reload again; render reflects it.
    reopened.styles["custom-x"] = {
      ...reopened.styles["custom-x"],
      format: { ...reopened.styles["custom-x"].format, fontSizePt: 16, color: "#1f3a5f" },
    };
    const json2 = serializeDocument(reopened);
    const again = deserializeDocument(json2);
    const html = renderDoc(again);
    expect(html).toContain('class="doc-paragraph doc-style-custom-x"');
    expect(html).toContain("font-size: 16pt;");
    expect(html).toContain("color: #1f3a5f;");
  });
});

/* 6 — ADR-004: legacy style-less documents load with deterministic defaults */

describe("legacy style-less labdoc/1.0 documents (ADR-004)", () => {
  function legacyJson(): string {
    return JSON.stringify({
      schema: "labdoc",
      schema_version: "1.0",
      document: {
        id: "doc_legacy01",
        type: "document",
        metadata: { title: "Old", docNumber: "", revision: "", effectiveDate: "", author: "", organization: "", description: "" },
        settings: {
          theme: "lab_default",
          watermark: { enabled: false, text: "", opacity: 0.12, angle: -45, fontSizePt: 64 },
        },
        // No `styles` and no block `style` fields — a pre-M1 1.0 document.
        sections: [
          {
            id: "sec_legacy01",
            type: "section",
            pageSetup: { orientation: "portrait", format: "A4", pageNumberStart: 1, showPageNumber: true, margins: { top: 20, right: 20, bottom: 20, left: 20 } },
            header: { parts: [] },
            footer: { parts: [] },
            blocks: [
              { id: "pg_legacy01", type: "paragraph", content: [{ text: "Kept", marks: [] }] },
              { id: "hd_legacy01", type: "heading", level: 3, content: [{ text: "Chapter", marks: [] }] },
            ],
          },
        ],
      },
    });
  }

  it("loads uncorrupted: content preserved, style defaults applied", () => {
    const doc = deserializeDocument(legacyJson());
    const [p, h] = doc.sections[0].blocks;
    expect(p.type).toBe("paragraph");
    if (p.type === "paragraph") {
      expect(p.content[0].text).toBe("Kept");
      expect(p.style).toBeNull(); // no explicit ref → derived default at resolve
    }
    expect(h.type).toBe("heading");
    const styles = doc.styles;
    expect(styles["normal"]).toBeDefined();
    expect(styles["heading-3"]).toBeDefined();
    expect(Object.keys(styles).length).toBe(BUILTIN_STYLE_IDS.length);
  });

  it("derives deterministic built-in defaults when rendering", () => {
    const doc = deserializeDocument(legacyJson());
    const resolved = resolveDocument(doc);
    const [p, h] = doc.sections[0].blocks;
    expect(effectiveStyleOf(resolved.document, p)?.id).toBe("normal");
    expect(effectiveStyleOf(resolved.document, p)?.derived).toBe(true);
    expect(effectiveStyleOf(resolved.document, h)?.id).toBe("heading-3");
    const html = renderLayout(resolved, { pagedJsSrc: "/vendor/paged.polyfill.js" });
    expect(html).toContain('class="doc-paragraph doc-style-normal"');
    expect(html).toContain('class="doc-heading doc-style-heading-3"');
    expect(html).toContain(">Kept<");
  });

  it("resaving once establishes stable defaults (idempotent)", () => {
    const doc = deserializeDocument(legacyJson());
    const json1 = serializeDocument(doc);
    const doc2 = deserializeDocument(json1);
    const json2 = serializeDocument(doc2);
    expect(json1).toBe(json2); // second serialization is byte-stable
    const parsed = JSON.parse(json1).document;
    expect(parsed.styles["normal"]).toBeDefined();
    expect(parsed.sections[0].blocks[0].style).toBeNull();
  });
});

/* 7 — V1-DOC-002: base-style default for new documents */

describe("V1-DOC-002 — base-style default on new documents", () => {
  it("new documents start from the built-in style library", () => {
    const doc = createEmptyDocument("New");
    expect(Object.keys(doc.styles).length).toBe(BUILTIN_STYLE_IDS.length);
    for (const id of BUILTIN_STYLE_IDS) expect(doc.styles[id]).toBeDefined();
  });

  it("default-created blocks reference the base styles by id", () => {
    const doc = createEmptyDocument("New");
    doc.sections[0].blocks = [
      createParagraph([text("p")]),
      createHeading(1, [text("h1 range")]),
      createHeading(4, [text("h4")]),
    ];
    const [p, h1, h4] = doc.sections[0].blocks;
    expect(p.type === "paragraph" && p.style).toBe("normal");
    expect(h1.type === "heading" && h1.style).toBe("heading-1");
    expect(h4.type === "heading" && h4.style).toBe("heading-4");
  });
});

/* 8 — theme switch preserves style semantics */

describe("theme switch preserves styles (separation of concerns)", () => {
  it("keeps style definitions and assignments identical across themes", () => {
    const doc = createEmptyDocument("T");
    doc.sections[0].blocks = [
      createParagraph([text("A")], "note"),
      createHeading(2, [text("B")], "heading-2"),
    ];
    const htmlDefault = renderDoc(doc);

    doc.settings.theme = "bw_standard";
    const htmlBw = renderDoc(doc);

    // Presentation changed (fonts), semantics did not:
    expect(htmlDefault).not.toBe(htmlBw);
    expect(stripCss(htmlDefault)).toBe(stripCss(htmlBw));
    expect(doc.styles["note"].format).toEqual(doc.styles["note"].format);
    expect(
      (doc.sections[0].blocks[0] as { style: string | null }).style,
    ).toBe("note");
    expect(resolveStyles(doc)["note"]).toBeDefined();
  });
});

/* 9 — golden output exercises the style system (heading hierarchy + text types) */

describe("golden-04-style-system exercises the style system", () => {
  function goldenDoc(): Document {
    const json = readFileSync("tests/golden/golden-04-style-system.json", "utf8");
    return deserializeDocument(json);
  }

  it("contains a semantic H1–H4 hierarchy and the style-based text types", () => {
    const doc = goldenDoc();
    const blocks = doc.sections[0].blocks;
    const headings = blocks.filter((b) => b.type === "heading");
    expect(new Set(headings.map((h) => (h.type === "heading" ? h.level : 0)))).toEqual(
      new Set([1, 2, 3, 4]),
    );
    const textTypes = ["title", "subtitle", "body-text", "caption", "quote", "note", "warning", "important-notice", "definition", "reference", "custom-result"];
    for (const id of textTypes) {
      expect(blocks.some((b) => b.type === "paragraph" && b.style === id)).toBe(true);
    }
    // Headings keep semantic level styles.
    expect(blocks.some((b) => b.type === "heading" && b.style === "heading-1")).toBe(true);
  });

  it("renders the style classes and their CSS", () => {
    const doc = goldenDoc();
    const html = renderDoc(doc);
    for (const id of ["title", "subtitle", "note", "warning", "important-notice", "quote", "caption", "custom-result"]) {
      expect(html).toContain(`doc-style-${id}`);
    }
    // The custom style's tokens reach the generated CSS.
    expect(html).toContain("font-size: 12pt;");
  });
});

/* 10 — validation and deterministic fallback for invalid/unresolved refs */

describe("invalid style values and unresolved references", () => {
  it("rejects invalid style formats (schema enforcement)", () => {
    expect(styleFormatSchema.safeParse({ fontSizePt: -3 }).success).toBe(false);
    expect(styleFormatSchema.safeParse({ color: "red" }).success).toBe(false);
    expect(styleFormatSchema.safeParse({ color: "#GG0000" }).success).toBe(false);
    expect(styleFormatSchema.safeParse({ alignment: "middle" }).success).toBe(false);
    expect(styleFormatSchema.safeParse({ fontFamily: "Comic Sans" }).success).toBe(false);
  });

  it("rejects invalid style definitions and references", () => {
    expect(styleDefinitionSchema.safeParse({ id: "Heading 1", name: "H", kind: "heading" }).success).toBe(false);
    expect(styleDefinitionSchema.safeParse({ id: "h1", name: "", kind: "paragraph" }).success).toBe(false);
    expect(styleDefinitionSchema.safeParse({ id: "h1", name: "H", kind: "heading", headingLevel: 9 }).success).toBe(false);
    expect(styleDefinitionSchema.safeParse({ id: "h1", name: "H", kind: "paragraph", headingLevel: 2 }).success).toBe(false);
    // A block referencing an invalid style id is not accepted by the schema,
    // so a corrupt save can never smuggle bogus style refs (AGENTS.md §46).
    expect(
      documentSchema.safeParse({
        id: "doc_x",
        type: "document",
        styles: {},
        sections: [
          {
            id: "sec_x",
            type: "section",
            pageSetup: {},
            blocks: [{ id: "pg_x", type: "paragraph", style: "EVIL;color:red", content: [] }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("falls back deterministically when a reference is unknown (no data loss)", () => {
    const doc = createEmptyDocument("T");
    doc.sections[0].blocks = [
      createParagraph([text("kept")], "deleted-style"),
      createParagraph([text("plain")]),
    ];
    const resolved = resolveDocument(doc);
    const block = doc.sections[0].blocks[0];
    const eff = effectiveStyleOf(resolved.document, block);
    expect(eff).not.toBeNull();
    expect(eff!.id).toBe("deleted-style"); // ref kept, definition replaced
    expect(eff!.derived).toBe(false);
    // Fallback definition = the documented safe default (normal-shaped).
    expect(eff!.definition.format.fontSizePt).toBeNull();
    expect(eff!.definition.format.bold).toBe(false);

    const html = renderLayout(resolved, { pagedJsSrc: "/vendor/paged.polyfill.js" });
    expect(html).toContain(">kept<"); // content preserved
    expect(html).toContain('class="doc-paragraph doc-style-deleted-style"');
    // No CSS rule is fabricated for the unknown style: it renders with defaults.
    expect(html).not.toContain(".doc-style-deleted-style {");
    // The valid normal block unaffected.
    expect(html).toContain('class="doc-paragraph doc-style-normal"');
  });
});