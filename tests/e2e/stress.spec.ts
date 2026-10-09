/**
 * Stress: the shared pipeline (JSON → validated IR → resolve → renderLayout →
 * Paged.js preview → PDF export) must handle a large (~50-100 page) document
 * with long paragraphs, multi-page tables, varied images, manual breaks,
 * page-boundary content and mixed orientations — without crashing, and with
 * correct pagination + per-section page-number restarts.
 *
 * Unlike a golden test this does not freeze exact output; it asserts hard
 * invariants that must hold at scale (non-empty pagination, preview/PDF page
 * agreement, restart marker + digits, and that the split table, repeated
 * header, images and equations really survive). Observed facts are also
 * written to artifacts/stress-summary.json — a LOCAL regenerable observation
 * report (not committed; timings are machine-specific) consumed by
 * docs/limitations.md.
 */
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  deserializeDocument,
  resolveDocument,
  serializeDocument,
} from "@/core";
import { renderLayout } from "@/core/layout";
import { exportPaginatedPdf } from "../../scripts/lib/pdf-export.mjs";
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

const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;

const LONG = "Long paragraph filler — laboratory quality documentation must describe the procedure with sufficient clarity for another analyst to reproduce it exactly. Reproducibility, traceability and unambiguous terminology are the foundations of good technical writing. ";

function paragraphs(n: number, prefix: string) {
  return Array.from({ length: n }, (_, i) =>
    createParagraph([text(`${prefix} ${i}: ${LONG}${LONG}${LONG}${LONG}`)]),
  );
}

function svgImage(color: string, wMm: number, hMm: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wMm * 3}" height="${hMm * 3}"><rect width="100%" height="100%" fill="${color}"/><circle cx="50%" cy="50%" r="30%" fill="white" opacity="0.6"/><text x="50%" y="55%" font-family="Arial" font-size="14" fill="#000" text-anchor="middle">stress ${wMm}x${hMm}mm</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildStressDocument() {
  const doc = createEmptyDocument("Stress test document");
  doc.metadata.title = "Stress test document — pagination load";
  doc.metadata.docNumber = "STR-001";

  // Section 1 (portrait): long prose + big table + images + manual break.
  const sec1 = createSection([
    createHeading(1, [text("Stress — primary (portrait)")]),
    ...paragraphs(8, "Intro"),
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
    createImage(svgImage("#dbeafe", 40, 30), { caption: "Figure S1 — small chart", widthMm: 40 }),
    createImage(svgImage("#fde68a", 160, 60), { caption: "Figure S2 — wide chart", widthMm: 160 }),
    createImage(svgImage("#bbf7d0", 90, 120), { caption: "Figure S3 — tall chart", widthMm: 90 }),
    ...paragraphs(2, "After figures"),
    // Manual page break mid-section.
    { id: newId("pb"), type: "pageBreak" as const },
    ...paragraphs(140, "Body"),
  ]);

  // Section 2 (landscape): long content on landscape sheets.
  const sec2 = createSection([...paragraphs(100, "Landscape")]);
  sec2.pageSetup.orientation = "landscape";

  // Section 3 (portrait): page numbering restarts at 5.
  const sec3 = createSection([
    createHeading(1, [text("Restarted numbering section")]),
    ...paragraphs(90, "Restart"),
  ]);
  sec3.pageSetup.pageNumberStart = 5;

  doc.sections = [sec1, sec2, sec3];
  return doc;
}

async function openInApp(page: Page, jsonPath: string) {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', jsonPath);
  const frame = page.frames().find((f) => f.name() === "preview")!;
  await expect(frame.locator("body")).toContainText("Stress — primary", {
    timeout: 60_000,
  });
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 120_000,
  });
  return frame;
}

