/**
 * Semantic block walkers (M5). Pure structural traversal shared by the field
 * collector and the layout field detection so both agree on where inline
 * content lives (paragraphs, headings, list items, table cells) without either
 * re-implementing the block tree.
 */
import type { Block, Heading, ListItem, Paragraph, Section } from "./schema";

/**
 * A block that carries inline runs directly. Paragraphs and headings share this
 * shape (id + content + format), so content walkers can visit either without
 * caring which it is.
 */
export type InlineHost = Paragraph | Heading;

/** Visit every paragraph-like inline container in a block, recursively. */
export function forEachParagraphInBlock(
  block: Block,
  visit: (paragraph: InlineHost, blockId: string) => void,
): void {
  switch (block.type) {
    case "paragraph":
    case "heading":
      visit(block, block.id);
      return;
    case "bulletList":
      for (const item of block.items) visit(item, block.id);
      return;
    case "list": {
      const walk = (items: ListItem[]): void => {
        for (const item of items) {
          for (const paragraph of item.content) visit(paragraph, block.id);
          walk(item.children);
        }
      };
      walk(block.items);
      return;
    }
    case "table":
      for (const row of block.rows) {
        for (const cell of row.cells) {
          for (const paragraph of cell.content) visit(paragraph, block.id);
        }
      }
      return;
    default:
      // image / equation / pageBreak / horizontalRule carry no inline content.
      return;
  }
}

/** Visit every paragraph-like inline container in a section, in order. */
export function forEachSectionParagraph(
  section: Section,
  visit: (paragraph: InlineHost, blockId: string) => void,
): void {
  for (const block of section.blocks) forEachParagraphInBlock(block, visit);
}
