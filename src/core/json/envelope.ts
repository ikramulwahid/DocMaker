/**
 * JSON envelope: versioned, validated, deterministic serialization.
 *
 * Round-trip guarantee: deserialize(serialize(doc)) deep-equals doc, and
 * serialize(deserialize(json)) is byte-stable for equivalent documents
 * (Zod rebuilds objects in schema key order).
 */
import {
  envelopeSchema,
  SCHEMA_NAME,
  SCHEMA_VERSION,
  type Document,
  type Envelope,
} from "../ir/schema";

export class DocFormatError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(issues.length ? `${message}\n- ${issues.join("\n- ")}` : message);
    this.name = "DocFormatError";
    this.issues = issues;
  }
}

function formatIssues(
  issues: { path: (string | number)[]; message: string }[],
): string[] {
  return issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`);
}

/** Validate + serialize a document into the `labdoc` 1.0 envelope. */
export function serializeDocument(doc: Document): string {
  let envelope: Envelope;
  try {
    envelope = envelopeSchema.parse({
      schema: SCHEMA_NAME,
      schema_version: SCHEMA_VERSION,
      document: doc,
    });
  } catch (err) {
    if (err instanceof Error && "issues" in err) {
      const zodError = err as { issues: { path: (string | number)[]; message: string }[] };
      throw new DocFormatError("Document failed validation", formatIssues(zodError.issues));
    }
    throw err;
  }
  return JSON.stringify(envelope, null, 2);
}

/** Parse + validate JSON. Throws DocFormatError with per-field issues. */
export function deserializeDocument(json: string): Document {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new DocFormatError(
      `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const result = envelopeSchema.safeParse(raw);
  if (!result.success) {
    const issues = formatIssues(result.error.issues);
    const rawObject =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const version =
      "schema_version" in rawObject ? String(rawObject.schema_version) : "unknown";
    // A `labdoc` envelope from a different schema_version is never silently
    // mis-parsed: name the version and this build's supported version so the
    // user gets an actionable message (ADR-004).
    const isLabdocVersionMismatch =
      rawObject.schema === SCHEMA_NAME &&
      typeof rawObject.schema_version === "string" &&
      rawObject.schema_version !== SCHEMA_VERSION;
    const message = isLabdocVersionMismatch
      ? `Document schema_version=${version} (${SCHEMA_NAME}) is not supported by this build; this build supports schema_version ${SCHEMA_VERSION} (unreleased development format).`
      : `Unsupported or invalid document (schema_version=${version})`;
    throw new DocFormatError(message, issues);
  }
  return result.data.document;
}

/** Non-throwing variant for UI paths. */
export function tryDeserializeDocument(
  json: string,
): { ok: true; document: Document } | { ok: false; error: string } {
  try {
    return { ok: true, document: deserializeDocument(json) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
