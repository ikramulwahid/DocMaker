/**
 * Cross-references (M6 — V1-REF-001/002/003).
 *
 * A reference is a semantic pointer to another node's STABLE id; its visible
 * label is derived from the authoritative numbering engine at resolve time.
 * Nothing here copies a number into the IR (AGENTS.md §11/§12), so inserting,
 * deleting or reordering the target updates every reference (V1-REF-003).
 *
 * One shared resolver serves the layout renderer, the editor picker and the
 * pre-export validator, so preview and PDF always agree. A target that is
 * missing, deleted or of the wrong kind is reported as BROKEN — never silently
 * rendered as an empty or stale label (AGENTS.md §46).
 *
 * Imports only `ir/schema`, `numbering` and `ir/walk` at runtime (plus the
 * `ResolvedDocument` type), so there is no runtime cycle with `resolve`.
 */
import {
  REFERENCE_KINDS,
  isReferenceNode,
  type Block,
  type Document,
  type Inline,
  type NodeId,
  type ReferenceKind,
  type ReferenceNode,
} from "../ir/schema";
import { forEachParagraphInBlock } from "../ir/walk";
import { deriveNumbering, type Numbering } from "../numbering";
import type { ResolvedDocument } from "../resolve";

/** A selectable cross-reference target with its derived label + detail text. */
export interface ReferenceTarget {
  id: NodeId;
  kind: ReferenceKind;
  /** Derived visible label, e.g. `"1.2"`, `"Table 3"`, `"Equation 2"`. */
  label: string;
  /** Human-readable detail (heading text / caption / LaTeX) for the picker. */
  detail: string;
}

/** The resolved or broken outcome of a reference. */
export type ReferenceResolution =
  | { status: "resolved"; label: string }
  | { status: "broken"; reason: string };

/** The derived-label map that backs one reference kind. */
function labelMap(numbering: Numbering, kind: ReferenceKind): Record<NodeId, string> {
  switch (kind) {
    case "heading":
      return numbering.headings;
    case "table":
      return numbering.tables;
    case "figure":
      return numbering.figures;
    case "equation":
      return numbering.equations;
  }
}

/**
 * Resolve one reference against the derived numbering: the visible label of the
 * target, or a broken result with an actionable reason that distinguishes a
 * deleted target from a target of a different kind.
 */
export function resolveReference(
  numbering: Numbering,
  node: ReferenceNode,
): ReferenceResolution {
  const label = labelMap(numbering, node.refKind)[node.ref];
  if (label !== undefined) return { status: "resolved", label };
  const actual = REFERENCE_KINDS.find(
    (kind) => kind !== node.refKind && labelMap(numbering, kind)[node.ref] !== undefined,
  );
  if (actual) {
    return {
      status: "broken",
      reason: `reference target ${node.ref} is a ${actual}, not a ${node.refKind}`,
    };
  }
  return {
    status: "broken",
    reason: `reference target ${node.ref} (${node.refKind}) does not exist or was deleted`,
  };
}

/**
 * Visible marker for a broken reference, mirroring `unresolvedFieldMarker`:
 * distinguishable from a copied number and free of HTML-significant characters
 * (escaping still runs on it).
 */
export function missingReferenceMarker(kind: ReferenceKind): string {
  return `⟦missing ${kind}⟧`;
}

/** The label/detail of a reference target managed by `collectReferenceTargets`. */
function targetOfBlock(
  block: Block,
  numbering: Numbering,
): ReferenceTarget | null {
  switch (block.type) {
    case "heading": {
      const label = numbering.headings[block.id];
      if (label === undefined) return null;
      return { id: block.id, kind: "heading", label, detail: inlineText(block.content) };
    }
    case "table": {
      const label = numbering.tables[block.id];
      if (label === undefined) return null;
      return { id: block.id, kind: "table", label, detail: block.caption ?? "" };
    }
    case "image": {
      const label = numbering.figures[block.id];
      if (label === undefined) return null;
      return { id: block.id, kind: "figure", label, detail: block.caption ?? block.alt };
    }
    case "equation": {
      const label = numbering.equations[block.id];
      if (label === undefined) return null;
      return { id: block.id, kind: "equation", label, detail: block.latex };
    }
    default:
      return null;
  }
}

/** Plain text of an inline run array (for a heading's picker detail). */
function inlineText(inlines: Inline[]): string {
  return inlines.map((run) => ("text" in run ? run.text : "")).join("");
}

/**
 * Every numbered object the user can reference, in document order, each with
 * its CURRENT derived label. This is the picker's data source; it never reads
 * stored labels (there are none).
 */
export function collectReferenceTargets(resolved: ResolvedDocument): ReferenceTarget[] {
  const targets: ReferenceTarget[] = [];
  for (const section of resolved.document.sections) {
    for (const block of section.blocks) {
      const target = targetOfBlock(block, resolved.numbering);
      if (target) targets.push(target);
    }
  }
  return targets;
}

export interface BrokenReferenceOccurrence {
  ref: NodeId;
  refKind: ReferenceKind;
  reason: string;
  sectionIndex: number;
  sectionId: string;
  /** Present for body occurrences. */
  blockId?: string;
}

export interface BrokenReferenceReport {
  occurrences: BrokenReferenceOccurrence[];
  /** Unique broken target ids, in first-seen order. */
  refs: NodeId[];
}

/**
 * Collect every broken reference occurrence in a document. Deterministic:
 * sections, then blocks, then inline order. The numbering is derived here so a
 * caller cannot accidentally resolve against stale numbers.
 */
export function collectBrokenReferences(document: Document): BrokenReferenceReport {
  const numbering = deriveNumbering(document);
  const occurrences: BrokenReferenceOccurrence[] = [];
  const refs: NodeId[] = [];
  const seen = new Set<NodeId>();

  for (const [sectionIndex, section] of document.sections.entries()) {
    for (const block of section.blocks) {
      forEachParagraphInBlock(block, (paragraph, blockId) => {
        for (const run of paragraph.content) {
          if (!isReferenceNode(run)) continue;
          const resolution = resolveReference(numbering, run);
          if (resolution.status !== "broken") continue;
          occurrences.push({
            ref: run.ref,
            refKind: run.refKind,
            reason: resolution.reason,
            sectionIndex,
            sectionId: section.id,
            blockId,
          });
          if (!seen.has(run.ref)) {
            seen.add(run.ref);
            refs.push(run.ref);
          }
        }
      });
    }
  }

  return { occurrences, refs };
}

/** Convenience predicate for the export gate and UI badges. */
export function hasBrokenReferences(document: Document): boolean {
  return collectBrokenReferences(document).occurrences.length > 0;
}

/** Human-readable, one-line-per-target summary for status/CLI messages. */
export function referenceMessages(report: BrokenReferenceReport): string[] {
  return report.refs.map((ref) => {
    const forRef = report.occurrences.filter((occurrence) => occurrence.ref === ref);
    const where = forRef
      .map(
        (occurrence) =>
          `section ${occurrence.sectionIndex + 1}${occurrence.blockId ? ` block ${occurrence.blockId}` : ""}`,
      )
      .join(", ");
    return `${forRef[0]?.refKind ?? "reference"} ${ref} — ${forRef[0]?.reason ?? "broken"} [${where}]`;
  });
}
