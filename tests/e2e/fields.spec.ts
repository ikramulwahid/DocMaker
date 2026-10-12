/**
 * M5 — metadata, laboratory profile and dynamic fields end-to-end
 * (V1-META-001/002/003, V1-FIELD-001/002/003/004, V1-HF-003).
 *
 * The field picker writes a KEY reference into the IR (never a copied value),
 * the shared resolver renders it in the body and in the header/footer margin
 * boxes, an empty USED source is reported and blocks final PDF export, and the
 * laboratory logo is an allow-listed embedded image. All preview assertions use
 * auto-retrying locators because the preview iframe re-navigates on every
 * `srcdoc` update.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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

/** Replace the editor content with a starting paragraph, caret at the end. */
async function startParagraph(page: Page, text: string) {
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(text);
}

/** Insert a dynamic field through the labelled toolbar picker. */
async function insertField(page: Page, key: string) {
  await page.getByTestId("insert-field").selectOption(key);
}

test("field picker inserts a resolved metadata field into the body (V1-FIELD-001/002)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await page.getByLabel("Doc number", { exact: true }).fill("E2E-77");
  await startParagraph(page, "Document ");
  await insertField(page, "document.number");

  // The editor shows a distinguishable chip carrying only the field key.
  await expect(
    page.locator('.ir-field-chip[data-field-ref="document.number"]'),
  ).toBeVisible();

  // The preview shows the RESOLVED value from the canonical metadata.
  await expect(
    frame.locator('.doc-field-resolved[data-field="document.number"]'),
  ).toHaveText("E2E-77", { timeout: 20_000 });

  // Changing the metadata source updates the occurrence (V1-META-003).
  await page.getByLabel("Doc number", { exact: true }).fill("E2E-88");
  await expect(
    frame.locator('.doc-field-resolved[data-field="document.number"]'),
  ).toHaveText("E2E-88", { timeout: 20_000 });
});

test("an empty USED field is reported and blocks final PDF export (V1-FIELD-004)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await startParagraph(page, "Status: ");
  await insertField(page, "document.status");

  // Used-but-empty → an actionable, non-blank report (never silently blank).
  const panel = page.getByTestId("unresolved-fields");
  await expect(panel).toContainText("document.status", { timeout: 20_000 });
  await expect(panel).toContainText("Status is empty");

  // The preview distinguishes unresolved from resolved.
  await expect(
    frame.locator('.doc-field-unresolved[data-field="document.status"]'),
  ).toBeVisible({ timeout: 20_000 });

  // Final PDF export is refused while the field is unresolved …
  await page.getByTestId("export-pdf").click();
  await expect(page.getByTestId("status")).toContainText("PDF export blocked");

  // … and saving the draft is still possible (no gate on `.labdoc.json`).
  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-fields-draft-"));
  const saved = path.join(dir, "draft.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  await download.saveAs(saved);
  expect(JSON.parse(readFileSync(saved, "utf8")).schema).toBe("labdoc");

  // Filling the source resolves it and unblocks export.
  await page.getByLabel("Status", { exact: true }).fill("Effective");
  await expect(panel).toContainText("All used fields are resolved", {
    timeout: 20_000,
  });
  await expect(
    frame.locator('.doc-field-resolved[data-field="document.status"]'),
  ).toHaveText("Effective", { timeout: 20_000 });
});

