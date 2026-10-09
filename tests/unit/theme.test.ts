/**
 * Themes (V1-THEME-004 / Prompt 001 §7): a theme is presentation only. This
 * suite proves the semantic document (content, ids, numbering, fields,
 * equations) is byte-identical across themes; only the generated CSS changes.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_ID,
  listThemes,
  resolveTheme,
} from "@/core/theme";
import { buildCss, renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import { serializeDocument } from "@/core/json/envelope";
import {
  createEmptyDocument,
  createEquation,
  createHeading,
  createParagraph,
  createTable,
  text,
} from "@/core/ir/factory";

function richDoc() {
  const doc = createEmptyDocument("Theme Test");
  doc.metadata = {
    title: "Theme Test",
    docNumber: "TM-001",
    revision: "02",
    effectiveDate: "2026-10-09",
    author: "A. Tester",
    organization: "Lab",
    description: "",
  };
  doc.sections[0].blocks = [
    createHeading(1, [text("Heading")]),
    createParagraph([text("Body text for theming.")]),
    createEquation("x = y + 1"),
    createTable(
      [
        ["A", "B"],
        ["1", "2"],
      ],
      { caption: "T" },
    ),
  ];
  return doc;
}

function bodyOf(html: string): string {
  return html.slice(html.indexOf("<body>"));
}

describe("theme registry", () => {
  it("ships at least two clearly distinct themes including the default", () => {
    const themes = listThemes();
    expect(themes.length).toBeGreaterThanOrEqual(2);
    expect(themes.map((t) => t.id)).toContain(DEFAULT_THEME_ID);
    expect(themes.map((t) => t.id)).toContain("bw_standard");
    const ids = new Set(themes.map((t) => t.id));
    expect(ids.size).toBe(themes.length);
  });

  it("falls back to the default for unknown or missing ids", () => {
    expect(resolveTheme("does_not_exist").id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme(undefined).id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme(null).id).toBe(DEFAULT_THEME_ID);
  });
});

describe("theme affects presentation only", () => {
  it("produces different CSS for different themes", () => {
    const lab = richDoc();
    const bw = richDoc();
    bw.sections = lab.sections; // same content/ids
    lab.settings.theme = "lab_default";
    bw.settings.theme = "bw_standard";
    const cssLab = buildCss(resolveDocument(lab));
    const cssBw = buildCss(resolveDocument(bw));
    expect(cssLab).not.toBe(cssBw);
    expect(cssLab).toContain("Georgia");
    expect(cssBw).toContain("Arial");
  });

  it("keeps content, ids, numbering and equations identical across themes", () => {
    const lab = richDoc();
    lab.settings.theme = "lab_default";
    const bw = richDoc();
    bw.settings = { ...lab.settings, theme: "bw_standard" };
    bw.sections = lab.sections;

    const labResolved = resolveDocument(lab);
    const bwResolved = resolveDocument(bw);

    // Derived numbering is identical.
    expect(bwResolved.numbering).toEqual(labResolved.numbering);

    // Rendered body (semantic content) is identical; only <style> differs.
    const labHtml = renderLayout(labResolved, { pagedJsSrc: "/p.js" });
    const bwHtml = renderLayout(bwResolved, { pagedJsSrc: "/p.js" });
    expect(bodyOf(bwHtml)).toBe(bodyOf(labHtml));
    expect(labHtml).not.toBe(bwHtml); // CSS differs

    // The only serialized semantic difference is settings.theme.
    const labEnvelope = JSON.parse(serializeDocument(lab));
    const bwEnvelope = JSON.parse(serializeDocument(bw));
    expect(bwEnvelope.document.sections).toEqual(labEnvelope.document.sections);
    expect(bwEnvelope.document.metadata).toEqual(labEnvelope.document.metadata);
    expect(bwEnvelope.document.settings.theme).toBe("bw_standard");
    expect(labEnvelope.document.settings.theme).toBe("lab_default");
  });
});
