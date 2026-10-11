/**
 * M4 new-document defaults (plan D11 / §4.2; V1-DOC-002 configurability leg).
 *
 * The preferences are application-level and local: editing them must never
 * touch the open document, creating a document applies a validated snapshot,
 * opening a file keeps that file's own settings, and the values persist across
 * sessions (localStorage) with a safe fallback on corrupt data.
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const GOLDEN_SOP = path.resolve("tests/golden/golden-02-sop-long-table.json");

async function ready(page: Page) {
  await page.waitForSelector('iframe[name="preview"]');
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
}

test("New applies the configured defaults without changing the open document", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);

  // Configure defaults: custom page setup + theme + metadata skeleton.
  await page.getByTestId("defaults-format").selectOption("Custom");
  await page.getByTestId("defaults-width").fill("200");
  await page.getByTestId("defaults-height").fill("150");
  await page.getByTestId("defaults-theme").selectOption("bw_standard");
  await page.getByTestId("defaults-doc-number").fill("SOP-100");
  await page.getByTestId("defaults-author").fill("A. Analyst");
  await expect(page.getByTestId("defaults-effective-size")).toContainText("200 × 150 mm");

  // The OPEN (starter) document is untouched by default edits.
  await expect(page.getByLabel("Doc number", { exact: true })).toHaveValue("DOC-001");
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue("");
  await expect(page.getByTestId("section-0-format")).toHaveValue("A4");
  await expect(page.getByTestId("theme-select")).toHaveValue("lab_default");

  // Creating a new document applies the validated snapshot.
  await page.getByTestId("new").click();
  await expect(page.getByLabel("Doc number", { exact: true })).toHaveValue("SOP-100");
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue("A. Analyst");
  await expect(page.getByTestId("theme-select")).toHaveValue("bw_standard");
  await expect(page.getByTestId("section-0-format")).toHaveValue("Custom");
  await expect(page.getByTestId("section-0-width")).toHaveValue("200");
  await expect(page.getByTestId("section-0-height")).toHaveValue("150");
});

test("defaults persist across a reload (local-first, no backend)", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  await page.getByTestId("defaults-format").selectOption("Custom");
  await page.getByTestId("defaults-width").fill("200");
  await page.getByTestId("defaults-height").fill("150");
  await page.getByTestId("defaults-theme").selectOption("bw_standard");
  await page.getByTestId("defaults-revision").fill("07");

  await page.reload();
  await ready(page);
  await expect(page.getByTestId("defaults-format")).toHaveValue("Custom");
  await expect(page.getByTestId("defaults-width")).toHaveValue("200");
  await expect(page.getByTestId("defaults-theme")).toHaveValue("bw_standard");
  await expect(page.getByTestId("defaults-revision")).toHaveValue("07");
});

test("reset restores the built-in defaults and clears storage", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  await page.getByTestId("defaults-format").selectOption("Custom");
  await page.getByTestId("defaults-doc-number").fill("XYZ");
  await page.getByTestId("defaults-reset").click();

  await expect(page.getByTestId("defaults-format")).toHaveValue("A4");
  await expect(page.getByTestId("defaults-doc-number")).toHaveValue("");

  // A new document now starts from the built-in A4 defaults again.
  await page.getByTestId("new").click();
  await expect(page.getByTestId("section-0-format")).toHaveValue("A4");
  await expect(page.getByLabel("Doc number", { exact: true })).toHaveValue("");

  // …and the reset survives a reload (storage was actually cleared).
  await page.reload();
  await ready(page);
  await expect(page.getByTestId("defaults-format")).toHaveValue("A4");
});

test("opening a file keeps the file's own settings", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  await page.getByTestId("defaults-doc-number").fill("DEFAULT-ONLY");

  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', GOLDEN_SOP);
  await expect(page.getByLabel("Doc number", { exact: true })).toHaveValue("SOP-042");

  // The defaults are unaffected by the opened document.
  await expect(page.getByTestId("defaults-doc-number")).toHaveValue("DEFAULT-ONLY");
});

test("corrupt stored defaults fall back without blocking startup", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  await page.evaluate(() =>
    localStorage.setItem("docmaker.new-document-defaults.v1", "{not json"),
  );
  await page.reload();
  await ready(page);

  await expect(page.getByTestId("render-status")).toHaveText("ready");
  await expect(page.getByTestId("defaults-format")).toHaveValue("A4");
  await expect(page.getByTestId("defaults-doc-number")).toHaveValue("");
});
