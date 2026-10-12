import { describe, expect, it } from "vitest";
import {
  FIELD_KEYS,
  MARGIN_TOKEN_ALIASES,
  collectUnresolvedFields,
  escapeHtml,
  fieldDefinition,
  fieldDefinitionsBySource,
  inlineHtml,
  inlineSchema,
  isFieldKey,
  isPageFieldKey,
  marginFieldKey,
  renderLayout,
  resolveField,
  resolveFieldImage,
  resolveFieldText,
  unresolvedFieldMarker,
  unresolvedFieldMessages,
  type Document,
} from "@/core";
import { deserializeDocument, serializeDocument } from "@/core/json/envelope";
import { resolveDocument } from "@/core/resolve";
import {
  createEmptyDocument,
  createParagraph,
  field,
  text,
} from "@/core/ir/factory";

const REQUIRED_KEYS = [
  "document.number",
  "document.title",
  "document.revision",
  "document.effective_date",
  "document.review_date",
  "document.status",
  "laboratory.name",
  "laboratory.address",
  "laboratory.logo",
  "page.number",
  "page.total",
] as const;

/** A fully populated document with every required field resolved. */
function fullyPopulated(): Document {
  const doc = createEmptyDocument("Fields");
  doc.metadata = {
    ...doc.metadata,
    title: "Dynamic fields",
    docNumber: "FIELD-08",
    revision: "03",
    effectiveDate: "2026-01-01",
    reviewDate: "2027-01-01",
    status: "Effective",
    documentType: "SOP",
    department: "Quality",
    preparedBy: "A. Analyst",
    reviewedBy: "R. Reviewer",
    approvedBy: "A. Approver",
    classification: "Internal",
    author: "Author",
    organization: "Org",
  };
  doc.laboratoryProfile = {
    name: "Analytical Laboratory",
    address: "1 Example Road",
    logo: "data:image/svg+xml;utf8,PHN2Zy8+",
  };
  return doc;
}

describe("field key registry (V1-FIELD-001)", () => {
  it("contains every required field key", () => {
    for (const key of REQUIRED_KEYS) expect(FIELD_KEYS).toContain(key);
  });

  it("allow-lists keys and rejects everything else", () => {
    expect(isFieldKey("document.number")).toBe(true);
    expect(isFieldKey("page.total")).toBe(true);
    expect(isFieldKey("document.nope")).toBe(false);
    expect(isFieldKey("{{document.number}}")).toBe(false);
    expect(isFieldKey(42)).toBe(false);
  });

  it("maps semantic keys to canonical document/laboratory properties", () => {
    expect(fieldDefinition("document.number")?.property).toBe("docNumber");
    expect(fieldDefinition("document.title")?.property).toBe("title");
    expect(fieldDefinition("document.revision")?.property).toBe("revision");
    expect(fieldDefinition("document.effective_date")?.property).toBe("effectiveDate");
    expect(fieldDefinition("document.review_date")?.property).toBe("reviewDate");
    expect(fieldDefinition("document.status")?.property).toBe("status");
    expect(fieldDefinition("laboratory.name")?.property).toBe("name");
    expect(fieldDefinition("laboratory.address")?.property).toBe("address");
    expect(fieldDefinition("laboratory.logo")?.image).toBe(true);
  });

  it("distinguishes page fields from text fields", () => {
    expect(isPageFieldKey("page.number")).toBe(true);
    expect(isPageFieldKey("page.total")).toBe(true);
    expect(isPageFieldKey("document.title")).toBe(false);
  });

  it("groups definitions by source for the picker", () => {
    const lab = fieldDefinitionsBySource("laboratory").map((d) => d.key);
    expect(lab).toEqual(["laboratory.name", "laboratory.address", "laboratory.logo"]);
    expect(fieldDefinitionsBySource("page")).toHaveLength(2);
  });
});

