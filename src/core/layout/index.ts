/**
 * The single semantic → layout pipeline. The SAME HTML+CSS produced here is
 * used by:
 *  - the in-app live preview (iframe → Paged.js paginates), and
 *  - the PDF export (headless Chromium prints this exact paginated DOM).
 * There is no second renderer, so preview and PDF cannot diverge.
 */
import { buildCss } from "./css";
import { buildBody, buildScripts } from "./html";
import type { ResolvedDocument } from "../resolve";

export { buildCss, cssString, marginContent, pageSizeMm } from "./css";
export { buildBody, escapeHtml, inlineHtml } from "./html";

export interface LayoutOptions {
  /** URL/src of paged.polyfill.js (Vite ?url import, file:// URL, …). */
  pagedJsSrc: string;
  title?: string;
  lang?: string;
}

export function renderLayout(
  resolved: ResolvedDocument,
  options: LayoutOptions,
): string {
  const title = options.title ?? resolved.document.metadata.title ?? "";
  const css = buildCss(resolved);
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
${css}
    </style>
  </head>
  <body>
${body}
    ${scripts}
  </body>
</html>
`;
}
