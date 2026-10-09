/**
 * Layout CSS — generated from the resolved IR only (never from editor state).
 *
 * Everything here is grounded in the Phase-0 spike evidence
 * (artifacts/spike/README.md): A4 geometry, named pages for per-section
 * orientation/margins/margin-boxes, the paged.js 0.4.3 named-page sheet-var
 * workaround, the repeated-thead handler, watermark pseudo-element.
 */
import type { MarginBox, MarginField } from "../ir/schema";
import type { ResolvedDocument } from "../resolve";
import { resolveTheme } from "../theme";

export function cssString(value: string): string {
  // JSON string syntax is a safe subset for CSS `content` strings once
  // newlines are removed (they would need \A escapes).
  return JSON.stringify(value.replace(/\r?\n/g, " "));
}

/** Page-counter margin fields (governed by section.pageSetup.showPageNumber). */
function isPageField(field: MarginField): field is "pageNumber" | "pageCount" {
  return field === "pageNumber" || field === "pageCount";
}

function fieldExpression(field: MarginField, strings: Record<string, string>): string {
  switch (field) {
    case "pageNumber":
      return "counter(page)";
    case "pageCount":
      return "counter(pages)";
    case "title":
      return cssString(strings.title ?? "");
    case "docNumber":
      return cssString(strings.docNumber ?? "");
    case "revision":
      return cssString(strings.revision ?? "");
    case "effectiveDate":
      return cssString(strings.effectiveDate ?? "");
    default:
      return cssString("");
  }
}

/**
 * Builds the content expression for a margin box (header/footer).
 *
 * `showPageNumber` governs ONLY the page-counter fields (§verify): when false,
 * the page-number tokens are stripped but any other footer content (e.g. a
 * document number) is preserved. A footer that consisted solely of the page
 * counter disappears entirely (nothing meaningful left to show).
 */
export function marginContent(
  box: MarginBox,
  strings: Record<string, string>,
  showPageNumber = true,
): string {
  if (!showPageNumber && box.parts.some((p) => p.kind === "field" && isPageField(p.field))) {
    // Page numbers hidden: keep everything else, dropping the phrase
    // scaffolding ("Page", "of", separators) that only ever framed the counter.
    const kept = box.parts
      .filter((part) => {
        if (part.kind === "field" && isPageField(part.field)) return false;
        if (part.kind === "field") return true;
        const t = part.value.trim();
        if (t === "") return false;
        // Pure separators ("—", "|", …) never carried content of their own.
        if (/^[\s,./|:;\-–—]+$/.test(t)) return false;
        // Page-phrase scaffolding ("Page", "of", " — Page", "Page 3 of 9"
        // minus the counters) belongs to the hidden counter, so drop it too.
        const bare = t.replace(/[\s,./|:;\-–—]+/g, "");
        if (/^(page|of)$/i.test(bare)) return false;
        return true;
      })
      .map((part) =>
        part.kind === "field" ? fieldExpression(part.field, strings) : cssString(part.value),
      );
    return kept.length ? kept.join(" ") : '""';
  }
  const parts = box.parts.map((part) =>
    part.kind === "text" ? cssString(part.value) : fieldExpression(part.field, strings),
  );
  return parts.length ? parts.join(" ") : '""';
}

/** mm geometry for a section's page (orientation-aware). */
export function pageSizeMm(orientation: "portrait" | "landscape"): {
  width: string;
  height: string;
} {
  return orientation === "landscape"
    ? { width: "297mm", height: "210mm" }
    : { width: "210mm", height: "297mm" };
}

