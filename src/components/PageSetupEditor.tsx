/**
 * Reusable page-setup editor (M4 — V1-PAGE-001..004).
 *
 * Controlled and presentational: the active section and the new-document
 * defaults render the SAME controls so the two stay consistent. It edits the
 * model only through the caller's validated setter — there is no shadow copy
 * of the setup — and validates numeric input inline so an out-of-range value
 * never reaches the model. The store/schema remains the real boundary.
 */
import { useEffect, useState } from "react";
import {
  CUSTOM_PAGE_FORMAT,
  PAGE_FORMATS,
  PAGE_SIZE_MM_MAX,
  PAGE_SIZE_MM_MIN,
  PAPER_SIZES_MM,
  effectivePageSizeMm,
  formatMm,
  isStandardPageFormat,
  pageAreaProblem,
  pageFormatLabel,
  pageFormatPatch,
  type PageFormat,
  type PageOrientation,
  type PageSetup,
} from "@/core";

export interface PageSetupEditorProps {
  value: PageSetup;
  onChange: (patch: Partial<PageSetup>) => void;
  /** Prefix for control test ids (`${idPrefix}-format`, …-orientation, …). */
  idPrefix: string;
  /** Override the orientation control's test id (legacy `orientation-N`). */
  orientationTestId?: string;
  /** Show `showPageNumber` / `pageNumberStart` controls (default true). */
  showNumbering?: boolean;
  disabled?: boolean;
}

/** `210` → `"210"`, `215.9` → `"215.9"` (no trailing `.0`). */
function mm(value: number): string {
  return formatMm(value).replace(/mm$/, "");
}

export function PageSetupEditor(props: PageSetupEditorProps) {
  const { value, onChange, idPrefix, disabled } = props;
  const isCustom = value.format === CUSTOM_PAGE_FORMAT;
  const effective = effectivePageSizeMm(value);
  const areaProblem = pageAreaProblem(value);

  return (
    <div className="page-setup-editor" data-testid={`${idPrefix}-page-setup`}>
      <label className="field">
        <span>Paper size</span>
        <select
          value={value.format}
          data-testid={`${idPrefix}-format`}
          disabled={disabled}
          onChange={(e) => onChange(pageFormatPatch(value, e.target.value as PageFormat))}
        >
          {PAGE_FORMATS.map((format) => (
            <option key={format} value={format}>
              {pageFormatLabel(format)}
            </option>
          ))}
        </select>
      </label>

      {isStandardPageFormat(value.format) ? (
        <p className="hint" data-testid={`${idPrefix}-standard-size`}>
          Portrait {mm(PAPER_SIZES_MM[value.format].widthMm)} ×{" "}
          {mm(PAPER_SIZES_MM[value.format].heightMm)} mm
        </p>
      ) : (
        <>
          <NumberField
            label="Width (mm)"
            value={value.widthMm ?? PAPER_SIZES_MM.A4.widthMm}
            min={PAGE_SIZE_MM_MIN}
            max={PAGE_SIZE_MM_MAX}
            step={1}
            testId={`${idPrefix}-width`}
            disabled={disabled}
            onCommit={(widthMm) => onChange({ widthMm })}
          />
          <NumberField
            label="Height (mm)"
            value={value.heightMm ?? PAPER_SIZES_MM.A4.heightMm}
            min={PAGE_SIZE_MM_MIN}
            max={PAGE_SIZE_MM_MAX}
            step={1}
            testId={`${idPrefix}-height`}
            disabled={disabled}
            onCommit={(heightMm) => onChange({ heightMm })}
          />
        </>
      )}

      <label className="field">
        <span>Orientation</span>
        <select
          value={value.orientation}
          data-testid={props.orientationTestId ?? `${idPrefix}-orientation`}
          disabled={disabled || isCustom}
          aria-describedby={isCustom ? `${idPrefix}-orientation-note` : undefined}
          onChange={(e) => onChange({ orientation: e.target.value as PageOrientation })}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      {isCustom && (
        <p className="hint" id={`${idPrefix}-orientation-note`}>
          A custom size fixes both dimensions, so orientation is not applied.
        </p>
      )}
      <p className="hint" data-testid={`${idPrefix}-effective-size`}>
        Page: {mm(effective.widthMm)} × {mm(effective.heightMm)} mm
      </p>

      <NumberField
        label="Margin top (mm)"
        value={value.margins.top}
        min={0}
        max={100}
        step={1}
        testId={`${idPrefix}-margin-top`}
        disabled={disabled}
        onCommit={(top) => onChange({ margins: { ...value.margins, top } })}
      />
      <NumberField
        label="Margin right (mm)"
        value={value.margins.right}
        min={0}
        max={100}
        step={1}
        testId={`${idPrefix}-margin-right`}
        disabled={disabled}
        onCommit={(right) => onChange({ margins: { ...value.margins, right } })}
      />
      <NumberField
        label="Margin bottom (mm)"
        value={value.margins.bottom}
        min={0}
        max={100}
        step={1}
        testId={`${idPrefix}-margin-bottom`}
        disabled={disabled}
        onCommit={(bottom) => onChange({ margins: { ...value.margins, bottom } })}
      />
      <NumberField
        label="Margin left (mm)"
        value={value.margins.left}
        min={0}
        max={100}
        step={1}
        testId={`${idPrefix}-margin-left`}
        disabled={disabled}
        onCommit={(left) => onChange({ margins: { ...value.margins, left } })}
      />
      {areaProblem && (
        <p className="field-error" role="alert">
          {areaProblem}
        </p>
      )}

      {props.showNumbering !== false && (
        <>
          <label className="field check">
            <input
              type="checkbox"
              checked={value.showPageNumber}
              data-testid={`${idPrefix}-show-page-number`}
              disabled={disabled}
              onChange={(e) => onChange({ showPageNumber: e.target.checked })}
            />
            <span>Show page number</span>
          </label>
          <NumberField
            label="Page starts at"
            value={value.pageNumberStart}
            min={1}
            step={1}
            integer
            testId={`${idPrefix}-page-start`}
            disabled={disabled}
            onCommit={(pageNumberStart) => onChange({ pageNumberStart })}
          />
        </>
      )}
    </div>
  );
}