test("laboratory profile fields resolve in body and header/footer (V1-META-002, V1-HF-003)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await page.getByLabel("Laboratory name").fill("Acme Calibration Lab");

  // Header + footer use the existing margin-field tokens (footer keeps the
  // legacy [count] alias for the total). A page-number restart makes the shared
  // materializer write the whole footer as DOM text (preview == PDF).
  await page
    .getByLabel(/^Header/)
    .fill("[laboratoryName]");
  await page
    .getByLabel(/^Footer/)
    .fill("Page [pageNumber] of [count] · [laboratoryName]");
  await page.locator('label:has-text("Page starts at") input').fill("3");

  // Body field.
  await startParagraph(page, "Lab: ");
  await insertField(page, "laboratory.name");
  await expect(
    frame.locator('.doc-field-resolved[data-field="laboratory.name"]'),
  ).toHaveText("Acme Calibration Lab", { timeout: 20_000 });

  // Header (CSS margin box content, read from the computed pseudo-element).
  const headerContent = () =>
    frame.evaluate(() => {
      const mc = document.querySelector(
        ".pagedjs_margin-top-center .pagedjs_margin-content",
      );
      return mc ? getComputedStyle(mc, "::after").content : "no-box";
    });
  await expect.poll(headerContent, { timeout: 20_000 }).toContain(
    "Acme Calibration Lab",
  );

  // Footer (materialized DOM text) carries the name too.
  await expect(
    frame.locator(".pagedjs_margin-bottom-right div[data-pp]"),
  ).toContainText("Acme Calibration Lab", { timeout: 20_000 });

  // Renaming the laboratory updates EVERY occurrence (single source of truth).
  await page.getByLabel("Laboratory name").fill("Renamed Lab");
  await expect(
    frame.locator('.doc-field-resolved[data-field="laboratory.name"]'),
  ).toHaveText("Renamed Lab", { timeout: 20_000 });
  await expect.poll(headerContent, { timeout: 20_000 }).toContain("Renamed Lab");
  await expect(
    frame.locator(".pagedjs_margin-bottom-right div[data-pp]"),
  ).toContainText("Renamed Lab", { timeout: 20_000 });
});

test("laboratory logo renders as a constrained safe image; bad files are refused (V1-META-002)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  // Reject a non-image file BEFORE it enters the IR (input security).
  await page.getByTestId("lab-logo-input").setInputFiles({
    name: "evil.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByTestId("status")).toContainText("Logo rejected");
  await expect(page.getByTestId("lab-logo-preview")).toHaveCount(0);

  // A real embedded SVG is accepted and previewed.
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">' +
    '<rect width="120" height="40" fill="#1f6feb"/></svg>';
  await page.getByTestId("lab-logo-input").setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(svg),
  });
  await expect(page.getByTestId("lab-logo-preview")).toBeVisible({
    timeout: 20_000,
  });

  // The logo used in the body renders as a safe embedded image …
  await startParagraph(page, "Logo: ");
  await insertField(page, "laboratory.logo");
  const logo = frame.locator("img.doc-field-logo");
  await expect(logo).toBeVisible({ timeout: 20_000 });
  await expect(logo).toHaveAttribute("src", /^data:image\/svg\+xml/);

  // … constrained by the renderer (never larger than the documented box).
  const box = await logo.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(172); // 45mm ≈ 170px
  expect(box!.height).toBeLessThanOrEqual(78); // 20mm ≈ 76px

  // Removing the logo makes the used field unresolved again (not blank).
  await page.getByTestId("lab-logo-remove").click();
  await expect(
    page.getByTestId("unresolved-fields"),
  ).toContainText("laboratory.logo", { timeout: 20_000 });
});

test("field references persist as keys (never a copied value) and reopen", async ({
  page,
}) => {
  await page.goto("/");
  await previewFrame(page);

  await page.getByLabel("Doc number", { exact: true }).fill("PERSIST-1");
  await startParagraph(page, "Ref ");
  await insertField(page, "document.number");

  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-fields-"));
  const saved = path.join(dir, "fields.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  await download.saveAs(saved);

  // The IR stores the field KEY, never the resolved text.
  const envelope = JSON.parse(readFileSync(saved, "utf8")) as {
    document: {
      sections: {
        blocks: { type: string; content?: { text?: string; field?: string }[] }[];
      }[];
    };
  };
  const paragraph = envelope.document.sections[0].blocks.find(
    (b) => b.type === "paragraph",
  );
  expect(paragraph?.content?.some((r) => r.field === "document.number")).toBe(true);
  expect(paragraph?.content?.some((r) => r.text === "PERSIST-1")).toBe(false);

  // Reopen into a fresh session: key, chip and resolved preview round-trip.
  await page.reload();
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(saved);
  await expect(page.getByTestId("file-name")).toContainText("fields");
  await expect(
    page.locator('.ir-field-chip[data-field-ref="document.number"]'),
  ).toBeVisible();
  const frame = page.frames().find((f) => f.name() === "preview")!;
  await expect(
    frame.locator('.doc-field-resolved[data-field="document.number"]'),
  ).toHaveText("PERSIST-1", { timeout: 20_000 });
});