export function buildCss(resolved: ResolvedDocument): string {
  const { document: doc } = resolved;
  const lines: string[] = [];

  const metadataStrings = {
    title: doc.metadata.title,
    docNumber: doc.metadata.docNumber,
    revision: doc.metadata.revision,
    effectiveDate: doc.metadata.effectiveDate,
  };

  const first = doc.sections[0].pageSetup;
  const rootSize = pageSizeMm(first.orientation);
  lines.push(`@page { size: ${rootSize.width} ${rootSize.height}; margin: 0; }`);

  for (const section of doc.sections) {
    const setup = section.pageSetup;
    const name = section.id; // valid CSS ident, e.g. sec_ab12cd34
    const size = pageSizeMm(setup.orientation);
    const m = setup.margins;
    lines.push(`@page ${name} {`);
    lines.push(`  size: ${size.width} ${size.height};`);
    lines.push(`  margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm;`);

    if (section.header) {
      lines.push(`  @top-center { content: ${marginContent(section.header, metadataStrings)}; }`);
    }
    // showPageNumber governs ONLY the page-counter tokens (see marginContent).
    // A footer that is nothing but the page counter disappears; a footer with
    // other content keeps that content.
    if (section.footer) {
      const footer = marginContent(section.footer, metadataStrings, setup.showPageNumber);
      if (footer !== '""') {
        lines.push(`  @bottom-right { content: ${footer}; }`);
      }
    }
    lines.push(`}`);

    // Named page → element rule (paged.js rewrites `page:` to a forced break,
    // so every section starts on a fresh page — documented behaviour).
    lines.push(`.doc-section-${name} { page: ${name}; }`);

    // paged.js 0.4.3 gap (spike gap 1): named @page sizes only write
    // --pagedjs-pagebox-*; the sheet frame reads root --pagedjs-width/-height
    // (+ side variants). Override them scoped to the generated page class.
    lines.push(`.pagedjs_${name}_page {`);
    lines.push(`  --pagedjs-width: ${size.width};`);
    lines.push(`  --pagedjs-height: ${size.height};`);
    lines.push(`  --pagedjs-width-left: ${size.width};`);
    lines.push(`  --pagedjs-height-left: ${size.height};`);
    lines.push(`  --pagedjs-width-right: ${size.width};`);
    lines.push(`  --pagedjs-height-right: ${size.height};`);
    lines.push(`}`);
  }

  /* ---------------------------------------------------------- typography */
  // Presentation is theme-driven (V1-THEME-004). Theme tokens come from the
  // fixed registry — never from user strings — so no CSS injection is possible.
  const theme = resolveTheme(doc.settings.theme);
  lines.push(`
body {
  font-family: ${theme.bodyFont};
  font-size: ${theme.bodyFontPt}pt;
  color: ${theme.ink};
}
.doc-heading {
  break-after: avoid;
  break-inside: avoid;
  font-family: ${theme.headingFont};
  color: ${theme.headingInk};
}
h1.doc-heading { font-size: ${theme.headingPt[0]}pt; margin: 6mm 0 3mm; }
h2.doc-heading { font-size: ${theme.headingPt[1]}pt; margin: 5mm 0 2.5mm; }
h3.doc-heading { font-size: ${theme.headingPt[2]}pt; margin: 4mm 0 2mm; }
h4.doc-heading, h5.doc-heading, h6.doc-heading { font-size: ${theme.headingPt[3]}pt; margin: 3mm 0 2mm; }
.doc-num { font-weight: inherit; }
p.doc-paragraph { margin: 0 0 3mm; line-height: 1.45; }
.doc-section { break-before: page; }
.doc-section:first-child { break-before: auto; }
.doc-list { margin: 0 0 3mm; padding-left: 6mm; }
.doc-list li { margin-bottom: 1.5mm; line-height: 1.45; }
.doc-page-break { break-before: page; height: 0; }
hr.doc-hr { border: none; border-top: 0.5pt solid ${theme.rule}; margin: 4mm 0; }
a { color: ${theme.accent}; text-decoration: underline; }
figure.doc-figure {
  margin: 4mm 0;
  break-inside: avoid;
}
figure.doc-figure img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
figcaption.doc-caption, caption.doc-caption {
  font-size: 9pt;
  text-align: center;
  margin-top: 2mm;
  caption-side: top;
  color: ${theme.mutedInk};
}
.doc-equation {
  margin: 4mm 0;
  break-inside: avoid;
  text-align: center;
}
.doc-equation.display { text-align: center; }
.doc-equation .katex { font-size: 1.05em; }
.doc-equation .katex-display { margin: 2mm 0; }
.doc-equation-error {
  color: #b00020;
  font-family: ${theme.monoFont};
  font-size: 0.9em;
}
table.doc-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 9pt;
  margin: 4mm 0 2mm;
}
table.doc-table.fixed-layout { table-layout: fixed; }
table.doc-table th, table.doc-table td {
  border: 0.3pt solid ${theme.tableBorder};
  padding: 1.6mm 2mm;
  text-align: left;
  vertical-align: top;
}
table.doc-table th {
  background: ${theme.tableHeaderBg};
  color: ${theme.tableHeaderInk};
  font-weight: bold;
}
table.doc-table thead { display: table-header-group; }
`);

  /* ------------------------------------------------------------ watermark */
  const wm = doc.settings.watermark;
  if (wm.enabled && wm.text) {
    lines.push(`
.pagedjs_sheet::after {
  content: ${cssString(wm.text)};
  position: absolute;
  top: 42%;
  left: 26%;
  font-size: ${wm.fontSizePt}pt;
  font-family: Arial, Helvetica, sans-serif;
  color: rgba(160, 0, 0, ${wm.opacity});
  transform: rotate(${wm.angle}deg);
  transform-origin: center;
  z-index: 0;
  pointer-events: none;
  white-space: nowrap;
}
`);
  }

  return lines.join("\n");
}
