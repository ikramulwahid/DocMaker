/**
 * Sidebar: document metadata, watermark, per-section page setup, and the
 * reusable style library (V1-STYLE-001..004).
 * Every field writes straight into the IR (store) — no shadow state.
 */
import { useState } from "react";
import { serializeMarginText } from "@/app/marginText";
import { listThemes } from "@/core/theme";
import { isBuiltinStyleId, type StyleFormat } from "@/core";
import { useDocStore, type StyleDefinitionPatch } from "@/store";

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
  const setStyleDefinition = useDocStore((s) => s.setStyleDefinition);
  const addCustomStyle = useDocStore((s) => s.addCustomStyle);
  const removeCustomStyle = useDocStore((s) => s.removeCustomStyle);
  const [editingStyle, setEditingStyle] = useState<string | null>(null);

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

      <section>
        <h2>Styles</h2>
        <p className="hint">
          Reusable styles — changing a definition updates every block that
          uses it in the preview and exports (V1-STYLE-003).
        </p>
        {Object.values(document_.styles)
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((def) => (
            <div className="style-row" key={def.id} data-testid={`style-row-${def.id}`}>
              <div className="style-row-head">
                <button
                  type="button"
                  className="style-name"
                  title={`Edit ${def.name}`}
                  onClick={() =>
                    setEditingStyle(editingStyle === def.id ? null : def.id)
                  }
                >
                  {def.name}
                  <span className="style-id">{def.id}</span>
                </button>
                {!isBuiltinStyleId(def.id) && (
                  <button
                    type="button"
                    className="style-remove"
                    title={`Remove ${def.name}`}
                    onClick={() => {
                      setEditingStyle(null);
                      removeCustomStyle(def.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {editingStyle === def.id && (
                <StyleEditor
                  name={def.name}
                  format={def.format}
                  onSave={(patch) => {
                    setStyleDefinition(def.id, patch);
                    setEditingStyle(null);
                  }}
                  onCancel={() => setEditingStyle(null)}
                />
              )}
            </div>
          ))}
        <button
          type="button"
          className="add-section"
          data-testid="new-style-button"
          onClick={() => {
            const id = addCustomStyle();
            setEditingStyle(id);
          }}
        >
          + New style
        </button>
      </section>
    </aside>
  );
}

/** Small inline editor for a style definition (allow-listed tokens only). */
function StyleEditor(props: {
  name: string;
  format: StyleFormat;
  onSave: (patch: StyleDefinitionPatch) => void;
  onCancel: () => void;
}) {
  const { format } = props;
  const [name, setName] = useState(props.name);
  const [fontSizePt, setFontSizePt] = useState(
    format.fontSizePt != null ? String(format.fontSizePt) : "",
  );
  const [bold, setBold] = useState(format.bold);
  const [italic, setItalic] = useState(format.italic);
  const [alignment, setAlignment] = useState(format.alignment);
  const [useColor, setUseColor] = useState(format.color != null);
  const [color, setColor] = useState(format.color ?? "#000000");
  const [lineHeight, setLineHeight] = useState(
    format.lineHeight != null ? String(format.lineHeight) : "",
  );
  const [marginTop, setMarginTop] = useState(
    format.marginTopMm != null ? String(format.marginTopMm) : "",
  );
  const [marginBottom, setMarginBottom] = useState(
    format.marginBottomMm != null ? String(format.marginBottomMm) : "",
  );
  const [indent, setIndent] = useState(
    format.indentMm != null ? String(format.indentMm) : "",
  );
  const [fontFamily, setFontFamily] = useState(format.fontFamily);
  const [textTransform, setTextTransform] = useState(format.textTransform);

  const num = (v: string, positive: boolean): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return positive ? (n > 0 ? n : null) : n >= 0 ? n : null;
  };

  const save = () =>
    props.onSave({
      name,
      fontSizePt: num(fontSizePt, true),
      bold,
      italic,
      alignment,
      color: useColor ? color : null,
      lineHeight: num(lineHeight, true),
      marginTopMm: num(marginTop, false),
      marginBottomMm: num(marginBottom, false),
      indentMm: num(indent, false),
      fontFamily,
      textTransform,
    });

  return (
    <div className="style-form">
      <label className="field">
        <span>Name</span>
        <input
          data-testid="style-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="style-form-row">
        <label className="field">
          <span>Font size (pt)</span>
          <input
            type="number"
            min="1"
            step="0.5"
            placeholder="theme"
            data-testid="style-font-size"
            value={fontSizePt}
            onChange={(e) => setFontSizePt(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Line height</span>
          <input
            type="number"
            min="0.5"
            step="0.05"
            placeholder="theme"
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
          />
        </label>
      </div>
      <div className="style-form-row">
        <label className="field">
          <span>Font family</span>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
          >
            <option value="inherit">Theme default</option>
            <option value="serif">Serif (theme)</option>
            <option value="sans">Sans (theme)</option>
            <option value="mono">Mono (theme)</option>
          </select>
        </label>
        <label className="field">
          <span>Alignment</span>
          <select
            value={alignment}
            onChange={(e) => setAlignment(e.target.value as typeof alignment)}
          >
            <option value="inherit">Theme default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </label>
      </div>
      <div className="style-form-row">
        <label className="field">
          <span>Capitalization</span>
          <select
            value={textTransform}
            onChange={(e) =>
              setTextTransform(e.target.value as typeof textTransform)
            }
          >
            <option value="none">None</option>
            <option value="uppercase">Uppercase</option>
          </select>
        </label>
        <label className="field check">
          <input
            type="checkbox"
            data-testid="style-bold"
            checked={bold}
            onChange={(e) => setBold(e.target.checked)}
          />
          <span>Bold</span>
        </label>
        <label className="field check">
          <input type="checkbox" checked={italic} onChange={(e) => setItalic(e.target.checked)} />
          <span>Italic</span>
        </label>
      </div>
      <div className="style-form-row">
        <label className="field">
          <span>Colour</span>
          <span className="style-color-input">
            <input
              type="color"
              disabled={!useColor}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="checkbox"
              checked={useColor}
              onChange={(e) => setUseColor(e.target.checked)}
              aria-label="Use style colour"
            />
          </span>
        </label>
        <label className="field">
          <span>Indent (mm)</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="none"
            value={indent}
            onChange={(e) => setIndent(e.target.value)}
          />
        </label>
      </div>
      <div className="style-form-row">
        <label className="field">
          <span>Space before (mm)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="theme"
            value={marginTop}
            onChange={(e) => setMarginTop(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Space after (mm)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="theme"
            value={marginBottom}
            onChange={(e) => setMarginBottom(e.target.value)}
          />
        </label>
      </div>
      <div className="style-form-actions">
        <button type="button" className="tool" data-testid="style-apply" onClick={save}>
          Apply
        </button>
        <button type="button" className="tool" data-testid="style-cancel" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}