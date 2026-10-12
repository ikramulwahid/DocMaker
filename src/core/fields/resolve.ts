/**
 * Shared dynamic-field resolution (M5 — V1-FIELD-001/002/003).
 *
 * A single resolver serves the body renderer, the header/footer margin
 * renderer and the pre-export validator. It reads the canonical document
 * (`metadata`, `laboratoryProfile`) — never editor state — so preview and PDF
 * always agree. Page fields are DEFERRED: they can only be resolved after
 * Paged.js pagination, so they are never reported unresolved pre-pagination.
 */
import type { Document } from "../ir/schema";
import { sanitizeImageSrc } from "../ir/sanitize";
import { fieldDefinition, isPageFieldKey, type FieldKey } from "./keys";

export interface ResolvedFieldText {
  key: FieldKey;
  status: "resolved";
  kind: "text";
  text: string;
}

export interface ResolvedFieldImage {
  key: FieldKey;
  status: "resolved";
  kind: "image";
  src: string;
}

export interface UnresolvedFieldValue {
  key: FieldKey;
  status: "unresolved";
  kind: "text" | "image";
  reason: string;
}

/** Page fields resolve after pagination (see `materializePageFields`). */
export interface DeferredFieldValue {
  key: FieldKey;
  status: "deferred";
  kind: "page";
}

export type FieldResolution =
  | ResolvedFieldText
  | ResolvedFieldImage
  | UnresolvedFieldValue
  | DeferredFieldValue;

function propertyOf(document: Document, key: FieldKey): unknown {
  const def = fieldDefinition(key);
  if (!def || !def.property) return undefined;
  if (def.source === "document") {
    return (document.metadata as unknown as Record<string, unknown>)[def.property];
  }
  return (document.laboratoryProfile as unknown as Record<string, unknown>)[def.property];
}

/**
 * Resolve one field key against the document.
 *
 *  - empty/missing text (or an unset/invalid logo) is UNRESOLVED — a missing
 *    value never silently renders as blank (V1-FIELD-004);
 *  - `laboratory.logo` re-checks the image allow-list at the render boundary
 *    (defense in depth — a bypassed schema cannot emit an external `src`).
 */
export function resolveField(document: Document, key: FieldKey): FieldResolution {
  if (isPageFieldKey(key)) {
    return { key, status: "deferred", kind: "page" };
  }
  const def = fieldDefinition(key);
  if (!def) {
    return { key, status: "unresolved", kind: "text", reason: `unknown field "${key}"` };
  }
  const raw = propertyOf(document, key);
  if (def.image) {
    const src = typeof raw === "string" ? sanitizeImageSrc(raw) : null;
    if (src === null) {
      return { key, status: "unresolved", kind: "image", reason: `${def.label} is not set` };
    }
    return { key, status: "resolved", kind: "image", src };
  }
  const text = typeof raw === "string" ? raw : "";
  if (text.trim() === "") {
    return { key, status: "unresolved", kind: "text", reason: `${def.label} is empty` };
  }
  return { key, status: "resolved", kind: "text", text };
}

/** Resolved text for a text field, or `null` when unresolved/deferred/image. */
export function resolveFieldText(document: Document, key: FieldKey): string | null {
  const resolution = resolveField(document, key);
  return resolution.status === "resolved" && resolution.kind === "text"
    ? resolution.text
    : null;
}

/** Resolved image src for an image field, or `null` when unresolved. */
export function resolveFieldImage(document: Document, key: FieldKey): string | null {
  const resolution = resolveField(document, key);
  return resolution.status === "resolved" && resolution.kind === "image"
    ? resolution.src
    : null;
}
