/**
 * Authoritative page geometry (M4 — V1-PAGE-001..004, V1-PAG-004, V1-PDF-002).
 *
 * This module is the SINGLE source of truth for paper dimensions and for how
 * orientation and margins resolve into an effective page size. Every consumer
 * — the IR schema, the layout CSS (`@page` + the paged.js sheet-var
 * workaround), the PDF exporter's size-run grouping and the UI — reads the
 * table/functions here. No paper dimension is duplicated elsewhere.
 *
 * Semantics:
 *  - A STANDARD format (A4/A3/A5/Letter/Legal/Tabloid/Executive) has intrinsic
 *    dimensions in millimetres, stored in portrait orientation. Orientation is
 *    applied EXACTLY ONCE, here (`effectivePageSizeMm`): landscape swaps the
 *    intrinsic width/height of a standard format. Consumers must never
 *    pre-swap a size (that is the documented "double-swap" trap).
 *  - A CUSTOM format stores an explicit `widthMm`/`heightMm` pair that IS the
 *    final page size: both dimensions are already fixed by the author, so
 *    orientation is intentionally NOT applied to it. This makes it impossible
 *    to double-swap a custom size, and keeps the fields WYSIWYG ("width 297"
 *    means a 297 mm-wide sheet in any orientation).
 *
 * All dimensions are millimetres (the canonical IR unit for this project).
 * Millimetres → PDF points is the exporter's concern (72 / 25.4).
 */

/** Standard, named paper formats. */
export const STANDARD_PAGE_FORMATS = [
  "A4",
  "A3",
  "A5",
  "Letter",
  "Legal",
  "Tabloid",
  "Executive",
] as const;
export type StandardPageFormat = (typeof STANDARD_PAGE_FORMATS)[number];

/** Sentinel format whose dimensions come from the explicit width/height pair. */
export const CUSTOM_PAGE_FORMAT = "Custom";
export type CustomPageFormat = typeof CUSTOM_PAGE_FORMAT;

/** Every accepted `format` value (standard + custom). */
export const PAGE_FORMATS = [...STANDARD_PAGE_FORMATS, CUSTOM_PAGE_FORMAT] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

export type PageOrientation = "portrait" | "landscape";

export interface PaperSizeMm {
  widthMm: number;
  heightMm: number;
}

/**
 * Intrinsic (portrait) dimensions of every standard format, in millimetres.
 * US formats are converted from their exact inch definitions
 * (Letter 8.5×11 in = 215.9×279.4 mm, Legal 8.5×14 in, Tabloid 11×17 in,
 * Executive 7.25×10.5 in).
 */
export const PAPER_SIZES_MM: Record<StandardPageFormat, PaperSizeMm> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A5: { widthMm: 148, heightMm: 210 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
  Legal: { widthMm: 215.9, heightMm: 355.6 },
  Tabloid: { widthMm: 279.4, heightMm: 431.8 },
  Executive: { widthMm: 184.15, heightMm: 266.7 },
};

/**
 * Documented, practical bounds for a custom page dimension (mm). The lower
 * bound keeps a page from collapsing below a usable sheet; the upper bound is
 * well beyond any plotter format the product targets while still bounding how
 * large a value a hand-edited `.labdoc.json` can inject into the layout/PDF
 * pipeline. Values outside this range are rejected by the schema and clamped
 * away at the render boundary.
 */
export const PAGE_SIZE_MM_MIN = 10;
export const PAGE_SIZE_MM_MAX = 2000;

/** Minimum usable content width/height (mm) after margins are applied. */
export const MIN_USABLE_MM = 1;

/** Human label for a format (select options / readouts). */
export function pageFormatLabel(format: PageFormat): string {
  if (format === CUSTOM_PAGE_FORMAT) return "Custom";
  const size = PAPER_SIZES_MM[format];
  return `${format} — ${trimMm(size.widthMm)} × ${trimMm(size.heightMm)} mm`;
}

/** True when `value` is one of the standard named formats. */
export function isStandardPageFormat(value: unknown): value is StandardPageFormat {
  return (
    typeof value === "string" &&
    (STANDARD_PAGE_FORMATS as readonly string[]).includes(value)
  );
}

/** True when `value` is any accepted page format. */
export function isPageFormat(value: unknown): value is PageFormat {
  return value === CUSTOM_PAGE_FORMAT || isStandardPageFormat(value);
}

/** True when `value` is a finite custom dimension inside the accepted bounds. */
export function isPageSizeMm(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= PAGE_SIZE_MM_MIN &&
    value <= PAGE_SIZE_MM_MAX
  );
}

/** Clamp an untrusted dimension into the accepted bounds (render boundary). */
export function safePageSizeMm(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return PAGE_SIZE_MM_MIN;
  return Math.min(PAGE_SIZE_MM_MAX, Math.max(PAGE_SIZE_MM_MIN, value));
}

