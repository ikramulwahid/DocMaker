/**
 * M6 — cross-references (V1-REF-001/002/003).
 *
 * The IR stores a TARGET's stable id + kind, never a copied label. The visible
 * label is derived from the numbering engine at resolve time, so inserting,
 * deleting or reordering the target updates every reference. A missing /
 * deleted / wrong-kind target is surfaced as BROKEN (never a blank or stale
 * label). Preview and PDF share this exact pipeline.
 */
import { describe, expect, it } from "vitest";
import {
  REFERENCE_KINDS,
  collectBrokenReferences,
  collectDocumentIssues,
  collectReferenceTargets,
  documentIssueMessages,
  hasBrokenReferences,
  hasDocumentIssues,
  inlineSchema,
  isReferenceKind,
  isReferenceNode,
  missingReferenceMarker,
  referenceMessages,
  renderLayout,
  resolveDocument,
  resolveReference,
} from "@/core";
import { deserializeDocument, serializeDocument } from "@/core/json/envelope";
import {
  createEmptyDocument,
  createEquation,
  createHeading,
  createImage,
  createParagraph,
  createSection,
  createTable,
  field,
  reference,
  text,
} from "@/core/ir/factory";

const IMG = "data:image/svg+xml;utf8,eA==";

/** A document with one reference to each numbered-object family. */
function refDoc() {
  const doc = createEmptyDocument("Refs");
  const h1 = createHeading(1, [text("Purpose")]);
  const h2 = createHeading(2, [text("Scope")]);
  const table = createTable([["A"]] as string[][], { caption: "T" });
  const figure = createImage(IMG, { alt: "plot", caption: "F" });
  const equation = createEquation("E = mc^2", true);
  doc.sections = [
    createSection([
      h1,
      createParagraph([
        text("See "),
        reference(h2.id, "heading"),
        text(", "),
        reference(table.id, "table"),
        text(", "),
        reference(figure.id, "figure"),
        text(" and "),
        reference(equation.id, "equation"),
        text("."),
      ]),
      h2,
      table,
      figure,
      equation,
    ]),
  ];
  return { doc, h1, h2, table, figure, equation };
}

describe("reference node schema (ADR-004 additive policy)", () => {
  it("accepts a well-formed reference for every target kind", () => {
    for (const kind of REFERENCE_KINDS) {
      expect(inlineSchema.safeParse({ ref: "tb_abcdef12", refKind: kind }).success).toBe(true);
      expect(isReferenceKind(kind)).toBe(true);
    }
  });

  it("rejects malformed references instead of dropping data", () => {
    expect(inlineSchema.safeParse({ ref: "not-an-id", refKind: "heading" }).success).toBe(false);
    expect(inlineSchema.safeParse({ ref: "hd_abcdef12", refKind: "widget" }).success).toBe(false);
    expect(inlineSchema.safeParse({ ref: "hd_abcdef12" }).success).toBe(false);
    expect(
      inlineSchema.safeParse({ ref: "hd_abcdef12", refKind: "heading", text: "x" }).success,
    ).toBe(false);
    expect(isReferenceKind("widget")).toBe(false);
  });

  it("keeps the union members structurally exclusive (text / field / ref)", () => {
    const node = { ref: "hd_abcdef12", refKind: "heading" } as const;
    expect(isReferenceNode(node)).toBe(true);
    expect(isReferenceNode({ field: "document.title" })).toBe(false);
    expect(isReferenceNode({ text: "hi", marks: [] })).toBe(false);
  });

  it("persists the stable target id and kind through save/reload (never a label)", () => {
    const doc = createEmptyDocument("Refs");
    const target = createHeading(1, [text("Purpose")]);
    doc.sections[0].blocks = [target, createParagraph([reference(target.id, "heading")])];

    const json = serializeDocument(doc);
    expect(json).toContain(target.id);
    expect(json).toContain('"refKind": "heading"');

    const back = deserializeDocument(json);
    expect(back).toEqual(doc);
    const paragraph = back.sections[0].blocks[1];
    expect(paragraph.type).toBe("paragraph");
    if (paragraph.type === "paragraph") {
      expect(paragraph.content[0]).toEqual({ ref: target.id, refKind: "heading" });
    }
  });
});

