/**
 * Equation rendering (V1-EQ-001/003).
 *
 * LaTeX source is converted to KaTeX HTML at layout time, so `renderLayout()`
 * remains a pure semantic → layout transformation and the IR stores only the
 * semantic source (never a screenshot or pre-baked HTML). KaTeX runs fully
 * offline; fonts are bundled locally (see scripts/copy-katex.mjs).
 *
 * Safety (AGENTS.md §61): `trust: false` disables `\href`, `\includegraphics`,
 * `\htmlData`, … so a document cannot use an equation to inject markup or
 * fetch resources. `throwOnError: false` renders malformed math as visible
 * error text instead of crashing the pipeline.
 */
import katex from "katex";

export interface MathRenderOptions {
  /** Display (block) math vs inline math. */
  display?: boolean;
}

function escapeMinimal(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render LaTeX to KaTeX HTML (never throws). */
export function renderMath(latex: string, display = true): string {
  try {
    return katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      errorColor: "#b00020",
      output: "html",
      strict: "ignore",
      trust: false,
    });
  } catch (err) {
    // Defense in depth: renderToString should not throw with throwOnError:false.
    const reason = err instanceof Error ? err.message : String(err);
    return `<span class="doc-equation-error" title="${escapeMinimal(reason)}">${escapeMinimal(latex)}</span>`;
  }
}
