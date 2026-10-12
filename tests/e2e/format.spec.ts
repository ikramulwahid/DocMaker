/**
 * M2 — Character and paragraph formatting end-to-end (V1-FMT-001/002 MUST,
 * V1-FMT-003 SHOULD feasible subset).
 *
 * The toolbar controls write structured marks/overrides into the canonical IR,
 * the live preview renders them through the shared layout pipeline, and the
 * whole document survives save → reopen. All preview assertions use
 * auto-retrying locators (the preview iframe re-navigates on every srcdoc
 * update, which would destroy frame.evaluate polling contexts mid-evaluate).
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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
 * Selecting everything first makes the caret position deterministic.
 */
async function replaceAllText(page: Page, text: string) {
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(text);
}

/** First preview paragraph containing `text`. */
function previewParagraph(frame: Frame, text: string) {
  return frame.locator("p.doc-paragraph").filter({ hasText: text }).first();
}

/** Set a native colour input in a React-controlled form. */
async function setColor(page: Page, testId: string, value: string) {
  await page.getByTestId(testId).fill(value);
}

/**
 * Focus the editor and select all, retrying until the DOM selection is
 * non-empty. A plain `click` + `Control+a` can race a pending toolbar
 * re-render under parallel load: the mark then lands on a collapsed caret and
 * never appears in the preview. Asserting the precondition removes the race
 * without weakening the assertion (the control still drives the real selection).
 */
async function selectAllInEditor(page: Page) {
  await expect(async () => {
    await page.locator('[data-testid="editor"]').click();
    await page.keyboard.press("Control+a");
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? "");
    expect(selected.trim().length).toBeGreaterThan(0);
  }).toPass({ timeout: 10_000 });
}

test("character marks reach the live preview (V1-FMT-001)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Marked run");
  await page.keyboard.press("Control+a");
  await page.getByTitle("Underline").click();
  await page.getByTitle("Strikethrough").click();

  const para = previewParagraph(frame, "Marked run");
  await expect(para.locator("u")).toHaveText("Marked run", { timeout: 20_000 });
  await expect(para.locator("s")).toHaveText("Marked run");
});

test("superscript and subscript are mutually exclusive (V1-FMT-001)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Vertical");
  await page.keyboard.press("Control+a");
  await page.getByTitle("Superscript").click();

  const para = previewParagraph(frame, "Vertical");
  await expect(para.locator("sup")).toHaveText("Vertical", { timeout: 20_000 });

  // Applying subscript must REPLACE superscript (never both).
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+a");
  await page.getByTitle("Subscript").click();

  await expect(para.locator("sub")).toHaveText("Vertical", { timeout: 20_000 });
  await expect(para.locator("sup")).toHaveCount(0);
});

test("font family, size, colour and highlight reach the preview (V1-FMT-001)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Styled characters");
  await selectAllInEditor(page);
  await page.getByTestId("fmt-font-family").selectOption("mono");
  await page.getByTestId("fmt-font-size").fill("18");
  await page.getByTestId("fmt-font-size").blur();

  const para = previewParagraph(frame, "Styled characters");
  await expect(para.locator('span[data-font-family="mono"]')).toHaveText("Styled characters", {
    timeout: 20_000,
  });

  // Colour + highlight on the same selection: select once, then apply both
  // toolbar controls. The editor (ProseMirror) keeps its selection while a
  // toolbar control has focus, so highlight reuses the colour selection (a
  // second click + Control+a mid-render is the racy part under load).
  await selectAllInEditor(page);
  await setColor(page, "fmt-color", "#ff0000");
  await expect(para.locator('span[style*="color"]')).toHaveCount(1, { timeout: 20_000 });

  // NOTE: must differ from the control's default (#ffff00) or React's
  // value-tracking suppresses the change event for the controlled input.
  await setColor(page, "fmt-highlight", "#00ff00");
  await expect(para.locator('span[style*="background-color"]')).toHaveCount(1, {
    timeout: 20_000,
  });
});

