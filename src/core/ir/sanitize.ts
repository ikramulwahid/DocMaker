/**
 * Link safety (AGENTS.md §99–100, Prompt 001 §8).
 *
 * Document-provided link hrefs are UNTRUSTED data: an imported/hand-edited
 * document could carry `javascript:` or `data:` URLs. The renderer must never
 * turn a link into a script-execution vector, so every href is passed through
 * this allow-list before it reaches generated HTML.
 */

/** Schemes we consider safe to emit as a document link. */
const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

/**
 * Returns the href if it is safe to emit, otherwise `null` (caller should
 * render the link text without an anchor). Relative URLs and `#anchors` are
 * allowed; every other scheme is rejected.
 */
export function sanitizeHref(href: string): string | null {
  // Strip control characters (incl. newlines/tabs) so `java\tscript:` cannot
  // smuggle a scheme past the check.
  const trimmed = href.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (trimmed === "") return null;

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
  if (!scheme) return trimmed; // relative URL / fragment — safe
  return SAFE_SCHEMES.has(scheme[1].toLowerCase()) ? trimmed : null;
}

/** True when the href may be rendered as an anchor. */
export function isSafeHref(href: string): boolean {
  return sanitizeHref(href) !== null;
}