test("stress: ~50-100 pages through preview and PDF, restarts + repeats", async ({ page }) => {
  test.setTimeout(300_000);
  const doc = buildStressDocument();
  const jsonPath = path.resolve("artifacts/stress-doc.json");
  mkdirSync(path.dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, serializeDocument(doc));

  // Round-trip through the public JSON contract before rendering.
  const resolved = resolveDocument(deserializeDocument(serializeDocument(doc)));
  const html = renderLayout(resolved, { pagedJsSrc: PAGED_JS });

  // --- App preview at scale ---
  const t0 = Date.now();
  const frame = await openInApp(page, jsonPath);
  const previewMs = Date.now() - t0;
  const appPages = await frame.locator(".pagedjs_page").count();

  // Per-section restart still works at scale (sec 3 starts at 5).
  const restartedText = await frame.evaluate(() => {
    const pages = Array.from(document.querySelectorAll(".pagedjs_page"));
    const pageWithReset = pages.findIndex((p) => p.querySelector("[data-counter-page-reset]"));
    if (pageWithReset === -1) return null;
    const div = pages[pageWithReset].querySelector(
      ".pagedjs_margin-bottom-right [data-pp]",
    );
    return div ? { index: pageWithReset, text: div.textContent } : null;
  });

  // Table repetition + split at scale.
  const tableFacts = await frame.evaluate(() => {
    const split = document.querySelector("table[data-split-from]");
    return {
      splitExists: !!split,
      repeatedHeader:
        !!split?.querySelector('thead[data-repeated-header="true"]'),
      tables: document.querySelectorAll("table").length,
      imgs: document.querySelectorAll("img").length,
      eqs: document.querySelectorAll(".doc-equation .katex").length,
    };
  });

  // --- PDF export at scale ---
  const t1 = Date.now();
  const result = await exportPaginatedPdf({ html });
  const exportMs = Date.now() - t1;
  const dims = result.boxes.map((b) => {
    const [w, h] = b.split("x").map(Number);
    return w > h ? "landscape" : "portrait";
  });

  // --- Hard assertions (Phase 0.2): nothing may silently degrade at scale ---
  // 1. The preview really paginated — never silently produce zero sheets.
  expect(appPages, "preview produced pages").toBeGreaterThan(0);
  // 2. Preview and PDF agree on the page count (one shared pipeline).
  expect(result.pages, "preview/PDF page counts match").toBe(appPages);
  // 3. The stress scale characteristic stays ~50-100 pages.
  expect(appPages).toBeGreaterThanOrEqual(45);
  expect(appPages).toBeLessThanOrEqual(120);
  // 4. The restart marker AND its rendered restart digits are required.
  expect(restartedText, "restart marker + materialized page number").not.toBeNull();
  const restart = restartedText as { index: number; text: string };
  expect(restart.text.trim()).toMatch(/^Page 5 of \d+$/);
  // 5. The split table, repeated header, images and equations must be present.
  expect(tableFacts.splitExists, "table split across pages").toBe(true);
  expect(tableFacts.repeatedHeader, "thead repeated on continuation pages").toBe(true);
  expect(tableFacts.tables).toBeGreaterThanOrEqual(1);
  expect(tableFacts.imgs).toBeGreaterThanOrEqual(1);
  expect(tableFacts.eqs).toBeGreaterThanOrEqual(2);
  // 6. Mixed orientations survived into the exported PDF.
  expect(dims).toContain("landscape");
  expect(dims).toContain("portrait");

  // Record observations for docs/limitations.md (local report — regenerable,
  // not committed; the timings are machine-specific, the counts are facts).
  const paraTotal =
    doc.sections.reduce((n, s) => n + s.blocks.filter((b) => b.type === "paragraph").length, 0);
  const summary = {
    note:
      "Generated locally by tests/e2e/stress.spec.ts (NOT committed). Page " +
      "counts and structure are reproducible facts; previewMs/exportMs are " +
      "machine-specific observations, not guarantees.",
    date: new Date().toISOString(),
    pages: result.pages,
    appPreviewPages: appPages,
    previewMs,
    exportMs,
    orientationOrder: dims.slice(0, 12),
    landscapeCount: dims.filter((d) => d === "landscape").length,
    portraitCount: dims.filter((d) => d === "portrait").length,
    paragraphs: paraTotal,
    tableRows: 43,
    images: 3,
    equations: 2,
    manualBreaks: 1,
    restartedSectionFirstPage: restart,
    tableFacts,
  };
  writeFileSync(
    path.resolve("artifacts/stress-summary.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log("STRESS SUMMARY:", JSON.stringify(summary, null, 1));
});