describe("margin-box field bridge (V1-HF-003)", () => {
  it("maps every margin field to a canonical key", () => {
    expect(marginFieldKey("pageNumber")).toBe("page.number");
    expect(marginFieldKey("pageCount")).toBe("page.total");
    expect(marginFieldKey("title")).toBe("document.title");
    expect(marginFieldKey("docNumber")).toBe("document.number");
    expect(marginFieldKey("revision")).toBe("document.revision");
    expect(marginFieldKey("effectiveDate")).toBe("document.effective_date");
    expect(marginFieldKey("reviewDate")).toBe("document.review_date");
    expect(marginFieldKey("status")).toBe("document.status");
    expect(marginFieldKey("laboratoryName")).toBe("laboratory.name");
  });

  it("accepts the legacy [page]/[count] aliases", () => {
    expect(MARGIN_TOKEN_ALIASES.page).toBe("pageNumber");
    expect(MARGIN_TOKEN_ALIASES.count).toBe("pageCount");
  });
});

describe("shared field resolver (V1-FIELD-002)", () => {
  it("resolves populated text fields", () => {
    const doc = fullyPopulated();
    expect(resolveFieldText(doc, "document.number")).toBe("FIELD-08");
    expect(resolveFieldText(doc, "laboratory.name")).toBe("Analytical Laboratory");
    expect(resolveFieldText(doc, "document.review_date")).toBe("2027-01-01");
  });

  it("treats an empty USED source as unresolved, not blank", () => {
    const doc = fullyPopulated();
    doc.metadata.status = "";
    const resolution = resolveField(doc, "document.status");
    expect(resolution.status).toBe("unresolved");
    if (resolution.status === "unresolved") expect(resolution.reason).toMatch(/empty/);
  });

  it("resolves a valid logo to an embedded image and rejects others", () => {
    const doc = fullyPopulated();
    expect(resolveFieldImage(doc, "laboratory.logo")).toMatch(/^data:image\//);
    doc.laboratoryProfile.logo = "https://evil.example/logo.png";
    expect(resolveField(doc, "laboratory.logo").status).toBe("unresolved");
    doc.laboratoryProfile.logo = null;
    expect(resolveField(doc, "laboratory.logo").status).toBe("unresolved");
  });

  it("defers page fields (resolved only after pagination)", () => {
    const doc = fullyPopulated();
    expect(resolveField(doc, "page.number").status).toBe("deferred");
    expect(resolveFieldText(doc, "page.number")).toBeNull();
  });
});

describe("unresolved field report (V1-FIELD-004)", () => {
  it("does not report unused empty metadata", () => {
    const doc = createEmptyDocument("Empty");
    expect(collectUnresolvedFields(doc).occurrences).toHaveLength(0);
  });

  it("reports a USED field whose source is empty, with its location", () => {
    const doc = createEmptyDocument("Used");
    doc.sections[0].blocks = [
      createParagraph([text("Status: "), field("document.status")]),
    ];
    const report = collectUnresolvedFields(doc);
    expect(report.occurrences).toHaveLength(1);
    expect(report.occurrences[0].key).toBe("document.status");
    expect(report.occurrences[0].location).toBe("body");
    expect(report.occurrences[0].sectionId).toBe(doc.sections[0].id);
  });

  it("never reports deferred page fields", () => {
    const doc = createEmptyDocument("Paged");
    doc.sections[0].blocks = [
      createParagraph([field("page.number"), text(" / "), field("page.total")]),
    ];
    expect(collectUnresolvedFields(doc).occurrences).toHaveLength(0);
  });

  it("traces every repeated occurrence but groups the summary by key", () => {
    const doc = createEmptyDocument("Repeated");
    doc.sections[0].blocks = [
      createParagraph([field("document.status")]),
      createParagraph([field("document.status")]),
    ];
    const report = collectUnresolvedFields(doc);
    expect(report.occurrences).toHaveLength(2);
    expect(report.keys).toEqual(["document.status"]);
    expect(unresolvedFieldMessages(report)).toHaveLength(1);
  });

  it("reports header and footer occurrences separately from the body", () => {
    const doc = createEmptyDocument("HF");
    doc.sections[0].header = { parts: [{ kind: "field", field: "laboratoryName" }] };
    doc.sections[0].footer = { parts: [{ kind: "field", field: "status" }] };
    const report = collectUnresolvedFields(doc);
    const locations = report.occurrences.map((o) => o.location).sort();
    expect(locations).toEqual(["footer", "header"]);
  });

  it("reports an unresolved logo used in the body", () => {
    const doc = createEmptyDocument("Logo");
    doc.sections[0].blocks = [createParagraph([field("laboratory.logo")])];
    const report = collectUnresolvedFields(doc);
    expect(report.keys).toEqual(["laboratory.logo"]);
  });
});

describe("inline field rendering (V1-FIELD-003)", () => {
  it("escapes a resolved value as text", () => {
    const doc = fullyPopulated();
    doc.metadata.title = '<b>&"quotes"</b>';
    const html = inlineHtml([field("document.title")], resolveDocument(doc));
    expect(html).toBe(
      '<span class="doc-field doc-field-resolved" data-field="document.title">' +
        escapeHtml('<b>&"quotes"</b>') +
        "</span>",
    );
    expect(html).not.toContain("<b>");
  });

  it("renders the shared marker for an unresolved field", () => {
    const doc = fullyPopulated();
    doc.metadata.status = "";
    const html = inlineHtml([field("document.status")], resolveDocument(doc));
    expect(html).toContain("doc-field-unresolved");
    expect(html).toContain(escapeHtml(unresolvedFieldMarker("document.status")));
  });

  it("renders a safe constrained image for the laboratory logo", () => {
    const html = inlineHtml([field("laboratory.logo")], resolveDocument(fullyPopulated()));
    expect(html).toContain('class="doc-field doc-field-logo"');
    expect(html).toContain('src="data:image/svg+xml;utf8,PHN2Zy8+"');
  });

  it("renders an empty page-field placeholder (filled after pagination)", () => {
    const number = inlineHtml([field("page.number")], resolveDocument(fullyPopulated()));
    const total = inlineHtml([field("page.total")], resolveDocument(fullyPopulated()));
    expect(number).toBe(
      '<span class="doc-field doc-field-page" data-field="page.number" data-page-field="number"></span>',
    );
    expect(total).toContain('data-page-field="total"');
  });

  it("preserves text/marks/field order in one run array", () => {
    const html = inlineHtml(
      [text("See "), field("document.number"), text(" rev "), field("document.revision")],
      resolveDocument(fullyPopulated()),
    );
    expect(html).toBe(
      'See <span class="doc-field doc-field-resolved" data-field="document.number">FIELD-08</span>' +
        ' rev <span class="doc-field doc-field-resolved" data-field="document.revision">03</span>',
    );
  });
});

describe("field-aware layout gating (golden stability)", () => {
  it("emits no field CSS or page-field script for a field-free document", () => {
    const html = renderLayout(resolveDocument(createEmptyDocument("Plain")), {
      pagedJsSrc: "x.js",
    });
    expect(html).not.toContain(".doc-field-unresolved");
    expect(html).not.toContain("materializePageFields");
  });

  it("emits field CSS for a body text field but no page-field script", () => {
    const doc = fullyPopulated();
    doc.sections[0].blocks = [createParagraph([field("document.number")])];
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain(".doc-field-unresolved");
    expect(html).not.toContain("materializePageFields");
  });

  it("emits the page-field materializer only when body page fields exist", () => {
    const doc = fullyPopulated();
    doc.sections[0].blocks = [createParagraph([field("page.number")])];
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain("materializePageFields");
    expect(html).toContain("data-page-field");
  });

  it("resolves margin-box fields through the shared resolver", () => {
    const doc = fullyPopulated();
    doc.sections[0].header = { parts: [{ kind: "field", field: "status" }] };
    doc.sections[0].footer = {
      parts: [
        { kind: "field", field: "laboratoryName" },
        { kind: "text", value: " · " },
        { kind: "field", field: "reviewDate" },
      ],
    };
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain('@top-center { content: "Effective"; }');
    expect(html).toContain('"Analytical Laboratory" " · " "2027-01-01"');
  });

  it("renders an unresolved marker in the margin box instead of a blank", () => {
    const doc = fullyPopulated();
    doc.metadata.status = "";
    doc.sections[0].header = { parts: [{ kind: "field", field: "status" }] };
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain(JSON.stringify(unresolvedFieldMarker("document.status")));
  });

  it("updates every linked occurrence when metadata changes (V1-META-003)", () => {
    const doc = fullyPopulated();
    doc.sections[0].blocks = [
      createParagraph([text("A "), field("document.number")]),
      createParagraph([text("B "), field("document.number")]),
    ];
    const before = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(before.match(/>FIELD-08</g)).toHaveLength(2);
    doc.metadata.docNumber = "FIELD-09";
    const after = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(after.match(/>FIELD-09</g)).toHaveLength(2);
    expect(after).not.toContain(">FIELD-08<");
  });
});

describe("inline schema (ADR-004 additive policy)", () => {
  it("accepts a valid text run and a valid field node", () => {
    expect(inlineSchema.safeParse({ text: "hi", marks: [] }).success).toBe(true);
    expect(inlineSchema.safeParse({ field: "document.number" }).success).toBe(true);
  });

  it("rejects an unknown field key with an actionable issue", () => {
    const result = inlineSchema.safeParse({ field: "document.unknown" });
    expect(result.success).toBe(false);
  });

  it("rejects a contradictory { text, field } object instead of dropping data", () => {
    expect(inlineSchema.safeParse({ text: "x", field: "document.title" }).success).toBe(
      false,
    );
  });
});

describe("document persistence (V1-META-001/002)", () => {
  it("defaults the new metadata and laboratory profile for a pre-M5 document", () => {
    const legacy = {
      schema: "labdoc",
      schema_version: "1.0",
      document: {
        id: "doc_legacy02",
        type: "document",
        metadata: { title: "Legacy" },
        sections: [
          { id: "sec_legacy02", type: "section", blocks: [{ id: "pg_leg0001", type: "paragraph", content: [{ text: "hi" }] }] },
        ],
      },
    };
    const doc = deserializeDocument(JSON.stringify(legacy));
    expect(doc.metadata.title).toBe("Legacy");
    expect(doc.metadata.documentType).toBe("");
    expect(doc.metadata.reviewDate).toBe("");
    expect(doc.metadata.status).toBe("");
    expect(doc.laboratoryProfile).toEqual({ name: "", address: "", logo: null });
  });

  it("round-trips field nodes, marks and the laboratory logo without loss", () => {
    const doc = fullyPopulated();
    doc.sections[0].blocks = [
      createParagraph([
        text("Doc ", [{ type: "bold" }]),
        field("document.number"),
        text(" rev "),
        field("document.revision"),
      ]),
    ];
    const back = deserializeDocument(serializeDocument(doc));
    expect(back).toEqual(doc);
    expect(back.laboratoryProfile.logo).toBe(doc.laboratoryProfile.logo);
  });

  it("rejects an invalid logo with a per-field message", () => {
    const doc = fullyPopulated();
    const parsed = JSON.parse(serializeDocument(doc));
    parsed.document.laboratoryProfile.logo = "https://evil.example/logo.png";
    try {
      deserializeDocument(JSON.stringify(parsed));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(String(err)).toMatch(/logo/);
    }
  });

  it("keeps two documents' laboratory profiles independent", () => {
    const a = fullyPopulated();
    const b = createEmptyDocument("Other");
    expect(b.laboratoryProfile.name).toBe("");
    a.laboratoryProfile.name = "Changed";
    expect(b.laboratoryProfile.name).toBe("");
  });
});
