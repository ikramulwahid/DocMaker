/**
 * Resolve: validated IR + derived, non-stored facts (numbering, styles).
 * The layout layer consumes ONLY a ResolvedDocument — never raw editor state.
 *
 * Style resolution (V1-STYLE-001..004):
 *  - every paragraph/heading has an EFFECTIVE style id: the block's explicit
 *    reference, or the derived built-in default (paragraph → "normal",
 *    heading level N → "heading-N");
 *  - an unknown/missing reference falls back to the derived default
 *    (documented safe fallback — never silent data loss, AGENTS.md §46);
 *  - `resolved.styles` is the union of all definitions needed to render the
 *    document (stored definitions + fallback built-ins), keyed by id.
 */
import {
  documentSchema,
  type Block,
  type Document,
  type NodeId,
  type StyleDefinition,
  type Styles,
} from "../ir/schema";
import { deriveNumbering, type Numbering } from "../numbering";
import { buildDefaultStyles, defaultFallbackStyle } from "../ir/styles";

export type { Numbering } from "../numbering";
export type { StyleDefinition, Styles } from "../ir/schema";

export interface ResolvedDocument {
  document: Document;
  numbering: Numbering;
  /** Effective style definitions that render needs, keyed by style id. */
  styles: Styles;
}

export interface ResolvedStyle {
  id: string;
  definition: StyleDefinition;
  /** True when the block had no explicit reference; the built-in default applied. */
  derived: boolean;
}

/** The derived default style id for a text block without an explicit style. */
export function defaultStyleIdForBlock(block: Block): string | null {
  switch (block.type) {
    case "paragraph":
      return "normal";
    case "heading":
      return `heading-${Math.min(6, Math.max(1, Math.round(block.level)))}`;
    default:
      return null;
  }
}

const DEFAULT_LIBRARY: Styles = buildDefaultStyles();

/** Definition for a style id: the document's own, else the built-in default. */
export function resolveStyleDefinition(
  document: Document,
  id: string,
): StyleDefinition {
  if (Object.prototype.hasOwnProperty.call(document.styles, id)) {
    return document.styles[id] as StyleDefinition;
  }
  if (Object.prototype.hasOwnProperty.call(DEFAULT_LIBRARY, id)) {
    return DEFAULT_LIBRARY[id] as StyleDefinition;
  }
  // A reference to a deleted/unknown style: deterministic fallback so the
  // document still renders (documented — see docs/limitations.md).
  return defaultFallbackStyle();
}

/**
 * Effective style of a paragraph/heading block. Other block types have no
 * style (return null). `derived` distinguishes explicit vs default mappings
 * so tests and the UI can prove V1-STYLE-002 assignment semantics.
 */
export function effectiveStyleOf(
  document: Document,
  block: Block,
): ResolvedStyle | null {
  if (block.type !== "paragraph" && block.type !== "heading") return null;
  const derivedId = defaultStyleIdForBlock(block);
  const id = block.style ?? derivedId ?? "normal";
  const definition = resolveStyleDefinition(document, id);
  return { id, definition, derived: block.style == null };
}

/**
 * The complete set of definitions the layout engine must emit CSS for:
 * every style stored in the document plus every effective style id referenced
 * by blocks (so unknown references still render deterministically).
 */
export function resolveStyles(document: Document): Styles {
  const out: Styles = {};
  for (const [id, def] of Object.entries(document.styles)) {
    out[id] = def;
  }
  for (const section of document.sections) {
    for (const block of section.blocks) {
      const effective = effectiveStyleOf(document, block);
      if (effective && !Object.prototype.hasOwnProperty.call(out, effective.id)) {
        out[effective.id] = effective.definition;
      }
      if (block.type === "bulletList") {
        for (const item of block.items) {
          const itemStyle = effectiveStyleOf(document, item);
          if (itemStyle && !Object.prototype.hasOwnProperty.call(out, itemStyle.id)) {
            out[itemStyle.id] = itemStyle.definition;
          }
        }
      }
      if (block.type === "table") {
        for (const row of block.rows) {
          for (const cell of row.cells) {
            for (const cellParagraph of cell.content) {
              const cellStyle = effectiveStyleOf(document, cellParagraph);
              if (cellStyle && !Object.prototype.hasOwnProperty.call(out, cellStyle.id)) {
                out[cellStyle.id] = cellStyle.definition;
              }
            }
          }
        }
      }
    }
  }
  return out;
}

/** Accepts unknown input, validates against the IR schema, derives facts. */
export function resolveDocument(input: unknown): ResolvedDocument {
  const document = documentSchema.parse(input);
  return {
    document,
    numbering: deriveNumbering(document),
    styles: resolveStyles(document),
  };
}

export function headingNumber(
  resolved: ResolvedDocument,
  id: NodeId,
): string | undefined {
  return resolved.numbering.headings[id];
}