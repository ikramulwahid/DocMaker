/**
 * Layout HTML — blocks → semantic markup for the pagination engine.
 * Pure string building; no DOM, no editor state (node-testable).
 */
import {
  BULLET_MARKERS,
  LIST_TYPES,
  isFieldNode,
  isReferenceNode,
  type Block,
  type BulletMarker,
  type Inline,
  type ListItem,
  type ListType,
  type ParagraphFormatOverride,
  type ReferenceNode,
  type Section,
} from "../ir/schema";
import type { ResolvedDocument } from "../resolve";
import { effectiveStyleOf } from "../resolve";
import type { Numbering } from "../numbering";
import {
  isValidColumnWidth,
  sanitizeHref,
  sanitizeImageSrc,
  safeListStart,
  fontSizePtProblem,
  isValidHexColor,
  INDENT_LEFT_MM_MAX,
  LINE_SPACING_MAX,
  LINE_SPACING_MIN,
  SPACE_MM_MAX,
  SPACE_MM_MIN,
} from "../ir/sanitize";
import { forEachSectionParagraph } from "../ir/walk";
import {
  fieldDefinition,
  isPageFieldKey,
  resolveField,
  unresolvedFieldMarker,
  type FieldKey,
} from "../fields";
import { missingReferenceMarker, resolveReference } from "../references";
import { renderMath } from "../equation";

/**
 * The style class for a text block (V1-STYLE-002): an explicit reference or
 * the derived built-in default. Classes are `doc-style-<id>` — style ids are
 * validated (`^[a-z][a-z0-9-]{0,31}$`), so they are always safe CSS class
 * names and can never smuggle markup.
 */
