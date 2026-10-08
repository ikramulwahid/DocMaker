import { describe, expect, it } from "vitest";
import { deriveNumbering } from "@/core/numbering";
import { resolveDocument } from "@/core/resolve";
import {
  createEmptyDocument,
  createHeading,
  createSection,
  createTable,
  createImage,
  createParagraph,
  text,
} from "@/core/ir/factory";
import { createDocumentFixture } from "./fixtures";

describe("derived numbering", () => {
  it("builds hierarchical heading numbers in document order", () => {
    const doc = createEmptyDocument();
    doc.sections = [
      createSection([
        createHeading(1, [text("A")]),
        createHeading(2, [text("A.1")]),
        createHeading(2, [text("A.2")]),
        createHeading(3, [text("A.2.1")]),
        createHeading(1, [text("B")]),
        createHeading(2, [text("B.1")]),
      ]),
    ];
    const { numbering } = resolveDocument(doc);
    const values = doc.sections[0].blocks.map((b) =>
      b.type === "heading" ? numbering.headings[b.id] : null,
    );
    expect(values).toEqual(["1", "1.1", "1.2", "1.2.1", "2", "2.1"]);
  });

  it("is continuous across sections (portrait → landscape)", () => {
    const doc = createEmptyDocument();
    doc.sections = [
      createSection([createHeading(1, [text("One")])]),
      createSection([createHeading(1, [text("Two")]), createHeading(2, [text("Two.a")])]),
    ];
    const { numbering } = resolveDocument(doc);
    const h = doc.sections.flatMap((s) =>
      s.blocks.filter((b) => b.type === "heading"),
    );
    expect(numbering.headings[h[0].id]).toBe("1");
    expect(numbering.headings[h[1].id]).toBe("2");
    expect(numbering.headings[h[2].id]).toBe("2.1");
  });

  it("numbers tables and figures sequentially across sections", () => {
    const doc = createEmptyDocument();
    const t1 = createTable([["x"]]);
    const img = createImage("data:image/svg+xml;utf8,eA==", { caption: "c" });
    const t2 = createTable([["y"]]);
    doc.sections = [
      createSection([t1, img]),
      createSection([createParagraph(), t2]),
    ];
    const { numbering } = resolveDocument(doc);
    expect(numbering.tables[t1.id]).toBe("Table 1");
    expect(numbering.tables[t2.id]).toBe("Table 2");
    expect(numbering.figures[img.id]).toBe("Figure 1");
  });

  it("keeps numbering intact around bullet lists", () => {
    const doc = createEmptyDocument();
    const table = createTable([["x"]]);
    doc.sections = [
      createSection([
        createHeading(1, [text("top")]),
        {
          id: "bl_abcdef12",
          type: "bulletList",
          items: [createParagraph([text("item one")]), createParagraph([text("item two")])],
        },
        table,
      ]),
    ];
    const { numbering } = resolveDocument(doc);
    const heading = doc.sections[0].blocks.find((b) => b.type === "heading");
    expect(heading && numbering.headings[heading.id]).toBe("1");
    expect(numbering.tables[table.id]).toBe("Table 1");
  });

  it("is deterministic and never stored in the IR", () => {
    const doc = createDocumentFixture();
    const first = deriveNumbering(doc);
    const second = deriveNumbering(doc);
    expect(second).toEqual(first);

    // The serialized IR contains no numbering: captions are bare titles.
    const json = JSON.stringify(doc);
    expect(json).not.toContain("Table 1");
    expect(json).not.toContain("Figure 1");
    expect(doc.sections[0].blocks.find((b) => b.type === "table")?.type).toBe("table");
    const table = doc.sections[0].blocks.find((b) => b.type === "table");
    expect(table && "caption" in table ? table.caption : null).toBe("Results");
  });

  it("survives JSON round-trip unchanged", () => {
    const doc = createDocumentFixture();
    const a = resolveDocument(doc);
    const b = resolveDocument(
      JSON.parse(JSON.stringify({ schema: "labdoc", schema_version: "1.0", document: doc }))
        .document,
    );
    expect(b.numbering).toEqual(a.numbering);
  });

  it("handles a document that starts mid-hierarchy", () => {
    const doc = createEmptyDocument();
    doc.sections = [createSection([createHeading(3, [text("solo")])])];
    const { numbering } = resolveDocument(doc);
    expect(numbering.headings[doc.sections[0].blocks[0].id]).toBe("1");
  });
});
