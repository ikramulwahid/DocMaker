/**
 * M2 — Character and paragraph formatting (V1-FMT-001/002 MUST; V1-FMT-003
 * SHOULD feasible subset). Evidence for the documented acceptance gates:
 * structured marks, per-block paragraph overrides, the shared hex validator,
 * run-level exclusivity, render-boundary re-validation, and additive load of
 * pre-M2 (M1 / legacy style-less) documents.
 */
import { describe, expect, it } from "vitest";
import {
  blocksToTiptapDoc,
  tiptapDocToBlocks,
  type TiptapNode,
} from "@/editor/adapter";
import {
  EMPTY_PARAGRAPH_FORMAT,
  inlineSchema,
  markSchema,
  paragraphFormatOverrideSchema,
  styleFormatSchema,
  type Block,
  type Inline,
  type Paragraph,
  type ParagraphFormatOverride,
  type TextRun,
} from "@/core/ir/schema";
import { createEmptyDocument, createHeading, createParagraph, createTable, text } from "@/core/ir/factory";
import { hexColorProblem, isValidHexColor, fontSizePtProblem } from "@/core/ir/sanitize";
import { serializeDocument, deserializeDocument } from "@/core/json/envelope";
import { resolveDocument } from "@/core/resolve";
import { blockHtml, inlineHtml, paragraphFormatStyle } from "@/core/layout";
import { createDocumentFixture } from "./fixtures";

function roundTrip(blocks: Block[]): Block[] {
  return tiptapDocToBlocks(blocksToTiptapDoc(blocks));
}

/* ------------------------------------------- 1. shared hex validator (M1 fix) */

describe("M2 — hex colour validator", () => {
  it("accepts exactly the CSS hex lengths 3, 4, 6, 8", () => {
    for (const ok of ["#fff", "#FFF", "#ffff", "#1f3a5f", "#1F3A5F", "#1f3a5f80"]) {
      expect(isValidHexColor(ok), ok).toBe(true);
    }
  });

  it("rejects the 5- and 7-digit strings the old {3,8} quantifier allowed", () => {
    for (const bad of ["#ff", "#fffff", "#1f3a5", "#1f3a5f0a1", "#1234567", "#12345", "#", "# 1f3a5f"]) {
      expect(isValidHexColor(bad), bad).toBe(false);
    }
  });

  it("rejects non-hex, missing #, and control characters", () => {
    for (const bad of ["1f3a5f", "#zzzzzz", "#1f3a5g", "#1f3a5f\n", "red"]) {
      expect(isValidHexColor(bad), bad).toBe(false);
    }
    expect(hexColorProblem("#1f3a5f")).toBeNull();
    expect(hexColorProblem("#1f3a5")).toMatch(/invalid hex colour/);
  });

  it("applies to the style colour token (regression for the M1 regex bug)", () => {
    expect(styleFormatSchema.safeParse({ color: "#1f3a5f" }).success).toBe(true);
    expect(styleFormatSchema.safeParse({ color: "#1f3a5" }).success).toBe(false);
    expect(styleFormatSchema.safeParse({ color: "#1f3a5f0" }).success).toBe(false);
  });
});

/* --------------------------------------- 2. structured marks (V1-FMT-001) */

