/**
 * Structured equation (V1-EQ-001..003) through the real UI: insert via the
 * toolbar, render in the preview via offline KaTeX, and persist through a
 * JSON save round-trip with a stable `eq_` id and raw LaTeX stored.
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

test("equation insert renders offline and survives save", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  // The toolbar uses window.prompt: accept it as soon as it opens so the
  // page thread is never left blocked.
  const LATEX = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
  page.once("dialog", (d) => d.accept(LATEX));
  await page.locator('button[title="Insert equation (LaTeX)"]').click();

  // Preview re-run paints KaTeX markup.
  await frame.waitForFunction(
    () => document.querySelectorAll(".doc-equation .katex").length > 0,
    null,
    { timeout: 30_000 },
  );
  await expect(frame.locator(".doc-equation .katex").first()).toBeVisible();

  // Save the envelope: the equation must be structured IR (LaTeX + eq_ id),
  // never an image.
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(Buffer.from(chunk as Buffer));
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const equations = parsed.document.sections[0].blocks.filter(
    (b: { type: string }) => b.type === "equation",
  );
  expect(equations).toHaveLength(1);
  expect(equations[0].latex).toBe(LATEX);
  expect(equations[0].id.startsWith("eq_")).toBe(true);
  expect(equations[0].display).toBe(true);
  // The IR must not store rendered HTML or screenshot bytes.
  expect(equations[0].html).toBeUndefined();
  expect(equations[0].src).toBeUndefined();
});

test("cancelled equation insert changes nothing", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);
  const before = await frame.evaluate(() => document.body.innerText);

  page.once("dialog", (d) => d.dismiss());
  await page.locator('button[title="Insert equation (LaTeX)"]').click();

  await expect(frame.locator(".doc-equation")).toHaveCount(0);
  const after = await frame.evaluate(() => document.body.innerText);
  expect(after).toBe(before);
});