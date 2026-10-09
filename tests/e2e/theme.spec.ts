/**
 * Theme (V1-THEME-004): switching the document theme in the sidebar changes
 * only presentation (typography/colors). Body text — content, generated
 * numbering, structure — must be identical before and after.
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