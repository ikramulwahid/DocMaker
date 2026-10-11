/**
 * Application state. The Document IR in this store is the single source of
 * truth (AGENTS.md): the editor writes to it through the adapter, the preview
 * and PDF paths read from it through resolve → layout. Nothing else persists
 * document data.
 */
import { create } from "zustand";
import {
  createEmptyDocument,
  createHeading,
  createList,
  createListItem,
  createParagraph,
  createSection,
  createTable,
  resolveDocument,
  text,
  newStyleId,
  isBuiltinStyleId,
  type Block,
  type Document,
  type MarginBox,
  type Metadata,
  type PageSetup,
  type Section,
  type StyleDefinition,
  type StyleFormat,
  type Watermark,
} from "@/core";
import { pageSetupSchema, styleFormatSchema } from "@/core/ir/schema";
import { normalizeLegacyLists } from "@/core/ir/normalize";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "@/editor/adapter";
import { parseMarginText } from "@/app/marginText";
import {
  applyNewDocumentDefaults,
  loadPreferences,
  resetStoredPreferences,
  safeThemeId,
  savePreferences,
  type MetadataDefaults,
  type NewDocumentDefaults,
} from "@/app/preferences";

/** A style edit: rename and/or patch presentation tokens. */
export type StyleDefinitionPatch = Partial<Pick<StyleDefinition, "name">> &
  Partial<StyleFormat>;

export interface DocState {
  document: Document;
  fileName: string;
  dirty: boolean;
  /** Bumped when the whole document is replaced (new/open): editors reload. */
  revision: number;
  activeSection: number;
  status: string;
  /**
   * New-document defaults (local preferences — NOT document content). Changing
   * these never mutates the open document; they only seed `newDocument()`.
   */
  preferences: NewDocumentDefaults;

  setStatus(status: string): void;
  setDocument(document: Document, fileName: string): void;
  newDocument(): void;
  markSaved(fileName?: string): void;
  setActiveSection(index: number): void;
  setSectionBlocks(index: number, blocks: Block[]): void;
  setMetadata(patch: Partial<Metadata>): void;
  setTheme(theme: string): void;
  setWatermark(patch: Partial<Watermark>): void;
  setPageSetup(index: number, patch: Partial<Section["pageSetup"]>): void;
  setHeaderText(index: number, tokenText: string): void;
  addSection(): void;
  removeSection(index: number): void;
  /** Update a style definition (name and/or format tokens). */
  setStyleDefinition(id: string, patch: StyleDefinitionPatch): void;
  /** Create a new custom style copied from "normal". Returns its id. */
  addCustomStyle(): string;
  /** Remove a custom style; built-in styles cannot be removed. */
  removeCustomStyle(id: string): void;
  /** Edit the new-document page-setup defaults (validated, persisted). */
  setDefaultPageSetup(patch: Partial<PageSetup>): void;
  /** Edit the new-document default theme (unknown ids fall back safely). */
  setDefaultTheme(theme: string): void;
  /** Edit the new-document metadata skeleton (existing fields only). */
  setDefaultMetadata(patch: Partial<MetadataDefaults>): void;
  /** Restore the built-in new-document defaults (and clear storage). */
  resetPreferences(): void;
}

/** Starter document shown on first launch — exercises the Phase-0 pipeline. */
export function createStarterDocument(): Document {
  const doc = createEmptyDocument("Sample laboratory document");
  doc.metadata = {
    title: "Sample laboratory document",
    docNumber: "DOC-001",
    revision: "01",
    effectiveDate: new Date().toISOString().slice(0, 10),
    author: "",
    organization: "",
    description: "",
  };
  const section = createSection([
    createHeading(1, [text("Purpose")]),
    createParagraph([
      text("Edit this document on the left; the middle pane is a Tiptap view "),
      text("mapped through an explicit adapter", [{ type: "bold" }]),
      text(", and the right pane is the paginated A4 preview."),
    ]),
    createHeading(2, [text("Scope")]),
    createList({
      items: [
        createListItem([text("Live preview shares one pipeline with PDF export")]),
        createListItem([text("Headers, footers, and Page X of Y are derived")]),
      ],
    }),
    createTable(
      [
        ["Check", "Result"],
        ["Retention time", "4.2 min"],
        ["Resolution", "Pass"],
      ],
      { caption: "Typical results" },
    ),
  ]);
  section.header = parseMarginText("[docNumber] · [title]");
  doc.sections = [section];
  return doc;
}