describe("M2 — character marks (schema)", () => {
  it("validates every new mark type as structured data", () => {
    const marks = [
      { type: "underline" },
      { type: "strike" },
      { type: "superscript" },
      { type: "subscript" },
      { type: "textCase", transform: "uppercase" },
      { type: "textCase", transform: "lowercase" },
      { type: "fontFamily", fontFamily: "serif" },
      { type: "fontFamily", fontFamily: "sans" },
      { type: "fontFamily", fontFamily: "mono" },
      { type: "fontSize", fontSizePt: 14 },
      { type: "color", color: "#1f3a5f" },
      { type: "highlight", color: "#fff3b0" },
    ];
    for (const mark of marks) {
      expect(markSchema.safeParse(mark).success, JSON.stringify(mark)).toBe(true);
    }
  });

  it("rejects free-form/invalid mark values (no arbitrary CSS)", () => {
    expect(markSchema.safeParse({ type: "fontFamily", fontFamily: "comic-sans" }).success).toBe(false);
    expect(markSchema.safeParse({ type: "color", color: "red" }).success).toBe(false);
    expect(markSchema.safeParse({ type: "color", color: "#12345" }).success).toBe(false);
    expect(markSchema.safeParse({ type: "highlight", color: "#1234567" }).success).toBe(false);
    expect(markSchema.safeParse({ type: "textCase", transform: "capitalize" }).success).toBe(false);
  });

  it("bounds font size to the documented 6–72 pt range", () => {
    expect(fontSizePtProblem(6)).toBeNull();
    expect(fontSizePtProblem(72)).toBeNull();
    expect(markSchema.safeParse({ type: "fontSize", fontSizePt: 6 }).success).toBe(true);
    expect(markSchema.safeParse({ type: "fontSize", fontSizePt: 72 }).success).toBe(true);
    expect(markSchema.safeParse({ type: "fontSize", fontSizePt: 5.9 }).success).toBe(false);
    expect(markSchema.safeParse({ type: "fontSize", fontSizePt: 72.1 }).success).toBe(false);
    expect(markSchema.safeParse({ type: "fontSize", fontSizePt: Number.NaN }).success).toBe(false);
  });

  it("rejects contradictory marks within one run (sup/sub, upper/lower)", () => {
    expect(
      inlineSchema.safeParse({
        text: "x",
        marks: [{ type: "superscript" }, { type: "subscript" }],
      }).success,
    ).toBe(false);
    expect(
      inlineSchema.safeParse({
        text: "x",
        marks: [
          { type: "textCase", transform: "uppercase" },
          { type: "textCase", transform: "lowercase" },
        ],
      }).success,
    ).toBe(false);
  });

  it("allows each exclusive mark in separate runs (and with other marks)", () => {
    expect(inlineSchema.safeParse({ text: "a", marks: [{ type: "superscript" }] }).success).toBe(true);
    expect(inlineSchema.safeParse({ text: "b", marks: [{ type: "subscript" }] }).success).toBe(true);
    expect(
      inlineSchema.safeParse({
        text: "c",
        marks: [{ type: "superscript" }, { type: "bold" }, { type: "underline" }],
      }).success,
    ).toBe(true);
    expect(
      inlineSchema.safeParse({
        text: "d",
        marks: [{ type: "textCase", transform: "uppercase" }, { type: "italic" }],
      }).success,
    ).toBe(true);
  });
});

/* --------------------------------- 3. adapter round-trip (V1-FMT-001/002) */

