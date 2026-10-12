/**
 * M6 — cross-references end-to-end (V1-REF-001/002/003).
 *
 * The editor stores a reference as the TARGET's stable id + kind; the visible
 * label is derived by the numbering engine. These tests drive the real picker,
 * preview and PDF pipeline: the picker lists derived labels, the editor chip is
 * structural (kind, never a number), a broken target is surfaced and blocks the
 * final PDF, and the derived label survives save/reopen and print.
 */
import { expect, test, type Frame, type Page } from "@playwright/test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deserializeDocument, resolveDocument, serializeDocument } from "@/core";
import { renderLayout } from "@/core/layout";
import {
  createEmptyDocument,
  createParagraph,
  createSection,
  createTable,
  reference,
  text,
} from "@/core/ir/factory";
import { exportPaginatedPdf } from "../../scripts/lib/pdf-export.mjs";
import {
  extractPdfTextByPage,
  findPageHits,
} from "../../scripts/verify-pdf-text.mjs";

const GOLDEN_REFS = path.resolve("tests/golden/golden-09-references.json");
const PAGED_JS = pathToFileURL(
  path.resolve("node_modules/pagedjs/dist/paged.polyfill.js"),
).href;
/** Text the golden reference document always renders in the body. */
const REFS_MARKER = "deliberately dangling pointer";

/** Open a document through the real UI open flow and wait for its body. */
async function openDoc(page: Page, jsonPath: string): Promise<Frame> {
  await page.goto("/");
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(jsonPath);
  const frame = page.frames().find((f) => f.name() === "preview");
  if (!frame) throw new Error("preview frame not found");
  await frame.waitForFunction(
    (marker) => document.body.innerText.includes(marker),
    REFS_MARKER,
    { timeout: 30_000 },
  );
  await frame.waitForFunction(() => window.__layoutDone === true, null, {
    timeout: 30_000,
  });
  return frame;
}

interface RawInline {
  text?: string;
  ref?: string;
  refKind?: string;
}
interface RawBlock {
  id: string;
  type: string;
  content?: RawInline[];
}

/** Read the frozen golden's stable target ids (never a visible label). */
function goldenTargets(jsonPath: string) {
  const envelope = JSON.parse(readFileSync(jsonPath, "utf8")) as {
    document: { sections: { blocks: RawBlock[] }[] };
  };
  const blocks = envelope.document.sections[0].blocks;
  const table = blocks.find((b) => b.type === "table");
  const scope = blocks.find(
    (b) => b.type === "heading" && b.content?.[0]?.text === "Scope",
  );
  const equation = blocks.find((b) => b.type === "equation");
  if (!table || !scope || !equation) throw new Error("golden-09 targets not found");
  return { tableId: table.id, scopeId: scope.id, equationId: equation.id, blocks };
}

test("reference picker lists derived labels and inserts a canonical reference (V1-REF-002)", async ({
  page,
}) => {
  const frame = await openDoc(page, GOLDEN_REFS);
  const { tableId } = goldenTargets(GOLDEN_REFS);

  // Editor chips are STRUCTURAL: the target kind + stable id, never a number.
  const tableChip = page.locator('.ir-ref-chip[data-ref-kind="table"]');
  await expect(tableChip).toHaveAttribute("data-ref-ref", tableId);
  await expect(tableChip).toHaveText("⟶ Table");

  // Preview shows the label DERIVED from the current numbering.
  await expect(frame.locator('.doc-ref[data-reference-kind="table"]')).toHaveText(
    "Table 1",
    { timeout: 20_000 },
  );
  await expect(frame.locator('.doc-ref[data-reference-kind="figure"]')).toHaveText(
    "Figure 1",
    { timeout: 20_000 },
  );
  await expect(frame.locator('.doc-ref[data-reference-kind="equation"]')).toHaveText(
    "Equation 1",
    { timeout: 20_000 },
  );
  await expect(
    frame.locator('.doc-ref[data-reference-kind="heading"]:not([data-broken="true"])'),
  ).toHaveText("1.1", { timeout: 20_000 });

  // The picker exposes the SAME derived label for the target.
  const picker = page.getByTestId("insert-reference");
  await expect(picker).toBeEnabled();
  await expect(picker.locator(`option[value="table|${tableId}"]`)).toHaveText(
    /Table 1 — Acceptance limits/,
  );

  // Insert a second, independent reference from the picker.
  await page.locator('[data-testid="editor"]').click();
  await page.keyboard.press("Control+End");
  await picker.selectOption(`table|${tableId}`);
  await expect(page.locator('.ir-ref-chip[data-ref-kind="table"]')).toHaveCount(2);
});

