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
import type { Block, Inline, Mark, Paragraph, Table, TableRow, TableCell } from "@/core/ir/schema";
import { isNodeId, newId } from "@/core/ir/ids";

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
      if (typeof href === "string" && href.length > 0) {
        return { type: "link", href };
      }
      return null;
    }
    default:
      // Strike and friends cannot be created (extensions.ts); ignore if a
      // foreign document smuggles one in rather than failing the load.
      return null;
  }
}

function runToTiptap(run: Inline): TiptapNode {
  return {
    type: "text",
    text: run.text,
    ...(run.marks.length
      ? { marks: run.marks.map((m) => (m.type === "link" ? { type: "link", attrs: { href: m.href } } : { type: m.type })) }
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
    runs.push({ text: node.text ?? "", marks });
  }
  return runs;
}

/* ------------------------------------------------------------ IR → tiptap */

function paragraphToTiptap(paragraph: Paragraph): TiptapNode {
  return {
    type: "paragraph",
    attrs: { id: paragraph.id },
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
        attrs: { id: block.id, level: block.level },
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

function paragraphFromTiptap(node: TiptapNode): Paragraph {
  return { id: idFor(node), type: "paragraph", content: runsFromTiptap(node.content) };
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
        out.push({ id: newId("pg"), type: "paragraph", content: [{ text: textValue, marks: [] }] });
      }
    }
  }
  return out.length ? out : [{ id: newId("pg"), type: "paragraph", content: [] }];
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
  return { id: newId("tc"), type: "tableCell", content: [{ id: newId("pg"), type: "paragraph", content: [] }] };
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
