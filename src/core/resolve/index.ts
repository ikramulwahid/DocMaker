/**
 * Resolve: validated IR + derived, non-stored facts (numbering).
 * The layout layer consumes ONLY a ResolvedDocument — never raw editor state.
 */
import { documentSchema, type Document, type NodeId } from "../ir/schema";
import { deriveNumbering, type Numbering } from "../numbering";

export type { Numbering } from "../numbering";

export interface ResolvedDocument {
  document: Document;
  numbering: Numbering;
}

/** Accepts unknown input, validates against the IR schema, derives numbering. */
export function resolveDocument(input: unknown): ResolvedDocument {
  const document = documentSchema.parse(input);
  return { document, numbering: deriveNumbering(document) };
}

export function headingNumber(
  resolved: ResolvedDocument,
  id: NodeId,
): string | undefined {
  return resolved.numbering.headings[id];
}
