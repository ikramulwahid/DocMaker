/**
 * Document IR — the sacred, authoritative document model.
 *
 * Rules (AGENTS.md / Main_Prompt.md):
 *  - Every node has a stable semantic ID that is never derived from visible
 *    numbering (numbers are generated at resolve time, never stored).
 *  - The IR is the source of truth; Tiptap is only an editing view mapped
 *    through an explicit adapter.
 *  - Zod is the single schema: all TS types are inferred from it.
 */
import { z } from "zod";
import { columnWidthProblem, imageSrcProblem } from "./sanitize";
import { buildDefaultStyles } from "./styles";

/* ------------------------------------------------------------------ ids */

export const ID_PREFIXES = [
  "doc",
  "sec",
  "hd",
  "pg",
  "bl",
  "li",
  "tb",
  "tr",
  "tc",
  "im",
  "eq",
  "hr",
  "pb",
] as const;

export const idPrefixSchema = z.enum(ID_PREFIXES);
export type IdPrefix = z.infer<typeof idPrefixSchema>;

/** e.g. `hd_9x2f7q1a` — prefix + random suffix, stable for the node's life. */
export const nodeIdSchema = z
  .string()
  .regex(/^[a-z]{2,3}_[a-z0-9]{6,24}$/, "invalid node id");

export type NodeId = z.infer<typeof nodeIdSchema>;

/* ---------------------------------------------------------------- styles */

/**
 * Reusable styles (V1-STYLE-001..004, V1-TXT-001, AGENTS.md §58).
 *
 * A style is a named, document-level, reusable presentation definition that
 * text blocks REFERENCE by stable id instead of duplicating formatting
 * properties (V1-STYLE-002). Styling lives in the document, never in the
 * theme registry — switching themes changes only theme defaults, never style
 * definitions or assignments. All style values are allow-listed/validated so
 * a style definition can never inject arbitrary CSS or HTML (AGENTS.md §61).
 */

/** Stable canonical style id (independent of the display label). */
export const styleIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,31}$/, "invalid style id")
  .max(32);
export type StyleId = z.infer<typeof styleIdSchema>;

/** Styles never hold raw CSS strings; font choice is semantic + validated. */
export const styleFontFamilySchema = z.enum(["inherit", "serif", "sans", "mono"]);
/** Alignment is a fixed enum; null/"inherit" means the theme default. */
export const styleAlignmentSchema = z.enum([
  "inherit",
  "left",
  "center",
  "right",
  "justify",
]);
export const styleTextTransformSchema = z.enum(["none", "uppercase"]);

/**
 * Presentation tokens for a style. Every field is a validated, allow-listed
 * value: `null`/`inherit`/`false` mean "use the theme/build default for this
 * aspect" so default styles stay theme-driven. No free-form CSS strings.
 */
export const styleFormatSchema = z.object({
  fontSizePt: z.number().positive().nullable().default(null),
  fontFamily: styleFontFamilySchema.default("inherit"),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  /** Hex colour only (`#rgb`/`#rrggbb`/`#rrggbbaa`) — never arbitrary CSS. */
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/, "style color must be a hex colour (#rgb, #rrggbb or #rrggbbaa)")
    .nullable()
    .default(null),
  alignment: styleAlignmentSchema.default("inherit"),
  lineHeight: z.number().positive().nullable().default(null),
  textTransform: styleTextTransformSchema.default("none"),
  marginTopMm: z.number().min(0).max(100).nullable().default(null),
  marginBottomMm: z.number().min(0).max(100).nullable().default(null),
  /** Left block indent in mm (paragraph-level indentation). */
  indentMm: z.number().min(0).max(200).nullable().default(null),
});
export type StyleFormat = z.infer<typeof styleFormatSchema>;

/**
 * Semantic kinds. `heading` styles carry `headingLevel`; `paragraph` styles
 * apply to body/text paragraphs; `tableText` targets table cell paragraphs.
 */
