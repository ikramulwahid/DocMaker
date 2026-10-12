/**
 * Dynamic field key registry (M5 — V1-FIELD-001..004).
 *
 * ONE typed, allow-listed set of field keys. Every consumer — the editor field
 * picker, the body/margin resolver, the layout renderer and the pre-export
 * validator — reads THIS registry, so a field name can never drift between the
 * editor, the resolver, the header/footer renderer and export validation.
 *
 * A field key is a semantic reference to a canonical document/laboratory
 * property. The Document IR stores the KEY, never a copied value: changing the
 * metadata updates every occurrence (V1-META-003).
 */
import type { MarginField } from "../ir/schema";

/**
 * The complete allow-list of field keys. Ordered by `source` for the picker:
 * document metadata, then laboratory profile, then page fields.
 */
export const FIELD_KEYS = [
  "document.number",
  "document.title",
  "document.revision",
  "document.effective_date",
  "document.review_date",
  "document.status",
  "document.type",
  "document.department",
  "document.prepared_by",
  "document.reviewed_by",
  "document.approved_by",
  "document.classification",
  "document.author",
  "document.organization",
  "laboratory.name",
  "laboratory.address",
  "laboratory.logo",
  "page.number",
  "page.total",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

/** Source of a field's value (drives resolution and grouping). */
export type FieldSource = "document" | "laboratory" | "page";

export interface FieldDefinition {
  key: FieldKey;
  /** Human label shown in the field picker. */
  label: string;
  source: FieldSource;
  /**
   * Canonical `metadata`/`laboratoryProfile` property this field resolves to.
   * Absent for page fields (resolved after pagination).
   */
  property?: string;
  /** True when the field renders an embedded image instead of text. */
  image?: boolean;
}

export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  { key: "document.number", label: "Document number", source: "document", property: "docNumber" },
  { key: "document.title", label: "Title", source: "document", property: "title" },
  { key: "document.revision", label: "Revision", source: "document", property: "revision" },
  { key: "document.effective_date", label: "Effective date", source: "document", property: "effectiveDate" },
  { key: "document.review_date", label: "Review date", source: "document", property: "reviewDate" },
  { key: "document.status", label: "Status", source: "document", property: "status" },
  { key: "document.type", label: "Document type", source: "document", property: "documentType" },
  { key: "document.department", label: "Department", source: "document", property: "department" },
  { key: "document.prepared_by", label: "Prepared by", source: "document", property: "preparedBy" },
  { key: "document.reviewed_by", label: "Reviewed by", source: "document", property: "reviewedBy" },
  { key: "document.approved_by", label: "Approved by", source: "document", property: "approvedBy" },
  { key: "document.classification", label: "Classification", source: "document", property: "classification" },
  { key: "document.author", label: "Author", source: "document", property: "author" },
  { key: "document.organization", label: "Organization", source: "document", property: "organization" },
  { key: "laboratory.name", label: "Laboratory name", source: "laboratory", property: "name" },
  { key: "laboratory.address", label: "Laboratory address", source: "laboratory", property: "address" },
  { key: "laboratory.logo", label: "Laboratory logo", source: "laboratory", property: "logo", image: true },
  { key: "page.number", label: "Page number", source: "page" },
  { key: "page.total", label: "Total pages", source: "page" },
];

const BY_KEY: ReadonlyMap<string, FieldDefinition> = new Map(
  FIELD_DEFINITIONS.map((def) => [def.key, def]),
);

/** True for a string that is one of the allow-listed field keys. */
export function isFieldKey(value: unknown): value is FieldKey {
  return typeof value === "string" && BY_KEY.has(value);
}

/** The definition for a field key, or `undefined` when unknown. */
export function fieldDefinition(key: string): FieldDefinition | undefined {
  return BY_KEY.get(key);
}

/** Field definitions for a source, in registry order (picker groups). */
export function fieldDefinitionsBySource(source: FieldSource): FieldDefinition[] {
  return FIELD_DEFINITIONS.filter((def) => def.source === source);
}

/** Page fields are resolved after pagination by the layout script. */
export function isPageFieldKey(key: FieldKey): boolean {
  return BY_KEY.get(key)?.source === "page";
}

/* ------------------------------------------- margin-box field keys (HF-003) */

/**
 * Map an existing header/footer margin field token to its canonical field key.
 * The margin-box token vocabulary predates the body `{{...}}` keys; this map is
 * the single bridge between them so both render through one resolver.
 */
export const MARGIN_FIELD_TO_KEY: Record<MarginField, FieldKey> = {
  pageNumber: "page.number",
  pageCount: "page.total",
  title: "document.title",
  docNumber: "document.number",
  revision: "document.revision",
  effectiveDate: "document.effective_date",
  reviewDate: "document.review_date",
  status: "document.status",
  laboratoryName: "laboratory.name",
};

export function marginFieldKey(field: MarginField): FieldKey {
  return MARGIN_FIELD_TO_KEY[field];
}

/** Legacy header/footer token aliases accepted when parsing margin text. */
export const MARGIN_TOKEN_ALIASES: Record<string, MarginField> = {
  page: "pageNumber",
  count: "pageCount",
};

/**
 * The stable, human-readable marker rendered for an unresolved field so the
 * preview distinguishes an empty source from a resolved value (V1-FIELD-004).
 * Kept free of HTML/CSS-significant characters; escaping still runs on it.
 */
export function unresolvedFieldMarker(key: FieldKey): string {
  return `⟦${key}⟧`;
}
