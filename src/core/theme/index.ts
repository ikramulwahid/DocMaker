/**
 * Theme registry (V1-THEME-001..004).
 *
 * A theme is PRESENTATION ONLY (V1-THEME-004): it may change fonts, sizes and
 * colours, but never document content, metadata, ids, numbering, references,
 * fields or equations. Layout reads the selected theme id from the document
 * (`settings.theme`) and maps it here; unknown ids fall back to the default so
 * a document authored with a future theme still opens.
 *
 * M7 ships the full library — 24 distinct themes (V1-THEME-001) of which 6 are
 * deliberately monochrome / B&W (V1-THEME-002). A theme's `bw` flag is a
 * CONTRACT: every colour token of a `bw` theme must be neutral (r === g === b),
 * enforced by the theme-regression unit suite. The remaining themes are
 * restrained professional colour treatments suited to controlled laboratory
 * documents (SOPs, quality manuals, work instructions, forms, technical
 * reports). Only the typed tokens below reach the renderer — never user CSS
 * (AGENTS.md §30/§58), so a theme cannot smuggle styles or alter semantics.
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

/** Fixed serif/sans stacks for the semantic `fontFamily` character mark
 * (M2). The mark stores an enum (`serif`/`sans`/`mono`), never a CSS string;
 * the renderer maps the enum to a stack here — theme-driven for `mono`
 * (per-theme `monoFont`), fixed cross-theme for serif/sans so an author's
 * explicit font choice looks the same in every theme while the document
 * itself stays theme-independent. */
export const SERIF_FONT_STACK = 'Georgia, "Times New Roman", serif';
export const SANS_FONT_STACK = 'Arial, Helvetica, "Segoe UI", sans-serif';

/**
 * Additional cross-theme font stacks used by the theme library. Every stack is
 * a fixed, web-safe family list (no user input, no remote fonts) so preview
 * and PDF render identically and no network access is required.
 */
const TIMES_FONT_STACK = '"Times New Roman", Times, serif';
const HELVETICA_FONT_STACK = 'Helvetica, Arial, sans-serif';
const VERDANA_FONT_STACK = 'Verdana, Geneva, sans-serif';
const TREBUCHET_FONT_STACK = '"Trebuchet MS", "Segoe UI", sans-serif';
const SYSTEM_FONT_STACK = '"Segoe UI", Calibri, Arial, sans-serif';
const MONO_FONT_STACK = '"Consolas", "Courier New", monospace';

