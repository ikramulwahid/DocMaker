// Phase-0 rendering spike: empirically validate Paged.js capabilities before
// committing the pagination technology (ADR-001 §21, §39).
//
// Evidence collected:
//  - named pages / mixed portrait+landscape section orientation
//  - @page margin boxes: running element header, footer with counter(page)/counter(pages)
//  - A4 page geometry (px @96dpi: portrait 793.7x1122.5, landscape 1122.5x793.7)
//  - multi-page table behaviour + thead repetition
//  - keep-with-next (break-after: avoid) and keep-together (break-inside: avoid)
//  - watermark pseudo-element per page
//  - Chromium print-to-PDF result (page count + MediaBox sizes) of the paginated DOM
//
// Usage: node scripts/spike-pagedjs.mjs

import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const spikeDir = path.join(root, "artifacts", "spike");
const pagedJsPath = path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js");

mkdirSync(spikeDir, { recursive: true });

// Build the spike page with a resolvable script src.
const html = readFileSync(path.join(spikeDir, "paged-spike.html"), "utf8").replace(
  "PAGEDJS_SCRIPT_PLACEHOLDER",
  pathToFileURL(pagedJsPath).href,
);
const spikeFile = path.join(spikeDir, "paged-spike.resolved.html");
writeFileSync(spikeFile, html, "utf8");

async function launchChromium() {
  const attempts = [
    { name: "bundled-chromium", options: {} },
    { name: "system-msedge", options: { channel: "msedge" } },
    {
      name: "system-edge-executable",
      options: {
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      },
    },
  ];
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch(attempt.options);
      console.log(`launched browser via: ${attempt.name}`);
      return browser;
    } catch (err) {
      console.warn(`failed to launch ${attempt.name}: ${err.message.split("\n")[0]}`);
    }
  }
  throw new Error("No Chromium-based browser could be launched");
}

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.warn("[page console error]", msg.text());
});

await page.goto(pathToFileURL(spikeFile).href);
await page.waitForFunction(() => window.__spikeDone === true, null, { timeout: 60_000 });