describe("reference resolution (V1-REF-002/003)", () => {
  it("resolves each kind to the target's CURRENT derived label", () => {
    const { doc, h2, table, figure, equation } = refDoc();
    const numbering = resolveDocument(doc).numbering;
    expect(resolveReference(numbering, { ref: h2.id, refKind: "heading" })).toEqual({
      status: "resolved",
      label: "1.1",
    });
    expect(resolveReference(numbering, { ref: table.id, refKind: "table" })).toEqual({
      status: "resolved",
      label: "Table 1",
    });
    expect(resolveReference(numbering, { ref: figure.id, refKind: "figure" })).toEqual({
      status: "resolved",
      label: "Figure 1",
    });
    expect(resolveReference(numbering, { ref: equation.id, refKind: "equation" })).toEqual({
      status: "resolved",
      label: "Equation 1",
    });
  });

  it("never copies a label into the IR (labels exist only in the number maps)", () => {
    const { doc } = refDoc();
    const json = serializeDocument(doc);
    expect(json).not.toContain("Table 1");
    expect(json).not.toContain("Figure 1");
    expect(json).not.toContain("Equation 1");
  });

  it("re-derives the label when a target is inserted before it (V1-REF-003)", () => {
    const { doc, table } = refDoc();
    const extra = createTable([["Z"]] as string[][], { caption: "extra" });
    const blocks = doc.sections[0].blocks;
    doc.sections[0].blocks = [blocks[0], extra, ...blocks.slice(1)];

    const numbering = resolveDocument(doc).numbering;
    expect(numbering.tables[extra.id]).toBe("Table 1");
    expect(resolveReference(numbering, { ref: table.id, refKind: "table" })).toEqual({
      status: "resolved",
      label: "Table 2",
    });
  });

  it("distinguishes a wrong-kind target from a missing one", () => {
    const { doc, table } = refDoc();
    const numbering = resolveDocument(doc).numbering;
    const result = resolveReference(numbering, { ref: table.id, refKind: "figure" });
    expect(result.status).toBe("broken");
    if (result.status === "broken") expect(result.reason).toMatch(/is a table/);
  });
});

describe("broken reference detection (AGENTS.md §46)", () => {
  it("detects a deleted target and surfaces an actionable reason", () => {
    const { doc, table } = refDoc();
    doc.sections[0].blocks = doc.sections[0].blocks.filter((b) => b.id !== table.id);

    const report = collectBrokenReferences(doc);
    expect(report.occurrences).toHaveLength(1);
    expect(report.occurrences[0].ref).toBe(table.id);
    expect(report.occurrences[0].refKind).toBe("table");
    expect(report.occurrences[0].sectionId).toBe(doc.sections[0].id);
    expect(report.refs).toEqual([table.id]);
    expect(hasBrokenReferences(doc)).toBe(true);
    expect(referenceMessages(report)[0]).toMatch(/table/);
    expect(referenceMessages(report)[0]).toMatch(/does not exist or was deleted/);
  });

  it("reports nothing for a document with only resolvable references", () => {
    const { doc } = refDoc();
    const report = collectBrokenReferences(doc);
    expect(report.occurrences).toHaveLength(0);
    expect(hasBrokenReferences(doc)).toBe(false);
  });
});

describe("reference target collection (picker)", () => {
  it("lists heading/table/figure/equation targets in document order with current labels", () => {
    const { doc, h2, table } = refDoc();
    const targets = collectReferenceTargets(resolveDocument(doc));
    expect(targets.map((t) => [t.kind, t.label])).toEqual([
      ["heading", "1"],
      ["heading", "1.1"],
      ["table", "Table 1"],
      ["figure", "Figure 1"],
      ["equation", "Equation 1"],
    ]);
    expect(targets.find((t) => t.id === h2.id)?.detail).toBe("Scope");
    expect(targets.find((t) => t.id === table.id)?.detail).toBe("T");
  });
});

