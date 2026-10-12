/**
 * The V1-PERF representative document (`docs/planning/PHASE-1-plan.md` §6.1).
 *
 * Extracted into a shared support module so BOTH the performance/stress spec
 * and the M7 theme-regression series exercise the SAME large document without
 * registering tests twice (importing a `*.spec.ts` would re-run its tests).
 * This is a plain fixture builder — no assertion, no test registration.
 *
 * It is a large (~50–100 page) document with long paragraphs, a multi-page
 * table, varied images, equations, a manual break, mixed orientations and a
 * per-section page-number restart — exactly the corpus §6.2 names for the
 * theme-regression series.
 */
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
import { newId } from "@/core/ir/ids";

const LONG =
  "Long paragraph filler — laboratory quality documentation must describe the procedure with sufficient clarity for another analyst to reproduce it exactly. Reproducibility, traceability and unambiguous terminology are the foundations of good technical writing. ";

/** `n` long filler paragraphs sharing the given prefix. */
export function stressParagraphs(n: number, prefix: string) {
  return Array.from({ length: n }, (_, i) =>
    createParagraph([text(`${prefix} ${i}: ${LONG}${LONG}${LONG}${LONG}`)]),
  );
}

/** An inline SVG data URI sized to the requested millimetres (local, inert). */
export function stressSvgImage(color: string, wMm: number, hMm: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wMm * 3}" height="${hMm * 3}"><rect width="100%" height="100%" fill="${color}"/><circle cx="50%" cy="50%" r="30%" fill="white" opacity="0.6"/><text x="50%" y="55%" font-family="Arial" font-size="14" fill="#000" text-anchor="middle">stress ${wMm}x${hMm}mm</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Build the V1-PERF representative document (deterministic structure). */
export function buildStressDocument() {
  const doc = createEmptyDocument("Stress test document");
  doc.metadata.title = "Stress test document — pagination load";
  doc.metadata.docNumber = "STR-001";

  // Section 1 (portrait): long prose + big table + images + manual break.
  const sec1 = createSection([
    createHeading(1, [text("Stress — primary (portrait)")]),
    ...stressParagraphs(8, "Intro"),
    createEquation("E = m \\, c^2"),
    createHeading(2, [text("Large register table")]),
    createTable(
      [
        ["Sample ID", "Analyte", "Concentration (mg/L)", "Method", "Instrument", "Run", "Date", "Operator"],
        ...Array.from({ length: 42 }, (_, i) => [
          `SMP-${String(i + 1).padStart(3, "0")}`,
          `analyte-${i % 7}`,
          `${(12.5 + i * 0.37).toFixed(2)}`,
          "GF-AAS",
          `INSTR-${(i % 4) + 1}`,
          `${(i % 3) + 1}`,
          "2026-10-09",
          `OP-${(i % 5) + 1}`,
        ]),
      ],
      { caption: "Table S1 — Stress data register (multi-page)", headerRow: true },
    ),
    createEquation("\\mathrm{H_2O}" + " \\to \\mathrm{H_2} + \\tfrac{1}{2} \\mathrm{O_2}"),
    createHeading(2, [text("Image variety")]),
    createImage(stressSvgImage("#dbeafe", 40, 30), { caption: "Figure S1 — small chart", widthMm: 40 }),
    createImage(stressSvgImage("#fde68a", 160, 60), { caption: "Figure S2 — wide chart", widthMm: 160 }),
    createImage(stressSvgImage("#bbf7d0", 90, 120), { caption: "Figure S3 — tall chart", widthMm: 90 }),
    ...stressParagraphs(2, "After figures"),
    // Manual page break mid-section.
    { id: newId("pb"), type: "pageBreak" as const },
    ...stressParagraphs(140, "Body"),
  ]);

  // Section 2 (landscape): long content on landscape sheets.
  const sec2 = createSection([...stressParagraphs(100, "Landscape")]);
  sec2.pageSetup.orientation = "landscape";

  // Section 3 (portrait): page numbering restarts at 5.
  const sec3 = createSection([
    createHeading(1, [text("Restarted numbering section")]),
    ...stressParagraphs(90, "Restart"),
  ]);
  sec3.pageSetup.pageNumberStart = 5;

  doc.sections = [sec1, sec2, sec3];
  return doc;
}
