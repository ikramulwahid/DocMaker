import { describe, expect, it } from "vitest";
import { documentSchema, envelopeSchema } from "@/core/ir/schema";
import {
  createEmptyDocument,
  createHeading,
  createSection,
  createTable,
  text,
} from "@/core/ir/factory";
import { isNodeId, newId } from "@/core/ir/ids";
import { createDocumentFixture } from "./fixtures";

describe("IR ids", () => {
  it("generates ids matching the semantic-id pattern", () => {
    const id = newId("hd");
    expect(id).toMatch(/^[a-z]{2,3}_[a-z0-9]{6,24}$/);
    expect(isNodeId(id)).toBe(true);
    expect(id.startsWith("hd_")).toBe(true);
  });

  it("never encodes visible numbering into ids", () => {
    const ids = Array.from({ length: 50 }, () => newId("pg"));
    expect(new Set(ids).size).toBe(50);
    // ids are random tokens, not counters like pg_1, pg_2, ...
    for (const id of ids) {
      expect(id.replace(/^pg_/, "")).toMatch(/^[a-z0-9]{8}$/);
    }
  });

  it("rejects malformed ids", () => {
    expect(isNodeId("heading-1")).toBe(false);
    expect(isNodeId("")).toBe(false);
    expect(isNodeId(42)).toBe(false);
  });
});

describe("factory defaults", () => {
  it("creates a valid A4 document", () => {
    const doc = createEmptyDocument("SOP-001");
    const parsed = documentSchema.parse(doc);
    expect(parsed.metadata.title).toBe("SOP-001");
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].pageSetup.format).toBe("A4");
    expect(parsed.sections[0].pageSetup.orientation).toBe("portrait");
    expect(parsed.settings.watermark.enabled).toBe(true);
  });

  it("default footer is Page X of Y driven by fields", () => {
    const doc = createEmptyDocument();
    expect(doc.sections[0].footer).toEqual({
      parts: [
        { kind: "text", value: "Page " },
        { kind: "field", field: "pageNumber" },
        { kind: "text", value: " of " },
        { kind: "field", field: "pageCount" },
      ],
    });
  });

  it("factories produce schema-valid structures", () => {
    const doc = createDocumentFixture();
    expect(() => documentSchema.parse(doc)).not.toThrow();
    expect(() => envelopeSchema.parse({
      schema: "labdoc",
      schema_version: "1.0",
      document: doc,
    })).not.toThrow();
  });

  it("table cells hold paragraphs of text runs", () => {
    const table = createTable([
      ["Parameter", "Limit"],
      ["pH", "6.5 – 8.5"],
    ]);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0].cells[1].content[0].content[0].text).toBe("Limit");
    expect(table.headerRow).toBe(true);
  });

  it("heading factory clamps nothing but schema enforces 1..6", () => {
    expect(() => documentSchema.parse({
      schema: "labdoc",
      schema_version: "1.0",
      document: {
        ...createEmptyDocument(),
        sections: [
          createSection([createHeading(9, [text("bad")])]),
        ],
      },
    })).toThrow();
  });
});