/** Round a millimetre value for display/CSS without float artefacts. */
function trimMm(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** `215.9` → `"215.9mm"` (never `"215.90000000000003mm"`). */
export function formatMm(value: number): string {
  return `${trimMm(value)}mm`;
}

/** The subset of a page setup needed to derive geometry. */
export interface PageSizeInput {
  format: PageFormat;
  orientation: PageOrientation;
  widthMm: number | null;
  heightMm: number | null;
}

/** A page setup plus margins (for usable-area validation). */
export interface PageGeometryInput extends PageSizeInput {
  margins: { top: number; right: number; bottom: number; left: number };
}

/**
 * Base page dimensions before orientation is considered.
 *
 * For a standard format this is the intrinsic (portrait) table entry. For a
 * valid Custom format it is the authored width/height pair (already the final
 * size). Unknown/invalid input falls back to A4 deterministically (the render
 * boundary must be total: a value that bypassed schema validation still
 * produces a valid sheet, never `NaN`/`0`/negative CSS).
 */
export function basePageSizeMm(setup: Pick<PageSizeInput, "format" | "widthMm" | "heightMm">): PaperSizeMm {
  if (setup.format === CUSTOM_PAGE_FORMAT) {
    if (isPageSizeMm(setup.widthMm) && isPageSizeMm(setup.heightMm)) {
      return { widthMm: setup.widthMm, heightMm: setup.heightMm };
    }
    return { ...PAPER_SIZES_MM.A4 };
  }
  if (isStandardPageFormat(setup.format)) return { ...PAPER_SIZES_MM[setup.format] };
  return { ...PAPER_SIZES_MM.A4 };
}

/**
 * Effective page dimensions in millimetres.
 *
 * Orientation is applied exactly once here, and ONLY to standard formats:
 * landscape swaps the intrinsic width/height of a named format. A Custom
 * format already fixes both dimensions, so its authored pair is returned
 * unchanged — applying the standard swap to it would double-swap the author's
 * intent (see the module header).
 */
export function effectivePageSizeMm(setup: PageSizeInput): PaperSizeMm {
  const base = basePageSizeMm(setup);
  const validCustom =
    setup.format === CUSTOM_PAGE_FORMAT &&
    isPageSizeMm(setup.widthMm) &&
    isPageSizeMm(setup.heightMm);
  // A valid custom pair already fixes both dimensions (no swap). Everything
  // else — standard formats and the A4 fallback — honours orientation once.
  if (!validCustom && setup.orientation === "landscape") {
    return { widthMm: base.heightMm, heightMm: base.widthMm };
  }
  return base;
}

/** Effective size as CSS values, e.g. `{ width: "210mm", height: "297mm" }`. */
export function effectivePageSizeCssMm(setup: PageSizeInput): {
  width: string;
  height: string;
} {
  const size = effectivePageSizeMm(setup);
  return { width: formatMm(size.widthMm), height: formatMm(size.heightMm) };
}

/**
 * Why a custom page size is invalid, or `null` when acceptable. A standard
 * format carries no custom requirement (retained width/height are inactive).
 */
export function customSizeProblem(
  setup: Pick<PageSizeInput, "format" | "widthMm" | "heightMm">,
): string | null {
  if (setup.format !== CUSTOM_PAGE_FORMAT) return null;
  if (!isPageSizeMm(setup.widthMm) || !isPageSizeMm(setup.heightMm)) {
    return `custom page size requires a width and height between ${PAGE_SIZE_MM_MIN} and ${PAGE_SIZE_MM_MAX} mm`;
  }
  return null;
}

/**
 * The `pageSetup` patch to apply when the author switches `format`.
 *
 * A Custom format must carry a valid width/height pair; when none has been
 * authored yet, the pair is seeded from the CURRENT effective page size so the
 * rendered sheet does not jump. Switching back to a standard format retains
 * any custom pair (inactive) so it can be restored later.
 */
export function pageFormatPatch(
  setup: PageSizeInput,
  nextFormat: PageFormat,
): { format: PageFormat; widthMm?: number; heightMm?: number } {
  if (nextFormat !== CUSTOM_PAGE_FORMAT) return { format: nextFormat };
  if (isPageSizeMm(setup.widthMm) && isPageSizeMm(setup.heightMm)) {
    return { format: nextFormat };
  }
  const size = effectivePageSizeMm(setup);
  return { format: nextFormat, widthMm: size.widthMm, heightMm: size.heightMm };
}

/**
 * Why the margins leave a degenerate page, or `null` when a usable area
 * remains. Uses the effective (orientation-applied) size, and requires a
 * strictly positive usable width/height of at least `MIN_USABLE_MM`.
 */
export function pageAreaProblem(setup: PageGeometryInput): string | null {
  const size = effectivePageSizeMm(setup);
  const { top, right, bottom, left } = setup.margins;
  const usableWidth = size.widthMm - left - right;
  const usableHeight = size.heightMm - top - bottom;
  if (usableWidth < MIN_USABLE_MM || usableHeight < MIN_USABLE_MM) {
    return (
      `margins leave no usable page area: page ${trimMm(size.widthMm)} × ` +
      `${trimMm(size.heightMm)} mm with margins ${top}/${right}/${bottom}/${left} mm`
    );
  }
  return null;
}
