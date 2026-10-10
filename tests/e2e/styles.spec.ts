/**
 * M1 — Reusable style system end-to-end: toolbar style assignment reaches the
 * live preview through the canonical IR; sidebar definition edits re-render
 * every assigned block (V1-STYLE-003); custom styles persist and can be
 * removed with a deterministic fallback (V1-STYLE-004); theme switching
 * preserves style semantics; golden-04 (style system) renders its hierarchy
 * and style-based text types.
 *
 * All preview assertions use auto-retrying locators (not frame.evaluate
 * polls): the preview iframe re-navigates on every srcdoc update, which would
 * destroy polling execution contexts mid-evaluate.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import path from "node:path";

const GOLDEN_STYLES = path.resolve("tests/golden/golden-04-style-system.json");

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

/**
 * Replace the whole editor content with a fresh paragraph containing `text`.
 * Selecting everything first makes the caret position deterministic (a plain
 * click can land mid-document, e.g. inside a list item).
 */
async function replaceAllText(page: Page, text: string) {
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(text);
}

/** First preview paragraph matching the style class and containing `text`. */
function styledParagraph(frame: Frame, styleClass: string, text: string) {
  return frame
    .locator(`p.doc-paragraph.doc-style-${styleClass}`)
    .filter({ hasText: text })
    .first();
}

test("toolbar style assignment flows into the live preview (V1-STYLE-002)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Marker styled paragraph");
  await page.getByTestId("style-select").selectOption("note");

  const styled = styledParagraph(frame, "note", "Marker styled paragraph");
  await expect(styled).toHaveClass(/doc-style-note/, { timeout: 20_000 });
  await expect(styled).toHaveCSS("font-style", "italic"); // default Note definition
});

test("sidebar style edit re-renders every assigned block (V1-STYLE-003)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  // Two paragraphs, both plain paragraph blocks.
  await replaceAllText(page, "First assigned paragraph");
  await page.keyboard.press("Enter"); // split into paragraph 2
  await page.keyboard.type("Second assigned paragraph");

  // Cursor back to paragraph 1 → assign Note; down to paragraph 2 → assign Note.
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowUp");
  await page.getByTestId("style-select").selectOption("note");
  await page.keyboard.press("ArrowDown");
  await page.getByTestId("style-select").selectOption("note");

  // Both are now Note in the preview.
  const notes = frame.locator("p.doc-paragraph.doc-style-note");
  await expect(notes).toHaveCount(2, { timeout: 20_000 });

  // Edit the Note definition in the sidebar: add bold + 12pt (italic stays:
  // the editor opens with the current definition and merges on Apply).
  await page.getByTestId("style-row-note").getByRole("button", { name: /Note/ }).click();
  await page.getByTestId("style-bold").check();
  await page.getByTestId("style-font-size").fill("12");
  await page.getByTestId("style-apply").click();

  // Both assigned paragraphs must follow the new definition in the preview.
  await expect(notes.nth(0)).toHaveCSS("font-weight", "700", { timeout: 20_000 });
  await expect(notes.nth(1)).toHaveCSS("font-weight", "700");
  await expect(notes.nth(0)).toHaveCSS("font-size", "16px"); // 12pt
  await expect(notes.nth(1)).toHaveCSS("font-size", "16px");
  await expect(notes.nth(0)).toHaveCSS("font-style", "italic"); // preserved by merge

  // Content itself was never touched by the style edit.
  await expect(frame.locator("body")).toContainText("First assigned paragraph");
  await expect(frame.locator("body")).toContainText("Second assigned paragraph");
});

test("custom styles: create, assign, then remove with a safe fallback (V1-STYLE-004)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  // Create a custom paragraph style.
  await page.getByTestId("new-style-button").click();
  await page.getByTestId("style-name-input").fill("Callout");
  await page.getByTestId("style-apply").click();
  await expect(page.locator(".style-row", { hasText: "Callout" })).toBeVisible();

  // Assign it to a fresh paragraph via the toolbar.
  await replaceAllText(page, "Callout marker text");
  await page.getByTestId("style-select").selectOption({ label: "Callout" });

  const styled = frame
    .locator('p.doc-paragraph[class*="doc-style-custom-"]')
    .filter({ hasText: "Callout marker text" })
    .first();
  await expect(styled).toHaveClass(/doc-style-custom-/, { timeout: 20_000 });

  // Removing the custom style falls back deterministically: the reference and
  // content are preserved (class kept — no data loss) while the generated CSS
  // rule disappears (asserted at unit level).
  await page
    .locator(".style-row", { hasText: "Callout" })
    .locator("button", { hasText: "✕" })
    .click();
  await expect(styled).toHaveClass(/doc-style-custom-/, { timeout: 20_000 });
  await expect(styled).toHaveText("Callout marker text");
  await expect(page.locator(".style-row", { hasText: "Callout" })).toHaveCount(0);
});

test("theme switch preserves style definitions and assignments", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Theme-proof styled paragraph");
  await page.getByTestId("style-select").selectOption("warning");

  // Switch theme and wait for a theme-driven effect (bw_standard → Arial body).
  await page.getByTestId("theme-select").selectOption("bw_standard");
  await expect(frame.locator("body")).toHaveCSS("font-family", /Arial/, { timeout: 30_000 });

  // The style assignment and definition survive: Warning stays bold under any
  // theme, and the definition row is untouched in the IR.
  const styled = styledParagraph(frame, "warning", "Theme-proof styled paragraph");
  await expect(styled).toHaveClass(/doc-style-warning/, { timeout: 20_000 });
  await expect(styled).toHaveCSS("font-weight", "700");
  await expect(page.getByTestId("style-row-warning")).toBeVisible();
});

test("golden-04 renders the semantic hierarchy and style-based text types", async ({ page }) => {
  await page.goto("/");
  await previewFrame(page);
  await page.getByTestId("open").click();
  await page.setInputFiles('input[type="file"]', GOLDEN_STYLES);

  const frame = page.frames().find((f) => f.name() === "preview")!;
  // Wait for the loaded golden document to paginate.
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });

  // Heading hierarchy H1…H4 with the semantic heading styles.
  for (const level of [1, 2, 3, 4]) {
    await expect(frame.locator(`h${level}.doc-heading.doc-style-heading-${level}`).first()).toBeVisible();
  }
  // Style-based text types incl. the persisted custom style.
  for (const id of ["title", "subtitle", "body-text", "note", "warning", "important-notice", "quote", "caption", "definition", "reference", "custom-result"]) {
    await expect(frame.locator(`p.doc-paragraph.doc-style-${id}`).first()).toBeVisible();
  }
  // Custom style tokens reached the generated CSS (12pt from golden-04 JSON;
  // the live stylesheet is minified, i.e. "font-size:12pt").
  await expect
    .poll(
      () =>
        frame.evaluate(
          () =>
            [...document.querySelectorAll("style")].some((s) =>
              s.textContent?.includes("font-size:12pt"),
            ),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
});