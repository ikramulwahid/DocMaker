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
  createHeading,
  createImage,
  createParagraph,
  createSection,
  createTable,
  text,
} from "@/core/ir/factory";
import type { Document } from "@/core/ir/schema";
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

export function buildGoldens(): Golden[] {
  return [
    { name: "golden-01-mixed-orientation", doc: createDocumentFixture() },
    { name: "golden-02-sop-long-table", doc: createSopDocument() },
  ];
}

/** Write goldens: JSON only if missing (frozen IDs), HTML always. */
export function updateGoldens(): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  for (const golden of buildGoldens()) {
    const jsonPath = path.join(GOLDEN_DIR, `${golden.name}.json`);
    let doc: Document;
    if (existsSync(jsonPath)) {
      doc = JSON.parse(readFileSync(jsonPath, "utf8")).document as Document;
    } else {
      doc = golden.doc;
      writeFileSync(jsonPath, serializeDocument(doc), "utf8");
    }
    const html = renderLayout(resolveDocument(doc), { pagedJsSrc: PAGED_JS_SRC });
    writeFileSync(path.join(GOLDEN_DIR, `${golden.name}.expected.html`), html, "utf8");
  }
}
