/**
 * Layout HTML — blocks → semantic markup for the pagination engine.
 * Pure string building; no DOM, no editor state (node-testable).
 */
import type { Block, Inline, Section } from "../ir/schema";
import type { ResolvedDocument } from "../resolve";
import type { Numbering } from "../numbering";

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
          case "link":
            html = `<a href="${escapeAttr(mark.href)}">${html}</a>`;
            break;
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

/** The boot scripts: PagedConfig + repeated-thead handler (spike-proven). */
export function buildScripts(pagedJsSrc: string): string {
  return `<script>
      window.PagedConfig = {
        auto: true,
        after: function () {
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
