/**
 * M7 — theme library & theme-switching regression (V1-THEME-003/004).
 *
 * A theme is PRESENTATION ONLY (V1-THEME-004). These tests drive the real
 * sidebar control and the real shared pipeline (resolve → renderLayout →
 * Paged.js) and prove that switching theme changes typography/colour while the
 * document's semantics — content, generated numbering, cross-references,
 * equation labels and resolved dynamic fields — stay identical.
 *
 * The corpus series exercises the approved transition
 * `Default → B&W → colour → Default` over the §6.2 corpus:
 * golden-01 (mixed orientation), golden-02 (long multi-page table),
 * golden-03 (Phase-0 gate), golden-09 (cross-references) and the V1-PERF
 * representative document (`tests/support/stressDocument.ts`). It waits for
 * each re-pagination to finish (never asserts against a stale preview) and
 * compares canonical structures, not incidental CSS serialization.
 *
 * Scope note (§6.2 / D10): this is the THEME-REGRESSION series. It does NOT
 * activate the visual-regression screenshot gate (V1-VIS-001/002), which
 * still requires committed Playwright baselines, a documented pixel-difference
 * tolerance and a pinned browser/runtime — that remains release hardening.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_THEME_ID, resolveTheme } from "@/core/theme";
import { serializeDocument } from "@/core";
import type { Document } from "@/core/ir/schema";
import { buildStressDocument } from "../support/stressDocument";

const GOLDEN_01 = path.resolve("tests/golden/golden-01-mixed-orientation.json");
const GOLDEN_02 = path.resolve("tests/golden/golden-02-sop-long-table.json");
const GOLDEN_03 = path.resolve("tests/golden/golden-03-phase0-gate.json");
const GOLDEN_09 = path.resolve("tests/golden/golden-09-references.json");

/**
 * Deliberately chosen representatives (never picked at runtime): the B&W theme
 * is a genuinely monochrome treatment; the colour theme is a visibly distinct
 * serif/sans + colour treatment.
 */
const BW_THEME = "bw_standard";
const COLOR_THEME = "teal_sop";
/** The approved transition sequence — returns to the default last. */
const TRANSITION = [DEFAULT_THEME_ID, BW_THEME, COLOR_THEME, DEFAULT_THEME_ID] as const;

interface CorpusDoc {
  name: string;
  marker: string;
  golden?: string;
  build?: () => Document;
}

const CORPUS: CorpusDoc[] = [
  { name: "golden-01-mixed-orientation", marker: "Purpose", golden: GOLDEN_01 },
  { name: "golden-02-sop-long-table", marker: "Acceptance criteria", golden: GOLDEN_02 },
  { name: "golden-03-phase0-gate", marker: "Raw data register", golden: GOLDEN_03 },
  { name: "golden-09-references", marker: "deliberately dangling pointer", golden: GOLDEN_09 },
  { name: "v1-perf-stress", marker: "Stress — primary (portrait)", build: buildStressDocument },
];

/** Leading family of a CSS font stack, unquoted ("Georgia", "Trebuchet MS"). */
function firstFamily(stack: string): string {
  return stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
}

/** `#rrggbb` → the `rgb(r, g, b)` form a browser reports for a computed color. */
function rgbCss(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** Wait for the preview iframe to finish a Paged.js pagination run. */
async function previewFrame(page: Page): Promise<Frame> {
  await page.waitForSelector('iframe[name="preview"]');
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame;
}

/** Open a document through the real UI open flow and settle its first layout. */
async function openDoc(page: Page, jsonPath: string, marker: string): Promise<Frame> {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(jsonPath);
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction((m) => document.body.innerText.includes(m), marker, {
    timeout: 60_000,
  });
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 60_000,
  });
  return frame;
}

