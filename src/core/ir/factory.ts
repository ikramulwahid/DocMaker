/**
 * Factory helpers — deterministic constructors for the Document IR.
 * All documents start from A4 defaults (ADR-001).
 */
import { newId } from "./ids";
import type {
  Block,
  Document,
  Heading,
  Image,
  Inline,
  MarginBox,
  Paragraph,
  Section,
  Table,
} from "./schema";

export function text(value: string, marks: Inline["marks"] = []): Inline {
  return { text: value, marks };
}

export function createParagraph(content: Inline[] = []): Paragraph {
  return { id: newId("pg"), type: "paragraph", content };
}

export function createHeading(level: number, content: Inline[] = []): Heading {
  return { id: newId("hd"), type: "heading", level, content };
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
    },
    settings: {
      watermark: {
        enabled: true,
        text: "DRAFT",
        opacity: 0.12,
        angle: -45,
        fontSizePt: 64,
      },
    },
    sections: [createSection([createParagraph()])],
  };
}