const evidence = await page.evaluate(() => {
  const out = { pages: [], general: {} };
  const pageEls = Array.from(document.querySelectorAll(".pagedjs_page"));
  out.general.pageCount = pageEls.length;

  const testidPage = (testid) => {
    const el = document.querySelector(`[data-testid="${testid}"]`);
    if (!el) return null;
    const pageEl = el.closest(".pagedjs_page");
    if (!pageEl) return null;
    return pageEls.indexOf(pageEl);
  };

  out.general.blockPages = {};
  for (const id of [
    "h-1", "p-1", "h-1-1", "p-2", "p-3", "table-1", "figure-1", "img-1",
    "keep-together-1", "h-1-2", "p-4", "sec-land", "h-2", "p-landscape",
    "table-2", "sec-port-2", "h-3", "p-5",
  ]) {
    out.general.blockPages[id] = testidPage(id);
  }

  const kt = document.querySelector('[data-testid="keep-together-1"]');
  if (kt) {
    const ktPage = kt.closest(".pagedjs_page");
    out.general.keepTogetherPages = ktPage
      ? [ktPage.querySelector('[data-testid="keep-together-1"] p') ? pageEls.indexOf(ktPage) : null]
      : null;
    out.general.keepTogetherIntact = kt.querySelectorAll("p").length === 2 && kt.hasAttribute("data-split-from") === false;
    out.general.keepTogetherSplitAttr = kt.getAttribute("data-split-from") ? "split" : "intact";
  }

  const marginText = (pageEl, loc) => {
    const box = pageEl.querySelector(`.pagedjs_margin-${loc} .pagedjs_margin-content`);
    if (!box) return null;
    const after = getComputedStyle(box, "::after").content;
    return { text: box.textContent.trim(), after: after === "normal" || after === "none" ? null : after };
  };

  pageEls.forEach((pageEl, i) => {
    const sheet = pageEl.querySelector(".pagedjs_sheet");
    const watermark = sheet ? getComputedStyle(sheet, "::after").content : null;
    const theadInfo = Array.from(pageEl.querySelectorAll("table")).map((t) => ({
      hasThead: !!t.querySelector("thead"),
      splitFrom: t.hasAttribute("data-split-from"),
      headerRepeated: t.dataset.headerRepeated === "true",
      firstRowText: t.querySelector("tr")
        ? t.querySelector("tr").textContent.trim().slice(0, 60)
        : null,
    }));
    const imgs = Array.from(pageEl.querySelectorAll("img")).map((img) => {
      const r = img.getBoundingClientRect();
      return { nw: img.naturalWidth, w: Math.round(r.width), h: Math.round(r.height) };
    });
    const contentEl = pageEl.querySelector(".pagedjs_page_content");
    const cs = getComputedStyle(pageEl);
    const box = pageEl.querySelector(".pagedjs_pagebox");
    const boxCs = box ? getComputedStyle(box) : null;
    const sheetEl = pageEl.querySelector(".pagedjs_sheet");
    out.pages.push({
      index: i,
      classes: pageEl.className,
      widthPx: pageEl.offsetWidth,
      heightPx: pageEl.offsetHeight,
      inlineStyle: pageEl.getAttribute("style"),
      sheetWidthPx: sheetEl ? sheetEl.offsetWidth : null,
      sheetHeightPx: sheetEl ? sheetEl.offsetHeight : null,
      pageboxWidth: boxCs ? boxCs.width : null,
      pageboxHeight: boxCs ? boxCs.height : null,
      varPageboxWidth: cs.getPropertyValue("--pagedjs-pagebox-width").trim(),
      varPageboxHeight: cs.getPropertyValue("--pagedjs-pagebox-height").trim(),
      topRight: marginText(pageEl, "top-right"),
      topLeft: marginText(pageEl, "top-left"),
      topCenter: marginText(pageEl, "top-center"),
      bottomRight: marginText(pageEl, "bottom-right"),
      bottomCenter: marginText(pageEl, "bottom-center"),
      watermarkContent: watermark,
      tables: theadInfo,
      images: imgs,
      contentOverflowPx: contentEl
        ? contentEl.scrollHeight - contentEl.clientHeight
        : null,
      hasOverflow: !!pageEl.querySelector(".pagedjs_overflow"),
    });
  });
  out.general.theadStats = window.__theadStats || null;

  // Dump every stylesheet rule whose text mentions a named page, to see what
  // CSS the @page handler generated for "land" / "port".
  out.general.namedPageRules = [];
  out.general.pagedjsSizeRules = [];
  for (const sheetEl of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheetEl.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      const text = rule.cssText || "";
      if (rule.type !== 1) {
        if (/land|port|@page/i.test(text)) {
          out.general.namedPageRules.push(text.slice(0, 500));
        }
      } else if (
        rule.selectorText &&
        /pagedjs_(page|sheet|pagebox)/.test(rule.selectorText) &&
        /width|height/.test(text)
      ) {
        out.general.pagedjsSizeRules.push(text.slice(0, 400));
      }
    }
  }
  return out;
});

// Screenshot every rendered page for visual evidence.
const handles = await page.$$(".pagedjs_page");
for (let i = 0; i < handles.length; i++) {
  await handles[i].screenshot({ path: path.join(spikeDir, `spike-page-${i + 1}.png`) });
}

// Print the *paginated* DOM to PDF via Chromium and inspect MediaBoxes.
const pdfPath = path.join(spikeDir, "spike-paginated.pdf");
await page.pdf({
  path: pdfPath,
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
  width: "210mm",
  height: "297mm",
  pageRanges: "",
});
const pdfBytes = readFileSync(pdfPath);
const mediaBoxes = [...pdfBytes.toString("latin1").matchAll(/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(
  ([, w, h]) => ({ wPt: Math.round(+w * 100) / 100, hPt: Math.round(+h * 100) / 100 }),
);
evidence.general.pdfMediaBoxes = mediaBoxes;
evidence.general.pdfPageCountGuess = pdfBytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? null;

writeFileSync(path.join(spikeDir, "spike-evidence.json"), JSON.stringify(evidence, null, 2), "utf8");
console.log(JSON.stringify(evidence, null, 2));

await browser.close();
