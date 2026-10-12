/**
 * Unresolved dynamic fields panel (M5 — V1-FIELD-004).
 *
 * Uses the SHARED unresolved-field walker (not a scattered string check) so the
 * panel, the preview and the export gate all agree. An unused empty metadata
 * property is NOT reported; only a field that is USED with an empty/missing
 * source is. Page fields are deferred to pagination and never shown here.
 */
import { collectUnresolvedFields, unresolvedFieldMessages } from "@/core";
import { useDocStore } from "@/store";

export function UnresolvedFieldsPanel() {
  const document_ = useDocStore((s) => s.document);
  const report = collectUnresolvedFields(document_);
  const messages = unresolvedFieldMessages(report);

  return (
    <section>
      <h2>{"Dynamic fields"}</h2>
      {messages.length === 0 ? (
        <p className="hint" data-testid="unresolved-fields">
          All used fields are resolved.
        </p>
      ) : (
        <div className="unresolved-fields" data-testid="unresolved-fields" role="alert">
          <p className="hint">
            {messages.length} unresolved field{messages.length === 1 ? "" : "s"} — final
            PDF export is blocked until these are resolved:
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