describe("M2 — adapter round-trip", () => {
  it("preserves every character mark through IR → Tiptap → IR", () => {
    const blocks: Block[] = [
      {
        id: "pg_abcdef12",
        type: "paragraph",
        style: null,
        format: EMPTY_PARAGRAPH_FORMAT,
        content: [
          { text: "a", marks: [{ type: "bold" }] },
          { text: "b", marks: [{ type: "italic" }] },
          { text: "c", marks: [{ type: "code" }] },
          { text: "d", marks: [{ type: "underline" }] },
          { text: "e", marks: [{ type: "strike" }] },
          { text: "f", marks: [{ type: "superscript" }] },
          { text: "g", marks: [{ type: "subscript" }] },
          { text: "h", marks: [{ type: "textCase", transform: "uppercase" }] },
          { text: "i", marks: [{ type: "textCase", transform: "lowercase" }] },
          { text: "j", marks: [{ type: "fontFamily", fontFamily: "serif" }] },
          { text: "k", marks: [{ type: "fontSize", fontSizePt: 14 }] },
          { text: "l", marks: [{ type: "color", color: "#1f3a5f" }] },
          { text: "m", marks: [{ type: "highlight", color: "#fff3b0" }] },
          { text: "n", marks: [{ type: "link", href: "https://example.org/sop" }] },
          { text: "o", marks: [{ type: "bold" }, { type: "underline" }] },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("preserves paragraph overrides through IR → Tiptap → IR", () => {
    const blocks: Block[] = [
      {
        id: "pg_abcdef12",
        type: "paragraph",
        style: "note",
        format: {
          alignment: "justify",
          lineSpacing: 1.5,
          spaceBeforeMm: 6,
          spaceAfterMm: 4,
          indentLeftMm: 12,
        },
        content: [{ text: "x", marks: [] }],
      },
      {
        id: "hd_abcdef12",
        type: "heading",
        level: 2,
        style: "heading-2",
        format: {
          alignment: "right",
          lineSpacing: null,
          spaceBeforeMm: null,
          spaceAfterMm: 3,
          indentLeftMm: null,
        },
        content: [{ text: "h", marks: [] }],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("normalizes a foreign run holding both superscript and subscript (keep-first)", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { id: "pg_abcdef12" },
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "superscript" }, { type: "subscript" }, { type: "bold" }],
            },
          ],
        },
      ],
    };
    const block = tiptapDocToBlocks(doc)[0] as Paragraph;
    expect((block.content[0] as TextRun).marks).toEqual([{ type: "superscript" }, { type: "bold" }]);
  });

  it("normalizes a foreign run holding both text cases (keep-first)", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { id: "pg_abcdef12" },
          content: [
            {
              type: "text",
              text: "x",
              marks: [
                { type: "textCase", attrs: { transform: "uppercase" } },
                { type: "textCase", attrs: { transform: "lowercase" } },
              ],
            },
          ],
        },
      ],
    };
    const block = tiptapDocToBlocks(doc)[0] as Paragraph;
    expect((block.content[0] as TextRun).marks).toEqual([{ type: "textCase", transform: "uppercase" }]);
  });

  it("drops invalid foreign mark values instead of failing the load", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { id: "pg_abcdef12" },
          content: [
            {
              type: "text",
              text: "x",
              marks: [
                { type: "color", attrs: { color: "red" } },
                { type: "fontSize", attrs: { fontSizePt: 999 } },
                { type: "fontFamily", attrs: { fontFamily: "comic-sans" } },
                { type: "bold" },
              ],
            },
          ],
        },
      ],
    };
    const block = tiptapDocToBlocks(doc)[0] as Paragraph;
    expect((block.content[0] as TextRun).marks).toEqual([{ type: "bold" }]);
  });

  it("normalizes invalid foreign paragraph overrides to inherit (null)", () => {
    const doc: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: {
            id: "pg_abcdef12",
            format: {
              alignment: "banana",
              lineSpacing: 99,
              spaceBeforeMm: -1,
              indentLeftMm: 500,
              spaceAfterMm: 4,
            },
          },
          content: [{ type: "text", text: "x" }],
        },
      ],
    };
    const block = tiptapDocToBlocks(doc)[0] as Paragraph;
    expect(block.format).toEqual({
      alignment: null,
      lineSpacing: null,
      spaceBeforeMm: null,
      spaceAfterMm: 4,
      indentLeftMm: null,
    });
  });
});

/* ------------------------------ 4. paragraph overrides (V1-FMT-002) */

describe("M2 — paragraph overrides (schema + factory)", () => {
  it("validates the documented override bounds and rejects the rest", () => {
    expect(paragraphFormatOverrideSchema.safeParse({}).success).toBe(true);
    expect(
      paragraphFormatOverrideSchema.safeParse({
        alignment: "center",
        lineSpacing: 1.5,
        spaceBeforeMm: 6,
        spaceAfterMm: 4,
        indentLeftMm: 12,
      }).success,
    ).toBe(true);
    expect(paragraphFormatOverrideSchema.safeParse({ alignment: "inherit" }).success).toBe(false);
    expect(paragraphFormatOverrideSchema.safeParse({ lineSpacing: 5 }).success).toBe(false);
    expect(paragraphFormatOverrideSchema.safeParse({ lineSpacing: 0.5 }).success).toBe(false);
    expect(paragraphFormatOverrideSchema.safeParse({ spaceBeforeMm: -1 }).success).toBe(false);
    expect(paragraphFormatOverrideSchema.safeParse({ spaceAfterMm: 51 }).success).toBe(false);
    expect(paragraphFormatOverrideSchema.safeParse({ indentLeftMm: 81 }).success).toBe(false);
  });

  it("fills the canonical all-null shape for blocks with no explicit format", () => {
    const p = createParagraph([text("plain")]);
    expect(p.format).toEqual(EMPTY_PARAGRAPH_FORMAT);
    const h = createHeading(1, [text("head")]);
    expect(h.format).toEqual(EMPTY_PARAGRAPH_FORMAT);
  });
});