export const styleKindSchema = z.enum(["paragraph", "heading", "tableText"]);
export type StyleKind = z.infer<typeof styleKindSchema>;

export const styleDefinitionSchema = z
  .object({
    /** Stable canonical id — never the display label (AGENTS.md §11/§12). */
    id: styleIdSchema,
    /** Human label shown in the UI. */
    name: z.string().min(1).max(64),
    kind: styleKindSchema,
    /** Semantic heading level (1..6) for heading styles; null otherwise. */
    headingLevel: z.number().int().min(1).max(6).nullable().default(null),
    /** Presentation tokens; all values validated (see styleFormatSchema). */
    format: styleFormatSchema.default({}),
  })
  .superRefine((def, ctx) => {
    // Kind/level must stay consistent: heading styles carry a semantic level,
    // paragraph/tableText styles never do (they drive layout selectors).
    if (def.kind === "heading" && def.headingLevel == null) {
      ctx.addIssue({
        code: "custom",
        path: ["headingLevel"],
        message: "heading styles must declare a heading level (1..6)",
      });
    }
    if (def.kind !== "heading" && def.headingLevel != null) {
      ctx.addIssue({
        code: "custom",
        path: ["headingLevel"],
        message: "headingLevel is only valid for heading styles",
      });
    }
  });
export type StyleDefinition = z.infer<typeof styleDefinitionSchema>;

/** Document-level style library keyed by stable style id. */
export const stylesSchema = z.record(styleIdSchema, styleDefinitionSchema);
export type Styles = z.infer<typeof stylesSchema>;

/** True when `value` is a valid style id that may be referenced. */
export function isStyleId(value: unknown): value is StyleId {
  return typeof value === "string" && styleIdSchema.safeParse(value).success;
}

/* --------------------------------------------------------------- inline */

export const boldMarkSchema = z.object({ type: z.literal("bold") });
export const italicMarkSchema = z.object({ type: z.literal("italic") });
export const codeMarkSchema = z.object({ type: z.literal("code") });
export const linkMarkSchema = z.object({
  type: z.literal("link"),
  href: z.string().min(1),
});

export const markSchema = z.discriminatedUnion("type", [
  boldMarkSchema,
  italicMarkSchema,
  codeMarkSchema,
  linkMarkSchema,
]);
export type Mark = z.infer<typeof markSchema>;

/** A run of text with uniform marks (Tiptap-compatible inline model). */
export const inlineSchema = z.object({
  text: z.string(),
  marks: z.array(markSchema).default([]),
});
export type Inline = z.infer<typeof inlineSchema>;

/* ---------------------------------------------------------------- blocks */

const blockBase = { id: nodeIdSchema };

export const paragraphSchema = z.object({
  ...blockBase,
  type: z.literal("paragraph"),
  content: z.array(inlineSchema).default([]),
  /**
   * Reusable style reference (V1-STYLE-002). `null` = no explicit style;
   * the resolver derives the built-in default (paragraph → "normal").
   * Style ids are validated; rendering falls back deterministically when a
   * reference is unknown (documented safe fallback, never silent data loss).
   */
  style: styleIdSchema.nullable().default(null),
});
export type Paragraph = z.infer<typeof paragraphSchema>;

export const headingSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  level: z.number().int().min(1).max(6),
  content: z.array(inlineSchema).default([]),
  /**
   * Reusable style reference (V1-STYLE-002); `null` derives the built-in
   * heading style by level (`heading-<level>`). Headings remain SEMANTIC:
   * the level drives structure/numbering, the style only presentation.
   */
  style: styleIdSchema.nullable().default(null),
});
export type Heading = z.infer<typeof headingSchema>;

/** Flat list: items are paragraphs (nested lists are a Phase-0 limitation —
 * the editor adapter flattens them; see docs/limitations.md). */