/** Wait until the selected theme's presentation is actually painted. */
async function waitForTheme(frame: Frame, themeId: string): Promise<void> {
  const theme = resolveTheme(themeId);
  await frame.waitForFunction(
    ([font, color]) => {
      const style = getComputedStyle(document.body);
      return (
        style.fontFamily.includes(font) &&
        style.color.replace(/\s+/g, " ") === color
      );
    },
    [firstFamily(theme.bodyFont), rgbCss(theme.ink)] as const,
    { timeout: 30_000 },
  );
}

/** Wait for the theme's presentation, then for pagination to settle. */
async function selectTheme(page: Page, frame: Frame, themeId: string): Promise<void> {
  await page.getByTestId("theme-select").selectOption(themeId);
  await waitForTheme(frame, themeId);
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 60_000,
  });
}

/**
 * A pagination-normalised, theme-independent structural signature.
 *
 * Paged.js splits blocks across page boundaries and clones the fragments,
 * tagging every fragment with the SAME `data-ref` as its source. Text is
 * therefore grouped by `data-ref` (fragments rejoined), de-duplicated and
 * sorted, so a different page break can never masquerade as a semantic
 * difference. Elements without a `data-ref` (none in practice) stay distinct.
 */
async function structure(frame: Frame) {
  return frame.evaluate(() => {
    const unique = (selector: string): string[] => {
      const byRef = new Map<string, string>();
      document.querySelectorAll(selector).forEach((el, index) => {
        const key = el.getAttribute("data-ref") ?? `__noref_${index}`;
        byRef.set(key, (byRef.get(key) ?? "") + (el.textContent ?? ""));
      });
      return Array.from(
        new Set(
          Array.from(byRef.values()).map((text) => text.trim()),
        ),
      )
        .filter((text) => text.length > 0)
        .sort();
    };

    const marginTemplates = (() => {
      const declared = Array.from(
        document.querySelectorAll(".pagedjs_margin-content"),
      ).map((el) => getComputedStyle(el, "::after").content);
      const materialized = Array.from(document.querySelectorAll("[data-pp]")).map(
        (el) => el.textContent ?? "",
      );
      return Array.from(
        new Set(
          [...declared, ...materialized]
            // Replace page-number digits so per-page counters and the page
            // count cannot leak into the semantic signature.
            .map((text) => text.replace(/"/g, "").replace(/\d+/g, "N").trim())
            .filter((text) => text.length > 0),
        ),
      ).sort();
    })();

    return {
      headings: unique(
        "h1.doc-heading, h2.doc-heading, h3.doc-heading, h4.doc-heading, h5.doc-heading, h6.doc-heading",
      ),
      paragraphs: unique(".doc-paragraph"),
      numbers: unique(".doc-num"),
      listMarkers: unique(".doc-list-marker"),
      captions: unique(".doc-caption"),
      references: unique(".doc-ref"),
      equations: unique(".doc-equation-number"),
      fields: unique(".doc-field-resolved"),
      tableCells: unique("table.doc-table th, table.doc-table td"),
      marginTemplates,
    };
  });
}

/** The presentation facts that must match the selected theme. */
async function appliedStyles(frame: Frame) {
  return frame.evaluate(() => {
    const body = getComputedStyle(document.body);
    const heading = document.querySelector("h1.doc-heading");
    const th = document.querySelector("table.doc-table thead th");
    return {
      bodyFont: body.fontFamily,
      bodyColor: body.color.replace(/\s+/g, " "),
      headingFont: heading ? getComputedStyle(heading).fontFamily : null,
      tableBg: th ? getComputedStyle(th).backgroundColor.replace(/\s+/g, " ") : null,
      tableBorder: th
        ? getComputedStyle(th).borderTopColor.replace(/\s+/g, " ")
        : null,
    };
  });
}

/** Materialise a corpus document (built fixtures) into a temp `labdoc` file. */
function corpusJsonPath(doc: CorpusDoc): string {
  if (doc.golden) return doc.golden;
  if (!doc.build) throw new Error(`corpus doc ${doc.name} has no source`);
  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-theme-"));
  const jsonPath = path.join(dir, `${doc.name}.json`);
  writeFileSync(jsonPath, serializeDocument(doc.build()));
  return jsonPath;
}

test("theme switch changes presentation but never semantic content", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  const before = await frame.evaluate(() => document.body.innerText);
  const beforeFont = await frame.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(beforeFont).toContain("Georgia"); // lab_default body font

  await page.getByTestId("theme-select").selectOption("bw_standard");

  // Wait for the re-paginated preview to actually apply Arial (no stale
  // __layoutDone races: poll the real state).
  await frame.waitForFunction(
    () => getComputedStyle(document.body).fontFamily.includes("Arial"),
    null,
    { timeout: 30_000 },
  );
  const afterFont = await frame.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(afterFont).not.toBe(beforeFont);

  // The rendered text (content + numbering) is identical under both themes.
  const after = await frame.evaluate(() => document.body.innerText);
  expect(after).toBe(before);

  // The theme select reflects the persisted IR value.
  await expect(page.getByTestId("theme-select")).toHaveValue("bw_standard");
});

for (const doc of CORPUS) {
  test(`theme series: ${doc.name} — Default → B&W → colour → Default`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const jsonPath = corpusJsonPath(doc);
    const frame = await openDoc(page, jsonPath, doc.marker);

    await selectTheme(page, frame, DEFAULT_THEME_ID);
    const baseline = await structure(frame);
    const baselinePages = await frame.evaluate(
      () => document.querySelectorAll(".pagedjs_page").length,
    );
    expect(baselinePages).toBeGreaterThanOrEqual(1);
    // Guard the assertions below against becoming vacuous: every corpus
    // document contains a table, so the table-treatment check always runs.
    expect(baseline.tableCells.length, `${doc.name} has tables`).toBeGreaterThan(0);

    for (const themeId of TRANSITION) {
      await selectTheme(page, frame, themeId);

      // 1. The canonical (persisted) document reflects the selection.
      await expect(page.getByTestId("theme-select")).toHaveValue(themeId);

      // 2. Semantics are unchanged: content, numbering, lists, captions,
      //    references (incl. the broken marker), equation labels, fields,
      //    table cells and header/footer field templates.
      const current = await structure(frame);
      expect(current, `${doc.name} structure under ${themeId}`).toEqual(baseline);
      expect(
        await frame.evaluate(
          () => document.querySelectorAll(".pagedjs_page").length,
        ),
        `${doc.name} still paginates under ${themeId}`,
      ).toBeGreaterThanOrEqual(1);

      // 3. Presentation actually changed to the selected theme — typography,
      //    text colour and the table treatment (not just a color swap).
      const applied = await appliedStyles(frame);
      const theme = resolveTheme(themeId);
      expect(applied.bodyFont, `${themeId} body font`).toContain(
        firstFamily(theme.bodyFont),
      );
      expect(applied.bodyColor, `${themeId} body colour`).toBe(rgbCss(theme.ink));
      expect(applied.headingFont, `${themeId} heading font`).not.toBeNull();
      expect(applied.headingFont, `${themeId} heading font`).toContain(
        firstFamily(theme.headingFont),
      );
      expect(applied.tableBg, `${themeId} table header background`).toBe(
        rgbCss(theme.tableHeaderBg),
      );
      expect(applied.tableBorder, `${themeId} table border`).toBe(
        rgbCss(theme.tableBorder),
      );
    }

    // 4. Returning to the default restores the exact baseline presentation.
    await selectTheme(page, frame, DEFAULT_THEME_ID);
    expect(await structure(frame)).toEqual(baseline);
    const restored = await appliedStyles(frame);
    const defaultTheme = resolveTheme(DEFAULT_THEME_ID);
    expect(restored.bodyFont).toContain(firstFamily(defaultTheme.bodyFont));
    expect(restored.bodyColor).toBe(rgbCss(defaultTheme.ink));
    expect(restored.tableBg).toBe(rgbCss(defaultTheme.tableHeaderBg));
  });
}
