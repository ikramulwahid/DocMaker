// Debug: load a layout HTML and report paged.js state + page errors.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const input = process.argv[2];
const json = readFileSync(path.resolve(input), "utf8");
const core = await import(pathToFileURL(path.join(root, "dist-core", "core.js")).href);
const resolved = core.resolveDocument(core.deserializeDocument(json));
const html = core.renderLayout(resolved, {
  pagedJsSrc: pathToFileURL(
    path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js"),
  ).href,
});

const tmpBase = path.join(process.env.TEMP ?? ".", "opencode");
mkdirSync(tmpBase, { recursive: true });
const file = path.join(tmpBase, "docmaker-debug.html");
writeFileSync(file, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log(`[console:${m.type()}]`, m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
page.on("requestfailed", (r) => console.log("[requestfailed]", r.url().slice(0, 200), r.failure()?.errorText));
await page.goto(pathToFileURL(file).href);
await page.waitForTimeout(12_000);
const state = await page.evaluate(() => ({
  done: window.__layoutDone ?? null,
  hasPaged: typeof window.Paged !== "undefined",
  pages: document.querySelectorAll(".pagedjs_page").length,
  pagedConfig: typeof window.PagedConfig,
}));
console.log("state:", JSON.stringify(state));
await browser.close();
