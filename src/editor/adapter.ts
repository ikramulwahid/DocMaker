/**
 * Explicit editor adapter (ADR-001 §24): Tiptap JSON ⇄ Document IR.
 *
 * Both directions are pure functions over plain JSON so they are unit-testable
 * without a DOM. Invariants:
 *  - IR node ids survive the round-trip (they ride in Tiptap attrs.id);
 *  - anything the IR cannot represent cannot be produced by the editor
 *    (see extensions.ts), so mapping back never silently drops structure
 *    except the documented Phase-0 flattening of nested lists.
 */
import {
  EMPTY_PARAGRAPH_FORMAT,
  isStyleId,
  type Block,
  type Inline,
  type Mark,
  type Paragraph,
  type ParagraphFormatOverride,
  type Table,
  type TableRow,
  type TableCell,
} from "@/core/ir/schema";
import { isNodeId, newId } from "@/core/ir/ids";
import { fontSizePtProblem, isValidHexColor, sanitizeHref } from "@/core/ir/sanitize";
import {
  INDENT_LEFT_MM_MAX,
  LINE_SPACING_MAX,
  LINE_SPACING_MIN,
  SPACE_MM_MAX,
  SPACE_MM_MIN,
} from "@/core/ir/sanitize";

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  /** Optional to accept Tiptap's `JSONContent` (type is optional there). */
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

const PREFIX_BY_TYPE: Record<string, string> = {
  paragraph: "pg",
  heading: "hd",
  bulletList: "bl",
  table: "tb",
  tableRow: "tr",
  tableCell: "tc",
  tableHeader: "tc",
  image: "im",
  equation: "eq",
  horizontalRule: "hr",
  pageBreak: "pb",
};

function idFor(node: TiptapNode): string {
  const raw = node.attrs?.id;
  const prefix = PREFIX_BY_TYPE[node.type ?? ""] ?? "pg";
  if (typeof raw === "string" && isNodeId(raw)) return raw;
  return newId(prefix as never);
}

function textOf(nodes: TiptapNode[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => (n.type === "text" ? (n.text ?? "") : textOf(n.content)))
    .join("");
}

/* ------------------------------------------------------- marks and runs */

function markToIr(mark: TiptapMark): Mark | null {
  switch (mark.type) {
    case "bold":
      return { type: "bold" };
    case "italic":
      return { type: "italic" };
    case "code":
      return { type: "code" };
    case "link": {
      const href = mark.attrs?.href;
      if (typeof href === "string") {
        const safe = sanitizeHref(href);
        if (safe !== null) return { type: "link", href: safe };
      }
      return null;
    }
    case "underline":
      return { type: "underline" };
    case "strike":
      return { type: "strike" };
    case "superscript":
      return { type: "superscript" };
    case "subscript":
      return { type: "subscript" };
    case "textCase": {
      const transform = mark.attrs?.transform;
      if (transform === "uppercase" || transform === "lowercase") {
        return { type: "textCase", transform };
      }
      return null;
    }
    case "fontFamily": {
      const fontFamily = mark.attrs?.fontFamily;
      if (fontFamily === "serif" || fontFamily === "sans" || fontFamily === "mono") {
        return { type: "fontFamily", fontFamily };
      }
      return null;
    }
    case "fontSize": {
      const value = mark.attrs?.fontSizePt;
      if (typeof value === "number" && fontSizePtProblem(value) === null) {
        return { type: "fontSize", fontSizePt: value };
      }
      return null;
    }
    case "color": {
      const color = mark.attrs?.color;
      if (typeof color === "string" && isValidHexColor(color)) {
        return { type: "color", color };
      }
      return null;
    }
    case "highlight": {
      const color = mark.attrs?.color;
      if (typeof color === "string" && isValidHexColor(color)) {
        return { type: "highlight", color };
      }
      return null;
    }
    default:
      // Unknown marks (blink, …) cannot be created by the editor; ignore if
      // a foreign document smuggles one in rather than failing the load.
      return null;
  }
}

/**
 * Run-level exclusivity normalization (sup↔sub, uppercase↔lowercase):
 * a foreign/toolbar document could theoretically carry both in one run —
 * the editor extension `excludes` already prevents it, and the schema
 * REJECTS it; this keep-first rule guarantees the editor pipeline never
 * hands an invalid run to the store in the first place (deterministic).
 */
