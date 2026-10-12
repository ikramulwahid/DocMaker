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
import { buildStressDocument } from "../support/stressDocument";

const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;

async function openInApp(page: Page, jsonPath: string) {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(jsonPath);
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