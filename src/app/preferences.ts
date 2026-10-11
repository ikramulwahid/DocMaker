/**
 * New-document defaults (M4, plan D11 / §4.2).
 *
 * Local, application-level preferences that SEED a newly created document:
 * page setup, default theme and a metadata skeleton. They are deliberately
 * separate from any open/saved document:
 *
 *  - changing a default never touches the current document;
 *  - opening a file loads that file's own settings untouched;
 *  - creating a new document applies a validated snapshot of the defaults;
 *  - invalid/corrupt stored preferences fall back to built-in defaults and
 *    never block startup (AGENTS.md §33/§46).
 *
 * Storage is `localStorage` only (single-user, no backend/login/cloud). The
 * snapshot is versioned so a future change can migrate rather than guess.
 * The module is pure except for the injected/available storage handle, so the
 * persistence contract is unit-testable without a DOM.
 */
import { z } from "zod";
import { DEFAULT_THEME_ID, listThemes } from "@/core/theme";
import {
  pageSetupSchema,
  type Document,
  type Metadata,
  type PageSetup,
} from "@/core/ir/schema";

/** Minimal `Storage` surface (so tests can inject an in-memory double). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const PREFERENCES_STORAGE_KEY = "docmaker.new-document-defaults.v1";

/** Metadata skeleton fields seedable from preferences (existing model only). */
export interface MetadataDefaults {
  docNumber: string;
  revision: string;
  author: string;
  organization: string;
  description: string;
}

export interface NewDocumentDefaults {
  pageSetup: PageSetup;
  theme: string;
  metadata: MetadataDefaults;
}

/** Persisted envelope — versioned so a future shape can be migrated. */
const storedPreferencesSchema = z.object({
  version: z.literal(1),
  defaults: z.object({
    pageSetup: pageSetupSchema,
    theme: z.string().min(1).max(120),
    metadata: z.object({
      docNumber: z.string(),
      revision: z.string(),
      author: z.string(),
      organization: z.string(),
      description: z.string(),
    }),
  }),
});

/** The built-in defaults: exactly the Phase-0 new-document behavior. */
export function defaultPreferences(): NewDocumentDefaults {
  return {
    pageSetup: pageSetupSchema.parse({}),
    theme: DEFAULT_THEME_ID,
    metadata: {
      docNumber: "",
      revision: "",
      author: "",
      organization: "",
      description: "",
    },
  };
}

/** A currently available theme id, or the default when unknown/absent. */
export function safeThemeId(id: unknown): string {
  return typeof id === "string" && listThemes().some((t) => t.id === id)
    ? id
    : DEFAULT_THEME_ID;
}

/** Coerce unknown parsed data into a fully valid snapshot (never throws). */
export function normalizePreferences(value: unknown): NewDocumentDefaults {
  const parsed = storedPreferencesSchema.safeParse(value);
  if (!parsed.success) return defaultPreferences();
  return {
    pageSetup: parsed.data.defaults.pageSetup,
    theme: safeThemeId(parsed.data.defaults.theme),
    metadata: parsed.data.defaults.metadata,
  };
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage) return storage;
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    // Accessing localStorage can throw in hardened/private contexts.
    return null;
  }
}

/** Load stored defaults, falling back safely on missing/corrupt data. */
export function loadPreferences(storage?: StorageLike | null): NewDocumentDefaults {
  const store = resolveStorage(storage);
  if (!store) return defaultPreferences();
  let raw: string | null = null;
  try {
    raw = store.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return defaultPreferences();
  }
  if (!raw) return defaultPreferences();
  try {
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return defaultPreferences();
  }
}

/** Persist a snapshot. Storage failures are swallowed (best-effort local). */
export function savePreferences(
  defaults: NewDocumentDefaults,
  storage?: StorageLike | null,
): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: 1, defaults: normalizePreferences({ version: 1, defaults }) }),
    );
  } catch {
    // Quota/security errors must not break editing.
  }
}

/** Remove stored defaults; returns the built-in defaults. */
export function resetStoredPreferences(storage?: StorageLike | null): NewDocumentDefaults {
  const store = resolveStorage(storage);
  if (store) {
    try {
      store.removeItem(PREFERENCES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return defaultPreferences();
}

/**
 * Apply a validated snapshot to a freshly created document IN PLACE.
 * Metadata skeleton fields already present in the document (e.g. a title) are
 * preserved unless the defaults specify them.
 */
export function applyNewDocumentDefaults(doc: Document, defaults: NewDocumentDefaults): void {
  const page = pageSetupSchema.safeParse(defaults.pageSetup);
  if (page.success && doc.sections[0]) doc.sections[0].pageSetup = page.data;
  doc.settings.theme = safeThemeId(defaults.theme);
  const skeleton: Partial<Metadata> = {
    docNumber: defaults.metadata.docNumber,
    revision: defaults.metadata.revision,
    author: defaults.metadata.author,
    organization: defaults.metadata.organization,
    description: defaults.metadata.description,
  };
  Object.assign(doc.metadata, skeleton);
}