function normalizeRunMarks(marks: Mark[]): Mark[] {
  const out: Mark[] = [];
  const kept = new Set<string>();
  for (const mark of marks) {
    const family =
      mark.type === "superscript" || mark.type === "subscript"
        ? "vertical-align"
        : mark.type === "textCase"
          ? "textCase"
          : null;
    if (family !== null) {
      if (kept.has(family)) continue; // conflicting second mark in the run
      kept.add(family);
    }
    out.push(mark);
  }
  return out;
}

function runToTiptap(run: Inline): TiptapNode {
  return {
    type: "text",
    text: run.text,
    ...(run.marks.length
      ? {
          marks: run.marks.map((m) => {
            switch (m.type) {
              case "link":
                return { type: "link", attrs: { href: m.href } };
              case "textCase":
                return { type: "textCase", attrs: { transform: m.transform } };
              case "fontFamily":
                return { type: "fontFamily", attrs: { fontFamily: m.fontFamily } };
              case "fontSize":
                return { type: "fontSize", attrs: { fontSizePt: m.fontSizePt } };
              case "color":
                return { type: "color", attrs: { color: m.color } };
              case "highlight":
                return { type: "highlight", attrs: { color: m.color } };
              default:
                return { type: m.type };
            }
          }),
        }
      : {}),
  };
}

function runsFromTiptap(nodes: TiptapNode[] | undefined): Inline[] {
  if (!nodes) return [];
  const runs: Inline[] = [];
  for (const node of nodes) {
    if (node.type !== "text") continue; // hardBreak etc. cannot exist
    const marks: Mark[] = [];
    for (const mark of node.marks ?? []) {
      const ir = markToIr(mark);
      if (ir) marks.push(ir);
    }
    runs.push({ text: node.text ?? "", marks: normalizeRunMarks(marks) });
  }
  return runs;
}

/* ------------------------------------------------------------ IR → tiptap */

/** Style id from an IR block — `null` when the block has no explicit style. */
function styleToTiptap(style: string | null | undefined): string | null {
  return style ?? null;
}

function paragraphToTiptap(paragraph: Paragraph): TiptapNode {
  return {
    type: "paragraph",
    attrs: { id: paragraph.id, style: styleToTiptap(paragraph.style), format: paragraph.format },
    ...(paragraph.content.length ? { content: paragraph.content.map(runToTiptap) } : {}),
  };
}

function cellToTiptap(
  cell: TableCell,
  colwidth: number | null,
): TiptapNode {
  return {
    type: "tableCell",
    attrs: {
      id: cell.id,
      colspan: 1,
      rowspan: 1,
      colwidth: colwidth === null ? null : [colwidth],
    },
    content: cell.content.map(paragraphToTiptap),
  };
}

function headerCellToTiptap(cell: TableCell, colwidth: number | null): TiptapNode {
  return { ...cellToTiptap(cell, colwidth), type: "tableHeader" };
}

function parsePx(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match ? Number(match[1]) : null;
}

function tableToTiptap(table: Table): TiptapNode {
  const widths = table.columnWidths.map(parsePx);
  const rows: TiptapNode[] = table.rows.map((row, rowIndex) => {
    const isHeader = table.headerRow && rowIndex === 0;
    return {
      type: "tableRow",
      attrs: { id: row.id },
      content: row.cells.map((cell, colIndex) => {
        const w = widths[colIndex] ?? null;
        return isHeader
          ? headerCellToTiptap(cell, w)
          : cellToTiptap(cell, w);
      }),
    };
  });
  return {
    type: "table",
    attrs: { id: table.id, caption: table.caption, columnWidths: table.columnWidths },
    content: rows,
  };
}

function blockToTiptap(block: Block): TiptapNode {
  switch (block.type) {
    case "paragraph":
      return paragraphToTiptap(block);
    case "heading":
      return {
        type: "heading",
        attrs: { id: block.id, level: block.level, style: styleToTiptap(block.style), format: block.format },
        ...(block.content.length ? { content: block.content.map(runToTiptap) } : {}),
      };
    case "bulletList":
      return {
        type: "bulletList",
        attrs: { id: block.id },
        content: block.items.map((item) => ({
          type: "listItem",
          content: [paragraphToTiptap(item)],
        })),
      };
    case "table":
      return tableToTiptap(block);
    case "image":
      return {
        type: "image",
        attrs: {
          id: block.id,
          src: block.src,
          alt: block.alt,
          title: null,
          widthMm: block.widthMm,
          caption: block.caption,
        },
      };
    case "pageBreak":
      return { type: "pageBreak", attrs: { id: block.id } };
    case "equation":
      return {
        type: "equation",
        attrs: { id: block.id, latex: block.latex, display: block.display },
      };
    case "horizontalRule":
      return { type: "horizontalRule", attrs: { id: block.id } };
    default: {
      const never: never = block;
      throw new Error(`unreachable block: ${JSON.stringify(never)}`);
    }
  }
}

