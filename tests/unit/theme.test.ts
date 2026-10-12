/**
 * M7 — theme library & semantic invariance (V1-THEME-001..004).
 *
 * A theme is PRESENTATION ONLY (V1-THEME-004). This suite validates the WHOLE
 * registry, not one pair:
 *  - V1-THEME-001: at least 20 distinct themes (default included);
 *  - V1-THEME-002: at least 5 GENUINELY monochrome B&W themes — the `bw` flag
 *    is a contract, so every colour token is proved neutral (r === g === b);
 *  - every theme has a valid stable id and usable token values;
 *  - every theme resolves and produces valid, theme-specific layout CSS;
 *  - switching theme changes ONLY presentation: content, ids, metadata,
 *    numbering, references (incl. broken-reference diagnostics), dynamic field
 *    values and section structure stay identical, and the serialized document
 *    differs in `settings.theme` alone.
 *
 * The same invariances are checked over a rich document AND the V1-PERF
 * representative document (`tests/support/stressDocument.ts`) so a theme can
 * never quietly corrupt a long, multi-section controlled document.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, listThemes, resolveTheme } from "@/core/theme";
import { buildCss, renderLayout } from "@/core/layout";
import {
  collectBrokenReferences,
  collectReferenceTargets,
  isValidHexColor,
  resolveDocument,
  resolveFieldText,
  serializeDocument,
} from "@/core";
import {
  createDefaultFooter,
  createEmptyDocument,
  createEquation,
  createHeading,
  createImage,
  createList,
  createListItem,
  createParagraph,
  createSection,
  createTable,
  field,
  reference,
  text,
} from "@/core/ir/factory";
import { newId } from "@/core/ir/ids";
import type { Document } from "@/core/ir/schema";
import { buildStressDocument } from "../support/stressDocument";

/** Every colour-valued token. A B&W theme must keep ALL of these neutral. */
type ColorTokenKey =
  | "ink"
  | "headingInk"
  | "mutedInk"
  | "accent"
  | "rule"
  | "tableBorder"
  | "tableHeaderBg"
  | "tableHeaderInk";

const COLOR_TOKENS: readonly ColorTokenKey[] = [
  "ink",
  "headingInk",
  "mutedInk",
  "accent",
  "rule",
  "tableBorder",
  "tableHeaderBg",
  "tableHeaderInk",
];

const PAGED = { pagedJsSrc: "/vendor/paged.polyfill.js" } as const;
const INERT_IMAGE = "data:image/svg+xml;utf8,PHN2Zy8+";

