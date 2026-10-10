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
  text,
} from "@/core/ir/factory";
import { buildDefaultStyles } from "@/core/ir/styles";
import { documentSchema, type Block, type Document } from "@/core/ir/schema";
import { createDocumentFixture } from "../unit/fixtures";

export const GOLDEN_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PAGED_JS_SRC = "/vendor/paged.polyfill.js";

/** Golden 02 — realistic SOP: metadata-driven header/footer, long table that
 * must split across pages with repeated headers, list, image, landscape
 * appendix, third portrait section. */
export function createSopDocument(): Document {
  const doc = createEmptyDocument("SOP-042 Purified Water Quality Monitoring");
  doc.metadata = {
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

export function buildGoldens(): Golden[] {
  return [
    { name: "golden-01-mixed-orientation", doc: createDocumentFixture() },
    { name: "golden-02-sop-long-table", doc: createSopDocument() },
    { name: "golden-03-phase0-gate", doc: createPhase0GateDocument() },
    { name: "golden-04-style-system", doc: createStyleSystemDocument() },
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