/** IR blocks → Tiptap editor JSON (`editor.setContent` accepts this). */
export function blocksToTiptapDoc(blocks: Block[]): TiptapNode {
  return {
    type: "doc",
    content: blocks.length ? blocks.map(blockToTiptap) : [{ type: "paragraph" }],
  };
}

/* ------------------------------------------------------- tiptap → IR */

/**
 * Style id from Tiptap attrs. Tiptap/foreign documents are untrusted data:
 * only a valid style id is accepted; anything else resolves to `null` (the
 * derived built-in default) rather than failing the load — the schema would
 * reject an invalid id on save otherwise.
 */
function styleFromTiptap(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  return isStyleId(value) ? value : null;
}

/**
 * Paragraph-format override from untrusted Tiptap/foreign attributes.
 * Each known field is re-validated against the documented bounds; invalid
 * values normalize to `null` (= inherit), so nothing invalid ever reaches
 * the IR and the editor pipeline is deterministic. Unknown fields are
 * dropped (they are not part of the IR).
 */
function formatFromTiptap(value: unknown): ParagraphFormatOverride {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const out: ParagraphFormatOverride = {
    alignment: null,
    lineSpacing: null,
    spaceBeforeMm: null,
    spaceAfterMm: null,
    indentLeftMm: null,
  };
  if (
    raw.alignment === "left" ||
    raw.alignment === "center" ||
    raw.alignment === "right" ||
    raw.alignment === "justify"
  ) {
    out.alignment = raw.alignment;
  }
  {
    const v = raw.lineSpacing;
    if (
      typeof v === "number" &&
      Number.isFinite(v) &&
      v >= LINE_SPACING_MIN &&
      v <= LINE_SPACING_MAX
    ) {
      out.lineSpacing = v;
    }
  }
  for (const key of ["spaceBeforeMm", "spaceAfterMm"] as const) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= SPACE_MM_MIN && v <= SPACE_MM_MAX) {
      out[key] = v;
    }
  }
  {
    const v = raw.indentLeftMm;
    if (typeof v === "number" && Number.isFinite(v) && v >= SPACE_MM_MIN && v <= INDENT_LEFT_MM_MAX) {
      out.indentLeftMm = v;
    }
  }
  return out;
}

function paragraphFromTiptap(node: TiptapNode): Paragraph {
  return {
    id: idFor(node),
    type: "paragraph",
    content: runsFromTiptap(node.content),
    style: styleFromTiptap(node.attrs?.style),
    format: formatFromTiptap(node.attrs?.format),
  };
}

/** Cells hold paragraphs in the IR: non-paragraph blocks collapse to text. */
function cellContentFromTiptap(nodes: TiptapNode[] | undefined): Paragraph[] {
  if (!nodes) return [];
  const out: Paragraph[] = [];
  for (const node of nodes) {
    if (node.type === "paragraph") {
      out.push(paragraphFromTiptap(node));
    } else {
      // Documented Phase-0 limitation: exotic cell content collapses.
      const textValue = textOf([node]).trim();
      if (textValue) {
        out.push({ id: newId("pg"), type: "paragraph", content: [{ text: textValue, marks: [] }], style: null, format: EMPTY_PARAGRAPH_FORMAT });
      }
    }
  }
  return out.length ? out : [{ id: newId("pg"), type: "paragraph", content: [], style: null, format: EMPTY_PARAGRAPH_FORMAT }];
}

