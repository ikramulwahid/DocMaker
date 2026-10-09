/**
 * The single semantic → layout pipeline. The SAME HTML+CSS produced here is
 * consumed by:
 *  - the in-app live preview (iframe → Paged.js paginates it), and
 *  - the PDF export (headless Chromium loads the same HTML, paginates it with
 *    the same Paged.js in its own context, prints per-size runs, merges).
 *
 * The two run in SEPARATE execution contexts: the PDF is not printed from the
 * preview's DOM and the outputs are not byte/pixel-identical. Parity is the
 * shared pipeline-identical input and is VERIFIED by page count, page order,
 * MediaBox sizes and extracted text (ADR-002/003), not assumed.
 */
import { buildCss } from "./css";
import { buildBody, buildScripts, documentHasEquations } from "./html";
import { katexCss } from "./katex-css";
import type { ResolvedDocument } from "../resolve";

export { buildCss, cssString, marginContent, pageSizeMm } from "./css";
export { buildBody, blockHtml, documentHasEquations, escapeHtml, inlineHtml } from "./html";
export { katexCss } from "./katex-css";

export interface LayoutOptions {
  /** URL/src of paged.polyfill.js (Vite ?url import, file:// URL, …). */
  pagedJsSrc: string;
  /**
   * Base URL of the locally bundled KaTeX fonts (trailing slash optional).
   * The app passes an absolute URL; the PDF exporter copies the fonts next to
   * the temp HTML; tests use the default relative path.
   */
  katexFontsBaseUrl?: string;
  title?: string;
  lang?: string;
}

export function renderLayout(
  resolved: ResolvedDocument,
  options: LayoutOptions,
): string {
  const title = options.title ?? resolved.document.metadata.title ?? "";
  const css = buildCss(resolved);
  // KaTeX CSS is only bundled when the document actually uses equations, so
  // equation-free documents keep a minimal, stable layout.
  const mathCss = documentHasEquations(resolved)
    ? `\n/* KaTeX (bundled offline) */\n${katexCss(options.katexFontsBaseUrl)}`
    : "";
  const body = buildBody(resolved);
  const scripts = buildScripts(options.pagedJsSrc);
  return `<!doctype html>
<html lang="${options.lang ?? "en"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title.replace(/</g, "&lt;")}</title>
    <script>window.__layoutDone = false;</script>
    <style>
${css}${mathCss}
    </style>
  </head>
  <body>
${body}
    ${scripts}
  </body>
</html>
`;
}
