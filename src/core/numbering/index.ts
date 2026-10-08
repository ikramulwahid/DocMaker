/**
 * Derived numbering — headings, tables, figures.
 *
 * NEVER stored in the IR (AGENTS.md): computed from the document on every
 * resolve, so the same document always yields the same numbers and JSON
 * round-trips cannot lose or corrupt them.
 */
import type { Block, Document, NodeId, Section } from "../ir/schema";

export interface Numbering {
  /** Hierarchical heading numbers, e.g. `"1.2.3"`. */
  headings: Record<NodeId, string>;
  /** e.g. `"Table 1"` — label only; caption text is separate. */
  tables: Record<NodeId, string>;
  /** e.g. `"Figure 1"`. */
  figures: Record<NodeId, string>;
}

function* walkBlocks(blocks: Block[]): Generator<Block> {
  for (const block of blocks) {
    yield block;
    if (block.type === "bulletList") {
      // Flat lists: items are paragraphs (no numbering impact, but yielded
      // so future item-level logic sees them in document order).
      for (const item of block.items) yield item;
    }
  }
}

function* walkSections(doc: Document): Generator<Section> {
  for (const section of doc.sections) {
    yield section;
  }
}

/** Document-order numbering, continuous across sections. Deterministic. */
export function deriveNumbering(doc: Document): Numbering {
  const headings: Record<NodeId, string> = {};
  const tables: Record<NodeId, string> = {};
  const figures: Record<NodeId, string> = {};

  const levelCounters = [0, 0, 0, 0, 0, 0];
  let tableCount = 0;
  let figureCount = 0;

  for (const section of walkSections(doc)) {
    for (const block of walkBlocks(section.blocks)) {
      switch (block.type) {
        case "heading": {
          const idx = block.level - 1;
          levelCounters[idx] += 1;
          for (let i = idx + 1; i < levelCounters.length; i++) levelCounters[i] = 0;
          // e.g. [1,2,0] → "1.2"; leading zeros dropped (a lone h3 → "3").
          const parts = levelCounters.slice(0, block.level);
          const firstNonZero = parts.findIndex((n) => n > 0);
          const visible = firstNonZero === -1 ? parts.slice(-1) : parts.slice(firstNonZero);
          headings[block.id] = visible.join(".");
          break;
        }
        case "table": {
          tableCount += 1;
          tables[block.id] = `Table ${tableCount}`;
          break;
        }
        case "image": {
          figureCount += 1;
          figures[block.id] = `Figure ${figureCount}`;
          break;
        }
        default:
          break;
      }
    }
  }

  return { headings, tables, figures };
}