/** Clone-through-mutate: keeps updates predictable and immer-free. */
function mutate(document: Document, fn: (draft: Document) => void): Document {
  const draft = structuredClone(document);
  fn(draft);
  return draft;
}

export const useDocStore = create<DocState>((set) => ({
  document: createStarterDocument(),
  fileName: "untitled.labdoc.json",
  dirty: false,
  revision: 0,
  activeSection: 0,
  status: "Ready",
  preferences: loadPreferences(),

  setStatus: (status) => set({ status }),

  setDocument: (document, fileName) =>
    set((state) => ({
      // Opening an old document upgrades any legacy flat `bulletList` to the
      // canonical recursive `list` in memory, so "open then save" converges on
      // the canonical shape with no text edit (lossless; M3).
      document: normalizeLegacyLists(document),
      fileName,
      dirty: false,
      revision: state.revision + 1,
      activeSection: 0,
      status: `Opened ${fileName}`,
    })),

  newDocument: () =>
    set((state) => {
      const document = createEmptyDocument("Untitled document");
      // Apply a validated snapshot of the configured new-document defaults.
      applyNewDocumentDefaults(document, state.preferences);
      return {
        document,
        fileName: "untitled.labdoc.json",
        dirty: false,
        revision: state.revision + 1,
        activeSection: 0,
        status: "New document",
      };
    }),

  markSaved: (fileName) =>
    set((state) => ({
      dirty: false,
      fileName: fileName ?? state.fileName,
      status: `Saved ${fileName ?? state.fileName}`,
    })),

  setActiveSection: (index) =>
    set((state) =>
      index >= 0 && index < state.document.sections.length && index !== state.activeSection
        ? { activeSection: index }
        : state,
    ),

  setSectionBlocks: (index, blocks) =>
    set((state) => ({
      document: mutate(state.document, (doc) => {
        if (doc.sections[index]) doc.sections[index].blocks = blocks;
      }),
      dirty: true,
      status: "Edited",
    })),

  setMetadata: (patch) =>
    set((state) => ({
      document: mutate(state.document, (doc) => Object.assign(doc.metadata, patch)),
      dirty: true,
    })),

  setTheme: (theme) =>
    set((state) => ({
      // Theme is presentation only: it must not touch content/ids/numbering.
      document: mutate(state.document, (doc) => {
        doc.settings.theme = theme;
      }),
      dirty: true,
      status: `Theme: ${theme}`,
    })),

  setWatermark: (patch) =>
    set((state) => ({
      document: mutate(state.document, (doc) =>
        Object.assign(doc.settings.watermark, patch),
      ),
      dirty: true,
    })),

  setPageSetup: (index, patch) =>
    set((state) => {
      const section = state.document.sections[index];
      if (!section) return { status: "No such section" };
      // Validate the merged setup before it enters the IR: the schema rejects
      // it on save anyway; failing here keeps invalid geometry out of the
      // renderer and gives an actionable message (AGENTS.md §31/§33).
      const parsed = pageSetupSchema.safeParse({ ...section.pageSetup, ...patch });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const where = issue?.path.join(".") || "page setup";
        return {
          status: `Page setup rejected — ${where}: ${issue?.message ?? "invalid value"}`,
        };
      }
      return {
        document: mutate(state.document, (doc) => {
          if (doc.sections[index]) doc.sections[index].pageSetup = parsed.data;
        }),
        dirty: true,
        status: "Page setup updated",
      };
    }),

  setDefaultPageSetup: (patch) =>
    set((state) => {
      const parsed = pageSetupSchema.safeParse({
        ...state.preferences.pageSetup,
        ...patch,
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const where = issue?.path.join(".") || "page setup";
        return {
          status: `Default page setup rejected — ${where}: ${issue?.message ?? "invalid value"}`,
        };
      }
      const preferences = { ...state.preferences, pageSetup: parsed.data };
      savePreferences(preferences);
      return { preferences, status: "New-document defaults updated" };
    }),

  setDefaultTheme: (theme) =>
    set((state) => {
      const preferences = { ...state.preferences, theme: safeThemeId(theme) };
      savePreferences(preferences);
      return { preferences, status: "New-document defaults updated" };
    }),

  setDefaultMetadata: (patch) =>
    set((state) => {
      const preferences = {
        ...state.preferences,
        metadata: { ...state.preferences.metadata, ...patch },
      };
      savePreferences(preferences);
      return { preferences, status: "New-document defaults updated" };
    }),

  resetPreferences: () =>
    set(() => ({
      preferences: resetStoredPreferences(),
      status: "New-document defaults reset",
    })),

  setHeaderText: (index, tokenText) =>
    set((state) => ({
      document: mutate(state.document, (doc) => {
        const section = doc.sections[index];
        if (section) section.header = parseMarginText(tokenText);
      }),
      dirty: true,
    })),

  addSection: () =>
    set((state) => ({
      document: mutate(state.document, (doc) => {
        doc.sections.push(createSection([createParagraph()]));
      }),
      activeSection: state.document.sections.length,
      dirty: true,
      status: "Section added",
    })),

  removeSection: (index) =>
    set((state) => {
      if (state.document.sections.length <= 1) {
        return { status: "A document needs at least one section" };
      }
      return {
        document: mutate(state.document, (doc) => {
          doc.sections.splice(index, 1);
        }),
        activeSection: Math.max(0, Math.min(state.activeSection, state.document.sections.length - 2)),
        dirty: true,
        status: "Section removed",
      };
    }),

  // A style edit changes ONLY the definition (presentation). All blocks that
  // reference the style re-render through the shared pipeline (V1-STYLE-003);
  // content, ids, metadata and numbering are untouched by construction.
  setStyleDefinition: (id, patch) =>
    set((state) => {
      const def: StyleDefinition | undefined = Object.prototype.hasOwnProperty.call(
        state.document.styles,
        id,
      )
        ? state.document.styles[id]
        : undefined;
      if (!def) return { status: `Unknown style "${id}"` };
      const { name: _name, ...formatPatch } = patch;
      // Validate the merged format before it enters the IR (the schema would
      // reject it on save anyway; failing here gives an actionable message).
      const mergedFormat = { ...def.format, ...formatPatch };
      const parsed = styleFormatSchema.safeParse(mergedFormat);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const where = issue?.path.join(".") || "format";
        return { status: `Style update rejected — ${where}: ${issue?.message ?? "invalid value"}` };
      }
      return {
        document: mutate(state.document, (doc) => {
          const target = doc.styles[id];
          if (!target) return;
          if (patch.name !== undefined && patch.name.trim() !== "") {
            target.name = patch.name.trim();
          }
          target.format = parsed.data;
        }),
        dirty: true,
        status: `Style updated`,
      };
    }),

  addCustomStyle: () => {
    // Cannot build the new style inside `set` if we need to return its id:
    // compute deterministically first, then set state.
    const state = useDocStore.getState();
    const id = newStyleId();
    const base = state.document.styles["normal"];
    const source: StyleDefinition = base ?? { id: "normal", name: "Normal", kind: "paragraph", headingLevel: null, format: {} };
    const custom: StyleDefinition = {
      id,
      name: "Custom style",
      kind: "paragraph",
      headingLevel: null,
      format: { ...source.format },
    };
    useDocStore.setState({
      document: mutate(state.document, (doc) => {
        doc.styles[id] = custom;
      }),
      dirty: true,
      status: `Custom style added`,
    });
    return id;
  },

  removeCustomStyle: (id) =>
    set((state) => {
      if (
        isBuiltinStyleId(id) ||
        !Object.prototype.hasOwnProperty.call(state.document.styles, id)
      ) {
        return { status: `Style "${id}" cannot be removed` };
      }
      return {
        document: mutate(state.document, (doc) => {
          delete doc.styles[id];
        }),
        dirty: true,
        status: `Style removed`,
      };
    }),
}));

/** Validate + derive numbering for the current document (never throws). */
export function tryResolve(document: Document) {
  try {
    return { ok: true as const, resolved: resolveDocument(document) };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export { blocksToTiptapDoc, tiptapDocToBlocks };
export type { MarginBox };
