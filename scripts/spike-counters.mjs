// Quick probe: does Chromium resolve counter(page)/counter(pages) in margin
// boxes during SCREEN rendering (live preview) and during PRINT rendering?
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const spikeFile = path.join(root, "artifacts", "spike", "paged-spike.resolved.html");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(pathToFileURL(spikeFile).href);
await page.waitForFunction(() => window.__spikeDone === true, null, { timeout: 60_000 });

// Screen rendering: read the accessibility text of every footer/header box.
const screenFooters = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".pagedjs_page")).map((p, i) => {
    const get = (loc) => {
      const el = p.querySelector(`.pagedjs_margin-${loc} .pagedjs_margin-content`);
      if (!el) return null;
      // Measured width of the rendered ::after content: compare against a
      // probe string to infer what text was actually painted.
      const range = document.createRange();
      return { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height };
    };
    return { i, bottomRight: get("bottom-right"), topCenter: get("top-center") };
  });
});

const aria = await page.locator("body").ariaSnapshot();
const texts = aria
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("- text:"))
  .slice(0, 60);

// Direct probe: an inline-block with ::after content resolves to width > 0
// only if Chromium paints the counter value in screen media.
const probe = await page.evaluate(() => {
  // Shrink-to-fit the margin boxes: if their ::after paints text, the
  // inline-block width will exceed the padding.
  const boxes = Array.from(
    document.querySelectorAll(".pagedjs_margin-bottom-right .pagedjs_margin-content"),
  ).map((el) => {
    const prev = el.style.cssText;
    el.style.cssText += ";display:inline-block!important;width:auto!important;";
    const w = el.getBoundingClientRect().width;
    const h = el.getBoundingClientRect().height;
    el.style.cssText = prev;
    return { w, h };
  });
  return { boxes };
});

console.log(JSON.stringify({ probe, screenFooters, ariaMatches: texts }, null, 2));

await browser.close();
