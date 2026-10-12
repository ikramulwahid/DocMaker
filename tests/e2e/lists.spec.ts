/**
 * M3 — Lists and multilevel numbering end-to-end (V1-LIST-001..004).
 *
 * The toolbar writes the canonical recursive `list` into the IR, the live
 * preview renders it through the shared layout pipeline, indentation nests and
 * unnests items, labels are DERIVED (renumber on insert), and the whole
 * structure survives save → reopen. Preview assertions use auto-retrying
 * locators (the preview iframe re-navigates on every srcdoc update).
 *
 * Renumbering is demonstrated through real editor operations: insert (Enter)
 * and delete (clear the item's text, then Backspace the empty item away).
 * REORDERING has no dedicated toolbar control — the M3 controls deliberately
 * offer only indent/outdent (nest/unnest), not move-up/down — so sibling
 * reorder cannot be exercised through the UI today; it is covered instead by
 * the stable-id behavioural unit test in `tests/unit/list.test.ts`
 * ("reorders the same items without changing their ids"). This limitation is
 * recorded honestly rather than faked by rebuilding the document in the test.
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

/** Replace the whole editor content with a fresh paragraph containing `text`. */
async function replaceAllText(page: Page, text: string) {
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(text);
}

/** Replace the editor content with N plain paragraphs (one per line). */
async function typeParagraphs(page: Page, lines: string[]) {
  await replaceAllText(page, lines[0]);
  for (const line of lines.slice(1)) {
    await page.keyboard.press("Enter");
    await page.keyboard.type(line);
  }
  await page.keyboard.press("Control+a");
}

function firstOl(frame: Frame) {
  return frame.locator("ol.doc-list-ordered").first();
}

/** Click an editor paragraph (by text) and wait until the editor owns focus —
 * a toolbar re-render can otherwise swallow the click under parallel load. */
async function focusEditorParagraph(page: Page, text: string) {
  await expect(async () => {
    await page.locator('[data-testid="editor"] p').filter({ hasText: text }).first().click();
    await expect(page.locator('[data-testid="editor"]')).toBeFocused();
  }).toPass({ timeout: 10_000 });
}

test("bullet list reaches the preview and the marker is selectable (V1-LIST-001)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await typeParagraphs(page, ["First bullet", "Second bullet"]);
  await page.getByTitle("Bullet list").click();

  const ul = frame.locator("ul.doc-list-bullet").first();
  await expect(ul).toHaveAttribute("data-marker", "disc", { timeout: 20_000 });
  await expect(ul.locator("li.doc-list-item")).toHaveCount(2);
  await expect(ul).toContainText("First bullet");

  // Six markers are offered; picking one re-renders the semantic <ul>.
  await page.getByTestId("fmt-bullet-marker").selectOption("arrow");
  await expect(frame.locator('ul.doc-list-bullet[data-marker="arrow"]')).toBeVisible({
    timeout: 20_000,
  });
  await expect(frame.locator('ul.doc-list-bullet[data-marker="arrow"]')).toContainText(
    "Second bullet",
  );
});

test("numbered list derives labels, honours start and renumbers on insert (V1-LIST-002/004)", async ({
  page,
}) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await typeParagraphs(page, ["One", "Two"]);
  await page.getByTitle("Numbered list").click();

  const ol = firstOl(frame);
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["1.", "2."], { timeout: 20_000 });

  // Numbering style is a validated enum; labels follow it.
  await page.getByTestId("fmt-ordered-numbering").selectOption("lower-alpha");
  await expect(ol).toHaveAttribute("data-numbering", "lower-alpha", { timeout: 20_000 });
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["a.", "b."]);

  // Configurable start.
  await page.getByTestId("fmt-list-start").fill("4");
  await page.getByTestId("fmt-list-start").blur();
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["d.", "e."], { timeout: 20_000 });

  // Inserting an item renumbers every following label (labels are derived,
  // never stored in the document).
  await focusEditorParagraph(page, "Two");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Three");
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["d.", "e.", "f."], {
    timeout: 20_000,
  });
});

