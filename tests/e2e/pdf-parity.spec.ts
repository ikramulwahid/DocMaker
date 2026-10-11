/** Preview ⇄ PDF parity: one layout pipeline, verified page counts + sizes. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deserializeDocument, resolveDocument } from "@/core";
import { renderLayout } from "@/core/layout";
import { exportPaginatedPdf, pageSizes } from "../../scripts/lib/pdf-export.mjs";

const GOLDEN_MIXED = path.resolve("tests/golden/golden-01-mixed-orientation.json");
const GOLDEN_SOP = path.resolve("tests/golden/golden-02-sop-long-table.json");
const GOLDEN_GEOMETRY = path.resolve("tests/golden/golden-07-page-setup.json");
const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;

/** Millimetres → PDF points (1 in = 25.4 mm = 72 pt). */
const MM_TO_PT = 72 / 25.4;

function layoutHtml(jsonPath: string): string {
  const resolved = resolveDocument(
    deserializeDocument(readFileSync(jsonPath, "utf8")),
  );
  return renderLayout(resolved, { pagedJsSrc: PAGED_JS });
}

/** Count paginated sheets in the running app for the same document. */
async function appPreviewPageCount(page: Page, jsonPath: string): Promise<number> {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', jsonPath);
  const frame = page.frames().find((f) => f.name() === "preview")!;
  // Body marker proves the NEW document replaced the starter (renders are
  // debounced and re-paginate, resetting __layoutDone).
  await frame.waitForFunction(
    () => document.body.innerText.includes("Acceptance criteria"),
    null,
    { timeout: 30_000 },
  );
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame.locator(".pagedjs_page").count();
}

test("PDF export produces mixed page sizes matching the document sections", async () => {
  const result = await exportPaginatedPdf({ html: layoutHtml(GOLDEN_MIXED) });

  // Golden 01 = portrait section + landscape section.
  expect(result.pages).toBeGreaterThanOrEqual(2);
  expect(result.boxes).toHaveLength(result.pages);

  const sizes = result.boxes.map((b) => b.split("x").map(Number));
  expect(sizes[0][1]).toBeGreaterThan(sizes[0][0]); // first page portrait
  expect(sizes.some(([w, h]) => w > h)).toBe(true); // some page landscape

  // A4 sheet geometry (±1pt).
  for (const [w, h] of sizes) {
    expect(Math.abs(Math.min(w, h) - 595.28)).toBeLessThan(1);
    expect(Math.abs(Math.max(w, h) - 841.89)).toBeLessThan(1);
  }

  // Contiguous runs: portrait run, then landscape run (never interleaved).
  expect(result.runs.length).toBeGreaterThanOrEqual(2);
});

test("preview and PDF agree on the golden SOP page count (parity)", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const previewPages = await appPreviewPageCount(page, GOLDEN_SOP);
  expect(previewPages).toBeGreaterThanOrEqual(3);

  // Generated test output goes to an ignored location (`artifacts/*`), never a
  // tracked path: the committed spike evidence in `artifacts/spike/` is listed
  // in its README, while this parity PDF is regenerated on every run and would
  // otherwise dirty the working tree with fresh PDF metadata timestamps.
  const result = await exportPaginatedPdf({
    html: layoutHtml(GOLDEN_SOP),
    outputPath: path.resolve("artifacts/e2e-sop.pdf"),
  });

  // Same document → same number of pages in preview and PDF.
  expect(result.pages).toBe(previewPages);

  // Sections portrait → landscape → portrait are reflected in run order.
  const runDims = result.runs.map((r) => {
    const w = parseFloat(r.size.w);
    const h = parseFloat(r.size.h);
    return w > h ? "landscape" : "portrait";
  });
  expect(runDims).toEqual(["portrait", "landscape", "portrait"]);
});

test("merged PDF page sizes are stable across re-exports", async () => {
  const first = await exportPaginatedPdf({ html: layoutHtml(GOLDEN_MIXED) });
  const second = await exportPaginatedPdf({ html: layoutHtml(GOLDEN_MIXED) });
  expect(second.boxes).toEqual(first.boxes);
  expect(await pageSizes(first.pdf)).toEqual(first.boxes);
});

test("PDF MediaBox matches every M4 format/orientation (mm → pt)", async () => {
  test.setTimeout(120_000);
  const result = await exportPaginatedPdf({ html: layoutHtml(GOLDEN_GEOMETRY) });

  // Effective sheet sizes of golden-07-page-setup, in section order (mm).
  // Standard formats apply orientation once; Custom (200×150) is never swapped.
  const expectedMm: [number, number][] = [
    [210, 297], // A4 portrait
    [297, 210], // A4 landscape
    [297, 420], // A3 portrait
    [420, 297], // A3 landscape
    [148, 210], // A5 portrait
    [215.9, 279.4], // Letter portrait
    [279.4, 215.9], // Letter landscape
    [215.9, 355.6], // Legal portrait
    [431.8, 279.4], // Tabloid landscape
    [184.15, 266.7], // Executive portrait
    [200, 150], // Custom portrait
  ];

  // One page per section (sections force a page break), in document order.
  expect(result.pages).toBe(expectedMm.length);

  // The exporter groups contiguous same-size pages: with 11 distinct adjacent
  // sizes this is 11 single-page runs — never interleaved.
  expect(result.runs.map((r) => `${parseFloat(r.size.w)}x${parseFloat(r.size.h)}`)).toEqual(
    expectedMm.map(([w, h]) => `${w}x${h}`),
  );

  // MediaBox in points, with the documented ±1pt tolerance covering Chromium's
  // CSS→PDF rounding.
  result.boxes.forEach((box, i) => {
    const [w, h] = box.split("x").map(Number);
    const [ew, eh] = expectedMm[i];
    expect(Math.abs(w - ew * MM_TO_PT)).toBeLessThan(1);
    expect(Math.abs(h - eh * MM_TO_PT)).toBeLessThan(1);
  });

  // A genuinely mixed document: the merged PDF keeps every distinct size.
  expect(new Set(result.boxes).size).toBe(expectedMm.length);
});
