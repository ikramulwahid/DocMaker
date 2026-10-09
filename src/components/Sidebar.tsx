/**
 * Sidebar: document metadata, watermark, and per-section page setup.
 * Every field writes straight into the IR (store) — no shadow state.
 */
import { serializeMarginText } from "@/app/marginText";
import { listThemes } from "@/core/theme";
import { useDocStore } from "@/store";

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={props.wide ? "field wide" : "field"}>
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

export function Sidebar() {
  const document_ = useDocStore((s) => s.document);
  const activeSection = useDocStore((s) => s.activeSection);
  const setMetadata = useDocStore((s) => s.setMetadata);
  const setTheme = useDocStore((s) => s.setTheme);
  const setWatermark = useDocStore((s) => s.setWatermark);
  const setActiveSection = useDocStore((s) => s.setActiveSection);
  const setPageSetup = useDocStore((s) => s.setPageSetup);
  const setHeaderText = useDocStore((s) => s.setHeaderText);
  const addSection = useDocStore((s) => s.addSection);
  const removeSection = useDocStore((s) => s.removeSection);

  const { metadata, settings, sections } = document_;
  const watermark = settings.watermark;

  return (
    <aside className="sidebar">
      <section>
        <h2>Metadata</h2>
        <Field label="Title" value={metadata.title} onChange={(v) => setMetadata({ title: v })} />
        <Field label="Doc number" value={metadata.docNumber} onChange={(v) => setMetadata({ docNumber: v })} />
        <Field label="Revision" value={metadata.revision} onChange={(v) => setMetadata({ revision: v })} />
        <Field
          label="Effective date"
          type="date"
          value={metadata.effectiveDate}
          onChange={(v) => setMetadata({ effectiveDate: v })}
        />
        <Field label="Author" value={metadata.author} onChange={(v) => setMetadata({ author: v })} />
        <Field label="Organization" value={metadata.organization} onChange={(v) => setMetadata({ organization: v })} />
        <Field label="Description" wide value={metadata.description} onChange={(v) => setMetadata({ description: v })} />
      </section>

      <section>
        <h2>Theme</h2>
        <label className="field">
          <span>Document theme</span>
          <select
            value={settings.theme}
            data-testid="theme-select"
            onChange={(e) => setTheme(e.target.value)}
          >
            {listThemes().map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          Themes change presentation only — content, ids, numbering and fields
          are unchanged.
        </p>
      </section>

      <section>
        <h2>Watermark</h2>
        <label className="field check">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => setWatermark({ enabled: e.target.checked })}
          />
          <span>Enabled</span>
        </label>
        <Field label="Text" value={watermark.text} onChange={(v) => setWatermark({ text: v })} />
      </section>

      <section>
        <h2>Sections</h2>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={index === activeSection ? "section-card active" : "section-card"}
            data-testid={`section-card-${index}`}
          >
            <div className="section-card-head">
              <button
                type="button"
                className="section-select"
                onClick={() => setActiveSection(index)}
                title="Edit this section"
              >
                Section {index + 1}
              </button>
              {sections.length > 1 && (
                <button
                  type="button"
                  className="section-remove"
                  onClick={() => removeSection(index)}
                  title="Remove section"
                >
                  ✕
                </button>
              )}
            </div>
            <label className="field">
              <span>Orientation</span>
              <select
                value={section.pageSetup.orientation}
                data-testid={`orientation-${index}`}
                onChange={(e) =>
                  setPageSetup(index, {
                    orientation: e.target.value as "portrait" | "landscape",
                  })
                }
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <Field
              label="Header ([title], [page]…)"
              value={serializeMarginText(section.header)}
              onChange={(v) => setHeaderText(index, v)}
            />
            <label className="field check">
              <input
                type="checkbox"
                checked={section.pageSetup.showPageNumber}
                onChange={(e) => setPageSetup(index, { showPageNumber: e.target.checked })}
              />
              <span>Show page number</span>
            </label>
            <Field
              label="Page starts at"
              type="number"
              value={String(section.pageSetup.pageNumberStart)}
              onChange={(v) =>
                setPageSetup(index, {
                  pageNumberStart: Math.max(1, Math.round(Number(v) || 1)),
                })
              }
            />
          </div>
        ))}
        <button type="button" className="add-section" onClick={addSection}>
          + Add section
        </button>
      </section>
    </aside>
  );
}
