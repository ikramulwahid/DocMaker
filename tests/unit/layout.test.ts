import { describe, expect, it } from "vitest";
import { renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import { deserializeDocument, serializeDocument } from "@/core/json/envelope";
import {
  createEmptyDocument,
  createHeading,
  createImage,
  createParagraph,
  createSection,
  createTable,
  text,
} from "@/core/ir/factory";

function fixtureDoc() {
  const landscape = createSection([
    createHeading(1, [text("Appendix")]),
    createTable(
      [
        ["Eq", "Range", "Cal due"],
        ...Array.from({ length: 6 }, (_, i) => [`EQ-${i}`, "0–220 g", "2026-12-01"]),
      ],
      { caption: "Equipment" },
    ),
  ]);
  landscape.pageSetup.orientation = "landscape";
  landscape.pageSetup.margins = { top: 15, right: 20, bottom: 15, left: 20 };
  landscape.header = {
    parts: [
      { kind: "text", value: "Lab Register | " },
      { kind: "field", field: "docNumber" },
    ],
  };

  const doc = createEmptyDocument("Layout <Test>");
  doc.metadata.docNumber = "TM-001";
  doc.sections = [
    createSection([
      createHeading(1, [text("Purpose")]),
      createParagraph([text("Body with <script> & \"quotes\"")]),
      createHeading(2, [text("Details")]),
      createImage("data:image/svg+xml;utf8,AAAA", { caption: "Curve" }),
      createTable([["A", "B"], ["1", "2"], ["3", "4"]], { caption: "Results" }),
    ]),
    landscape,
  ];
  return doc;
}

describe("layout rendering (shared preview/PDF pipeline)", () => {
  const html = renderLayout(resolveDocument(fixtureDoc()), {
    pagedJsSrc: "/vendor/paged.polyfill.js",
    title: "Layout Test",
  });

  it("is a complete HTML document booting Paged.js", () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<script src="/vendor/paged.polyfill.js"></script>');
    expect(html).toContain("window.PagedConfig");
    expect(html).toContain("window.__layoutDone = false;");
  });

  it("emits one named @page per section with orientation + margins", () => {
    expect(html.match(/@page sec_[a-z0-9]+ \{/g)).toHaveLength(2);
    expect(html).toContain("size: 210mm 297mm");
    expect(html).toContain("size: 297mm 210mm");
    expect(html).toContain("margin: 15mm 20mm 15mm 20mm");
    expect(html).toMatch(/\.doc-section-sec_[a-z0-9]+ \{ page: sec_[a-z0-9]+; \}/);
  });

  it("ships the named-page sheet-var workaround per section", () => {
    // width + height (and side variants) for each of the two sections
    expect(html.match(/--pagedjs-(width|height): \d+mm;/g)?.length).toBe(4);
    expect(html.match(/\.pagedjs_sec_[a-z0-9]+_page \{/g)).toHaveLength(2);
  });

  it("renders headers/footers with Page X of Y counters and metadata fields", () => {
    expect(html).toContain("counter(page)");
    expect(html).toContain("counter(pages)");
    expect(html).toContain('"Lab Register | " "TM-001"');
    expect(html).toContain('"Page "');
    // fixture footer: Page X of Y
    expect(html).toMatch(/@bottom-right \{ content: "Page " counter\(page\) " of " counter\(pages\); \}/);
  });

  it("renders derived numbering into headings, captions — not into ids", () => {
    expect(html).toContain('<span class="doc-num">1</span>');
    expect(html).toContain('<span class="doc-num">1.1</span>');
    expect(html).toContain("Table 1 — Results");
    expect(html).toContain("Table 2 — Equipment");
    expect(html).toContain("Figure 1 — Curve");
    // ids stay semantic/random, never numbered
    expect(html).toMatch(/id="hd_[a-z0-9]{8}"/);
    expect(html).not.toMatch(/id="[^"]*\b1\.[0-9]/);
  });

  it("marks continuation-prone tables with thead + tbody split", () => {
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain('class="doc-table"');
  });

  it("escapes user text", () => {
    expect(html).toContain("Body with &lt;script&gt; &amp; &quot;quotes&quot;");
    expect(html).not.toContain("<script> &");
  });

  it("embeds the watermark CSS from settings", () => {
    expect(html).toContain(".pagedjs_sheet::after");
    expect(html).toContain('content: "DRAFT"');
  });

  it("includes the repeated-thead handler", () => {
    expect(html).toContain("repeatTheads");
    expect(html).toContain("Paged.registerHandlers");
  });

  it("showPageNumber:false hides page counters but keeps other footer content", () => {
    // Default footer is only "Page X of Y" → nothing meaningful left → omitted.
    const doc = createEmptyDocument();
    doc.sections[0].pageSetup.showPageNumber = false;
    const out = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(out).not.toContain("@bottom-right");
    // No @bottom-right rule referencing the page counter (the layout script
    // legitimately contains the literal string "counter(page)" — scope to CSS).
    expect(out).not.toMatch(/@bottom-right \{[^}]*counter\(page\)/);

    // Footer with unrelated content (doc number) keeps it; only the counter
    // tokens + their phrase scaffolding are stripped.
    const doc2 = createEmptyDocument();
    doc2.metadata.docNumber = "TM-001";
    doc2.sections[0].footer = {
      parts: [
        { kind: "field", field: "docNumber" },
        { kind: "text", value: " — Page " },
        { kind: "field", field: "pageNumber" },
        { kind: "text", value: " of " },
        { kind: "field", field: "pageCount" },
      ],
    };
    doc2.sections[0].pageSetup.showPageNumber = false;
    const out2 = renderLayout(resolveDocument(doc2), { pagedJsSrc: "x.js" });
    expect(out2).toContain('@bottom-right { content: "TM-001"; }');
    expect(out2).not.toMatch(/@bottom-right \{[^}]*counter\(page\)/);
  });

  it("output is deterministic for the same document", () => {
    const doc = fixtureDoc();
    const a = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    const b = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(a).toBe(b);
    // …and for its JSON round-trip (preview = loaded file = PDF)
    const back = deserializeDocument(serializeDocument(doc));
    const c = renderLayout(resolveDocument(back), { pagedJsSrc: "x.js" });
    expect(c).toBe(a);
  });

  it("emits data-counter-page-reset only for non-1 starts", () => {
    const doc = createEmptyDocument();
    doc.sections[0].pageSetup.pageNumberStart = 5;
    const out = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(out).toContain('data-counter-page-reset="5"');
    const out2 = renderLayout(resolveDocument(createEmptyDocument()), {
      pagedJsSrc: "x.js",
    });
    // The layout script legitimately contains the string inside its selector —
    // scope the assertion to an emitted section attribute (with a value).
    expect(out2).not.toContain('data-counter-page-reset="');
  });
});
