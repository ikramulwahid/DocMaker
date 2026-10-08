/**
 * Verified PDF export path (see docs/architecture/ADR-002-rendering-engine.md):
 *
 * 1. Load the layout HTML in Chromium; Paged.js paginates it.
 * 2. Chromium's single print job CANNOT mix paper sizes (spike Q2/Q3), so the
 *    pages are grouped into CONTIGUOUS size runs.
 * 3. Each run is printed with a trailing `@page { size }` override and
 *    `preferCSSPageSize: true`, using `pageRanges` to address the run.
 * 4. The run PDFs are merged in document order with pdf-lib.
 *
 * This module is plain ESM so both scripts/export-pdf.mjs (CLI) and the
 * Playwright e2e suite use the exact same code.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

/**
 * Page sizes of a PDF buffer via the pdf-lib API (pdf-lib writes MediaBox
 * entries into compressed object streams, so text parsing is not reliable).
 * @returns {Promise<string[]>} e.g. ["595.28x841.89", …]
 */
export async function pageSizes(buffer) {
  const doc = await PDFDocument.load(buffer);
  return doc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return `${Math.round(width * 100) / 100}x${Math.round(height * 100) / 100}`;
  });
}

/** Group contiguous pages with identical sheet sizes into print runs. */
export function groupRuns(sizes) {
  const runs = [];
  let start = 0;
  for (let i = 1; i <= sizes.length; i++) {
    if (i === sizes.length || sizes[i].w !== sizes[start].w || sizes[i].h !== sizes[start].h) {
      const range = start + 1 === i ? String(start + 1) : `${start + 1}-${i}`;
      runs.push({ range, size: sizes[start], pages: i - start });
      start = i;
    }
  }
  return runs;
}

/**
 * Render layout HTML → merged, mixed-page-size PDF.
 *
 * @param {{ html: string, outputPath?: string, timeoutMs?: number }} options
 * @returns {Promise<{ pdf: Uint8Array, pages: number, runs: Array, boxes: string[] }>}
 */
export async function exportPaginatedPdf({ html, outputPath, timeoutMs = 60_000 }) {
  // Temp-dir base: the approved opencode temp location when present.
  const tmpBase = path.join(os.tmpdir(), "opencode");
  mkdirSync(tmpBase, { recursive: true });
  const dir = mkdtempSync(path.join(tmpBase, "docmaker-pdf-"));
  const htmlPath = path.join(dir, "layout.html");
  writeFileSync(htmlPath, html, "utf8");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.waitForFunction(() => window.__layoutDone === true, null, {
      timeout: timeoutMs,
    });

    // Sheet size per page comes from the vars Paged.js paints the sheet frame
    // with (the layout's named-page fix keeps these in sync — ADR-002).
    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".pagedjs_page")).map((p) => {
        const style = getComputedStyle(p);
        return {
          w: style.getPropertyValue("--pagedjs-width").trim() || "210mm",
          h: style.getPropertyValue("--pagedjs-height").trim() || "297mm",
        };
      }),
    );
    if (sizes.length === 0) throw new Error("Paged.js produced no pages");

    const runs = groupRuns(sizes);
    const runFiles = [];
    for (const run of runs) {
      const tag = await page.addStyleTag({
        content: `@page { size: ${run.size.w} ${run.size.h}; margin: 0; }`,
      });
      const file = path.join(dir, `run-${runFiles.length + 1}.pdf`);
      await page.pdf({
        path: file,
        printBackground: true,
        preferCSSPageSize: true,
        pageRanges: run.range,
      });
      await tag.evaluate((el) => el.remove());
      runFiles.push(file);
    }

    const merged = await PDFDocument.create();
    for (const file of runFiles) {
      const src = await PDFDocument.load(readFileSync(file));
      const pages = await merged.copyPages(src, src.getPageIndices());
      for (const p of pages) merged.addPage(p);
    }
    const pdf = await merged.save();
    if (outputPath) writeFileSync(outputPath, pdf);

    return {
      pdf,
      pages: merged.getPageCount(),
      runs: runs.map((r) => ({ range: r.range, size: r.size, pages: r.pages })),
      boxes: await pageSizes(pdf),
    };
  } finally {
    await browser.close();
    rmSync(dir, { recursive: true, force: true });
  }
}