function styleClassName(resolved: ResolvedDocument, block: Block): string {
  const style = effectiveStyleOf(resolved.document, block);
  return style ? ` doc-style-${style.id}` : "";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

/**
 * Render one body dynamic-field reference (V1-FIELD-001/002/003).
 *
 *  - resolved text is ESCAPED and wrapped in a distinguishable span;
 *  - a resolved image (`laboratory.logo`) is an allow-listed embedded data URI
 *    only (re-validated here at the render boundary);
 *  - page fields render an empty placeholder that the post-pagination
 *    materializer fills (so preview and PDF share one resolution path);
 *  - unresolved fields render a visible marker, never blank, never `{{...}}`
 *    leaked as literal text (V1-FIELD-004).
 */
function fieldHtml(key: FieldKey, resolved: ResolvedDocument | undefined): string {
  const dataField = escapeAttr(key);
  if (isPageFieldKey(key)) {
    const kind = key === "page.number" ? "number" : "total";
    return `<span class="doc-field doc-field-page" data-field="${dataField}" data-page-field="${kind}"></span>`;
  }
  if (!resolved) {
    return `<span class="doc-field doc-field-unresolved" data-field="${dataField}">${escapeHtml(unresolvedFieldMarker(key))}</span>`;
  }
  const resolution = resolveField(resolved.document, key);
  if (resolution.status === "resolved" && resolution.kind === "image") {
    // Defense in depth: the src came from the allow-listed sanitizer.
    return `<img class="doc-field doc-field-logo" data-field="${dataField}" src="${escapeAttr(resolution.src)}" alt="${escapeAttr(fieldDefinition(key)?.label ?? "Laboratory logo")}" />`;
  }
  if (resolution.status === "resolved" && resolution.kind === "text") {
    return `<span class="doc-field doc-field-resolved" data-field="${dataField}">${escapeHtml(resolution.text)}</span>`;
  }
  const reason = resolution.status === "unresolved" ? resolution.reason : "unresolved field";
  return `<span class="doc-field doc-field-unresolved" data-field="${dataField}" title="${escapeAttr(reason)}">${escapeHtml(unresolvedFieldMarker(key))}</span>`;
}

/**
 * Render one body cross-reference (M6 — V1-REF-002/003).
 *
 *  - a RESOLVED reference renders the target's CURRENT derived label (never a
 *    copied number), wrapped in a distinguishable span carrying the target id
 *    and kind;
 *  - a BROKEN reference renders a visible marker with an actionable reason in
 *    `title`, never a blank or a stale label (AGENTS.md §46).
 *
 * `data-reference` is used instead of `data-ref` because paged.js itself owns
 * `data-ref` for split-fragment tracking; keeping them distinct avoids any
 * interference with pagination (see node_modules/pagedjs).
 */
function referenceHtml(node: ReferenceNode, resolved?: ResolvedDocument): string {
  const dataRef = escapeAttr(node.ref);
  const dataKind = escapeAttr(node.refKind);
  const base = `class="doc-ref" data-reference="${dataRef}" data-reference-kind="${dataKind}"`;
  if (!resolved) {
    return `<span ${base} data-broken="true" title="reference unresolved">${escapeHtml(missingReferenceMarker(node.refKind))}</span>`;
  }
  const resolution = resolveReference(resolved.numbering, node);
  if (resolution.status === "resolved") {
    return `<span ${base}>${escapeHtml(resolution.label)}</span>`;
  }
  return `<span ${base} data-broken="true" title="${escapeAttr(resolution.reason)}">${escapeHtml(missingReferenceMarker(node.refKind))}</span>`;
}

export function inlineHtml(inlines: Inline[], resolved?: ResolvedDocument): string {
  return inlines
    .map((run) => {
      if (isFieldNode(run)) return fieldHtml(run.field, resolved);
      if (isReferenceNode(run)) return referenceHtml(run, resolved);
      let html = escapeHtml(run.text);
      for (const mark of run.marks) {
        switch (mark.type) {
          case "bold":
            html = `<strong>${html}</strong>`;
            break;
          case "italic":
            html = `<em>${html}</em>`;
            break;
          case "code":
            html = `<code>${html}</code>`;
            break;
          case "link": {
            // Untrusted document link: only allow-listed schemes reach the DOM.
            const href = sanitizeHref(mark.href);
            if (href !== null) {
              html = `<a href="${escapeAttr(href)}" rel="noopener noreferrer">${html}</a>`;
            }
            break;
          }
          case "underline":
            html = `<u>${html}</u>`;
            break;
          case "strike":
            html = `<s>${html}</s>`;
            break;
          case "superscript":
            html = `<sup>${html}</sup>`;
            break;
          case "subscript":
            html = `<sub>${html}</sub>`;
            break;
          case "textCase":
            html = `<span data-text-case="${escapeAttr(mark.transform)}">${html}</span>`;
            break;
          case "fontFamily":
            html = `<span data-font-family="${escapeAttr(mark.fontFamily)}">${html}</span>`;
            break;
          case "fontSize": {
            // Re-validate at the render boundary (defense in depth): a
            // bypassed schema value renders PLAIN, never as CSS injection.
            if (fontSizePtProblem(mark.fontSizePt) === null) {
              html = `<span style="font-size:${mark.fontSizePt}pt">${html}</span>`;
            }
            break;
          }
          case "color": {
            if (isValidHexColor(mark.color)) {
              html = `<span style="color:${escapeAttr(mark.color)}">${html}</span>`;
            }
            break;
          }
          case "highlight": {
            if (isValidHexColor(mark.color)) {
              html = `<span style="background-color:${escapeAttr(mark.color)}">${html}</span>`;
            }
            break;
          }
        }
      }
      return html;
    })
    .join("");
}

/**
 * Inline style declarations for a block's per-block paragraph overrides
 * (V1-FMT-002). Only overrides that survive re-validation at the render
 * boundary are emitted; anything invalid is treated as inherit (deterministic,
 * never silent CSS injection). Field order is fixed so output is stable.
 * Emitted after a class-derived margin when both exist, the override wins
 * (inline style precedence) — the documented override model.
 */
export function paragraphFormatStyle(format: ParagraphFormatOverride | undefined): string {
  if (!format) return "";
  const declarations: string[] = [];
  const { alignment, lineSpacing, spaceBeforeMm, spaceAfterMm, indentLeftMm } = format;
  if (
    alignment === "left" ||
    alignment === "center" ||
    alignment === "right" ||
    alignment === "justify"
  ) {
    declarations.push(`text-align:${alignment}`);
  }
  if (
    typeof lineSpacing === "number" &&
    Number.isFinite(lineSpacing) &&
    lineSpacing >= LINE_SPACING_MIN &&
    lineSpacing <= LINE_SPACING_MAX
  ) {
    declarations.push(`line-height:${lineSpacing}`);
  }
  if (typeof spaceBeforeMm === "number" && Number.isFinite(spaceBeforeMm) && spaceBeforeMm >= SPACE_MM_MIN && spaceBeforeMm <= SPACE_MM_MAX) {
    declarations.push(`margin-top:${spaceBeforeMm}mm`);
  }
  if (typeof spaceAfterMm === "number" && Number.isFinite(spaceAfterMm) && spaceAfterMm >= SPACE_MM_MIN && spaceAfterMm <= SPACE_MM_MAX) {
    declarations.push(`margin-bottom:${spaceAfterMm}mm`);
  }
  if (typeof indentLeftMm === "number" && Number.isFinite(indentLeftMm) && indentLeftMm >= SPACE_MM_MIN && indentLeftMm <= INDENT_LEFT_MM_MAX) {
    declarations.push(`margin-left:${indentLeftMm}mm`);
  }
  return declarations.join("; ");
}

function captionLabel(
  numbering: Numbering,
  node: { id: string },
  kind: "tables" | "figures",
): string | null {
  const label = numbering[kind][node.id];
  return label ?? null;
}

/* ------------------------------------------------------------ lists (M3) */

/**
 * Render-boundary re-validation (defense in depth, AGENTS.md §61): even a
 * document that bypasses IR validation can only ever emit one of the
 * allow-listed enum values — never arbitrary CSS/markup.
 */
function safeListType(value: unknown): ListType {
  return (LIST_TYPES as readonly unknown[]).includes(value) ? (value as ListType) : "bullet";
}

function safeMarker(value: unknown): BulletMarker {
  return (BULLET_MARKERS as readonly unknown[]).includes(value)
    ? (value as BulletMarker)
    : "disc";
}

/**
 * One canonical list item → `<li>`. A numbered item's derived hierarchical
 * label ("3.1") is emitted inline at the start of its first paragraph; a
 * bullet item relies on the list's CSS marker. Nested items recurse with the
 * SAME list type (the approved one-type-per-tree model).
 */
function listItemHtml(
  item: ListItem,
  listType: ListType,
  marker: BulletMarker,
  resolved: ResolvedDocument,
): string {
  const label = resolved.numbering.lists[item.id];
  const numbered = listType !== "bullet" && label !== undefined;
  const lead = numbered
    ? `<span class="doc-list-marker">${escapeHtml(label)}.</span> `
    : "";
  const paragraphs = item.content
    .map((paragraph, index) => {
      const fmt = paragraphFormatStyle(paragraph.format);
      const styleAttr = fmt ? ` style="${fmt}"` : "";
      const prefix = index === 0 ? lead : "";
      return `<p id="${escapeAttr(paragraph.id)}" class="doc-list-para doc-paragraph${styleClassName(resolved, paragraph)}"${styleAttr}>${prefix}${inlineHtml(paragraph.content, resolved)}</p>`;
    })
    .join("");
  const children = item.children.length
    ? listHtml(listType, marker, 1, item.children, resolved)
    : "";
  return `<li id="${escapeAttr(item.id)}" class="doc-list-item">${paragraphs}${children}</li>`;
}

/** A canonical list (or a nested level) → semantic `<ol>`/`<ul>`. */
function listHtml(
  listType: ListType,
  marker: BulletMarker,
  start: number,
  items: ListItem[],
  resolved: ResolvedDocument,
  id?: string,
): string {
  if (items.length === 0) return "";
  const isBullet = listType === "bullet";
  const tag = isBullet ? "ul" : "ol";
  const classes = isBullet ? "doc-list doc-list-bullet" : "doc-list doc-list-ordered";
  const idAttr = id ? ` id="${escapeAttr(id)}"` : "";
  const attrs = isBullet
    ? ` data-marker="${marker}"`
    : ` data-numbering="${listType}"${start !== 1 ? ` start="${start}"` : ""}`;
  const body = items
    .map((item) => listItemHtml(item, listType, marker, resolved))
    .join("");
  return `<${tag}${idAttr} class="${classes}"${attrs}>${body}</${tag}>`;
}

/**
 * One block → semantic markup. Exported for the renderer-boundary regression
 * tests (AGENTS.md §54: business/render safety must be testable without a DOM).
 * Re-checks image sources and column widths so that bypassing IR validation
 * cannot reintroduce external resource requests or CSS injection.
 */
export function blockHtml(block: Block, resolved: ResolvedDocument): string {
  const { numbering } = resolved;
  switch (block.type) {
    case "heading": {
      const num = numbering.headings[block.id];
      const numHtml = num ? `<span class="doc-num">${escapeHtml(num)}</span> ` : "";
      const fmt = paragraphFormatStyle(block.format);
      const styleAttr = fmt ? ` style="${fmt}"` : "";
      return `<h${block.level} id="${escapeAttr(block.id)}" class="doc-heading${styleClassName(resolved, block)}"${styleAttr}>${numHtml}${inlineHtml(block.content, resolved)}</h${block.level}>`;
    }
    case "paragraph": {
      const fmt = paragraphFormatStyle(block.format);
      const styleAttr = fmt ? ` style="${fmt}"` : "";
      return `<p id="${escapeAttr(block.id)}" class="doc-paragraph${styleClassName(resolved, block)}"${styleAttr}>${inlineHtml(block.content, resolved)}</p>`;
    }
    case "bulletList":
      if (block.items.length === 0) return "";
      return `<ul id="${escapeAttr(block.id)}" class="doc-list">${block.items
        .map((item) => {
          const fmt = paragraphFormatStyle(item.format);
          const styleAttr = fmt ? ` style="${fmt}"` : "";
          return `<li id="${escapeAttr(item.id)}" class="doc-list-item${styleClassName(resolved, item)}"${styleAttr}>${inlineHtml(item.content, resolved)}</li>`;
        })
        .join("")}</ul>`;
    case "list":
      return listHtml(
        safeListType(block.listType),
        safeMarker(block.marker),
        safeListStart(block.start),
        block.items,
        resolved,
        block.id,
      );
    case "table": {
      const headerRow = block.headerRow;
      const rows = block.rows;
      const headRows = headerRow ? rows.slice(0, 1) : [];
      const bodyRows = headerRow ? rows.slice(1) : rows;
      const label = captionLabel(numbering, block, "tables");
      const captionText =
        block.caption != null && block.caption !== ""
          ? `${label ? `${label} — ` : ""}${escapeHtml(block.caption)}`
          : (label ? escapeHtml(label) : null);
      // Column widths are untrusted CSS candidates: only emit a colgroup when
      // EVERY width is allow-listed (see sanitize.ts) AND the count matches the
      // row width. Any invalid entry drops the whole fixed-layout colgroup, so
      // an untrusted document can never inject extra CSS declarations.
      const cellCount = rows[0]?.cells.length ?? 0;
      const widthsOk =
        block.columnWidths.length > 0 &&
        block.columnWidths.length === cellCount &&
        block.columnWidths.every((w) => isValidColumnWidth(w));
      const hasWidths =
        widthsOk && block.columnWidths.some((w) => w.trim() !== "");
      const colgroup = hasWidths
        ? `<colgroup>${block.columnWidths
            .filter((w) => w.trim() !== "")
            .map((w) => `<col style="width:${escapeAttr(w.trim())}" />`)
            .join("")}</colgroup>`
        : "";
      const rowHtml = (row: (typeof rows)[number], tag: "th" | "td") =>
        `<tr id="${escapeAttr(row.id)}">${row.cells
          .map(
            (cell) =>
              `<${tag} id="${escapeAttr(cell.id)}">${cell.content
                .map((p) => {
                  const fmt = paragraphFormatStyle(p.format);
                  // `margin:0` keeps cell paragraphs tight; override
                  // declarations (alignment/space/indent) come after so the
                  // per-block override still wins for that aspect.
                  const margin = fmt ? `margin:0; ${fmt}` : "margin:0";
                  return `<p class="doc-paragraph${styleClassName(resolved, p)}" style="${margin}">${inlineHtml(p.content, resolved)}</p>`;
                })
                .join("")}</${tag}>`,
          )
          .join("")}</tr>`;
      return (
        `<table id="${escapeAttr(block.id)}" class="doc-table${widthsOk ? " fixed-layout" : ""}">` +
        (captionText ? `<caption class="doc-caption">${captionText}</caption>` : "") +
        colgroup +
        (headRows.length
          ? `<thead>${headRows.map((r) => rowHtml(r, "th")).join("")}</thead>`
          : "") +
        `<tbody>${bodyRows.map((r) => rowHtml(r, "td")).join("")}</tbody>` +
        `</table>`
      );
    }
    case "image": {
      const label = captionLabel(numbering, block, "figures");
      const hasCaption = block.caption != null && block.caption !== "";
      const captionText = hasCaption
        ? `${label ? `${label} — ` : ""}${escapeHtml(block.caption!)}`
        : label
          ? escapeHtml(label)
          : null;
      const widthStyle = block.widthMm ? ` style="width:${block.widthMm}mm"` : "";
      // Defense in depth: even if a document bypassed IR validation, an image
      // source that is not an allow-listed embedded data URI is never emitted.
      // Rendering nothing for it avoids any external resource request while
      // surfacing the omission instead of silently dropping the figure.
      const safeSrc = sanitizeImageSrc(block.src);
      const imgHtml =
        safeSrc !== null
          ? `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(block.alt)}"${widthStyle} />`
          : `<p class="doc-image-invalid">Image not rendered: unsupported or oversized image source.</p>`;
      return (
        `<figure class="doc-figure" id="${escapeAttr(block.id)}">` +
        imgHtml +
        (captionText ? `<figcaption class="doc-caption">${captionText}</figcaption>` : "") +
        `</figure>`
      );
    }
    case "pageBreak":
      return `<div id="${escapeAttr(block.id)}" class="doc-page-break"></div>`;
    case "equation": {
      const rendered = renderMath(block.latex, block.display);
      const num = numbering.equations[block.id];
      const numHtml = num
        ? `<span class="doc-equation-number">${escapeHtml(num)}</span>`
        : "";
      return `<div id="${escapeAttr(block.id)}" class="doc-equation${block.display ? " display" : " inline"}">${rendered}${numHtml}</div>`;
    }
    case "horizontalRule":
      return `<hr id="${escapeAttr(block.id)}" class="doc-hr" />`;
    default: {
      const never: never = block;
      throw new Error(`unreachable block: ${JSON.stringify(never)}`);
    }
  }
}

function sectionHtml(section: Section, resolved: ResolvedDocument): string {
  const name = section.id;
  const first = section.blocks[0];
  const counterReset =
    section.pageSetup.pageNumberStart !== 1 && first
      ? ` data-counter-page-reset="${section.pageSetup.pageNumberStart}"`
      : "";
  const blocks = section.blocks.map((b) => blockHtml(b, resolved)).join("\n");
  return (
    `<section id="${escapeAttr(section.id)}" class="doc-section doc-section-${name}"` +
    ` data-section="${escapeAttr(section.id)}"${counterReset}>\n${blocks}\n</section>`
  );
}

export function buildBody(resolved: ResolvedDocument): string {
  return resolved.document.sections
    .map((section) => sectionHtml(section, resolved))
    .join("\n");
}

/** True when the document contains at least one structured equation. */
export function documentHasEquations(resolved: ResolvedDocument): boolean {
  return resolved.document.sections.some((section) =>
    section.blocks.some((block) => block.type === "equation"),
  );
}

/** True when any BODY paragraph/heading/list/table contains a field reference. */
export function documentHasBodyFields(resolved: ResolvedDocument): boolean {
  return resolved.document.sections.some((section) => {
    let found = false;
    forEachSectionParagraph(section, (paragraph) => {
      if (!found && paragraph.content.some((run) => isFieldNode(run))) found = true;
    });
    return found;
  });
}

/** True when any BODY field reference is a page field (needs materialization). */
export function documentHasPageFields(resolved: ResolvedDocument): boolean {
  return resolved.document.sections.some((section) => {
    let found = false;
    forEachSectionParagraph(section, (paragraph) => {
      if (
        !found &&
        paragraph.content.some((run) => isFieldNode(run) && isPageFieldKey(run.field))
      ) {
        found = true;
      }
    });
    return found;
  });
}

/** True when any BODY paragraph/heading/list/table contains a cross-reference. */
export function documentHasReferences(resolved: ResolvedDocument): boolean {
  return resolved.document.sections.some((section) => {
    let found = false;
    forEachSectionParagraph(section, (paragraph) => {
      if (!found && paragraph.content.some((run) => isReferenceNode(run))) found = true;
    });
    return found;
  });
}

/**
 * The boot scripts: PagedConfig + repeated-thead handler (spike-proven).
 *
 * When `options.pageFields` is set, an additional body page-field materializer
 * is emitted. It is emitted CONDITIONALLY so documents without body page
 * fields produce byte-identical markup to the pre-M5 renderer (golden stability);
 * the extra function would otherwise change every existing golden's HTML.
 */
export function buildScripts(
  pagedJsSrc: string,
  options: { pageFields?: boolean } = {},
): string {
  const pageFieldFunction = options.pageFields
    ? `
      /*
       * Body {{page.number}} / {{page.total}} materialization (M5). Same rule as
       * the margin counters: the resolver emits an EMPTY placeholder and the
       * shared renderer fills it after layout, so preview and PDF agree. The
       * total is the global page count; the number honours section restarts.
       */
      function materializePageFields() {
        var pages = document.querySelectorAll(".pagedjs_page");
        if (!pages.length) return;
        var total = pages.length;
        var currentStart = 1;
        var currentStartOrdinal = 1;
        for (var i = 0; i < pages.length; i++) {
          var page = pages[i];
          var ordinal = i + 1;
          var resetEl = page.querySelector("[data-counter-page-reset]:not([data-split-from])");
          if (resetEl) {
            var parsed = parseInt(resetEl.getAttribute("data-counter-page-reset"), 10);
            currentStart = isFinite(parsed) && parsed >= 1 ? parsed : 1;
            currentStartOrdinal = ordinal;
          }
          var visible = currentStart + (ordinal - currentStartOrdinal);
          var fields = page.querySelectorAll("[data-page-field]");
          for (var f = 0; f < fields.length; f++) {
            var el = fields[f];
            el.textContent =
              el.getAttribute("data-page-field") === "total" ? String(total) : String(visible);
          }
        }
      }
`
    : "";
  const pageFieldCall = options.pageFields ? "\n          materializePageFields();" : "";
  return `<script>
      /*
       * Page-number materialization for pageNumberStart (per-section restarts).
       *
       * Paged.js 0.4.3 emits [data-counter-page-reset] as a CSS
       * "counter-reset: page N" rule during layout. On a fresh load Chromium
       * honours it at first paint, but the app's live preview swaps iframe
       * srcdoc documents — and in that path the reset does NOT change the
       * painted margin-box ::after digits (verified empirically; Chromium does
       * not reliably repaint CSS content changes on a painted ::after, and a
       * bare-number literal like content: "Page " 5 ... is invalid CSS and is
       * dropped by the parser). The shared renderer therefore replaces any
       * counter-based margin content with a REAL text node per page once
       * layout is complete. DOM text always repaints and prints verbatim.
       * Runs for preview and PDF export alike (both consume this same HTML).
       */
      function materializePageNumbers() {
        var pages = document.querySelectorAll(".pagedjs_page");
        if (!pages.length) return;
        // No restarts → CSS counters already paint correct ordinals.
        if (!document.querySelector("[data-counter-page-reset]")) return;
        var total = pages.length;
        var currentStart = 1;
        var currentStartOrdinal = 1;
        for (var i = 0; i < pages.length; i++) {
          var page = pages[i];
          var ordinal = i + 1;
          var resetEl = page.querySelector("[data-counter-page-reset]:not([data-split-from])");
          if (resetEl) {
            var parsed = parseInt(resetEl.getAttribute("data-counter-page-reset"), 10);
            currentStart = isFinite(parsed) && parsed >= 1 ? parsed : 1;
            currentStartOrdinal = ordinal;
          }
          var visible = currentStart + (ordinal - currentStartOrdinal);
          var boxes = page.querySelectorAll(".pagedjs_pagebox .pagedjs_margin");
          for (var b = 0; b < boxes.length; b++) {
            var box = boxes[b];
            var mc = box.querySelector(".pagedjs_margin-content");
            if (!mc) continue;
            var raw = getComputedStyle(mc, "::after").content;
            if (raw.indexOf("counter(page)") === -1 && raw.indexOf("counter(pages)") === -1) continue;
            // Resolve the serialized content (e.g. "Page " counter(page) " of "
            // counter(pages)) into display text: unquote string tokens and
            // substitute the counters with the per-page value + global total.
            var text = raw
              .replace(/counter\\(page\\)/g, "%%PAGE%%")
              .replace(/counter\\(pages\\)/g, "%%TOTAL%%")
              .replace(/"([^"]*)"/g, "$1")
              .replace(/\\s+/g, " ")
              .replace(/%%PAGE%%/g, String(visible))
              .replace(/%%TOTAL%%/g, String(total));
            var div = document.createElement("div");
            div.setAttribute("data-pp", "1");
            div.textContent = text;
            box.replaceChild(div, mc);
          }
        }
      }
${pageFieldFunction}
      window.PagedConfig = {
        auto: true,
        after: function () {
          materializePageNumbers();${pageFieldCall}
          window.__layoutDone = true;
          window.dispatchEvent(new Event("layout-done"));
        }
      };
    </script>
    <script src="${escapeAttr(pagedJsSrc)}"></script>
    <script>
      // paged.js 0.4.3 gap (spike gap 2): continuation pages lose <thead>.
      // Handler re-inserts a cloned header row and re-runs overflow detection
      // so the header height participates in pagination (evidence: spike).
      (function () {
        function repeatTheads(root) {
          if (!root || !root.querySelectorAll) return 0;
          var inserted = 0;
          var tables = root.querySelectorAll("table");
          for (var i = 0; i < tables.length; i++) {
            var t = tables[i];
            if (t.dataset.headerRepeated === "true") continue;
            if (t.querySelector("thead")) { t.dataset.headerRepeated = "true"; continue; }
            if (!t.querySelector("tr")) continue;
            var src = t.dataset.splitFrom;
            if (!src) { t.dataset.headerRepeated = "true"; continue; }
            var thead = null;
            var candidates = document.querySelectorAll('table[data-ref="' + CSS.escape(src) + '"]');
            for (var j = 0; j < candidates.length; j++) {
              var th = candidates[j].querySelector("thead");
              if (th) { thead = th; break; }
            }
            if (!thead) continue;
            var clone = thead.cloneNode(true);
            clone.setAttribute("data-repeated-header", "true");
            t.insertBefore(clone, t.firstElementChild);
            t.dataset.headerRepeated = "true";
            inserted++;
          }
          return inserted;
        }
        if (!window.Paged || !Paged.Handler) return;
        class TableHeaderRepeater extends Paged.Handler {
          onOverflow(overflow, rendered, bounds, layout) {
            const inserted = repeatTheads(rendered);
            if (overflow || inserted) return layout.findOverflow(rendered, bounds);
            return undefined;
          }
          afterPageLayout(pageEl) {
            repeatTheads(pageEl);
          }
        }
        Paged.registerHandlers(TableHeaderRepeater);
      })();
    </script>`;
}