/** Parse `#rgb` / `#rrggbb` into 0–255 channels (tokens are always hex). */
function channels(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** A neutral colour is a pure grey: all three channels equal (the B&W rule). */
function isNeutral(hex: string): boolean {
  const { r, g, b } = channels(hex);
  return r === g && g === b;
}

/** Extract the semantic payload: everything except the selected theme id. */
function semanticsOf(doc: Document): unknown {
  const envelope = JSON.parse(serializeDocument(doc)) as {
    document: { settings: { theme?: string } };
  };
  const clone = JSON.parse(JSON.stringify(envelope.document)) as {
    settings: { theme?: string };
  };
  delete clone.settings.theme;
  return clone;
}

function cloneWithTheme(doc: Document, theme: string): Document {
  const clone = JSON.parse(JSON.stringify(doc)) as Document;
  clone.settings.theme = theme;
  return clone;
}

function bodyOf(html: string): string {
  return html.slice(html.indexOf("<body>"));
}

/**
 * A rich, controlled-document fixture: headings, formatted paragraphs, numbered
 * + bullet lists, tables, images, equations, cross-references (including one
 * deliberately broken target), dynamic body fields, a header/footer with
 * metadata fields, and a second landscape section with restarted numbering.
 */
function richDoc(): Document {
  const doc = createEmptyDocument("Theme Regression Corpus");
  doc.metadata = {
    ...doc.metadata,
    title: "Theme Regression Corpus",
    docNumber: "TRC-001",
    revision: "03",
    effectiveDate: "2026-10-12",
    reviewDate: "2027-10-12",
    status: "Effective",
    author: "A. Author",
    organization: "Acme Laboratories",
    description: "M7 theme-regression fixture",
    documentType: "SOP",
    department: "Quality",
    preparedBy: "A. Author",
    reviewedBy: "R. Reviewer",
    approvedBy: "A. Approver",
    classification: "Internal",
  };
  doc.laboratoryProfile = {
    name: "Acme Laboratories",
    address: "1 Lab Way",
    logo: INERT_IMAGE,
  };

  const scope = createHeading(1, [text("Scope")]);
  const responsibilities = createHeading(2, [text("Responsibilities")]);
  const duties = createHeading(3, [text("Analyst duties")]);
  const table = createTable(
    [
      ["Parameter", "Limit"],
      ["pH", "6.5 – 8.5"],
      ["Conductivity", "< 1.0 µS/cm"],
    ],
    { caption: "Acceptance limits" },
  );
  const figure = createImage(INERT_IMAGE, { alt: "trend", caption: "Trend plot" });
  const equation = createEquation("E = m c^2", true);
  const numbered = createList({
    listType: "decimal",
    items: [
      createListItem([text("Collect the sample.")]),
      createListItem([text("Record the result.")]),
    ],
  });
  const bulleted = createList({
    listType: "bullet",
    items: [createListItem([text("Reference material within expiry.")])],
  });

  const primary = createSection([
    scope,
    createParagraph([
      text("Formatted: "),
      text("bold", [{ type: "bold" }]),
      text(", "),
      text("italic", [{ type: "italic" }]),
      text(", "),
      text("code", [{ type: "code" }]),
      text(", "),
      text("link", [{ type: "link", href: "https://example.org/sop" }]),
      text("."),
    ]),
    createParagraph([
      text("Document "),
      field("document.number"),
      text(" — "),
      field("document.title"),
      text(" (rev "),
      field("document.revision"),
      text("), page "),
      field("page.number"),
      text(" of "),
      field("page.total"),
      text("."),
    ]),
    numbered,
    bulleted,
    responsibilities,
    createParagraph([
      text("See "),
      reference(scope.id, "heading"),
      text(", "),
      reference(table.id, "table"),
      text(", "),
      reference(figure.id, "figure"),
      text(" and "),
      reference(equation.id, "equation"),
      text("; a dangling pointer "),
      reference("hd_missing0001", "heading"),
      text("."),
    ]),
    createTable(
      [
        ["Result", "Value"],
        ["pH", "7.1"],
      ],
      { caption: "Recorded results" },
    ),
    duties,
    figure,
    equation,
    { id: newId("hr"), type: "horizontalRule" as const },
  ]);
  primary.header = {
    parts: [
      { kind: "field", field: "docNumber" },
      { kind: "text", value: " | " },
      { kind: "field", field: "title" },
      { kind: "text", value: " | Rev " },
      { kind: "field", field: "revision" },
    ],
  };
  primary.footer = createDefaultFooter();

  const appendix = createSection([
    createHeading(1, [text("Appendix A — Data")]),
    createParagraph([text("Landscape data section.")]),
    createTable([["Run", "Value"], ["1", "7.2"]], { caption: "Raw data" }),
  ]);
  appendix.pageSetup.orientation = "landscape";
  appendix.pageSetup.pageNumberStart = 2;
  appendix.header = { parts: [{ kind: "field", field: "laboratoryName" }] };

  doc.sections = [primary, appendix];
  return doc;
}

/** Built once; deep-cloned per theme so ids are shared across comparisons. */
const RICH = richDoc();
const DEFAULT_RESOLVED = resolveDocument(RICH);
const DEFAULT_BODY = bodyOf(renderLayout(DEFAULT_RESOLVED, PAGED));

describe("theme registry — V1-THEME-001/002", () => {
  it("ships at least 20 distinct themes including the default", () => {
    const themes = listThemes();
    expect(themes.length).toBeGreaterThanOrEqual(20);
    const ids = themes.map((t) => t.id);
    expect(ids).toContain(DEFAULT_THEME_ID);
    expect(new Set(ids).size).toBe(themes.length);
  });

  it("ships at least 5 genuinely monochrome (B&W) themes", () => {
    const themes = listThemes();
    const bw = themes.filter((t) => t.bw);
    expect(bw.length).toBeGreaterThanOrEqual(5);
    expect(themes.some((t) => !t.bw)).toBe(true);
    // The default is a colour theme; the B&W family is a distinct subset.
    expect(resolveTheme(DEFAULT_THEME_ID).bw).toBe(false);
    for (const theme of bw) {
      for (const key of COLOR_TOKENS) {
        const value = theme[key];
        expect(
          isNeutral(value),
          `${theme.id}.${key} = ${value} must be neutral (r === g === b)`,
        ).toBe(true);
      }
      // Genuinely monochrome, not one black accent over chromatic elements:
      // the greys actually used must vary (ink != header background, etc.).
      expect(new Set(COLOR_TOKENS.map((key) => theme[key])).size).toBeGreaterThan(1);
    }
  });

  it("gives every theme a valid stable id and usable token values", () => {
    const seen = new Set<string>();
    for (const theme of listThemes()) {
      expect(theme.id, theme.id).toMatch(/^[a-z][a-z0-9_]{1,39}$/);
      expect(seen.has(theme.id), `duplicate id ${theme.id}`).toBe(false);
      seen.add(theme.id);
      expect(theme.label.trim().length).toBeGreaterThan(0);
      for (const stack of [theme.bodyFont, theme.headingFont, theme.monoFont]) {
        expect(stack.trim().length).toBeGreaterThan(0);
      }
      expect(theme.bodyFontPt).toBeGreaterThanOrEqual(6);
      expect(theme.bodyFontPt).toBeLessThanOrEqual(24);
      expect(theme.headingPt).toHaveLength(6);
      for (const pt of theme.headingPt) {
        expect(pt).toBeGreaterThanOrEqual(6);
        expect(pt).toBeLessThanOrEqual(48);
      }
      // The six-level heading scale never grows with depth.
      for (let level = 1; level < theme.headingPt.length; level++) {
        expect(theme.headingPt[level]).toBeLessThanOrEqual(theme.headingPt[level - 1]);
      }
      for (const key of COLOR_TOKENS) {
        expect(isValidHexColor(theme[key]), `${theme.id}.${key} = ${theme[key]}`).toBe(true);
      }
    }
  });

  it("falls back safely for unknown, blank and missing ids (legacy ids still resolve)", () => {
    expect(resolveTheme("does_not_exist").id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme("").id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme(undefined).id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme(null).id).toBe(DEFAULT_THEME_ID);
    // Ids already written into saved documents keep their exact behaviour.
    expect(resolveTheme("lab_default")).toEqual(
      listThemes().find((t) => t.id === "lab_default"),
    );
    expect(resolveTheme("bw_standard")).toEqual(
      listThemes().find((t) => t.id === "bw_standard"),
    );
  });
});

describe("theme → CSS mapping — V1-THEME-003", () => {
  it("resolves every theme and emits valid, theme-specific layout CSS", () => {
    const themes = listThemes();
    const cssSet = new Set<string>();
    for (const theme of themes) {
      const resolved = resolveDocument(cloneWithTheme(RICH, theme.id));
      const css = buildCss(resolved);
      expect(css).toContain("@page");
      expect(css).toContain(`font-family: ${theme.bodyFont}`);
      expect(css).toContain(`font-size: ${theme.bodyFontPt}pt`);
      expect(css).toContain(`color: ${theme.ink}`);
      expect(css).not.toContain("undefined");
      expect(css).not.toContain("NaN");
      cssSet.add(css);
    }
    // Every theme is a genuinely distinct treatment, not a duplicate entry.
    expect(cssSet.size).toBe(themes.length);
  });

  it("renders a complete document for every theme with an identical body", () => {
    for (const theme of listThemes()) {
      const html = renderLayout(resolveDocument(cloneWithTheme(RICH, theme.id)), PAGED);
      expect(html.startsWith("<!doctype html>")).toBe(true);
      expect(html).toContain("</html>");
      expect(html).toContain("<body>");
      // Only the generated CSS changes; semantic markup is byte-identical.
      expect(bodyOf(html)).toBe(DEFAULT_BODY);
    }
  });
});

describe("theme is presentation only — V1-THEME-004", () => {
  it("keeps content, ids, numbering, references and field values identical across themes", () => {
    const baseTargets = collectReferenceTargets(DEFAULT_RESOLVED);
    const baseBroken = collectBrokenReferences(RICH);
    // Guard the test itself: the fixture must actually exercise both.
    expect(baseTargets.length).toBeGreaterThanOrEqual(4);
    expect(baseBroken.occurrences.length).toBeGreaterThan(0);

    for (const theme of listThemes()) {
      const doc = cloneWithTheme(RICH, theme.id);
      const resolved = resolveDocument(doc);

      // Derived numbering (headings/tables/figures/equations/lists).
      expect(resolved.numbering).toEqual(DEFAULT_RESOLVED.numbering);

      // Reference targets, their derived labels, and the broken-target report
      // (diagnostics are part of the semantics — a theme must not hide one).
      expect(collectReferenceTargets(resolved)).toEqual(baseTargets);
      expect(collectBrokenReferences(doc)).toEqual(baseBroken);

      // Resolved dynamic field values.
      expect(resolveFieldText(doc, "document.title")).toBe("Theme Regression Corpus");
      expect(resolveFieldText(doc, "document.number")).toBe("TRC-001");
      expect(resolveFieldText(doc, "document.revision")).toBe("03");

      // Section structure (geometry, headers/footers, page-number restart).
      expect(resolved.document.sections).toEqual(DEFAULT_RESOLVED.document.sections);

      // The serialized document differs in `settings.theme` alone.
      expect(semanticsOf(doc)).toEqual(semanticsOf(RICH));
    }
  });

  it("preserves a long, multi-section V1-PERF document across every theme", () => {
    const perf = buildStressDocument();
    const baseResolved = resolveDocument(perf);
    const baseBody = bodyOf(renderLayout(baseResolved, PAGED));
    for (const theme of listThemes()) {
      const doc = cloneWithTheme(perf, theme.id);
      const resolved = resolveDocument(doc);
      expect(resolved.numbering).toEqual(baseResolved.numbering);
      expect(resolved.document.sections).toEqual(baseResolved.document.sections);
      expect(bodyOf(renderLayout(resolved, PAGED))).toBe(baseBody);
      expect(semanticsOf(doc)).toEqual(semanticsOf(perf));
    }
  });
});
