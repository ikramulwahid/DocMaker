// Phase-0 spike part 2: PDF export strategies for mixed-orientation documents.
//
// Q1: Does Chromium's NATIVE print honour CSS named pages
//     (`@page land { size: A4 landscape }` + `page: land`)?
// Q2: Can the PAGED.js paginated DOM be printed per-page-size and merged?
//
// Evidence: MediaBox dimensions of the produced PDFs.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const spikeDir = path.join(root, "artifacts", "spike");
mkdirSync(spikeDir, { recursive: true });

const pagedJsPath = path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js");
const rawHtml = readFileSync(path.join(spikeDir, "paged-spike.html"), "utf8");

const mediaBoxes = (buf) =>
  [...buf.toString("latin1").matchAll(/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(
    ([, w, h]) => `${Math.round(+w * 100) / 100}x${Math.round(+h * 100) / 100}`,
  );

const browser = await chromium.launch();

// ---------------------------------------------------------------- Q1
// Native print WITHOUT paged.js: only @page rules + break-before.
{
  const html = rawHtml
    .replace("PAGEDJS_SCRIPT_PLACEHOLDER", "void 0")
    .replace(
      "<script>\n      window.__spikeDone",
      `<style>
        .section-land, .section-port { break-before: page; }
        .section-port:first-child { break-before: auto; }
        table { break-inside: auto; }
      </style>
      <script>
      window.__spikeDone`,
    )
    .replace(/<script src="void 0"><\/script>/, "");
  const file = path.join(spikeDir, "native-named-pages.html");
  writeFileSync(file, html, "utf8");

  const page = await browser.newPage();
  await page.goto(pathToFileURL(file).href);
  const pdf = await page.pdf({ path: path.join(spikeDir, "native-named-pages.pdf"), printBackground: true, preferCSSPageSize: true });
  console.log("Q1 native named pages MediaBoxes:", JSON.stringify(mediaBoxes(pdf)));
  await page.close();
}

// ---------------------------------------------------------------- Q2
// Print the PAGED.js paginated DOM: one print job per physical page size,
// restricted ranges, then check the landscape page really lands on A4-L.
{
  const html = rawHtml.replace("PAGEDJS_SCRIPT_PLACEHOLDER", pathToFileURL(pagedJsPath).href);
  const file = path.join(spikeDir, "paged-spike.resolved.html");
  writeFileSync(file, html, "utf8");

  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.__spikeDone === true, null, { timeout: 60_000 });

  // Same fix we'd ship in the layout stylesheet: named pages must resize the
  // SHEET, not just the pagebox.
  await page.addStyleTag({
    content: `
      .pagedjs_land_page {
        --pagedjs-width: 297mm !important;
        --pagedjs-height: 210mm !important;
        --pagedjs-width-left: 297mm !important;
        --pagedjs-height-left: 210mm !important;
        --pagedjs-width-right: 297mm !important;
        --pagedjs-height-right: 210mm !important;
      }
    `,
  });
  const sizes = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".pagedjs_page")).map((p) => ({
      w: p.offsetWidth,
      h: p.offsetHeight,
      cls: p.className.includes("land") ? "land" : "port",
    })),
  );
  console.log("Q2 page frames after sheet fix:", JSON.stringify(sizes));

  const totalPages = sizes.length;
  const boxesAll = [];
  for (let i = 1; i <= totalPages; i++) {
    const s = sizes[i - 1];
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      width: s.cls === "land" ? "297mm" : "210mm",
      height: s.cls === "land" ? "210mm" : "297mm",
      pageRanges: String(i),
    });
    boxesAll.push({ page: i, cls: s.cls, boxes: mediaBoxes(pdf) });
  }
  console.log("Q2 per-page print MediaBoxes:", JSON.stringify(boxesAll, null, 2));

  // Whole-DOM print as baseline (known-bad expectation: everything portrait).
  const whole = await page.pdf({
    printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" },
    width: "210mm",
    height: "297mm",
  });
  console.log("Q2 whole-DOM print MediaBoxes:", JSON.stringify(mediaBoxes(whole)));

  await page.close();
}

await browser.close();
