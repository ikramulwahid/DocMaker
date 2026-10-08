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
});
export type Paragraph = z.infer<typeof paragraphSchema>;

export const headingSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  level: z.number().int().min(1).max(6),
  content: z.array(inlineSchema).default([]),
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
  /** Relative column widths (any unit; normalised by layout). */
  columnWidths: z.array(z.string()).default([]),
  rows: z.array(tableRowSchema).min(1),
});
export type Table = z.infer<typeof tableSchema>;

export const imageSchema = z.object({
  ...blockBase,
  type: z.literal("image"),
  /** Data URI (base64) — local-first, no external fetches. */
  src: z.string().min(1),
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
  watermark: watermarkSchema.default({}),
});
export type Settings = z.infer<typeof settingsSchema>;

export const documentSchema = z.object({
  id: nodeIdSchema,
  type: z.literal("document"),
  metadata: metadataSchema.default({}),
  settings: settingsSchema.default({}),
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
