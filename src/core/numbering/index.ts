/**
 * Derived numbering — headings, tables, figures, and numbered lists.
 *
 * NEVER stored in the IR (AGENTS.md): computed from the document on every
 * resolve, so the same document always yields the same numbers and JSON
 * round-trips cannot lose or corrupt them. List ordinals are derived per level
 * at resolve time too — editing, reordering or nesting an item recomputes the
 * visible labels instead of relying on any stored value.
 */
import type {
  Block,
  Document,
  List,
  ListItem,
  ListType,
  NodeId,
  Section,
} from "../ir/schema";
import { LIST_START_MAX, safeListStart } from "../ir/sanitize";

export interface Numbering {
  /** Hierarchical heading numbers, e.g. `"1.2.3"`. */
  headings: Record<NodeId, string>;
  /** e.g. `"Table 1"` — label only; caption text is separate. */
  tables: Record<NodeId, string>;
  /** e.g. `"Figure 1"`. */
  figures: Record<NodeId, string>;
  /**
   * Derived visible label for a NUMBERED list item, keyed by item id, e.g.
   * `"3"`, `"3.1"`, `"4.1.1"`, `"iv"` or `"C"`. Bullet-list items have no
   * entry (their glyph is a static marker). Never stored in the IR.
   */
  lists: Record<NodeId, string>;
  /**
   * e.g. `"Equation 1"` for every equation block, keyed by block id. Derived
   * in document order, never stored (AGENTS.md §12). Inline-mode equation
   * blocks are numbered too — the block is a first-class semantic object.
   */
  equations: Record<NodeId, string>;
}

const ALPHA = "abcdefghijklmnopqrstuvwxyz";

/** 1 → `a`, 26 → `z`, 27 → `aa` (spreadsheet-style lettering). */
function toAlpha(n: number): string {
  // Guard the loop: a non-finite counter would never advance toward 0. The
  // loop itself is logarithmic, so a large finite value is already bounded.
  if (!Number.isFinite(n)) return "";
  let out = "";
  let value = Math.floor(n);
  while (value > 0) {
    value -= 1;
    out = ALPHA[value % 26] + out;
    value = Math.floor(value / 26);
  }
  return out;
}

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function toRoman(n: number): string {
  // M3 hardening: `n` is validated ≤ LIST_START_MAX upstream (schema, adapter,
  // numbering boundary), but this subtraction loop repeats by MAGNITUDE, so a
  // malformed value that bypassed validation (huge, non-finite) must never reach
  // it unbounded. Cap to a finite integer at the documented maximum — the
  // largest value the accepted range can produce — which keeps the loop tiny and
  // the label reasonable.
  if (!Number.isFinite(n)) return "";
  let value = Math.min(Math.floor(n), LIST_START_MAX);
  let out = "";
  for (const [amount, symbol] of ROMAN) {
    while (value >= amount) {
      out += symbol;
      value -= amount;
    }
  }
  return out;
}

/** Formats one counter value in the list's numbering style. */
function formatOrdinal(n: number, listType: ListType): string {
  switch (listType) {
    case "decimal":
      return String(n);
    case "lower-alpha":
      return toAlpha(n);
    case "upper-alpha":
      return toAlpha(n).toUpperCase();
    case "lower-roman":
      return toRoman(n).toLowerCase();
    case "upper-roman":
      return toRoman(n);
    case "bullet":
      return String(n); // unreachable — bullets are skipped
  }
}

/**
 * Hierarchical per-level numbering for one canonical list (V1-LIST-002/004).
 * The label of a nested item prefixes its ancestors (`"4.1.1"`); the top level
 * begins at the list's configurable `start` and every nested level at 1.
 */
function numberList(list: List, out: Record<NodeId, string>): void {
  if (list.listType === "bullet") return;
  const counters: number[] = [];
  const walk = (items: ListItem[], depth: number) => {
    const start = depth === 0 ? safeListStart(list.start) : 1;
    let index = 0;
    for (const item of items) {
      index += 1;
      counters[depth] = start + index - 1;
      counters.length = depth + 1; // drop deeper levels for the next sibling
      out[item.id] = counters
        .slice(0, depth + 1)
        .map((n) => formatOrdinal(n, list.listType))
        .join(".");
      if (item.children.length > 0) walk(item.children, depth + 1);
    }
  };
  walk(list.items, 0);
}

function* walkBlocks(blocks: Block[]): Generator<Block> {
  for (const block of blocks) {
    yield block;
    if (block.type === "bulletList") {
      // Legacy flat list: items are paragraphs (no numbering impact, but
      // yielded so future item-level logic sees them in document order).
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
  const lists: Record<NodeId, string> = {};
  const equations: Record<NodeId, string> = {};

  const levelCounters = [0, 0, 0, 0, 0, 0];
  let tableCount = 0;
  let figureCount = 0;
  let equationCount = 0;

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
        case "list": {
          numberList(block, lists);
          break;
        }
        case "equation": {
          equationCount += 1;
          equations[block.id] = `Equation ${equationCount}`;
          break;
        }
        default:
          break;
      }
    }
  }

  return { headings, tables, figures, lists, equations };
}
