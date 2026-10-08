/** Shared test documents for unit tests (not a test file itself). */
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

/** A rich fixture: 2 sections (portrait + landscape), headings, table,
 * image, list, metadata — used across round-trip and numbering tests. */
export function createDocumentFixture(): Document {
  const landscape = createSection([
    createHeading(1, [text("Appendix A — Raw Data")]),
    createTable(
      [
        ["Run", "Value", "Unit"],
        ["1", "7.2", "pH"],
        ["2", "7.1", "pH"],
      ],
      { caption: "Raw measurements" },
    ),
  ]);
  landscape.pageSetup.orientation = "landscape";

  const doc = createEmptyDocument("Test Method");
  doc.metadata = {
    title: "Test Method",
    docNumber: "TM-001",
    revision: "03",
    effectiveDate: "2026-10-08",
    author: "A. Tester",
    organization: "Lab",
    description: "Fixture",
  };
  doc.sections = [
    createSection([
      createHeading(1, [text("Purpose")]),
      createParagraph([text("Intro "), text("bold", [{ type: "bold" }])]),
      createHeading(2, [text("Background")]),
      createParagraph([text("Body text")]),
      createImage("data:image/svg+xml;utf8,PHN2Zy8+", {
        alt: "plot",
        caption: "Calibration curve",
      }),
      createTable([["A", "B"], ["1", "2"]], { caption: "Results" }),
    ]),
    landscape,
  ];
  return doc;
}