export const bulletListSchema = z.object({
  ...blockBase,
  type: z.literal("bulletList"),
  items: z.array(paragraphSchema).default([]),
});
export type BulletList = z.infer<typeof bulletListSchema>;

export const tableCellSchema = z.object({
  ...blockBase,
  type: z.literal("tableCell"),
  /** Cells hold paragraphs only in Phase 0 (forms come later). */
  content: z.array(paragraphSchema).default([]),
});
export type TableCell = z.infer<typeof tableCellSchema>;

export const tableRowSchema = z.object({
  ...blockBase,
  type: z.literal("tableRow"),
  cells: z.array(tableCellSchema).min(1),
});
export type TableRow = z.infer<typeof tableRowSchema>;

export const tableSchema = z.object({
  ...blockBase,
  type: z.literal("table"),
  /** Title text only — the "Table N" label is derived, never stored. */
  caption: z.string().nullable().default(null),
  headerRow: z.boolean().default(true),
  /**
   * Relative column widths (px/mm/cm/pt/%, or "" for auto) — a strict
   * allow-list so an untrusted document cannot inject CSS. Any invalid
   * width entry fails validation; the renderer also drops the whole
   * colgroup as defense in depth. See `src/core/ir/sanitize.ts`.
   */
  columnWidths: z
    .array(
      z.string().superRefine((value, ctx) => {
        const problem = columnWidthProblem(value);
        if (problem) ctx.addIssue({ code: "custom", message: problem });
      }),
    )
    .default([]),
  rows: z.array(tableRowSchema).min(1),
});
export type Table = z.infer<typeof tableSchema>;