describe("derived equation numbering (M6)", () => {
  it("numbers EVERY equation block in document order", () => {
    const doc = createEmptyDocument("Eqs");
    const e1 = createEquation("a", true);
    const e2 = createEquation("b", false);
    const e3 = createEquation("c", true);
    doc.sections = [createSection([e1, e2]), createSection([e3])];
    const { numbering } = resolveDocument(doc);
    expect(numbering.equations[e1.id]).toBe("Equation 1");
    expect(numbering.equations[e2.id]).toBe("Equation 2");
    expect(numbering.equations[e3.id]).toBe("Equation 3");
  });

  it("updates dependent references when an equation is inserted before them", () => {
    const doc = createEmptyDocument("Eqs");
    const e1 = createEquation("a", true);
    const e2 = createEquation("b", true);
    const ref = createParagraph([reference(e2.id, "equation")]);
    doc.sections[0].blocks = [e1, e2, ref];

    expect(
      resolveReference(resolveDocument(doc).numbering, { ref: e2.id, refKind: "equation" }),
    ).toEqual({ status: "resolved", label: "Equation 2" });

    doc.sections[0].blocks = [createEquation("z", true), e1, e2, ref];
    expect(
      resolveReference(resolveDocument(doc).numbering, { ref: e2.id, refKind: "equation" }),
    ).toEqual({ status: "resolved", label: "Equation 3" });
  });
});

describe("reference layout rendering (preview == PDF)", () => {
  it("renders the derived label in a distinguishable span", () => {
    const { doc } = refDoc();
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain('class="doc-ref" data-reference="');
    expect(html).toContain('data-reference-kind="table"');
    expect(html).toContain(">Table 1</span>");
    expect(html).toContain(">1.1</span>");
    expect(html).toContain(">Figure 1</span>");
    expect(html).toContain(">Equation 1</span>");
    expect(html).toContain('class="doc-equation-number">Equation 1</span>');
  });

  it("renders an actionable broken marker, never a blank or stale label", () => {
    const doc = createEmptyDocument("Broken");
    doc.sections[0].blocks = [
      createParagraph([text("See "), reference("hd_missing0001", "heading")]),
    ];
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(html).toContain('data-broken="true"');
    expect(html).toContain(missingReferenceMarker("heading"));
    expect(html).toContain("does not exist or was deleted");
  });

  it("is byte-identical for the same doc and its JSON round-trip (pipeline parity)", () => {
    const { doc } = refDoc();
    const a = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    const b = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    const back = deserializeDocument(serializeDocument(doc));
    const c = renderLayout(resolveDocument(back), { pagedJsSrc: "x.js" });
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it("emits reference CSS only when references exist (golden stability)", () => {
    const plain = renderLayout(resolveDocument(createEmptyDocument("Plain")), {
      pagedJsSrc: "x.js",
    });
    expect(plain).not.toContain(".doc-ref");
    const { doc } = refDoc();
    const withRefs = renderLayout(resolveDocument(doc), { pagedJsSrc: "x.js" });
    expect(withRefs).toContain('.doc-ref[data-broken="true"]');
  });
});

describe("combined document issues (fields + references)", () => {
  it("reports both families through one shared report", () => {
    const doc = createEmptyDocument("Issues");
    doc.sections[0].blocks = [
      createParagraph([field("document.status")]),
      createParagraph([reference("tb_missing0001", "table")]),
    ];
    const report = collectDocumentIssues(doc);
    expect(report.fields.occurrences).toHaveLength(1);
    expect(report.references.occurrences).toHaveLength(1);
    expect(hasDocumentIssues(doc)).toBe(true);
    expect(documentIssueMessages(report)).toHaveLength(2);
  });

  it("reports no issues for a clean document", () => {
    const doc = createEmptyDocument("Clean");
    expect(hasDocumentIssues(doc)).toBe(false);
    expect(documentIssueMessages(collectDocumentIssues(doc))).toEqual([]);
  });
});
