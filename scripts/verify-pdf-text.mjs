#!/usr/bin/env node
/**
 * Repeatable PDF text verification (Phase 0.2 evidence).
 *
 * Extracts the text layer of a PDF with pdf.js (same engine that was used to
 * probe the exported PDFs manually during Phase 0); the gate e2e suite uses
 * this module so "the PDF contains the document's distinctive text and
 * equation glyphs" is an automated, re-runnable check instead of a reported
 * manual observation.
 *
 * CLI:
 *   node scripts/verify-pdf-text.mjs <file.pdf> \
 *        --expect "SOP-GATE-001" --expect "DRAFT" [--dump] [--json]
 *
 *   --expect <text>   required substring (repeatable). A string is found if
 *                     it appears in a page's extracted text either verbatim
 *                     or with all whitespace removed (glyph runs are often
 *                     split across text items). Exit code 0 → all found.
 *   --dump            print every page's extracted text (evidence capture).
 *   --json            print the machine-readable report instead of prose.
 *
 * Importable (ESM): { extractPdfText, extractPdfTextByPage, findPageHits }
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
// pdfjs-dist legacy build (CommonJS) runs in Node without a worker and
// without the optional canvas native module (only canvas *rendering* needs
// it; text extraction does not).
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/** Collapse all whitespace so glyph runs split across text items still match. */
export function collapseText(text) {
  return text.replace(/\s+/g, "");
}

export async function extractPdfTextByPage(source) {
  const data =
    typeof source === "string"
      ? new Uint8Array(readFileSync(path.resolve(source)))
      : new Uint8Array(source);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push({ page: i, text });
  }
  return pages;
}

export async function extractPdfText(source) {
  const pages = await extractPdfTextByPage(source);
  return pages.map((p) => p.text).join("\n");
}

/**
 * Locate an expected substring in the extracted pages. A page is a hit when
 * the substring appears verbatim OR whitespace-collapsed (KaTeX/Chromium
 * split glyph runs with spaces).
 * @returns {Array<{page: number, kind: "verbatim" | "collapsed"}>}
 */
export function findPageHits(pages, expected) {
  const hits = [];
  for (const p of pages) {
    if (p.text.includes(expected)) {
      hits.push({ page: p.page, kind: "verbatim" });
    } else if (collapseText(p.text).includes(collapseText(expected))) {
      hits.push({ page: p.page, kind: "collapsed" });
    }
  }
  return hits;
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      expect: { type: "string", multiple: true },
      dump: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const pdfPath = positionals[0];
  if (!pdfPath) {
    console.error("usage: node scripts/verify-pdf-text.mjs <file.pdf> --expect <text> [--dump] [--json]");
    process.exit(2);
  }
  const expected = values.expect ?? [];

  const pages = await extractPdfTextByPage(pdfPath);
  const report = {
    input: path.relative(process.cwd(), path.resolve(pdfPath)),
    pages: pages.length,
    expect: expected.map((e) => {
      const hits = findPageHits(pages, e);
      return { text: e, found: hits.length > 0, hits };
    }),
    dump: values.dump ? pages.map((p) => ({ page: p.page, text: p.text })) : undefined,
  };

  const missing = report.expect.filter((e) => !e.found);

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`PDF: ${report.input} (${report.pages} pages)`);
    for (const e of report.expect) {
      const where = e.hits.map((h) => `${h.page}(${h.kind})`).join(", ");
      console.log(
        `${e.found ? "PASS" : "FAIL"}  ${JSON.stringify(e.text)}  → ${where || "not found"}`,
      );
    }
    if (values.dump) {
      for (const p of report.dump) {
        console.log(`\n--- page ${p.page} ---`);
        console.log(p.text);
      }
    }
  }

  if (missing.length > 0) {
    console.error(
      `missing ${missing.length} expected string(s): ${missing.map((m) => JSON.stringify(m.text)).join(", ")}`,
    );
    process.exit(1);
  }
}

const isCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}