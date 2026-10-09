/**
 * Phase-0 gate document (§46 gate golden): the app preview must produce
 * exactly five sheets in portrait, portrait, landscape, landscape, portrait
 * order with every gate feature present; the PDF export must agree.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deserializeDocument, resolveDocument } from "@/core";
import { renderLayout } from "@/core/layout";
import { exportPaginatedPdf } from "../../scripts/lib/pdf-export.mjs";
import {
  extractPdfTextByPage,
  findPageHits,
} from "../../scripts/verify-pdf-text.mjs";

const GOLDEN_GATE = path.resolve("tests/golden/golden-03-phase0-gate.json");
const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;

function layoutHtml(jsonPath: string): string {
  const resolved = resolveDocument(
    deserializeDocument(readFileSync(jsonPath, "utf8")),
  );
  return renderLayout(resolved, { pagedJsSrc: PAGED_JS });
}

async function loadGolden(page: Page): Promise<Frame> {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', GOLDEN_GATE);
  const frame = page.frames().find((f) => f.name() === "preview")!;
  // Body marker proves the gate document replaced the starter (unique caption).
  await expect(frame.locator("body")).toContainText("Raw data register", {
    timeout: 30_000,
  });
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame;
}

test("gate preview: exactly P,P,L,L,P with every §46 feature", async ({ page }) => {
  test.setTimeout(120_000);
  const frame = await loadGolden(page);

  // Exactly five sheets.
  await expect.poll(() => frame.locator(".pagedjs_page").count()).toBe(5);

  // Orientation sequence portrait ×2 → landscape ×2 → portrait ×1.
  const dims = await frame.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".pagedjs_page")).map((p) =>
      p.offsetWidth > p.offsetHeight ? "landscape" : "portrait",
    ),
  );
  expect(dims).toEqual(["portrait", "portrait", "landscape", "landscape", "portrait"]);

  // Heading numbering (generated, never hard-coded).
  await expect(frame.locator("h1.doc-heading span.doc-num").first()).toHaveText("1");

  // Table + figure numbering in captions.
  await expect(frame.locator("caption.doc-caption").first()).toContainText(
    "Table 1 — Summary acceptance criteria",
  );
  await expect(frame.locator("caption.doc-caption").nth(1)).toContainText(
    "Table 2 — Raw data register",
  );
  await expect(frame.locator("figcaption.doc-caption")).toContainText("Figure 1");

  // The landscape register table genuinely spans two pages with a repeated
  // header (Paged.js 0.4.3 gap — cloned thead handler).
  const repeatedHeader = await frame.evaluate(() => {
    const cont = document.querySelector("table[data-split-from]");
    if (!cont) return "no-split";
    return cont.querySelector('thead[data-repeated-header="true"]') ? "repeated" : "missing";
  });
  expect(repeatedHeader).toBe("repeated");

  // Header margin box carries dynamic metadata (docNumber resolved from IR).
  const headerContent = await frame.evaluate(() => {
    const el =
      document.querySelector(".pagedjs_margin-top-center .pagedjs_margin-content") ??
      document.querySelector(".pagedjs_margin-top-center");
    return el ? getComputedStyle(el, "::after").content : "";
  });
  expect(headerContent).toContain("SOP-GATE-001");

  // Page X of Y footer: counters wired.
  const footerContent = await frame.evaluate(() => {
    const el =
      document.querySelector(".pagedjs_margin-bottom-right .pagedjs_margin-content") ??
      document.querySelector(".pagedjs_margin-bottom-right");
    return el ? getComputedStyle(el, "::after").content : "";
  });
  expect(footerContent).toContain("counter(page)");

  // Equations render offline via KaTeX (semantic LaTeX, not screenshots).
  await expect(frame.locator(".doc-equation .katex").first()).toBeVisible();
  expect(await frame.locator(".doc-equation .katex").count()).toBeGreaterThanOrEqual(3);

  // Figure image rendered.
  await expect(frame.locator(".pagedjs_page img").first()).toBeVisible();

  // DRAFT watermark painted via the sheet pseudo-element.
  const watermark = await frame.evaluate(() => {
    const sheet = document.querySelector(".pagedjs_sheet");
    return sheet ? getComputedStyle(sheet, "::after").content : "";
  });
  expect(watermark).toContain("DRAFT");
});

test("gate PDF export: exact P,P,L,L,P page sequence + distinctive text/equations", async () => {
  test.setTimeout(120_000);
  const result = await exportPaginatedPdf({
    html: layoutHtml(GOLDEN_GATE),
    outputPath: path.resolve("artifacts/e2e-gate.pdf"),
  });

  expect(result.pages).toBe(5);
  expect(result.boxes).toHaveLength(5);
  const dims = result.boxes.map((b) => {
    const [w, h] = b.split("x").map(Number);
    return w > h ? "landscape" : "portrait";
  });
  expect(dims).toEqual(["portrait", "portrait", "landscape", "landscape", "portrait"]);

  // Reproducible text-layer evidence (Phase 0.2): the exported PDF must carry
  // the document's distinctive content — dynamic header/page fields, generated
  // numbering, the watermark and equation glyphs. The exact strings were
  // chosen from an actual pdf.js extraction (scripts/verify-pdf-text.mjs is the
  // same engine runnable as a CLI, e.g.
  //   node scripts/verify-pdf-text.mjs artifacts/e2e-gate.pdf --expect ...
  // ). Sub/superscript digits are emitted as trailing runs, so "E=mc2" is
  // matched whitespace-collapsed, not verbatim.
  const pages = await extractPdfTextByPage(result.pdf);
  const expectInPdf: [string, string][] = [
    ["SOP-GATE-001", "header dynamic field (docNumber)"],
    ["Phase-0 Rendering Gate Document", "header dynamic field (title)"],
    ["Page 1 of 5", "live page counter"],
    ["Table 1", "generated table caption numbering"],
    ["DRAFT", "watermark"],
    ["±", "equation glyph (quadratic ±)"],
    ["Δ", "equation glyph (symbol-set Δ)"],
    ["E=mc2", "sign-off equation E = m c² (collapsed)"],
  ];
  for (const [expected, what] of expectInPdf) {
    expect(
      findPageHits(pages, expected),
      `PDF text contains ${JSON.stringify(expected)} (${what})`,
    ).not.toHaveLength(0);
  }
});