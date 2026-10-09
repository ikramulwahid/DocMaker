/**
 * Untrusted document content allow-lists (AGENTS.md §99–101, Prompt 001 §8).
 *
 * Every value a document can carry that is emitted into generated HTML is
 * treated as UNTRUSTED data: an imported or hand-edited document could smuggle
 * a `javascript:` href, an external image URL, or a CSS injection in a column
 * width. The renderer must never turn such content into a script-execution
 * vector, an external resource request, or extra CSS declarations. Each
 * boundary therefore has a narrow allow-list, enforced here and re-checked at
 * the rendering boundary (defense in depth — the schema and TS types alone
 * cannot be trusted once a document bypasses validation).
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

/* -------------------------------------------------------- embedded images */

/**
 * Documented allow-list of embedded image source types.
 *
 * The app is local-first with no network access (AGENTS.md §16, V1-PLAT-002):
 * images must be embedded data URIs — an external `https`/`http`/`file:` URL
 * would fire a network or filesystem request the moment the preview or PDF
 * rendered it. We therefore accept only `data:image/<type>` URIs for a small
 * set of formats the renderer can actually display:
 *
 *   - Raster: `png`, `jpeg`, `gif`, `webp`, `bmp` — base64 payloads only
 *     (that is exactly what the editor's FileReader produces).
 *   - Vector: `svg+xml` — percent-encoded/raw or base64 payloads. SVG data
 *     URIs were already shipped in the Phase-0 fixtures/goldens before this
 *     policy existed; SVG loaded via an `<img>` element is a **static, inert
 *     image** per the HTML spec (no scripts execute, no external resources are
 *     fetched in the image context), so it does not create an execution or
 *     exfiltration vector.
 *
 * Anything else — other schemes, other image MIME types, malformed payloads —
 * is rejected with an explicit message. Remote image support is deliberately
 * NOT added (out of Phase-0 scope).
 */
export const ALLOWED_IMAGE_TYPES = new Set([
  "png",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg+xml",
]);

/**
 * Maximum image source length (characters of the data URI as stored in JSON).
 * 10 MiB of data-URI text ≈ 7.5 MiB of binary for a base64 payload, which is
 * comfortably larger than a realistic laboratory photo/diagram while bounding
 * how much text the schema parse, the preview `srcdoc` and the PDF pipeline
 * must copy repeatedly. Oversized payloads are rejected, not truncated.
 */
export const IMAGE_SRC_MAX_CHARS = 10 * 1024 * 1024;

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

/**
 * Standard (RFC 4648) base64 syntax validation.
 *
 * A character-class check alone accepts impossible payloads such as `"A"` or
 * `"AA"` (a length that cannot encode a whole number of bytes). We therefore
 * enforce the full base64 syntax:
 *
 *   - at least one alphabetic data character, standard alphabet, then at most
 *     two trailing `=` padding characters (padding appears only at the end);
 *   - total length is a multiple of 4 (4 chars → 3 bytes, `xxx=` → 2 bytes,
 *     `xx==` → 1 byte).
 *   - canonical padding: when padding is present, the unused low bits of the
 *     final data character are zero — every standard encoder emits this, and
 *     while lenient decoders silently ignore stray bits, such strings are
 *     malformed and are rejected here.
 *
 * This validates base64 SYNTAX only. It does NOT verify that the decoded
 * bytes form a decodable image — image-format validation is a separate
 * concern (the app displays what the browser can decode; the tests treat
 * grammar and decodability as distinct, per docs/limitations.md).
 */
function base64Index(ch: string): number | undefined {
  const c = ch.charCodeAt(0);
  if (c >= 65 && c <= 90) return c - 65; // A-Z
  if (c >= 97 && c <= 122) return c - 97 + 26; // a-z
  if (c >= 48 && c <= 57) return c - 48 + 52; // 0-9
  if (c === 43) return 62; // '+'
  if (c === 47) return 63; // '/'
  return undefined;
}

