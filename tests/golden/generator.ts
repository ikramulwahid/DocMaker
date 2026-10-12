/**
 * Golden-document builders. Used by golden.test.ts when UPDATE_GOLDEN=1
 * (pnpm golden:update) to (re)write the committed goldens.
 *
 * IDs inside committed JSON files are frozen: the JSON is only written when
 * missing, so document identity never churns. Expected HTML is always
 * regenerated (it must track intentional layout changes).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializeDocument } from "@/core/json/envelope";
import { renderLayout } from "@/core/layout";
import { resolveDocument } from "@/core/resolve";
import {
  createEmptyDocument,
  createEquation,
  createHeading,
  createImage,
  createParagraph,
  createSection,
  createTable,
  field,
  text,
} from "@/core/ir/factory";
import { buildDefaultStyles } from "@/core/ir/styles";
import { documentSchema, type Block, type Document, type List, type ListItem, type PageMargins } from "@/core/ir/schema";
import type { PageFormat } from "@/core/ir/pageGeometry";
import { createDocumentFixture } from "../unit/fixtures";

export const GOLDEN_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PAGED_JS_SRC = "/vendor/paged.polyfill.js";

/** Golden 02 — realistic SOP: metadata-driven header/footer, long table that
 * must split across pages with repeated headers, list, image, landscape
 * appendix, third portrait section. */
