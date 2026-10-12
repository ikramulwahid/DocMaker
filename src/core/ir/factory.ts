/**
 * Factory helpers — deterministic constructors for the Document IR.
 * All documents start from A4 defaults (ADR-001).
 */
import { newId } from "./ids";
import { buildDefaultStyles } from "./styles";
import type { FieldKey } from "../fields/keys";
import {
  EMPTY_PARAGRAPH_FORMAT,
  type Block,
  type BulletMarker,
  type Document,
  type Equation,
  type FieldNode,
  type Heading,
  type Image,
  type Inline,
  type List,
  type ListItem,
  type ListType,
  type Mark,
  type MarginBox,
  type Paragraph,
  type Section,
  type Table,
} from "./schema";

export function text(value: string, marks: Mark[] = []): Inline {
  return { text: value, marks };
}

/** Canonical inline dynamic field reference (M5). */
export function field(key: FieldKey): FieldNode {
  return { field: key };
}

/**
 * The base style for a paragraph block (V1-DOC-002 base-style default).
 * Not a table cell/list item context in itself — those derive from
 * `createParagraph` and inherit this base reference.
 */
export const BASE_PARAGRAPH_STYLE = "normal";

/** The derived built-in style for a semantic heading level. */
export function headingStyleId(level: number): string {
  return `heading-${Math.min(6, Math.max(1, Math.round(level)))}`;
}

export function createParagraph(
  content: Inline[] = [],
  style: string | null = BASE_PARAGRAPH_STYLE,
): Paragraph {
  return { id: newId("pg"), type: "paragraph", content, style, format: EMPTY_PARAGRAPH_FORMAT };
}

export function createHeading(
  level: number,
  content: Inline[] = [],
  style: string | null = headingStyleId(level),
): Heading {
  return { id: newId("hd"), type: "heading", level, content, style, format: EMPTY_PARAGRAPH_FORMAT };
}

/**
 * Canonical list item (M3): one inheritance paragraph plus empty children.
 * Content is paragraphs only (schema invariant), and the paragraph carries the
 * standard style/format defaults so it resolves exactly like body text.
 */
export function createListItem(content: Inline[] = []): ListItem {
  return { id: newId("li"), content: [createParagraph(content)], children: [] };
}

/**
 * Canonical recursive list (M3). Defaults to a disc bullet list; a numbered
 * list carries `marker: null` (a stray bullet glyph on a numbered list is
 * rejected by the schema). `start` is the first ordinal (numbered lists).
 */
export function createList(
  opts: {
    listType?: ListType;
    marker?: BulletMarker | null;
    start?: number;
    items?: ListItem[];
  } = {},
): List {
  const listType = opts.listType ?? "bullet";
  return {
    id: newId("bl"),
    type: "list",
    listType,
    marker: listType === "bullet" ? (opts.marker ?? "disc") : null,
    start: opts.start ?? 1,
    items: opts.items ?? [],
  };
}

export function createImage(
  src: string,
  opts: { alt?: string; widthMm?: number | null; caption?: string | null } = {},
): Image {
  return {
    id: newId("im"),
    type: "image",
    src,
    alt: opts.alt ?? "",
    widthMm: opts.widthMm ?? null,
    caption: opts.caption ?? null,
  };
}

export function createTable(
  rows: string[][],
  opts: { caption?: string | null; headerRow?: boolean; columnWidths?: string[] } = {},
): Table {
  return {
    id: newId("tb"),
    type: "table",
    caption: opts.caption ?? null,
    headerRow: opts.headerRow ?? true,
    columnWidths: opts.columnWidths ?? [],
    rows: rows.map((cells) => ({
      id: newId("tr"),
      type: "tableRow" as const,
      cells: cells.map((cell) => ({
        id: newId("tc"),
        type: "tableCell" as const,
        content: [createParagraph(cell === "" ? [] : [text(cell)])],
      })),
    })),
  };
}

/** Structured equation block (LaTeX source, rendered by KaTeX at layout). */
export function createEquation(latex: string, display = true): Equation {
  return { id: newId("eq"), type: "equation", latex, display };
}

/** Default footer: "Page X of Y" driven by margin-box fields. */
export function createDefaultFooter(): MarginBox {
  return {
    parts: [
      { kind: "text", value: "Page " },
      { kind: "field", field: "pageNumber" },
      { kind: "text", value: " of " },
      { kind: "field", field: "pageCount" },
    ],
  };
}

export function createSection(blocks: Block[] = []): Section {
  return {
    id: newId("sec"),
    type: "section",
    pageSetup: {
      format: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 18, bottom: 20, left: 18 },
      widthMm: null,
      heightMm: null,
      pageNumberStart: 1,
      showPageNumber: true,
    },
    header: null,
    footer: createDefaultFooter(),
    blocks,
  };
}

export function createEmptyDocument(title = ""): Document {
  return {
    id: newId("doc"),
    type: "document",
    metadata: {
      title,
      docNumber: "",
      revision: "",
      effectiveDate: "",
      author: "",
      organization: "",
      description: "",
      documentType: "",
      department: "",
      reviewDate: "",
      status: "",
      preparedBy: "",
      reviewedBy: "",
      approvedBy: "",
      classification: "",
    },
    laboratoryProfile: {
      name: "",
      address: "",
      logo: null,
    },
    settings: {
      theme: "lab_default",
      watermark: {
        enabled: true,
        text: "DRAFT",
        opacity: 0.12,
        angle: -45,
        fontSizePt: 64,
      },
    },
    // New documents start from the full built-in style library (V1-DOC-002
    // base-style default); blocks reference these styles by id.
    styles: buildDefaultStyles(),
    sections: [createSection([createParagraph()])],
  };
}
