/**
 * KaTeX stylesheet, bundled into the generated layout so equation rendering is
 * fully offline (no CDN). The CSS source lives in `katex-css.generated.ts`
 * (emitted by scripts/copy-katex.mjs) so every consumer — the Vite app, the
 * node core-library build, Vitest and Playwright — loads a plain TS string.
 *
 * Fonts are NOT inlined (60 files, ~1 MB); instead the `@font-face` URLs are
 * rewritten to a local base directory that callers copy the fonts into:
 *  - the app serves them from `public/katex/fonts/`;
 *  - the PDF exporter copies them next to the temp layout HTML.
 */
import { KATEX_CSS } from "./katex-css.generated";

/** KaTeX CSS with `url(fonts/…)` rebased onto `fontBaseUrl`. */
export function katexCss(fontBaseUrl = "katex/fonts/"): string {
  const base = fontBaseUrl.endsWith("/") ? fontBaseUrl : `${fontBaseUrl}/`;
  return KATEX_CSS.replace(/url\(fonts\//g, `url(${base}`);
}