test("deleting a list item renumbers the survivors (V1-LIST-003)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await typeParagraphs(page, ["One", "Two", "Three"]);
  await page.getByTitle("Numbered list").click();

  const ol = firstOl(frame);
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["1.", "2.", "3."], {
    timeout: 20_000,
  });

  // Delete the middle item with a real editor operation: select the item's text
  // (Home → Shift+End), clear it, then Backspace the now-empty item away. The
  // surviving items are not rebuilt or reassigned — only the derived labels
  // change.
  await focusEditorParagraph(page, "Two");
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+End");
  await page.keyboard.press("Delete");
  await page.keyboard.press("Backspace");

  await expect(ol.locator("span.doc-list-marker")).toHaveText(["1.", "2."], {
    timeout: 20_000,
  });
  await expect(ol.locator("li.doc-list-item")).toHaveCount(2);
  await expect(ol).not.toContainText("Two");
  await expect(ol).toContainText("One");
  await expect(ol).toContainText("Three");
});

test("indent nests and outdent unnests a list item (V1-LIST-004)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await typeParagraphs(page, ["Outer one", "Outer two"]);
  await page.getByTitle("Numbered list").click();

  const outer = firstOl(frame);
  await expect(outer.locator("span.doc-list-marker")).toHaveText(["1.", "2."], {
    timeout: 20_000,
  });

  // Nest the second item under the first.
  await focusEditorParagraph(page, "Outer two");
  await page.getByTitle("Indent (nest) list item").click();
  await expect(outer.locator("li > ol.doc-list-ordered")).toHaveCount(1, { timeout: 20_000 });
  await expect(outer.locator("span.doc-list-marker")).toHaveText(["1.", "1.1."]);

  // Unnest it again.
  await focusEditorParagraph(page, "Outer two");
  await page.getByTitle("Outdent (unnest) list item").click();
  await expect(outer.locator("li > ol.doc-list-ordered")).toHaveCount(0, { timeout: 20_000 });
  await expect(outer.locator("span.doc-list-marker")).toHaveText(["1.", "2."]);
});

test("converts bullet ↔ numbered without losing text (V1-LIST-001)", async ({ page }) => {
  await page.goto("/");
  const frame = await previewFrame(page);

  await replaceAllText(page, "Convert me");
  await page.keyboard.press("Control+a");
  await page.getByTitle("Bullet list").click();
  await expect(frame.locator("ul.doc-list-bullet").first()).toContainText("Convert me", {
    timeout: 20_000,
  });

  await page.getByTitle("Numbered list").click();
  await expect(firstOl(frame)).toContainText("Convert me", { timeout: 20_000 });
  await expect(frame.locator("ul.doc-list-bullet")).toHaveCount(0);
});

test("lists survive save → reopen as a canonical recursive IR (round trip)", async ({ page }) => {
  await page.goto("/");
  await previewFrame(page);

  await typeParagraphs(page, ["Step one", "Step two"]);
  await page.getByTitle("Numbered list").click();
  await page.getByTestId("fmt-ordered-numbering").selectOption("upper-roman");
  await page.getByTestId("fmt-list-start").fill("2");
  await page.getByTestId("fmt-list-start").blur();

  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-list-"));
  const saved = path.join(dir, "lists.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  await download.saveAs(saved);

  const envelope = JSON.parse(readFileSync(saved, "utf8")) as {
    document: {
      sections: {
        blocks: {
          type: string;
          listType?: string;
          marker?: unknown;
          start?: number;
          items?: { content?: { type: string }[]; children?: unknown[] }[];
        }[];
      }[];
    };
  };
  const list = envelope.document.sections[0].blocks.find((b) => b.type === "list");
  expect(list).toBeDefined();
  expect(list!.listType).toBe("upper-roman");
  expect(list!.marker).toBeNull();
  expect(list!.start).toBe(2);
  expect(list!.items).toHaveLength(2);
  expect(list!.items![0].content?.[0].type).toBe("paragraph");
  // Ordinals are derived: no stored visible number in the JSON.
  expect(JSON.stringify(list)).not.toContain('"number"');

  await page.reload();
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(saved);
  await expect(page.getByTestId("file-name")).toContainText("lists");

  const frame = await previewFrame(page);
  const ol = firstOl(frame);
  await expect(ol).toHaveAttribute("data-numbering", "upper-roman", { timeout: 20_000 });
  await expect(ol.locator("span.doc-list-marker")).toHaveText(["II.", "III."]);
});
