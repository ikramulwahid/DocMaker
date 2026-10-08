/**
 * Sidebar ⇄ margin-box editing helper.
 *
 * Margin boxes are structured (text runs + fields like Page X of Y). The
 * Phase-0 sidebar edits them as a single string with `[field]` tokens, e.g.
 * `"TM-001 — [title] — [page]/[count]"`, so structured parts survive editing.
 */
import type { MarginBox, MarginField, MarginPart } from "@/core";

const FIELDS: MarginField[] = [
  "pageNumber",
  "pageCount",
  "title",
  "docNumber",
  "revision",
  "effectiveDate",
];

const TOKEN_PATTERN = new RegExp(`\\[(${FIELDS.join("|")})\\]`, "g");

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
    parts.push({ kind: "field", field: match[1] as MarginField });
    last = index + match[0].length;
  }
  if (last < value.length) parts.push({ kind: "text", value: value.slice(last) });
  return parts.length ? { parts } : null;
}
