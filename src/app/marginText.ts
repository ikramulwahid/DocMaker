/**
 * Sidebar ⇄ margin-box editing helper.
 *
 * Margin boxes are structured (text runs + fields like Page X of Y). The
 * sidebar edits them as a single string with `[field]` tokens, e.g.
 * `"TM-001 — [title] — [pageNumber]/[pageCount]"`, so structured parts survive
 * editing.
 *
 * M5 (V1-HF-003): additional metadata fields are authorable, and the legacy
 * shorthand aliases `[page]` / `[count]` are accepted on PARSE and normalized
 * to the canonical `pageNumber` / `pageCount` tokens on serialization, so the
 * stored margin model stays stable.
 */
import { MARGIN_FIELDS, MARGIN_TOKEN_ALIASES, type MarginBox, type MarginField, type MarginPart } from "@/core";

const TOKEN_KEYS = [...MARGIN_FIELDS, ...Object.keys(MARGIN_TOKEN_ALIASES)];
const TOKEN_PATTERN = new RegExp(`\\[(${TOKEN_KEYS.join("|")})\\]`, "g");

function normalizeField(token: string): MarginField {
  const alias = MARGIN_TOKEN_ALIASES[token];
  return (alias ?? token) as MarginField;
}

/** MarginBox → token string (null/empty box → ""). */
export function serializeMarginText(box: MarginBox | null): string {
  if (!box) return "";
  return box.parts
    .map((part) => (part.kind === "text" ? part.value : `[${part.field}]`))
    .join("");
}

/** Token string → MarginBox; "" → null (no margin box). */
export function parseMarginText(value: string): MarginBox | null {
  if (value === "") return null;
  const parts: MarginPart[] = [];
  let last = 0;
  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: "text", value: value.slice(last, index) });
    parts.push({ kind: "field", field: normalizeField(match[1]) });
    last = index + match[0].length;
  }
  if (last < value.length) parts.push({ kind: "text", value: value.slice(last) });
  return parts.length ? { parts } : null;
}