describe("M2 — paragraph override rendering (defense in depth)", () => {
  it("emits only the set override declarations, in a stable order", () => {
    expect(paragraphFormatStyle(EMPTY_PARAGRAPH_FORMAT)).toBe("");
    expect(
      paragraphFormatStyle({
        alignment: "center",
        lineSpacing: null,
        spaceBeforeMm: null,
        spaceAfterMm: null,
        indentLeftMm: null,
      }),
    ).toBe("text-align:center");
    expect(
      paragraphFormatStyle({
        alignment: "justify",
        lineSpacing: 1.5,
        spaceBeforeMm: 6,
        spaceAfterMm: 4,
        indentLeftMm: 12,
      }),
    ).toBe("text-align:justify; line-height:1.5; margin-top:6mm; margin-bottom:4mm; margin-left:12mm");
  });

  it("skips values that bypassed schema validation (renders plain/inherit)", () => {
    const bad = {
      alignment: "banana",
      lineSpacing: 99,
      spaceBeforeMm: -5,
      spaceAfterMm: 999,
      indentLeftMm: 500,
    } as unknown as ParagraphFormatOverride;
    expect(paragraphFormatStyle(bad)).toBe("");
  });

  it("emits the override as an inline style on the block element", () => {
    const doc = createEmptyDocument("x");
    const p = createParagraph([text("hi")]);
    p.format = {
      alignment: "center",
      lineSpacing: null,
      spaceBeforeMm: null,
      spaceAfterMm: null,
      indentLeftMm: null,
    };
    doc.sections[0].blocks = [p];
    const html = blockHtml(p, resolveDocument(doc));
    expect(html).toContain('style="text-align:center"');
  });

  it("merges a table-cell override after the cell margin (override wins)", () => {
    const doc = createEmptyDocument("x");
    const table = createTable(
      [
        ["Parameter", "Result"],
        ["pH", "7.2"],
      ],
      { caption: "t" },
    );
    table.rows[0].cells[0].content[0].format = {
      alignment: "right",
      lineSpacing: null,
      spaceBeforeMm: null,
      spaceAfterMm: null,
      indentLeftMm: null,
    };
    doc.sections[0].blocks = [table];
    const html = blockHtml(table, resolveDocument(doc));
    // margin:0 comes first so the override declarations (appended) win.
    expect(html).toContain('style="margin:0; text-align:right"');
  });
});

/* ---------------------------- 5. render-boundary re-validation of marks */

describe("M2 — mark rendering safety", () => {
  it("renders valid marks with native/validated output", () => {
    expect(inlineHtml([{ text: "u", marks: [{ type: "underline" }] }])).toContain("<u>u</u>");
    expect(inlineHtml([{ text: "s", marks: [{ type: "strike" }] }])).toContain("<s>s</s>");
    expect(inlineHtml([{ text: "p", marks: [{ type: "superscript" }] }])).toContain("<sup>p</sup>");
    expect(inlineHtml([{ text: "b", marks: [{ type: "subscript" }] }])).toContain("<sub>b</sub>");
    expect(inlineHtml([{ text: "c", marks: [{ type: "color", color: "#1f3a5f" }] }])).toContain(
      'style="color:#1f3a5f"',
    );
    expect(inlineHtml([{ text: "h", marks: [{ type: "highlight", color: "#fff3b0" }] }])).toContain(
      'style="background-color:#fff3b0"',
    );
    expect(inlineHtml([{ text: "f", marks: [{ type: "fontFamily", fontFamily: "serif" }] }])).toContain(
      'data-font-family="serif"',
    );
    expect(inlineHtml([{ text: "t", marks: [{ type: "textCase", transform: "uppercase" }] }])).toContain(
      'data-text-case="uppercase"',
    );
    expect(inlineHtml([{ text: "z", marks: [{ type: "fontSize", fontSizePt: 14 }] }])).toContain(
      'style="font-size:14pt"',
    );
  });

  it("renders an invalid colour/font-size mark PLAIN (never as CSS)", () => {
    const badColor = {
      text: "x",
      marks: [{ type: "color", color: "evil;color:red" }],
    } as unknown as Inline;
    const htmlColor = inlineHtml([badColor]);
    expect(htmlColor).toContain("x");
    expect(htmlColor).not.toContain("evil");
    expect(htmlColor).not.toContain("color:red");

    const badSize = {
      text: "y",
      marks: [{ type: "fontSize", fontSizePt: 0 }],
    } as unknown as Inline;
    expect(inlineHtml([badSize])).not.toContain("font-size");
  });

  it("rejects a non-hex 5/7-digit colour at the render boundary", () => {
    const bad = {
      text: "z",
      marks: [{ type: "highlight", color: "#12345" }],
    } as unknown as Inline;
    const html = inlineHtml([bad]);
    expect(html).toContain("z");
    expect(html).not.toContain("background-color");
  });
});

