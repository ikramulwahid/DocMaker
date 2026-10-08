// Q2b: per-page-size print of the PAGED.js paginated DOM by overriding the
// polished `@page { size }` rule per print job and using preferCSSPageSize.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const spikeDir = path.join(root, "artifacts", "spike");
mkdirSync(spikeDir, { recursive: true });

const pagedJsPath = path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js");
const html = readFileSync(path.join(spikeDir, "paged-spike.html"), "utf8").replace(
  "PAGEDJS_SCRIPT_PLACEHOLDER",
  pathToFileURL(pagedJsPath).href,
);
const file = path.join(spikeDir, "paged-spike.resolved.html");
writeFileSync(file, html, "utf8");

const mediaBoxes = (buf) =>
  [...buf.toString("latin1").matchAll(/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(
    ([, w, h]) => `${Math.round(+w * 100) / 100}x${Math.round(+h * 100) / 100}`,
  );

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.__spikeDone === true, null, { timeout: 60_000 });

// The named-page sheet fix we would ship with the layout stylesheet.
await page.addStyleTag({
  content: `
    .pagedjs_land_page {
      --pagedjs-width: 297mm;
      --pagedjs-height: 210mm;
      --pagedjs-width-left: 297mm;
      --pagedjs-height-left: 210mm;
      --pagedjs-width-right: 297mm;
      --pagedjs-height-right: 210mm;
    }
  `,
});

const sizes = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".pagedjs_page")).map((p) =>
    p.className.includes("land") ? { w: 297, h: 210 } : { w: 210, h: 297 },
  ),
);

const results = [];
for (let i = 1; i <= sizes.length; i++) {
  const s = sizes[i - 1];
  // Inject a trailing @page rule: document order decides the cascade.
  const tag = await page.addStyleTag({
    content: `@page { size: ${s.w}mm ${s.h}mm; margin: 0; }`,
  });
  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: String(i),
  });
  results.push({ page: i, want: `${s.w}x${s.h}`, boxes: mediaBoxes(pdf) });
  await tag.evaluate((el) => el.remove());
}
console.log(JSON.stringify(results, null, 2));

// Contiguous-run grouping feasibility: print ranges "1-3", "4", "5".
const runs = [];
let start = 0;
for (let i = 1; i <= sizes.length; i++) {
  if (i === sizes.length || sizes[i].w !== sizes[start].w) {
    runs.push({ range: `${start + 1}-${i}`, size: sizes[start] });
    start = i;
  }
}
const runResults = [];
const runFiles = [];
let runIdx = 0;
for (const run of runs) {
  const tag = await page.addStyleTag({
    content: `@page { size: ${run.size.w}mm ${run.size.h}mm; margin: 0; }`,
  });
  const file = path.join(spikeDir, `run-${++runIdx}.pdf`);
  const pdf = await page.pdf({
    path: file,
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: run.range,
  });
  runResults.push({ ...run, boxes: mediaBoxes(pdf), file });
  runFiles.push(file);
  await tag.evaluate((el) => el.remove());
}
console.log("runs:", JSON.stringify(runResults, null, 2));

// Merge the runs in document order with pdf-lib and verify the result.
const { PDFDocument } = await import("pdf-lib");
const merged = await PDFDocument.create();
for (const file of runFiles) {
  const src = await PDFDocument.load(readFileSync(file));
  const pages = await merged.copyPages(src, src.getPageIndices());
  pages.forEach((p) => merged.addPage(p));
}
const mergedBytes = await merged.save();
const mergedFile = path.join(spikeDir, "spike-merged.pdf");
writeFileSync(mergedFile, mergedBytes);
const pages = merged.getPageCount();
const pageSizes = merged.getPages().map((p) => {
  const { width, height } = p.getSize();
  return `${Math.round(width)}x${Math.round(height)}`;
});
console.log(
  "merged:",
  JSON.stringify({ file: mergedFile, pages, sizes: pageSizes, boxes: mediaBoxes(readFileSync(mergedFile)) }),
);

await browser.close();
