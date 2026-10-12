/**
 * Tiptap extension set for DocMaker.
 *
 * The IR is the source of truth (AGENTS.md): extensions here are configured
 * so the editor CANNOT produce constructs the IR cannot represent (no
 * blockquote, no code blocks, no hard breaks) and every block node carries the
 * IR `id` through a global attribute, so identity survives editing sessions.
 * M2 adds the IR character marks (underline, strike, superscript, subscript,
 * textCase, fontFamily, fontSize, color, highlight) and the per-block `format`
 * override attribute. M3 adds the canonical bullet/ordered list attributes
 * (bullet `marker`, ordered `numbering` + native `start`).
 */
import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageBase from "@tiptap/extension-image";
import { Table as TableBase } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { renderMath } from "@/core/equation";
import { isValidHexColor } from "@/core/ir/sanitize";
import { fieldDefinition, isFieldKey } from "@/core/fields";

/* ------------------------------------------------------------ marks (M2) */

/**
 * M2 character marks (V1-FMT-001). Each stores a STRUCTURED value in the IR
 * (see schema.ts markSchema) and renders it in the editor. Values are
 * re-validated at the adapter boundary and again at the render boundary
 * (defense in depth): anything invalid renders plain.
 */

/** Underline — richer than StarterKit's bare strikethrough family. */
export const Underline = Mark.create({
  name: "underline",
  parseHTML() {
    return [{ tag: "u" }, { tag: "ins" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    return { "Mod-u": () => this.editor.commands.toggleMark("underline") };
  },
});

/** Superscript; excludes subscript so a run can never hold both. */
export const Superscript = Mark.create({
  name: "superscript",
  excludes: "subscript",
  parseHTML() {
    return [{ tag: "sup" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Subscript; excludes superscript so a run can never hold both. */
export const Subscript = Mark.create({
  name: "subscript",
  excludes: "superscript",
  parseHTML() {
    return [{ tag: "sub" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Character-level uppercase/lowercase (V1-FMT-003 feasible subset). */
export const TextCase = Mark.create({
  name: "textCase",
  addAttributes() {
    return {
      transform: {
        default: "uppercase",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-text-case") ?? "uppercase",
        renderHTML: (attributes: { transform?: string | null }) =>
          attributes.transform ? { "data-text-case": attributes.transform } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-text-case]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Semantic font-family choice — editor visuals come from CSS class rules. */
export const FontFamilyMark = Mark.create({
  name: "fontFamily",
  addAttributes() {
    return {
      fontFamily: {
        default: "serif",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-font-family") ?? "serif",
        renderHTML: (attributes: { fontFamily?: string | null }) =>
          attributes.fontFamily ? { "data-font-family": attributes.fontFamily } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-font-family]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Font size in pt — a validated bounded number emitted as `font-size:Npt`. */
export const FontSizeMark = Mark.create({
  name: "fontSize",
  addAttributes() {
    return {
      fontSizePt: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-font-size-pt");
          if (raw === null) return null;
          const n = Number(raw);
          return Number.isFinite(n) && n > 0 ? n : null;
        },
        renderHTML: (attributes: { fontSizePt?: number | null }) =>
          attributes.fontSizePt != null
            ? { "data-font-size-pt": String(attributes.fontSizePt), style: `font-size:${attributes.fontSizePt}pt` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-font-size-pt]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Text colour — validated hex, emitted as inline `color`. */
export const ColorMark = Mark.create({
  name: "color",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-color");
          return raw !== null && isValidHexColor(raw) ? raw : null;
        },
        renderHTML: (attributes: { color?: string | null }) =>
          attributes.color && isValidHexColor(attributes.color)
            ? { "data-color": attributes.color, style: `color:${attributes.color}` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

/** Highlight — validated hex, emitted as inline `background-color`. */
export const HighlightMark = Mark.create({
  name: "highlight",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-highlight");
          return raw !== null && isValidHexColor(raw) ? raw : null;
        },
        renderHTML: (attributes: { color?: string | null }) =>
          attributes.color && isValidHexColor(attributes.color)
            ? { "data-highlight": attributes.color, style: `background-color:${attributes.color}` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-highlight]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

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

/**
 * Inline dynamic-field chip (M5 — V1-FIELD-001). An atom node carrying only
 * the allow-listed field KEY; it shows a visible chip in the editor and maps
 * 1:1 to an IR field reference through the adapter. The resolved value is
 * NEVER stored here, so editing metadata updates every occurrence (V1-META-003).
 */
export const FieldRef = Node.create({
  name: "fieldRef",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      field: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-field-ref") ?? "",
        renderHTML: (attributes: { field?: string }) =>
          attributes.field ? { "data-field-ref": attributes.field } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-field-ref]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const field = String((HTMLAttributes as { field?: unknown }).field ?? "");
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "ir-field-ref" }),
      `{{${field}}}`,
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      const key = String(node.attrs.field ?? "");
      const known = isFieldKey(key);
      dom.className = "ir-field-chip";
      dom.setAttribute("data-field-ref", key);
      dom.setAttribute("contenteditable", "false");
      dom.textContent = known ? `{{${key}}}` : "{{unknown field}}";
      dom.title = known ? (fieldDefinition(key)?.label ?? key) : "Unknown field";
      return { dom };
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
          "orderedList",
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
      {
        // Per-block paragraph overrides (V1-FMT-002, M2) on text blocks only.
        // The value travels in the ProseMirror node attrs (editor.getJSON()),
        // never in the emitted DOM: renderHTML suppresses it to keep the page
        // markup clean (the IR `style` attr uses the same approach; `format`
        // would also be an invalid plain-HTML attribute value as an object).
        types: ["paragraph", "heading"],
        attributes: {
          format: {
            default: null,
            keepOnSplit: true,
            parseHTML: (element: HTMLElement) => {
              const raw = element.getAttribute("data-ir-format");
              if (!raw) return null;
              try {
                const parsed: unknown = JSON.parse(raw);
                return typeof parsed === "object" && parsed !== null ? parsed : null;
              } catch {
                return null;
              }
            },
            renderHTML: () => ({}),
          },
        },
      },
      {
        // List presentation attributes (M3, V1-LIST-001/002). The bullet glyph
        // and the numbering style travel in the node attrs (editor.getJSON())
        // as validated enum values only; `start` is Tiptap's native
        // ordered-list attribute. The adapter re-validates every value on the
        // way back, so a stale/foreign attr can never reach the IR unchecked.
        types: ["bulletList"],
        attributes: {
          marker: {
            default: "disc",
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-marker") ?? "disc",
            renderHTML: (attributes: { marker?: string }) =>
              attributes.marker ? { "data-marker": attributes.marker } : {},
          },
        },
      },
      {
        types: ["orderedList"],
        attributes: {
          numbering: {
            default: "decimal",
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-numbering") ?? "decimal",
            renderHTML: (attributes: { numbering?: string }) =>
              attributes.numbering ? { "data-numbering": attributes.numbering } : {},
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
      blockquote: false,
      codeBlock: false,
      hardBreak: false,
      // Lists (bullet + ordered + listItem) ARE representable (M3) and now
      // enabled; configured via the global attributes above.
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Link.configure({ openOnClick: false, autolink: false }),
    Underline,
    Superscript,
    Subscript,
    TextCase,
    FontFamilyMark,
    FontSizeMark,
    ColorMark,
    HighlightMark,
    Image,
    FieldRef,
    Table.configure({ resizable: false, allowTableNodeSelection: true }),
    TableRow,
    TableCell,
    TableHeader,
    PageBreak,
    Equation,
  ];
}