function tableFromTiptap(node: TiptapNode): Table {
  const rows: TableRow[] = [];
  let headerRow = false;
  const rowNodes = node.content ?? [];
  rowNodes.forEach((rowNode, rowIndex) => {
    const cellNodes = (rowNode.content ?? []).filter(
      (c) => c.type === "tableCell" || c.type === "tableHeader",
    );
    if (rowIndex === 0) {
      headerRow =
        cellNodes.length > 0 && cellNodes.every((c) => c.type === "tableHeader");
    }
    const cells: TableCell[] = cellNodes.map((cellNode) => ({
      id: idFor(cellNode),
      type: "tableCell",
      content: cellContentFromTiptap(cellNode.content),
    }));
    if (cells.length) {
      rows.push({ id: idFor(rowNode), type: "tableRow", cells });
    }
  });

  // Column widths ride on first-row cell colwidth attrs (px only).
  const firstCells = (rowNodes[0]?.content ?? []).filter(
    (c) => c.type === "tableCell" || c.type === "tableHeader",
  );
  const columnWidths = firstCells.map((cell) => {
    const colwidth = cell.attrs?.colwidth;
    if (Array.isArray(colwidth) && typeof colwidth[0] === "number") {
      return `${colwidth[0]}px`;
    }
    return "";
  });

  return {
    id: idFor(node),
    type: "table",
    caption: typeof node.attrs?.caption === "string" ? node.attrs.caption : null,
    headerRow,
    columnWidths: Array.isArray(node.attrs?.columnWidths)
      ? (node.attrs.columnWidths as unknown[]).filter(
          (w): w is string => typeof w === "string",
        )
      : columnWidths,
    rows: rows.length ? rows : [{ id: newId("tr"), type: "tableRow", cells: [emptyCell()] }],
  };
}

function emptyCell(): TableCell {
  return { id: newId("tc"), type: "tableCell", content: [{ id: newId("pg"), type: "paragraph", content: [], style: null, format: EMPTY_PARAGRAPH_FORMAT }] };
}

/** Nested lists flatten (documented limitation): depth-first, paragraphs only. */
function listItemsFromTiptap(nodes: TiptapNode[] | undefined): Paragraph[] {
  const items: Paragraph[] = [];
  const walk = (listNodes: TiptapNode[] | undefined) => {
    for (const node of listNodes ?? []) {
      if (node.type === "paragraph") items.push(paragraphFromTiptap(node));
      else if (
        node.type === "listItem" ||
        node.type === "bulletList" ||
        node.type === "orderedList"
      )
        walk(node.content);
      // anything else inside a list item: skipped (cannot be produced)
    }
  };
  for (const node of nodes ?? []) {
    if (node.type === "listItem") walk(node.content);
  }
  return items;
}

function blockFromTiptap(node: TiptapNode): Block | null {
  switch (node.type) {
    case "paragraph":
      return paragraphFromTiptap(node);
    case "heading": {
      const raw = typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      return {
        id: idFor(node),
        type: "heading",
        level: Math.min(6, Math.max(1, Math.round(raw))),
        content: runsFromTiptap(node.content),
        style: styleFromTiptap(node.attrs?.style),
        format: formatFromTiptap(node.attrs?.format),
      };
    }
    case "bulletList":
      return {
        id: idFor(node),
        type: "bulletList",
        items: listItemsFromTiptap(node.content),
      };
    case "table":
      return tableFromTiptap(node);
    case "image": {
      const attrs = node.attrs ?? {};
      const src = typeof attrs.src === "string" ? attrs.src : "";
      if (!src) return null; // an image without a source cannot exist in the IR
      return {
        id: idFor(node),
        type: "image",
        src,
        alt: typeof attrs.alt === "string" ? attrs.alt : "",
        widthMm: typeof attrs.widthMm === "number" ? attrs.widthMm : null,
        caption: typeof attrs.caption === "string" ? attrs.caption : null,
      };
    }
    case "pageBreak":
      return { id: idFor(node), type: "pageBreak" };
    case "equation": {
      const attrs = node.attrs ?? {};
      const latex = typeof attrs.latex === "string" ? attrs.latex : "";
      // An equation with no LaTeX source cannot exist in the IR.
      if (latex.trim() === "") return null;
      return {
        id: idFor(node),
        type: "equation",
        latex,
        display: attrs.display !== false,
      };
    }
    case "horizontalRule":
      return { id: idFor(node), type: "horizontalRule" };
    default:
      console.warn(`adapter: skipping unsupported node type "${node.type}"`);
      return null;
  }
}

/** Tiptap editor JSON (`editor.getJSON()`) → IR blocks. */
export function tiptapDocToBlocks(doc: TiptapNode): Block[] {
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return [];
  const blocks: Block[] = [];
  for (const node of doc.content) {
    const block = blockFromTiptap(node);
    if (block) blocks.push(block);
  }
  return blocks;
}