export function createSopDocument(): Document {
  const doc = createEmptyDocument("SOP-042 Purified Water Quality Monitoring");
  doc.metadata = {
    ...doc.metadata,
    title: "SOP-042 Purified Water Quality Monitoring",
    docNumber: "SOP-042",
    revision: "02",
    effectiveDate: "2026-10-08",
    author: "Q. A. Manager",
    organization: "Analytical Laboratory",
    description: "Phase-0 golden document: multi-page table + header/footer fields",
  };
  doc.settings.watermark.text = "DRAFT";
  doc.settings.watermark.enabled = true;

  const sec1 = createSection([
    createHeading(1, [text("Purpose")]),
    createParagraph([
      text("This procedure defines the routine monitoring of purified water "),
      text("quality", [{ type: "italic" }]),
      text(" against compendial limits."),
    ]),
    createHeading(1, [text("Responsibilities")]),
    {
      id: "bl_goldensop1",
      type: "bulletList",
      items: [
        createParagraph([text("Analyst performs daily sampling and testing.")]),
        createParagraph([text("Laboratory head reviews records within 5 working days.")]),
      ],
    },
    createHeading(1, [text("Acceptance criteria")]),
    createParagraph([
      text("All parameters shall conform to the limits in Table 1 across the monitoring period."),
    ]),
    // Long table → must split across pages; thead must repeat (handler).
    createTable(
      [
        ["Parameter", "Method", "Limit", "Result 1", "Result 2", "Result 3", "Remark"],
        ...Array.from({ length: 38 }, (_, i) => [
          ["pH", "Turbidity", "TDS", "Chloride", "Hardness", "Iron"][i % 6],
          `IS 3025 Pt. ${40 + (i % 20)}`,
          ["6.5 – 8.5", "< 1 NTU", "< 500 mg/L", "< 250 mg/L", "< 200 mg/L", "< 0.3 mg/L"][i % 6],
          (6.5 + (i % 10) * 0.1).toFixed(1),
          (6.6 + (i % 9) * 0.1).toFixed(1),
          (6.7 + (i % 8) * 0.1).toFixed(1),
          i % 7 === 0 ? "Info" : "Pass",
        ]),
      ],
      { caption: "Purified water acceptance criteria (monitoring period)" },
    ),
    createHeading(2, [text("Trending")]),
    createParagraph([text("Results are trended monthly; see Figure 1.")]),
    createImage(
      "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22420%22%20height%3D%22160%22%3E%3Crect%20width%3D%22420%22%20height%3D%22160%22%20fill%3D%22%23eef6ff%22%20stroke%3D%22%23336699%22%2F%3E%3Cpolyline%20points%3D%2230%2C130%20130%2C100%20230%2C70%20330%2C45%20400%2C30%22%20fill%3D%22none%22%20stroke%3D%22%23336699%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E",
      { alt: "Trending plot", caption: "Conductivity trend (12 months)" },
    ),
  ]);

  const sec2 = createSection([
    createHeading(1, [text("Appendix A — Raw data register")]),
    createParagraph([text("Wide register rendered in landscape orientation.")]),
    createTable(
      [
        ["Run id", "Date", "Analyst", "pH", "Cond.", "TOC", "Endotoxin", "Note"],
        ...Array.from({ length: 12 }, (_, i) => [
          `RUN-${String(1001 + i)}`,
          `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
          ["AK", "RM", "JS"][i % 3],
          (6.8 + (i % 5) * 0.1).toFixed(1),
          `${1.0 + (i % 4) * 0.1} µS/cm`,
          `${12 + i} ppb`,
          "< 0.25 EU/mL",
          i % 3 === 0 ? "retest" : "",
        ]),
      ],
      { caption: "Raw data register" },
    ),
  ]);
  sec2.pageSetup.orientation = "landscape";
  sec2.pageSetup.margins = { top: 15, right: 15, bottom: 15, left: 15 };
  sec2.header = {
    parts: [
      { kind: "field", field: "docNumber" },
      { kind: "text", value: " | Rev " },
      { kind: "field", field: "revision" },
      { kind: "text", value: " | Raw data" },
    ],
  };

  const sec3 = createSection([
    createHeading(1, [text("Appendix B — Sign-off")]),
    createParagraph([text("Prepared by: Q. A. Manager      Approved by: ____________")]),
  ]);

  doc.sections = [sec1, sec2, sec3];
  return doc;
}

export interface Golden {
  name: string;
  doc: Document;
}

/** Realistic lab prose, deterministic, used to fill the gate document. */
function gateProse(): Block[] {
  const sentences = [
    "This controlled document describes the routine receipt, identification and acceptance of laboratory samples.",
    "All activities shall be performed by trained and authorised personnel in accordance with the quality manual.",
    "Records generated during the procedure shall be retained for the period defined by the quality management system.",
    "Where a result falls outside the acceptance criteria, the analyst shall initiate an out-of-specification investigation.",
    "The laboratory shall monitor and record environmental conditions throughout the testing period.",
    "Reagents and reference standards shall be within their stated expiry period at the time of use.",
    "Instrument calibration status shall be verified before each analytical run and documented on the worksheet.",
    "Deviations from this procedure shall be recorded, justified and approved by the laboratory head.",
  ];
  return sentences.map((sentence) => createParagraph([text(sentence)]));
}

const GATE_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22420%22%20height%3D%22160%22%3E%3Crect%20width%3D%22420%22%20height%3D%22160%22%20fill%3D%22%23eef6ff%22%20stroke%3D%22%23336699%22%2F%3E%3Cpolyline%20points%3D%2230%2C130%20130%2C100%20230%2C70%20330%2C45%20400%2C30%22%20fill%3D%22none%22%20stroke%3D%22%23336699%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E";

/**
 * Golden 03 — the exact §46 Phase-0 rendering gate document.
 *
 * Must paginate to EXACTLY five sheets: portrait × 2, landscape × 2,
 * portrait × 1, and carry every gate feature: heading/table numbering,
 * multi-page table with repeated headers, header, footer, Page X of Y, image,
 * equation, watermark, theme and dynamic metadata fields. The exact page
 * sequence is asserted by tests/e2e/phase0-gate.spec.ts.
 */
export function createPhase0GateDocument(): Document {
  const doc = createEmptyDocument("Phase-0 Rendering Gate Document");
  doc.metadata = {
    ...doc.metadata,
    title: "Phase-0 Rendering Gate Document",
    docNumber: "SOP-GATE-001",
    revision: "01",
    effectiveDate: "2026-10-09",
    author: "Q. A. Manager",
    organization: "Analytical Laboratory",
    description: "V1 §46 Phase-0 rendering acceptance gate",
  };
  doc.settings.theme = "lab_default";
  doc.settings.watermark = { enabled: true, text: "DRAFT", opacity: 0.1, angle: -45, fontSizePt: 64 };

  const sec1 = createSection([
    createHeading(1, [text("Purpose")]),
    ...gateProse().slice(0, 4),
    createHeading(1, [text("Scope")]),
    ...gateProse().slice(4, 7),
    createHeading(2, [text("Definitions")]),
    {
      id: "bl_gategate1",
      type: "bulletList",
      items: [
        createParagraph([text("Sample — a portion of material submitted for examination.")]),
        createParagraph([text("Acceptance criterion — a documented limit used to judge conformity.")]),
        createParagraph([text("OOS — a result that falls outside an established acceptance criterion.")]),
      ],
    },
    createHeading(1, [text("Structured equations")]),
    createParagraph([
      text("The analytical model is evaluated using the standard quadratic expression " ),
      text("shown below", [{ type: "italic" }]),
      text("."),
    ]),
    createEquation("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", true),
    createParagraph([
      text("Common scientific and unit notation used in the procedure includes water "),
      text("\\mathrm{H_2O}"),
      text(", carbon dioxide and derived quantities."),
    ]),
    createEquation(
      "\\mathrm{H_2O},\\ \\mathrm{CO_2},\\ m^2,\\ m^3,\\ 10^{-3},\\ \\mu,\\ \\sigma,\\ \\Delta,\\ \\pm,\\ \\leq,\\ \\geq,\\ \\approx,\\ \\neq,\\ \\sqrt{x},\\ \\sum_{i=1}^{n} x_i",
      true,
    ),
    createHeading(1, [text("Acceptance criteria")]),
    createParagraph([text("All parameters shall conform to the limits summarised in Table 1.")]),
    createTable(
      [
        ["Parameter", "Method", "Limit"],
        ["pH", "IS 3025 Pt. 11", "6.5 – 8.5"],
        ["Conductivity", "IS 3025 Pt. 14", "< 1.0 µS/cm"],
        ["TOC", "IS 3025 Pt. 35", "< 500 ppb"],
      ],
      { caption: "Summary acceptance criteria" },
    ),
    createHeading(2, [text("Trending")]),
    createParagraph([text("Results are trended monthly and reported against the limits above; see Figure 1.")]),
    createImage(GATE_IMAGE, { alt: "Trending plot", caption: "Conductivity trend" }),
    ...gateProse().slice(0, 6),
    createHeading(1, [text("Records")]),
    createParagraph([text("Worksheets and instrument printouts are filed as controlled records for five years.")]),
  ]);
  sec1.header = {
    parts: [
      { kind: "field", field: "docNumber" },
      { kind: "text", value: " | " },
      { kind: "field", field: "title" },
      { kind: "text", value: " | Rev " },
      { kind: "field", field: "revision" },
    ],
  };

  const landscapeRows: string[][] = [
    ["Run id", "Analyte", "Method", "Result", "Unit", "Limit", "Analyst", "Remark"],
  ];
  for (let i = 0; i < 28; i++) {
    landscapeRows.push([
      `RUN-${String(2001 + i)}`,
      ["pH", "Turbidity", "TDS", "Chloride", "Hardness", "Iron"][i % 6],
      `IS 3025 Pt. ${40 + (i % 20)}`,
      (6.5 + (i % 10) * 0.1).toFixed(1),
      ["-", "NTU", "mg/L", "mg/L", "mg/L", "mg/L"][i % 6],
      ["6.5–8.5", "< 1", "< 500", "< 250", "< 200", "< 0.3"][i % 6],
      ["AK", "RM", "JS"][i % 3],
      i % 7 === 0 ? "Info" : "Pass",
    ]);
  }
  const sec2 = createSection([
    createHeading(1, [text("Raw data register")]),
    createParagraph([
      text("Wide register rendered in landscape orientation; the table below spans multiple pages and repeats its header row on each continuation page."),
    ]),
    createTable(landscapeRows, { caption: "Raw data register (monitoring period)" }),
  ]);
  sec2.pageSetup.orientation = "landscape";
  sec2.pageSetup.margins = { top: 15, right: 15, bottom: 15, left: 15 };
  sec2.header = {
    parts: [
      { kind: "field", field: "docNumber" },
      { kind: "text", value: " | Raw data | Rev " },
      { kind: "field", field: "revision" },
    ],
  };

  const sec3 = createSection([
    createHeading(1, [text("Sign-off")]),
    createParagraph([text("Prepared by: Q. A. Manager        Reviewed by: ____________")]),
    createEquation("E = m c^2", true),
    createParagraph([
      text("This page closes the Phase-0 gate document and is intentionally a single portrait page."),
    ]),
  ]);

  doc.sections = [sec1, sec2, sec3];
  return doc;
}

/**
 * Golden 04 — reusable style system (V1-STYLE-001..004 / V1-TXT-001).
 * Exercises the semantic heading hierarchy (H1–H4) and the style-based text
 * types (Title, Subtitle, Body Text, Caption, Quote, Note, Warning, Important
 * Notice, Definition, Reference, Table Text) as reusable style references,
 * plus a custom document style to prove custom-style persistence (V1-STYLE-004).
 */
export function createStyleSystemDocument(): Document {
  const doc = createEmptyDocument("Water Quality Monitoring Report");
  doc.metadata = {
    ...doc.metadata,
    title: "Water Quality Monitoring Report",
    docNumber: "WQ-2026-014",
    revision: "01",
    effectiveDate: "2026-10-09",
    author: "N. Analyst",
    organization: "Analytical Laboratory",
    description: "Golden document: style system (V1-STYLE-001..004, V1-TXT-001)",
  };
  doc.settings.watermark.enabled = false;

  // Custom style — document-level, persisted, referenced by blocks below.
  const normal = buildDefaultStyles()["normal"];
  doc.styles["custom-result"] = {
    id: "custom-result",
    name: "Result summary",
    kind: "paragraph",
    headingLevel: null,
    format: { ...normal.format, fontSizePt: 12, bold: true, color: "#1f3a5f" },
  };

  const table = createTable(
    [
      ["Parameter", "Result", "Limit"],
      ["pH", "7.2", "6.5 – 8.5"],
    ],
    { caption: "Monitoring results" },
  );
  table.rows[0].cells[0].content[0].style = "table-text";

  doc.sections = [
    createSection([
      createParagraph([text("Water Quality Monitoring Report")], "title"),
      createParagraph([text("Quarterly compliance summary — Q3 2026")], "subtitle"),
      createHeading(1, [text("Scope")]),
      createParagraph(
        [text("This report summarises routine purified-water monitoring carried out during the quarter.")],
        "body-text",
      ),
      createHeading(2, [text("Definitions")]),
      createParagraph([text("Purified water: water meeting the specification in SOP-042.")], "definition"),
      createHeading(3, [text("Procedure")]),
      createParagraph(
        [text("Samples were collected at the six designated points and analysed daily.")],
        "body-text",
      ),
      createParagraph([text("All collection points met the acceptance criteria in Q3.")], "note"),
      createParagraph([text("Do not use results outside the validated range for release decisions.")], "warning"),
      createParagraph([text("Reviewed results are stated in the table below.")], "important-notice"),
      createParagraph([text("“Quality is never an accident — it is always the result of intelligent effort.”")], "quote"),
      createParagraph([text("Table 1 — Monitoring results")], "caption"),
      table,
      createParagraph([text("WQ-2026-014 · Rev 01 · 2026-10-09")], "reference"),
      createParagraph([text("All parameters within specification.")], "custom-result"),
      createHeading(4, [text("Records")]),
      createParagraph([text("Raw data registers are retained for five years.")]),
    ]),
  ];
  return doc;
}

/**
 * Golden 05 — character marks & paragraph overrides (V1-FMT-001/002, M2;
 * V1-FMT-003 feasible subset: text case).
 *
 * Exercises every M2 character mark as a STRUCTURED value (bold, italic,
 * code, link, underline, strike, superscript, subscript, font family
 * serif/sans/mono, font size, colour, highlight, uppercase/lowercase) —
 * including combined marks on one run — plus per-block paragraph overrides
 * (alignment, line spacing, space before/after, left indent) on a body
 * paragraph, a heading, a list item and a table cell. The goldens prove the
 * whole stack holds: theme → assigned style → paragraph overrides → marks,
 * over preview AND export (same shared pipeline).
 */
export function createFormattingDocument(): Document {
  const doc = createEmptyDocument("Character and Paragraph Formatting");
  doc.metadata = {
    ...doc.metadata,
    title: "Character and Paragraph Formatting",
    docNumber: "FMT-2026-015",
    revision: "01",
    effectiveDate: "2026-10-10",
    author: "Q. Officer",
    organization: "Analytical Laboratory",
    description: "Golden document: M2 character marks and paragraph overrides (V1-FMT-001/002)",
  };
  doc.settings.watermark.enabled = false;

  // Every mark family on its own run, plus combined marks and a link.
  const marks1 = createParagraph([
    text("Marks: "),
    text("bold", [{ type: "bold" }]),
    text(" "),
    text("italic", [{ type: "italic" }]),
    text(" "),
    text("underline", [{ type: "underline" }]),
    text(" "),
    text("strike", [{ type: "strike" }]),
    text(" "),
    text("sup", [{ type: "superscript" }]),
    text("/"),
    text("sub", [{ type: "subscript" }]),
    text(" "),
    text("code", [{ type: "code" }]),
    text(" "),
    text("bold+underline", [{ type: "bold" }, { type: "underline" }]),
    text(" "),
    text("linked", [{ type: "link", href: "https://example.org/sop-042" }]),
    text("."),
  ]);

  // Structured font/colour marks and the V1-FMT-003 text-case subset.
  const marks2 = createParagraph([
    text("Fonts: "),
    text("serif", [{ type: "fontFamily", fontFamily: "serif" }]),
    text(" / "),
    text("mono", [{ type: "fontFamily", fontFamily: "mono" }]),
    text(" / size "),
    text("fourteen", [{ type: "fontSize", fontSizePt: 14 }]),
    text(" / colour "),
    text("ink", [{ type: "color", color: "#1f3a5f" }]),
    text(" / "),
    text("highlighted", [{ type: "highlight", color: "#fff3b0" }]),
    text(" / "),
    text("SHOUT", [{ type: "textCase", transform: "uppercase" }]),
    text(" and "),
    text("hush", [{ type: "textCase", transform: "lowercase" }]),
    text("."),
  ]);

  // Paragraph overrides on a style-assigned block: the override wins for that
  // aspect (alignment) while the style still drives the rest — precedence.
  const overriddenStyle = createParagraph(
    [text("Centered warning: the alignment override wins over the assigned style.")],
    "warning",
  );
  overriddenStyle.format = { alignment: "center", lineSpacing: null, spaceBeforeMm: null, spaceAfterMm: null, indentLeftMm: null };

  // Every paragraph override set at once on a plain block.
  const overriddenBlock = createParagraph([
    text("Justified with 1.5 line spacing, 6 mm space before, 4 mm after and a 12 mm left indent."),
  ]);
  overriddenBlock.format = { alignment: "justify", lineSpacing: 1.5, spaceBeforeMm: 6, spaceAfterMm: 4, indentLeftMm: 12 };

  // Heading with overrides (alignment + spacing apply to headings too).
  const overriddenHeading = createHeading(2, [text("Overridden heading")]);
  overriddenHeading.format = { alignment: "right", lineSpacing: null, spaceBeforeMm: null, spaceAfterMm: 3, indentLeftMm: null };

  // List item with an override.
  const list = {
    id: "bl_fmt0001",
    type: "bulletList" as const,
    items: [
      createParagraph([text("First item")]),
      createParagraph([text("Indented item")]),
    ],
  };
  list.items[1].format = { alignment: null, lineSpacing: null, spaceBeforeMm: null, spaceAfterMm: null, indentLeftMm: 10 };

  // Table cell paragraph with an override.
  const table = createTable(
    [
      ["Parameter", "Result", "Limit"],
      ["pH", "7.2", "6.5 – 8.5"],
    ],
    { caption: "Monitoring results" },
  );
  table.rows[0].cells[0].content[0].format = { alignment: "center", lineSpacing: null, spaceBeforeMm: null, spaceAfterMm: null, indentLeftMm: null };

  doc.sections = [
    createSection([
      createHeading(1, [text("Formatting demonstration")]),
      marks1,
      marks2,
      overriddenStyle,
      overriddenBlock,
      overriddenHeading,
      list,
      table,
    ]),
  ];
  return doc;
}

/**
 * Golden 06 — canonical lists (M3): the six bullet markers, the five numbering
 * styles, a configurable start, nested (multilevel) items, and a
 * multi-paragraph item. Deterministic ids keep the committed JSON stable even
 * if regenerated.
 */
export function createListDocument(): Document {
  const p = (id: string, value: string) => ({
    id,
    type: "paragraph" as const,
    content: [{ text: value, marks: [] }],
    style: null,
    format: {
      alignment: null,
      lineSpacing: null,
      spaceBeforeMm: null,
      spaceAfterMm: null,
      indentLeftMm: null,
    },
  });
  const item = (id: string, value: string, children: ListItem[] = []): ListItem => ({
    id,
    content: [p(`pg_${id.slice(3)}`, value)],
    children,
  });

  const doc = createEmptyDocument("Lists and multilevel numbering");
  doc.metadata = {
    ...doc.metadata,
    title: "Lists and multilevel numbering",
    docNumber: "DEMO-LIST",
    revision: "01",
    effectiveDate: "2026-10-11",
    author: "",
    organization: "",
    description: "M3 golden: bullet markers, numbering styles, nesting, starts",
  };

  const bullets: List = {
    id: "bl_listgold1",
    type: "list",
    listType: "bullet",
    marker: "arrow",
    start: 1,
    items: [
      item("li_listgold1", "Arrow bullet item"),
      item("li_listgold2", "Nested bullet item", [item("li_listgold3", "Deeper bullet item")]),
      item("li_listgold4", "Check bullet item"),
    ],
  };
  // Second paragraph on an item (multi-paragraph content).
  bullets.items[0].content.push(p("pg_listgold9", "A second paragraph in the same item."));

  const decimal: List = {
    id: "bl_listgold2",
    type: "list",
    listType: "decimal",
    marker: null,
    start: 1,
    items: [
      item("li_listgold5", "First numbered step"),
      item("li_listgold6", "Second numbered step", [item("li_listgold7", "Sub-step 2.1")]),
      item("li_listgold8", "Third numbered step"),
    ],
  };

  const alpha: List = {
    id: "bl_listgold3",
    type: "list",
    listType: "lower-alpha",
    marker: null,
    start: 2,
    items: [item("li_listgolda", "Second lettered item"), item("li_listgoldb", "Third lettered item")],
  };

  const roman: List = {
    id: "bl_listgold4",
    type: "list",
    listType: "upper-roman",
    marker: null,
    start: 4,
    items: [item("li_listgoldc", "Fourth roman item"), item("li_listgoldd", "Fifth roman item")],
  };

  doc.sections = [
    createSection([
      createHeading(1, [text("Bullet markers")]),
      bullets,
      createHeading(1, [text("Numbering styles and multilevel lists")]),
      decimal,
      alpha,
      roman,
    ]),
  ];
  return doc;
}

/**
 * Golden 07 — paper sizes & orientation (M4).
 *
 * One section per standard format in BOTH portrait and landscape (14 cases),
 * plus one custom (non-swapped) size = 15 geometry cases. Each section pins
 * the `@page` geometry (and the paged.js sheet-var overrides) for that
 * format/orientation byte-for-byte, and the PDF e2e test asserts the real
 * MediaBox of all 15. Sections force a page break, so the fixture paginates to
 * exactly one page per case. Margins vary in one section so the margin output
 * is pinned independently of the paper size. Deterministic (format-by-format)
 * section order.
 */
export function createPageSetupDocument(): Document {
  const doc = createEmptyDocument("Paper sizes and orientation");
  doc.metadata.docNumber = "GEOM-07";
  doc.metadata.revision = "01";

  const variants: {
    label: string;
    format: PageFormat;
    orientation: "portrait" | "landscape";
    margins?: PageMargins;
  }[] = [
    { label: "A4 portrait", format: "A4", orientation: "portrait" },
    { label: "A4 landscape", format: "A4", orientation: "landscape" },
    { label: "A3 portrait", format: "A3", orientation: "portrait" },
    { label: "A3 landscape", format: "A3", orientation: "landscape" },
    { label: "A5 portrait", format: "A5", orientation: "portrait" },
    { label: "A5 landscape", format: "A5", orientation: "landscape" },
    { label: "Letter portrait", format: "Letter", orientation: "portrait" },
    { label: "Letter landscape", format: "Letter", orientation: "landscape" },
    { label: "Legal portrait", format: "Legal", orientation: "portrait" },
    { label: "Legal landscape", format: "Legal", orientation: "landscape" },
    { label: "Tabloid portrait", format: "Tabloid", orientation: "portrait" },
    { label: "Tabloid landscape", format: "Tabloid", orientation: "landscape" },
    {
      label: "Executive portrait",
      format: "Executive",
      orientation: "portrait",
      margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
    },
    { label: "Executive landscape", format: "Executive", orientation: "landscape" },
  ];

  const sections = variants.map((variant) => {
    const section = createSection([createHeading(2, [text(variant.label)])]);
    section.pageSetup.format = variant.format;
    section.pageSetup.orientation = variant.orientation;
    if (variant.margins) section.pageSetup.margins = variant.margins;
    return section;
  });

  // Custom size: orientation is intentionally not applied (both dimensions are
  // explicit), so this pins the no-swap behaviour too.
  const custom = createSection([createHeading(2, [text("Custom 200 × 150")])]);
  custom.pageSetup.format = "Custom";
  custom.pageSetup.widthMm = 200;
  custom.pageSetup.heightMm = 150;
  sections.push(custom);

  doc.sections = sections;
  return doc;
}

/**
 * Golden 08 — dynamic fields, laboratory profile and page fields (M5).
 * Exercises every required field key in the body (document/laboratory/page),
 * the laboratory logo image, and the new metadata + laboratory margin-box
 * fields in the header and footer.
 */
export function createFieldDocument(): Document {
  const doc = createEmptyDocument("Dynamic fields");
  doc.metadata = {
    ...doc.metadata,
    title: "Dynamic fields",
    docNumber: "FIELD-08",
    revision: "03",
    effectiveDate: "2026-10-01",
    reviewDate: "2027-10-01",
    status: "Effective",
    author: "Q. A. Manager",
    organization: "Analytical Laboratory",
    description: "Golden document: dynamic fields, laboratory profile and page fields",
    documentType: "SOP",
    department: "Quality",
    preparedBy: "A. Analyst",
    reviewedBy: "R. Reviewer",
    approvedBy: "A. Approver",
    classification: "Internal",
  };
  doc.laboratoryProfile = {
    name: "Analytical Testing Laboratory",
    address: "12 Example Road, Testville",
    logo: "data:image/svg+xml;utf8,PHN2Zy8+",
  };

  const sec = createSection([
    createHeading(1, [text("Document control")]),
    createParagraph([
      text("Document "),
      field("document.number"),
      text(" — "),
      field("document.title"),
      text(" (revision "),
      field("document.revision"),
      text("), effective "),
      field("document.effective_date"),
      text(", next review "),
      field("document.review_date"),
      text("."),
    ]),
    createParagraph([
      text("Status: "),
      field("document.status"),
      text(" · Type: "),
      field("document.type"),
      text(" · Department: "),
      field("document.department"),
      text("."),
    ]),
    createParagraph([
      text("Prepared by "),
      field("document.prepared_by"),
      text(", reviewed by "),
      field("document.reviewed_by"),
      text(", approved by "),
      field("document.approved_by"),
      text("; classification "),
      field("document.classification"),
      text("."),
    ]),
    createHeading(2, [text("Laboratory profile")]),
    createParagraph([
      text("Issued by "),
      field("laboratory.name"),
      text(" at "),
      field("laboratory.address"),
      text("."),
    ]),
    createParagraph([text("Logo: "), field("laboratory.logo")]),
    createHeading(2, [text("Pagination")]),
    createParagraph([
      text("This is page "),
      field("page.number"),
      text(" of "),
      field("page.total"),
      text("."),
    ]),
  ]);
  sec.header = {
    parts: [
      { kind: "field", field: "docNumber" },
      { kind: "text", value: " · " },
      { kind: "field", field: "title" },
      { kind: "text", value: " · " },
      { kind: "field", field: "status" },
    ],
  };
  sec.footer = {
    parts: [
      { kind: "field", field: "laboratoryName" },
      { kind: "text", value: " · Page " },
      { kind: "field", field: "pageNumber" },
      { kind: "text", value: " of " },
      { kind: "field", field: "pageCount" },
    ],
  };
  doc.sections = [sec];
  return doc;
}

export function buildGoldens(): Golden[] {
  return [
    { name: "golden-01-mixed-orientation", doc: createDocumentFixture() },
    { name: "golden-02-sop-long-table", doc: createSopDocument() },
    { name: "golden-03-phase0-gate", doc: createPhase0GateDocument() },
    { name: "golden-04-style-system", doc: createStyleSystemDocument() },
    { name: "golden-05-formatting", doc: createFormattingDocument() },
    { name: "golden-06-lists", doc: createListDocument() },
    { name: "golden-07-page-setup", doc: createPageSetupDocument() },
    { name: "golden-08-fields", doc: createFieldDocument() },
  ];
}

/**
 * Write goldens. Existing JSON is re-validated and rewritten so newly added
 * schema fields (e.g. settings.theme) gain their defaults, while the object
 * ids stay exactly as frozen in the committed file (identity never churns).
 * Expected HTML is always regenerated.
 */
export function updateGoldens(): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  for (const golden of buildGoldens()) {
    const jsonPath = path.join(GOLDEN_DIR, `${golden.name}.json`);
    let doc: Document;
    if (existsSync(jsonPath)) {
      const existing = JSON.parse(readFileSync(jsonPath, "utf8")).document as unknown;
      doc = documentSchema.parse(existing); // fill defaults, keep frozen ids
    } else {
      doc = golden.doc;
    }
    writeFileSync(jsonPath, serializeDocument(doc), "utf8");
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: PAGED_JS_SRC });
    writeFileSync(path.join(GOLDEN_DIR, `${golden.name}.expected.html`), html, "utf8");
  }
}
