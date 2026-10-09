/**
 * Phase 0.3 — untrusted document input hardening (V1-SEC-003, AGENTS.md
 * §27/§61/§99–101).
 *
 * Covers three boundaries:
 *  1. Validators — the allow-lists themselves (image data URIs, column widths).
 *  2. Load boundary — `deserializeDocument` rejects hostile documents with
 *     actionable per-field messages (the envelope is the only accepted input).
 *  3. Rendering boundary — `blockHtml()` re-checks even when a document
 *     bypasses IR validation (defense in depth), so an invalid image source
 *     can never emit an external `src`, and an injected width can never emit
 *     extra CSS declarations.
 */
import { describe, expect, it } from "vitest";
import {
  columnWidthProblem,
  IMAGE_SRC_MAX_CHARS,
  imageSrcProblem,
  isCanonicalBase64,
  isValidColumnWidth,
  sanitizeImageSrc,
} from "@/core/ir/sanitize";
import { DocFormatError, deserializeDocument } from "@/core/json/envelope";
import { resolveDocument } from "@/core/resolve";
import { blockHtml } from "@/core/layout";
import { createEmptyDocument, createImage, createTable } from "@/core/ir/factory";
import type { Block, Document, Table } from "@/core/ir/schema";

/* ------------------------------------------------------------------ data */

// Structurally valid embedded raster data URIs (allow-list grammar is what the
// unit tests verify; real decodability is covered by the golden/e2e suites).
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const GIF_1X1 =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// Percent-encoded SVG — the exact shape shipped in the Phase-0 goldens.
const SVG_PCT =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22420%22%20height%3D%22160%22%3E%3Crect%20width%3D%22420%22%20height%3D%22160%22%20fill%3D%22%23eef6ff%22%2F%3E%3C%2Fsvg%3E";
const SVG_UTF8_FIXTURE = "data:image/svg+xml;utf8,PHN2Zy8+";

function envelopeJsonWith(documentPatch: (doc: Document) => void): string {
  const doc = createEmptyDocument("Untrusted");
  doc.sections[0].blocks = [
    createImage(PNG_1X1),
    createTable([["A", "B"], ["1", "2"]], { columnWidths: ["60px", "40px"] }),
  ];
  documentPatch(doc);
  // Built as a raw envelope ON PURPOSE: serializeDocument() validates, but an
  // untrusted file on disk does not — this is exactly the shape a hostile
  // .labdoc.json could take.
  return JSON.stringify({ schema: "labdoc", schema_version: "1.0", document: doc });
}

/* ------------------------------------------------------- image allow-list */

