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
  createParagraph,
  createSection,
  createTable,
  resolveDocument,
  text,
  type Block,
  type Document,
  type MarginBox,
  type Metadata,
  type Section,
  type Watermark,
} from "@/core";
import { blocksToTiptapDoc, tiptapDocToBlocks } from "@/editor/adapter";
import { parseMarginText } from "@/app/marginText";

export interface DocState {
  document: Document;
  fileName: string;
  dirty: boolean;
  /** Bumped when the whole document is replaced (new/open): editors reload. */
  revision: number;
  activeSection: number;
  status: string;

  setStatus(status: string): void;
  setDocument(document: Document, fileName: string): void;
  newDocument(): void;
  markSaved(fileName?: string): void;
  setActiveSection(index: number): void;
  setSectionBlocks(index: number, blocks: Block[]): void;
  setMetadata(patch: Partial<Metadata>): void;
  setWatermark(patch: Partial<Watermark>): void;
  setPageSetup(index: number, patch: Partial<Section["pageSetup"]>): void;
  setHeaderText(index: number, tokenText: string): void;
  addSection(): void;
  removeSection(index: number): void;
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
    {
      id: "bl_starter01",
      type: "bulletList",
      items: [
        createParagraph([text("Live preview shares one pipeline with PDF export")]),
        createParagraph([text("Headers, footers, and Page X of Y are derived")]),
      ],
    },
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

  setStatus: (status) => set({ status }),

  setDocument: (document, fileName) =>
    set((state) => ({
      document,
      fileName,
      dirty: false,
      revision: state.revision + 1,
      activeSection: 0,
      status: `Opened ${fileName}`,
    })),

  newDocument: () =>
    set((state) => ({
      document: createEmptyDocument("Untitled document"),
      fileName: "untitled.labdoc.json",
      dirty: false,
      revision: state.revision + 1,
      activeSection: 0,
      status: "New document",
    })),

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

  setWatermark: (patch) =>
    set((state) => ({
      document: mutate(state.document, (doc) =>
        Object.assign(doc.settings.watermark, patch),
      ),
      dirty: true,
    })),

  setPageSetup: (index, patch) =>
    set((state) => ({
      document: mutate(state.document, (doc) => {
        if (doc.sections[index]) Object.assign(doc.sections[index].pageSetup, patch);
      }),
      dirty: true,
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
