// Q3: does ONE print job of the Paged.js paginated DOM honour the named
// @page sizes (mixed orientation) when preferCSSPageSize is true?
// If yes: PDF export simplifies to a single print (and in-app window.print
// is on the same code path → preview/PDF/print parity).
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

// With preferCSSPageSize Chromium reads @page sizes from the document —
// including named pages — so no injected override here.
const pdf = await page.pdf({
  path: path.join(spikeDir, "spike-single-print.pdf"),
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
  preferCSSPageSize: true,
});
console.log("single-job MediaBoxes:", JSON.stringify(mediaBoxes(pdf)));

await browser.close();
