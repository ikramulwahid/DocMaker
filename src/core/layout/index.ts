/**
 * The single semantic → layout pipeline. The SAME HTML+CSS produced here is
 * used by:
 *  - the in-app live preview (iframe → Paged.js paginates), and
 *  - the PDF export (headless Chromium prints this exact paginated DOM).
 * There is no second renderer, so preview and PDF cannot diverge.
 */
import { buildCss } from "./css";
import { buildBody, buildScripts, documentHasEquations } from "./html";
import { katexCss } from "./katex-css";
import type { ResolvedDocument } from "../resolve";

export { buildCss, cssString, marginContent, pageSizeMm } from "./css";
export { buildBody, documentHasEquations, escapeHtml, inlineHtml } from "./html";
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