/* ------------------- 6. additive load: legacy (style-less) + M1 documents */

describe("M2 — additive load compatibility (ADR-004)", () => {
  it("loads a legacy style-less paragraph, filling format with the all-null shape", () => {
    const doc = createEmptyDocument("Legacy");
    const p = createParagraph([text("legacy")]);
    delete (p as { format?: unknown }).format; // pre-M2 file shape
    doc.sections[0].blocks = [p];
    const json = serializeDocument(doc);
    const back = deserializeDocument(json);
    const block = back.sections[0].blocks[0] as Paragraph;
    expect(block.format).toEqual(EMPTY_PARAGRAPH_FORMAT);
    expect(block.style).toBe("normal");
  });

  it("loads an M1 document (style ref, no format) without corruption", () => {
    const doc = createEmptyDocument("M1");
    const p = createParagraph([text("styled")], "note");
    delete (p as { format?: unknown }).format;
    doc.sections[0].blocks = [p];
    const back = deserializeDocument(serializeDocument(doc));
    const block = back.sections[0].blocks[0] as Paragraph;
    expect(block.style).toBe("note");
    expect(block.format).toEqual(EMPTY_PARAGRAPH_FORMAT);
  });

  it("round-trips marks and overrides through serialize → deserialize exactly", () => {
    const doc = createDocumentFixture();
    const back = deserializeDocument(serializeDocument(doc));
    expect(back).toEqual(doc);
    expect(serializeDocument(back)).toBe(serializeDocument(doc));
  });
});

/* ------------------------------------- 7. overrides never mutate styles */

describe("M2 — overrides are additive, never mutate styles", () => {
  it("setting a paragraph override leaves the style definitions untouched", () => {
    const doc = createDocumentFixture();
    const stylesBefore = JSON.parse(JSON.stringify(doc.styles));
    const target = doc.sections[0].blocks.find((b): b is Paragraph => b.type === "paragraph");
    expect(target).toBeDefined();
    target!.format = {
      alignment: "center",
      lineSpacing: 2,
      spaceBeforeMm: 8,
      spaceAfterMm: 4,
      indentLeftMm: 10,
    };
    expect(doc.styles).toEqual(stylesBefore);
  });

  it("a single override touches only its own aspect (others stay inherit)", () => {
    const p = createParagraph([text("x")]);
    p.format = { ...EMPTY_PARAGRAPH_FORMAT, alignment: "center" };
    expect(p.format).toEqual({
      alignment: "center",
      lineSpacing: null,
      spaceBeforeMm: null,
      spaceAfterMm: null,
      indentLeftMm: null,
    });
  });

  it("theme switch changes only presentation, never overrides/marks/styles", () => {
    const doc = createDocumentFixture();
    const before = JSON.parse(serializeDocument(doc));
    doc.settings.theme = "bw_standard";
    const after = JSON.parse(serializeDocument(doc));
    expect(after.document.sections).toEqual(before.document.sections);
    expect(after.document.styles).toEqual(before.document.styles);
    // Render still succeeds (deterministic) under the new theme.
    expect(renderLayoutSafe(doc)).toBeGreaterThan(0);
  });
});

/** Render the resolved document and return the HTML length (non-empty ⇒ ok). */
function renderLayoutSafe(doc: import("@/core/ir/schema").Document): number {
  return blockHtml(
    doc.sections[0].blocks.find((b) => b.type === "paragraph") ?? doc.sections[0].blocks[0],
    resolveDocument(doc),
  ).length;
}