/** Map a semantic font-family enum to a CSS font stack for a theme. */
export function fontFamilyStack(
  family: "serif" | "sans" | "mono",
  theme: ThemeTokens,
): string {
  switch (family) {
    case "serif":
      return SERIF_FONT_STACK;
    case "sans":
      return SANS_FONT_STACK;
    case "mono":
      return theme.monoFont;
  }
}

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

  /* --------------------------------------------------- monochrome / B&W (6) */
  // V1-THEME-002 family. Every colour token below is neutral (r === g === b);
  // the unit suite proves this, so a theme is B&W because it IS, not because
  // its name says so. Variety comes from typeface scale and grey tone, which
  // keeps controlled documents legible on black-and-white printers.
  {
    id: "bw_serif_classic",
    label: "B&W Serif Classic",
    bodyFont: SERIF_FONT_STACK,
    headingFont: SERIF_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16.5, 13.5, 12, 11, 10.5, 10.5],
    ink: "#000000",
    headingInk: "#000000",
    mutedInk: "#4d4d4d",
    accent: "#000000",
    rule: "#808080",
    tableBorder: "#4d4d4d",
    tableHeaderBg: "#f2f2f2",
    tableHeaderInk: "#000000",
    bw: true,
  },
  {
    id: "bw_compact",
    label: "B&W Compact",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10,
    headingPt: [14, 11.5, 10.5, 10, 10, 10],
    ink: "#1a1a1a",
    headingInk: "#000000",
    mutedInk: "#555555",
    accent: "#333333",
    rule: "#999999",
    tableBorder: "#666666",
    tableHeaderBg: "#ededed",
    tableHeaderInk: "#111111",
    bw: true,
  },
  {
    id: "bw_high_contrast",
    label: "B&W High Contrast",
    bodyFont: HELVETICA_FONT_STACK,
    headingFont: HELVETICA_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 12,
    headingPt: [19, 15.5, 13, 12, 11.5, 11.5],
    ink: "#000000",
    headingInk: "#000000",
    mutedInk: "#000000",
    accent: "#000000",
    rule: "#000000",
    tableBorder: "#000000",
    tableHeaderBg: "#ffffff",
    tableHeaderInk: "#000000",
    bw: true,
  },
  {
    id: "bw_grayscale_soft",
    label: "B&W Grayscale Soft",
    bodyFont: TIMES_FONT_STACK,
    headingFont: TIMES_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [15, 12.5, 11.5, 11, 10.5, 10.5],
    ink: "#2b2b2b",
    headingInk: "#3d3d3d",
    mutedInk: "#6b6b6b",
    accent: "#3d3d3d",
    rule: "#b3b3b3",
    tableBorder: "#8c8c8c",
    tableHeaderBg: "#f7f7f7",
    tableHeaderInk: "#2b2b2b",
    bw: true,
  },
  {
    id: "bw_mono_technical",
    label: "B&W Mono Technical",
    bodyFont: MONO_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 9.5,
    headingPt: [14, 11.5, 10.5, 10, 9.5, 9.5],
    ink: "#1a1a1a",
    headingInk: "#000000",
    mutedInk: "#595959",
    accent: "#262626",
    rule: "#a6a6a6",
    tableBorder: "#595959",
    tableHeaderBg: "#ececec",
    tableHeaderInk: "#1a1a1a",
    bw: true,
  },

  /* ------------------------------------------------ professional colour (17) */
  {
    id: "corporate_navy",
    label: "Corporate Navy",
    bodyFont: SYSTEM_FONT_STACK,
    headingFont: SYSTEM_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [16, 13, 11.5, 10.5, 10, 10],
    ink: "#1f2933",
    headingInk: "#0b2545",
    mutedInk: "#52606d",
    accent: "#1d4e89",
    rule: "#9aa5b1",
    tableBorder: "#bcccdc",
    tableHeaderBg: "#e8eef5",
    tableHeaderInk: "#0b2545",
    bw: false,
  },
  {
    id: "slate_professional",
    label: "Slate Professional",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [15.5, 12.5, 11, 10.5, 10, 10],
    ink: "#2f3b4c",
    headingInk: "#26303d",
    mutedInk: "#5c6b7a",
    accent: "#3f6c8e",
    rule: "#a9b4c0",
    tableBorder: "#c4cdd6",
    tableHeaderBg: "#eef1f4",
    tableHeaderInk: "#26303d",
    bw: false,
  },
  {
    id: "clinical_blue",
    label: "Clinical Blue",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10,
    headingPt: [15, 12.5, 11, 10.5, 10, 10],
    ink: "#17223b",
    headingInk: "#0b3d91",
    mutedInk: "#4a5a78",
    accent: "#0b57d0",
    rule: "#9fb3d9",
    tableBorder: "#b9c9e6",
    tableHeaderBg: "#eaf1fb",
    tableHeaderInk: "#0b3d91",
    bw: false,
  },
  {
    id: "teal_sop",
    label: "Teal SOP",
    bodyFont: TREBUCHET_FONT_STACK,
    headingFont: TREBUCHET_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#1b2b2a",
    headingInk: "#0f4c48",
    mutedInk: "#4f6664",
    accent: "#12706a",
    rule: "#9cc4c0",
    tableBorder: "#b7d5d1",
    tableHeaderBg: "#e6f2f0",
    tableHeaderInk: "#0f4c48",
    bw: false,
  },
  {
    id: "forest_quality",
    label: "Forest Quality",
    bodyFont: SERIF_FONT_STACK,
    headingFont: SERIF_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16.5, 13.5, 12, 11, 10.5, 10.5],
    ink: "#1f2a20",
    headingInk: "#1b4332",
    mutedInk: "#4a5d4e",
    accent: "#2d6a4f",
    rule: "#a3b8a6",
    tableBorder: "#bcd0bf",
    tableHeaderBg: "#e7f0e8",
    tableHeaderInk: "#1b4332",
    bw: false,
  },
  {
    id: "burgundy_regulatory",
    label: "Burgundy Regulatory",
    bodyFont: TIMES_FONT_STACK,
    headingFont: TIMES_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#2b1f21",
    headingInk: "#5a1a2b",
    mutedInk: "#5c4a4d",
    accent: "#7d1f3a",
    rule: "#c2a7ad",
    tableBorder: "#d6bcc2",
    tableHeaderBg: "#f4e9eb",
    tableHeaderInk: "#5a1a2b",
    bw: false,
  },
  {
    id: "indigo_manual",
    label: "Indigo Manual",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [15.5, 12.5, 11.5, 11, 10.5, 10.5],
    ink: "#232436",
    headingInk: "#2a2f7a",
    mutedInk: "#565a7a",
    accent: "#3a41c4",
    rule: "#b3b6d6",
    tableBorder: "#c9cbe6",
    tableHeaderBg: "#ececf8",
    tableHeaderInk: "#2a2f7a",
    bw: false,
  },
  {
    id: "charcoal_amber",
    label: "Charcoal Amber",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [15, 12.5, 11, 10.5, 10, 10],
    ink: "#2b2b2b",
    headingInk: "#3a2f10",
    mutedInk: "#5f5a4a",
    accent: "#a66300",
    rule: "#c9b58f",
    tableBorder: "#d8c9a8",
    tableHeaderBg: "#fbf1dd",
    tableHeaderInk: "#3a2f10",
    bw: false,
  },
  {
    id: "cobalt_report",
    label: "Cobalt Report",
    bodyFont: HELVETICA_FONT_STACK,
    headingFont: HELVETICA_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10,
    headingPt: [15, 12.5, 11, 10.5, 10, 10],
    ink: "#14213d",
    headingInk: "#143a8f",
    mutedInk: "#44546a",
    accent: "#1c5fd6",
    rule: "#a9bae0",
    tableBorder: "#c2cfe8",
    tableHeaderBg: "#eaf0fb",
    tableHeaderInk: "#143a8f",
    bw: false,
  },
  {
    id: "plum_scientific",
    label: "Plum Scientific",
    bodyFont: SERIF_FONT_STACK,
    headingFont: SERIF_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#2a1e2e",
    headingInk: "#5b2a6b",
    mutedInk: "#6a566f",
    accent: "#7a3b8f",
    rule: "#c4aacb",
    tableBorder: "#d6bfdc",
    tableHeaderBg: "#f3eaf6",
    tableHeaderInk: "#5b2a6b",
    bw: false,
  },
  {
    id: "ocean_calm",
    label: "Ocean Calm",
    bodyFont: VERDANA_FONT_STACK,
    headingFont: VERDANA_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10,
    headingPt: [15, 12, 11, 10.5, 10, 10],
    ink: "#16303a",
    headingInk: "#0b4f6c",
    mutedInk: "#4a6773",
    accent: "#0f6f8f",
    rule: "#9dc4d1",
    tableBorder: "#bcd8e2",
    tableHeaderBg: "#e8f4f8",
    tableHeaderInk: "#0b4f6c",
    bw: false,
  },
  {
    id: "rust_manual",
    label: "Rust Manual",
    bodyFont: TIMES_FONT_STACK,
    headingFont: TIMES_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#2f2620",
    headingInk: "#7a3b1d",
    mutedInk: "#6a5648",
    accent: "#9c4a1f",
    rule: "#cdb3a1",
    tableBorder: "#dcc7b6",
    tableHeaderBg: "#f6ede5",
    tableHeaderInk: "#7a3b1d",
    bw: false,
  },
  {
    id: "emerald_policy",
    label: "Emerald Policy",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [15.5, 12.5, 11, 10.5, 10, 10],
    ink: "#14251d",
    headingInk: "#0b5c3b",
    mutedInk: "#456354",
    accent: "#0f7a4f",
    rule: "#9dc7b3",
    tableBorder: "#b9d8c8",
    tableHeaderBg: "#e8f5ee",
    tableHeaderInk: "#0b5c3b",
    bw: false,
  },
  {
    id: "sepia_print",
    label: "Sepia Print",
    bodyFont: SERIF_FONT_STACK,
    headingFont: SERIF_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [16, 13, 11.5, 11, 10.5, 10.5],
    ink: "#3a3226",
    headingInk: "#5c4a2e",
    mutedInk: "#6f6350",
    accent: "#7a5c2e",
    rule: "#c9b896",
    tableBorder: "#d8caa8",
    tableHeaderBg: "#f4eddc",
    tableHeaderInk: "#5c4a2e",
    bw: false,
  },
  {
    id: "graphite_sky",
    label: "Graphite Sky",
    bodyFont: SYSTEM_FONT_STACK,
    headingFont: SYSTEM_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10.5,
    headingPt: [15.5, 12.5, 11, 10.5, 10, 10],
    ink: "#2b2f36",
    headingInk: "#24384f",
    mutedInk: "#5b6472",
    accent: "#2f7dbf",
    rule: "#a9b4c2",
    tableBorder: "#c4cdd9",
    tableHeaderBg: "#ecf2f8",
    tableHeaderInk: "#24384f",
    bw: false,
  },
  {
    id: "rose_clinical",
    label: "Rose Clinical",
    bodyFont: SANS_FONT_STACK,
    headingFont: SANS_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 10,
    headingPt: [15, 12.5, 11, 10.5, 10, 10],
    ink: "#2e2226",
    headingInk: "#8a1f3d",
    mutedInk: "#6a535a",
    accent: "#b02a4e",
    rule: "#d3adb8",
    tableBorder: "#e0c2ca",
    tableHeaderBg: "#f9ecf0",
    tableHeaderInk: "#8a1f3d",
    bw: false,
  },
  {
    id: "midnight_ink",
    label: "Midnight Ink",
    bodyFont: TIMES_FONT_STACK,
    headingFont: TIMES_FONT_STACK,
    monoFont: MONO_FONT_STACK,
    bodyFontPt: 11,
    headingPt: [17, 14, 12, 11, 10.5, 10.5],
    ink: "#12141c",
    headingInk: "#0a1a3a",
    mutedInk: "#4a5060",
    accent: "#8a6d1f",
    rule: "#9aa0ad",
    tableBorder: "#b8bdc8",
    tableHeaderBg: "#eef0f4",
    tableHeaderInk: "#0a1a3a",
    bw: false,
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