/**
 * Labelled numeric input that commits only valid, in-range values. Invalid or
 * empty text is kept locally (so typing is not clobbered) and surfaced as an
 * accessible error; the last valid value stays in the model.
 */
function NumberField(props: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  testId?: string;
  disabled?: boolean;
}) {
  const { value, onCommit, min, max, integer, disabled } = props;
  const [raw, setRaw] = useState(String(value));
  const [editing, setEditing] = useState(false);

  // Sync from the model only while the user is not typing, so external changes
  // (format switch prefilling a custom size, reset) still appear.
  useEffect(() => {
    if (!editing) setRaw(String(value));
  }, [value, editing]);

  const isValid = (text: string): boolean => {
    if (text.trim() === "") return false;
    const n = Number(text);
    return (
      Number.isFinite(n) &&
      (min === undefined || n >= min) &&
      (max === undefined || n <= max) &&
      (!integer || Number.isInteger(n))
    );
  };

  const valid = isValid(raw);
  const range =
    min !== undefined && max !== undefined
      ? `${min}–${max}`
      : min !== undefined
        ? `>= ${min}`
        : max !== undefined
          ? `<= ${max}`
          : "a number";

  return (
    <div className="field-stack">
      <label className="field">
        <span>{props.label}</span>
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          min={min}
          max={max}
          step={props.step}
          disabled={disabled}
          data-testid={props.testId}
          aria-invalid={!valid}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setRaw(e.target.value);
            if (isValid(e.target.value)) onCommit(Number(e.target.value));
          }}
        />
      </label>
      {!valid && (
        <p className="field-error" role="alert">
          Enter {range}
        </p>
      )}
    </div>
  );
}
