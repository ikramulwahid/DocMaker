/**
 * Page numbering controls must be truthful in the running app:
 *  - pageNumberStart actually changes the rendered page counter (verified via
 *    the materialized real-text page number AND a painted-footer diff), and
 *  - showPageNumber hides the footer counter (default footer = only counter)
 *    without touching anything else on the sheet.
 */
import { expect, test, type Page } from "@playwright/test";

async function previewFrame(page: Page) {
  await page.waitForSelector('iframe[name="preview"]');
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame;
}

test("pageNumberStart shifts the rendered page counter", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  const footerShot = () =>
    frame
      .locator(".pagedjs_page")
      .nth(0)
      .locator(".pagedjs_margin-bottom-right")
      .screenshot();

  const before = await footerShot();

  await page.locator('label:has-text("Page starts at") input').fill("5");

  // Wait for the re-paginated preview that carries BOTH the reset marker and
  // the materialized real-text page number (see html.ts buildScripts — the
  // layout script replaces CSS counter ::after content with real text nodes,
  // because Chromium does not reliably repaint a painted ::after and Paged.js
  // 0.4.3's own counter-reset only works on a fresh load's first paint).
  await frame.waitForFunction(
    () =>
      document.querySelectorAll('[data-counter-page-reset="5"]').length > 0 &&
      document.querySelector('div[data-pp]') !== null,
    null,
    { timeout: 30_000 },
  );

  // The materialized text must pin this sheet to "Page 5 of 1".
  await expect(frame.locator('.pagedjs_margin-bottom-right div[data-pp]')).toHaveText(
    "Page 5 of 1",
  );

  // The painted footer digits must differ from the pre-change render.
  const after = await footerShot();
  expect(Buffer.compare(before, after)).not.toBe(0);
});

test("showPageNumber hides the footer counter and nothing else", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await expect(frame.locator(".pagedjs_margin-bottom-right")).toHaveCount(1);
  await expect(frame.locator(".pagedjs_margin-top-center")).toHaveCount(1);

  const sheetCount = await frame.locator(".pagedjs_page").count();

  const footerContent = () =>
    frame.evaluate(() => {
      const mc = document.querySelector(
        ".pagedjs_margin-bottom-right .pagedjs_margin-content",
      );
      return mc ? getComputedStyle(mc, "::after").content : "no-box";
    });

  // Default footer paints a counter-based rule.
  expect(await footerContent()).toContain("counter(page)");

  await page
    .locator('label:has-text("Show page number") input[type="checkbox"]')
    .uncheck();

  // The footer box stays in the DOM (Paged.js creates every margin box) but
  // its content rule must be gone → the box paints nothing.
  await expect(async () => {
    expect(await footerContent()).toBe("none");
  }).toPass({ timeout: 30_000 });

  // Header box and pagination are untouched.
  await expect(frame.locator(".pagedjs_margin-top-center")).toHaveCount(1);
  await expect(frame.locator(".pagedjs_page")).toHaveCount(sheetCount);

  // Re-enable → counter rule returns (public default remains "Page X of Y").
  await page
    .locator('label:has-text("Show page number") input[type="checkbox"]')
    .check();
  await expect(async () => {
    expect(await footerContent()).toContain("counter(page)");
  }).toPass({ timeout: 30_000 });
});

/**
 * M4 (V1-PAGE-001..004): the section paper-size / orientation controls must
 * drive the rendered sheet through the shared page-geometry table — orientation
 * applied exactly once, and a custom size never double-swapped.
 */
test("section paper size + orientation drive the rendered sheet", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  const sheet = (name: string) =>
    frame
      .locator(".pagedjs_page")
      .nth(0)
      .evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);

  // A4 portrait baseline.
  expect(await sheet("--pagedjs-width")).toBe("210mm");
  expect(await sheet("--pagedjs-height")).toBe("297mm");

  // A3 landscape: the intrinsic size is swapped exactly once → 420 × 297 mm.
  await page.getByTestId("section-0-format").selectOption("A3");
  await page.getByTestId("orientation-0").selectOption("landscape");
  await expect.poll(() => sheet("--pagedjs-width"), { timeout: 20_000 }).toBe("420mm");
  expect(await sheet("--pagedjs-height")).toBe("297mm");

  // Switching to Custom seeds the CURRENT effective size (continuity) …
  await page.getByTestId("section-0-format").selectOption("Custom");
  await expect(page.getByTestId("section-0-width")).toHaveValue("420");
  await expect(page.getByTestId("section-0-height")).toHaveValue("297");
  // … orientation is a deliberate no-op for a custom size (both dims fixed).
  await expect(page.getByTestId("orientation-0")).toBeDisabled();

  await page.getByTestId("section-0-width").fill("200");
  await page.getByTestId("section-0-height").fill("150");
  await expect.poll(() => sheet("--pagedjs-width"), { timeout: 20_000 }).toBe("200mm");
  expect(await sheet("--pagedjs-height")).toBe("150mm");
  await expect(page.getByTestId("section-0-effective-size")).toContainText("200 × 150 mm");

  // Out-of-range input is rejected inline and never reaches the model.
  await page.getByTestId("section-0-width").fill("5");
  await expect(page.getByTestId("section-0-width")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByTestId("section-0-effective-size")).toContainText("200 × 150 mm");
});