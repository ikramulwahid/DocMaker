/**
 * Layout HTML — blocks → semantic markup for the pagination engine.
 * Pure string building; no DOM, no editor state (node-testable).
 */
import type { Block, Inline, Section } from "../ir/schema";
import type { ResolvedDocument } from "../resolve";
import type { Numbering } from "../numbering";
import { sanitizeHref } from "../ir/sanitize";
import { renderMath } from "../equation";

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

export function inlineHtml(inlines: Inline[]): string {
  return inlines
    .map((run) => {
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
        }
      }
      return html;
    })
    .join("");
}

function captionLabel(
  numbering: Numbering,
  node: { id: string },
  kind: "tables" | "figures",
): string | null {
  const label = numbering[kind][node.id];
  return label ?? null;
}

function blockHtml(block: Block, resolved: ResolvedDocument): string {
  const { numbering } = resolved;
  switch (block.type) {
    case "heading": {
      const num = numbering.headings[block.id];
      const numHtml = num ? `<span class="doc-num">${escapeHtml(num)}</span> ` : "";
      return `<h${block.level} id="${escapeAttr(block.id)}" class="doc-heading">${numHtml}${inlineHtml(block.content)}</h${block.level}>`;
    }
    case "paragraph":
      return `<p id="${escapeAttr(block.id)}" class="doc-paragraph">${inlineHtml(block.content)}</p>`;
    case "bulletList":
      if (block.items.length === 0) return "";
      return `<ul id="${escapeAttr(block.id)}" class="doc-list">${block.items
        .map((item) => `<li id="${escapeAttr(item.id)}">${inlineHtml(item.content)}</li>`)
        .join("")}</ul>`;
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
      const fixed = block.columnWidths.length > 0 && block.columnWidths.length === (rows[0]?.cells.length ?? 0);
      const colgroup = fixed
        ? `<colgroup>${block.columnWidths
            .map((w) => `<col style="width:${escapeAttr(w)}" />`)
            .join("")}</colgroup>`
        : "";
      const rowHtml = (row: (typeof rows)[number], tag: "th" | "td") =>
        `<tr id="${escapeAttr(row.id)}">${row.cells
          .map(
            (cell) =>
              `<${tag} id="${escapeAttr(cell.id)}">${cell.content
                .map((p) => `<p class="doc-paragraph" style="margin:0">${inlineHtml(p.content)}</p>`)
                .join("")}</${tag}>`,
          )
          .join("")}</tr>`;
      return (
        `<table id="${escapeAttr(block.id)}" class="doc-table${fixed ? " fixed-layout" : ""}">` +
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
      return (
        `<figure class="doc-figure" id="${escapeAttr(block.id)}">` +
        `<img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}"${widthStyle} />` +
        (captionText ? `<figcaption class="doc-caption">${captionText}</figcaption>` : "") +
        `</figure>`
      );
    }
    case "pageBreak":
      return `<div id="${escapeAttr(block.id)}" class="doc-page-break"></div>`;
    case "equation": {
      const rendered = renderMath(block.latex, block.display);
      return `<div id="${escapeAttr(block.id)}" class="doc-equation${block.display ? " display" : " inline"}">${rendered}</div>`;
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

/** The boot scripts: PagedConfig + repeated-thead handler (spike-proven). */
export function buildScripts(pagedJsSrc: string): string {
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

      window.PagedConfig = {
        auto: true,
        after: function () {
          materializePageNumbers();
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
