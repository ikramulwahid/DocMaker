/**
 * Combined document issues (M6). One report over the two "unresolved content"
 * families the export gate and the sidebar care about, so a single walk drives
 * both the UI panel and both PDF-export paths (app + CLI):
 *  - unresolved dynamic fields (M5 — V1-FIELD-004);
 *  - broken cross-references (M6 — V1-REF-002/003).
 *
 * A final PDF is refused while either remains; saving the `.labdoc.json` draft
 * is never gated (a draft may legitimately contain placeholders).
 */
import type { Document } from "../ir/schema";
import {
  collectUnresolvedFields,
  unresolvedFieldMessages,
  type UnresolvedFieldReport,
} from "../fields";
import {
  collectBrokenReferences,
  referenceMessages,
  type BrokenReferenceReport,
} from "../references";

export type { UnresolvedFieldReport } from "../fields";
export type { BrokenReferenceReport } from "../references";

export interface DocumentIssuesReport {
  fields: UnresolvedFieldReport;
  references: BrokenReferenceReport;
}

/** Collect both issue families for a document (deterministic, side-effect free). */
export function collectDocumentIssues(document: Document): DocumentIssuesReport {
  return {
    fields: collectUnresolvedFields(document),
    references: collectBrokenReferences(document),
  };
}

/** True when any unresolved field or broken reference exists. */
export function hasDocumentIssues(document: Document): boolean {
  const report = collectDocumentIssues(document);
  return report.fields.occurrences.length > 0 || report.references.occurrences.length > 0;
}

/** One actionable line per problem: unresolved fields first, then references. */
export function documentIssueMessages(report: DocumentIssuesReport): string[] {
  return [
    ...unresolvedFieldMessages(report.fields),
    ...referenceMessages(report.references),
  ];
}
