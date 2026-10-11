/**
 * New-document defaults panel (M4, plan D11 / §4.2; V1-DOC-002 configurability).
 *
 * Distinct from the active document's page setup on purpose: these preferences
 * seed documents created with "New" and are persisted locally. Editing them
 * never mutates the open document, and opening a file keeps that file's own
 * settings.
 */
import { listThemes } from "@/core/theme";
import { useDocStore } from "@/store";
import { Field } from "./Field";
import { PageSetupEditor } from "./PageSetupEditor";

export function NewDocumentDefaults() {
  const preferences = useDocStore((s) => s.preferences);
  const setDefaultPageSetup = useDocStore((s) => s.setDefaultPageSetup);
  const setDefaultTheme = useDocStore((s) => s.setDefaultTheme);
  const setDefaultMetadata = useDocStore((s) => s.setDefaultMetadata);
  const resetPreferences = useDocStore((s) => s.resetPreferences);

  return (
    <section className="defaults-card" data-testid="new-document-defaults">
      <h2>New document defaults</h2>
      <p className="hint">
        Applied to documents you create with <strong>New</strong>. They do not
        change the open document, and an opened file keeps its own settings.
      </p>

      <PageSetupEditor
        value={preferences.pageSetup}
        onChange={setDefaultPageSetup}
        idPrefix="defaults"
        showNumbering={false}
      />

      <label className="field">
        <span>Default theme</span>
        <select
          value={preferences.theme}
          data-testid="defaults-theme"
          onChange={(e) => setDefaultTheme(e.target.value)}
        >
          {listThemes().map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Default doc number"
        testId="defaults-doc-number"
        value={preferences.metadata.docNumber}
        onChange={(docNumber) => setDefaultMetadata({ docNumber })}
      />
      <Field
        label="Default revision"
        testId="defaults-revision"
        value={preferences.metadata.revision}
        onChange={(revision) => setDefaultMetadata({ revision })}
      />
      <Field
        label="Default author"
        testId="defaults-author"
        value={preferences.metadata.author}
        onChange={(author) => setDefaultMetadata({ author })}
      />
      <Field
        label="Default organization"
        testId="defaults-organization"
        value={preferences.metadata.organization}
        onChange={(organization) => setDefaultMetadata({ organization })}
      />
      <Field
        label="Default description"
        wide
        testId="defaults-description"
        value={preferences.metadata.description}
        onChange={(description) => setDefaultMetadata({ description })}
      />

      <button
        type="button"
        className="add-section"
        data-testid="defaults-reset"
        onClick={resetPreferences}
      >
        Reset to built-in defaults
      </button>
    </section>
  );
}
