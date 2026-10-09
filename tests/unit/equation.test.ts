/**
 * Equations (V1-EQ-001..003): semantic LaTeX storage, stable ids, KaTeX
 * rendering in the shared layout, JSON + adapter round-trips, and the
 * scientific-notation set. No image/screenshot path is exercised here.
 */
import { describe, expect, it } from "vitest";
import { equationSchema, type Document } from "@/core/ir/schema";
import { createEmptyDocument, createEquation, createParagraph, text } from "@/core/ir/factory";
import { isNodeId } from "@/core/ir/ids";
import { renderMath } from "@/core/equation";
import { renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import { deserializeDocument, serializeDocument } from "@/core/json/envelope";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "@/editor/adapter";

function docWithEquation(latex: string): Document {
  const doc = createEmptyDocument("Equations");
  doc.sections[0].blocks = [
    createParagraph([text("Model:")]),
    createEquation(latex),
  ];
  return doc;
}

describe("equation IR (V1-EQ-001/003)", () => {
  it("accepts a structured equation block with a stable `eq_` id", () => {
    const eq = createEquation("x = y + 1");
    expect(eq.type).toBe("equation");
    expect(eq.id.startsWith("eq_")).toBe(true);
    expect(isNodeId(eq.id)).toBe(true);
    expect(eq.display).toBe(true);
    expect(equationSchema.parse(eq)).toEqual(eq);
  });

  it("requires non-empty LaTeX source (never a screenshot/empty atom)", () => {
    expect(() =>
      equationSchema.parse({ id: "eq_abcdefgh", type: "equation", latex: "" }),
    ).toThrow();
  });

  it("stores only LaTeX source — no rendered HTML or image data in the IR", () => {
    const eq = createEquation("\\frac{a}{b}");
    const keys = Object.keys(eq).sort();
    expect(keys).toEqual(["display", "id", "latex", "type"]);
  });

  it("survives JSON serialize → deserialize with identity intact", () => {
    const doc = docWithEquation("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}");
    const back = deserializeDocument(serializeDocument(doc));
    expect(back).toEqual(doc);
    const equation = back.sections[0].blocks[1];
    expect(equation.type).toBe("equation");
    if (equation.type === "equation") {
      expect(equation.id).toBe(doc.sections[0].blocks[1].id);
      expect(equation.latex).toContain("\\frac");
    }
  });

  it("survives the Tiptap adapter round-trip with the same id", () => {
    const blocks = docWithEquation("E = m c^2").sections[0].blocks;
    expect(tiptapDocToBlocks(blocksToTiptapDoc(blocks))).toEqual(blocks);
  });
});

describe("equation rendering (KaTeX, offline)", () => {
  const quadratic = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";

  it("renders the quadratic formula to KaTeX markup", () => {
    const html = renderMath(quadratic, true);
    expect(html).toContain('class="katex"');
    expect(html).toContain("katex-display");
  });

  it("renders every required scientific-notation symbol without error", () => {
    const symbols = [
      "\\mathrm{H_2O}",
      "\\mathrm{CO_2}",
      "m^2",
      "m^3",
      "10^{-3}",
      "\\mu",
      "\\sigma",
      "\\Delta",
      "\\pm",
      "\\leq",
      "\\geq",
      "\\approx",
      "\\neq",
      "\\sqrt{x}",
      "\\sum_{i=1}^{n} x_i",
    ];
    for (const latex of symbols) {
      const html = renderMath(latex, false);
      expect(html, latex).toContain("katex");
      expect(html, latex).not.toContain("katex-error");
    }
  });

  it("does not throw on malformed LaTeX (renders visible error text)", () => {
    expect(() => renderMath("\\frac{", true)).not.toThrow();
    expect(renderMath("\\frac{", true).length).toBeGreaterThan(0);
  });

  it("appears in the shared layout HTML with its stable id", () => {
    const doc = docWithEquation(quadratic);
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "/p.js" });
    const equation = doc.sections[0].blocks[1];
    expect(html).toContain(`id="${equation.id}"`);
    expect(html).toContain('class="doc-equation display"');
    expect(html).toContain('class="katex"');
    // KaTeX CSS is bundled only for documents that use equations.
    expect(html).toContain("KaTeX (bundled offline)");
    expect(html).toContain("katex/fonts/");
  });

  it("omits the KaTeX bundle for equation-free documents", () => {
    const doc = createEmptyDocument("Plain");
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: "/p.js" });
    expect(html).not.toContain("KaTeX (bundled offline)");
  });

  it("rebases KaTeX font URLs when a base URL is provided", () => {
    const doc = docWithEquation("x");
    const html = renderLayout(resolveDocument(doc), {
      pagedJsSrc: "/p.js",
      katexFontsBaseUrl: "https://example.test/katex/fonts/",
    });
    expect(html).toContain("https://example.test/katex/fonts/KaTeX_Main-Regular.woff2");
  });

  it("does not turn an equation into a script vector (trust disabled)", () => {
    const html = renderMath("\\href{javascript:alert(1)}{click}", true);
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
  });
});
