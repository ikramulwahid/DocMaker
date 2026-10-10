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
const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;

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
