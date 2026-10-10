/**
 * Built-in style library (V1-STYLE-001, V1-TXT-001).
 *
 * Every document's style library starts from these definitions, and the
 * resolver falls back to them for any block whose reference is missing or
 * unknown (deterministic safe fallback — AGENTS.md: no silent data loss).
 *
 * Style ids are STABLE canonical identifiers that never change with display
 * labels (AGENTS.md §11/§12); the object keys and the `id` field are equal.
 *
 * Created fresh on every call: a document must never alias another
 * document's (or the template's) style objects (AGENTS.md §59).
 */
import type { StyleDefinition, StyleFormat, Styles } from "./schema";

/** Built-in style ids, in the canonical library order. */
export const BUILTIN_STYLE_IDS = [
  "normal",
  "body-text",
  "title",
  "subtitle",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "heading-5",
  "heading-6",
  "caption",
  "table-text",
  "quote",
  "note",
  "warning",
  "important-notice",
  "definition",
  "reference",
  "header",
  "footer",
] as const;

export type BuiltinStyleId = (typeof BUILTIN_STYLE_IDS)[number];

export function isBuiltinStyleId(id: string): id is BuiltinStyleId {
  return (BUILTIN_STYLE_IDS as readonly string[]).includes(id);
}

/**
 * Presentation-only defaults. Sizes/bold/alignment are the *presets* for
 * each named style; anything left `null`/`false` stays theme-driven so the
 * document theme keeps control of the base typography (theme separation).
 */
function format(patch: Partial<StyleFormat>): StyleFormat {
  return {
    fontSizePt: null,
    fontFamily: "inherit",
    bold: false,
    italic: false,
    color: null,
    alignment: "inherit",
    lineHeight: null,
    textTransform: "none",
    marginTopMm: null,
    marginBottomMm: null,
    indentMm: null,
    ...patch,
  };
}

function headingStyle(level: number, name: string): StyleDefinition {
  return {
    id: `heading-${level}`,
    name,
    kind: "heading",
    headingLevel: level,
    format: format({}),
  };
}

/** A fresh deep-copyable default for an unknown/absent fallback style. */
export function defaultFallbackStyle(): StyleDefinition {
  return {
    id: "normal",
    name: "Normal",
    kind: "paragraph",
    headingLevel: null,
    format: format({}),
  };
}

/** All built-in styles — a NEW object graph on every call (no shared state). */
export function buildDefaultStyles(): Styles {
  const s: Styles = {};
  s["normal"] = { id: "normal", name: "Normal", kind: "paragraph", headingLevel: null, format: format({}) };
  s["body-text"] = { id: "body-text", name: "Body Text", kind: "paragraph", headingLevel: null, format: format({}) };
  s["title"] = { id: "title", name: "Title", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 22, bold: true, alignment: "center", marginBottomMm: 6 }) };
  s["subtitle"] = { id: "subtitle", name: "Subtitle", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 14, alignment: "center", marginBottomMm: 4 }) };
  s["heading-1"] = headingStyle(1, "Heading 1");
  s["heading-2"] = headingStyle(2, "Heading 2");
  s["heading-3"] = headingStyle(3, "Heading 3");
  s["heading-4"] = headingStyle(4, "Heading 4");
  s["heading-5"] = headingStyle(5, "Heading 5");
  s["heading-6"] = headingStyle(6, "Heading 6");
  s["caption"] = { id: "caption", name: "Caption", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 9, alignment: "center" }) };
  s["table-text"] = { id: "table-text", name: "Table Text", kind: "tableText", headingLevel: null, format: format({ fontSizePt: 9 }) };
  s["quote"] = { id: "quote", name: "Quote", kind: "paragraph", headingLevel: null, format: format({ italic: true, indentMm: 8 }) };
  s["note"] = { id: "note", name: "Note", kind: "paragraph", headingLevel: null, format: format({ italic: true }) };
  s["warning"] = { id: "warning", name: "Warning", kind: "paragraph", headingLevel: null, format: format({ bold: true }) };
  s["important-notice"] = { id: "important-notice", name: "Important Notice", kind: "paragraph", headingLevel: null, format: format({ bold: true, alignment: "center" }) };
  s["definition"] = { id: "definition", name: "Definition", kind: "paragraph", headingLevel: null, format: format({}) };
  s["reference"] = { id: "reference", name: "Reference", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 10.5, italic: true }) };
  s["header"] = { id: "header", name: "Header", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 9 }) };
  s["footer"] = { id: "footer", name: "Footer", kind: "paragraph", headingLevel: null, format: format({ fontSizePt: 9 }) };
  return s;
}