/** True when `payload` is syntactically valid, canonical base64. */
export function isCanonicalBase64(payload: string): boolean {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return false;
  if (payload.length % 4 !== 0) return false;
  const padStart = payload.indexOf("=");
  if (padStart === -1) return true; // no padding — 3 bytes per 4 chars
  const padCount = payload.length - padStart;
  if (padCount === 0 || padCount > 2) return false; // regex already makes this unreachable; kept for intent
  const lastData = payload[padStart - 1];
  const value = base64Index(lastData);
  if (value === undefined) return false;
  return padCount === 1 ? (value & 0b11) === 0 : (value & 0b1111) === 0;
}

/**
 * Why an image `src` is rejected, or `null` when it may be rendered.
 * `sanitizeImageSrc()` is the boolean form; the schema and the renderer use
 * the reason so failures are actionable (AGENTS.md §33).
 */
export function imageSrcProblem(src: string): string | null {
  if (typeof src !== "string" || src.length === 0) {
    return "image src must not be empty";
  }
  if (src.length > IMAGE_SRC_MAX_CHARS) {
    return `image src exceeds the ${IMAGE_SRC_MAX_CHARS}-character maximum`;
  }
  // Control characters (incl. newlines) could smuggle a scheme or an extra
  // attribute past a looser check.
  if (CONTROL_CHARS_RE.test(src)) {
    return "image src contains control characters";
  }
  if (!/^data:image\//i.test(src)) {
    return "image src must be an embedded data:image/ URI — external URLs (http, https, file, javascript, …) and non-image data URIs are not allowed (local-first app)";
  }
  const afterPrefix = src.slice("data:image/".length);
  const type = afterPrefix.split(/[;,]/)[0].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    return `unsupported image type image/${type}; allowed: ${Array.from(ALLOWED_IMAGE_TYPES).join(", ")}`;
  }
  const remainder = afterPrefix.slice(type.length);
  const sep = remainder.indexOf(",");
  if (sep < 0) return "malformed data URI: missing payload separator";
  const params = remainder.slice(0, sep);
  const payload = remainder.slice(sep + 1);
  if (payload.length === 0) return "malformed data URI: empty payload";
  if (params === ";base64") {
    if (!isCanonicalBase64(payload)) {
      return "malformed base64 payload: invalid characters or length (expected standard base64 — alphabetic data chars only, length multiple of 4, canonical `=` padding)";
    }
  } else if (type !== "svg+xml") {
    return "raster image data URIs must use base64 encoding (;base64,)";
  }
  return null;
}

/** Returns `src` when it is safe to render, otherwise `null`. */
export function sanitizeImageSrc(src: string): string | null {
  return imageSrcProblem(src) === null ? src : null;
}

/* --------------------------------------------------------- column widths */

/**
 * Documented column-width syntax.
 *
 * Widths are emitted into a `col style="width:…"` attribute, so an arbitrary
 * string could inject extra CSS declarations
 * (`width:33%;background:url(https://evil)`) or close the attribute. The only
 * forms accepted are:
 *
 *   - `""` (empty) — auto width (produced by the editor for columns the user
 *     never resized; rendered by skipping the `<col>`);
 *   - a non-negative number with one approved unit — `px`, `mm`, `cm`, `pt`
 *     or `%` (e.g. `"120px"`, `"1.5cm"`, `"33.3%"`).
 *
 * The match is a full-string allow-list: separators, `url(…)`, `expression(…)`,
 * braces, `!important`, extra properties, negative/unitless/unknown-unit
 * values and control characters are all rejected. When ANY width in a table is
 * invalid, the renderer drops the whole fixed-layout `colgroup` (safe
 * fallback: browsers auto-layout the table) rather than emitting partial
 * styling.
 */
const COLUMN_WIDTH_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|mm|cm|pt|%)$/;

/** Why a column width is rejected, or `null` when it is acceptable. */
export function columnWidthProblem(value: string): string | null {
  if (typeof value !== "string") return "width must be a string";
  if (CONTROL_CHARS_RE.test(value)) return "width contains control characters";
  const trimmed = value.trim();
  if (trimmed === "") return null; // auto (no width) — legitimately produced by the editor
  if (!COLUMN_WIDTH_RE.test(trimmed)) {
    return `invalid column width "${value}": expected empty (auto) or a non-negative number with unit px, mm, cm, pt or % (e.g. "120px", "33.3%")`;
  }
  return null;
}

/** True when the width may be emitted as a CSS width value. */
export function isValidColumnWidth(value: string): boolean {
  return columnWidthProblem(value) === null;
}