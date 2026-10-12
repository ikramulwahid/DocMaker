/**
 * Unresolved dynamic fields (M5 — V1-FIELD-004).
 *
 * A single shared walker collects every field reference in a document whose
 * value is genuinely missing, with its location (section/body/header/footer and
 * block), so the UI can surface an actionable list and both export paths can
 * refuse to produce a final PDF while unresolved fields remain.
 *
 * Deliberate rules:
 *  - an UNUSED empty metadata property is NOT an error;
 *  - a field that is USED but whose source is empty IS unresolved;
 *  - page fields are DEFERRED (resolved post-pagination), never unresolved;
 *  - repeated occurrences are all traced (one entry per occurrence).
 */
import type { Document, Inline } from "../ir/schema";
import { forEachParagraphInBlock } from "../ir/walk";
import { FIELD_KEYS, fieldDefinition, marginFieldKey, type FieldKey } from "./keys";
import { resolveField } from "./resolve";

export type FieldLocation = "body" | "header" | "footer";

export interface UnresolvedFieldOccurrence {
  key: FieldKey;
  /** Human label (picker label; falls back to the key). */
  label: string;
  reason: string;
  sectionIndex: number;
  sectionId: string;
  location: FieldLocation;
  /** Present for body occurrences. */
  blockId?: string;
}

export interface UnresolvedFieldReport {
  occurrences: UnresolvedFieldOccurrence[];
  /** Unique keys in registry order. */
  keys: FieldKey[];
}

/** Field references inside one inline run array. */
function fieldKeysOf(inlines: Inline[]): FieldKey[] {
  const out: FieldKey[] = [];
  for (const run of inlines) {
    if ("field" in run) out.push(run.field);
  }
  return out;
}

/**
 * Collect every unresolved field occurrence in a document. Deterministic:
 * sections, then blocks, then inline order; header before footer.
 */
export function collectUnresolvedFields(document: Document): UnresolvedFieldReport {
  const occurrences: UnresolvedFieldOccurrence[] = [];
  const seen = new Set<FieldKey>();

  const record = (
    key: FieldKey,
    reason: string,
    sectionIndex: number,
    sectionId: string,
    location: FieldLocation,
    blockId?: string,
  ): void => {
    occurrences.push({
      key,
      label: fieldDefinition(key)?.label ?? key,
      reason,
      sectionIndex,
      sectionId,
      location,
      ...(blockId ? { blockId } : {}),
    });
    seen.add(key);
  };

  document.sections.forEach((section, sectionIndex) => {
    for (const block of section.blocks) {
      forEachParagraphInBlock(block, (paragraph) => {
        for (const key of fieldKeysOf(paragraph.content)) {
          const resolution = resolveField(document, key);
          if (resolution.status === "unresolved") {
            record(key, resolution.reason, sectionIndex, section.id, "body", block.id);
          }
        }
      });
    }

    const boxes: [typeof section.header, FieldLocation][] = [
      [section.header, "header"],
      [section.footer, "footer"],
    ];
    for (const [box, location] of boxes) {
      if (!box) continue;
      for (const part of box.parts) {
        if (part.kind !== "field") continue;
        const key = marginFieldKey(part.field);
        const resolution = resolveField(document, key);
        if (resolution.status === "unresolved") {
          record(key, resolution.reason, sectionIndex, section.id, location);
        }
      }
    }
  });

  const keys = FIELD_KEYS.filter((key) => seen.has(key));
  return { occurrences, keys };
}

/** Convenience predicate for the export gate and UI badges. */
export function hasUnresolvedFields(document: Document): boolean {
  return collectUnresolvedFields(document).occurrences.length > 0;
}

/** Human-readable, one-line-per-key summary for status/CLI messages. */
export function unresolvedFieldMessages(report: UnresolvedFieldReport): string[] {
  return report.keys.map((key) => {
    const forKey = report.occurrences.filter((occurrence) => occurrence.key === key);
    const where = forKey
      .map((occurrence) => {
        const place =
          occurrence.location === "body"
            ? `body${occurrence.blockId ? ` block ${occurrence.blockId}` : ""}`
            : occurrence.location;
        return `${place} (section ${occurrence.sectionIndex + 1})`;
      })
      .join(", ");
    return `${key} — ${forKey[0]?.reason ?? "unresolved"} [${where}]`;
  });
}