describe("image src allow-list (local-first, no external fetches)", () => {
  it("accepts supported embedded raster data URIs (base64)", () => {
    for (const src of [
      PNG_1X1,
      GIF_1X1,
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
      "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
      "data:image/bmp;base64,Qk1OAAAAAAA2AAAAAAAFAAA=",
      "data:image/svg+xml;base64,PHN2Zy8+",
    ]) {
      expect(imageSrcProblem(src), src).toBeNull();
      expect(sanitizeImageSrc(src), src).toBe(src);
    }
  });

  it("accepts the SVG shapes already shipped in fixtures/goldens", () => {
    for (const src of [SVG_PCT, SVG_UTF8_FIXTURE, "data:image/svg+xml,<svg/>"]) {
      expect(imageSrcProblem(src), src).toBeNull();
      expect(sanitizeImageSrc(src), src).toBe(src);
    }
  });

  it("rejects external URLs and dangerous schemes", () => {
    for (const src of [
      "https://example.com/photo.png",
      "http://example.com/photo.png",
      "file:///C:/Users/x/photo.png",
      "javascript:alert(1)",
      "blob:https://example.com/uuid",
      "data:text/html;base64,PGh0bWw+PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "data:application/pdf;base64,AAAA", // a data URI, but not an image one
      "images/photo.png", // relative path — not an embedded data URI
      "",
    ]) {
      expect(imageSrcProblem(src), src).not.toBeNull();
      expect(sanitizeImageSrc(src), src).toBeNull();
    }
  });

  it("rejects unsupported image MIME types", () => {
    for (const src of [
      "data:image/tiff;base64,AAAA",
      "data:image/heic;base64,AAAA",
      "data:image/x-icon;base64,AAAA",
      "data:image/svg;base64,PHN2Zy8+", // must be svg+xml
    ]) {
      expect(imageSrcProblem(src), src).toMatch(/unsupported image type/);
      expect(sanitizeImageSrc(src), src).toBeNull();
    }
  });

  it("rejects malformed data URIs", () => {
    for (const src of [
      "data:image/png;base64,", // empty payload
      "data:image/png;base64", // missing comma
      "data:image/png,AAEC", // raster without ;base64
      "data:image/png;base64,!!!!", // non-base64 characters
      "data:image/png;base64,AB\nCD", // control character
      "data:image/svg+xml;utf8,\u0000",
    ]) {
      expect(imageSrcProblem(src), JSON.stringify(src)).not.toBeNull();
      expect(sanitizeImageSrc(src), JSON.stringify(src)).toBeNull();
    }
  });

  it("accepts canonical base64 payloads of every valid padded shape", () => {
    for (const src of [
      "data:image/png;base64,AA==", // 1 byte (pad 2)
      "data:image/png;base64,AAA=", // 2 bytes (pad 1)
      "data:image/png;base64,AAAA", // 3 bytes (no padding)
      "data:image/png;base64,AQID", // 3 non-zero bytes
      "data:image/png;base64,AQIDBA==", // 4 bytes
    ]) {
      expect(imageSrcProblem(src), src).toBeNull();
      expect(sanitizeImageSrc(src), src).toBe(src);
      expect(isCanonicalBase64(src.split(",")[1]!), src).toBe(true);
    }
  });

  it("rejects impossible base64 lengths, character classes and padding", () => {
    for (const src of [
      "data:image/png;base64,A", // single data char — the previously missed gap
      "data:image/png;base64,AA", // length 2
      "data:image/png;base64,AAA", // length 3
      "data:image/png;base64,AAAAA", // length 5
      "data:image/png;base64,A==", // 1 data char with pad 2 → length 3
      "data:image/png;base64,====", // padding only, no data
      "data:image/png;base64,A===", // three pad chars
      "data:image/png;base64,A=AA", // padding before the end
      "data:image/png;base64,AB==", // valid length but non-canonical low bits
      "data:image/png;base64,AB=", // same, one pad
    ]) {
      expect(imageSrcProblem(src), src).toMatch(/base64/);
      expect(sanitizeImageSrc(src), src).toBeNull();
      expect(isCanonicalBase64(src.split(",")[1]!), src).toBe(false);
    }
  });

  it("rejects oversized payloads (max is explicit and documented)", () => {
    const oversized = `data:image/png;base64,${"A".repeat(IMAGE_SRC_MAX_CHARS + 1)}`;
    expect(imageSrcProblem(oversized)).toMatch(/maximum/);
    expect(sanitizeImageSrc(oversized)).toBeNull();
  });
});

/* ----------------------------------------------------- column-width allow-list */

describe("column width allow-list (no CSS injection)", () => {
  it("accepts empty (auto) and non-negative numbers with approved units", () => {
    for (const width of ["", "60px", "40px", "33.3%", "2mm", "1.5cm", "12pt", "0.5px"]) {
      expect(columnWidthProblem(width), JSON.stringify(width)).toBeNull();
      expect(isValidColumnWidth(width), JSON.stringify(width)).toBe(true);
    }
  });

  it("rejects CSS injection, extra properties, and unknown syntax", () => {
    for (const width of [
      "60px;background:url(https://evil.example/x.png)",
      "60px;position:fixed",
      "100% !important",
      "url(https://evil.example/x.png)",
      "width: 60px",
      "expression(alert(1))",
      "60px}</style>",
      "auto",
      "60", // unitless — requires an approved unit
      "60 px", // space inside
      "-10px", // negative
      "1e3px", // exponent notation
      "50vw", // unapproved unit
      "120PX", // units are lower-case only (what the editor emits)
      "1\t0px", // control character
    ]) {
      expect(columnWidthProblem(width), JSON.stringify(width)).not.toBeNull();
      expect(isValidColumnWidth(width), JSON.stringify(width)).toBe(false);
    }
  });
});

/* ---------------------------------------------------------------- load boundary */

