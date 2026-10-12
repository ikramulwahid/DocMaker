#!/usr/bin/env node
/**
 * DocMaker PDF export (verified mixed-orientation path — ADR-002).
 *
 *   pnpm pdf <document.labdoc.json> [-o out.pdf]
 *
 * Pipeline: deserialize → resolve → renderLayout (same code as the app's
 * live preview) → Chromium per-size-run print → pdf-lib merge.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { parseArgs } from "node:util";
import { exportPaginatedPdf } from "./lib/pdf-export.mjs";

const { values, positionals } = parseArgs({
  options: { out: { type: "string", short: "o" }, timeout: { type: "string" } },
  allowPositionals: true,
});

const input = positionals[0];
if (!input) {
  console.error("usage: pnpm pdf <document.labdoc.json> [-o out.pdf]");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const corePath = path.join(root, "dist-core", "core.js");
let core;
try {
  core = await import(pathToFileURL(corePath).href);
} catch (err) {
  console.error(`dist-core/core.js missing — run \`pnpm build:core\` first (${err.message})`);
  process.exit(1);
}
const {
  deserializeDocument,
  resolveDocument,
  renderLayout,
  collectUnresolvedFields,
  unresolvedFieldMessages,
} = core;

const inputPath = path.resolve(input);
const json = readFileSync(inputPath, "utf8");

let document;
try {
  document = deserializeDocument(json);
} catch (err) {
  console.error(`Invalid document: ${err.message}`);
  process.exit(1);
}

// V1-FIELD-004: the same shared validation the app uses gates the CLI path.
// A final PDF is refused while a USED field has no value; page fields are
// deferred to pagination and are never reported here.
const unresolved = collectUnresolvedFields(document);
if (unresolved.occurrences.length > 0) {
  console.error(
    `PDF export blocked — ${unresolved.occurrences.length} unresolved field(s):`,
  );
  for (const message of unresolvedFieldMessages(unresolved)) {
    console.error(`  - ${message}`);
  }
  console.error("Resolve the fields in the document, or keep editing the draft.");
  process.exit(1);
}

const resolved = resolveDocument(document);
const pagedJsSrc = pathToFileURL(
  path.join(root, "node_modules", "pagedjs", "dist", "paged.polyfill.js"),
).href;
const html = renderLayout(resolved, { pagedJsSrc });

const outputPath = path.resolve(
  values.out ??
    inputPath.replace(/(\.labdoc)?\.json$/i, "") + ".pdf",
);

const result = await exportPaginatedPdf({
  html,
  outputPath,
  timeoutMs: Number(values.timeout ?? 60_000),
});

console.log(
  JSON.stringify(
    {
      input: path.relative(root, inputPath),
      output: path.relative(root, outputPath),
      pages: result.pages,
      runs: result.runs,
      mediaBoxes: result.boxes,
    },
    null,
    2,
  ),
);
