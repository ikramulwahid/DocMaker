/**
 * Theme registry (Phase-0 proof of semantic theme switching).
 *
 * A theme is PRESENTATION ONLY (V1-THEME-004): it may change fonts, sizes and
 * colours, but never document content, metadata, ids, numbering, references,
 * fields or equations. Layout reads the selected theme id from the document
 * (`settings.theme`) and maps it here; unknown ids fall back to the default so
 * a document authored with a future theme still opens.
 *
 * Phase 0 ships two clearly distinct themes. The full 20-theme library,
 * including 5 B&W themes (V1-THEME-001/002), is deferred — see
 * docs/limitations.md.
 */

export interface ThemeTokens {
  /** Stable semantic id stored in the document. */
  id: string;
  /** Human label for the UI. */
  label: string;
  bodyFont: string;
  headingFont: string;
  monoFont: string;
  bodyFontPt: number;
  /** Heading font size per level 1..6 (pt). */
  headingPt: [number, number, number, number, number, number];
  ink: string;
  headingInk: string;
  mutedInk: string;
  accent: string;
  rule: string;
  tableBorder: string;
  tableHeaderBg: string;
  tableHeaderInk: string;
  /** B&W flag: themes that deliberately avoid colour (V1-THEME-002 family). */
  bw: boolean;
}

export const DEFAULT_THEME_ID = "lab_default";

export const THEMES: readonly ThemeTokens[] = [
  {
    id: "lab_default",
    label: "Lab Default",
    bodyFont: 'Georgia, "Times New Roman", serif',
    headingFont: 'Georgia, "Times New Roman", serif',
    monoFont: '"Consolas", "Courier New", monospace',
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#111111",
    headingInk: "#1f3a5f",
    mutedInk: "#444444",
    accent: "#1f3a5f",
    rule: "#444444",
    tableBorder: "#444444",
    tableHeaderBg: "#eef2f7",
    tableHeaderInk: "#111111",
    bw: false,
  },
  {
    id: "bw_standard",
    label: "B&W Standard",
    bodyFont: 'Arial, Helvetica, "Segoe UI", sans-serif',
    headingFont: 'Arial, Helvetica, "Segoe UI", sans-serif',
    monoFont: '"Consolas", "Courier New", monospace',
    bodyFontPt: 10.5,
    headingPt: [15, 12.5, 11, 10.5, 10, 10],
    ink: "#000000",
    headingInk: "#000000",
    mutedInk: "#333333",
    accent: "#000000",
    rule: "#000000",
    tableBorder: "#000000",
    tableHeaderBg: "#ffffff",
    tableHeaderInk: "#000000",
    bw: true,
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function listThemes(): readonly ThemeTokens[] {
  return THEMES;
}

/** Resolve a stored theme id to tokens; unknown/absent → the default theme. */
export function resolveTheme(id: string | undefined | null): ThemeTokens {
  if (id && BY_ID.has(id)) return BY_ID.get(id)!;
  return BY_ID.get(DEFAULT_THEME_ID)!;
}