export const imageSchema = z.object({
  ...blockBase,
  type: z.literal("image"),
  /**
   * Embedded data URI only — local-first, no external fetches (AGENTS.md §16).
   * Enforced as a documented allow-list of image types (png/jpeg/gif/webp/bmp
   * base64 + svg+xml), with a maximum source size; external URLs such as
   * `https://`, `file:`, `javascript:` are rejected. See
   * `src/core/ir/sanitize.ts` and docs/limitations.md.
   */
  src: z.string().superRefine((value, ctx) => {
    const problem = imageSrcProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
  alt: z.string().default(""),
  /** Rendered width in mm; null = intrinsic width capped by the area. */
  widthMm: z.number().positive().nullable().default(null),
  /** Title text only — the "Figure N" label is derived, never stored. */
  caption: z.string().nullable().default(null),
});
export type Image = z.infer<typeof imageSchema>;

export const pageBreakSchema = z.object({
  ...blockBase,
  type: z.literal("pageBreak"),
});
export type PageBreak = z.infer<typeof pageBreakSchema>;

/**
 * Structured mathematical equation (V1-EQ-001/003). Stored as LaTeX source,
 * never as an image or pre-rendered HTML: KaTeX renders it at layout time so
 * `renderLayout()` stays a pure semantic → layout transformation. The equation
 * number (where used) is derived, never stored (AGENTS.md §12).
 */
export const equationSchema = z.object({
  ...blockBase,
  type: z.literal("equation"),
  /** LaTeX source, e.g. `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`. */
  latex: z.string().min(1),
  /** true → display (block) math; false → inline math. */
  display: z.boolean().default(true),
});
export type Equation = z.infer<typeof equationSchema>;

export const horizontalRuleSchema = z.object({
  ...blockBase,
  type: z.literal("horizontalRule"),
});
export type HorizontalRule = z.infer<typeof horizontalRuleSchema>;

export const blockSchema = z.discriminatedUnion("type", [
  paragraphSchema,
  headingSchema,
  bulletListSchema,
  tableSchema,
  imageSchema,
  equationSchema,
  pageBreakSchema,
  horizontalRuleSchema,
]);

export type Block = z.infer<typeof blockSchema>;

/* ------------------------------------------------- headers, footers, ... */

export const marginFieldSchema = z.enum([
  "pageNumber",
  "pageCount",
  "title",
  "docNumber",
  "revision",
  "effectiveDate",
]);
export type MarginField = z.infer<typeof marginFieldSchema>;

export const marginPartSchema = z.union([
  z.object({ kind: z.literal("text"), value: z.string() }),
  z.object({ kind: z.literal("field"), field: marginFieldSchema }),
]);
export type MarginPart = z.infer<typeof marginPartSchema>;

export const marginBoxSchema = z.object({
  parts: z.array(marginPartSchema),
});
export type MarginBox = z.infer<typeof marginBoxSchema>;

/* ----------------------------------------------------------- page setup */

export const pageMarginsSchema = z.object({
  top: z.number().min(0).max(100),
  right: z.number().min(0).max(100),
  bottom: z.number().min(0).max(100),
  left: z.number().min(0).max(100),
});
export type PageMargins = z.infer<typeof pageMarginsSchema>;

export const pageSetupSchema = z.object({
  format: z.enum(["A4"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  margins: pageMarginsSchema.default({ top: 20, right: 18, bottom: 20, left: 18 }),
  /** First page number of this section (continuous across sections by default). */
  pageNumberStart: z.number().int().min(1).default(1),
  showPageNumber: z.boolean().default(true),
});
export type PageSetup = z.infer<typeof pageSetupSchema>;

export const sectionSchema = z.object({
  id: nodeIdSchema,
  type: z.literal("section"),
  pageSetup: pageSetupSchema.default({}),
  header: z.union([marginBoxSchema, z.null()]).default(null),
  footer: z.union([marginBoxSchema, z.null()]).default(null),
  blocks: z.array(blockSchema).default([]),
});
export type Section = z.infer<typeof sectionSchema>;

/* ------------------------------------------------------------- document */

export const metadataSchema = z.object({
  title: z.string().default(""),
  docNumber: z.string().default(""),
  revision: z.string().default(""),
  /** ISO date, `YYYY-MM-DD`. */
  effectiveDate: z.string().default(""),
  author: z.string().default(""),
  organization: z.string().default(""),
  description: z.string().default(""),
});
export type Metadata = z.infer<typeof metadataSchema>;

export const watermarkSchema = z.object({
  enabled: z.boolean().default(true),
  text: z.string().default("DRAFT"),
  opacity: z.number().min(0).max(1).default(0.12),
  angle: z.number().min(-90).max(90).default(-45),
  fontSizePt: z.number().positive().default(64),
});
export type Watermark = z.infer<typeof watermarkSchema>;

export const settingsSchema = z.object({
  /**
   * Selected document theme id (presentation only — V1-THEME-004). Stored
   * semantically in the document, not only in UI state, and resolved against
   * the theme registry at layout time. Unknown ids fall back to the default.
   */
  theme: z.string().min(1).default("lab_default"),
  watermark: watermarkSchema.default({}),
});
export type Settings = z.infer<typeof settingsSchema>;

export const documentSchema = z.object({
  id: nodeIdSchema,
  type: z.literal("document"),
  metadata: metadataSchema.default({}),
  settings: settingsSchema.default({}),
  /**
   * Document-level reusable style library (V1-STYLE-001). Defaults to the
   * full built-in set so legacy style-less documents load with a sensible
   * default mapping that persists on next save (ADR-004 additive policy).
   */
  styles: stylesSchema.default(() => buildDefaultStyles()),
  sections: z.array(sectionSchema).min(1),
});
export type Document = z.infer<typeof documentSchema>;

/** Versioned wire format — what serialize/deserialize emit and accept. */
export const envelopeSchema = z.object({
  schema: z.literal("labdoc"),
  schema_version: z.literal("1.0"),
  document: documentSchema,
});
export type Envelope = z.infer<typeof envelopeSchema>;

export const SCHEMA_NAME = "labdoc";
export const SCHEMA_VERSION = "1.0";
