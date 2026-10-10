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
import { renderMath } from "@/core/equation";

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

/**
 * Structured equation node (LaTeX source). The editor shows the KaTeX render;
 * clicking it offers to edit the LaTeX. The IR stores only the source, never
 * the rendered markup or an image (V1-EQ-003).
 */
export const Equation = Node.create({
  name: "equation",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      id: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-ir-id") ?? "",
        renderHTML: (attributes: { id?: string }) =>
          attributes.id ? { "data-ir-id": attributes.id } : {},
      },
      latex: { default: "" },
      display: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="equation"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "equation", class: "ir-equation" }),
    ];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.className = `ir-equation${node.attrs.display ? " display" : " inline"}`;
      dom.setAttribute("data-type", "equation");
      dom.setAttribute("data-ir-id", String(node.attrs.id ?? ""));
      dom.setAttribute("contenteditable", "false");
      const paint = (latex: string, display: boolean) => {
        dom.innerHTML = renderMath(latex, display);
      };
      paint(String(node.attrs.latex ?? ""), node.attrs.display !== false);
      dom.addEventListener("click", () => {
        const current = String(node.attrs.latex ?? "");
        const next = window.prompt("Edit equation (LaTeX source)", current);
        if (next === null) return;
        const trimmed = next.trim();
        if (trimmed === "" || typeof getPos !== "function") return;
        const pos = getPos();
        if (typeof pos !== "number") return;
        const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          latex: trimmed,
        });
        editor.view.dispatch(tr);
      });
      return { dom };
    };
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
 * Adds the IR `id` attribute to every block-ish node type and the IR `style`
 * reference to text blocks. `keepOnSplit` keeps id/style identity when a
 * block splits, and row/cell identity when tables split. The DOM attribute is
 * `data-ir-style` (an attribute literally named `style` would be emitted as
 * inline CSS by Tiptap); the editor JSON attribute is `style`.
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
      {
        // Reusable style reference (V1-STYLE-002) on text blocks only.
        types: ["paragraph", "heading"],
        attributes: {
          style: {
            default: null,
            keepOnSplit: true,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-ir-style") ?? null,
            renderHTML: (attributes: { style?: string | null }) =>
              attributes.style ? { "data-ir-style": attributes.style } : {},
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
    Equation,
  ];
}