test("references persist as stable target ids and reopen (never a copied label)", async ({
  page,
}) => {
  await openDoc(page, GOLDEN_REFS);
  const { tableId } = goldenTargets(GOLDEN_REFS);

  const dir = mkdtempSync(path.join(tmpdir(), "docmaker-refs-"));
  const saved = path.join(dir, "refs.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save").click();
  const download = await downloadPromise;
  await download.saveAs(saved);

  const json = readFileSync(saved, "utf8");
  expect(json).toContain(tableId);
  expect(json).toContain('"refKind": "table"');
  // A derived label must NEVER be copied into the stored IR.
  expect(json).not.toContain("Table 1");
  expect(json).not.toContain("Equation 1");

  // Reopen into a fresh session: the chip (id + kind) round-trips.
  await page.reload();
  await page.waitForSelector('iframe[name="preview"]');
  await page.getByTestId("open").click();
  await page.getByTestId("open-file-input").setInputFiles(saved);
  await expect(page.locator('.ir-ref-chip[data-ref-kind="table"]')).toHaveAttribute(
    "data-ref-ref",
    tableId,
  );
});

test("a broken reference is surfaced and blocks final PDF export (V1-REF-002/003)", async ({
  page,
}) => {
  const frame = await openDoc(page, GOLDEN_REFS);

  // Visible, actionable marker — never blank and never a stale label.
  const broken = frame.locator('.doc-ref[data-broken="true"]');
  await expect(broken).toHaveText("⟦missing heading⟧", { timeout: 20_000 });
  await expect(broken).toHaveAttribute("title", /does not exist or was deleted/);

  // The shared issue panel names the missing target with a reason.
  const panel = page.getByTestId("unresolved-fields");
  await expect(panel).toContainText("hd_missing0001");
  await expect(panel).toContainText("does not exist or was deleted");

  // Final PDF export is refused while the reference is broken.
  await page.getByTestId("export-pdf").click();
  await expect(page.getByTestId("status")).toContainText("PDF export blocked");
  await expect(page.getByTestId("status")).toContainText("broken reference");
});

/** A sentinel-prefixed reference so the DERIVED label is isolated in PDF text. */
function referenceDoc() {
  const doc = createEmptyDocument("Renumber");
  const target = createTable([["A"], ["B"]]);
  doc.sections = [
    createSection([
      createParagraph([text("REFMARK "), reference(target.id, "table")]),
      target,
    ]),
  ];
  return doc;
}

test("inserting a numbered object renumbers dependents in the printed PDF (V1-REF-003)", async () => {
  test.setTimeout(180_000);

  // base: one table → the reference reads "Table 1".
  const base = referenceDoc();

  // renumbered: an extra table is inserted BEFORE the target, so the SAME
  // reference (same stable id) must now read "Table 2".
  const renumbered = createEmptyDocument("Renumber");
  const target = createTable([["A"], ["B"]]);
  const extra = createTable([["X"]]);
  renumbered.sections = [
    createSection([
      createParagraph([text("REFMARK "), reference(target.id, "table")]),
      extra,
      target,
    ]),
  ];

  const baseHtml = renderLayout(resolveDocument(base), { pagedJsSrc: PAGED_JS });
  const renumHtml = renderLayout(resolveDocument(renumbered), { pagedJsSrc: PAGED_JS });
  expect(baseHtml).toContain(">Table 1</span>");
  expect(renumHtml).toContain(">Table 2</span>");
  expect(renumHtml).not.toContain(">Table 1</span>");

  // Extract the ACTUAL printed PDF text: the sentinel proves the reference —
  // not a caption — carries the renumbered label.
  const basePages = await extractPdfTextByPage(
    (await exportPaginatedPdf({ html: baseHtml })).pdf,
  );
  const renumPages = await extractPdfTextByPage(
    (await exportPaginatedPdf({ html: renumHtml })).pdf,
  );
  expect(findPageHits(basePages, "REFMARK Table 1")).not.toHaveLength(0);
  expect(findPageHits(basePages, "REFMARK Table 2")).toHaveLength(0);
  expect(findPageHits(renumPages, "REFMARK Table 2")).not.toHaveLength(0);
  expect(findPageHits(renumPages, "REFMARK Table 1")).toHaveLength(0);
});

test("a broken reference exports a PDF with the actionable missing marker (V1-REF-002)", async () => {
  test.setTimeout(120_000);

  const doc = createEmptyDocument("Broken");
  doc.sections = [
    createSection([
      createParagraph([text("Dangling: "), reference("tb_missing0001", "table")]),
    ]),
  ];
  const html = renderLayout(resolveDocument(doc), { pagedJsSrc: PAGED_JS });

  // The layout renders a visible, actionable marker (never blank) …
  expect(html).toContain('data-broken="true"');
  expect(html).toContain("⟦missing table⟧");
  expect(html).toContain("does not exist or was deleted");

  // … and the shared PDF pipeline still emits the marker into the page text.
  const pages = await extractPdfTextByPage(
    (await exportPaginatedPdf({ html })).pdf,
  );
  expect(findPageHits(pages, "missing table")).not.toHaveLength(0);
});

test("the golden reference document round-trips through the JSON envelope", () => {
  const original = deserializeDocument(readFileSync(GOLDEN_REFS, "utf8"));
  const reparsed = deserializeDocument(serializeDocument(original));
  expect(reparsed).toEqual(original);
});
