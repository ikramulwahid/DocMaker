/**
 * Phase-0 end-to-end acceptance of the running application:
 * paginated live preview, editor ⇄ adapter ⇄ preview flow, metadata-driven
 * headers, mixed orientation, golden SOP (multi-page table + repeated
 * thead + image + watermark + Page X of Y), and envelope save.
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const GOLDEN_SOP = path.resolve("tests/golden/golden-02-sop-long-table.json");

/** Wait for the preview iframe to finish a Paged.js pagination run. */
async function previewFrame(page: Page) {
  await page.waitForSelector('iframe[name="preview"]');
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame;
}

test("renders the starter document as a paginated A4 page", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);
  await expect(page.getByTestId("render-status")).toHaveText("ready");

  const pages = frame.locator(".pagedjs_page");
  await expect.poll(() => pages.count()).toBeGreaterThanOrEqual(1);

  const box = await pages.first().boundingBox();
  expect(box).not.toBeNull();
  // A4 portrait: taller than wide.
  expect(box!.height).toBeGreaterThan(box!.width);
});

test("editor edits flow through the adapter into the preview", async ({ page }) => {
  await page.goto("/");
  await previewFrame(page);

  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.type("ETU marker text");

  const frame = page.frames().find((f) => f.name() === "preview")!;
  await expect(frame.locator("body")).toContainText("ETU marker text", {
    timeout: 20_000,
  });
});

test("metadata edits drive the page header fields", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await page.getByLabel("Doc number").fill("ETU-999");
  // Paged.js materialises margin boxes as CSS ::after content (documented in
  // docs/limitations.md), so assert the computed content string.
  const headerContent = async () =>
    frame.evaluate(() => {
      const el =
        document.querySelector(".pagedjs_margin-top-center .pagedjs_margin-content") ??
        document.querySelector(".pagedjs_margin-top-center");
      return el ? getComputedStyle(el, "::after").content : "";
    });
  await expect.poll(headerContent, { timeout: 20_000 }).toContain("ETU-999");
});

test("switching a section to landscape yields a landscape sheet", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await page.getByTestId("orientation-0").selectOption("landscape");
  await expect
    .poll(
      async () => {
        const box = await frame.locator(".pagedjs_page").first().boundingBox();
        return box ? box.width > box.height : false;
      },
      { timeout: 20_000 },
    )
    .toBe(true);
});

test("golden SOP: multi-page table with repeated header, image, watermark, counters", async ({
  page,
}) => {
  await page.goto("/");
  await previewFrame(page);

  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', GOLDEN_SOP);
  await expect(page.getByTestId("file-name")).toContainText("golden-02");

  const frame = page.frames().find((f) => f.name() === "preview")!;
  // Body-level marker of the golden content (title only lives in <title>).
  await expect(frame.locator("body")).toContainText("Acceptance criteria", {
    timeout: 30_000,
  });
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });

  // 3 sections (portrait → landscape → portrait), table spanning ≥ 2 pages.
  await expect.poll(() => frame.locator(".pagedjs_page").count()).toBeGreaterThanOrEqual(3);

  // Continuation table got a cloned thead (Paged.js 0.4.3 gap — handler).
  const repeatedHeader = await frame.evaluate(() => {
    const cont = document.querySelector("table[data-split-from]");
    if (!cont) return "no-split";
    return cont.querySelector('thead[data-repeated-header="true"]') ? "repeated" : "missing";
  });
  expect(repeatedHeader).toBe("repeated");

  // Landscape appendix sheet exists alongside portrait sheets.
  const hasLandscape = await frame.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".pagedjs_page")).some(
      (p) => p.offsetWidth > p.offsetHeight,
    ),
  );
  expect(hasLandscape).toBe(true);

  // Image rendered.
  await expect(frame.locator(".pagedjs_page img").first()).toBeVisible();

  // Watermark DRAFT painted on the sheet pseudo-element.
  const watermark = await frame.evaluate(() => {
    const sheet = document.querySelector(".pagedjs_sheet");
    return sheet ? getComputedStyle(sheet, "::after").content : "";
  });
  expect(watermark).toContain("DRAFT");

  // Page X of Y: the margin box rule is wired with counters …
  const footerContent = await frame.evaluate(() => {
    const el =
      document.querySelector(".pagedjs_margin-bottom-right .pagedjs_margin-content") ??
      document.querySelector(".pagedjs_margin-bottom-right");
    return el ? getComputedStyle(el, "::after").content : "";
  });
  expect(footerContent).toContain("counter(page)");
  expect(footerContent).toContain("counter(pages)");

  // … and the digits actually paint: two different pages must render
  // different footer pixels ("Page 1 of N" vs "Page 2 of N"). Blank or
  // static footers would screenshot identically.
  const footerShot = (index: number) =>
    frame
      .locator(".pagedjs_page")
      .nth(index)
      .locator(".pagedjs_margin-bottom-right")
      .screenshot();
  const [firstFooter, secondFooter] = await Promise.all([
    footerShot(0),
    footerShot(1),
  ]);
  expect(Buffer.compare(firstFooter, secondFooter)).not.toBe(0);
});

test("save emits a versioned labdoc envelope", async ({ page }) => {
  await page.goto("/");
  await previewFrame(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;

  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(Buffer.from(chunk as Buffer));
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(parsed.schema).toBe("labdoc");
  expect(parsed.schema_version).toBe("1.0");
  expect(parsed.document.type).toBe("document");
  expect(parsed.document.sections.length).toBeGreaterThanOrEqual(1);
});
