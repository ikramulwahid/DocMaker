/**
 * Legacy-list normalization (M3, PHASE-1-plan §7).
 *
 * Converts the Phase-0 flat `bulletList` block to the canonical recursive
 * `list` block. Pure and deterministic: the block id and every item
 * paragraph id/content/marks are preserved, and each new item id is DERIVED
 * from its paragraph id (`pg_abcdef12` → `li_abcdef12`) so opening the same
 * old document twice yields the same canonical ids. Only the new structural
 * fields are added (`listType`, `marker`, `start`, `children`), so an old
 * document opened and saved with no text edit converges on the canonical
 * shape with no content loss. The legacy schema stays loadable.
 */
import { newId } from "./ids";
import type { Block, Document, List, ListItem, NodeId } from "./schema";

/** `pg_abcdef12` → `abcdef12` (tolerates an already-suffixed or odd id). */
function idSuffix(id: string): string {
  return id.replace(/^[a-z]{2,3}_/, "");
}

/** All node ids in the document, so a derived id never collides. */
function collectIds(document: Document): Set<string> {
  const ids = new Set<string>();
  const addListItems = (items: ListItem[]) => {
    for (const item of items) {
      ids.add(item.id);
      for (const paragraph of item.content) ids.add(paragraph.id);
      addListItems(item.children);
    }
  };
  for (const section of document.sections) {
    ids.add(section.id);
    for (const block of section.blocks) {
      ids.add(block.id);
      if (block.type === "paragraph" || block.type === "heading") {
        // no nested ids
      } else if (block.type === "bulletList") {
        for (const item of block.items) ids.add(item.id);
      } else if (block.type === "list") {
        addListItems(block.items);
      } else if (block.type === "table") {
        for (const row of block.rows) {
          ids.add(row.id);
          for (const cell of row.cells) {
            ids.add(cell.id);
            for (const paragraph of cell.content) ids.add(paragraph.id);
          }
        }
      }
    }
  }
  return ids;
}

function convertBulletList(
  block: Extract<Block, { type: "bulletList" }>,
  used: Set<string>,
): List {
  const items = block.items.map((paragraph): ListItem => {
    const suffix = idSuffix(paragraph.id);
    let itemId: NodeId = `li_${suffix}`;
    // Deterministic in the common case; a rare suffix collision falls back to
    // a fresh id so two items can never share an id.
    if (!/^[a-z]{2,3}_[a-z0-9]{6,24}$/.test(itemId) || used.has(itemId)) {
      itemId = newId("li");
    }
    used.add(itemId);
    return { id: itemId, content: [paragraph], children: [] };
  });
  return {
    id: block.id,
    type: "list",
    listType: "bullet",
    marker: "disc",
    start: 1,
    items,
  };
}

/**
 * Single-block conversion (used by the editor adapter). Deterministic item ids
 * derived from each paragraph id; no cross-block collision tracking — legacy
 * documents contain no `li_` ids, so a derived id is unique in practice.
 */
export function bulletListToCanonical(block: Extract<Block, { type: "bulletList" }>): List {
  return convertBulletList(block, new Set<string>());
}

/**
 * Returns a document whose legacy `bulletList` blocks are canonical `list`s.
 * Returns the SAME document object when nothing needed normalizing, so callers
 * can cheaply detect a no-op.
 */
export function normalizeLegacyLists(document: Document): Document {
  let changed = false;
  const used = collectIds(document);
  const sections = document.sections.map((section) => {
    let sectionChanged = false;
    const blocks = section.blocks.map((block) => {
      if (block.type !== "bulletList") return block;
      sectionChanged = true;
      changed = true;
      return convertBulletList(block, used);
    });
    return sectionChanged ? { ...section, blocks } : section;
  });
  return changed ? { ...document, sections } : document;
}

/** Convenience: does this document still contain a legacy flat list? */
export function hasLegacyLists(document: Document): boolean {
  return document.sections.some((section) =>
    section.blocks.some((block) => block.type === "bulletList"),
  );
}
