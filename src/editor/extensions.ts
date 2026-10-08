/**
 * Tiptap extension set for DocMaker.
 *
 * The IR is the source of truth (AGENTS.md): extensions here are configured
 * so the editor CANNOT produce constructs the IR cannot represent (no strike,
 * no blockquote, no code blocks, no ordered lists, no hard breaks) and every
 * block node carries the IR `id` through a global attribute, so identity
 * survives editing sessions.
 */
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageBase from "@tiptap/extension-image";
import { Table as TableBase } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

/** Atom block: explicit page break between sections of content. */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        class: "ir-page-break",
      }),
    ];
  },
});

/** Image with IR-only attrs (caption, physical width in mm). */
export const Image = ImageBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      widthMm: { default: null },
      caption: { default: null },
    };
  },
});

/** Table with IR-only attrs (caption, column widths). */
export const Table = TableBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: null },
      columnWidths: { default: [] },
    };
  },
});

/**
 * Adds the IR `id` attribute to every block-ish node type. `keepOnSplit`
 * keeps row/cell identity when tables split.
 */
export const NodeIds = Extension.create({
  name: "nodeIds",
  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "bulletList",
          "listItem",
          "image",
          "table",
          "tableRow",
          "tableCell",
          "tableHeader",
          "horizontalRule",
          "pageBreak",
        ],
        attributes: {
          id: {
            default: "",
            keepOnSplit: true,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-ir-id") ?? "",
            renderHTML: (attributes: { id?: string }) =>
              attributes.id ? { "data-ir-id": attributes.id } : {},
          },
        },
      },
    ];
  },
});

export function createExtensions(): Extensions {
  return [
    NodeIds,
    StarterKit.configure({
      // Not representable in the IR — disabled so they cannot be created:
      strike: false,
      blockquote: false,
      codeBlock: false,
      hardBreak: false,
      orderedList: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Link.configure({ openOnClick: false, autolink: false }),
    Image,
    Table.configure({ resizable: false, allowTableNodeSelection: true }),
    TableRow,
    TableCell,
    TableHeader,
    PageBreak,
  ];
}
