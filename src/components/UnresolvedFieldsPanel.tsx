/**
 * Document "issues" panel (M5 — V1-FIELD-004; M6 — V1-REF-002/003).
 *
 * Uses the SHARED combined issue walker (not a scattered string check) so the
 * panel, the preview and both export paths all agree. Two families are
 * reported: dynamic fields that are USED with an empty/missing source, and
 * cross-references whose target is missing/deleted. An unused empty metadata
 * property is NOT reported; page fields are deferred to pagination and never
 * shown here.
 */
import { collectDocumentIssues, documentIssueMessages } from "@/core";
import { useDocStore } from "@/store";

export function UnresolvedFieldsPanel() {
  const document_ = useDocStore((s) => s.document);
  const report = collectDocumentIssues(document_);
  const messages = documentIssueMessages(report);

  return (
    <section>
      <h2>{"Issues"}</h2>
      {messages.length === 0 ? (
        <p className="hint" data-testid="unresolved-fields">
          All used fields are resolved.
        </p>
      ) : (
        <div className="unresolved-fields" data-testid="unresolved-fields" role="alert">
          <p className="hint">
            {messages.length} issue{messages.length === 1 ? "" : "s"} — final PDF export is
            blocked until these are resolved:
          </p>
          <ul>
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