test("text case subset renders uppercase/lowercase (V1-FMT-003 partial)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "caseshow");
  await page.keyboard.press("Control+a");
  await page.getByTestId("fmt-text-case").selectOption("uppercase");

  const para = previewParagraph(frame, "caseshow");
  await expect(para.locator('span[data-text-case="uppercase"]')).toHaveText("caseshow", {
    timeout: 20_000,
  });
  await expect(para.locator('span[data-text-case="uppercase"]')).toHaveCSS("text-transform", "uppercase");
});

test("paragraph overrides reach the preview (V1-FMT-002)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Aligned paragraph");
  await page.getByTestId("fmt-align").selectOption("center");
  await page.getByTestId("fmt-line-spacing").fill("1.5");
  await page.getByTestId("fmt-line-spacing").blur();
  await page.getByTestId("fmt-space-before").fill("6");
  await page.getByTestId("fmt-space-before").blur();
  await page.getByTestId("fmt-indent-left").fill("12");
  await page.getByTestId("fmt-indent-left").blur();

  const para = previewParagraph(frame, "Aligned paragraph");
  await expect(para).toHaveCSS("text-align", "center", { timeout: 20_000 });
  // Line-height/margins are emitted as inline overrides; Chromium resolves the
  // declared units (1.5 → px, mm → px) in the computed style, so assert the
  // emitted declarations on the element itself.
  await expect(para).toHaveAttribute("style", /line-height:\s*1\.5/);
  await expect(para).toHaveAttribute("style", /margin-top:\s*6mm/);
  await expect(para).toHaveAttribute("style", /margin-left:\s*12mm/);
});

test("marks and overrides survive save → reopen (round trip)", async ({ page }) => {
  await page.goto("/");
  await previewFrame(page);

  // Character marks (underline + superscript) and paragraph overrides on one
  // paragraph, exactly as an author would set them through the toolbar.
  await replaceAllText(page, "Round trip run");
  await page.keyboard.press("Control+a");
  await page.getByTitle("Underline").click();
  await page.getByTitle("Superscript").click();
  const marked = previewParagraph(
    page.frames().find((f) => f.name() === "preview")!,
    "Round trip run",
  );
  await expect(marked.locator("u")).toHaveText("Round trip run", { timeout: 20_000 });

  await page.getByTestId("fmt-align").selectOption("center");
  await page.getByTestId("fmt-line-spacing").fill("1.5");
  await page.getByTestId("fmt-line-spacing").blur();

  // Save to a real file on disk.
  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-fmt-"));
  const saved = path.join(dir, "format-roundtrip.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  await download.saveAs(saved);

  // The IR itself must carry structured marks/overrides — never rendered HTML.
  const envelope = JSON.parse(readFileSync(saved, "utf8")) as {
    document: { sections: { blocks: { type: string; content?: unknown; format?: unknown }[] }[] };
  };
  const paragraph = envelope.document.sections[0].blocks.find(
    (b) => b.type === "paragraph",
  );
  expect(paragraph).toBeDefined();
  const format = paragraph!.format as { alignment: string | null; lineSpacing: number | null };
  expect(format.alignment).toBe("center");
  expect(format.lineSpacing).toBe(1.5);
  const marks = (paragraph!.content as { text: string; marks: { type: string }[] }[]).flatMap(
    (inline) => inline.marks.map((m) => m.type),
  );
  expect(marks.sort()).toEqual(["superscript", "underline"]);

  // Reopen into a fresh session: the starter document is replaced and the
  // marks/overrides must round-trip through serialize → parse → render.
  await page.reload();
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(saved);
  await expect(page.getByTestId("file-name")).toContainText("format-roundtrip");

  const frame = await previewFrame(page);
  const reopened = previewParagraph(frame, "Round trip run");
  await expect(reopened.locator("u")).toHaveText("Round trip run", { timeout: 20_000 });
  await expect(reopened.locator("sup")).toHaveText("Round trip run");
  await expect(reopened).toHaveCSS("text-align", "center");
  await expect(reopened).toHaveAttribute("style", /line-height:\s*1\.5/);
});