describe("untrusted .labdoc.json input is rejected at the load boundary", () => {
  it("loads documents whose image/width values are legitimate", () => {
    const json = envelopeJsonWith(() => {});
    const back = deserializeDocument(json);
    expect(back.sections[0].blocks[0].type).toBe("image");
    const table = back.sections[0].blocks[1];
    expect(table.type).toBe("table");
    if (table.type === "table") expect(table.columnWidths).toEqual(["60px", "40px"]);
  });

  it("rejects an external image URL with an actionable per-field message", () => {
    const json = envelopeJsonWith((doc) => {
      doc.sections[0].blocks[0] = createImage("https://evil.example/x.png");
    });
    try {
      deserializeDocument(json);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DocFormatError);
      const message = (err as DocFormatError).message;
      expect(message).toMatch(/blocks\.0\.src/);
      expect(message).toMatch(/data URI/);
    }
  });

  it("rejects an unsupported image type and an oversized payload", () => {
    const unsupported = envelopeJsonWith((doc) => {
      doc.sections[0].blocks[0] = createImage("data:image/tiff;base64,AAAA");
    });
    expect(() => deserializeDocument(unsupported)).toThrow(/unsupported image type/);

    const oversized = envelopeJsonWith((doc) => {
      doc.sections[0].blocks[0] = createImage(
        `data:image/png;base64,${"A".repeat(IMAGE_SRC_MAX_CHARS + 1)}`,
      );
    });
    expect(() => deserializeDocument(oversized)).toThrow(/maximum/);
  });

  it("rejects an impossibly short base64 payload with an actionable field message", () => {
    const json = envelopeJsonWith((doc) => {
      doc.sections[0].blocks[0] = createImage("data:image/png;base64,A");
    });
    try {
      deserializeDocument(json);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DocFormatError);
      const message = (err as DocFormatError).message;
      expect(message).toMatch(/blocks\.0\.src/);
      expect(message).toMatch(/malformed base64/);
    }
  });

  it("rejects column-width CSS injection with an actionable per-field message", () => {
    const json = envelopeJsonWith((doc) => {
      const table = doc.sections[0].blocks[1];
      if (table.type === "table") {
        table.columnWidths = ["60px;background:url(https://evil.example/x.png)", "40px"];
      }
    });
    try {
      deserializeDocument(json);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DocFormatError);
      const message = (err as DocFormatError).message;
      expect(message).toMatch(/columnWidths/);
      expect(message).toMatch(/invalid column width/);
    }
  });
});

/* ---------------------------------------------------------- render boundary */

describe("rendering boundary defense (bypassing TS/schema cannot leak)", () => {
  const resolved = resolveDocument(createEmptyDocument("defense"));

  it("never emits an external image src; shows an explicit placeholder", () => {
    const hostile: Block = createImage("https://evil.example/x.png", {
      caption: "Hostile",
    });
    const html = blockHtml(hostile, resolved);
    expect(html).not.toContain("src=");
    expect(html).not.toContain("https://evil.example");
    expect(html).toContain("doc-image-invalid");
    expect(html).toContain("Image not rendered");
  });

  it("emits an allow-listed data URI image unchanged", () => {
    const ok = blockHtml(createImage(PNG_1X1, { alt: "plot" }), resolved);
    expect(ok).toContain(`<img src="${PNG_1X1}" alt="plot" />`);
    expect(ok).not.toContain("doc-image-invalid");
  });

  it("emits a colgroup only for fully allow-listed widths", () => {
    const table: Table = createTable([["A", "B"], ["1", "2"]], {
      columnWidths: ["60px", "40px"],
    });
    const html = blockHtml(table, resolved);
    expect(html).toContain('class="doc-table fixed-layout"');
    expect(html).toContain('<col style="width:60px" />');
    expect(html).toContain('<col style="width:40px" />');
  });

  it("skips empty width entries (auto) but keeps the valid colgroup", () => {
    const table: Table = createTable([["A", "B"]], {
      columnWidths: ["120px", ""],
    });
    const html = blockHtml(table, resolved);
    expect(html).toContain('<col style="width:120px" />');
    expect(html).not.toContain('style="width:"'); // empty col never emitted
  });

  it("drops the whole colgroup when ANY width is an injection", () => {
    const table: Table = createTable([["A", "B"], ["1", "2"]], {
      columnWidths: ["60px;background:url(https://evil.example/x.png)", "40px"],
    });
    const html = blockHtml(table, resolved);
    expect(html).not.toContain("<colgroup");
    expect(html).not.toContain("style=\"width:");
    expect(html).not.toContain("url(");
    expect(html).not.toContain("fixed-layout");
    expect(html).toContain('<table id="');
  });
});