import { describe, expect, it } from "vitest";
import {
  deserializeDocument,
  DocFormatError,
  serializeDocument,
  tryDeserializeDocument,
} from "@/core/json/envelope";
import { resolveDocument } from "@/core/resolve";
import { createDocumentFixture } from "./fixtures";

describe("JSON round-trip", () => {
  it("preserves full semantics: serialize → deserialize → deep equal", () => {
    const doc = createDocumentFixture();
    const json = serializeDocument(doc);
    const back = deserializeDocument(json);
    expect(back).toEqual(doc);
  });

  it("is byte-stable across repeated round-trips", () => {
    const doc = createDocumentFixture();
    const json1 = serializeDocument(doc);
    const json2 = serializeDocument(deserializeDocument(json1));
    const json3 = serializeDocument(deserializeDocument(json2));
    expect(json2).toBe(json1);
    expect(json3).toBe(json1);
  });

  it("emits the versioned labdoc envelope", () => {
    const parsed = JSON.parse(serializeDocument(createDocumentFixture()));
    expect(parsed.schema).toBe("labdoc");
    expect(parsed.schema_version).toBe("1.0");
    expect(parsed.document.type).toBe("document");
  });

  it("keeps stable IDs identical through the round-trip", () => {
    const doc = createDocumentFixture();
    const back = deserializeDocument(serializeDocument(doc));
    expect(back.id).toBe(doc.id);
    expect(back.sections.map((s) => s.id)).toEqual(doc.sections.map((s) => s.id));
    expect(back.sections[1].pageSetup.orientation).toBe("landscape");
    expect(back.metadata).toEqual(doc.metadata);
  });

  it("resolve works on round-tripped documents with identical numbering", () => {
    const doc = createDocumentFixture();
    const back = deserializeDocument(serializeDocument(doc));
    expect(resolveDocument(back).numbering).toEqual(resolveDocument(doc).numbering);
  });
});

describe("deserialization failures are explicit", () => {
  it("rejects malformed JSON", () => {
    expect(() => deserializeDocument("{nope")).toThrow(DocFormatError);
  });

  it("rejects the wrong schema name", () => {
    const parsed = JSON.parse(serializeDocument(createDocumentFixture()));
    parsed.schema = "other";
    expect(() => deserializeDocument(JSON.stringify(parsed))).toThrow(/schema/);
  });

  it("rejects an unknown schema_version", () => {
    const parsed = JSON.parse(serializeDocument(createDocumentFixture()));
    parsed.schema_version = "9.9";
    expect(() => deserializeDocument(JSON.stringify(parsed))).toThrow(
      /schema_version=9\.9/,
    );
  });

  it("reports per-field issues for an invalid document", () => {
    const parsed = JSON.parse(serializeDocument(createDocumentFixture()));
    parsed.document.sections = [];
    try {
      deserializeDocument(JSON.stringify(parsed));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DocFormatError);
      expect((err as DocFormatError).message).toMatch(/sections/);
    }
  });

  it("tryDeserialize returns ok:false instead of throwing", () => {
    const result = tryDeserializeDocument("[1,2,3]");
    expect(result.ok).toBe(false);
  });
});

describe("schema versioning policy (ADR-004)", () => {
  it("loads a legacy 1.0 envelope that predates additive fields (defaults apply)", () => {
    // A Phase-0.0-era document: no settings.theme, no pageSetup overrides, no
    // watermark — exactly the shape saved before those fields existed.
    const legacy = {
      schema: "labdoc",
      schema_version: "1.0",
      document: {
        id: "doc_legacy01",
        type: "document",
        metadata: { title: "Legacy" },
        sections: [
          {
            id: "sec_legacy01",
            type: "section",
            blocks: [
              { id: "bl_legacy01", type: "paragraph", content: [{ text: "hi" }] },
            ],
          },
        ],
      },
    };
    const doc = deserializeDocument(JSON.stringify(legacy));
    expect(doc.settings.theme).toBe("lab_default");
    expect(doc.settings.watermark.text).toBe("DRAFT");
    expect(doc.sections[0].pageSetup.orientation).toBe("portrait");
    expect(doc.sections[0].pageSetup.pageNumberStart).toBe(1);
    expect(doc.sections[0].blocks[0].type).toBe("paragraph");
  });

  it("rejects a newer labdoc schema_version with an actionable message", () => {
    const parsed = JSON.parse(serializeDocument(createDocumentFixture()));
    parsed.schema_version = "2.0";
    try {
      deserializeDocument(JSON.stringify(parsed));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DocFormatError);
      const message = (err as DocFormatError).message;
      expect(message).toMatch(/schema_version=2\.0/);
      expect(message).toMatch(/not supported by this build/);
      expect(message).toMatch(/1\.0/);
    }
  });

  it("rejects bare document IR without the labdoc envelope (no silent wrap)", () => {
    const bare = { id: "doc_bare01", type: "document", sections: [] };
    expect(() => deserializeDocument(JSON.stringify(bare))).toThrow(/schema/);
  });
});
